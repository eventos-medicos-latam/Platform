-- =========================================================
-- participation_plan_types — catálogo GLOBAL, 3 filas fijas
-- (Pop Up / Conexión / Protagonista). El copy del plan vive
-- aquí una sola vez y se consume igual desde web/portal/admin.
-- =========================================================

create table participation_plan_types (
  id plan_id_enum primary key,
  name text not null,
  verb text,
  tagline text,
  intro text[] not null default '{}',
  mockup text,
  benefit_groups jsonb not null default '[]', -- [{title, items:[]}]
  ideal_for text[] not null default '{}',
  closing text,
  space plan_space_kind not null,
  max_staff int not null default 0,
  guest_passes int not null default 0,
  includes_bridge boolean not null default false,
  includes_speaker boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger participation_plan_types_set_updated_at
  before update on participation_plan_types
  for each row execute function set_updated_at();

alter table participation_plan_types enable row level security;

create policy participation_plan_types_public_read on participation_plan_types
  for select using (true);

create policy participation_plan_types_admin_all on participation_plan_types
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- participation_plan_editions — precio/inventario, UNA fila
-- por (plan, edición). Lo único que cambia cada año.
-- =========================================================

create table participation_plan_editions (
  plan_id plan_id_enum not null references participation_plan_types (id),
  edition_id text not null references editions (id) on delete cascade,
  price numeric(12, 2) not null,
  currency text not null default 'COP' check (currency = 'COP'),
  total_inventory int null,
  sold int not null default 0,
  availability_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (plan_id, edition_id),
  check (total_inventory is null or sold <= total_inventory)
);

create trigger participation_plan_editions_set_updated_at
  before update on participation_plan_editions
  for each row execute function set_updated_at();

alter table participation_plan_editions enable row level security;

create policy participation_plan_editions_public_read on participation_plan_editions
  for select using (
    exists (select 1 from editions e where e.id = participation_plan_editions.edition_id and e.status <> 'borrador')
  );

create policy participation_plan_editions_admin_all on participation_plan_editions
  for all using (is_admin()) with check (is_admin());

-- Función reutilizada por el trigger sync_plan_sold, que se ATA a la tabla
-- `participations` en 008_participations_and_workflow.sql (participations
-- todavía no existe en este punto de la migración).
create function sync_plan_sold()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  counted_statuses participation_status[] := array['aprobado', 'publicado', 'cerrado'];
  was_counted boolean;
  is_counted boolean;
begin
  was_counted := (tg_op = 'UPDATE') and (old.status = any (counted_statuses));
  is_counted := new.status = any (counted_statuses);

  if is_counted and not was_counted then
    update participation_plan_editions
      set sold = sold + 1
      where plan_id = new.plan_id and edition_id = new.edition_id
        and (total_inventory is null or sold < total_inventory);
    if not found then
      raise exception 'No hay cupo disponible para el plan % en esta edición', new.plan_id;
    end if;
  elsif was_counted and not is_counted then
    update participation_plan_editions
      set sold = greatest(sold - 1, 0)
      where plan_id = old.plan_id and edition_id = old.edition_id;
  end if;

  return new;
end;
$$;

-- =========================================================
-- plan_comparison_rows — tabla comparativa de marketing
-- =========================================================

create table plan_comparison_rows (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references editions (id) on delete cascade,
  label text not null,
  plan_values jsonb not null, -- {"pop-up":"...", "conexion":"...", "protagonista":"..."}
  footnote boolean not null default false,
  order_num int not null default 0
);

alter table plan_comparison_rows enable row level security;

create policy plan_comparison_rows_public_read on plan_comparison_rows
  for select using (
    exists (select 1 from editions e where e.id = plan_comparison_rows.edition_id and e.status <> 'borrador')
  );

create policy plan_comparison_rows_admin_all on plan_comparison_rows
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- bridge_sponsorships — exclusividad de un track por el plan Protagonista
-- =========================================================

create table bridge_sponsorships (
  track_id text primary key references tracks (id) on delete cascade,
  company_id uuid null references companies (id),
  status bridge_sponsorship_status not null default 'disponible'
);

alter table bridge_sponsorships enable row level security;

create policy bridge_sponsorships_public_read on bridge_sponsorships
  for select using (true);

create policy bridge_sponsorships_admin_all on bridge_sponsorships
  for all using (is_admin()) with check (is_admin());
