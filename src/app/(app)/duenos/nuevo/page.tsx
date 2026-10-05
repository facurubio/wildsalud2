import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { Card, CardContent } from "@/components/ui/card";
import { usuarioDePagina } from "@/lib/pagina";
import { altaDueno } from "../acciones";
import { FormularioDueno } from "../formulario-dueno";

// CU-08 Dar de alta dueño.
export default async function PaginaNuevoDueno() {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Dar de alta dueño"
        descripcion="Los dueños todavía no ingresan al sistema: se cargan sus datos y no se les envía ninguna invitación."
      />
      <Card>
        <CardContent>
          <FormularioDueno accion={altaDueno} textoBoton="Dar de alta" />
        </CardContent>
      </Card>
      <Link href="/duenos" className="text-sm underline-offset-4 hover:underline">
        Cancelar
      </Link>
    </div>
  );
}
