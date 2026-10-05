"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { enlaceInvitacion, crearInvitacion } from "@/lib/invitaciones/crear";
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
import { bloquearPersonas, buscarPorDni, buscarPorEmail, obtenerVeterinario } from "@/lib/personas/consultas";
import { origenDelPedido } from "@/lib/personas/origen";
import type { EnlaceDeInvitacion, ResultadoConEnlace } from "@/lib/personas/resultado";
import {
  calcularCambios,
  datosDeVeterinario,
  describirVeterinario,
  huellaDeDatos,
  leerMotivoBaja,
  mensajeDniRepetido,
  mensajeEmailRepetido,
  MENSAJE_MOTIVO_BAJA,
  MENSAJE_SIN_CAMBIOS,
  nombreCompleto,
  validarVeterinario,
  type DatosVeterinario,
} from "@/lib/personas/validacion";
import { ahora } from "@/lib/tiempo";

const NO_DISPONIBLE = "El veterinario ya no está disponible.";

function leerFormulario(formData: FormData): DatosVeterinario {
  return {
    nombre: campo(formData, "nombre"),
    apellido: campo(formData, "apellido"),
    dni: campo(formData, "dni"),
    veterinaria: campo(formData, "veterinaria"),
    telefono: campo(formData, "telefono"),
    email: campo(formData, "email"),
  };
}

// Valida formato y datos obligatorios; informa todos los campos con error a la vez (RN-10 de CU-04).
function validar(formData: FormData): DatosVeterinario {
  const resultado = validarVeterinario(leerFormulario(formData));
  if (!resultado.datos) throw new ErrorDeNegocio(resultado.errores.join(" "));
  return resultado.datos;
}

// Código de la invitación recién generada. Se devuelve solo en la respuesta de la acción: no se guarda en la
// tabla de solicitudes ni viaja en la URL. Si la operación ya se había procesado (confirmación repetida), no hay código.
function armarEnlace(origen: string, codigo: string | null, venceEn: string | null): EnlaceDeInvitacion | undefined {
  if (!codigo || !venceEn) return undefined;
  return { url: enlaceInvitacion(origen, codigo), venceEn };
}

// CU-04 Dar de alta veterinario. En la v1 no se envían emails: se muestra el enlace de invitación (alcance-v1.md).
export async function altaVeterinario(_anterior: ResultadoConEnlace, formData: FormData): Promise<ResultadoConEnlace> {
  const salida: { codigo: string | null; creado: { id: string; venceEn: string } | null } = { codigo: null, creado: null };

  const resultado = await accion(async () => {
    const usuario = await requerirUsuario("administrador"); // EX-10
    const datos = validar(formData); // EX-01 a EX-04

    // EX-08: la misma confirmación dos veces crea un solo veterinario y una sola invitación.
    const creado = await ejecutarUnaVez(
      { clave: claveDeSolicitud(formData), usuarioId: usuario.id, operacion: "alta_veterinario" },
      async (tx) => {
        await bloquearPersonas(tx, "veterinario"); // EX-09: dos altas simultáneas no se cruzan

        const conDni = await buscarPorDni(tx, "veterinario", datos.dni);
        if (conDni) throw new ErrorDeNegocio(mensajeDniRepetido("veterinario", datos.dni, conDni, "alta")); // EX-05, EX-06
        const conEmail = await buscarPorEmail(tx, "veterinario", datos.email);
        if (conEmail) throw new ErrorDeNegocio(mensajeEmailRepetido("veterinario", datos.email, conEmail)); // EX-07

        const [nuevo] = await tx<{ id: string }[]>`
          insert into public.usuario (rol, nombre, apellido, dni, email, telefono, creado_en, creado_por)
          values ('veterinario', ${datos.nombre}, ${datos.apellido}, ${datos.dni}, ${datos.email},
                  ${datos.telefono}, ${ahora()}, ${usuario.id})
          returning id
        `;
        await tx`insert into public.veterinario (usuario_id, veterinaria) values (${nuevo.id}, ${datos.veterinaria})`;

        const invitacion = await crearInvitacion(tx, { usuarioId: nuevo.id, email: datos.email, enviadaPor: usuario.id });
        salida.codigo = invitacion.codigo;

        await auditar(tx, {
          usuarioId: usuario.id,
          accion: "alta",
          entidad: "usuario",
          entidadId: nuevo.id,
          detalle: { rol: "veterinario", ...datos },
        });
        return { id: nuevo.id, nombre: nombreCompleto(datos), venceEn: invitacion.venceEn.toISOString() };
      },
    );
    salida.creado = { id: creado.id, venceEn: creado.venceEn };
    return `Se dio de alta a ${creado.nombre}.`;
  });

  if (resultado?.ok && salida.creado) {
    revalidatePath("/veterinarios");
    const { id, venceEn } = salida.creado;
    const enlace = armarEnlace(await origenDelPedido(), salida.codigo, venceEn);
    if (!enlace) redirect(`/veterinarios/${id}?aviso=creado`);
    return {
      ok: true,
      mensaje: `${resultado.mensaje} Enviale el enlace de invitación por WhatsApp.`,
      enlace,
    };
  }
  return resultado;
}

