-- =========================================================
-- NOVO ARCHITECTURE — Catálogo global de productos
-- Un producto existe globalmente; event_products configura por evento.
-- =========================================================

create table if not exists products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  category        novo_product_category not null,
  description     text,
  list_price      numeric(12,2) not null default 0,
  min_price       numeric(12,2), -- precio mínimo autorizado para asesor comercial
  currency        text not null default 'COP',
  image_url       text,
  is_active       boolean not null default true,
  custom_fields   jsonb, -- { label, type, required, options }[]
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- Configuración del producto dentro de un evento
create table if not exists event_products (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  product_id      uuid not null references products(id),
  price           numeric(12,2), -- null = usa list_price del producto
  inventory       integer,       -- null = sin límite
  is_available    boolean not null default true,
  benefits        text[],
  conditions      text,
  custom_values   jsonb,         -- valores para los custom_fields del producto
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (event_id, product_id)
);

create trigger event_products_set_updated_at
  before update on event_products
  for each row execute function set_updated_at();

-- =========================================================
-- RLS
-- =========================================================

alter table products enable row level security;

create policy products_admin_all on products
  for all using (is_admin());

create policy products_empresa_read on products
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'empresa')
    and is_active = true
  );

alter table event_products enable row level security;

create policy event_products_admin_all on event_products
  for all using (is_admin());

create policy event_products_empresa_read on event_products
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'empresa')
    and is_available = true
  );
