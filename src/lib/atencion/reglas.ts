// Reglas de la atención veterinaria (CU-37 y CU-39). Funciones puras.
import type { EstadoCobertura, SaldoPrestacion } from "@/lib/cobertura/calculo";

export const MENSAJE_BUSQUEDA_CORTA =
  "Podés buscar por nombre de la mascota, número de afiliado de la mascota, DNI del dueño o apellido del dueño. Para el nombre o el apellido, ingresá al menos 3 letras.";

export type CriterioBusqueda =
  | { tipo: "afiliado"; numero: number }
  | { tipo: "dni"; dni: string }
  | { tipo: "texto"; texto: string }
  | { tipo: "invalido" };

// CU-37 RN-02: número de afiliado y DNI, coincidencia exacta; nombre o apellido, parcial con al menos 3 letras.
// Un número de hasta 6 dígitos es un número de afiliado (se muestra como 000123); uno de 7 u 8, un DNI
// (se aceptan puntos).
export function interpretarBusqueda(entrada: string): CriterioBusqueda {
  const texto = entrada.trim();
  const soloDigitos = texto.replace(/\./g, "");
  if (/^\d{1,6}$/.test(soloDigitos) && !texto.includes(".")) return { tipo: "afiliado", numero: Number(soloDigitos) };
  if (/^\d{7,8}$/.test(soloDigitos)) return { tipo: "dni", dni: soloDigitos };
  const letras = texto.replace(/[^\p{L}]/gu, "");
  if (letras.length < 3) return { tipo: "invalido" };
  return { tipo: "texto", texto };
}

export const POR_PAGINA = 20;

export type ValidacionConsumo = {
  nombreMascota: string;
  plan: string | null;
  estado: EstadoCobertura | null; // null: sin cobertura vigente
  antiguedad: number;
  saldos: SaldoPrestacion[];
  tipoPrestacionId: string;
  nombrePrestacion: string;
};

// CU-39 RN-05: se valida cobertura activa (RN-01) → prestación incluida (RN-02) → habilitación (RN-03) → saldo (RN-04),
// y se informa el primer motivo que falla.
export function validarConsumo(d: ValidacionConsumo): { saldo: SaldoPrestacion; error?: never } | { saldo?: never; error: string } {
  if (d.estado === null || d.estado === "dada_de_baja" || !d.plan) {
    return { error: `${d.nombreMascota} no tiene una cobertura vigente.` }; // EX-02
  }
  if (d.estado === "suspendida") return { error: `La cobertura de ${d.nombreMascota} está suspendida por falta de pago.` }; // EX-01
  const saldo = d.saldos.find((s) => s.tipoPrestacionId === d.tipoPrestacionId);
  if (!saldo) return { error: `${d.nombrePrestacion} no está incluida en el plan ${d.plan}.` }; // EX-03
  if (saldo.estado === "no_habilitada") {
    return {
      error: `${saldo.nombre} se habilita con ${saldo.periodosParaHabilitar} períodos pagos; ${d.nombreMascota} tiene ${d.antiguedad}.`,
    }; // EX-04
  }
  if (saldo.estado === "agotada") return { error: `${saldo.nombre} está agotada para el período ${textoPeriodo(saldo)}.` }; // EX-05
  return { saldo };
}

// Período como lo muestran los mensajes: AAAA-MM si es mensual, AAAA si es anual.
export function textoPeriodo(saldo: Pick<SaldoPrestacion, "periodicidad" | "periodo">): string {
  return saldo.periodicidad === "mensual" ? saldo.periodo.slice(0, 7) : saldo.periodo.slice(0, 4);
}

// CU-39 paso 9 y FA-01, FA-02: confirmación con el saldo que queda.
export function mensajeConsumoRegistrado(saldoDespues: Pick<SaldoPrestacion, "nombre" | "saldo" | "periodicidad" | "periodo">): {
  mensaje: string;
  alerta: string | null;
} {
  const restante = saldoDespues.saldo === null ? "Ilimitada" : String(saldoDespues.saldo);
  return {
    mensaje: `Consumo registrado: ${saldoDespues.nombre}. Saldo del período: ${restante}.`,
    alerta: saldoDespues.saldo === 0 ? `Se agotó ${saldoDespues.nombre} para el período ${textoPeriodo(saldoDespues)}` : null,
  };
}