// CU-05 Editar veterinario.
export async function editarVeterinario(
  idFormulario: string,
  _anterior: ResultadoConEnlace,
  formData: FormData,
): Promise<ResultadoConEnlace> {
  const salida: { codigo: string | null; invitacionNueva: string | null; guardado: boolean } = {
    codigo: null,
    invitacionNueva: null,
    guardado: false,
  };

  const resultado = await accion(async () => {
    const usuario = await requerirUsuario("administrador"); // EX-11
    if (!esUuid(idFormulario)) throw new ErrorDeNegocio(NO_DISPONIBLE);
    const datos = validar(formData); // EX-01 a EX-04
    const huellaAbierta = campo(formData, "huella");

    // EX-10: la misma confirmación dos veces guarda una sola vez y genera una sola invitación.
    const guardado = await ejecutarUnaVez(
      { clave: claveDeSolicitud(formData), usuarioId: usuario.id, operacion: "editar_veterinario" },
      async (tx) => {
        await bloquearPersonas(tx, "veterinario");
        const actual = await obtenerVeterinario(idFormulario, tx, true);
        if (!actual) throw new ErrorDeNegocio(NO_DISPONIBLE);
        const nombre = nombreCompleto(actual);

        // EX-09: dado de baja mientras se editaba.
        if (actual.estadoCuenta === "inactivo") {
          throw new ErrorDeNegocio(`La cuenta de ${nombre} está inactiva. Reactivala antes de modificar sus datos.`);
        }
        // EX-08: otro administrador modificó los datos mientras se editaban.
        if (huellaDeDatos(datosDeVeterinario(actual)) !== huellaAbierta) {
          throw new ErrorDeNegocio(`Los datos de ${nombre} cambiaron mientras los editabas. Revisalos y volvé a guardar.`);
        }

        const conDni = await buscarPorDni(tx, "veterinario", datos.dni, actual.id);
        if (conDni) throw new ErrorDeNegocio(mensajeDniRepetido("veterinario", datos.dni, conDni, "edicion")); // EX-05
        const conEmail = await buscarPorEmail(tx, "veterinario", datos.email, actual.id);
        if (conEmail) throw new ErrorDeNegocio(mensajeEmailRepetido("veterinario", datos.email, conEmail)); // EX-06

        const cambios = calcularCambios(describirVeterinario(datosDeVeterinario(actual)), describirVeterinario(datos));
        if (cambios.length === 0) throw new ErrorDeNegocio(MENSAJE_SIN_CAMBIOS); // EX-07

        await tx`
          update public.usuario
          set nombre = ${datos.nombre}, apellido = ${datos.apellido}, dni = ${datos.dni},
              email = ${datos.email}, telefono = ${datos.telefono}
          where id = ${actual.id}
        `;
        await tx`update public.veterinario set veterinaria = ${datos.veterinaria} where usuario_id = ${actual.id}`;

        // FA-03 (D84): con la cuenta Invitado, cambiar el email reemplaza la invitación sin usar.
        let invitacionNueva: string | null = null;
        if (actual.estadoCuenta === "invitado" && actual.email !== datos.email) {
          const invitacion = await crearInvitacion(tx, {
            usuarioId: actual.id,
            email: datos.email,
            enviadaPor: usuario.id,
          });
          salida.codigo = invitacion.codigo;
          invitacionNueva = invitacion.venceEn.toISOString();
        }

        // FA-02: con la cuenta Activo, la vinculación no cambia y no se genera ninguna invitación.
        await auditar(tx, {
          usuarioId: usuario.id,
          accion: "edicion",
          entidad: "usuario",
          entidadId: actual.id,
          detalle: { rol: "veterinario", cambios, invitacionNueva: invitacionNueva !== null },
        });
        return { nombre: nombreCompleto(datos), invitacionNueva };
      },
    );
    salida.invitacionNueva = guardado.invitacionNueva;
    salida.guardado = true;
    return `Se actualizaron los datos de ${guardado.nombre}.`;
  });

  if (resultado?.ok && salida.guardado) {
    revalidatePath("/veterinarios");
    revalidatePath(`/veterinarios/${idFormulario}`);
    const enlace = armarEnlace(await origenDelPedido(), salida.codigo, salida.invitacionNueva);
    if (!enlace) redirect(`/veterinarios/${idFormulario}?aviso=editado`);
    return {
      ok: true,
      mensaje: `${resultado.mensaje} Como cambió el email, generamos una invitación nueva: enviale el enlace por WhatsApp. El enlace anterior dejó de servir.`,
      enlace,
    };
  }
  return resultado;
}

