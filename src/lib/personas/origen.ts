import "server-only";
import { headers } from "next/headers";

// Dirección de la app desde la que llegó el pedido, para armar el enlace de invitación.
export async function origenDelPedido(): Promise<string> {
  const encabezados = await headers();
  const origen = encabezados.get("origin");
  if (origen && origen !== "null") return origen;

  const host = encabezados.get("x-forwarded-host") ?? encabezados.get("host") ?? "localhost:3000";
  const protocolo = encabezados.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}
