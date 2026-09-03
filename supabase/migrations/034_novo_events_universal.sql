-- =========================================================
-- NOVO ARCHITECTURE — Evento universal
-- Reemplaza event_families + editions + secondary_events
-- Todo tipo de evento es la misma entidad.
-- =========================================================

create table if not exists events (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  slug                    text not null unique,
  event_type              novo_event_type not null,
  modality                novo_event_modality not null,
  audience                novo_event_audience not null default 'profesionales',

  -- Fechas
  start_date              date not null,
  end_date                date not null,
  start_time              time,
  end_time                time,
  timezone                text not null default 'America/Bogota',

  -- Lugar / plataforma
  venue_name              text,
  venue_address           text,
  venue_city              text,
  venue_country           text default 'Colombia',
  platform_name           text,
  platform_url            text,

  -- Visibilidad y precio
  is_public               boolean not null default true,
  is_free                 boolean not null default false,

  -- Entidad contratante (null = propio EML)
  contracting_company_id  uuid references companies(id),

  -- Identidad visual
  cover_image_url         text,
  logo_url                text,
  primary_color           text,
  accent_color            text,

  -- Contenido
  description             text,
  tagline                 text,

  -- Certificado
  has_certificate         boolean not null default false,
  certificate_send_at     timestamptz,

  -- Capacidad
  max_capacity            integer,

  -- Featured en home (control manual)
  is_featured             boolean not null default false,

  -- KPIs / metas (jsonb flexible: { registros: 500, ingresos: 10000000 })
  goals                   jsonb,

  -- Estados
  operational_status      novo_event_operational_status not null default 'borrador',
  publication_status      novo_event_publication_status not null default 'borrador',

  created_by              uuid references profiles(id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger events_set_updated_at
  before update on events
  for each row execute function set_updated_at();

create index if not exists events_operational_status_idx on events(operational_status);
create index if not exists events_start_date_idx on events(start_date);

-- Configuración extendida por evento
create table if not exists event_settings (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null unique references events(id) on delete cascade,
  -- 12 secciones de la página web (visible/oculta)
  sections    jsonb not null default '{
    "hero": true, "info": true, "speakers": true, "agenda": true,
    "tickets": true, "sponsors": true, "stands": true, "gallery": false,
    "location": true, "faq": true, "contact": true, "cta": true
  }',
  -- Custom config por módulo
  custom      jsonb,
  updated_at  timestamptz not null default now()
);

-- Vincular FK pendiente de person_classifications -> events
alter table person_classifications
  add constraint person_classifications_event_fk
  foreign key (event_id) references events(id) on delete set null;

-- =========================================================
-- RLS
-- =========================================================

alter table events enable row level security;

create policy events_admin_all on events
  for all using (is_admin());

create policy events_public_read on events
  for select using (publication_status = 'publicado' and is_public = true);

alter table event_settings enable row level security;

create policy event_settings_admin on event_settings
  for all using (is_admin());
