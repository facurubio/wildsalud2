"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
import { bloquearPersonas, buscarPorDni, buscarPorEmail, obtenerDueno } from "@/lib/personas/consultas";
import {
  calcularCambios,
  datosDeDueno,
  describirDueno,
  huellaDeDatos,
  mensajeDniRepetido,
  mensajeEmailRepetido,
  MENSAJE_SIN_CAMBIOS,
  nombreCompleto,
  validarDueno,
  type DatosDueno,
  type DatosDuenoValidados,
} from "@/lib/personas/validacion";
import { ahora } from "@/lib/tiempo";

const NO_DISPONIBLE = "El dueño ya no está disponible.";

function leerFormulario(formData: FormData): DatosDueno {
  return {
    nombre: campo(formData, "nombre"),
    apellido: campo(formData, "apellido"),
    dni: campo(formData, "dni"),
    email: campo(formData, "email"),
    telefono: campo(formData, "telefono"),
    calle: campo(formData, "calle"),
    numero: campo(formData, "numero"),
    piso: campo(formData, "piso"),
    departamento: campo(formData, "departamento"),
    localidad: campo(formData, "localidad"),
    provincia: campo(formData, "provincia"),
    codigoPostal: campo(formData, "codigoPostal"),
    formaPago: campo(formData, "formaPago"),
  };
}

// Valida formato y datos obligatorios; informa todos los campos con error a la vez (RN-11 de CU-08, RN-07 de CU-09).
function validar(formData: FormData): DatosDuenoValidados {
  const resultado = validarDueno(leerFormulario(formData));
  if (!resultado.datos) throw new ErrorDeNegocio(resultado.errores.join(" "));
  return resultado.datos;
}

// CU-08 Dar de alta dueño. En la v1 los dueños no tienen cuenta: se cargan sus datos y no se genera invitación
// (docs/alcance-v1.md). La cuenta queda en estado Invitado, que es el que asigna la base.
export async function altaDueno(_anterior: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  let duenoId: string | null = null;

  const resultado = await accion(async () => {
    const usuario = await requerirUsuario("administrador"); // EX-11
    const datos = validar(formData); // EX-01 a EX-05

    // EX-09: la misma confirmación dos veces crea un solo dueño.
    const creado = await ejecutarUnaVez(
      { clave: claveDeSolicitud(formData), usuarioId: usuario.id, operacion: "alta_dueno" },
      async (tx) => {
        await bloquearPersonas(tx, "dueno"); // EX-10: dos altas simultáneas no se cruzan

        const conDni = await buscarPorDni(tx, "dueno", datos.dni);
        if (conDni) throw new ErrorDeNegocio(mensajeDniRepetido("dueno", datos.dni, conDni, "alta")); // EX-06, EX-07
        const conEmail = await buscarPorEmail(tx, "dueno", datos.email);
        if (conEmail) throw new ErrorDeNegocio(mensajeEmailRepetido("dueno", datos.email, conEmail)); // EX-08

        const [nuevo] = await tx<{ id: string }[]>`
          insert into public.usuario (rol, nombre, apellido, dni, email, telefono, creado_en, creado_por)
          values ('dueno', ${datos.nombre}, ${datos.apellido}, ${datos.dni}, ${datos.email},
                  ${datos.telefono}, ${ahora()}, ${usuario.id})
          returning id
        `;
        await tx`
          insert into public.dueno (usuario_id, calle, numero, piso, departamento, localidad, provincia,
                                    codigo_postal, forma_pago_preferida)
          values (${nuevo.id}, ${datos.calle}, ${datos.numero}, ${datos.piso || null}, ${datos.departamento || null},
                  ${datos.localidad}, ${datos.provincia}, ${datos.codigoPostal}, ${datos.formaPago})
        `;
        await auditar(tx, {
          usuarioId: usuario.id,
          accion: "alta",
          entidad: "usuario",
          entidadId: nuevo.id,
          detalle: { rol: "dueno", ...datos },
        });
        return { id: nuevo.id, nombre: nombreCompleto(datos) };
      },
    );
    duenoId = creado.id;
    return `Se dio de alta a ${creado.nombre}.`;
  });

  if (resultado?.ok && duenoId) {
    revalidatePath("/duenos");
    redirect(`/duenos/${duenoId}?aviso=creado`);
  }
  return resultado;
}

