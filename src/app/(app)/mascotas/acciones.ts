"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { periodosAPagar } from "@/lib/cobertura/calculo";
import { coberturaVigente, mascotaConDeuda, sincronizarEstado, versionesDelPlan } from "@/lib/cobertura/consultas";
import { formatearPeriodo } from "@/lib/formato";
import { mascotaParecida, obtenerDueno, obtenerMascota } from "@/lib/mascotas/consultas";
import { formatearAfiliado, validarFicha, type Ficha } from "@/lib/mascotas/validacion";
import {
  accion,
  auditar,
  campo,
  claveDeSolicitud,
  ejecutarUnaVez,
  ErrorDeNegocio,
  esUuid,
  PedidoDeConfirmacion,
  requerirUsuario,
  type ResultadoAccion,
} from "@/lib/operacion";
import {
  esFormaDePago,
  mensajePagoRegistrado,
  periodosElegidos,
  precioDelPeriodo,
  validarFechaPago,
} from "@/lib/pagos/reglas";
import { ahora, fechaHoy, periodoMensual } from "@/lib/tiempo";

function leerFicha(formData: FormData): Ficha {
  const resultado = validarFicha({
    nombre: campo(formData, "nombre"),
    especie: campo(formData, "especie"),
    raza: campo(formData, "raza"),
    sexo: campo(formData, "sexo"),
    color: campo(formData, "color"),
    castrado: campo(formData, "castrado"),
    enfermedades: campo(formData, "enfermedades"),
    alimentacion: campo(formData, "alimentacion"),
    edadAproximada: campo(formData, "edadAproximada"),
  });
  if (!resultado.ficha) throw new ErrorDeNegocio(resultado.error);
  return resultado.ficha;
}

function leerPago(formData: FormData) {
  const formaPago = campo(formData, "formaPago");
  if (!esFormaDePago(formaPago)) throw new ErrorDeNegocio("Completá el campo forma de pago.");
  const fechaPago = campo(formData, "fechaPago");
  const errorFecha = validarFechaPago(fechaPago, fechaHoy());
  if (errorFecha) throw new ErrorDeNegocio(errorFecha);
  return { formaPago, fechaPago };
}

