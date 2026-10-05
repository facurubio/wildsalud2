import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { obtenerSesion } from "@/lib/auth/usuario-actual";
import { cerrarSesion } from "./ingresar/acciones";

const nombreRol = {
  administrador: "Administrador",
  veterinario: "Veterinario asociado",
  dueno: "Dueño afiliado",
} as const;

// Pantalla de inicio provisoria: confirma que el ingreso funciona.
// Se reemplaza por la pantalla de inicio de cada rol (CU-02 paso 8).
export default async function PaginaInicio() {
  const sesion = await obtenerSesion();
  if (sesion.estado !== "activa") redirect("/ingresar");

  const { usuario } = sesion;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">WildSalud</h1>
        <form action={cerrarSesion}>
          <Button type="submit" variant="outline" size="sm">
            Cerrar sesión
          </Button>
        </form>
      </header>
      <section className="rounded-xl border bg-card p-6">
        <p className="text-lg">
          Hola, {usuario.nombre} {usuario.apellido}
        </p>
        <p className="text-sm text-muted-foreground">
          {nombreRol[usuario.rol]}
          {usuario.rol === "administrador" && usuario.esVeterinario ? " · también veterinario" : ""}
        </p>
      </section>
    </main>
  );
}
