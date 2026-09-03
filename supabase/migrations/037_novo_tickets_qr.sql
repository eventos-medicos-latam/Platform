-- =========================================================
-- NOVO ARCHITECTURE — Tickets, inscripciones y QR universal
-- Ticket = derecho de acceso. QR = identidad universal permanente.
-- =========================================================

-- Tipos de ticket configurables por evento
create table if not exists ticket_types (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  name            text not null,
  description     text,
  modality        novo_event_modality,          -- presencial | virtual | hibrido
  access_level    text not null default 'general', -- general | vip | workshop | etc.
  base_price      numeric(12,2) not null default 0,
  tax_pct         numeric(5,2) not null default 0,
  capacity        integer,                       -- null = sin límite
  benefits        text[],
  sale_start      timestamptz,
  sale_end        timestamptz,
  is_visible      boolean not null default true,
  has_qr          boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Etapas de precio (hasta 3, criterio: fecha O cantidad; nunca ambos)
create table if not exists ticket_price_stages (
  id              uuid primary key default gen_random_uuid(),
  ticket_type_id  uuid not null references ticket_types(id) on delete cascade,
  stage_name      text not null,     -- "Preventa", "Precio Regular", "Última hora"
  price           numeric(12,2) not null,
  -- Exactamente uno de estos dos debe estar presente:
  valid_until     date,              -- criterio por fecha
  quantity_limit  integer,           -- criterio por cantidad vendida
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  constraint check_one_criterion check (
    (valid_until is not null)::int + (quantity_limit is not null)::int = 1
  )
);

-- Inscripción: relación persona ↔ evento
create table if not exists event_registrations (
  id                  uuid primary key default gen_random_uuid(),
  person_id           uuid not null references people(id),
  event_id            uuid not null references events(id),
  registration_type   novo_registration_type not null default 'compra',
  origin              novo_registration_origin not null default 'web',
  company_id          uuid references companies(id),  -- si vino por empresa
  amount_paid         numeric(12,2) not null default 0,
  payment_id          uuid references novo_payments(id),
  attended            boolean not null default false,
  notes               text,
  created_by          uuid references profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (person_id, event_id)
);

create trigger event_registrations_set_updated_at
  before update on event_registrations
  for each row execute function set_updated_at();

-- Ticket entitlement: el derecho de acceso concreto
create table if not exists ticket_entitlements (
  id                  uuid primary key default gen_random_uuid(),
  registration_id     uuid not null references event_registrations(id) on delete cascade,
  ticket_type_id      uuid not null references ticket_types(id),
  person_id           uuid not null references people(id),
  event_id            uuid not null references events(id),
  price_paid          numeric(12,2) not null default 0,
  coupon_id           uuid,              -- FK a coupons en 040
  status              text not null default 'activo', -- activo | cancelado | transferido
  cancelled_at        timestamptz,
  cancel_reason       text,
  created_at          timestamptz not null default now()
);

-- Hold de compra (15 minutos durante pago)
create table if not exists ticket_holds (
  id              uuid primary key default gen_random_uuid(),
  ticket_type_id  uuid not null references ticket_types(id) on delete cascade,
  person_id       uuid references people(id),
  session_ref     text,              -- identificador de sesión anónima
  quantity        integer not null default 1,
  expires_at      timestamptz not null default (now() + interval '15 minutes'),
  created_at      timestamptz not null default now()
);

-- Lista de espera
create table if not exists waitlist_entries (
  id              uuid primary key default gen_random_uuid(),
  ticket_type_id  uuid not null references ticket_types(id),
  person_id       uuid not null references people(id),
  event_id        uuid not null references events(id),
  position        integer,
  notified_at     timestamptz,
  registered_at   timestamptz,       -- cuando finalmente se inscribió
  created_at      timestamptz not null default now(),
  unique (ticket_type_id, person_id)
);

-- Cupones globales
create table if not exists coupons (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  discount_type   text not null default 'porcentaje', -- porcentaje | valor-fijo
  discount_value  numeric(10,2) not null,
  max_uses        integer not null,   -- obligatorio
  uses_count      integer not null default 0,
  applies_to      jsonb,             -- { events: [], ticket_types: [], products: [] }
  company_id      uuid references companies(id), -- null = todos
  valid_from      timestamptz,
  valid_until     timestamptz,
  is_active       boolean not null default true,
  auto_disabled   boolean not null default false, -- true cuando se agotó
  created_at      timestamptz not null default now()
);

-- =========================================================
-- QR UNIVERSAL — Una persona, un QR permanente
-- =========================================================

create table if not exists person_qr (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null unique references people(id) on delete cascade,
  qr_token    text not null unique default encode(gen_random_bytes(24), 'base64url'),
  created_at  timestamptz not null default now()
);

-- Tipos de interacción QR configurables por evento
create table if not exists event_qr_interaction_types (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  name            text not null,    -- "Entrada", "Coffee", "Lunch", "Kit", etc.
  rule            novo_qr_interaction_rule not null default 'una-vez',
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

-- Registro de cada interacción QR
create table if not exists qr_interactions (
  id                    uuid primary key default gen_random_uuid(),
  person_qr_id          uuid not null references person_qr(id),
  event_id              uuid not null references events(id),
  interaction_type_id   uuid references event_qr_interaction_types(id),
  scanner_person_id     uuid references people(id),  -- quién escaneó
  company_id            uuid references companies(id),
  stand_unit_id         uuid,                         -- FK a stand_units en 038
  result                text not null default 'ok',   -- ok | denied | duplicate
  note                  text,
  consent_given         boolean,                      -- privacidad de leads
  occurred_at           timestamptz not null default now()
);

create index if not exists qr_interactions_event_idx on qr_interactions(event_id, occurred_at);
create index if not exists qr_interactions_person_idx on qr_interactions(person_qr_id, event_id);

-- =========================================================
-- RLS
-- =========================================================

alter table ticket_types enable row level security;
create policy ticket_types_admin on ticket_types for all using (is_admin());
create policy ticket_types_public on ticket_types for select using (is_visible = true);

alter table event_registrations enable row level security;
create policy event_registrations_admin on event_registrations for all using (is_admin());

alter table ticket_entitlements enable row level security;
create policy ticket_entitlements_admin on ticket_entitlements for all using (is_admin());

alter table person_qr enable row level security;
create policy person_qr_admin on person_qr for all using (is_admin());

alter table qr_interactions enable row level security;
create policy qr_interactions_admin on qr_interactions for all using (is_admin());
create policy qr_interactions_empresa on qr_interactions
  for select using (company_id = my_company_id());
