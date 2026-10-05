"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

// CU-03: cierra la sesión.
export async function cerrarSesion() {
  const supabase = await crearClienteSupabase();
  await supabase.auth.signOut();
  redirect("/ingresar");
}
