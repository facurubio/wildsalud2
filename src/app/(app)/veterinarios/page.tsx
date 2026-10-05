import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { EtiquetaEstado } from "@/components/etiqueta-estado";
import { Seleccion } from "@/components/formulario";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearFechaHora } from "@/lib/formato";
import { usuarioDePagina } from "@/lib/pagina";
import { listarVeterinarios, type FiltroEstadoVeterinarios } from "@/lib/personas/consultas";

const FILTROS: { valor: FiltroEstadoVeterinarios; texto: string }[] = [
  { valor: "en_actividad", texto: "En actividad" },
  { valor: "invitado", texto: "Invitados" },
  { valor: "activo", texto: "Activos" },
  { valor: "inactivo", texto: "Dados de baja" },
];

// Lista de veterinarios (CU-04 RN-14): estado de cada uno, con búsqueda por nombre, apellido o DNI y filtro por estado.
export default async function PaginaVeterinarios({ searchParams }: PageProps<"/veterinarios">) {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const parametros = await searchParams;
  const texto = typeof parametros.q === "string" ? parametros.q : "";
  const estado = FILTROS.find((f) => f.valor === parametros.estado)?.valor ?? "en_actividad";
  const veterinarios = await listarVeterinarios({ texto, estado });
  const mostrarBajas = estado === "inactivo";

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Veterinarios"
        acciones={
          <Link href="/veterinarios/nuevo" className={buttonVariants()}>
            Dar de alta veterinario
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
        <Seleccion name="estado" defaultValue={estado} aria-label="Estado de la cuenta" className="sm:w-48">
          {FILTROS.map((f) => (
            <option key={f.valor} value={f.valor}>
              {f.texto}
            </option>
          ))}
        </Seleccion>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      <Card>
        <CardContent>
          {veterinarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {texto || estado !== "en_actividad" ? "No hay veterinarios que coincidan con la búsqueda." : "Todavía no hay veterinarios."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veterinario</TableHead>
                  <TableHead className="hidden sm:table-cell">DNI</TableHead>
                  <TableHead className="hidden sm:table-cell">Veterinaria</TableHead>
                  <TableHead>Estado</TableHead>
                  {mostrarBajas && <TableHead className="hidden sm:table-cell">Fecha de baja</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {veterinarios.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">
                      <Link href={`/veterinarios/${v.id}`} className="underline-offset-4 hover:underline">
                        {v.apellido}, {v.nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{v.dni}</TableCell>
                    <TableCell className="hidden sm:table-cell">{v.veterinaria}</TableCell>
                    <TableCell>
                      <EtiquetaEstado estado={v.estadoCuenta} />
                    </TableCell>
                    {mostrarBajas && (
                      <TableCell className="hidden sm:table-cell">{v.bajaEn ? formatearFechaHora(v.bajaEn) : "—"}</TableCell>
                    )}
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
