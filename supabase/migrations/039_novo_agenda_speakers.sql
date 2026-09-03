-- =========================================================
-- NOVO ARCHITECTURE — Agenda, espacios y speakers globales
-- Speaker = persona + perfil; reutilizable en muchos eventos.
-- =========================================================

-- Espacios / salas por evento
create table if not exists event_spaces (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  name        text not null,      -- "Auditorio Principal", "Sala B", "Plataforma Zoom"
  capacity    integer,
  modality    novo_event_modality,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Actividades de la agenda
create table if not exists agenda_items (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  space_id        uuid references event_spaces(id) on delete set null,
  name            text not null,
  activity_type   text not null default 'conferencia',
  -- Tipos: registro, conferencia, keynote, panel, conversacion, coffee,
  --        networking, exposicion-comercial, lunch, cierre, workshop, otro
  item_date       date not null,
  start_time      time not null,
  end_time        time not null,
  description     text,
  is_highlight    boolean not null default false,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger agenda_items_set_updated_at
  before update on agenda_items
  for each row execute function set_updated_at();

-- Perfil de speaker (global, reutilizable)
create table if not exists speaker_profiles (
  id                  uuid primary key default gen_random_uuid(),
  person_id           uuid not null unique references people(id) on delete cascade,
  public_title        text,           -- "Dr.", "PhD.", "Esp."
  public_institution  text,
  specialty           text,
  subspecialty        text,
  topics              text[],
  bio                 text,
  photo_url           text,
  linkedin_url        text,
  instagram_url       text,
  website_url         text,
  is_public           boolean not null default false,
  badge_count         integer not null default 0, -- apariciones en eventos EML
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger speaker_profiles_set_updated_at
  before update on speaker_profiles
  for each row execute function set_updated_at();

-- Relación speaker ↔ evento
create table if not exists event_speakers (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  speaker_id      uuid not null references speaker_profiles(id),
  status          text not null default 'invitado',
  -- invitado | en-negociacion | confirmado | cancelado | publicado
  is_featured     boolean not null default false,
  internal_notes  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (event_id, speaker_id)
);

-- Speakers en actividades de agenda (many-to-many)
create table if not exists agenda_item_speakers (
  agenda_item_id  uuid not null references agenda_items(id) on delete cascade,
  event_speaker_id uuid not null references event_speakers(id) on delete cascade,
  role            text not null default 'ponente', -- ponente | moderador | panelista
  primary key (agenda_item_id, event_speaker_id)
);

-- =========================================================
-- RLS
-- =========================================================

alter table event_spaces enable row level security;
create policy event_spaces_admin on event_spaces for all using (is_admin());
create policy event_spaces_public on event_spaces for select using (true);

alter table agenda_items enable row level security;
create policy agenda_items_admin on agenda_items for all using (is_admin());
create policy agenda_items_public on agenda_items for select using (true);

alter table speaker_profiles enable row level security;
create policy speaker_profiles_admin on speaker_profiles for all using (is_admin());
create policy speaker_profiles_public on speaker_profiles
  for select using (is_public = true);

alter table event_speakers enable row level security;
create policy event_speakers_admin on event_speakers for all using (is_admin());
create policy event_speakers_confirmed on event_speakers
  for select using (status in ('confirmado', 'publicado'));

alter table agenda_item_speakers enable row level security;
create policy agenda_item_speakers_admin on agenda_item_speakers for all using (is_admin());
create policy agenda_item_speakers_public on agenda_item_speakers for select using (true);
