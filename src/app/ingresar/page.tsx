import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { mensajeIngreso } from "@/lib/auth/mensajes";
import { obtenerSesion } from "@/lib/auth/usuario-actual";
import { ingresarConGoogle } from "./acciones";

// CU-02: pantalla de ingreso. Solo Google en la v1 (docs/alcance-v1.md).
export default async function PaginaIngresar({ searchParams }: PageProps<"/ingresar">) {
  const { error, destino } = await searchParams;

  // FA-01: con una sesión vigente va directo a su inicio.
  const sesion = await obtenerSesion();
  if (sesion.estado === "activa") redirect("/");

  const mensaje = mensajeIngreso(typeof error === "string" ? error : undefined);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">WildSalud</h1>
          <p className="text-sm text-muted-foreground">Cobertura de salud para mascotas</p>
        </div>

        {mensaje && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
            {mensaje}
          </p>
        )}

        <form action={ingresarConGoogle}>
          <input type="hidden" name="destino" value={typeof destino === "string" ? destino : ""} />
          <Button type="submit" size="lg" className="w-full">
            Continuar con Google
          </Button>
        </form>
      </div>
    </main>
  );
}
