import "server-only";
import postgres from "postgres";

// Conexión directa a la base de WildSalud, solo desde el servidor.
// Usa el pooler de Supabase en modo transacción, que no admite sentencias preparadas.
const global = globalThis as unknown as { sql?: postgres.Sql };

export function db(): postgres.Sql {
  if (!global.sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Falta DATABASE_URL en el entorno (ver .env.example).");
    global.sql = postgres(url, { prepare: false });
  }
  return global.sql;
}
