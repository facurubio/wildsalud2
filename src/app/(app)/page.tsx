import { redirect } from "next/navigation";

// La pantalla de inicio de veterinarios y administradores es la búsqueda de mascotas (CU-02 paso 8, CU-37).
// El panel global del administrador (CU-32) llega después de la v1.
export default async function PaginaInicio({ searchParams }: PageProps<"/">) {
  const { vinculada } = await searchParams;
  redirect(typeof vinculada === "string" ? `/mascotas?vinculada=${encodeURIComponent(vinculada)}` : "/mascotas");
}
