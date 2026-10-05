import { afterEach, describe, expect, it } from "vitest";
import { ahora, fechaArgentina, fijarReloj, periodoAnual, periodoMensual } from "./tiempo";

afterEach(() => fijarReloj(null));

describe("hora de Argentina (D53)", () => {
  it("el 1 de noviembre a las 01:00 UTC todavía es 31 de octubre en Argentina", () => {
    const momento = new Date("2026-11-01T01:00:00Z");
    expect(fechaArgentina(momento)).toEqual({ anio: 2026, mes: 10, dia: 31 });
    expect(periodoMensual(momento)).toBe("2026-10-01");
  });

  it("el 1 de noviembre a las 03:00 UTC ya es noviembre en Argentina", () => {
    expect(periodoMensual(new Date("2026-11-01T03:00:00Z"))).toBe("2026-11-01");
  });

  it("el cambio de año también usa la hora de Argentina", () => {
    expect(periodoAnual(new Date("2027-01-01T02:59:59Z"))).toBe("2026-01-01");
    expect(periodoAnual(new Date("2027-01-01T03:00:00Z"))).toBe("2027-01-01");
  });
});

describe("reloj controlable", () => {
  it("fijarReloj cambia la fecha de referencia", () => {
    fijarReloj(new Date("2026-11-14T03:00:00Z"));
    expect(fechaArgentina()).toEqual({ anio: 2026, mes: 11, dia: 14 });
    expect(ahora().toISOString()).toBe("2026-11-14T03:00:00.000Z");
  });
});