// CU-13 Dar de alta mascota, con CU-22 Asignar plan y el primer pago, todo o nada (RN-07).
export async function darDeAltaMascota(duenoId: string, _anterior: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  let mascotaId: string | null = null;
  const resultado = await accion(async () => {
    const usuario = await requerirUsuario("administrador"); // EX-11
    if (!esUuid(duenoId)) throw new ErrorDeNegocio("El dueño ya no está disponible.");
    const ficha = leerFicha(formData); // EX-03 a EX-05
    const planId = campo(formData, "planId");
    if (!esUuid(planId)) throw new ErrorDeNegocio("Completá el campo plan.");
    const { formaPago, fechaPago } = leerPago(formData); // EX-09

    const alta = await ejecutarUnaVez(
      { clave: claveDeSolicitud(formData), usuarioId: usuario.id, operacion: "alta_mascota" },
      async (tx) => {
        const momento = ahora();
        // RN-02 / EX-01: el dueño no puede estar dado de baja. Se bloquea para validar su deuda sin carreras.
        const dueno = await obtenerDueno(tx, duenoId, true);
        if (!dueno) throw new ErrorDeNegocio("El dueño ya no está disponible.");
        const nombreDueno = `${dueno.nombre} ${dueno.apellido}`;
        if (dueno.estadoCuenta === "inactivo") {
          throw new ErrorDeNegocio(
            `${nombreDueno} tiene la cuenta inactiva. Para darle de alta una mascota, primero reactivá su cuenta desde su ficha.`,
          );
        }
        // RN-03 / EX-02: sin deuda de ninguna de sus mascotas.
        const conDeuda = await mascotaConDeuda(tx, dueno.id, momento);
        if (conDeuda) {
          throw new ErrorDeNegocio(`${nombreDueno} tiene deuda pendiente de ${conDeuda.nombre}. No se puede asignar un plan hasta saldarla.`);
        }

        // RN-08 / FA-02: posible duplicado; avisa y pide confirmar, sin bloquear.
        if (campo(formData, "confirmado") !== "si") {
          const parecida = await mascotaParecida(tx, dueno.id, ficha.nombre, ficha.especie);
          if (parecida) {
            const numero = formatearAfiliado(parecida.numero_afiliado);
            throw new PedidoDeConfirmacion(
              parecida.estado === "activa"
                ? `${nombreDueno} ya tiene una mascota llamada ${parecida.nombre} (${parecida.especie}, número de afiliado ${numero}). ¿Querés darla de alta igual?`
                : `${nombreDueno} tiene dada de baja una mascota llamada ${parecida.nombre} (${parecida.especie}, número de afiliado ${numero}). Si es la misma, reactivala desde su ficha en lugar de darla de alta. ¿Querés darla de alta igual?`,
              "Sí, darla de alta igual",
            );
          }
        }

        // CU-22 RN-04 / EX-08: solo planes activos, validado al confirmar.
        const [plan] = await tx<{ id: string; nombre: string; estado: string }[]>`
          select id, nombre, estado from public.plan where id = ${planId} for share
        `;
        if (!plan || plan.estado === "eliminado") throw new ErrorDeNegocio("Completá el campo plan.");
        if (plan.estado !== "activo") throw new ErrorDeNegocio(`El plan ${plan.nombre} está inactivo y no se puede asignar.`);

        // CU-22 RN-05 y RN-06: cuota completa del mes en curso, con el importe que calcula el sistema.
        const periodo = periodoMensual(momento);
        const importe = precioDelPeriodo(await versionesDelPlan(tx, plan.id), periodo);
        if (!importe) throw new ErrorDeNegocio(`El plan ${plan.nombre} está inactivo y no se puede asignar.`);

        // RN-06: el número de afiliado lo asigna la base al registrar la mascota.
        const [mascota] = await tx<{ id: string; numero_afiliado: number }[]>`
          insert into public.mascota (dueno_id, nombre, especie, raza, sexo, color, castrado, enfermedades, alimentacion,
                                      edad_aproximada, alta_en, alta_por)
          values (${dueno.id}, ${ficha.nombre}, ${ficha.especie}, ${ficha.raza}, ${ficha.sexo}, ${ficha.color}, ${ficha.castrado},
                  ${ficha.enfermedades}, ${ficha.alimentacion}, ${ficha.edadAproximada}, ${momento}, ${usuario.id})
          returning id, numero_afiliado
        `;
        const [cobertura] = await tx<{ id: string }[]>`
          insert into public.cobertura (mascota_id, iniciada_en, creada_por)
          values (${mascota.id}, ${momento}, ${usuario.id})
          returning id
        `;
        await tx`
          insert into public.cobertura_plan (cobertura_id, plan_id, desde)
          values (${cobertura.id}, ${plan.id}, ${fechaHoy(momento)})
        `;
        const [pago] = await tx<{ id: string }[]>`
          insert into public.pago (mascota_id, cobertura_id, periodo, fecha_pago, importe, forma_pago, es_primer_pago,
                                   registrado_en, registrado_por)
          values (${mascota.id}, ${cobertura.id}, ${periodo}, ${fechaPago}, ${importe}, ${formaPago}, true,
                  ${momento}, ${usuario.id})
          returning id
        `;

        // RN-10: alta de la mascota, de la cobertura y del pago.
        await auditar(tx, {
          usuarioId: usuario.id,
          accion: "alta",
          entidad: "mascota",
          entidadId: mascota.id,
          detalle: { ...ficha, dueno_id: dueno.id, numero_afiliado: mascota.numero_afiliado },
        });
        await auditar(tx, {
          usuarioId: usuario.id,
          accion: "alta",
          entidad: "cobertura",
          entidadId: cobertura.id,
          detalle: { mascota_id: mascota.id, plan_id: plan.id },
        });
        await auditar(tx, {
          usuarioId: usuario.id,
          accion: "alta",
          entidad: "pago",
          entidadId: pago.id,
          detalle: { periodo, importe, forma_pago: formaPago, fecha_pago: fechaPago, primer_pago: true },
        });

        return { id: mascota.id, nombre: ficha.nombre, numero: mascota.numero_afiliado, plan: plan.nombre };
      },
    );
    mascotaId = alta.id;
    return `Se dio de alta a ${alta.nombre} con el número de afiliado ${formatearAfiliado(alta.numero)} y el plan ${alta.plan}.`;
  });

  if (resultado?.ok && mascotaId) {
    revalidatePath("/mascotas");
    redirect(`/mascotas/${mascotaId}?aviso=alta`);
  }
  return resultado;
}

const etiquetasFicha: Record<keyof Ficha, string> = {
  nombre: "nombre",
  especie: "especie",
  raza: "raza",
  sexo: "sexo",
  color: "color",
  castrado: "castrado",
  enfermedades: "enfermedades",
  alimentacion: "alimentacion",
  edadAproximada: "edad_aproximada",
};

