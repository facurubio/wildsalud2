"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type postgres from "postgres";
import {
  accion,
  auditar,
  campo,
  claveDeSolicitud,
  ejecutarUnaVez,
  ErrorDeNegocio,
  esUuid,
  requerirUsuario,
  type ResultadoAccion,
} from "@/lib/operacion";
import { obtenerPlan, tiposDelCatalogo } from "@/lib/planes/consultas";
import {
  mismasCondiciones,
  validarPlan,
  type FilaPrestacionFormulario,
  type PlanValidado,
} from "@/lib/planes/validacion";
import { fechaHoy } from "@/lib/tiempo";

function leerFormulario(formData: FormData) {
  let prestaciones: FilaPrestacionFormulario[] = [];
  try {
    const crudo = JSON.parse(campo(formData, "prestaciones") || "[]");
    if (Array.isArray(crudo)) prestaciones = crudo;
  } catch {
    // Se valida abajo como un plan sin prestaciones.
  }
  return { nombre: campo(formData, "nombre"), precio: campo(formData, "precio"), prestaciones };
}

async function validar(tx: postgres.TransactionSql, formData: FormData): Promise<PlanValidado> {
  const tipos = await tiposDelCatalogo(tx);
  const resultado = validarPlan(leerFormulario(formData), new Map(tipos.map((t) => [t.id, t.nombre])));
  if (!resultado.plan) throw new ErrorDeNegocio(resultado.error);
  return resultado.plan;
}

// EX-02: nombre único entre los planes no eliminados, sin distinguir mayúsculas ni acentos (D126).
async function verificarNombreLibre(tx: postgres.TransactionSql, nombre: string, salvoPlanId: string | null) {
  const [otro] = await tx`
    select 1 from public.plan
    where estado <> 'eliminado' and public.normalizar(nombre) = public.normalizar(${nombre})
      and id is distinct from ${salvoPlanId}
  `;
  if (otro) throw new ErrorDeNegocio(`Ya existe un plan llamado ${nombre}.`);
}

async function crearVersion(tx: postgres.TransactionSql, planId: string, plan: PlanValidado, usuarioId: string) {
  const [version] = await tx<{ id: string }[]>`
    insert into public.plan_version (plan_id, precio, vigente_desde, estado, creada_por)
    values (${planId}, ${plan.precio}, ${fechaHoy()}, 'vigente', ${usuarioId})
    returning id
  `;
  for (const p of plan.prestaciones) {
    await tx`
      insert into public.plan_prestacion (plan_version_id, tipo_prestacion_id, limite, periodicidad, periodos_para_habilitar)
      values (${version.id}, ${p.tipoPrestacionId}, ${p.limite}, ${p.periodicidad}, ${p.periodosParaHabilitar})
    `;
  }
  return version.id;
}

// CU-16 Crear plan: activo, con su primera versión vigente desde la creación (RN-05).
export async function crearPlan(_anterior: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  let planId: string | null = null;
  const resultado = await accion(async () => {
    const usuario = await requerirUsuario("administrador"); // EX-07
    // EX-08: la misma confirmación dos veces crea un solo plan.
    const creado = await ejecutarUnaVez(
      { clave: claveDeSolicitud(formData), usuarioId: usuario.id, operacion: "crear_plan" },
      async (tx) => {
        const plan = await validar(tx, formData);
        await verificarNombreLibre(tx, plan.nombre, null);
        const [nuevo] = await tx<{ id: string }[]>`
          insert into public.plan (nombre, creado_por) values (${plan.nombre}, ${usuario.id}) returning id
        `;
        await crearVersion(tx, nuevo.id, plan, usuario.id);
        await auditar(tx, { usuarioId: usuario.id, accion: "alta", entidad: "plan", entidadId: nuevo.id, detalle: plan });
        return { id: nuevo.id, nombre: plan.nombre };
      },
    );
    planId = creado.id;
    return `Se creó el plan ${creado.nombre}.`;
  });

  if (resultado?.ok && planId) {
    revalidatePath("/planes");
    redirect(`/planes/${planId}?aviso=creado`);
  }
  return resultado;
}

// Edición de la v1: solo mientras ninguna mascota tuvo el plan asignado (docs/alcance-v1.md).
// Como nadie lo usó, las condiciones nuevas reemplazan a las anteriores desde hoy: la versión anterior
// queda descartada (no se borra) y la nueva queda vigente. El nombre cambia sin versión nueva (D128).
export async function editarPlan(
  planIdFormulario: string,
  _anterior: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  let planId: string | null = null;
  const resultado = await accion(async () => {
    const usuario = await requerirUsuario("administrador");
    if (!esUuid(planIdFormulario)) throw new ErrorDeNegocio("El plan ya no está disponible.");

    await ejecutarUnaVez(
      { clave: claveDeSolicitud(formData), usuarioId: usuario.id, operacion: "editar_plan" },
      async (tx) => {
        // Bloquea el plan para que no se asigne mientras se edita.
        const [bloqueado] = await tx`select id from public.plan where id = ${planIdFormulario} for update`;
        const actual = bloqueado ? await obtenerPlan(planIdFormulario, tx) : null;
        if (!actual) throw new ErrorDeNegocio("El plan ya no está disponible.");
        if (actual.enUso) {
          throw new ErrorDeNegocio(
            `${actual.nombre} ya tiene mascotas asignadas: por ahora no se puede editar. Si necesitás otras condiciones, creá un plan nuevo.`,
          );
        }

        const plan = await validar(tx, formData);
        await verificarNombreLibre(tx, plan.nombre, actual.id);

        const anterior = { nombre: actual.nombre, precio: actual.precio, prestaciones: actual.prestaciones };
        if (plan.nombre !== actual.nombre) {
          await tx`update public.plan set nombre = ${plan.nombre} where id = ${actual.id}`;
        }
        if (!mismasCondiciones(plan, actual)) {
          await tx`update public.plan_version set estado = 'descartada' where id = ${actual.versionId}`;
          await crearVersion(tx, actual.id, plan, usuario.id);
        }
        await auditar(tx, {
          usuarioId: usuario.id,
          accion: "edicion",
          entidad: "plan",
          entidadId: actual.id,
          detalle: { anterior, nuevo: plan },
        });
        return { id: actual.id };
      },
    );
    planId = planIdFormulario;
    return "Se guardaron los cambios del plan.";
  });

  if (resultado?.ok && planId) {
    revalidatePath("/planes");
    redirect(`/planes/${planId}?aviso=editado`);
  }
  return resultado;
}
