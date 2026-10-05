-- Personas y acceso (docs/modelo-datos.md, sección "Personas y acceso").
-- Tablas: usuario, veterinario, dueno, vinculacion, invitacion, sesion.

create extension if not exists unaccent with schema extensions;

-- Normaliza un texto para comparar sin distinguir mayúsculas ni acentos
-- (nombres únicos de planes y tipos de prestación, D126, D132).
create or replace function public.normalizar(texto text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, trim(texto)))
$$;

create table public.usuario (
  id uuid primary key default gen_random_uuid(),
  rol text not null check (rol in ('administrador', 'veterinario', 'dueno')),
  nombre text not null,
  apellido text not null,
  dni text check (dni ~ '^[0-9]{7,8}$'),
  email text not null check (email = lower(email)),
  telefono text,
  estado_cuenta text not null default 'invitado'
    check (estado_cuenta in ('invitado', 'activo', 'inactivo')),
  motivo_baja text,
  baja_en timestamptz,
  baja_por uuid references public.usuario (id),
  creado_en timestamptz not null default now(),
  creado_por uuid references public.usuario (id),
  -- DNI y teléfono son obligatorios salvo para administradores (D80, D112).
  constraint usuario_dni_obligatorio check (rol = 'administrador' or dni is not null),
  constraint usuario_telefono_obligatorio check (rol = 'administrador' or telefono is not null),
  constraint usuario_baja_completa check (
    estado_cuenta <> 'inactivo' or (motivo_baja is not null and baja_en is not null)
  )
);

-- DNI y email únicos dentro de cada rol, incluidos los dados de baja (D44, D81).
create unique index usuario_rol_dni_uk on public.usuario (rol, dni) where dni is not null;
create unique index usuario_rol_email_uk on public.usuario (rol, email);

create table public.veterinario (
  usuario_id uuid primary key references public.usuario (id),
  veterinaria text not null
);

create table public.dueno (
  usuario_id uuid primary key references public.usuario (id),
  calle text not null,
  numero text not null,
  piso text,
  departamento text,
  localidad text not null,
  provincia text not null,
  codigo_postal text not null,
  forma_pago_preferida text not null
    check (forma_pago_preferida in ('efectivo', 'transferencia', 'tarjeta_debito', 'tarjeta_credito'))
);

create table public.vinculacion (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuario (id),
  proveedor text not null check (proveedor in ('google', 'apple')),
  cuenta_proveedor_id text not null,
  auth_user_id uuid not null,
  vinculada_en timestamptz not null default now(),
  finalizada_en timestamptz,
  motivo_fin text check (motivo_fin in ('reemplazada', 'descartada')),
  constraint vinculacion_fin_completo check ((finalizada_en is null) = (motivo_fin is null))
);

-- Una sola vinculación abierta por usuario (D37) y por cuenta del proveedor (D89, D97).
create unique index vinculacion_usuario_abierta_uk
  on public.vinculacion (usuario_id) where finalizada_en is null;
create unique index vinculacion_cuenta_abierta_uk
  on public.vinculacion (proveedor, cuenta_proveedor_id) where finalizada_en is null;
create index vinculacion_auth_user_idx on public.vinculacion (auth_user_id) where finalizada_en is null;

create table public.invitacion (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuario (id),
  token_hash text not null unique,
  email_destino text not null,
  enviada_en timestamptz not null default now(),
  vence_en timestamptz not null,
  estado text not null default 'invitado' check (estado in ('invitado', 'vigente', 'vencida')),
  aceptada_en timestamptz,
  enviada_por uuid references public.usuario (id),
  constraint invitacion_vence_24h check (vence_en = enviada_en + interval '24 hours')
);

-- Como máximo una invitación en estado "invitado" por usuario (D87).
create unique index invitacion_usuario_pendiente_uk
  on public.invitacion (usuario_id) where estado = 'invitado';

create table public.sesion (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuario (id),
  vinculacion_id uuid not null references public.vinculacion (id),
  iniciada_en timestamptz not null default now(),
  ultima_actividad_en timestamptz not null default now(),
  cerrada_en timestamptz,
  motivo_cierre text check (
    motivo_cierre in ('cierre_usuario', 'inactividad', 'cuenta_reemplazada', 'baja', 'otra_invitacion')
  ),
  constraint sesion_cierre_completo check ((cerrada_en is null) = (motivo_cierre is null))
);

create index sesion_usuario_abierta_idx on public.sesion (usuario_id) where cerrada_en is null;
