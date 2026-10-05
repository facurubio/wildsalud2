import "server-only";
import type postgres from "postgres";
import { db } from "@/lib/db";
import type { DatosDueno, DatosVeterinario, PersonaExistente, RolPersona } from "./validacion";

type Sql = postgres.Sql | postgres.TransactionSql;

export type EstadoCuenta = "invitado" | "activo" | "inactivo";

// Serializa las altas y ediciones de un mismo rol, para que la verificación de DNI y email únicos y el guardado
// no se crucen con otra operación simultánea (RN-12 de CU-04, RN-13 de CU-08). Se libera al terminar la transacción.
export async function bloquearPersonas(tx: postgres.TransactionSql, rol: RolPersona) {
  await tx`select pg_advisory_xact_lock(hashtextextended(${`personas:${rol}`}, 0))`;
}

// Persona del mismo rol con ese DNI, en cualquier estado (RN-03).
export async function buscarPorDni(
  sql: Sql,
  rol: RolPersona,
  dni: string,
  salvoId: string | null = null,
): Promise<(PersonaExistente & { id: string }) | null> {
  const [fila] = await sql<{ id: string; nombre: string; apellido: string; estadoCuenta: EstadoCuenta }[]>`
    select id, nombre, apellido, estado_cuenta as "estadoCuenta"
    from public.usuario
    where rol = ${rol} and dni = ${dni} and id is distinct from ${salvoId}
  `;
  return fila ?? null;
}

// Persona del mismo rol con ese email (ya en minúsculas), en cualquier estado (RN-04).
export async function buscarPorEmail(
  sql: Sql,
  rol: RolPersona,
  email: string,
  salvoId: string | null = null,
): Promise<(PersonaExistente & { id: string }) | null> {
  const [fila] = await sql<{ id: string; nombre: string; apellido: string; estadoCuenta: EstadoCuenta }[]>`
    select id, nombre, apellido, estado_cuenta as "estadoCuenta"
    from public.usuario
    where rol = ${rol} and email = ${email} and id is distinct from ${salvoId}
  `;
  return fila ?? null;
}

// Busca por nombre, apellido o DNI, sin distinguir mayúsculas ni acentos.
function condicionDeBusqueda(sql: Sql, texto: string) {
  const buscado = texto.trim();
  if (!buscado) return sql``;
  const dni = buscado.replace(/\./g, "");
  return sql`and (
    position(public.normalizar(${buscado}) in public.normalizar(u.nombre || ' ' || u.apellido)) > 0
    or position(public.normalizar(${buscado}) in public.normalizar(u.apellido || ' ' || u.nombre)) > 0
    or (${dni} ~ '^[0-9]+$' and position(${dni} in u.dni) > 0)
  )`;
}

// ---------------------------------------------------------------------------
// Veterinarios
// ---------------------------------------------------------------------------

export type FiltroEstadoVeterinarios = "en_actividad" | "invitado" | "activo" | "inactivo";

export type VeterinarioResumen = {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  veterinaria: string;
  estadoCuenta: EstadoCuenta;
  bajaEn: Date | null;
};

// Lista de veterinarios (CU-04 RN-14, CU-06 RN-06). Sin filtro, solo los que están en actividad:
// los dados de baja se ven al filtrar por ellos. El administrador que también atiende (D145) no figura acá.
export async function listarVeterinarios(
  filtro: { texto: string; estado: FiltroEstadoVeterinarios },
  sql: Sql = db(),
): Promise<VeterinarioResumen[]> {
  const estados = filtro.estado === "en_actividad" ? ["invitado", "activo"] : [filtro.estado];
  return sql<VeterinarioResumen[]>`
    select u.id, u.nombre, u.apellido, u.dni, v.veterinaria,
           u.estado_cuenta as "estadoCuenta", u.baja_en as "bajaEn"
    from public.usuario u
    join public.veterinario v on v.usuario_id = u.id
    where u.rol = 'veterinario' and u.estado_cuenta in ${sql(estados)}
    ${condicionDeBusqueda(sql, filtro.texto)}
    order by public.normalizar(u.apellido), public.normalizar(u.nombre)
  `;
}

