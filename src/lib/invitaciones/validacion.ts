// Validación de una invitación (CU-01 RN-02 y RN-07). Función pura: no lee la base ni el reloj.

export type EstadoInvitacion = "invitado" | "vigente" | "vencida";
export type EstadoCuenta = "invitado" | "activo" | "inactivo";
export type RolInvitado = "administrador" | "veterinario" | "dueno";

export type DatosInvitacion = {
  estado: EstadoInvitacion;
  venceEn: Date;
  usuario: { rol: RolInvitado; estadoCuenta: EstadoCuenta };
};

export type MotivoRechazo =
  | "enlace-invalido" // EX-04
  | "cuenta-inactiva" // EX-05
  | "ya-usada" // EX-01
  | "reemplazada" // EX-03
  | "vencida"; // EX-02

// Devuelve el primer motivo que falla, en el orden de RN-07, o null si la invitación sirve.
export function validarInvitacion(invitacion: DatosInvitacion | null, ahora: Date): MotivoRechazo | null {
  if (!invitacion) return "enlace-invalido";
  if (invitacion.usuario.estadoCuenta === "inactivo") return "cuenta-inactiva";
  if (invitacion.estado === "vigente") return "ya-usada";
  // Guardada como vencida: se generó otra más nueva (o se dio de baja a la persona, que ya cae en el caso anterior).
  if (invitacion.estado === "vencida") return "reemplazada";
  // El vencimiento por tiempo se evalúa en el momento, sin depender de ningún proceso (RN-02).
  if (ahora.getTime() >= invitacion.venceEn.getTime()) return "vencida";
  return null;
}
