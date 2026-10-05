"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validarConsumo } from "@/lib/atencion/reglas";
import { periodoDeConsumo, versionVigente } from "@/lib/cobertura/calculo";
import { coberturaVigente, resumenCobertura, versionesDelPlan } from "@/lib/cobertura/consultas";
import { db } from "@/lib/db";
import { obtenerMascota } from "@/lib/mascotas/consultas";
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
import { ahora, fechaHoy } from "@/lib/tiempo";

// CU-39 Registrar consumo. Lo registra un veterinario, o el administrador que también es veterinario (D145).
export async function registrarConsumo(mascotaId: string, _anterior: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  let registrado: string | null = null;
  const resultado = await accion(async () => {
    const usuario = await requerirUsuario("veterinario"); // EX-08 y RN-08
    if (!esUuid(mascotaId)) throw new ErrorDeNegocio("La mascota ya no está disponible.");
    const tipoPrestacionId = campo(formData, "tipoPrestacionId");
    if (!esUuid(tipoPrestacionId)) throw new ErrorDeNegocio("Elegí una prestación disponible.");

    // EX-06: la misma confirmación dos veces registra un solo consumo.
    const tipo = await ejecutarUnaVez(
      { clave: claveDeSolicitud(formData), usuarioId: usuario.id, operacion: "registrar_consumo" },
      async (tx) => {
        const momento = ahora();
        const mascota = await obtenerMascota(tx, mascotaId);
        if (!mascota || mascota.estado === "dada_de_baja") throw new ErrorDeNegocio("La mascota ya no está disponible.");

        // EX-07: se bloquea la cobertura, así dos registros simultáneos no superan el límite (RN-07).
        const bloqueada = await coberturaVigente(tx, mascota.id, true);
        const resumen = bloqueada ? await resumenCobertura(tx, mascota.id, momento) : null;
        const [prestacion] = await tx<{ nombre: string }[]>`select nombre from public.tipo_prestacion where id = ${tipoPrestacionId}`;

        // RN-05: se valida en el momento de la confirmación y se informa el primer motivo que falla.
        const validacion = validarConsumo({
          nombreMascota: mascota.nombre,
          plan: resumen?.cobertura.planNombre ?? null,
          estado: resumen?.estado ?? null,
          antiguedad: resumen?.antiguedad ?? 0,
          saldos: resumen?.saldos ?? [],
          tipoPrestacionId,
          nombrePrestacion: prestacion?.nombre ?? "La prestación",
        });
        if (!validacion.saldo || !resumen) throw new ErrorDeNegocio(validacion.error ?? `${mascota.nombre} no tiene una cobertura vigente.`);

        // RN-02 y RN-06: versión del plan que autoriza el consumo y datos del registro.
        const version = versionVigente(await versionesDelPlan(tx, resumen.cobertura.planId), fechaHoy(momento));
        if (!version) throw new ErrorDeNegocio(`${mascota.nombre} no tiene una cobertura vigente.`);
        const [veterinario] = await tx<{ veterinaria: string }[]>`
          select veterinaria from public.veterinario where usuario_id = ${usuario.id}
        `;
        if (!veterinario) throw new ErrorDeNegocio("No tenés permiso para hacer esta operación.");

        const { periodicidad } = validacion.saldo;
        const [consumo] = await tx<{ id: string }[]>`
          insert into public.consumo (mascota_id, cobertura_id, tipo_prestacion_id, plan_version_id, periodicidad, periodo,
                                      registrado_en, veterinario_id, veterinaria)
          values (${mascota.id}, ${resumen.cobertura.id}, ${tipoPrestacionId}, ${version.id}, ${periodicidad},
                  ${periodoDeConsumo(periodicidad, momento)}, ${momento}, ${usuario.id}, ${veterinario.veterinaria})
          returning id
        `;
        await auditar(tx, {
          usuarioId: usuario.id,
          accion: "alta",
          entidad: "consumo",
          entidadId: consumo.id,
          detalle: { mascota_id: mascota.id, prestacion: validacion.saldo.nombre, periodo: periodoDeConsumo(periodicidad, momento) },
        });
        return tipoPrestacionId;
      },
    );
    registrado = tipo;
    return "Consumo registrado.";
  });

  if (resultado?.ok && registrado) {
    revalidatePath(`/mascotas/${mascotaId}`);
    redirect(`/mascotas/${mascotaId}?aviso=consumo&prestacion=${registrado}`);
  }
  return resultado;
}

// CU-31 Anular consumo: solo el administrador, con motivo. El consumo no se borra.
export async function anularConsumo(
  mascotaId: string,
  consumoId: string,
  _anterior: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  let anulado = false;
  const resultado = await accion(async () => {
    const usuario = await requerirUsuario("administrador"); // EX-03
    if (!esUuid(mascotaId) || !esUuid(consumoId)) throw new ErrorDeNegocio("El consumo ya no está disponible.");
    const motivo = campo(formData, "motivo");
    if (!motivo) throw new ErrorDeNegocio("Indicá el motivo de la anulación."); // EX-01

    await ejecutarUnaVez(
      { clave: claveDeSolicitud(formData), usuarioId: usuario.id, operacion: "anular_consumo" },
      async (tx) => {
        const [consumo] = await tx<{ id: string; estado: string; periodo: string }[]>`
          select id, estado, periodo::text from public.consumo
          where id = ${consumoId} and mascota_id = ${mascotaId}
          for update
        `;
        if (!consumo) throw new ErrorDeNegocio("El consumo ya no está disponible.");
        if (consumo.estado === "anulado") throw new ErrorDeNegocio("El consumo ya está anulado."); // EX-02
        await tx`
          update public.consumo
          set estado = 'anulado', anulado_en = ${ahora()}, anulado_por = ${usuario.id}, motivo_anulacion = ${motivo}
          where id = ${consumo.id}
        `;
        await auditar(tx, {
          usuarioId: usuario.id,
          accion: "anulacion",
          entidad: "consumo",
          entidadId: consumo.id,
          motivo,
          detalle: { periodo: consumo.periodo },
        });
        return null;
      },
    );
    anulado = true;
    return "Consumo anulado.";
  });

  if (resultado?.ok && anulado) {
    revalidatePath(`/mascotas/${mascotaId}`);
    redirect(`/mascotas/${mascotaId}?aviso=consumo-anulado`);
  }
  return resultado;
}

// "Nueva mascota" desde la búsqueda: el administrador indica el DNI del dueño y sigue con CU-13.
export async function elegirDuenoPorDni(_anterior: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  let duenoId: string | null = null;
  const resultado = await accion(async () => {
    await requerirUsuario("administrador");
    const dni = campo(formData, "dni").replace(/\./g, "");
    if (!/^\d{7,8}$/.test(dni)) throw new ErrorDeNegocio("Ingresá el DNI del dueño: 7 u 8 dígitos.");
    const [dueno] = await db()<{ id: string }[]>`select id from public.usuario where rol = 'dueno' and dni = ${dni}`;
    if (!dueno) throw new ErrorDeNegocio(`No hay ningún dueño con el DNI ${dni}. Primero dalo de alta en Dueños.`);
    duenoId = dueno.id;
    return "";
  });
  if (resultado?.ok && duenoId) redirect(`/mascotas/nueva?dueno=${duenoId}`);
  return resultado;
}
