import { describe, expect, it } from "vitest";
import { mensajePagoRegistrado, periodosElegidos, precioDelPeriodo, validarFechaPago } from "./reglas";

describe("precioDelPeriodo (D6, CU-22 RN-06)", () => {
  const versiones = [
    { id: "v1", vigenteDesde: "2026-10-07", descartada: false, precio: 10000 },
    { id: "v2", vigenteDesde: "2026-12-01", descartada: false, precio: 12000 },
  ];

  it("un plan creado durante el mes cobra ese mes el precio con el que se creó", () => {
    expect(precioDelPeriodo(versiones, "2026-10-01")).toBe(10000);
  });

  it("cada período se paga con la versión vigente el día 1", () => {
    expect(precioDelPeriodo(versiones, "2026-11-01")).toBe(10000);
    expect(precioDelPeriodo(versiones, "2026-12-01")).toBe(12000);
  });

  it("las versiones descartadas no cuentan", () => {
    expect(precioDelPeriodo([{ ...versiones[0], descartada: true }], "2026-10-01")).toBeNull();
  });
});

describe("validarFechaPago (CU-22 RN-09, CU-26 RN-08)", () => {
  it.each([
    ["2026-10-20", null],
    ["2026-10-01", null],
    ["2026-10-21", "La fecha de pago no puede ser posterior a hoy."],
    ["", "Completá el campo fecha de pago."],
  ])("%j", (fecha, error) => {
    expect(validarFechaPago(fecha, "2026-10-20")).toBe(error);
  });
});

describe("periodosElegidos (CU-26 RN-01)", () => {
  const pendientes = ["2026-11-01", "2026-12-01", "2027-01-01"];

  it("se pagan los primeros en orden", () => {
    expect(periodosElegidos(pendientes, 2).periodos).toEqual(["2026-11-01", "2026-12-01"]);
  });

  it.each([0, 4, 1.5])("EX-05: cantidad %j", (cantidad) => {
    expect(periodosElegidos(pendientes, cantidad).error).toBe("Los períodos se pagan en orden, empezando por noviembre 2026.");
  });
});

describe("mensajePagoRegistrado (CU-26 paso 10 y FA-01)", () => {
  it("al día", () => {
    expect(mensajePagoRegistrado("Luna", false, [], "2027-01-01")).toBe("Pago registrado. La cobertura de Luna está al día.");
  });

  it("sigue suspendida", () => {
    expect(mensajePagoRegistrado("Luna", true, ["2026-12-01", "2027-01-01"], "2027-01-01")).toBe(
      "Pago registrado. La cobertura de Luna sigue suspendida: falta pagar 2 períodos hasta enero 2027.",
    );
  });
});
