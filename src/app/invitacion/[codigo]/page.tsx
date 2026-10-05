import { Button } from "@/components/ui/button";
import { obtenerSesion } from "@/lib/auth/usuario-actual";
import { mensajeVinculacion, nombreRol, type MotivoVinculacion } from "@/lib/invitaciones/mensajes";
import { abrirInvitacion } from "@/lib/invitaciones/vincular";
import { vincularConGoogle } from "./acciones";

const motivosDeVuelta: MotivoVinculacion[] = ["cuenta-de-otro-usuario", "validacion"];

// CU-01: la persona abre el enlace de invitación.
export default async function PaginaInvitacion({ params, searchParams }: PageProps<"/invitacion/[codigo]">) {
  const { codigo } = await params;
  const { error } = await searchParams;
  const invitacion = await abrirInvitacion(codigo);
  const sesion = await obtenerSesion();

  // Al volver de Google con un problema que no invalida la invitación (EX-06, EX-07), se puede reintentar.
  const errorDeVuelta = motivosDeVuelta.find((m) => m === error);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-center text-2xl font-semibold tracking-tight">WildSalud</h1>

        {!invitacion.valida ? (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
            {mensajeVinculacion(invitacion.motivo, invitacion.rol)}
          </p>
        ) : (
          <>
            {errorDeVuelta && (
              <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
                {mensajeVinculacion(errorDeVuelta, invitacion.rol)}
              </p>
            )}
            <p className="text-center">
              Hola, {invitacion.nombre}. Te invitaron a WildSalud con el rol {nombreRol[invitacion.rol]}. Elegí con
              qué cuenta vas a ingresar.
            </p>
            {sesion.estado === "activa" && (
              <p className="rounded-md bg-muted px-3 py-2 text-sm">
                Para usar esta invitación, vamos a cerrar la sesión de {sesion.usuario.nombre}{" "}
                {sesion.usuario.apellido}.
              </p>
            )}
            <form action={vincularConGoogle.bind(null, codigo)}>
              <Button type="submit" size="lg" className="w-full">
                Continuar con Google
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
