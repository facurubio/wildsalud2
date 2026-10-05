import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { obtenerSesion } from "@/lib/auth/usuario-actual";
import { nombreRol } from "@/lib/invitaciones/mensajes";

// Pantalla de inicio. Se reemplaza por la de cada rol cuando estén sus casos (CU-02 paso 8).
export default async function PaginaInicio({ searchParams }: PageProps<"/">) {
  const sesion = await obtenerSesion();
  if (sesion.estado !== "activa") return null;
  const { usuario } = sesion;

  // CU-01 paso 10 y FA-02.
  const { vinculada } = await searchParams;
  const avisoVinculacion =
    vinculada === "reemplazo"
      ? "Tu cuenta quedó vinculada. Desde ahora ingresá con Google; la cuenta anterior ya no permite ingresar."
      : vinculada
        ? "Tu cuenta quedó vinculada. Desde ahora ingresá con Google."
        : null;

  return (
    <div className="space-y-6">
      {avisoVinculacion && <Aviso tipo="exito">{avisoVinculacion}</Aviso>}
      <Encabezado
        titulo={`Hola, ${usuario.nombre}`}
        descripcion={`${nombreRol[usuario.rol]}${usuario.rol === "administrador" && usuario.esVeterinario ? " · también veterinario" : ""}`}
      />
    </div>
  );
}
