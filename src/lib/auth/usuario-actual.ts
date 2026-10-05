import "server-only";
import { db } from "@/lib/db";
import { crearClienteSupabase } from "@/lib/supabase/server";

export type Rol = "administrador" | "veterinario" | "dueno";

export type UsuarioActual = {
  id: string;
  rol: Rol;
  nombre: string;
  apellido: string;
  // El administrador que también es veterinario usa las funciones de los dos roles (D145).
  esVeterinario: boolean;
};

export type ResultadoSesion =
  | { estado: "sin_sesion" }
  | { estado: "no_vinculada" }
  | { estado: "inactiva"; rol: Rol }
  | { estado: "activa"; usuario: UsuarioActual };

// Identifica al usuario por la cuenta vinculada, nunca por el email (CU-02 RN-02, M-10).
export async function obtenerSesion(): Promise<ResultadoSesion> {
  const supabase = await crearClienteSupabase();
  const { data } = await supabase.auth.getClaims();
  const authUserId = data?.claims?.sub;
  if (!authUserId) return { estado: "sin_sesion" };

  const [fila] = await db()<
    { id: string; rol: Rol; nombre: string; apellido: string; estado_cuenta: string; es_veterinario: boolean }[]
  >`
    select u.id, u.rol, u.nombre, u.apellido, u.estado_cuenta,
           (v.usuario_id is not null) as es_veterinario
    from public.vinculacion vi
    join public.usuario u on u.id = vi.usuario_id
    left join public.veterinario v on v.usuario_id = u.id
    where vi.auth_user_id = ${authUserId}
      and vi.finalizada_en is null
  `;

  if (!fila) return { estado: "no_vinculada" };
  if (fila.estado_cuenta !== "activo") return { estado: "inactiva", rol: fila.rol };

  return {
    estado: "activa",
    usuario: {
      id: fila.id,
      rol: fila.rol,
      nombre: fila.nombre,
      apellido: fila.apellido,
      esVeterinario: fila.rol === "veterinario" || fila.es_veterinario,
    },
  };
}
