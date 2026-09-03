-- =========================================================
-- NOVO ARCHITECTURE — Identidad universal de personas
-- Regla de ORO: una persona = un person_id
-- =========================================================

-- Identidad maestra
create table if not exists people (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  birth_date  date,
  city        text,
  country     text,
  avatar_url  text,
  notes       text, -- notas internas EML
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger people_set_updated_at
  before update on people
  for each row execute function set_updated_at();

-- Todos los identificadores de una persona
create table if not exists person_identifiers (
  id                uuid primary key default gen_random_uuid(),
  person_id         uuid not null references people(id) on delete cascade,
  identifier_type   novo_identifier_type not null,
  raw_value         text not null,
  normalized_value  text not null, -- lowercase, sin espacios, +57... para teléfonos
  verified          boolean not null default false,
  is_primary        boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (identifier_type, normalized_value)
);

create index if not exists person_identifiers_lookup
  on person_identifiers (identifier_type, normalized_value);

-- Clasificaciones funcionales (no son roles de plataforma)
create table if not exists person_classifications (
  id              uuid primary key default gen_random_uuid(),
  person_id       uuid not null references people(id) on delete cascade,
  classification  novo_person_classification not null,
  source          text, -- web-registro, portal-empresa, import, manual
  event_id        uuid, -- FK a events se agrega en 034
  created_at      timestamptz not null default now(),
  unique (person_id, classification, event_id)
);

-- Perfil profesional de salud (solo si aplica)
create table if not exists professional_profiles (
  id               uuid primary key default gen_random_uuid(),
  person_id        uuid not null unique references people(id) on delete cascade,
  profession       text,
  specialty        text,
  subspecialty     text,
  institution      text,
  areas_of_interest text[],
  linkedin_url     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger professional_profiles_set_updated_at
  before update on professional_profiles
  for each row execute function set_updated_at();

-- Vínculo Supabase Auth -> person_id (añade columna a profiles legacy)
alter table profiles add column if not exists person_id uuid references people(id);

-- =========================================================
-- RLS
-- =========================================================

alter table people enable row level security;

create policy people_admin_all on people
  for all using (is_admin());

create policy people_self_read on people
  for select using (
    exists (
      select 1 from person_identifiers pi
      join profiles p on p.person_id = people.id
      where p.id = auth.uid()
    )
  );

alter table person_identifiers enable row level security;

create policy person_identifiers_admin on person_identifiers
  for all using (is_admin());

alter table person_classifications enable row level security;

create policy person_classifications_admin on person_classifications
  for all using (is_admin());

alter table professional_profiles enable row level security;

create policy professional_profiles_admin on professional_profiles
  for all using (is_admin());
