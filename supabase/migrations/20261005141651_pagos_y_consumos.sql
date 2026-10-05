-- Pagos y consumos (docs/modelo-datos.md). Ninguno se edita: se anulan (D39, D139).

create table public.pago (
  id uuid primary key default gen_random_uuid(),
  mascota_id uuid not null,
  cobertura_id uuid not null,
  -- Día 1 del mes (D1).
  periodo date not null check (extract(day from periodo) = 1),
  fecha_pago date not null,
  importe numeric(12, 2) not null check (importe > 0),
  forma_pago text not null
    check (forma_pago in ('efectivo', 'transferencia', 'tarjeta_debito', 'tarjeta_credito')),
  es_primer_pago boolean not null default false,
  estado text not null default 'valido' check (estado in ('valido', 'anulado')),
  registrado_en timestamptz not null default now(),
  registrado_por uuid not null references public.usuario (id),
  anulado_en timestamptz,
  anulado_por uuid references public.usuario (id),
  motivo_anulacion text,
  corrige_a_id uuid references public.pago (id),
  foreign key (cobertura_id, mascota_id) references public.cobertura (id, mascota_id),
  -- El primer pago no se anula (D65).
  constraint pago_primer_pago_no_anulable check (not (es_primer_pago and estado = 'anulado')),
  constraint pago_anulacion_completa check (
    estado <> 'anulado' or (anulado_en is not null and anulado_por is not null and motivo_anulacion is not null)
  )
);

-- Un solo pago válido por mascota y período (RF-PAG-13, D144).
create unique index pago_mascota_periodo_valido_uk
  on public.pago (mascota_id, periodo) where estado = 'valido';
-- Un solo primer pago por cobertura (D65).
create unique index pago_primer_pago_uk on public.pago (cobertura_id) where es_primer_pago;
create index pago_cobertura_idx on public.pago (cobertura_id);

create table public.consumo (
  id uuid primary key default gen_random_uuid(),
  mascota_id uuid not null,
  cobertura_id uuid not null,
  tipo_prestacion_id uuid not null references public.tipo_prestacion (id),
  plan_version_id uuid not null references public.plan_version (id),
  periodicidad text not null check (periodicidad in ('mensual', 'anual')),
  -- Día 1 del mes (mensual) o 1 de enero (anual) (D30).
  periodo date not null check (
    extract(day from periodo) = 1 and (periodicidad = 'mensual' or extract(month from periodo) = 1)
  ),
  registrado_en timestamptz not null default now(),
  veterinario_id uuid not null references public.veterinario (usuario_id),
  veterinaria text not null,
  estado text not null default 'valido' check (estado in ('valido', 'anulado')),
  anulado_en timestamptz,
  anulado_por uuid references public.usuario (id),
  motivo_anulacion text,
  foreign key (cobertura_id, mascota_id) references public.cobertura (id, mascota_id),
  constraint consumo_anulacion_completa check (
    estado <> 'anulado' or (anulado_en is not null and anulado_por is not null and motivo_anulacion is not null)
  )
);

create index consumo_mascota_idx on public.consumo (mascota_id, tipo_prestacion_id, periodo)
  where estado = 'valido';
create index consumo_cobertura_idx on public.consumo (cobertura_id);
