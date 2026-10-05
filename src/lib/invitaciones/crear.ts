import type postgres from "postgres";
import { ahora } from "@/lib/tiempo";
import { generarCodigo, hashCodigo } from "./codigo";

const VIGENCIA_MS = 24 * 60 * 60 * 1000; // D87

// Genera una invitación nueva para el usuario. Las anteriores sin usar pasan a Vencida:
// solo sirve la última (D87). Se llama dentro de la transacción de la operación que la origina.
// Devuelve el código, que va solo en el enlace: en la base queda el hash.
export async function crearInvitacion(
  tx: postgres.TransactionSql,
  datos: { usuarioId: string; email: string; enviadaPor: string | null },
): Promise<{ codigo: string; venceEn: Date }> {
  const codigo = generarCodigo();
  const enviadaEn = ahora();
  const venceEn = new Date(enviadaEn.getTime() + VIGENCIA_MS);

  await tx`
    update public.invitacion set estado = 'vencida'
    where usuario_id = ${datos.usuarioId} and estado = 'invitado'
  `;
  await tx`
    insert into public.invitacion (usuario_id, token_hash, email_destino, enviada_en, vence_en, enviada_por)
    values (${datos.usuarioId}, ${hashCodigo(codigo)}, ${datos.email}, ${enviadaEn}, ${venceEn}, ${datos.enviadaPor})
  `;

  return { codigo, venceEn };
}

export function enlaceInvitacion(urlBase: string, codigo: string): string {
  return new URL(`/invitacion/${codigo}`, urlBase).toString();
}
