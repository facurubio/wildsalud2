import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { EtiquetaEstado } from "@/components/etiqueta-estado";
import { buttonVariants } from "@/components/ui/button";
import { EstadoCoberturaBadge } from "@/components/mascota/cobertura";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { resumenCobertura } from "@/lib/cobertura/consultas";
import { db } from "@/lib/db";
import { formatearAfiliado } from "@/lib/mascotas/validacion";
import { ahora } from "@/lib/tiempo";
import { formatearFechaHora } from "@/lib/formato";
import { esUuid } from "@/lib/operacion";
import { usuarioDePagina } from "@/lib/pagina";
import { obtenerDueno } from "@/lib/personas/consultas";
import { formatearDireccion, nombreCompleto, textoFormaDePago } from "@/lib/personas/validacion";

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{etiqueta}</dt>
      <dd className="font-medium break-words">{children}</dd>
    </div>
  );
}

export default async function PaginaDueno({ params, searchParams }: PageProps<"/duenos/[id]">) {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const { id } = await params;
  const dueno = esUuid(id) ? await obtenerDueno(id) : null;
  if (!dueno) return <Aviso tipo="error">El dueño ya no está disponible.</Aviso>;

  const nombre = nombreCompleto(dueno);
  const { aviso } = await searchParams;
  const confirmacion =
    aviso === "creado" ? `Se dio de alta a ${nombre}.` : aviso === "editado" ? `Se actualizaron los datos de ${nombre}.` : null;
  const dadoDeBaja = dueno.estadoCuenta === "inactivo";

  // Mascotas del dueño con el estado de su cobertura, calculado en el momento (D54).
  const momento = ahora();
  const filas = await db()<{ id: string; numero_afiliado: number; nombre: string; especie: string; estado: string }[]>`
    select id, numero_afiliado, nombre, especie, estado from public.mascota
    where dueno_id = ${dueno.id}
    order by estado, public.normalizar(nombre)
  `;
  const mascotas = await Promise.all(
    filas.map(async (m) => ({ ...m, resumen: await resumenCobertura(db(), m.id, momento) })),
  );

  return (
    <div className="space-y-6">
      {confirmacion && <Aviso tipo="exito">{confirmacion}</Aviso>}
      <Encabezado
        titulo={nombre}
        descripcion={`DNI ${dueno.dni}`}
        acciones={
          !dadoDeBaja && (
            <Link href={`/duenos/${dueno.id}/editar`} className={buttonVariants({ variant: "outline" })}>
              Editar
            </Link>
          )
        }
      />

      <Card>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Dato etiqueta="Email">{dueno.email}</Dato>
            <Dato etiqueta="Teléfono">{dueno.telefono}</Dato>
            <Dato etiqueta="Dirección">{formatearDireccion(dueno)}</Dato>
            <Dato etiqueta="Forma de pago preferida">{textoFormaDePago(dueno.formaPago)}</Dato>
            <Dato etiqueta="Estado de la cuenta">
              <EtiquetaEstado estado={dueno.estadoCuenta} />
            </Dato>
            <Dato etiqueta="Acceso al sistema">Todavía no ingresa: los dueños no tienen cuenta en esta versión.</Dato>
            {dadoDeBaja && (
              <>
                <Dato etiqueta="Fecha de la baja">{dueno.bajaEn ? formatearFechaHora(dueno.bajaEn) : "—"}</Dato>
                <Dato etiqueta="Motivo de la baja">{dueno.motivoBaja}</Dato>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>Mascotas</CardTitle>
          {!dadoDeBaja && (
            <Link href={`/mascotas/nueva?dueno=${dueno.id}`} className={buttonVariants({ size: "sm" })}>
              Dar de alta mascota
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {mascotas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no tiene mascotas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mascota</TableHead>
                  <TableHead className="hidden sm:table-cell">Afiliado</TableHead>
                  <TableHead>Cobertura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mascotas.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <Link href={`/mascotas/${m.id}`} className="underline-offset-4 hover:underline">
                        {m.nombre}
                      </Link>{" "}
                      <span className="text-muted-foreground">({m.especie})</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{formatearAfiliado(m.numero_afiliado)}</TableCell>
                    <TableCell>
                      {m.estado === "dada_de_baja" ? "Dada de baja" : <EstadoCoberturaBadge estado={m.resumen?.estado ?? null} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Link href="/duenos" className="text-sm underline-offset-4 hover:underline">
        ← Volver a dueños
      </Link>
    </div>
  );
}
