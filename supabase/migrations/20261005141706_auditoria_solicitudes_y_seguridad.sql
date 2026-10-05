-- Auditoría, protección contra operaciones duplicadas y seguridad (docs/modelo-datos.md).

create table public.auditoria (
  id bigint generated always as identity primary key,
  ocurrido_en timestamptz not null default now(),
  usuario_id uuid references public.usuario (id), -- vacío: Sistema
  accion text not null,
  entidad text not null,
  entidad_id uuid not null,
  motivo text,
  detalle jsonb -- valores anteriores y nuevos (M-08)
);

create index auditoria_ocurrido_idx on public.auditoria (ocurrido_en desc);
create index auditoria_entidad_idx on public.auditoria (entidad, entidad_id);
create index auditoria_usuario_idx on public.auditoria (usuario_id, ocurrido_en desc);

-- Solo se insertan filas: nadie las modifica ni las borra (CU-36 RN-03, D141).
create or replace function public.auditoria_inmutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'La auditoría no se puede modificar ni borrar.';
end;
$$;

create trigger auditoria_inmutable
  before update or delete on public.auditoria
  for each row execute function public.auditoria_inmutable();

create trigger auditoria_sin_truncate
  before truncate on public.auditoria
  for each statement execute function public.auditoria_inmutable();

-- Cada confirmación se procesa una sola vez (RNF-INT-01): la misma clave devuelve el resultado guardado.
create table public.solicitud (
  clave uuid primary key,
  usuario_id uuid not null references public.usuario (id),
  operacion text not null,
  resultado jsonb not null,
  creada_en timestamptz not null default now()
);

-- Seguridad: la app accede a la base solo desde el servidor, con una conexión directa.
-- Las claves públicas de Supabase (anon / authenticated) no pueden leer ni escribir ninguna tabla.
do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'usuario', 'veterinario', 'dueno', 'vinculacion', 'invitacion', 'sesion',
    'tipo_prestacion', 'plan', 'plan_version', 'plan_prestacion',
    'mascota', 'cobertura', 'cobertura_plan', 'pago', 'consumo',
    'auditoria', 'solicitud'
  ] loop
    execute format('alter table public.%I enable row level security', tabla);
    execute format('revoke all on table public.%I from anon, authenticated', tabla);
  end loop;
end;
$$;

revoke execute on function public.normalizar(text) from anon, authenticated;
revoke execute on function public.auditoria_inmutable() from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Las tablas, secuencias y funciones que se creen en el futuro tampoco quedan expuestas.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;
