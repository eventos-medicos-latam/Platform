-- =========================================================
-- NOVO ARCHITECTURE — Stands: catálogo, inventario, reservas
-- Primero inventario, luego se ubican en el plano.
-- =========================================================

-- Catálogo global de tipos de stand
create table if not exists stand_types (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  dimensions      text,          -- "3x2 m", "6x4 m", etc.
  includes        text[],        -- ["Mesa", "2 sillas", "Electricidad", ...]
  image_url       text,
  description     text,
  base_price      numeric(12,2) not null default 0,
  currency        text not null default 'COP',
  custom_fields   jsonb,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Inventario de stands por evento (primero definir cantidad)
create table if not exists stand_inventory (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  stand_type_id   uuid not null references stand_types(id),
  quantity        integer not null,
  price           numeric(12,2),    -- null = usa base_price del tipo
  currency        text not null default 'COP',
  location_hint   text,             -- "Pasillo A", "Zona Norte", etc.
  created_at      timestamptz not null default now(),
  unique (event_id, stand_type_id)
);

-- Unidades individuales de stand
create table if not exists stand_units (
  id              uuid primary key default gen_random_uuid(),
  inventory_id    uuid not null references stand_inventory(id) on delete cascade,
  event_id        uuid not null references events(id),
  stand_type_id   uuid not null references stand_types(id),
  unit_number     text not null,     -- "A-01", "B-12", etc.
  status          novo_stand_unit_status not null default 'disponible',
  -- Posición en el plano (null si no está ubicado todavía)
  map_x           numeric(8,4),
  map_y           numeric(8,4),
  map_width       numeric(8,4),
  map_height      numeric(8,4),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (event_id, unit_number)
);

create trigger stand_units_set_updated_at
  before update on stand_units
  for each row execute function set_updated_at();

-- FK pendiente de qr_interactions
alter table qr_interactions
  add constraint qr_interactions_stand_fk
  foreign key (stand_unit_id) references stand_units(id) on delete set null;

-- Reservas comerciales (sin timeout automático)
create table if not exists stand_reservations (
  id              uuid primary key default gen_random_uuid(),
  stand_unit_id   uuid not null references stand_units(id),
  company_id      uuid not null references companies(id),
  event_id        uuid not null references events(id),
  agreement_id    uuid references commercial_agreements(id),
  status          text not null default 'pendiente', -- pendiente | confirmado | cancelado
  reserved_by     uuid references people(id),   -- quién hizo la reserva
  reserved_at     timestamptz not null default now(),
  confirmed_at    timestamptz,
  cancelled_at    timestamptz,
  cancel_reason   text,
  notes           text,
  created_at      timestamptz not null default now()
);

-- =========================================================
-- RLS
-- =========================================================

alter table stand_types enable row level security;
create policy stand_types_admin on stand_types for all using (is_admin());
create policy stand_types_public on stand_types for select using (is_active = true);

alter table stand_inventory enable row level security;
create policy stand_inventory_admin on stand_inventory for all using (is_admin());

alter table stand_units enable row level security;
create policy stand_units_admin on stand_units for all using (is_admin());
create policy stand_units_public on stand_units for select using (true);

alter table stand_reservations enable row level security;
create policy stand_reservations_admin on stand_reservations for all using (is_admin());
create policy stand_reservations_empresa on stand_reservations
  for select using (company_id = my_company_id());
