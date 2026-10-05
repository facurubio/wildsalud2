"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth/usuario-actual";
import { db } from "@/lib/db";
import { crearClienteSupabase } from "@/lib/supabase/server";

// CU-02, pasos 3 y 4: lleva a la persona a Google.
export async function ingresarConGoogle(formData: FormData) {
  const origen = (await headers()).get("origin");
  const destino = formData.get("destino");
  const callback = new URL("/auth/callback", origen ?? undefined);
  if (typeof destino === "string" && destino) callback.searchParams.set("destino", destino);

  const supabase = await crearClienteSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });
  if (error || !data.url) redirect("/ingresar?error=validacion");

  redirect(data.url);
}

// CU-03: cierra la sesión. El cierre queda auditado (D94).
export async function cerrarSesion() {
  const sesion = await obtenerSesion();
  if (sesion.estado === "activa") {
    await db()`
      insert into public.auditoria (usuario_id, accion, entidad, entidad_id)
      values (${sesion.usuario.id}, 'cierre_sesion', 'usuario', ${sesion.usuario.id})
    `;
  }
  const supabase = await crearClienteSupabase();
  await supabase.auth.signOut();
  redirect("/ingresar");
}
