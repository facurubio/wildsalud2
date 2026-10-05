import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth/usuario-actual";
import { crearClienteSupabase } from "@/lib/supabase/server";

// Vuelta desde Google (CU-02, pasos 5 a 7).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const volverAIngresar = (error?: string) =>
    NextResponse.redirect(new URL(error ? `/ingresar?error=${error}` : "/ingresar", origin));

  // FA-03: la persona canceló en Google.
  if (searchParams.get("error") === "access_denied") return volverAIngresar();

  const code = searchParams.get("code");
  if (!code) return volverAIngresar("validacion");

  const supabase = await crearClienteSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return volverAIngresar("validacion"); // EX-03

  const sesion = await obtenerSesion();
  if (sesion.estado !== "activa") {
    await supabase.auth.signOut();
    if (sesion.estado === "inactiva") {
      return volverAIngresar(sesion.rol === "dueno" ? "inactiva-dueno" : "inactiva-veterinario"); // EX-02
    }
    return volverAIngresar("no-vinculada"); // EX-01
  }

  // RN-08: se registra el inicio de sesión.
  await db()`
    insert into public.auditoria (usuario_id, accion, entidad, entidad_id)
    values (${sesion.usuario.id}, 'inicio_sesion', 'usuario', ${sesion.usuario.id})
  `;

  // Solo rutas internas, para que nadie use el ingreso para redirigir a otro sitio.
  const destino = searchParams.get("destino") ?? "/";
  const esRutaInterna = destino.startsWith("/") && !destino.startsWith("//");
  return NextResponse.redirect(new URL(esRutaInterna ? destino : "/", origin));
}
