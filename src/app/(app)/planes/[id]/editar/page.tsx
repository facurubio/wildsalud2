import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { Card, CardContent } from "@/components/ui/card";
import { esUuid } from "@/lib/operacion";
import { usuarioDePagina } from "@/lib/pagina";
import { obtenerPlan, tiposDelCatalogo } from "@/lib/planes/consultas";
import { editarPlan } from "../../acciones";
import { FormularioPlan } from "../../formulario-plan";

// Edición de la v1: solo mientras ninguna mascota tenga el plan (docs/alcance-v1.md).
export default async function PaginaEditarPlan({ params }: PageProps<"/planes/[id]/editar">) {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const { id } = await params;
  const plan = esUuid(id) ? await obtenerPlan(id) : null;
  if (!plan) return <Aviso tipo="error">El plan ya no está disponible.</Aviso>;
  if (plan.enUso) {
    return (
      <Aviso tipo="error">
        {plan.nombre} ya tiene mascotas asignadas: por ahora no se puede editar. Si necesitás otras condiciones, creá un
        plan nuevo.
      </Aviso>
    );
  }

  return (
    <div className="space-y-6">
      <Encabezado titulo={`Editar ${plan.nombre}`} descripcion="Se puede editar mientras ninguna mascota tenga este plan." />
      <Card>
        <CardContent>
          <FormularioPlan
            accion={editarPlan.bind(null, plan.id)}
            tipos={await tiposDelCatalogo()}
            textoBoton="Guardar cambios"
            inicial={{
              nombre: plan.nombre,
              precio: String(plan.precio).replace(".", ","),
              prestaciones: plan.prestaciones.map((p) => ({
                tipoPrestacionId: p.tipoPrestacionId,
                limite: p.limite === null ? "" : String(p.limite),
                periodicidad: p.periodicidad,
                periodosParaHabilitar: String(p.periodosParaHabilitar),
              })),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
