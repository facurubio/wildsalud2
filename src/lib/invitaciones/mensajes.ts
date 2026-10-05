import type { MotivoRechazo, RolInvitado } from "./validacion";

// Mensajes de CU-01. {contacto} es "el administrador" para veterinarios y administradores,
// y "WildSalud" para dueños. En la v1 las invitaciones van por WhatsApp (docs/alcance-v1.md),
// por eso EX-03 habla del enlace más nuevo y no del último email.
export type MotivoVinculacion = MotivoRechazo | "cuenta-de-otro-usuario" | "validacion";

export function mensajeVinculacion(motivo: MotivoVinculacion, rol: RolInvitado | null): string {
  const contacto = rol === "dueno" ? "WildSalud" : "el administrador";
  switch (motivo) {
    case "ya-usada":
      return "Esta invitación ya se usó. Ingresá con tu cuenta de Google."; // EX-01
    case "vencida":
      return `Esta invitación venció. Comunicate con ${contacto} para que te la reenvíe.`; // EX-02
    case "reemplazada":
      return `Esta invitación ya no es válida porque se generó una más nueva. Usá el último enlace que te enviaron; si no lo tenés, comunicate con ${contacto}.`; // EX-03
    case "enlace-invalido":
      return "El enlace de invitación no es válido."; // EX-04
    case "cuenta-inactiva":
      return `Tu cuenta está inactiva. Comunicate con ${contacto}.`; // EX-05
    case "cuenta-de-otro-usuario":
      return "Esta cuenta de Google ya está vinculada a otro usuario de WildSalud. Ingresá con otra cuenta."; // EX-06
    case "validacion":
      return "No pudimos validar tu cuenta de Google. Intentá de nuevo."; // EX-07
  }
}

export const nombreRol: Record<RolInvitado, string> = {
  administrador: "Administrador",
  veterinario: "Veterinario asociado",
  dueno: "Dueño afiliado",
};
