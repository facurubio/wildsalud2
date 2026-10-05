import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import {
  ConsumosDelPeriodo,
  EstadoCoberturaBadge,
  TablaPrestaciones,
  alertasDeCobertura,
  textoPeriodos,
} from "@/components/mascota/cobertura";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { periodosAPagar } from "@/lib/cobertura/calculo";
import { resumenCobertura } from "@/lib/cobertura/consultas";
import { db } from "@/lib/db";
import { formatearFecha, formatearImporte, formatearPeriodo } from "@/lib/formato";
import { obtenerDueno, obtenerMascota, pagosDeMascota } from "@/lib/mascotas/consultas";
import { formatearAfiliado, nombreCastrado, nombreSexo } from "@/lib/mascotas/validacion";
import { esUuid } from "@/lib/operacion";
import { usuarioDePagina } from "@/lib/pagina";
import { formasDePago, mensajePagoRegistrado } from "@/lib/pagos/reglas";
import { ahora, periodoMensual } from "@/lib/tiempo";

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="text-sm">{valor || "—"}</dd>
    </div>
  );
}

// Ficha de la mascota para el administrador: datos, dueño, cobertura, prestaciones, consumos y pagos.
export default async function PaginaMascota({ params, searchParams }: PageProps<"/mascotas/[id]">) {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const { id } = await params;
  const mascota = esUuid(id) ? await obtenerMascota(db(), id) : null;
  if (!mascota) return <Aviso tipo="error">La mascota ya no está disponible.</Aviso>;

  const momento = ahora();
  const [dueno, resumen, pagos] = await Promise.all([
    obtenerDueno(db(), mascota.duenoId),
    resumenCobertura(db(), mascota.id, momento),
    pagosDeMascota(mascota.id),
  ]);
  const pendientes = resumen ? periodosAPagar(resumen.cobertura, momento) : [];

  const { aviso } = await searchParams;
  const confirmacion = {
    alta: resumen
      ? `Se dio de alta a ${mascota.nombre} con el número de afiliado ${formatearAfiliado(mascota.numeroAfiliado)} y el plan ${resumen.cobertura.planNombre}.`
      : null,
    editada: `Los datos de ${mascota.nombre} se actualizaron.`,
    pago: resumen ? mensajePagoRegistrado(mascota.nombre, resumen.estado === "suspendida", pendientes, periodoMensual(momento)) : null,
    anulado: "Pago anulado.",
    "anulado-suspendida": `Pago anulado. La cobertura de ${mascota.nombre} quedó suspendida por falta de pago.`,
  }[typeof aviso === "string" ? aviso : ""];

  return (
    <div className="space-y-6">
      {confirmacion && <Aviso tipo="exito">{confirmacion}</Aviso>}
      <Encabezado
        titulo={mascota.nombre}
        descripcion={`Afiliado N.º ${formatearAfiliado(mascota.numeroAfiliado)} · ${mascota.especie}`}
        acciones={
          mascota.estado === "activa" && (
            <Link href={`/mascotas/${mascota.id}/editar`} className={buttonVariants({ variant: "outline" })}>
              Editar
            </Link>
          )
        }
      />
      {mascota.estado === "dada_de_baja" && <Aviso tipo="info">La mascota está dada de baja.</Aviso>}
      {alertasDeCobertura(mascota.nombre, resumen).map((a) => (
        <Aviso key={a} tipo={resumen ? "error" : "info"}>
          {a}
        </Aviso>
      ))}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ficha</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3">
              <Dato etiqueta="Raza" valor={mascota.raza} />
              <Dato etiqueta="Sexo" valor={nombreSexo[mascota.sexo]} />
              <Dato etiqueta="Color" valor={mascota.color} />
              <Dato etiqueta="Castrado/a" valor={nombreCastrado[mascota.castrado]} />
              <Dato etiqueta="Edad aproximada al registrar" valor={`${mascota.edadAproximada} años (${formatearFecha(mascota.altaEn)})`} />
              <Dato etiqueta="Alta" valor={formatearFecha(mascota.altaEn)} />
              <div className="col-span-2">
                <Dato etiqueta="Enfermedades previas o crónicas" valor={mascota.enfermedades} />
              </div>
              <div className="col-span-2">
                <Dato etiqueta="Alimentación" valor={mascota.alimentacion} />
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dueño</CardTitle>
          </CardHeader>
          <CardContent>
            {dueno && (
              <dl className="grid grid-cols-2 gap-3">
                <Dato etiqueta="Nombre" valor={`${dueno.nombre} ${dueno.apellido}`} />
                <Dato etiqueta="DNI" valor={dueno.dni} />
                <Dato etiqueta="Teléfono" valor={dueno.telefono} />
                <Dato etiqueta="Forma de pago preferida" valor={formasDePago[dueno.formaPagoPreferida]} />
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>Cobertura</CardTitle>
          {resumen && pendientes.length > 0 && (
            <Link href={`/mascotas/${mascota.id}/pago`} className={buttonVariants({ size: "sm" })}>
              Registrar pago
            </Link>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <EstadoCoberturaBadge estado={resumen?.estado ?? null} />
            {resumen && (
              <>
                <span>Plan: {resumen.cobertura.planNombre}</span>
                <span className="text-muted-foreground">
                  {resumen.antiguedad} {resumen.antiguedad === 1 ? "período pago" : "períodos pagos"}
                </span>
              </>
            )}
          </div>
          {resumen && resumen.periodosAdeudados.length > 0 && (
            <p className="text-sm">Períodos adeudados: {textoPeriodos(resumen.periodosAdeudados)}.</p>
          )}
          {resumen && pendientes.length > 0 && resumen.periodosAdeudados.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Cuota de {formatearPeriodo(pendientes[0])} pendiente: vence el día 13.
            </p>
          )}
          {resumen && <TablaPrestaciones saldos={resumen.saldos} />}
        </CardContent>
      </Card>

      {resumen && (
        <Card>
          <CardHeader>
            <CardTitle>Consumos del período en curso</CardTitle>
          </CardHeader>
          <CardContent>
            <ConsumosDelPeriodo consumos={resumen.consumosDelPeriodo} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {pagos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin pagos.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha de pago</TableHead>
                  <TableHead className="hidden sm:table-cell">Forma</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos.map((p) => (
                  <TableRow key={p.id} className={p.estado === "anulado" ? "text-muted-foreground" : undefined}>
                    <TableCell>{formatearPeriodo(p.periodo)}</TableCell>
                    <TableCell>{formatearImporte(p.importe)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{p.fechaPago.split("-").reverse().join("/")}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formasDePago[p.formaPago]}</TableCell>
                    <TableCell className="whitespace-normal">
                      {p.estado === "anulado" ? `Anulado: ${p.motivoAnulacion}` : p.esPrimerPago ? "Válido · primer pago" : "Válido"}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.estado === "valido" && !p.esPrimerPago && (
                        <Link href={`/mascotas/${mascota.id}/pagos/${p.id}/anular`} className="text-sm underline-offset-4 hover:underline">
                          Anular
                        </Link>
                      )}
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
