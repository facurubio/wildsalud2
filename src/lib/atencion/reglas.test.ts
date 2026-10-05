import { describe, expect, it } from "vitest";
import type { SaldoPrestacion } from "@/lib/cobertura/calculo";
import { interpretarBusqueda, mensajeConsumoRegistrado, validarConsumo, type ValidacionConsumo } from "./reglas";

describe("CU-37 interpretarBusqueda (RN-02)", () => {
  it.each([
    ["000123", { tipo: "afiliado", numero: 123 }],
    ["123", { tipo: "afiliado", numero: 123 }],
    ["30111222", { tipo: "dni", dni: "30111222" }],
    ["30.111.222", { tipo: "dni", dni: "30111222" }],
    ["luna", { tipo: "texto", texto: "luna" }],
    ["  GOME ", { tipo: "texto", texto: "GOME" }],
    ["lu", { tipo: "invalido" }],
    ["", { tipo: "invalido" }],
  ])("%j", (entrada, esperado) => {
    expect(interpretarBusqueda(entrada)).toEqual(esperado);
  });
});

const saldo = (cambios: Partial<SaldoPrestacion> = {}): SaldoPrestacion => ({
  tipoPrestacionId: "consulta",
  nombre: "Consulta",
  limite: 2,
  periodicidad: "mensual",
  periodosParaHabilitar: 1,
  periodo: "2026-10-01",
  consumidas: 0,
  saldo: 2,
  estado: "disponible",
  periodosQueFaltan: 0,
  ...cambios,
});

const datos = (cambios: Partial<ValidacionConsumo> = {}): ValidacionConsumo => ({
  nombreMascota: "Luna",
  plan: "Plan Base",
  estado: "al_dia",
  antiguedad: 4,
  saldos: [saldo()],
  tipoPrestacionId: "consulta",
  nombrePrestacion: "Consulta",
  ...cambios,
});

describe("CU-39 validarConsumo (RN-01 a RN-05)", () => {
  it("con cobertura al día y saldo, se puede registrar", () => {
    expect(validarConsumo(datos()).saldo?.tipoPrestacionId).toBe("consulta");
  });

  it("EX-02: sin cobertura vigente", () => {
    expect(validarConsumo(datos({ estado: null, plan: null })).error).toBe("Luna no tiene una cobertura vigente.");
  });

  it("EX-01: cobertura suspendida (se informa antes que el saldo)", () => {
    expect(validarConsumo(datos({ estado: "suspendida", saldos: [saldo({ estado: "agotada", saldo: 0 })] })).error).toBe(
      "La cobertura de Luna está suspendida por falta de pago.",
    );
  });

  it("EX-03: prestación que no está en el plan", () => {
    expect(validarConsumo(datos({ tipoPrestacionId: "cirugia", nombrePrestacion: "Cirugía" })).error).toBe(
      "Cirugía no está incluida en el plan Plan Base.",
    );
  });

  it("EX-04: no habilitada por antigüedad", () => {
    const radiografia = saldo({ nombre: "Radiografía", estado: "no_habilitada", periodosParaHabilitar: 6, periodosQueFaltan: 2 });
    expect(validarConsumo(datos({ saldos: [radiografia] })).error).toBe("Radiografía se habilita con 6 períodos pagos; Luna tiene 4.");
  });

  it("EX-05: agotada en el período", () => {
    expect(validarConsumo(datos({ saldos: [saldo({ estado: "agotada", saldo: 0, consumidas: 2 })] })).error).toBe(
      "Consulta está agotada para el período 2026-10.",
    );
  });
});

describe("CU-39 mensajeConsumoRegistrado (paso 9, FA-01, FA-02)", () => {
  it("muestra el saldo restante", () => {
    expect(mensajeConsumoRegistrado(saldo({ saldo: 1 }))).toEqual({
      mensaje: "Consumo registrado: Consulta. Saldo del período: 1.",
      alerta: null,
    });
  });

  it("FA-01: avisa cuando se agota", () => {
    expect(mensajeConsumoRegistrado(saldo({ saldo: 0 })).alerta).toBe("Se agotó Consulta para el período 2026-10");
  });

  it("FA-02: ilimitada", () => {
    expect(mensajeConsumoRegistrado(saldo({ nombre: "Vacuna", limite: null, saldo: null })).mensaje).toBe(
      "Consumo registrado: Vacuna. Saldo del período: Ilimitada.",
    );
  });
});