export type VeterinarioDetalle = DatosVeterinario & {
  id: string;
  estadoCuenta: EstadoCuenta;
  motivoBaja: string | null;
  bajaEn: Date | null;
  bajaPor: string | null; // nombre del administrador
  creadoEn: Date;
  proveedor: string | null; // proveedor de la cuenta vinculada, si la hay
  vinculadaEn: Date | null;
  invitacion: { estado: "invitado" | "vigente" | "vencida"; enviadaEn: Date; venceEn: Date } | null; // la última
};

// Ficha de un veterinario (no incluye al administrador). Con `bloquear`, toma la fila para modificarla.
export async function obtenerVeterinario(
  id: string,
  sql: Sql = db(),
  bloquear = false,
): Promise<VeterinarioDetalle | null> {
  const [fila] = await sql<
    {
      id: string;
      nombre: string;
      apellido: string;
      dni: string;
      veterinaria: string;
      telefono: string;
      email: string;
      estadoCuenta: EstadoCuenta;
      motivoBaja: string | null;
      bajaEn: Date | null;
      bajaPor: string | null;
      creadoEn: Date;
    }[]
  >`
    select u.id, u.nombre, u.apellido, u.dni, v.veterinaria, u.telefono, u.email,
           u.estado_cuenta as "estadoCuenta", u.motivo_baja as "motivoBaja", u.baja_en as "bajaEn",
           (select b.nombre || ' ' || b.apellido from public.usuario b where b.id = u.baja_por) as "bajaPor",
           u.creado_en as "creadoEn"
    from public.usuario u
    join public.veterinario v on v.usuario_id = u.id
    where u.id = ${id} and u.rol = 'veterinario'
    ${bloquear ? sql`for update of u` : sql``}
  `;
  if (!fila) return null;
  return { ...fila, ...(await accesoDe(sql, id)) };
}

async function accesoDe(sql: Sql, usuarioId: string) {
  const [vinculacion] = await sql<{ proveedor: string; vinculadaEn: Date }[]>`
    select proveedor, vinculada_en as "vinculadaEn"
    from public.vinculacion where usuario_id = ${usuarioId} and finalizada_en is null
  `;
  const [invitacion] = await sql<{ estado: "invitado" | "vigente" | "vencida"; enviadaEn: Date; venceEn: Date }[]>`
    select estado, enviada_en as "enviadaEn", vence_en as "venceEn"
    from public.invitacion where usuario_id = ${usuarioId}
    order by enviada_en desc limit 1
  `;
  return {
    proveedor: vinculacion?.proveedor ?? null,
    vinculadaEn: vinculacion?.vinculadaEn ?? null,
    invitacion: invitacion ?? null,
  };
}

// ---------------------------------------------------------------------------
// Dueños
// ---------------------------------------------------------------------------

export type DuenoResumen = {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  estadoCuenta: EstadoCuenta;
};

export async function listarDuenos(texto: string, sql: Sql = db()): Promise<DuenoResumen[]> {
  return sql<DuenoResumen[]>`
    select u.id, u.nombre, u.apellido, u.dni, u.telefono, u.estado_cuenta as "estadoCuenta"
    from public.usuario u
    join public.dueno d on d.usuario_id = u.id
    where u.rol = 'dueno'
    ${condicionDeBusqueda(sql, texto)}
    order by public.normalizar(u.apellido), public.normalizar(u.nombre)
  `;
}

export type DuenoDetalle = DatosDueno & {
  id: string;
  estadoCuenta: EstadoCuenta;
  motivoBaja: string | null;
  bajaEn: Date | null;
  creadoEn: Date;
};

export async function obtenerDueno(id: string, sql: Sql = db(), bloquear = false): Promise<DuenoDetalle | null> {
  const [fila] = await sql<DuenoDetalle[]>`
    select u.id, u.nombre, u.apellido, u.dni, u.email, u.telefono,
           d.calle, d.numero, coalesce(d.piso, '') as piso, coalesce(d.departamento, '') as departamento,
           d.localidad, d.provincia, d.codigo_postal as "codigoPostal", d.forma_pago_preferida as "formaPago",
           u.estado_cuenta as "estadoCuenta", u.motivo_baja as "motivoBaja", u.baja_en as "bajaEn",
           u.creado_en as "creadoEn"
    from public.usuario u
    join public.dueno d on d.usuario_id = u.id
    where u.id = ${id} and u.rol = 'dueno'
    ${bloquear ? sql`for update of u` : sql``}
  `;
  return fila ?? null;
}
