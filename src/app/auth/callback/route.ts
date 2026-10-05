import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth/usuario-actual";
import { COOKIE_INVITACION } from "@/lib/invitaciones/cookie";
import { vincularCuenta } from "@/lib/invitaciones/vincular";
import { crearClienteSupabase } from "@/lib/supabase/server";

// Vuelta desde Google: ingreso (CU-02, pasos 5 a 7) o vinculación por invitación (CU-01, pasos 6 a 10).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const codigoInvitacion = request.cookies.get(COOKIE_INVITACION)?.value;

  const ir = (ruta: string) => {
    const respuesta = NextResponse.redirect(new URL(ruta, origin));
    if (codigoInvitacion) respuesta.cookies.delete({ name: COOKIE_INVITACION, path: "/auth/callback" });
    return respuesta;
  };
  const volverAIngresar = (error?: string) => ir(error ? `/ingresar?error=${error}` : "/ingresar");
  const volverAInvitacion = (error?: string) =>
    ir(`/invitacion/${codigoInvitacion}${error ? `?error=${error}` : ""}`);

  // FA-03 (CU-02) / FA-05 (CU-01): la persona canceló en Google.
  if (searchParams.get("error") === "access_denied") {
    return codigoInvitacion ? volverAInvitacion() : volverAIngresar();
  }

  const supabase = await crearClienteSupabase();
  const code = searchParams.get("code");
  const { error } = code ? await supabase.auth.exchangeCodeForSession(code) : { error: true };
  if (error) return codigoInvitacion ? volverAInvitacion("validacion") : volverAIngresar("validacion");

  if (codigoInvitacion) return vincularDesdeInvitacion(codigoInvitacion);

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
  return ir(esRutaInterna ? destino : "/");

  async function vincularDesdeInvitacion(codigo: string) {
    const { data } = await supabase.auth.getUser();
    const identidadGoogle = data.user?.identities?.find((i) => i.provider === "google");
    const cuentaProveedorId = identidadGoogle?.identity_data?.sub ?? identidadGoogle?.id;
    if (!data.user || !cuentaProveedorId) {
      await supabase.auth.signOut();
      return volverAInvitacion("validacion"); // EX-07
    }

    const resultado = await vincularCuenta({ codigo, cuentaProveedorId, authUserId: data.user.id });
    if (!resultado.vinculada) {
      await supabase.auth.signOut();
      return volverAInvitacion(resultado.motivo);
    }
    return ir(resultado.reemplazo ? "/?vinculada=reemplazo" : "/?vinculada=1");
  }
}
