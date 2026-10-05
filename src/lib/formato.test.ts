import { describe, expect, it } from "vitest";
import { formatearPeriodo, leerEntero, leerImporte } from "./formato";

describe("leerImporte", () => {
  it.each([
    ["15000", 15000],
    ["15.000", 15000],
    ["15000,50", 15000.5],
    ["$ 1.234.567,8", 1234567.8],
  ])("%s → %s", (texto, esperado) => {
    expect(leerImporte(texto)).toBe(esperado);
  });

  it.each(["", "abc", "15,000.50", "1,234", "15.00", "-100"])("rechaza %j", (texto) => {
    expect(leerImporte(texto)).toBeNull();
  });
});

describe("leerEntero", () => {
  it("vacío es null, un entero es su valor y lo demás es NaN", () => {
    expect(leerEntero("")).toBeNull();
    expect(leerEntero("3")).toBe(3);
    expect(leerEntero("2.5")).toBeNaN();
  });
});

describe("formatearPeriodo", () => {
  it("muestra el mes y el año", () => {
    expect(formatearPeriodo("2026-10-01")).toBe("octubre 2026");
  });
});
