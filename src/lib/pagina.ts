import "server-only";
import type { UsuarioActual } from "@/lib/auth/usuario-actual";
import { ErrorDeNegocio, requerirUsuario, type Permiso } from "@/lib/operacion";

// Para las pantallas: el usuario si tiene permiso, o el mensaje que hay que mostrar en su lugar.
export async function usuarioDePagina(
  permiso: Permiso,
): Promise<{ usuario: UsuarioActual; error?: never } | { usuario?: never; error: string }> {
  try {
    return { usuario: await requerirUsuario(permiso) };
  } catch (error) {
    if (error instanceof ErrorDeNegocio) return { error: error.message };
    throw error;
  }
}
