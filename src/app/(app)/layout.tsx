import { redirect } from "next/navigation";
import { Navegacion, type ItemMenu } from "@/components/navegacion";
import { Button } from "@/components/ui/button";
import { obtenerSesion, type UsuarioActual } from "@/lib/auth/usuario-actual";
import { cerrarSesion } from "../ingresar/acciones";

// Opciones del menú según el rol (CU-02 RN-10). Cada bloque agrega las suyas acá.
function itemsDelMenu(usuario: UsuarioActual): ItemMenu[] {
  const items: ItemMenu[] = [{ href: "/", texto: "Inicio" }];
  if (usuario.rol === "administrador") {
    items.push({ href: "/planes", texto: "Planes" }, { href: "/catalogo", texto: "Catálogo de prestaciones" });
  }
  return items;
}

// Pantallas para usuarios con sesión: sin sesión vigente, vuelve al ingreso (CU-02 FA-02).
export default async function LayoutApp({ children }: LayoutProps<"/">) {
  const sesion = await obtenerSesion();
  if (sesion.estado !== "activa") redirect("/ingresar");
  const { usuario } = sesion;

  const pie = (
    <div className="space-y-2 border-t pt-3">
      <p className="px-3 text-sm">
        {usuario.nombre} {usuario.apellido}
      </p>
      <form action={cerrarSesion}>
        <Button type="submit" variant="outline" size="sm" className="w-full">
          Cerrar sesión
        </Button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <Navegacion items={itemsDelMenu(usuario)} pie={pie} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
