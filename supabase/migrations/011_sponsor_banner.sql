-- =========================================================
-- sponsor_banner_configs — singleton por edición
-- =========================================================

create table sponsor_banner_configs (
  edition_id text primary key references editions (id) on delete cascade,
  enabled boolean not null default true,
  heading_label text,
  surfaces banner_surface[] not null default '{}',
  desktop_speed_seconds int not null default 30,
  mobile_speed_seconds int not null default 20,
  mobile_enabled boolean not null default true,
  collapsible boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger sponsor_banner_configs_set_updated_at
  before update on sponsor_banner_configs
  for each row execute function set_updated_at();

alter table sponsor_banner_configs enable row level security;

create policy sponsor_banner_configs_public_read on sponsor_banner_configs
  for select using (enabled = true);

create policy sponsor_banner_configs_admin_all on sponsor_banner_configs
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- banner_slots
-- =========================================================

create table banner_slots (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references editions (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  tier banner_tier not null,
  order_num int not null default 0,
  active boolean not null default true,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  logo_ready boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger banner_slots_set_updated_at
  before update on banner_slots
  for each row execute function set_updated_at();

alter table banner_slots enable row level security;

create policy banner_slots_public_read on banner_slots
  for select using (active = true);

create policy banner_slots_admin_all on banner_slots
  for all using (is_admin()) with check (is_admin());

-- RPCs para incrementar contadores desde el frontend público sin exponer
-- UPDATE directo de banner_slots a anon (evita que se manipule active/order/company_id).
create function increment_banner_impression(slot_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update banner_slots set impressions = impressions + 1 where id = slot_id and active = true;
$$;

grant execute on function increment_banner_impression(uuid) to anon, authenticated;

create function increment_banner_click(slot_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update banner_slots set clicks = clicks + 1 where id = slot_id and active = true;
$$;

grant execute on function increment_banner_click(uuid) to anon, authenticated;

-- =========================================================
-- Ahora que existen banner_slots, participations y stands, se agrega la
-- policy pública final de companies (reemplaza el placeholder de 004):
-- una empresa es visible públicamente solo si aparece en algún lugar público.
-- =========================================================

create policy companies_public_read on companies
  for select using (
    exists (select 1 from banner_slots bs where bs.company_id = companies.id and bs.active)
    or exists (select 1 from participations p where p.company_id = companies.id and p.status = 'publicado')
    or exists (select 1 from stands s where s.company_id = companies.id and s.status = 'vendido')
  );
