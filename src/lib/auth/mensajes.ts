// Mensajes de la pantalla de ingreso (CU-02).
// En la v1 la invitación se manda por WhatsApp y no por email (docs/alcance-v1.md), por eso EX-01 habla del enlace.
export const mensajesIngreso = {
  "ingresa-para-continuar": "Ingresá para continuar.", // FA-02
  "no-vinculada":
    "Esta cuenta de Google no está vinculada a WildSalud. Si recibiste una invitación, ingresá desde ese enlace.", // EX-01
  "inactiva-veterinario": "Tu cuenta está inactiva. Comunicate con el administrador.", // EX-02
  "inactiva-dueno": "Tu cuenta está inactiva. Comunicate con WildSalud.", // EX-02
  validacion: "No pudimos validar tu cuenta de Google. Intentá de nuevo.", // EX-03
} as const;

export type CodigoMensajeIngreso = keyof typeof mensajesIngreso;

export function mensajeIngreso(codigo: string | undefined): string | null {
  if (!codigo || !(codigo in mensajesIngreso)) return null;
  return mensajesIngreso[codigo as CodigoMensajeIngreso];
}
