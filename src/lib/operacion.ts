import "server-only";
import type postgres from "postgres";
import { obtenerSesion, type UsuarioActual } from "@/lib/auth/usuario-actual";
import { db } from "@/lib/db";

export const SIN_PERMISO = "No tenés permiso para hacer esta operación.";

// Error que se muestra tal cual a la persona: los mensajes exactos de los casos de uso.
export class ErrorDeNegocio extends Error {}

// Aviso que la persona tiene que aceptar para seguir (por ejemplo, CU-13 FA-02: posible mascota duplicada).
// El formulario muestra el mensaje con una casilla "confirmado"; al volver a enviar con la casilla marcada, sigue.
export class PedidoDeConfirmacion extends Error {
  constructor(
    mensaje: string,
    readonly textoConfirmacion: string,
  ) {
    super(mensaje);
  }
}

// Resultado de una acción de formulario.
export type ResultadoAccion =
  | { ok: true; mensaje: string }
  | { ok: false; error: string; confirmar?: string }
  | null;

export type Permiso = "administrador" | "veterinario" | "consulta";

// Verifica la sesión, que la cuenta esté activa y el rol, en el servidor (CU-02 RN-05).
// "veterinario" incluye al administrador que también es veterinario (D145).
// "consulta" es buscar mascotas y ver su ficha: administradores y veterinarios.
export async function requerirUsuario(permiso: Permiso): Promise<UsuarioActual> {
  const sesion = await obtenerSesion();
  if (sesion.estado === "inactiva") {
    throw new ErrorDeNegocio(
      sesion.rol === "dueno"
        ? "Tu cuenta está inactiva. Comunicate con WildSalud."
        : "Tu cuenta está inactiva. Comunicate con el administrador.",
    );
  }
  if (sesion.estado !== "activa") throw new ErrorDeNegocio(SIN_PERMISO);

  const { usuario } = sesion;
  const autorizado =
    permiso === "administrador"
      ? usuario.rol === "administrador"
      : permiso === "veterinario"
        ? usuario.esVeterinario
        : usuario.rol === "administrador" || usuario.esVeterinario;
  if (!autorizado) throw new ErrorDeNegocio(SIN_PERMISO);
  return usuario;
}

export type Auditoria = {
  usuarioId: string | null; // null: Sistema
  accion: string;
  entidad: string;
  entidadId: string;
  motivo?: string | null;
  detalle?: Record<string, unknown> | null;
};

// Toda acción que modifica datos queda en la auditoría, dentro de la misma transacción (RF-TRA-01).
export async function auditar(tx: postgres.TransactionSql, a: Auditoria) {
  await tx`
    insert into public.auditoria (usuario_id, accion, entidad, entidad_id, motivo, detalle)
    values (${a.usuarioId}, ${a.accion}, ${a.entidad}, ${a.entidadId}, ${a.motivo ?? null},
            ${a.detalle ? tx.json(a.detalle as postgres.JSONValue) : null})
  `;
}

// Ejecuta una operación "todo o nada" en una transacción, una sola vez por clave (RNF-INT-01):
// si la misma confirmación llega dos veces (doble clic, reintento), la segunda devuelve el resultado
// de la primera sin repetir la operación. La clave la genera el formulario al abrirse.
export async function ejecutarUnaVez<T extends postgres.JSONValue>(
  datos: { clave: string; usuarioId: string; operacion: string },
  operacion: (tx: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
  return db().begin(async (tx) => {
    // Si otra transacción está usando la misma clave, este insert espera a que termine.
    const [nueva] = await tx`
      insert into public.solicitud (clave, usuario_id, operacion, resultado)
      values (${datos.clave}, ${datos.usuarioId}, ${datos.operacion}, 'null'::jsonb)
      on conflict (clave) do nothing
      returning clave
    `;
    if (!nueva) {
      const [previa] = await tx<{ resultado: T; usuario_id: string; operacion: string }[]>`
        select resultado, usuario_id, operacion from public.solicitud where clave = ${datos.clave}
      `;
      if (previa.usuario_id !== datos.usuarioId || previa.operacion !== datos.operacion) {
        throw new ErrorDeNegocio(SIN_PERMISO);
      }
      return previa.resultado;
    }

    const resultado = await operacion(tx);
    // Un resultado null se guarda como el JSON null (la columna no admite el NULL de SQL).
    const guardado = resultado === null ? tx`'null'::jsonb` : tx`${tx.json(resultado)}`;
    await tx`update public.solicitud set resultado = ${guardado} where clave = ${datos.clave}`;
    return resultado;
  }) as Promise<T>;
}

// Convierte los errores en el resultado que muestra el formulario.
// Los errores inesperados se registran en el servidor y se muestran con un mensaje genérico.
export async function accion(fn: () => Promise<string>): Promise<ResultadoAccion> {
  try {
    return { ok: true, mensaje: await fn() };
  } catch (error) {
    if (error instanceof ErrorDeNegocio) return { ok: false, error: error.message };
    if (error instanceof PedidoDeConfirmacion) return { ok: false, error: error.message, confirmar: error.textoConfirmacion };
    console.error(error);
    return { ok: false, error: "No pudimos completar la operación. Intentá de nuevo." };
  }
}

// Lee un campo de texto de un formulario, sin espacios al principio ni al final.
export function campo(formData: FormData, nombre: string): string {
  const valor = formData.get(nombre);
  return typeof valor === "string" ? valor.trim() : "";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function claveDeSolicitud(formData: FormData): string {
  const clave = campo(formData, "clave");
  if (!UUID.test(clave)) throw new ErrorDeNegocio("No pudimos completar la operación. Intentá de nuevo.");
  return clave;
}

export function esUuid(valor: string): boolean {
  return UUID.test(valor);
}
