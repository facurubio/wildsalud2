"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_INVITACION } from "@/lib/invitaciones/cookie";
import { crearClienteSupabase } from "@/lib/supabase/server";

// CU-01 pasos 4 y 5: lleva a la persona a Google para vincular su cuenta.
// El código viaja en una cookie del servidor y no en la dirección de vuelta.
export async function vincularConGoogle(codigo: string) {
  const supabase = await crearClienteSupabase();

  // FA-04 / RN-12: si hay una sesión abierta de otro usuario, se cierra antes de seguir.
  await supabase.auth.signOut();

  (await cookies()).set(COOKIE_INVITACION, codigo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth/callback",
    maxAge: 15 * 60,
  });

  const origen = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: new URL("/auth/callback", origen ?? undefined).toString() },
  });
  if (error || !data.url) redirect(`/invitacion/${codigo}?error=validacion`);

  redirect(data.url);
}
