import "server-only";
import type postgres from "postgres";
import { versionesDelPlan } from "@/lib/cobertura/consultas";
import { db } from "@/lib/db";
import { precioDelPeriodo, type FormaPago } from "@/lib/pagos/reglas";
import type { Castrado, Sexo } from "./validacion";

type Sql = postgres.Sql | postgres.TransactionSql;

export type DuenoResumen = {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  estadoCuenta: "invitado" | "activo" | "inactivo";
  formaPagoPreferida: FormaPago;
};

export async function obtenerDueno(sql: Sql, id: string, bloquear = false): Promise<DuenoResumen | null> {
  const [d] = await sql<DuenoResumen[]>`
    select u.id, u.nombre, u.apellido, u.dni, u.telefono, u.estado_cuenta as "estadoCuenta",
           d.forma_pago_preferida as "formaPagoPreferida"
    from public.usuario u
    join public.dueno d on d.usuario_id = u.id
    where u.id = ${id} and u.rol = 'dueno'
    ${bloquear ? sql`for update of u` : sql``}
  `;
  return d ?? null;
}

export type Mascota = {
  id: string;
  numeroAfiliado: number;
  duenoId: string;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo: Sexo;
  color: string | null;
  castrado: Castrado;
  enfermedades: string | null;
  alimentacion: string | null;
  edadAproximada: number;
  estado: "activa" | "dada_de_baja";
  altaEn: Date;
  // Marca de la última modificación, para no sobrescribir cambios de otro administrador (CU-14 RN-05).
  version: string;
};

export async function obtenerMascota(sql: Sql, id: string, bloquear = false): Promise<Mascota | null> {
  const [m] = await sql<Mascota[]>`
    select id, numero_afiliado as "numeroAfiliado", dueno_id as "duenoId", nombre, especie, raza, sexo, color, castrado,
           enfermedades, alimentacion, edad_aproximada as "edadAproximada", estado, alta_en as "altaEn",
           coalesce(modificada_en, alta_en)::text || '|' || dueno_id::text as version
    from public.mascota
    where id = ${id}
    ${bloquear ? sql`for update` : sql``}
  `;
  return m ?? null;
}

export type PlanParaAsignar = { id: string; nombre: string; precio: number };

// CU-22 paso 2: planes activos con su precio para el mes en curso.
export async function planesParaAsignar(sql: Sql, periodo: string): Promise<PlanParaAsignar[]> {
  const planes = await sql<{ id: string; nombre: string }[]>`
    select id, nombre from public.plan where estado = 'activo' order by public.normalizar(nombre)
  `;
  const conPrecio = await Promise.all(
    planes.map(async (p) => ({ ...p, precio: precioDelPeriodo(await versionesDelPlan(sql, p.id), periodo) })),
  );
  return conPrecio.filter((p): p is PlanParaAsignar => p.precio !== null);
}

export type PagoDeMascota = {
  id: string;
  periodo: string;
  fechaPago: string;
  importe: number;
  formaPago: FormaPago;
  esPrimerPago: boolean;
  estado: "valido" | "anulado";
  motivoAnulacion: string | null;
  coberturaId: string;
};

export async function pagosDeMascota(mascotaId: string, sql: Sql = db()): Promise<PagoDeMascota[]> {
  const filas = await sql<(Omit<PagoDeMascota, "importe"> & { importe: string })[]>`
    select id, periodo::text, fecha_pago::text as "fechaPago", importe, forma_pago as "formaPago",
           es_primer_pago as "esPrimerPago", estado, motivo_anulacion as "motivoAnulacion", cobertura_id as "coberturaId"
    from public.pago
    where mascota_id = ${mascotaId}
    order by periodo desc, registrado_en desc
  `;
  return filas.map((p) => ({ ...p, importe: Number(p.importe) }));
}

// CU-13 RN-08: otra mascota del dueño con el mismo nombre y especie, sin distinguir mayúsculas ni acentos.
export async function mascotaParecida(sql: Sql, duenoId: string, nombre: string, especie: string, salvoId?: string) {
  const [m] = await sql<{ numero_afiliado: number; especie: string; nombre: string; estado: string; motivo_baja: string | null }[]>`
    select numero_afiliado, especie, nombre, estado, motivo_baja from public.mascota
    where dueno_id = ${duenoId}
      and public.normalizar(nombre) = public.normalizar(${nombre})
      and public.normalizar(especie) = public.normalizar(${especie})
      and id is distinct from ${salvoId ?? null}
      and motivo_baja is distinct from 'fallecimiento'
    order by estado, numero_afiliado
    limit 1
  `;
  return m ?? null;
}
