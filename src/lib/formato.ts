import { ZONA_HORARIA } from "@/lib/tiempo";

const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export function formatearImporte(importe: number | string): string {
  return pesos.format(Number(importe));
}

// "15000", "15.000", "15000,50" o "15.000,50" → 15000.5. Devuelve null si no es un importe válido.
export function leerImporte(texto: string): number | null {
  const limpio = texto.replace(/\s|\$/g, "");
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(limpio)) return null;
  return Number(limpio.replace(/\./g, "").replace(",", "."));
}

// Entero positivo escrito en un formulario. Devuelve null si está vacío y NaN si no es válido.
export function leerEntero(texto: string): number | null {
  if (texto === "") return null;
  return /^\d+$/.test(texto) ? Number(texto) : Number.NaN;
}

export function formatearFecha(momento: Date): string {
  return momento.toLocaleDateString("es-AR", { timeZone: ZONA_HORARIA });
}

export function formatearFechaHora(momento: Date): string {
  return momento.toLocaleString("es-AR", { timeZone: ZONA_HORARIA, dateStyle: "short", timeStyle: "short" });
}

// "2026-10-01" → "octubre 2026"
export function formatearPeriodo(periodo: string): string {
  const [anio, mes] = periodo.split("-").map(Number);
  const nombre = new Date(Date.UTC(anio, mes - 1, 15)).toLocaleDateString("es-AR", { month: "long", timeZone: "UTC" });
  return `${nombre} ${anio}`;
}
