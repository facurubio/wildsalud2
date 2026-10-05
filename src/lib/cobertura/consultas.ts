import "server-only";
import type postgres from "postgres";
import { auditar } from "@/lib/operacion";
import type { VersionConPrecio } from "@/lib/pagos/reglas";
import { fechaHoy } from "@/lib/tiempo";
import {
  calcularAntiguedad,
  calcularEstado,
  calcularSaldos,
  periodoDeConsumo,
  periodosAPagar,
  periodosCongelados,
  versionVigente,
  type EstadoCobertura,
  type MovimientoPago,
  type ResultadoEstado,
  type Periodicidad,
  type Periodo,
  type SaldoPrestacion,
} from "./calculo";

type Sql = postgres.Sql | postgres.TransactionSql;

export type CoberturaVigente = {
  id: string;
  mascotaId: string;
  planId: string;
  planNombre: string;
  iniciadaEn: Date;
  estadoGuardado: EstadoCobertura;
  pagos: MovimientoPago[]; // historia de pagos y anulaciones, para calcular el estado
  periodosPagos: Periodo[]; // períodos con pago válido hoy
};

async function movimientosDePago(sql: Sql, coberturaId: string): Promise<MovimientoPago[]> {
  const filas = await sql<{ periodo: string; registrado_en: Date; anulado_en: Date | null }[]>`
    select periodo::text, registrado_en, anulado_en from public.pago where cobertura_id = ${coberturaId}
  `;
  return filas.map((f) => ({ periodo: f.periodo, registradoEn: f.registrado_en, anuladoEn: f.anulado_en }));
}

// La cobertura que no está dada de baja (como máximo una por mascota, D10), con su plan actual
// y los períodos con pago válido. `bloquear` la reserva hasta el final de la transacción.
export async function coberturaVigente(sql: Sql, mascotaId: string, bloquear = false): Promise<CoberturaVigente | null> {
  const [c] = await sql<
    { id: string; mascota_id: string; plan_id: string; plan_nombre: string; iniciada_en: Date; estado: EstadoCobertura }[]
  >`
    select c.id, c.mascota_id, cp.plan_id, p.nombre as plan_nombre, c.iniciada_en, c.estado
    from public.cobertura c
    join public.cobertura_plan cp on cp.cobertura_id = c.id and cp.hasta is null
    join public.plan p on p.id = cp.plan_id
    where c.mascota_id = ${mascotaId} and c.estado <> 'dada_de_baja'
    ${bloquear ? sql`for update of c` : sql``}
  `;
  if (!c) return null;
  const pagos = await movimientosDePago(sql, c.id);
  return {
    id: c.id,
    mascotaId: c.mascota_id,
    planId: c.plan_id,
    planNombre: c.plan_nombre,
    iniciadaEn: c.iniciada_en,
    estadoGuardado: c.estado,
    pagos,
    periodosPagos: pagos.filter((p) => !p.anuladoEn).map((p) => p.periodo),
  };
}

export async function versionesDelPlan(sql: Sql, planId: string): Promise<(VersionConPrecio & { id: string })[]> {
  const filas = await sql<{ id: string; vigente_desde: string; estado: string; precio: string }[]>`
    select id, vigente_desde::text, estado, precio from public.plan_version where plan_id = ${planId}
  `;
  return filas.map((v) => ({
    id: v.id,
    vigenteDesde: v.vigente_desde,
    descartada: v.estado === "descartada",
    precio: Number(v.precio),
  }));
}

// Primera mascota del dueño con deuda: períodos impagos vencidos de una cobertura vigente
// o deuda congelada de una dada de baja, también de mascotas dadas de baja (CU-22 RN-03, D55, D64).
export async function mascotaConDeuda(sql: Sql, duenoId: string, ahora: Date, salvoMascotaId?: string) {
  const coberturas = await sql<
    { id: string; mascota_id: string; nombre: string; iniciada_en: Date; estado: EstadoCobertura; baja_en: Date | null }[]
  >`
    select c.id, c.mascota_id, m.nombre, c.iniciada_en, c.estado, c.baja_en
    from public.cobertura c
    join public.mascota m on m.id = c.mascota_id
    where m.dueno_id = ${duenoId} and m.id is distinct from ${salvoMascotaId ?? null}
    order by public.normalizar(m.nombre)
  `;
  for (const c of coberturas) {
    const pagos = await movimientosDePago(sql, c.id);
    const periodosPagos = pagos.filter((p) => !p.anuladoEn).map((p) => p.periodo);
    const deuda =
      c.estado === "dada_de_baja" && c.baja_en
        ? periodosCongelados({ iniciadaEn: c.iniciada_en, bajaEn: c.baja_en, periodosPagos })
        : calcularEstado({ iniciadaEn: c.iniciada_en, dadaDeBaja: false, pagos }, ahora).periodosAdeudados;
    if (deuda.length > 0) return { mascotaId: c.mascota_id, nombre: c.nombre };
  }
  return null;
}

