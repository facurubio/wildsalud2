import { createHash, randomBytes } from "node:crypto";

// Código del enlace de invitación: aleatorio e imposible de adivinar, sin datos de la persona (CU-01 RN-09).
export function generarCodigo(): string {
  return randomBytes(32).toString("base64url");
}

// En la base se guarda solo el hash, para que nadie con acceso a la base pueda usar las invitaciones.
export function hashCodigo(codigo: string): string {
  return createHash("sha256").update(codigo).digest("hex");
}

export function codigoConFormatoValido(codigo: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(codigo);
}
