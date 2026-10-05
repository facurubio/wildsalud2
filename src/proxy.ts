import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Renueva la sesión de Supabase Auth en cada pedido, antes de mostrar la página.
export async function proxy(request: NextRequest) {
  // Si el ingreso falla en Supabase (por ejemplo, se demoró demasiado en Google), Supabase vuelve a la
  // dirección principal con el error: se muestra el mensaje de CU-02 EX-03 en la pantalla de ingreso.
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/" && searchParams.has("error_code")) {
    return NextResponse.redirect(new URL("/ingresar?error=validacion", request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([clave, valor]) => response.headers.set(clave, valor));
        },
      },
    },
  );

  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
