import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearImporte } from "@/lib/formato";
import { esUuid } from "@/lib/operacion";
import { usuarioDePagina } from "@/lib/pagina";
import { obtenerPlan } from "@/lib/planes/consultas";

export default async function PaginaPlan({ params, searchParams }: PageProps<"/planes/[id]">) {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const { id } = await params;
  const plan = esUuid(id) ? await obtenerPlan(id) : null;
  if (!plan) return <Aviso tipo="error">El plan ya no está disponible.</Aviso>;

  const { aviso } = await searchParams;
  const confirmacion =
    aviso === "creado" ? `Se creó el plan ${plan.nombre}.` : aviso === "editado" ? "Se guardaron los cambios del plan." : null;

  return (
    <div className="space-y-6">
      {confirmacion && <Aviso tipo="exito">{confirmacion}</Aviso>}
      <Encabezado
        titulo={plan.nombre}
        descripcion={`${formatearImporte(plan.precio)} por mes · ${plan.estado === "activo" ? "Activo" : "Inactivo"}`}
        acciones={
          !plan.enUso && (
            <Link href={`/planes/${plan.id}/editar`} className={buttonVariants({ variant: "outline" })}>
              Editar
            </Link>
          )
        }
      />
      {plan.enUso && (
        <Aviso tipo="info">
          Este plan ya tiene mascotas asignadas: por ahora no se puede editar. Si necesitás otras condiciones, creá un
          plan nuevo.
        </Aviso>
      )}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prestación</TableHead>
                <TableHead>Límite</TableHead>
                <TableHead>Periodicidad</TableHead>
                <TableHead>Se habilita con</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plan.prestaciones.map((p) => (
                <TableRow key={p.tipoPrestacionId}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell>{p.limite ?? "Ilimitada"}</TableCell>
                  <TableCell>{p.periodicidad === "mensual" ? "Mensual" : "Anual"}</TableCell>
                  <TableCell>
                    {p.periodosParaHabilitar} {p.periodosParaHabilitar === 1 ? "mes pago" : "meses pagos"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Link href="/planes" className="text-sm underline-offset-4 hover:underline">
        ← Volver a planes
      </Link>
    </div>
  );
}