// CU-14 Editar mascota (datos de la ficha). El cambio de dueño (FA-03) va aparte.
export async function editarMascota(mascotaId: string, _anterior: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  let editada = false;
  const resultado = await accion(async () => {
    const usuario = await requerirUsuario("administrador"); // EX-10
    if (!esUuid(mascotaId)) throw new ErrorDeNegocio("La mascota ya no está disponible.");
    if (formData.has("numeroAfiliado")) throw new ErrorDeNegocio("El número de afiliado de una mascota no se puede modificar."); // EX-09
    const ficha = leerFicha(formData); // EX-01 a EX-03

    const nombre = await ejecutarUnaVez(
      { clave: claveDeSolicitud(formData), usuarioId: usuario.id, operacion: "editar_mascota" },
      async (tx) => {
        const actual = await obtenerMascota(tx, mascotaId, true);
        if (!actual) throw new ErrorDeNegocio("La mascota ya no está disponible.");
        if (actual.estado === "dada_de_baja") {
          throw new ErrorDeNegocio(`La mascota ${actual.nombre} está dada de baja y su ficha no se puede modificar.`); // EX-08
        }
        // RN-05 / EX-07: no sobrescribir cambios de otro administrador.
        if (campo(formData, "version") !== actual.version) {
          throw new ErrorDeNegocio(`Los datos de ${actual.nombre} cambiaron mientras los editabas. Revisalos y volvé a guardar.`);
        }

        // RN-06: un registro por dato modificado, con su valor anterior y nuevo.
        const cambios = Object.fromEntries(
          (Object.keys(etiquetasFicha) as (keyof Ficha)[])
            .filter((k) => ficha[k] !== actual[k])
            .map((k) => [etiquetasFicha[k], { anterior: actual[k], nuevo: ficha[k] }]),
        );
        if (Object.keys(cambios).length === 0) throw new ErrorDeNegocio("No hay cambios para guardar."); // EX-06

        await tx`
          update public.mascota
          set nombre = ${ficha.nombre}, especie = ${ficha.especie}, raza = ${ficha.raza}, sexo = ${ficha.sexo},
              color = ${ficha.color}, castrado = ${ficha.castrado}, enfermedades = ${ficha.enfermedades},
              alimentacion = ${ficha.alimentacion}, edad_aproximada = ${ficha.edadAproximada},
              modificada_en = ${ahora()}, modificada_por = ${usuario.id}
          where id = ${actual.id}
        `;
        await auditar(tx, { usuarioId: usuario.id, accion: "edicion", entidad: "mascota", entidadId: actual.id, detalle: cambios });
        return ficha.nombre;
      },
    );
    editada = true;
    return `Los datos de ${nombre} se actualizaron.`;
  });

  if (resultado?.ok && editada) {
    revalidatePath(`/mascotas/${mascotaId}`);
    redirect(`/mascotas/${mascotaId}?aviso=editada`);
  }
  return resultado;
}

// CU-26 Registrar pago de la cobertura vigente. Un pago por período, del más antiguo al más nuevo.
export async function registrarPago(mascotaId: string, _anterior: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  let registrado: string | null = null;
  const resultado = await accion(async () => {
    const usuario = await requerirUsuario("administrador");
    if (!esUuid(mascotaId)) throw new ErrorDeNegocio("La mascota ya no está disponible.");
    const { formaPago, fechaPago } = leerPago(formData); // EX-03
    const vistos = campo(formData, "periodos").split(",").filter(Boolean);

    const mensaje = await ejecutarUnaVez(
      { clave: claveDeSolicitud(formData), usuarioId: usuario.id, operacion: "registrar_pago" },
      async (tx) => {
        const momento = ahora();
        const mascota = await obtenerMascota(tx, mascotaId);
        if (!mascota) throw new ErrorDeNegocio("La mascota ya no está disponible.");
        // Se bloquea la cobertura para que dos administradores no paguen el mismo período a la vez.
        const cobertura = await coberturaVigente(tx, mascota.id, true);
        if (!cobertura) throw new ErrorDeNegocio(`${mascota.nombre} no tiene una cobertura vigente ni deuda pendiente.`); // EX-02

        // RN-05: la situación se evalúa al confirmar.
        const pendientes = periodosAPagar(cobertura, momento);
        if (pendientes.length === 0) {
          throw new ErrorDeNegocio(`No hay períodos pendientes de pago para ${mascota.nombre}. No se permiten pagos anticipados.`); // EX-01
        }
        const yaPagado = vistos.find((p) => !pendientes.includes(p));
        if (yaPagado) {
          throw new ErrorDeNegocio(`El período ${formatearPeriodo(yaPagado)} de ${mascota.nombre} ya tiene un pago registrado.`); // EX-04
        }
        const eleccion = periodosElegidos(pendientes, vistos.length);
        if (!eleccion.periodos) throw new ErrorDeNegocio(eleccion.error);
        if (eleccion.periodos.join() !== vistos.join()) {
          throw new ErrorDeNegocio(`Los períodos se pagan en orden, empezando por ${formatearPeriodo(pendientes[0])}.`); // EX-05
        }

        // RN-04: importe de cada período, con la versión del plan vigente el día 1 de ese mes.
        const versiones = await versionesDelPlan(tx, cobertura.planId);
        for (const periodo of eleccion.periodos) {
          const importe = precioDelPeriodo(versiones, periodo);
          if (!importe) throw new ErrorDeNegocio(`La situación de la cobertura de ${mascota.nombre} cambió. Revisá los períodos a pagar.`);
          const [pago] = await tx<{ id: string }[]>`
            insert into public.pago (mascota_id, cobertura_id, periodo, fecha_pago, importe, forma_pago, registrado_en, registrado_por)
            values (${mascota.id}, ${cobertura.id}, ${periodo}, ${fechaPago}, ${importe}, ${formaPago}, ${momento}, ${usuario.id})
            returning id
          `;
          await auditar(tx, {
            usuarioId: usuario.id,
            accion: "alta",
            entidad: "pago",
            entidadId: pago.id,
            detalle: { periodo, importe, forma_pago: formaPago, fecha_pago: fechaPago },
          });
        }

        // RN-06: se reactiva recién cuando no queda nada impago hasta el mes en curso.
        const estado = await sincronizarEstado(tx, cobertura, momento, { usuarioId: usuario.id, motivo: "pago" });
        return mensajePagoRegistrado(mascota.nombre, estado.estado === "suspendida", estado.pendientes, periodoMensual(momento));
      },
    );
    registrado = mensaje;
    return mensaje;
  });

  if (resultado?.ok && registrado) {
    revalidatePath(`/mascotas/${mascotaId}`);
    redirect(`/mascotas/${mascotaId}?aviso=pago`);
  }
  return resultado;
}

