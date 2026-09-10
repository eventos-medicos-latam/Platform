-- =========================================================
-- NOVO ARCHITECTURE — Agenda, espacios y speakers globales
-- Speaker = persona + perfil; reutilizable en muchos eventos.
--
-- NO se llama agenda_items: esa tabla ya existe (migración 005,
-- edition_id de Hormobiota). CREATE IF NOT EXISTS la dejaría intacta.
-- =========================================================

create table if not exists event_spaces (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  name        text not null,
  capacity    integer,
  modality    novo_event_modality,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists event_agenda_items (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  space_id        uuid references event_spaces(id) on delete set null,
  name            text not null,
  activity_type   text not null default 'conferencia',
  item_date       date not null,
  start_time      time not null,
  end_time        time not null,
  description     text,
  is_highlight    boolean not null default false,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists event_agenda_items_set_updated_at on event_agenda_items;
create trigger event_agenda_items_set_updated_at
  before update on event_agenda_items
  for each row execute function set_updated_at();

create table if not exists speaker_profiles (
  id                  uuid primary key default gen_random_uuid(),
  person_id           uuid not null unique references people(id) on delete cascade,
  public_title        text,
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
  badge_count         integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists speaker_profiles_set_updated_at on speaker_profiles;
create trigger speaker_profiles_set_updated_at
  before update on speaker_profiles
  for each row execute function set_updated_at();

create table if not exists event_speakers (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  speaker_id      uuid not null references speaker_profiles(id),
  status          text not null default 'invitado',
  is_featured     boolean not null default false,
  internal_notes  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (event_id, speaker_id)
);

create table if not exists event_agenda_item_speakers (
  agenda_item_id   uuid not null references event_agenda_items(id) on delete cascade,
  event_speaker_id uuid not null references event_speakers(id) on delete cascade,
  role             text not null default 'ponente',
  primary key (agenda_item_id, event_speaker_id)
);

alter table event_spaces enable row level security;
drop policy if exists event_spaces_admin on event_spaces;
drop policy if exists event_spaces_public on event_spaces;
create policy event_spaces_admin on event_spaces for all using (is_admin());
create policy event_spaces_public on event_spaces for select using (true);

alter table event_agenda_items enable row level security;
drop policy if exists event_agenda_items_admin on event_agenda_items;
drop policy if exists event_agenda_items_public on event_agenda_items;
create policy event_agenda_items_admin on event_agenda_items for all using (is_admin());
create policy event_agenda_items_public on event_agenda_items for select using (true);

alter table speaker_profiles enable row level security;
drop policy if exists speaker_profiles_admin on speaker_profiles;
drop policy if exists speaker_profiles_public on speaker_profiles;
create policy speaker_profiles_admin on speaker_profiles for all using (is_admin());
create policy speaker_profiles_public on speaker_profiles
  for select using (is_public = true);

alter table event_speakers enable row level security;
drop policy if exists event_speakers_admin on event_speakers;
drop policy if exists event_speakers_confirmed on event_speakers;
create policy event_speakers_admin on event_speakers for all using (is_admin());
create policy event_speakers_confirmed on event_speakers
  for select using (status in ('confirmado', 'publicado'));

alter table event_agenda_item_speakers enable row level security;
drop policy if exists event_agenda_item_speakers_admin on event_agenda_item_speakers;
drop policy if exists event_agenda_item_speakers_public on event_agenda_item_speakers;
create policy event_agenda_item_speakers_admin on event_agenda_item_speakers for all using (is_admin());
create policy event_agenda_item_speakers_public on event_agenda_item_speakers for select using (true);
