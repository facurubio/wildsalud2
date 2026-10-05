import { describe, expect, it } from "vitest";
import { formatearAfiliado, validarFicha, type FichaFormulario } from "./validacion";

const ficha = (cambios: Partial<FichaFormulario> = {}): FichaFormulario => ({
  nombre: "Luna",
  especie: "Perro",
  raza: "",
  sexo: "hembra",
  color: "",
  castrado: "si",
  enfermedades: "",
  alimentacion: "",
  edadAproximada: "3",
  ...cambios,
});

describe("CU-13 validar ficha de la mascota (RN-04, RN-05)", () => {
  it("con los obligatorios alcanza; los opcionales vacíos quedan sin dato", () => {
    expect(validarFicha(ficha()).ficha).toEqual({
      nombre: "Luna",
      especie: "Perro",
      raza: null,
      sexo: "hembra",
      color: null,
      castrado: "si",
      enfermedades: null,
      alimentacion: null,
      edadAproximada: 3,
    });
  });

  it.each([
    ["nombre", "Completá el campo nombre."],
    ["especie", "Completá el campo especie."],
    ["sexo", "Completá el campo sexo."],
    ["castrado", "Completá el campo castrado/a."],
    ["edadAproximada", "Completá el campo edad aproximada."],
  ] as const)("EX-03: falta %s", (campo, error) => {
    expect(validarFicha(ficha({ [campo]: " " })).error).toBe(error);
  });

  it.each([
    [{ edadAproximada: "0" }, null],
    [{ edadAproximada: "30" }, null],
    [{ edadAproximada: "31" }, "Ingresá la edad aproximada en años: un número entero entre 0 y 30."],
    [{ edadAproximada: "2.5" }, "Ingresá la edad aproximada en años: un número entero entre 0 y 30."],
    [{ edadAproximada: "-1" }, "Ingresá la edad aproximada en años: un número entero entre 0 y 30."],
  ])("EX-04: edad %#", (cambios, error) => {
    expect(validarFicha(ficha(cambios)).error ?? null).toBe(error);
  });

  it.each([
    [{ nombre: "a".repeat(51) }, "El campo nombre admite hasta 50 caracteres."],
    [{ especie: "a".repeat(31) }, "El campo especie admite hasta 30 caracteres."],
    [{ alimentacion: "a".repeat(501) }, "El campo alimentación admite hasta 500 caracteres."],
    [{ enfermedades: "a".repeat(1001) }, "El campo enfermedades previas o crónicas admite hasta 1000 caracteres."],
  ])("EX-05: largos máximos %#", (cambios, error) => {
    expect(validarFicha(ficha(cambios)).error).toBe(error);
  });
});

describe("formatearAfiliado (RN-06)", () => {
  it("seis dígitos con ceros a la izquierda", () => {
    expect(formatearAfiliado(123)).toBe("000123");
  });
});