// CU-06 Dar de baja veterinario: baja lógica, sin borrar nada (RN-02).
export async function bajaVeterinario(
  idFormulario: string,
  _anterior: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  let baja = false;

  const resultado = await accion(async () => {
    const usuario = await requerirUsuario("administrador"); // EX-04
    if (!esUuid(idFormulario)) throw new ErrorDeNegocio(NO_DISPONIBLE);

    // EX-02: la misma confirmación dos veces registra una sola baja.
    const dado = await ejecutarUnaVez(
      { clave: claveDeSolicitud(formData), usuarioId: usuario.id, operacion: "baja_veterinario" },
      async (tx) => {
        await bloquearPersonas(tx, "veterinario");
        const actual = await obtenerVeterinario(idFormulario, tx, true); // bloquea: dos bajas simultáneas registran una sola
        if (!actual) throw new ErrorDeNegocio(NO_DISPONIBLE);
        const nombre = nombreCompleto(actual);

        // RN-01 y EX-01: solo se da de baja a quien está Invitado o Activo.
        if (actual.estadoCuenta === "inactivo") throw new ErrorDeNegocio(`La cuenta de ${nombre} ya está inactiva.`);
        // EX-03 / RN-08: el motivo es obligatorio.
        const motivo = leerMotivoBaja(campo(formData, "motivo"));
        if (!motivo) throw new ErrorDeNegocio(MENSAJE_MOTIVO_BAJA);

        const momento = ahora();
        await tx`
          update public.usuario
          set estado_cuenta = 'inactivo', motivo_baja = ${motivo}, baja_en = ${momento}, baja_por = ${usuario.id}
          where id = ${actual.id}
        `;
        // FA-01 / RN-03: la invitación sin usar deja de servir. La vinculación queda abierta: la cuenta de Google
        // queda reservada (D97).
        await tx`update public.invitacion set estado = 'vencida' where usuario_id = ${actual.id} and estado = 'invitado'`;
        // RN-04: las sesiones abiertas se cierran. Además, el estado se valida en cada acción.
        await tx`
          update public.sesion set cerrada_en = ${momento}, motivo_cierre = 'baja'
          where usuario_id = ${actual.id} and cerrada_en is null
        `;
        await auditar(tx, {
          usuarioId: usuario.id,
          accion: "baja",
          entidad: "usuario",
          entidadId: actual.id,
          motivo,
          detalle: { rol: "veterinario", estadoAnterior: actual.estadoCuenta, estadoNuevo: "inactivo" },
        });
        return { nombre };
      },
    );
    baja = true;
    return `Se dio de baja a ${dado.nombre}. Su cuenta quedó inactiva.`;
  });

  if (resultado?.ok && baja) {
    revalidatePath("/veterinarios");
    revalidatePath(`/veterinarios/${idFormulario}`);
    redirect(`/veterinarios/${idFormulario}?aviso=baja`);
  }
  return resultado;
}

// Reemplaza a CU-12 en la v1 (sin emails): genera un enlace de invitación nuevo para un veterinario Invitado.
// Los enlaces anteriores sin usar dejan de servir (D87).
export async function generarEnlaceVeterinario(
  idFormulario: string,
  _anterior: ResultadoConEnlace,
  formData: FormData,
): Promise<ResultadoConEnlace> {
  const salida: { codigo: string | null; venceEn: string | null } = { codigo: null, venceEn: null };

  const resultado = await accion(async () => {
    const usuario = await requerirUsuario("administrador");
    if (!esUuid(idFormulario)) throw new ErrorDeNegocio(NO_DISPONIBLE);

    const generado = await ejecutarUnaVez(
      { clave: claveDeSolicitud(formData), usuarioId: usuario.id, operacion: "generar_enlace_veterinario" },
      async (tx) => {
        const actual = await obtenerVeterinario(idFormulario, tx, true);
        if (!actual) throw new ErrorDeNegocio(NO_DISPONIBLE);
        const nombre = nombreCompleto(actual);
        if (actual.estadoCuenta === "inactivo") {
          throw new ErrorDeNegocio(`La cuenta de ${nombre} está inactiva. Reactivala: al hacerlo se le envía una invitación nueva.`);
        }
        if (actual.estadoCuenta !== "invitado") {
          throw new ErrorDeNegocio(`${nombre} ya vinculó su cuenta: no hace falta un enlace nuevo.`);
        }

        const invitacion = await crearInvitacion(tx, { usuarioId: actual.id, email: actual.email, enviadaPor: usuario.id });
        salida.codigo = invitacion.codigo;
        await auditar(tx, {
          usuarioId: usuario.id,
          accion: "reenvio_invitacion",
          entidad: "usuario",
          entidadId: actual.id,
          detalle: { rol: "veterinario", email: actual.email },
        });
        return { nombre, venceEn: invitacion.venceEn.toISOString() };
      },
    );
    salida.venceEn = generado.venceEn;
    return `Generamos un enlace nuevo para ${generado.nombre}. Los enlaces anteriores dejaron de servir.`;
  });

  if (resultado?.ok) {
    revalidatePath(`/veterinarios/${idFormulario}`);
    const enlace = armarEnlace(await origenDelPedido(), salida.codigo, salida.venceEn);
    if (!enlace) {
      return {
        ok: true,
        mensaje: "Este pedido ya se había procesado. Si necesitás el enlace, generá uno nuevo.",
      };
    }
    return { ok: true, mensaje: resultado.mensaje, enlace };
  }
  return resultado;
}