// CU-09 Editar dueño. Sin invitaciones en la v1: cambiar el email no genera ninguna.
export async function editarDueno(
  idFormulario: string,
  _anterior: ResultadoAccion,
  formData: FormData,
): Promise<ResultadoAccion> {
  let guardado = false;

  const resultado = await accion(async () => {
    const usuario = await requerirUsuario("administrador"); // EX-12
    if (!esUuid(idFormulario)) throw new ErrorDeNegocio(NO_DISPONIBLE);
    const datos = validar(formData); // EX-01 a EX-05
    const huellaAbierta = campo(formData, "huella");

    // EX-11: la misma confirmación dos veces guarda una sola vez.
    const resultadoTx = await ejecutarUnaVez(
      { clave: claveDeSolicitud(formData), usuarioId: usuario.id, operacion: "editar_dueno" },
      async (tx) => {
        await bloquearPersonas(tx, "dueno");
        const actual = await obtenerDueno(idFormulario, tx, true);
        if (!actual) throw new ErrorDeNegocio(NO_DISPONIBLE);
        const nombre = nombreCompleto(actual);

        // EX-10: dado de baja mientras se editaba.
        if (actual.estadoCuenta === "inactivo") {
          throw new ErrorDeNegocio(`La cuenta de ${nombre} está inactiva. Reactivala antes de modificar sus datos.`);
        }
        // EX-09: otro administrador modificó los datos mientras se editaban.
        if (huellaDeDatos(datosDeDueno(actual)) !== huellaAbierta) {
          throw new ErrorDeNegocio(`Los datos de ${nombre} cambiaron mientras los editabas. Revisalos y volvé a guardar.`);
        }

        const conDni = await buscarPorDni(tx, "dueno", datos.dni, actual.id);
        if (conDni) throw new ErrorDeNegocio(mensajeDniRepetido("dueno", datos.dni, conDni, "edicion")); // EX-06
        const conEmail = await buscarPorEmail(tx, "dueno", datos.email, actual.id);
        if (conEmail) throw new ErrorDeNegocio(mensajeEmailRepetido("dueno", datos.email, conEmail)); // EX-07

        const cambios = calcularCambios(describirDueno(datosDeDueno(actual)), describirDueno(datos));
        if (cambios.length === 0) throw new ErrorDeNegocio(MENSAJE_SIN_CAMBIOS); // EX-08

        await tx`
          update public.usuario
          set nombre = ${datos.nombre}, apellido = ${datos.apellido}, dni = ${datos.dni},
              email = ${datos.email}, telefono = ${datos.telefono}
          where id = ${actual.id}
        `;
        await tx`
          update public.dueno
          set calle = ${datos.calle}, numero = ${datos.numero}, piso = ${datos.piso || null},
              departamento = ${datos.departamento || null}, localidad = ${datos.localidad},
              provincia = ${datos.provincia}, codigo_postal = ${datos.codigoPostal},
              forma_pago_preferida = ${datos.formaPago}
          where usuario_id = ${actual.id}
        `;
        await auditar(tx, {
          usuarioId: usuario.id,
          accion: "edicion",
          entidad: "usuario",
          entidadId: actual.id,
          detalle: { rol: "dueno", cambios },
        });
        return { nombre: nombreCompleto(datos) };
      },
    );
    guardado = true;
    return `Se actualizaron los datos de ${resultadoTx.nombre}.`;
  });

  if (resultado?.ok && guardado) {
    revalidatePath("/duenos");
    revalidatePath(`/duenos/${idFormulario}`);
    redirect(`/duenos/${idFormulario}?aviso=editado`);
  }
  return resultado;
}
