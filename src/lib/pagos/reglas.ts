// Reglas de pagos (CU-22, CU-26, CU-28). Funciones puras.
import { versionVigente, type Periodo, type VersionPlan } from "@/lib/cobertura/calculo";
import { formatearPeriodo } from "@/lib/formato";

export type FormaPago = "efectivo" | "transferencia" | "tarjeta_debito" | "tarjeta_credito";

// D59: lista fija.
export const formasDePago: Record<FormaPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia bancaria",
  tarjeta_debito: "Tarjeta de débito",
  tarjeta_credito: "Tarjeta de crédito",
};

export function esFormaDePago(valor: string): valor is FormaPago {
  return valor in formasDePago;
}

export type VersionConPrecio = VersionPlan & { precio: number };

// D6 / CU-22 RN-06 / CU-26 RN-04: el importe de un período es el precio de la versión vigente el día 1
// de ese mes; si el plan se creó durante el mes, el precio con el que se creó.
export function precioDelPeriodo(versiones: VersionConPrecio[], periodo: Periodo): number | null {
  const vigente =
    versionVigente(versiones, periodo) ??
    versiones.filter((v) => !v.descartada).sort((a, b) => (a.vigenteDesde < b.vigenteDesde ? -1 : 1))[0];
  return vigente ? vigente.precio : null;
}

// CU-22 RN-09 / CU-26 RN-08: la fecha de pago puede ser anterior pero no posterior a hoy.
export function validarFechaPago(fecha: string, hoy: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return "Completá el campo fecha de pago.";
  if (fecha > hoy) return "La fecha de pago no puede ser posterior a hoy.";
  return null;
}

// CU-26 RN-01: se pagan los primeros `cantidad` períodos pendientes, en orden y sin saltear.
export function periodosElegidos(pendientes: Periodo[], cantidad: number): { periodos: Periodo[]; error?: never } | { periodos?: never; error: string } {
  if (pendientes.length === 0) return { error: "No hay períodos pendientes." };
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > pendientes.length) {
    return { error: `Los períodos se pagan en orden, empezando por ${formatearPeriodo(pendientes[0])}.` }; // EX-05
  }
  return { periodos: pendientes.slice(0, cantidad) };
}

// CU-26 pasos 10 y FA-01: mensaje según cómo queda la cobertura después del pago.
// Si sigue suspendida, informa cuántos períodos faltan pagar hasta el mes en curso inclusive (D4).
export function mensajePagoRegistrado(mascota: string, sigueSuspendida: boolean, pendientes: Periodo[], periodoActual: Periodo): string {
  if (!sigueSuspendida) return `Pago registrado. La cobertura de ${mascota} está al día.`;
  const n = pendientes.length;
  return `Pago registrado. La cobertura de ${mascota} sigue suspendida: falta pagar ${n} ${n === 1 ? "período" : "períodos"} hasta ${formatearPeriodo(periodoActual)}.`;
}
