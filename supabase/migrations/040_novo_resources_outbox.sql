-- =========================================================
-- NOVO ARCHITECTURE — Recursos globales, System Events y Auditoría
-- La plataforma emite eventos; GHL/n8n ejecuta comunicaciones.
-- =========================================================

-- Catálogo global de recursos/documentos
create table if not exists resources (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  resource_type   text not null, -- manual, guia, reglamento, formato, pieza, recurso, otro
  description     text,
  file_url        text,
  storage_path    text,
  is_public       boolean not null default false,
  is_active       boolean not null default true,
  version         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Recursos asignados a un evento
create table if not exists event_resources (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  resource_id     uuid not null references resources(id),
  visible_to      text not null default 'empresa', -- empresa | publico | staff
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  unique (event_id, resource_id)
);

-- Membresías empresa ↔ persona (cargo libre, no es rol de plataforma)
create table if not exists company_memberships (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies(id) on delete cascade,
  person_id   uuid not null references people(id) on delete cascade,
  job_title   text,               -- texto libre: "Visitador Médico", "Gerente Comercial"
  status      text not null default 'activo', -- activo | inactivo
  valid_from  date,
  valid_until date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (company_id, person_id)
);

-- System Events / Outbox — arquitectura event-driven hacia n8n/GHL
create table if not exists system_events (
  id              uuid primary key default gen_random_uuid(),
  event_type      text not null,    -- e.g. 'registration.completed', 'payment.approved'
  family          novo_system_event_family not null,
  entity_type     text not null,    -- 'person', 'event', 'agreement', etc.
  entity_id       uuid not null,
  event_context   uuid,             -- event_id cuando aplique
  payload         jsonb not null,
  status          text not null default 'pending', -- pending | delivered | failed | skipped
  attempts        integer not null default 0,
  last_attempt_at timestamptz,
  delivered_at    timestamptz,
  error           text,
  occurred_at     timestamptz not null default now()
);

create index if not exists system_events_status_idx on system_events(status, occurred_at);
create index if not exists system_events_entity_idx on system_events(entity_type, entity_id);

-- Registro de entregas de webhook
create table if not exists webhook_deliveries (
  id              uuid primary key default gen_random_uuid(),
  system_event_id uuid not null references system_events(id) on delete cascade,
  endpoint        text not null,
  http_status     integer,
  response_body   text,
  duration_ms     integer,
  attempted_at    timestamptz not null default now()
);

-- Bitácora de auditoría (inmutable desde UI normal)
create table if not exists audit_log (
  id              uuid primary key default gen_random_uuid(),
  actor_id        uuid references profiles(id),
  actor_email     text,
  action          text not null,   -- 'agreement.closed', 'payment.approved', etc.
  entity_type     text not null,
  entity_id       uuid not null,
  event_id        uuid references events(id),
  before_data     jsonb,
  after_data      jsonb,
  reason          text,
  ip_address      inet,
  occurred_at     timestamptz not null default now()
);

create index if not exists audit_log_entity_idx on audit_log(entity_type, entity_id);
create index if not exists audit_log_actor_idx on audit_log(actor_id, occurred_at);

-- =========================================================
-- FK pendientes de coupon_redemptions
-- =========================================================

create table if not exists coupon_redemptions (
  id                  uuid primary key default gen_random_uuid(),
  coupon_id           uuid not null references coupons(id),
  ticket_entitlement_id uuid references ticket_entitlements(id),
  person_id           uuid references people(id),
  event_id            uuid references events(id),
  discount_applied    numeric(12,2) not null,
  redeemed_at         timestamptz not null default now()
);

alter table ticket_entitlements
  add constraint ticket_entitlements_coupon_fk
  foreign key (coupon_id) references coupons(id);

-- =========================================================
-- RLS
-- =========================================================

alter table resources enable row level security;
create policy resources_admin on resources for all using (is_admin());
create policy resources_public on resources for select using (is_public = true and is_active = true);

alter table event_resources enable row level security;
create policy event_resources_admin on event_resources for all using (is_admin());
create policy event_resources_empresa on event_resources
  for select using (visible_to in ('empresa', 'publico'));

alter table company_memberships enable row level security;
create policy company_memberships_admin on company_memberships for all using (is_admin());
create policy company_memberships_empresa on company_memberships
  for select using (company_id = my_company_id());

alter table system_events enable row level security;
create policy system_events_admin on system_events for all using (is_admin());

alter table audit_log enable row level security;
create policy audit_log_admin on audit_log for select using (is_admin());

alter table coupon_redemptions enable row level security;
create policy coupon_redemptions_admin on coupon_redemptions for all using (is_admin());