// CU-28 Anular pago. El pago no se borra: queda anulado con motivo, administrador, fecha y hora.
export async function anularPago(
  mascotaId: string,
  pagoId: string,
  _anterior: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  let anulado: string | null = null;
  const resultado = await accion(async () => {
    const usuario = await requerirUsuario("administrador");
    if (!esUuid(mascotaId) || !esUuid(pagoId)) throw new ErrorDeNegocio("El pago ya no está disponible.");
    const motivo = campo(formData, "motivo");
    if (!motivo) throw new ErrorDeNegocio("Indicá el motivo de la anulación."); // EX-01

    const mensaje = await ejecutarUnaVez(
      { clave: claveDeSolicitud(formData), usuarioId: usuario.id, operacion: "anular_pago" },
      async (tx) => {
        const momento = ahora();
        const mascota = await obtenerMascota(tx, mascotaId);
        const cobertura = mascota ? await coberturaVigente(tx, mascota.id, true) : null;
        const [pago] = await tx<{ id: string; cobertura_id: string; estado: string; es_primer_pago: boolean; periodo: string }[]>`
          select id, cobertura_id, estado, es_primer_pago, periodo::text from public.pago
          where id = ${pagoId} and mascota_id = ${mascotaId}
          for update
        `;
        if (!mascota || !pago) throw new ErrorDeNegocio("El pago ya no está disponible.");
        if (pago.estado === "anulado") throw new ErrorDeNegocio("El pago ya está anulado."); // EX-02
        if (pago.es_primer_pago) throw new ErrorDeNegocio("No se puede anular el primer pago de una cobertura."); // EX-04 / D65

        await tx`
          update public.pago
          set estado = 'anulado', anulado_en = ${momento}, anulado_por = ${usuario.id}, motivo_anulacion = ${motivo}
          where id = ${pago.id}
        `;
        await auditar(tx, {
          usuarioId: usuario.id,
          accion: "anulacion",
          entidad: "pago",
          entidadId: pago.id,
          motivo,
          detalle: { periodo: pago.periodo },
        });

        // RN-04: si el período queda impago y vencido, la cobertura se suspende en ese momento.
        if (cobertura && cobertura.id === pago.cobertura_id) {
          const estado = await sincronizarEstado(tx, cobertura, momento, { usuarioId: usuario.id, motivo: "anulacion_pago" });
          if (estado.estado === "suspendida" && cobertura.estadoGuardado !== "suspendida") {
            return `Pago anulado. La cobertura de ${mascota.nombre} quedó suspendida por falta de pago.`;
          }
        }
        return "Pago anulado.";
      },
    );
    anulado = mensaje;
    return mensaje;
  });

  if (resultado?.ok && anulado) {
    revalidatePath(`/mascotas/${mascotaId}`);
    redirect(`/mascotas/${mascotaId}?aviso=${anulado === "Pago anulado." ? "anulado" : "anulado-suspendida"}`);
  }
  return resultado;
}
