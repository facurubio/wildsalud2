import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { EtiquetaEstado } from "@/components/etiqueta-estado";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usuarioDePagina } from "@/lib/pagina";
import { listarDuenos } from "@/lib/personas/consultas";

// Lista de dueños, con búsqueda simple por nombre, apellido o DNI. El buscador completo con filtros es CU-33.
export default async function PaginaDuenos({ searchParams }: PageProps<"/duenos">) {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const parametros = await searchParams;
  const texto = typeof parametros.q === "string" ? parametros.q : "";
  const duenos = await listarDuenos(texto);

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Dueños"
        acciones={
          <Link href="/duenos/nuevo" className={buttonVariants()}>
            Dar de alta dueño
          </Link>
        }
      />

      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="q"
          defaultValue={texto}
          placeholder="Buscar por nombre, apellido o DNI"
          aria-label="Buscar por nombre, apellido o DNI"
          autoComplete="off"
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      <Card>
        <CardContent>
          {duenos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {texto ? "No hay dueños que coincidan con la búsqueda." : "Todavía no hay dueños."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dueño</TableHead>
                  <TableHead className="hidden sm:table-cell">DNI</TableHead>
                  <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duenos.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      <Link href={`/duenos/${d.id}`} className="underline-offset-4 hover:underline">
                        {d.apellido}, {d.nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{d.dni}</TableCell>
                    <TableCell className="hidden sm:table-cell">{d.telefono}</TableCell>
                    <TableCell>
                      <EtiquetaEstado estado={d.estadoCuenta} />
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
