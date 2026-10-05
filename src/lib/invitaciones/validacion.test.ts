import { describe, expect, it } from "vitest";
import { validarInvitacion, type DatosInvitacion } from "./validacion";

const enviada = new Date("2026-10-07T12:00:00Z");
const vence = new Date("2026-10-08T12:00:00Z"); // 24 horas después (D87)

function invitacion(cambios: Partial<DatosInvitacion> & { estadoCuenta?: "invitado" | "activo" | "inactivo" } = {}) {
  const { estadoCuenta = "invitado", ...resto } = cambios;
  return {
    estado: "invitado",
    venceEn: vence,
    usuario: { rol: "veterinario", estadoCuenta },
    ...resto,
  } satisfies DatosInvitacion;
}

describe("CU-01 validar invitación (RN-07)", () => {
  it("una invitación sin usar y dentro de las 24 horas sirve", () => {
    expect(validarInvitacion(invitacion(), enviada)).toBeNull();
  });

  it("EX-04: un enlace que no existe no es válido", () => {
    expect(validarInvitacion(null, enviada)).toBe("enlace-invalido");
  });

  it("EX-05: una cuenta inactiva se informa antes que el estado de la invitación", () => {
    expect(validarInvitacion(invitacion({ estado: "vencida", estadoCuenta: "inactivo" }), enviada)).toBe(
      "cuenta-inactiva",
    );
  });

  it("EX-01: una invitación ya usada", () => {
    expect(validarInvitacion(invitacion({ estado: "vigente", estadoCuenta: "activo" }), enviada)).toBe("ya-usada");
  });

  it("EX-03: una invitación reemplazada por otra más nueva", () => {
    expect(validarInvitacion(invitacion({ estado: "vencida" }), enviada)).toBe("reemplazada");
  });

  it.each([
    ["un segundo antes de las 24 horas", new Date(vence.getTime() - 1000), null],
    ["justo a las 24 horas", vence, "vencida"],
    ["después de las 24 horas", new Date(vence.getTime() + 1000), "vencida"],
  ])("EX-02: vencimiento por tiempo, %s", (_caso, momento, esperado) => {
    expect(validarInvitacion(invitacion(), momento)).toBe(esperado);
  });

  it("FA-02: una cuenta activa puede usar una invitación nueva para reemplazar su cuenta", () => {
    expect(validarInvitacion(invitacion({ estadoCuenta: "activo" }), enviada)).toBeNull();
  });
});
