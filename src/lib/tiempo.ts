// Fecha y hora de referencia del sistema.
// Todas las reglas de fecha (día 13, día 14, cambio de mes y de año) usan la hora de Argentina (D53).
// El reloj se puede fijar para probar fechas sin esperar meses reales.

export const ZONA_HORARIA = "America/Argentina/Buenos_Aires";

let relojFijo: Date | null = null;

export function ahora(): Date {
  return relojFijo ? new Date(relojFijo) : new Date();
}

// Solo para pruebas.
export function fijarReloj(fecha: Date | null): void {
  relojFijo = fecha ? new Date(fecha) : null;
}

export type FechaArgentina = { anio: number; mes: number; dia: number };

// Año, mes (1-12) y día de un momento, en hora de Argentina.
export function fechaArgentina(momento: Date = ahora()): FechaArgentina {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(momento);
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)!.value);
  return { anio: valor("year"), mes: valor("month"), dia: valor("day") };
}

// Período mensual de un momento: día 1 del mes en formato AAAA-MM-01 (D1).
export function periodoMensual(momento: Date = ahora()): string {
  const { anio, mes } = fechaArgentina(momento);
  return `${anio}-${String(mes).padStart(2, "0")}-01`;
}

// Período anual de un momento: 1 de enero (D30).
export function periodoAnual(momento: Date = ahora()): string {
  return `${fechaArgentina(momento).anio}-01-01`;
}

// Fecha de hoy en hora de Argentina, AAAA-MM-DD.
export function fechaHoy(momento: Date = ahora()): string {
  const { anio, mes, dia } = fechaArgentina(momento);
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}
