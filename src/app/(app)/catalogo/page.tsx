import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { Campo, Formulario } from "@/components/formulario";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { LARGO_DESCRIPCION, LARGO_NOMBRE } from "@/lib/catalogo/validacion";
import { db } from "@/lib/db";
import { usuarioDePagina } from "@/lib/pagina";
import { crearTipoPrestacion } from "./acciones";

// Catálogo de prestaciones: lista de tipos y CU-20 Crear tipo.
export default async function PaginaCatalogo() {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const tipos = await db()<{ id: string; nombre: string; descripcion: string | null }[]>`
    select id, nombre, descripcion from public.tipo_prestacion order by public.normalizar(nombre)
  `;

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Catálogo de prestaciones"
        descripcion="Los tipos de prestación que se pueden incluir en los planes. El límite y la periodicidad se definen en cada plan."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardContent>
            {tipos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no hay tipos de prestación. Creá el primero para poder armar los planes.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prestación</TableHead>
                    <TableHead>Descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tipos.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.nombre}</TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">{t.descripcion}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crear tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <Formulario accion={crearTipoPrestacion} textoBoton="Agregar al catálogo" reiniciarAlTerminar>
              <Campo etiqueta="Nombre" htmlFor="nombre">
                <Input id="nombre" name="nombre" maxLength={LARGO_NOMBRE} placeholder="Ej.: Consulta" />
              </Campo>
              <Campo etiqueta="Descripción (opcional)" htmlFor="descripcion">
                <Textarea id="descripcion" name="descripcion" maxLength={LARGO_DESCRIPCION} rows={3} />
              </Campo>
            </Formulario>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
