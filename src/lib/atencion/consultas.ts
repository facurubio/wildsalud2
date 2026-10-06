import "server-only";
import type postgres from "postgres";
import { calcularEstado, type EstadoCobertura } from "@/lib/cobertura/calculo";
import { coberturaVigente } from "@/lib/cobertura/consultas";
import { db } from "@/lib/db";
import { POR_PAGINA, type CriterioBusqueda } from "./reglas";

type Sql = postgres.Sql | postgres.TransactionSql;

export type ResultadoBusqueda = {
  id: string;
  numeroAfiliado: number;
  nombre: string;
  especie: string;
  raza: string | null;
  dueno: string;
  estado: EstadoCobertura | null; // null: sin cobertura vigente
};

// CU-37: mascotas no dadas de baja (RN-01), ordenadas por nombre y de a 20 (RN-04).
// El DNI y el teléfono del dueño no se devuelven: se ven solo en la ficha (RN-03).
// Sin criterio ("todas") lista todas las mascotas no dadas de baja (D140, D146).
export async function buscarMascotas(
  criterio: Exclude<CriterioBusqueda, { tipo: "invalido" }> | { tipo: "todas" },
  pagina: number,
  ahora: Date,
  sql: Sql = db(),
): Promise<{ total: number; resultados: ResultadoBusqueda[] }> {
  const condicion =
    criterio.tipo === "todas"
      ? sql`true`
      : criterio.tipo === "afiliado"
      ? sql`m.numero_afiliado = ${criterio.numero}`
      : criterio.tipo === "dni"
        ? sql`u.dni = ${criterio.dni}`
        : sql`(position(public.normalizar(${criterio.texto}) in public.normalizar(m.nombre)) > 0
              or position(public.normalizar(${criterio.texto}) in public.normalizar(u.apellido)) > 0)`;

  const [{ total }] = await sql<{ total: number }[]>`
    select count(*)::int as total
    from public.mascota m join public.usuario u on u.id = m.dueno_id
    where m.estado = 'activa' and ${condicion}
  `;
  const filas = await sql<{ id: string; numero_afiliado: number; nombre: string; especie: string; raza: string | null; dueno: string }[]>`
    select m.id, m.numero_afiliado, m.nombre, m.especie, m.raza, u.nombre || ' ' || u.apellido as dueno
    from public.mascota m join public.usuario u on u.id = m.dueno_id
    where m.estado = 'activa' and ${condicion}
    order by public.normalizar(m.nombre), m.numero_afiliado
    limit ${POR_PAGINA} offset ${(pagina - 1) * POR_PAGINA}
  `;

  // RN-05: el estado de cada resultado se calcula en el momento de la búsqueda.
  const resultados = await Promise.all(
    filas.map(async (f) => {
      const cobertura = await coberturaVigente(sql, f.id);
      const estado = cobertura ? calcularEstado({ ...cobertura, dadaDeBaja: false }, ahora).estado : null;
      return {
        id: f.id,
        numeroAfiliado: f.numero_afiliado,
        nombre: f.nombre,
        especie: f.especie,
        raza: f.raza,
        dueno: f.dueno,
        estado,
      };
    }),
  );
  return { total, resultados };
}

export type ConsumoHistorial = {
  id: string;
  registradoEn: Date;
  prestacion: string;
  veterinario: string;
  veterinaria: string;
  periodo: string;
  periodicidad: "mensual" | "anual";
  estado: "valido" | "anulado";
  motivoAnulacion: string | null;
};

// Historial de consumos de la mascota, para el administrador (CU-31 paso 1).
export async function consumosDeMascota(mascotaId: string, sql: Sql = db()): Promise<ConsumoHistorial[]> {
  return sql<ConsumoHistorial[]>`
    select c.id, c.registrado_en as "registradoEn", t.nombre as prestacion,
           u.nombre || ' ' || u.apellido as veterinario, c.veterinaria, c.periodo::text, c.periodicidad,
           c.estado, c.motivo_anulacion as "motivoAnulacion"
    from public.consumo c
    join public.tipo_prestacion t on t.id = c.tipo_prestacion_id
    join public.usuario u on u.id = c.veterinario_id
    where c.mascota_id = ${mascotaId}
    order by c.registrado_en desc
  `;
}
