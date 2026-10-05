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

export type DatosEstado = {
  iniciadaEn: Date;
  dadaDeBaja: boolean;
  periodosPagos: Periodo[]; // períodos con un pago válido de esta cobertura
};

export type ResultadoEstado = {
  estado: EstadoCobertura;
  // Períodos vencidos sin pago: los meses anteriores al actual y, desde el día 14, también el actual.
  periodosAdeudados: Periodo[];
};

// RN-01 de CU-39 y CU-44: del 1 al 13 sigue al día aunque no esté paga la cuota del mes;
// desde las 00:00 del 14 sin pago del mes, está suspendida. Un mes anterior impago también la suspende
// (por ejemplo, después de anular un pago, D36).
export function calcularEstado(datos: DatosEstado, ahora: Date): ResultadoEstado {
  if (datos.dadaDeBaja) return { estado: "dada_de_baja", periodosAdeudados: [] };

  const actual = periodoMensual(ahora);
  const pagos = new Set(datos.periodosPagos);
  const venceElActual = fechaArgentina(ahora).dia >= DIA_DE_SUSPENSION;

  const periodosAdeudados = periodosEntre(periodoMensual(datos.iniciadaEn), actual).filter(
    (p) => !pagos.has(p) && (p < actual || venceElActual),
  );

  return { estado: periodosAdeudados.length > 0 ? "suspendida" : "al_dia", periodosAdeudados };
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
