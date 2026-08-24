-- =========================================================
-- stands
-- =========================================================

create table stands (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references editions (id) on delete cascade,
  number text not null,
  category text,
  location text,
  size text,
  price numeric(12, 2) null,
  status stand_status not null default 'disponible',
  company_id uuid null references companies (id),
  benefits text[] not null default '{}',
  plan_col int not null,
  plan_row int not null,
  plan_w int not null default 1,
  plan_h int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, number)
);

create trigger stands_set_updated_at
  before update on stands
  for each row execute function set_updated_at();

alter table stands enable row level security;

create policy stands_public_read on stands
  for select using (
    exists (select 1 from editions e where e.id = stands.edition_id and e.status <> 'borrador')
  );

create policy stands_admin_all on stands
  for all using (is_admin()) with check (is_admin());

-- Función reutilizada por el trigger claim_stand, que se ATA a la tabla
-- `participations` en 008_participations_and_workflow.sql.
create function claim_stand()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stand_id is not null and (tg_op = 'INSERT' or new.stand_id is distinct from old.stand_id) then
    update stands
      set status = 'reservado', company_id = new.company_id
      where id = new.stand_id and status = 'disponible';
    if not found then
      raise exception 'El stand % ya no está disponible', new.stand_id;
    end if;
  end if;

  if tg_op = 'UPDATE' and old.stand_id is not null and old.stand_id is distinct from new.stand_id then
    update stands
      set status = 'disponible', company_id = null
      where id = old.stand_id and company_id = old.company_id;
  end if;

  return new;
end;
$$;

-- =========================================================
-- plan_features — elementos fijos del mapa, NO vendibles
-- =========================================================

create table plan_features (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references editions (id) on delete cascade,
  label text,
  kind plan_feature_kind not null,
  plan_col int not null,
  plan_row int not null,
  plan_w int not null default 1,
  plan_h int not null default 1
);

alter table plan_features enable row level security;

create policy plan_features_public_read on plan_features
  for select using (
    exists (select 1 from editions e where e.id = plan_features.edition_id and e.status <> 'borrador')
  );

create policy plan_features_admin_all on plan_features
  for all using (is_admin()) with check (is_admin());
