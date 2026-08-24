-- =========================================================
-- info_products
-- =========================================================

create table info_products (
  id uuid primary key default gen_random_uuid(),
  name text,
  kind info_product_kind not null,
  format product_format not null,
  claim text,
  description text,
  price numeric(12, 2) null,
  vat_rate numeric(5, 2) not null default 0,
  volume_label text,
  includes text[] not null default '{}',
  related_edition_id text null references editions (id),
  track_id text null references tracks (id),
  status publication_status not null default 'borrador',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger info_products_set_updated_at
  before update on info_products
  for each row execute function set_updated_at();

alter table info_products enable row level security;

create policy info_products_public_read on info_products
  for select using (status in ('aprobado', 'publicado'));

create policy info_products_admin_all on info_products
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- upcoming_products — singleton "próximo lanzamiento"
-- =========================================================

create table upcoming_products (
  id int primary key default 1 check (id = 1),
  name text,
  category text,
  claim text,
  description text[] not null default '{}',
  pillars jsonb not null default '[]', -- [{id,title,description,icon}]
  stage launch_stage not null,
  launch_window text,
  pioneers int not null default 0,
  status publication_status not null default 'borrador',
  updated_at timestamptz not null default now()
);

create trigger upcoming_products_set_updated_at
  before update on upcoming_products
  for each row execute function set_updated_at();

alter table upcoming_products enable row level security;

create policy upcoming_products_public_read on upcoming_products
  for select using (status = 'publicado');

create policy upcoming_products_admin_all on upcoming_products
  for all using (is_admin()) with check (is_admin());
