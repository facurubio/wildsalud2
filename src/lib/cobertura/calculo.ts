// Cálculo de la cobertura de una mascota en un momento dado. Funciones puras: no leen la base ni el reloj.
// El estado se calcula con la fecha y hora de cada consulta u operación (D54), en hora de Argentina (D53).

import { fechaArgentina, periodoAnual, periodoMensual } from "@/lib/tiempo";

export type Periodicidad = "mensual" | "anual";
export type EstadoCobertura = "al_dia" | "suspendida" | "dada_de_baja";

// Período como texto AAAA-MM-01 (D1).
export type Periodo = string;

const DIA_DE_SUSPENSION = 14; // D1, D17: la cuota vence el 13; el 14 sin pago, se suspende.

function sumarMeses(periodo: Periodo, meses: number): Periodo {
  const [anio, mes] = periodo.split("-").map(Number);
  const total = anio * 12 + (mes - 1) + meses;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01`;
}

// Períodos desde el mes de inicio hasta el mes de `hasta`, inclusive.
export function periodosEntre(desde: Periodo, hasta: Periodo): Periodo[] {
  const periodos: Periodo[] = [];
  for (let p = desde; p <= hasta; p = sumarMeses(p, 1)) periodos.push(p);
  return periodos;
}

// Un pago de la cobertura con su historia: cuándo se registró y, si se anuló, cuándo.
export type MovimientoPago = { periodo: Periodo; registradoEn: Date; anuladoEn: Date | null };

export type DatosEstado = {
  iniciadaEn: Date;
  dadaDeBaja: boolean;
  pagos: MovimientoPago[];
};

export type ResultadoEstado = {
  estado: EstadoCobertura;
  // Períodos vencidos sin pago: los meses anteriores al actual y, desde el día 14, también el actual.
  periodosAdeudados: Periodo[];
  // Desde cuándo está suspendida (la primera suspensión sin reactivación; de acá se cuenta el plazo de D8/D67).
  suspendidaDesde: Date | null;
};

// Períodos con un pago válido en un momento dado.
export function periodosPagosEn(pagos: MovimientoPago[], momento: Date): Periodo[] {
  return pagos
    .filter((p) => p.registradoEn <= momento && (!p.anuladoEn || p.anuladoEn > momento))
    .map((p) => p.periodo);
}

function vencido(periodo: Periodo, momento: Date): boolean {
  const actual = periodoMensual(momento);
  return periodo < actual || (periodo === actual && fechaArgentina(momento).dia >= DIA_DE_SUSPENSION);
}

// Estado de la cobertura en `ahora`, reconstruido con la historia de vencimientos, pagos y anulaciones
// (así no depende de que los procesos automáticos se hayan ejecutado, D54):
// - Se suspende a las 00:00 del día 14 de un mes sin pago (CU-44 RN-01, D17), o en el momento en que se anula
//   el pago de un período ya vencido (CU-28 RN-04, D36).
// - Una cobertura suspendida vuelve a estar al día recién cuando no queda ningún período impago hasta el mes en
//   curso inclusive, en el momento de ese pago (CU-26 RN-06, D4, D5). Pagar solo la deuda vencida no alcanza.
export function calcularEstado(datos: DatosEstado, ahora: Date): ResultadoEstado {
  const pagosAhora = new Set(periodosPagosEn(datos.pagos, ahora));
  const periodos = periodosEntre(periodoMensual(datos.iniciadaEn), periodoMensual(ahora));
  const periodosAdeudados = periodos.filter((p) => !pagosAhora.has(p) && vencido(p, ahora));
  if (datos.dadaDeBaja) return { estado: "dada_de_baja", periodosAdeudados: [], suspendidaDesde: null };

  type Evento = { momento: Date; orden: number; aplicar: (pagos: Set<Periodo>) => void; periodo: Periodo };
  const eventos: Evento[] = [];
  for (const pago of datos.pagos) {
    if (pago.registradoEn <= ahora) eventos.push({ momento: pago.registradoEn, orden: 0, periodo: pago.periodo, aplicar: (s) => s.add(pago.periodo) });
    if (pago.anuladoEn && pago.anuladoEn <= ahora) {
      eventos.push({ momento: pago.anuladoEn, orden: 1, periodo: pago.periodo, aplicar: (s) => s.delete(pago.periodo) });
    }
  }
  for (const periodo of periodos) {
    const vence = vencimientoDelPeriodo(periodo);
    if (vence >= datos.iniciadaEn && vence <= ahora) eventos.push({ momento: vence, orden: 2, periodo, aplicar: () => {} });
  }
  eventos.sort((a, b) => a.momento.getTime() - b.momento.getTime() || a.orden - b.orden);

  const pagos = new Set<Periodo>();
  let suspendidaDesde: Date | null = null;
  for (const evento of eventos) {
    evento.aplicar(pagos);
    if (evento.orden === 0 && suspendidaDesde) {
      // Reactivación: todo pago hasta el mes en curso inclusive (del momento del pago).
      const hasta = periodoMensual(evento.momento);
      if (periodos.filter((p) => p <= hasta).every((p) => pagos.has(p))) suspendidaDesde = null;
    } else if (evento.orden === 1 && !suspendidaDesde && vencido(evento.periodo, evento.momento)) {
      suspendidaDesde = evento.momento; // anulación de un período vencido
    } else if (evento.orden === 2 && !suspendidaDesde && !pagos.has(evento.periodo)) {
      suspendidaDesde = evento.momento; // vencimiento sin pago
    }
  }

  return { estado: suspendidaDesde ? "suspendida" : "al_dia", periodosAdeudados, suspendidaDesde };
}

// D11, D12: la antigüedad es la cantidad de períodos pagos de la cobertura, sin importar cuándo se pagaron.
export function calcularAntiguedad(periodosPagos: Periodo[]): number {
  return new Set(periodosPagos).size;
}

// Período al que descuenta un consumo según la periodicidad de la prestación (D30).
export function periodoDeConsumo(periodicidad: Periodicidad, momento: Date): Periodo {
  return periodicidad === "mensual" ? periodoMensual(momento) : periodoAnual(momento);
}

export type VersionPlan = { id: string; vigenteDesde: string; descartada: boolean };

// M-05: rige la versión no descartada con el `vigenteDesde` más reciente que no sea posterior a la fecha.
export function versionVigente<V extends VersionPlan>(versiones: V[], fecha: string): V | null {
  return (
    versiones
      .filter((v) => !v.descartada && v.vigenteDesde <= fecha)
      .sort((a, b) => (a.vigenteDesde < b.vigenteDesde ? 1 : -1))[0] ?? null
  );
}

export type PrestacionDelPlan = {
  tipoPrestacionId: string;
  nombre: string;
  limite: number | null; // vacío: ilimitada (D32)
  periodicidad: Periodicidad;
  periodosParaHabilitar: number;
};

export type ConsumoValido = { tipoPrestacionId: string; periodo: Periodo };

export type EstadoPrestacion = "disponible" | "agotada" | "no_habilitada";

export type SaldoPrestacion = PrestacionDelPlan & {
  periodo: Periodo;
  consumidas: number;
  saldo: number | null; // null: ilimitada
  estado: EstadoPrestacion;
  periodosQueFaltan: number;
};

// CU-38 paso 4 y CU-39 RN-03, RN-04: consumidas en el período, saldo y estado de cada prestación.
// Saldo = límite − consumos válidos del período; nunca negativo. No se acumula entre períodos (CU-16 RN-03).
export function calcularSaldos(
  prestaciones: PrestacionDelPlan[],
  consumos: ConsumoValido[],
  antiguedad: number,
  ahora: Date,
): SaldoPrestacion[] {
  return prestaciones.map((p) => {
    const periodo = periodoDeConsumo(p.periodicidad, ahora);
    const consumidas = consumos.filter((c) => c.tipoPrestacionId === p.tipoPrestacionId && c.periodo === periodo).length;
    const saldo = p.limite === null ? null : Math.max(0, p.limite - consumidas);
    const periodosQueFaltan = Math.max(0, p.periodosParaHabilitar - antiguedad);
    const estado: EstadoPrestacion =
      periodosQueFaltan > 0 ? "no_habilitada" : saldo === 0 ? "agotada" : "disponible";
    return { ...p, periodo, consumidas, saldo, estado, periodosQueFaltan };
  });
}

// D27: al darse de baja, quedan como deuda congelada los períodos impagos vencidos antes del mes de la baja.
export function periodosCongelados(
  datos: { iniciadaEn: Date; bajaEn: Date; periodosPagos: Periodo[] },
): Periodo[] {
  const pagos = new Set(datos.periodosPagos);
  const mesDeBaja = periodoMensual(datos.bajaEn);
  return periodosEntre(periodoMensual(datos.iniciadaEn), mesDeBaja).filter((p) => p < mesDeBaja && !pagos.has(p));
}

// Momento en que vence un período impago: el día 14 a las 00:00 de ese mes, hora de Argentina (D1).
export function vencimientoDelPeriodo(periodo: Periodo): Date {
  return new Date(`${periodo.slice(0, 8)}${DIA_DE_SUSPENSION}T00:00:00-03:00`);
}

// Períodos que se pueden pagar de una cobertura vigente (CU-26 RN-02): los impagos desde el más antiguo
// hasta el mes en curso inclusive, nunca meses futuros.
export function periodosAPagar(datos: { iniciadaEn: Date; periodosPagos: Periodo[] }, ahora: Date): Periodo[] {
  const pagos = new Set(datos.periodosPagos);
  return periodosEntre(periodoMensual(datos.iniciadaEn), periodoMensual(ahora)).filter((p) => !pagos.has(p));
}
