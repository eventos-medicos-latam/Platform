-- =========================================================
-- companies
-- =========================================================

create table companies (
  id uuid primary key default gen_random_uuid(),
  trade_name text not null,
  legal_name text,
  nit text,
  address text,
  city text,
  country text,
  web text,
  instagram text,
  contact_name text,
  contact_email text,
  contact_whatsapp text,
  description text,
  is_sample_data boolean not null default false,
  logo_ready boolean not null default false,
  logo_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index companies_nit_unique on companies (nit) where nit is not null and nit <> '';

create trigger companies_set_updated_at
  before update on companies
  for each row execute function set_updated_at();

-- Ahora que companies existe, se puede completar la FK de profiles.company_id
alter table profiles
  add constraint profiles_company_id_fkey
  foreign key (company_id) references companies (id) on delete set null;

alter table companies enable row level security;

-- Lectura pública final (depende de banner_slots/participations/stands, que aún no
-- existen) se agrega en 011_sponsor_banner.sql. Por ahora solo empresa propia + admin.
create policy companies_self_read on companies
  for select using (id = my_company_id());

create policy companies_self_update on companies
  for update using (id = my_company_id()) with check (id = my_company_id());

create policy companies_admin_all on companies
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- brand_assets
-- =========================================================

create table brand_assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  kind brand_asset_kind not null,
  name text not null,
  status brand_asset_status not null default 'pendiente',
  file_path text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger brand_assets_set_updated_at
  before update on brand_assets
  for each row execute function set_updated_at();

alter table brand_assets enable row level security;

create policy brand_assets_company_read on brand_assets
  for select using (company_id = my_company_id() or is_admin());

create policy brand_assets_company_write on brand_assets
  for insert with check (company_id = my_company_id() or is_admin());

create policy brand_assets_admin_update on brand_assets
  for update using (is_admin()) with check (is_admin());

create policy brand_assets_admin_delete on brand_assets
  for delete using (is_admin());

-- =========================================================
-- brand_staff_members
-- =========================================================

create table brand_staff_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text,
  role text,
  email text,
  document text,
  accreditation_status staff_accreditation_status not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger brand_staff_members_set_updated_at
  before update on brand_staff_members
  for each row execute function set_updated_at();

alter table brand_staff_members enable row level security;

create policy brand_staff_members_company_rw on brand_staff_members
  for all using (company_id = my_company_id() or is_admin())
  with check (company_id = my_company_id() or is_admin());

-- =========================================================
-- brand_guests
-- =========================================================

create table brand_guests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text,
  specialty text,
  email text,
  city text,
  status guest_status not null default 'invitado',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger brand_guests_set_updated_at
  before update on brand_guests
  for each row execute function set_updated_at();

alter table brand_guests enable row level security;

create policy brand_guests_company_rw on brand_guests
  for all using (company_id = my_company_id() or is_admin())
  with check (company_id = my_company_id() or is_admin());
