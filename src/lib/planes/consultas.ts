import "server-only";
import type postgres from "postgres";
import { versionVigente, type Periodicidad } from "@/lib/cobertura/calculo";
import { db } from "@/lib/db";
import { fechaHoy } from "@/lib/tiempo";
import type { PrestacionPlan } from "./validacion";

export type TipoPrestacion = { id: string; nombre: string };

export async function tiposDelCatalogo(sql: postgres.Sql | postgres.TransactionSql = db()): Promise<TipoPrestacion[]> {
  return sql<TipoPrestacion[]>`select id, nombre from public.tipo_prestacion order by public.normalizar(nombre)`;
}

export type PlanResumen = {
  id: string;
  nombre: string;
  estado: "activo" | "inactivo";
  precio: string | null;
  cantidadPrestaciones: number;
  cantidadMascotas: number;
};

// Planes no eliminados, con el precio de la versión vigente hoy (M-05).
export async function listarPlanes(): Promise<PlanResumen[]> {
  return db()<PlanResumen[]>`
    select p.id, p.nombre, p.estado, v.precio,
           (select count(*)::int from public.plan_prestacion pp where pp.plan_version_id = v.id) as "cantidadPrestaciones",
           (select count(distinct cp.cobertura_id)::int from public.cobertura_plan cp
              join public.cobertura c on c.id = cp.cobertura_id
             where cp.plan_id = p.id and cp.hasta is null and c.estado <> 'dada_de_baja') as "cantidadMascotas"
    from public.plan p
    left join lateral (
      select id, precio from public.plan_version
      where plan_id = p.id and estado <> 'descartada' and vigente_desde <= ${fechaHoy()}
      order by vigente_desde desc limit 1
    ) v on true
    where p.estado <> 'eliminado'
    order by public.normalizar(p.nombre)
  `;
}

export type PrestacionDetalle = PrestacionPlan & { nombre: string };

export type PlanDetalle = {
  id: string;
  nombre: string;
  estado: "activo" | "inactivo";
  versionId: string;
  precio: number;
  vigenteDesde: string;
  prestaciones: PrestacionDetalle[];
  // En la v1 un plan se edita solo mientras ninguna mascota lo tuvo asignado (docs/alcance-v1.md).
  enUso: boolean;
};

// Plan con las condiciones de la versión vigente en la fecha indicada (por defecto, hoy).
export async function obtenerPlan(
  id: string,
  sql: postgres.Sql | postgres.TransactionSql = db(),
  fecha: string = fechaHoy(),
): Promise<PlanDetalle | null> {
  const [plan] = await sql<{ id: string; nombre: string; estado: "activo" | "inactivo"; en_uso: boolean }[]>`
    select p.id, p.nombre, p.estado,
           exists (select 1 from public.cobertura_plan cp where cp.plan_id = p.id) as en_uso
    from public.plan p
    where p.id = ${id} and p.estado <> 'eliminado'
  `;
  if (!plan) return null;

  const versiones = await sql<{ id: string; vigente_desde: string; estado: string; precio: string }[]>`
    select id, vigente_desde::text, estado, precio from public.plan_version where plan_id = ${id}
  `;
  const vigente = versionVigente(
    versiones.map((v) => ({ ...v, vigenteDesde: v.vigente_desde, descartada: v.estado === "descartada" })),
    fecha,
  );
  if (!vigente) return null;

  const prestaciones = await sql<
    { tipo_prestacion_id: string; nombre: string; limite: number | null; periodicidad: Periodicidad; periodos_para_habilitar: number }[]
  >`
    select pp.tipo_prestacion_id, t.nombre, pp.limite, pp.periodicidad, pp.periodos_para_habilitar
    from public.plan_prestacion pp
    join public.tipo_prestacion t on t.id = pp.tipo_prestacion_id
    where pp.plan_version_id = ${vigente.id}
    order by public.normalizar(t.nombre)
  `;

  return {
    id: plan.id,
    nombre: plan.nombre,
    estado: plan.estado,
    versionId: vigente.id,
    precio: Number(vigente.precio),
    vigenteDesde: vigente.vigenteDesde,
    enUso: plan.en_uso,
    prestaciones: prestaciones.map((p) => ({
      tipoPrestacionId: p.tipo_prestacion_id,
      nombre: p.nombre,
      limite: p.limite,
      periodicidad: p.periodicidad,
      periodosParaHabilitar: p.periodos_para_habilitar,
    })),
  };
}