// M-02: el estado se calcula en cada operación; lo guardado se actualiza cuando cambia, con su auditoría.
// Con una anulación (CU-28 RN-04), la suspensión es inmediata y su fecha es la de la anulación;
// si no, es el vencimiento del período impago más antiguo (el día 14 de ese mes).
export async function sincronizarEstado(
  tx: postgres.TransactionSql,
  cobertura: CoberturaVigente,
  ahora: Date,
  datos: { usuarioId: string; motivo: "pago" | "anulacion_pago" },
): Promise<ResultadoEstado & { pendientes: Periodo[] }> {
  const actualizada = (await coberturaVigente(tx, cobertura.mascotaId)) ?? cobertura;
  const resultado = calcularEstado({ iniciadaEn: cobertura.iniciadaEn, dadaDeBaja: false, pagos: actualizada.pagos }, ahora);
  const conPendientes = { ...resultado, pendientes: periodosAPagar(actualizada, ahora) };
  if (resultado.estado === cobertura.estadoGuardado) return conPendientes;

  if (resultado.estado === "suspendida") {
    const porAnulacion = datos.motivo === "anulacion_pago";
    const suspendidaEn = resultado.suspendidaDesde ?? ahora;
    await tx`
      update public.cobertura
      set estado = 'suspendida', suspendida_en = ${suspendidaEn}, origen_suspension = ${porAnulacion ? "anulacion_pago" : "proceso"}
      where id = ${cobertura.id}
    `;
    await auditar(tx, {
      usuarioId: porAnulacion ? datos.usuarioId : null,
      accion: "suspension",
      entidad: "cobertura",
      entidadId: cobertura.id,
      detalle: { periodos_adeudados: resultado.periodosAdeudados },
    });
  } else {
    await tx`
      update public.cobertura set estado = 'al_dia', suspendida_en = null, origen_suspension = null
      where id = ${cobertura.id}
    `;
    await auditar(tx, { usuarioId: datos.usuarioId, accion: "reactivacion", entidad: "cobertura", entidadId: cobertura.id });
  }
  return conPendientes;
}

export type ResumenCobertura = {
  cobertura: CoberturaVigente;
  estado: EstadoCobertura;
  periodosAdeudados: Periodo[];
  antiguedad: number;
  saldos: SaldoPrestacion[];
  consumosDelPeriodo: { id: string; registradoEn: Date; prestacion: string; veterinaria: string; tipoPrestacionId: string }[];
};

// Estado, antigüedad, saldos y consumos del período en curso de la cobertura vigente (CU-38 pasos 3 a 5).
// Se calcula en el momento de la consulta (D54).
export async function resumenCobertura(sql: Sql, mascotaId: string, ahora: Date): Promise<ResumenCobertura | null> {
  const cobertura = await coberturaVigente(sql, mascotaId);
  if (!cobertura) return null;

  const { estado, periodosAdeudados } = calcularEstado(
    { iniciadaEn: cobertura.iniciadaEn, dadaDeBaja: false, pagos: cobertura.pagos },
    ahora,
  );
  const antiguedad = calcularAntiguedad(cobertura.periodosPagos);

  const versiones = await versionesDelPlan(sql, cobertura.planId);
  const version = versionVigente(versiones, fechaHoy(ahora));
  const prestaciones = version
    ? await sql<
        { tipo_prestacion_id: string; nombre: string; limite: number | null; periodicidad: Periodicidad; periodos_para_habilitar: number }[]
      >`
        select pp.tipo_prestacion_id, t.nombre, pp.limite, pp.periodicidad, pp.periodos_para_habilitar
        from public.plan_prestacion pp
        join public.tipo_prestacion t on t.id = pp.tipo_prestacion_id
        where pp.plan_version_id = ${version.id}
        order by public.normalizar(t.nombre)
      `
    : [];

  // Consumos válidos de la cobertura en el año en curso: alcanzan para los saldos mensuales y anuales.
  const consumos = await sql<
    { id: string; registrado_en: Date; tipo_prestacion_id: string; nombre: string; veterinaria: string; periodo: string; periodicidad: Periodicidad }[]
  >`
    select c.id, c.registrado_en, c.tipo_prestacion_id, t.nombre, c.veterinaria, c.periodo::text, c.periodicidad
    from public.consumo c
    join public.tipo_prestacion t on t.id = c.tipo_prestacion_id
    where c.cobertura_id = ${cobertura.id} and c.estado = 'valido' and c.periodo >= ${periodoDeConsumo("anual", ahora)}
    order by c.registrado_en desc
  `;

  const saldos = calcularSaldos(
    prestaciones.map((p) => ({
      tipoPrestacionId: p.tipo_prestacion_id,
      nombre: p.nombre,
      limite: p.limite,
      periodicidad: p.periodicidad,
      periodosParaHabilitar: p.periodos_para_habilitar,
    })),
    consumos.map((c) => ({ tipoPrestacionId: c.tipo_prestacion_id, periodo: c.periodo })),
    antiguedad,
    ahora,
  );

  // CU-38 paso 5: solo los consumos del período en curso de cada prestación.
  const consumosDelPeriodo = consumos
    .filter((c) => c.periodo === periodoDeConsumo(c.periodicidad, ahora))
    .map((c) => ({
      id: c.id,
      registradoEn: c.registrado_en,
      prestacion: c.nombre,
      veterinaria: c.veterinaria,
      tipoPrestacionId: c.tipo_prestacion_id,
    }));

  return { cobertura, estado, periodosAdeudados, antiguedad, saldos, consumosDelPeriodo };
}
