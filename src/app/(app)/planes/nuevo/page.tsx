import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { Card, CardContent } from "@/components/ui/card";
import { usuarioDePagina } from "@/lib/pagina";
import { tiposDelCatalogo } from "@/lib/planes/consultas";
import { crearPlan } from "../acciones";
import { FormularioPlan } from "../formulario-plan";

// CU-16 Crear plan.
export default async function PaginaNuevoPlan() {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  return (
    <div className="space-y-6">
      <Encabezado titulo="Crear plan" descripcion="El plan rige desde que se crea y se puede asignar enseguida." />
      <Card>
        <CardContent>
          <FormularioPlan accion={crearPlan} tipos={await tiposDelCatalogo()} textoBoton="Crear plan" />
        </CardContent>
      </Card>
    </div>
  );
}
