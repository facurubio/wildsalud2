import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearImporte } from "@/lib/formato";
import { usuarioDePagina } from "@/lib/pagina";
import { listarPlanes } from "@/lib/planes/consultas";

export default async function PaginaPlanes() {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const planes = await listarPlanes();

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Planes"
        acciones={
          <Link href="/planes/nuevo" className={buttonVariants()}>
            Crear plan
          </Link>
        }
      />
      <Card>
        <CardContent>
          {planes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay planes.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Precio mensual</TableHead>
                  <TableHead className="hidden sm:table-cell">Prestaciones</TableHead>
                  <TableHead className="hidden sm:table-cell">Mascotas</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planes.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link href={`/planes/${p.id}`} className="underline-offset-4 hover:underline">
                        {p.nombre}
                      </Link>
                    </TableCell>
                    <TableCell>{p.precio ? formatearImporte(p.precio) : "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{p.cantidadPrestaciones}</TableCell>
                    <TableCell className="hidden sm:table-cell">{p.cantidadMascotas}</TableCell>
                    <TableCell>
                      <Badge variant={p.estado === "activo" ? "default" : "secondary"}>
                        {p.estado === "activo" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
