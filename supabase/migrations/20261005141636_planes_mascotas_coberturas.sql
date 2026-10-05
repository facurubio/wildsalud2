-- Planes, mascotas y coberturas (docs/modelo-datos.md).
-- Tablas: tipo_prestacion, plan, plan_version, plan_prestacion, mascota, cobertura, cobertura_plan.

create table public.tipo_prestacion (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) between 1 and 40),
  descripcion text check (char_length(descripcion) <= 200),
  creado_en timestamptz not null default now(),
  creado_por uuid not null references public.usuario (id)
);

-- Nombre único sin distinguir mayúsculas ni acentos (D132).
create unique index tipo_prestacion_nombre_uk on public.tipo_prestacion (public.normalizar(nombre));

create table public.plan (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) > 0),
  estado text not null default 'activo' check (estado in ('activo', 'inactivo', 'eliminado')),
  creado_en timestamptz not null default now(),
  creado_por uuid not null references public.usuario (id),
  estado_cambiado_en timestamptz,
  estado_cambiado_por uuid references public.usuario (id)
);

-- Nombre único entre los planes no eliminados (D126, D134).
create unique index plan_nombre_uk
  on public.plan (public.normalizar(nombre)) where estado <> 'eliminado';

create table public.plan_version (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plan (id),
  precio numeric(12, 2) not null check (precio > 0),
  vigente_desde date not null,
  estado text not null check (estado in ('pendiente', 'vigente', 'historica', 'descartada')),
  creada_en timestamptz not null default now(),
  creada_por uuid not null references public.usuario (id)
);

-- Una sola versión vigente y como máximo una pendiente por plan (D127).
create unique index plan_version_vigente_uk on public.plan_version (plan_id) where estado = 'vigente';
create unique index plan_version_pendiente_uk on public.plan_version (plan_id) where estado = 'pendiente';

create table public.plan_prestacion (
  id uuid primary key default gen_random_uuid(),
  plan_version_id uuid not null references public.plan_version (id),
  tipo_prestacion_id uuid not null references public.tipo_prestacion (id),
  limite integer check (limite > 0), -- vacío: ilimitada (D32)
  periodicidad text not null check (periodicidad in ('mensual', 'anual')),
  periodos_para_habilitar integer not null default 1 check (periodos_para_habilitar >= 1),
  unique (plan_version_id, tipo_prestacion_id)
);

create table public.mascota (
  id uuid primary key default gen_random_uuid(),
  -- Correlativo, nunca se reutiliza ni cambia (D23, D102).
  numero_afiliado integer not null generated always as identity unique,
  dueno_id uuid not null references public.dueno (usuario_id),
  nombre text not null,
  especie text not null,
  raza text,
  sexo text not null check (sexo in ('macho', 'hembra')),
  color text,
  castrado text not null check (castrado in ('si', 'no', 'no_se_sabe')),
  enfermedades text,
  alimentacion text,
  edad_aproximada smallint not null check (edad_aproximada between 0 and 30),
  foto_path text,
  estado text not null default 'activa' check (estado in ('activa', 'dada_de_baja')),
  motivo_baja text check (motivo_baja in ('fallecimiento', 'pedido_dueno', 'otro', 'baja_dueno')),
  detalle_baja text,
  baja_en timestamptz,
  baja_por uuid references public.usuario (id),
  alta_en timestamptz not null default now(),
  alta_por uuid not null references public.usuario (id),
  reactivada_en timestamptz,
  reactivada_por uuid references public.usuario (id),
  modificada_en timestamptz,
  modificada_por uuid references public.usuario (id),
  constraint mascota_baja_completa check (
    estado <> 'dada_de_baja' or (motivo_baja is not null and baja_en is not null)
  ),
  constraint mascota_detalle_otro check (motivo_baja is distinct from 'otro' or detalle_baja is not null)
);

create index mascota_dueno_idx on public.mascota (dueno_id);

create table public.cobertura (
  id uuid primary key default gen_random_uuid(),
  mascota_id uuid not null references public.mascota (id),
  iniciada_en timestamptz not null default now(),
  -- Se guarda para consultar rápido, pero se recalcula en cada operación (D54, M-02).
  estado text not null default 'al_dia' check (estado in ('al_dia', 'suspendida', 'dada_de_baja')),
  suspendida_en timestamptz,
  origen_suspension text check (origen_suspension in ('proceso', 'anulacion_pago')),
  motivo_baja text check (motivo_baja in ('voluntaria', 'por_deuda', 'por_baja_mascota')),
  baja_en timestamptz,
  baja_por uuid references public.usuario (id),
  creada_por uuid not null references public.usuario (id),
  -- Permite que pagos y consumos exijan la misma mascota que su cobertura (M-07).
  unique (id, mascota_id),
  constraint cobertura_suspension_completa check (
    estado <> 'suspendida' or (suspendida_en is not null and origen_suspension is not null)
  ),
  constraint cobertura_baja_completa check (
    estado <> 'dada_de_baja' or (motivo_baja is not null and baja_en is not null)
  )
);

-- Como máximo una cobertura no dada de baja por mascota (D10).
create unique index cobertura_mascota_vigente_uk
  on public.cobertura (mascota_id) where estado <> 'dada_de_baja';

create table public.cobertura_plan (
  id uuid primary key default gen_random_uuid(),
  cobertura_id uuid not null references public.cobertura (id),
  plan_id uuid not null references public.plan (id),
  desde date not null,
  hasta date,
  constraint cobertura_plan_rango check (hasta is null or hasta >= desde)
);

-- Una sola fila abierta por cobertura: el plan actual (M-06).
create unique index cobertura_plan_abierta_uk
  on public.cobertura_plan (cobertura_id) where hasta is null;
