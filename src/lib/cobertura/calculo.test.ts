import { describe, expect, it } from "vitest";
import {
  calcularAntiguedad,
  calcularEstado,
  calcularSaldos,
  periodosEntre,
  versionVigente,
  type PrestacionDelPlan,
} from "./calculo";

// Momentos en hora de Argentina (UTC-3).
const ar = (fechaHora: string) => new Date(`${fechaHora}-03:00`);

describe("calcularEstado (CU-39 RN-01, CU-44 RN-01, D17, D54)", () => {
  const cobertura = (periodosPagos: string[]) => ({
    iniciadaEn: ar("2026-10-07T10:00:00"),
    dadaDeBaja: false,
    periodosPagos,
  });

  it("con el mes pago está al día", () => {
    expect(calcularEstado(cobertura(["2026-10-01"]), ar("2026-10-20T10:00:00")).estado).toBe("al_dia");
  });

  it.each([
    ["el 13 a las 23:59 sigue al día", "2026-11-13T23:59:59", "al_dia", []],
    ["el 14 a las 00:00 se suspende", "2026-11-14T00:00:00", "suspendida", ["2026-11-01"]],
  ])("cuota de noviembre impaga: %s", (_caso, momento, estado, adeudados) => {
    const resultado = calcularEstado(cobertura(["2026-10-01"]), ar(momento));
    expect(resultado.estado).toBe(estado);
    expect(resultado.periodosAdeudados).toEqual(adeudados);
  });

  it("un mes anterior impago la suspende aunque el actual esté pago (anulación de un pago, D36)", () => {
    const resultado = calcularEstado(cobertura(["2026-10-01", "2026-12-01"]), ar("2026-12-05T10:00:00"));
    expect(resultado).toEqual({ estado: "suspendida", periodosAdeudados: ["2026-11-01"] });
  });

  it("al pagar toda la deuda vuelve a estar al día (D4)", () => {
    const resultado = calcularEstado(cobertura(["2026-10-01", "2026-11-01", "2026-12-01"]), ar("2026-12-20T10:00:00"));
    expect(resultado.estado).toBe("al_dia");
  });

  it("el cambio de mes usa la hora de Argentina (D53)", () => {
    // 01/12 01:00 UTC todavía es 30/11 en Argentina: el período en curso es noviembre, pago.
    const momento = new Date("2026-12-01T01:00:00Z");
    expect(calcularEstado(cobertura(["2026-10-01", "2026-11-01"]), momento).estado).toBe("al_dia");
  });

  it("una cobertura dada de baja no se recalcula", () => {
    expect(calcularEstado({ ...cobertura([]), dadaDeBaja: true }, ar("2026-12-20T10:00:00")).estado).toBe(
      "dada_de_baja",
    );
  });
});

describe("periodos y antigüedad (D11, D12)", () => {
  it("lista los meses entre dos períodos, cruzando el año", () => {
    expect(periodosEntre("2026-11-01", "2027-02-01")).toEqual(["2026-11-01", "2026-12-01", "2027-01-01", "2027-02-01"]);
  });

  it("la antigüedad es la cantidad de períodos pagos", () => {
    expect(calcularAntiguedad(["2026-10-01", "2026-12-01"])).toBe(2);
  });
});

describe("versionVigente (M-05)", () => {
  const versiones = [
    { id: "v1", vigenteDesde: "2026-10-05", descartada: false },
    { id: "v2", vigenteDesde: "2026-11-01", descartada: false },
    { id: "v3", vigenteDesde: "2026-10-06", descartada: true },
  ];

  it("rige la última que ya empezó, sin contar las descartadas", () => {
    expect(versionVigente(versiones, "2026-10-20")?.id).toBe("v1");
    expect(versionVigente(versiones, "2026-11-01")?.id).toBe("v2");
  });

  it("antes de la primera versión no hay ninguna", () => {
    expect(versionVigente(versiones, "2026-10-01")).toBeNull();
  });
});

describe("calcularSaldos (CU-38 flujo principal, CU-39 RN-03 y RN-04)", () => {
  // Plan Base de los escenarios de CU-38.
  const planBase: PrestacionDelPlan[] = [
    { tipoPrestacionId: "consulta", nombre: "Consulta", limite: 2, periodicidad: "mensual", periodosParaHabilitar: 1 },
    { tipoPrestacionId: "vacuna", nombre: "Vacuna", limite: null, periodicidad: "mensual", periodosParaHabilitar: 1 },
    { tipoPrestacionId: "radiografia", nombre: "Radiografía", limite: 1, periodicidad: "anual", periodosParaHabilitar: 6 },
  ];
  const ahora = ar("2026-10-20T10:00:00");

  it("con 4 períodos pagos y una consulta en octubre", () => {
    const saldos = calcularSaldos(planBase, [{ tipoPrestacionId: "consulta", periodo: "2026-10-01" }], 4, ahora);
    expect(saldos.map((s) => [s.nombre, s.consumidas, s.saldo, s.estado, s.periodosQueFaltan])).toEqual([
      ["Consulta", 1, 1, "disponible", 0],
      ["Vacuna", 0, null, "disponible", 0],
      ["Radiografía", 0, 1, "no_habilitada", 2],
    ]);
  });

  it("dos consultas en el mes la dejan agotada; las de otro mes no cuentan (no acumulable)", () => {
    const consumos = [
      { tipoPrestacionId: "consulta", periodo: "2026-10-01" },
      { tipoPrestacionId: "consulta", periodo: "2026-10-01" },
      { tipoPrestacionId: "consulta", periodo: "2026-09-01" },
    ];
    const [consulta] = calcularSaldos(planBase, consumos, 4, ahora);
    expect(consulta).toMatchObject({ consumidas: 2, saldo: 0, estado: "agotada" });
  });

  it("una prestación anual descuenta del año calendario", () => {
    const consumos = [{ tipoPrestacionId: "radiografia", periodo: "2026-01-01" }];
    const radiografia = calcularSaldos(planBase, consumos, 6, ahora)[2];
    expect(radiografia).toMatchObject({ periodo: "2026-01-01", consumidas: 1, saldo: 0, estado: "agotada" });
  });

  it("el saldo nunca es negativo (RN-04)", () => {
    const consumos = Array.from({ length: 3 }, () => ({ tipoPrestacionId: "consulta", periodo: "2026-10-01" }));
    expect(calcularSaldos(planBase, consumos, 4, ahora)[0].saldo).toBe(0);
  });
});
