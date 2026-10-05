// Configuración inicial de un administrador (D50, D112, D145).
//
// Crea al administrador en estado Invitado (y sus datos de veterinario si también atiende)
// y muestra el enlace de invitación para vincular su cuenta de Google (CU-01).
// Si el administrador ya existe, genera un enlace nuevo: sirve si el anterior venció
// o si perdió su cuenta de Google (D112). Solo sirve el último enlace (D87).
//
// Uso (desde la raíz del proyecto):
//   npm run configurar-administrador -- --nombre Ana --apellido Pérez --email ana@gmail.com \
//     [--veterinaria "Veterinaria Centro"] [--url https://wildsalud.vercel.app]
//
// `npm run configurar-administrador` usa la base de .env.local (dev).
// `npm run configurar-administrador:produccion` usa .env.produccion (wildsalud-prod, datos reales):
// ese archivo tiene solo DATABASE_URL con la cadena del Transaction pooler de producción y nunca se sube a GitHub.
// En producción pasá también --url con la dirección de Vercel.

import { parseArgs } from "node:util";
import postgres from "postgres";
import { crearInvitacion, enlaceInvitacion } from "../src/lib/invitaciones/crear";

const { values } = parseArgs({
  options: {
    nombre: { type: "string" },
    apellido: { type: "string" },
    email: { type: "string" },
    veterinaria: { type: "string" },
    url: { type: "string", default: "http://localhost:3000" },
  },
});

const { nombre, apellido, veterinaria, url } = values;
const email = values.email?.trim().toLowerCase();
if (!nombre || !apellido || !email) {
  console.error("Faltan datos: --nombre, --apellido y --email son obligatorios.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL en el entorno (ver .env.example).");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  const { codigo, venceEn, creado } = await sql.begin(async (tx) => {
    const [existente] = await tx<{ id: string; estado_cuenta: string }[]>`
      select id, estado_cuenta from public.usuario
      where rol = 'administrador' and email = ${email}
      for update
    `;

    let usuarioId = existente?.id;
    if (existente?.estado_cuenta === "inactivo") {
      throw new Error("Ese administrador está dado de baja.");
    }
    if (!usuarioId) {
      const [nuevo] = await tx<{ id: string }[]>`
        insert into public.usuario (rol, nombre, apellido, email)
        values ('administrador', ${nombre.trim()}, ${apellido.trim()}, ${email})
        returning id
      `;
      usuarioId = nuevo.id;
      // Sin usuario: la acción la hizo la configuración inicial (Sistema).
      await tx`
        insert into public.auditoria (usuario_id, accion, entidad, entidad_id, detalle)
        values (null, 'alta', 'usuario', ${usuarioId},
                ${tx.json({ rol: "administrador", nombre, apellido, email, origen: "configuracion" })})
      `;
    }

    if (veterinaria) {
      await tx`
        insert into public.veterinario (usuario_id, veterinaria) values (${usuarioId}, ${veterinaria.trim()})
        on conflict (usuario_id) do update set veterinaria = excluded.veterinaria
      `;
    }

    const invitacion = await crearInvitacion(tx, { usuarioId, email, enviadaPor: null });
    return { ...invitacion, creado: !existente };
  });

  console.log(creado ? "Administrador creado." : "El administrador ya existía: se generó un enlace nuevo.");
  console.log(`\nEnlace de invitación (vence ${venceEn.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}):`);
  console.log(enlaceInvitacion(url!, codigo));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
