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
import { consumosDeMascota } from "@/lib/atencion/consultas";
import { mensajeConsumoRegistrado, textoPeriodo } from "@/lib/atencion/reglas";
import { periodosAPagar } from "@/lib/cobertura/calculo";
import { resumenCobertura } from "@/lib/cobertura/consultas";
import { db } from "@/lib/db";
import { formatearFecha, formatearFechaHora, formatearImporte, formatearPeriodo } from "@/lib/formato";
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

// Ficha de la mascota. El administrador ve todo (datos, dueño, cobertura, consumos y pagos).
// El veterinario ve lo de CU-38: sin pagos, deuda, dirección ni email del dueño (RN-01, RN-02), y solo consulta (RN-03).
// Quien es veterinario (también el administrador veterinario, D145) puede registrar consumos (CU-39).
export default async function PaginaMascota({ params, searchParams }: PageProps<"/mascotas/[id]">) {
  const acceso = await usuarioDePagina("consulta");
  if (!acceso.usuario) return <Aviso tipo="error">{acceso.error}</Aviso>;
  const { usuario } = acceso;
  const esAdmin = usuario.rol === "administrador";

  const { id } = await params;
  const mascota = esUuid(id) ? await obtenerMascota(db(), id) : null;
  // CU-38 EX-01: el veterinario no ve mascotas dadas de baja.
  if (!mascota || (!esAdmin && mascota.estado === "dada_de_baja")) {
    return <Aviso tipo="error">La mascota ya no está disponible.</Aviso>;
  }

  const momento = ahora();
  const [dueno, resumen, pagos, consumos] = await Promise.all([
    obtenerDueno(db(), mascota.duenoId),
    resumenCobertura(db(), mascota.id, momento),
    esAdmin ? pagosDeMascota(mascota.id) : Promise.resolve([]),
    esAdmin ? consumosDeMascota(mascota.id) : Promise.resolve([]),
  ]);
  const pendientes = resumen ? periodosAPagar(resumen.cobertura, momento) : [];

  const { aviso, prestacion } = await searchParams;
  const saldoConsumido =
    aviso === "consumo" ? resumen?.saldos.find((p) => p.tipoPrestacionId === prestacion) : undefined;
  const consumoRegistrado = saldoConsumido ? mensajeConsumoRegistrado(saldoConsumido) : null;
  const confirmacion = {
    consumo: consumoRegistrado?.mensaje ?? "Consumo registrado.",
    "consumo-anulado": "Consumo anulado.",
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
      {consumoRegistrado?.alerta && <Aviso tipo="info">{consumoRegistrado.alerta}</Aviso>}
      <Encabezado
        titulo={mascota.nombre}
        descripcion={`Afiliado N.º ${formatearAfiliado(mascota.numeroAfiliado)} · ${mascota.especie}`}
        acciones={
          <>
            {usuario.esVeterinario && resumen?.estado === "al_dia" && (
              <Link href={`/mascotas/${mascota.id}/consumo`} className={buttonVariants()}>
                Registrar consumo
              </Link>
            )}
            {esAdmin && mascota.estado === "activa" && (
              <Link href={`/mascotas/${mascota.id}/editar`} className={buttonVariants({ variant: "outline" })}>
                Editar
              </Link>
            )}
          </>
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
                <Dato
                  etiqueta="Nombre"
                  valor={
                    esAdmin ? (
                      <Link href={`/duenos/${dueno.id}`} className="underline-offset-4 hover:underline">
                        {dueno.nombre} {dueno.apellido}
                      </Link>
                    ) : (
                      `${dueno.nombre} ${dueno.apellido}`
                    )
                  }
                />
                <Dato etiqueta="DNI" valor={dueno.dni} />
                <Dato etiqueta="Teléfono" valor={dueno.telefono} />
                {esAdmin && <Dato etiqueta="Forma de pago preferida" valor={formasDePago[dueno.formaPagoPreferida]} />}
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>Cobertura</CardTitle>
          {esAdmin && resumen && pendientes.length > 0 && (
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
          {esAdmin && resumen && resumen.periodosAdeudados.length > 0 && (
            <p className="text-sm">Períodos adeudados: {textoPeriodos(resumen.periodosAdeudados)}.</p>
          )}
          {esAdmin && resumen && pendientes.length > 0 && resumen.periodosAdeudados.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Cuota de {formatearPeriodo(pendientes[0])} pendiente: vence el día 13.
            </p>
          )}
          {resumen && <TablaPrestaciones saldos={resumen.saldos} />}
        </CardContent>
      </Card>

      {!esAdmin && resumen && (
        <Card>
          <CardHeader>
            <CardTitle>Consumos del período en curso</CardTitle>
          </CardHeader>
          <CardContent>
            <ConsumosDelPeriodo consumos={resumen.consumosDelPeriodo} />
          </CardContent>
        </Card>
      )}

      {esAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Consumos</CardTitle>
          </CardHeader>
          <CardContent>
            {consumos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin consumos.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Prestación</TableHead>
                    <TableHead className="hidden sm:table-cell">Período</TableHead>
                    <TableHead className="hidden md:table-cell">Veterinario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consumos.map((c) => (
                    <TableRow key={c.id} className={c.estado === "anulado" ? "text-muted-foreground" : undefined}>
                      <TableCell>{formatearFechaHora(c.registradoEn)}</TableCell>
                      <TableCell>{c.prestacion}</TableCell>
                      <TableCell className="hidden sm:table-cell">{textoPeriodo(c)}</TableCell>
                      <TableCell className="hidden whitespace-normal md:table-cell">
                        {c.veterinario} · {c.veterinaria}
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {c.estado === "anulado" ? `Anulado: ${c.motivoAnulacion}` : "Válido"}
                      </TableCell>
                      <TableCell className="text-right">
                        {c.estado === "valido" && (
                          <Link
                            href={`/mascotas/${mascota.id}/consumos/${c.id}/anular`}
                            className="text-sm underline-offset-4 hover:underline"
                          >
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
      )}

      {esAdmin && (
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
      )}
    </div>
  );
}
