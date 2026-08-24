-- =========================================================
-- organization_profile — singleton institucional
-- =========================================================

create table organization_profile (
  id int primary key default 1 check (id = 1),
  name text,
  legal_name text,
  city text,
  country text,
  claim text,
  value_proposition text,
  description text[] not null default '{}',
  focus text[] not null default '{}',
  contact_email text,
  contact_whatsapp text,
  updated_at timestamptz not null default now()
);

create trigger organization_profile_set_updated_at
  before update on organization_profile
  for each row execute function set_updated_at();

alter table organization_profile enable row level security;

create policy organization_profile_public_read on organization_profile
  for select using (true);

create policy organization_profile_admin_all on organization_profile
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- organization_metrics
-- =========================================================

create table organization_metrics (
  id uuid primary key default gen_random_uuid(),
  label text,
  value text,
  note text,
  status publication_status not null default 'borrador',
  order_num int not null default 0
);

alter table organization_metrics enable row level security;

create policy organization_metrics_public_read on organization_metrics
  for select using (status = 'publicado');

create policy organization_metrics_admin_all on organization_metrics
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- content_items
-- =========================================================

create table content_items (
  id uuid primary key default gen_random_uuid(),
  kind content_kind not null,
  title text,
  excerpt text,
  edition_id text null references editions (id),
  track_id text null references tracks (id),
  author text,
  date date,
  reading_time text,
  status publication_status not null default 'borrador',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger content_items_set_updated_at
  before update on content_items
  for each row execute function set_updated_at();

alter table content_items enable row level security;

create policy content_items_public_read on content_items
  for select using (status = 'publicado');

create policy content_items_admin_all on content_items
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- allies
-- =========================================================

create table allies (
  id uuid primary key default gen_random_uuid(),
  name text,
  role company_role not null,
  web text,
  description text,
  status publication_status not null default 'borrador',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger allies_set_updated_at
  before update on allies
  for each row execute function set_updated_at();

alter table allies enable row level security;

create policy allies_public_read on allies
  for select using (status = 'publicado');

create policy allies_admin_all on allies
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- ally_editions (junction, reemplaza Ally.editionIds[])
-- =========================================================

create table ally_editions (
  ally_id uuid not null references allies (id) on delete cascade,
  edition_id text not null references editions (id) on delete cascade,
  primary key (ally_id, edition_id)
);

alter table ally_editions enable row level security;

create policy ally_editions_public_read on ally_editions
  for select using (
    exists (select 1 from allies a where a.id = ally_editions.ally_id and a.status = 'publicado')
  );

create policy ally_editions_admin_all on ally_editions
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- secondary_events — webinars / masterclasses
-- =========================================================

create table secondary_events (
  id uuid primary key default gen_random_uuid(),
  title text,
  kind secondary_event_kind not null,
  date date,
  time text,
  speaker_label text,
  modality modality not null,
  price numeric(12, 2) null,
  seats int null,
  registered int not null default 0,
  related_edition_id text null references editions (id),
  crm_tag text,
  status publication_status not null default 'borrador',
  description text,
  duration_minutes int,
  platform text,
  track_id text null references tracks (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger secondary_events_set_updated_at
  before update on secondary_events
  for each row execute function set_updated_at();

alter table secondary_events enable row level security;

create policy secondary_events_public_read on secondary_events
  for select using (status in ('aprobado', 'publicado'));

create policy secondary_events_admin_all on secondary_events
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- community_members — leads públicos
-- =========================================================

create table community_members (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  city text,
  specialty text,
  interest_track_id text null references tracks (id),
  source text,
  consent_commercial boolean not null default false,
  crm_synced boolean not null default false,
  ip_address inet null,
  created_at timestamptz not null default now()
);

alter table community_members enable row level security;

create policy community_members_public_insert on community_members
  for insert to anon, authenticated
  with check (true);

create policy community_members_admin_all on community_members
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- form_definitions — metadata de integración con GoHighLevel (CRM)
-- =========================================================

create table form_definitions (
  id uuid primary key default gen_random_uuid(),
  name text,
  purpose text,
  crm_payload text[] not null default '{}',
  crm_tags text[] not null default '{}',
  submissions int not null default 0,
  last_synced_at timestamptz,
  active boolean not null default true
);

alter table form_definitions enable row level security;

create policy form_definitions_admin_all on form_definitions
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- seo_records
-- =========================================================

create table seo_records (
  id uuid primary key default gen_random_uuid(),
  scope text not null unique,
  meta_title text,
  meta_description text,
  slug text,
  og_image text,
  canonical text,
  indexable boolean not null default true,
  schema seo_schema_type not null
);

alter table seo_records enable row level security;

create policy seo_records_public_read on seo_records
  for select using (true);

create policy seo_records_admin_all on seo_records
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- legal_documents
-- =========================================================

create table legal_documents (
  id uuid primary key default gen_random_uuid(),
  title text,
  summary text,
  status publication_status not null default 'borrador',
  body text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create trigger legal_documents_set_updated_at
  before update on legal_documents
  for each row execute function set_updated_at();

alter table legal_documents enable row level security;

create policy legal_documents_public_read on legal_documents
  for select using (status = 'publicado');

create policy legal_documents_admin_all on legal_documents
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- legacy_events — trayectoria institucional histórica
-- =========================================================

create table legacy_events (
  id text primary key,
  order_num int not null,
  year int not null,
  topic text,
  name text,
  claim text,
  description text,
  highlights text[] not null default '{}',
  image text,
  tone_var text,
  href text,
  status legacy_event_status not null,
  attendees int null
);

alter table legacy_events enable row level security;

create policy legacy_events_public_read on legacy_events
  for select using (true);

create policy legacy_events_admin_all on legacy_events
  for all using (is_admin()) with check (is_admin());
