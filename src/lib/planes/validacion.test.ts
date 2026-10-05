import { describe, expect, it } from "vitest";
import { mismasCondiciones, validarPlan, type DatosPlanFormulario } from "./validacion";

const tipos = new Map([
  ["consulta", "Consulta"],
  ["vacuna", "Vacuna"],
]);

const fila = (cambios: Partial<DatosPlanFormulario["prestaciones"][number]> = {}) => ({
  tipoPrestacionId: "consulta",
  limite: "2",
  periodicidad: "mensual",
  periodosParaHabilitar: "1",
  ...cambios,
});

const plan = (cambios: Partial<DatosPlanFormulario> = {}): DatosPlanFormulario => ({
  nombre: "Plan Base",
  precio: "10.000",
  prestaciones: [fila(), fila({ tipoPrestacionId: "vacuna", limite: "" })],
  ...cambios,
});

describe("CU-16 validar plan", () => {
  it("normaliza un plan válido; límite vacío es ilimitada (RN-02)", () => {
    expect(validarPlan(plan(), tipos)).toEqual({
      plan: {
        nombre: "Plan Base",
        precio: 10000,
        prestaciones: [
          { tipoPrestacionId: "consulta", limite: 2, periodicidad: "mensual", periodosParaHabilitar: 1 },
          { tipoPrestacionId: "vacuna", limite: null, periodicidad: "mensual", periodosParaHabilitar: 1 },
        ],
      },
    });
  });

  it.each([
    [{ nombre: "  " }, "Completá el campo nombre."],
    [{ precio: "" }, "Completá el campo precio."],
  ])("EX-01: falta un dato %#", (cambios, error) => {
    expect(validarPlan(plan(cambios), tipos).error).toBe(error);
  });

  it.each(["0", "-5", "abc", "0,00"])("EX-03: precio %j", (precio) => {
    expect(validarPlan(plan({ precio }), tipos).error).toBe("El precio tiene que ser mayor que cero.");
  });

  it("EX-04: sin prestaciones", () => {
    expect(validarPlan(plan({ prestaciones: [] }), tipos).error).toBe("Agregá al menos una prestación al plan.");
  });

  it("EX-05: la misma prestación dos veces", () => {
    expect(validarPlan(plan({ prestaciones: [fila(), fila({ limite: "3" })] }), tipos).error).toBe(
      "Consulta ya está en el plan.",
    );
  });

  it.each([
    [{ limite: "0" }],
    [{ limite: "1.5" }],
    [{ periodosParaHabilitar: "0" }],
    [{ periodosParaHabilitar: "" }],
  ])("EX-06: valores inválidos %#", (cambios) => {
    expect(validarPlan(plan({ prestaciones: [fila(cambios)] }), tipos).error).toBe(
      "Revisá los valores de Consulta: el límite tiene que ser mayor que cero y los períodos pagos, 1 o más.",
    );
  });
});

describe("mismasCondiciones", () => {
  const base = validarPlan(plan(), tipos).plan!;

  it("el orden de las prestaciones no importa", () => {
    expect(mismasCondiciones(base, { ...base, prestaciones: [...base.prestaciones].reverse() })).toBe(true);
  });

  it("un precio o un límite distinto son condiciones distintas", () => {
    expect(mismasCondiciones(base, { ...base, precio: 12000 })).toBe(false);
    expect(mismasCondiciones(base, { ...base, prestaciones: [{ ...base.prestaciones[0], limite: 3 }, base.prestaciones[1]] })).toBe(
      false,
    );
  });
});
