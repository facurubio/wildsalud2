import { describe, expect, it } from "vitest";
import { validarTipoPrestacion } from "./validacion";

describe("CU-20 validar tipo de prestación (RN-01)", () => {
  it("un nombre con descripción opcional es válido", () => {
    expect(validarTipoPrestacion({ nombre: "Ecografía", descripcion: "" })).toBeNull();
  });

  it("EX-01: falta el nombre", () => {
    expect(validarTipoPrestacion({ nombre: "", descripcion: "x" })).toBe("Completá el campo nombre.");
  });

  it.each([
    [{ nombre: "a".repeat(40), descripcion: "a".repeat(200) }, null],
    [{ nombre: "a".repeat(41), descripcion: "" }, "El campo nombre no puede tener más de 40 caracteres."],
    [{ nombre: "Vacuna", descripcion: "a".repeat(201) }, "El campo descripción no puede tener más de 200 caracteres."],
  ])("EX-03: largos máximos %#", (datos, esperado) => {
    expect(validarTipoPrestacion(datos)).toBe(esperado);
  });
});
