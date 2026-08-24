-- =========================================================
-- event_families
-- =========================================================

create table event_families (
  id text primary key,
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  since int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger event_families_set_updated_at
  before update on event_families
  for each row execute function set_updated_at();

alter table event_families enable row level security;

create policy event_families_public_read on event_families
  for select using (true);

create policy event_families_admin_all on event_families
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- editions
-- =========================================================

create table editions (
  id text primary key,
  family_id text not null references event_families (id) on delete cascade,
  slug text not null unique,
  name text not null,
  edition_label text,
  year int not null,
  claim text,
  concept_lead text,
  concept text[] not null default '{}',
  status edition_status not null default 'borrador',
  start_date date,
  end_date date,
  date_label text,
  venue_name text,
  venue_address text,
  venue_city text,
  venue_country text,
  venue_notes text,
  modality modality not null default 'presencial',
  accent_rgb text,
  hero_kicker text,
  sections edition_section[] not null default '{}',
  track_axis_label text,
  track_axis_plural_label text,
  track_axis_interest_question text,
  audience text[] not null default '{}',
  benefits text[] not null default '{}',
  certification text,
  capacity text,
  previous_edition_id text null references editions (id),
  next_edition_id text null references editions (id),
  results jsonb not null default '[]',
  pre_experience jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger editions_set_updated_at
  before update on editions
  for each row execute function set_updated_at();

alter table editions enable row level security;

create policy editions_public_read on editions
  for select using (status <> 'borrador');

create policy editions_admin_all on editions
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- tracks ("puentes" temáticos, normalizados fuera de Edition.trackAxis)
-- =========================================================

create table tracks (
  id text primary key,
  edition_id text not null references editions (id) on delete cascade,
  order_num int not null,
  name text not null,
  subtitle text,
  description text,
  icon track_icon not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, order_num)
);

create trigger tracks_set_updated_at
  before update on tracks
  for each row execute function set_updated_at();

alter table tracks enable row level security;

create policy tracks_public_read on tracks
  for select using (
    exists (select 1 from editions e where e.id = tracks.edition_id and e.status <> 'borrador')
  );

create policy tracks_admin_all on tracks
  for all using (is_admin()) with check (is_admin());
