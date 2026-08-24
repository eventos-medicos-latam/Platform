-- =========================================================
-- participations — entidad central Company × Edition
-- =========================================================

create table participations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  edition_id text not null references editions (id) on delete cascade,
  roles company_role[] not null default '{}',
  plan_id plan_id_enum not null references participation_plan_types (id),
  stand_id uuid null references stands (id),
  included_tickets int not null default 0,
  activations text[] not null default '{}',
  sponsored_speaker_track_id text null references tracks (id),
  track_id text null references tracks (id),
  agreed_amount numeric(12, 2) null,
  paid_amount numeric(12, 2) not null default 0,
  status participation_status not null default 'en-negociacion',
  banner_tier banner_tier null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, edition_id),
  foreign key (plan_id, edition_id) references participation_plan_editions (plan_id, edition_id)
);

create trigger participations_set_updated_at
  before update on participations
  for each row execute function set_updated_at();

-- Ata las funciones definidas en 006 (sync_plan_sold) y 007 (claim_stand),
-- ahora que participations existe.
create trigger participations_sync_plan_sold
  after insert or update on participations
  for each row execute function sync_plan_sold();

create trigger participations_claim_stand
  after insert or update on participations
  for each row execute function claim_stand();

alter table participations enable row level security;

create policy participations_company_read on participations
  for select using (company_id = my_company_id() or is_admin());

create policy participations_admin_write on participations
  for insert with check (is_admin());

create policy participations_admin_update on participations
  for update using (is_admin()) with check (is_admin());

create policy participations_admin_delete on participations
  for delete using (is_admin());

-- =========================================================
-- requirements
-- =========================================================

create table requirements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  edition_id text not null references editions (id) on delete cascade,
  title text,
  description text,
  owner text,
  due_date date,
  kind requirement_kind not null,
  status requirement_status not null default 'pendiente',
  auto_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger requirements_set_updated_at
  before update on requirements
  for each row execute function set_updated_at();

alter table requirements enable row level security;

create policy requirements_company_read on requirements
  for select using (company_id = my_company_id() or is_admin());

create policy requirements_admin_write on requirements
  for insert with check (is_admin());

create policy requirements_write_update on requirements
  for update using (company_id = my_company_id() or is_admin())
  with check (company_id = my_company_id() or is_admin());

create policy requirements_admin_delete on requirements
  for delete using (is_admin());

-- =========================================================
-- requirement_comments
-- =========================================================

create table requirement_comments (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references requirements (id) on delete cascade,
  author text,
  date timestamptz not null default now(),
  text text not null
);

alter table requirement_comments enable row level security;

create policy requirement_comments_read on requirement_comments
  for select using (
    exists (
      select 1 from requirements r
      where r.id = requirement_comments.requirement_id
        and (r.company_id = my_company_id() or is_admin())
    )
  );

create policy requirement_comments_insert on requirement_comments
  for insert with check (
    exists (
      select 1 from requirements r
      where r.id = requirement_comments.requirement_id
        and (r.company_id = my_company_id() or is_admin())
    )
  );

create policy requirement_comments_admin_delete on requirement_comments
  for delete using (is_admin());

-- =========================================================
-- company_documents
-- =========================================================

create table company_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  edition_id text not null references editions (id) on delete cascade,
  kind company_document_kind not null,
  name text,
  status company_document_status not null default 'pendiente',
  date timestamptz not null default now(),
  size_label text,
  file_path text null
);

alter table company_documents enable row level security;

create policy company_documents_read on company_documents
  for select using (company_id = my_company_id() or is_admin());

create policy company_documents_insert on company_documents
  for insert with check (company_id = my_company_id() or is_admin());

create policy company_documents_admin_update on company_documents
  for update using (is_admin()) with check (is_admin());

create policy company_documents_admin_delete on company_documents
  for delete using (is_admin());

-- =========================================================
-- company_payments
-- =========================================================

create table company_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  edition_id text not null references editions (id) on delete cascade,
  concept text,
  amount numeric(12, 2) not null,
  due_date date,
  status company_payment_status not null default 'pendiente',
  paid_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table company_payments enable row level security;

create policy company_payments_read on company_payments
  for select using (company_id = my_company_id() or is_admin());

create policy company_payments_admin_write on company_payments
  for insert with check (is_admin());

create policy company_payments_admin_update on company_payments
  for update using (is_admin()) with check (is_admin());

create policy company_payments_admin_delete on company_payments
  for delete using (is_admin());

-- =========================================================
-- activity_log — bitácora, se llena por trigger (log_activity)
-- =========================================================

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  edition_id text null references editions (id),
  date timestamptz not null default now(),
  actor text,
  action text,
  comment text
);

alter table activity_log enable row level security;

create policy activity_log_read on activity_log
  for select using (company_id = my_company_id() or is_admin());

create policy activity_log_admin_all on activity_log
  for all using (is_admin()) with check (is_admin());

-- Trigger genérico: registra automáticamente cambios de participations,
-- requirements, company_documents, company_payments y brand_assets.
create function log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_edition_id text;
  v_actor text;
  v_action text;
  v_row record;
begin
  v_row := coalesce(new, old);
  v_company_id := v_row.company_id;

  if tg_table_name in ('participations', 'requirements', 'company_documents', 'company_payments') then
    v_edition_id := v_row.edition_id;
  else
    v_edition_id := null;
  end if;

  select full_name into v_actor from profiles where id = auth.uid();
  v_actor := coalesce(v_actor, 'sistema');

  v_action := tg_table_name || ':' || lower(tg_op);

  insert into activity_log (company_id, edition_id, actor, action, comment)
  values (v_company_id, v_edition_id, v_actor, v_action, null);

  return v_row;
end;
$$;

create trigger participations_log_activity
  after insert or update or delete on participations
  for each row execute function log_activity();

create trigger requirements_log_activity
  after insert or update or delete on requirements
  for each row execute function log_activity();

create trigger company_documents_log_activity
  after insert or update or delete on company_documents
  for each row execute function log_activity();

create trigger company_payments_log_activity
  after insert or update or delete on company_payments
  for each row execute function log_activity();

create trigger brand_assets_log_activity
  after insert or update or delete on brand_assets
  for each row execute function log_activity();

-- Cuando se aprueba un logo, marca companies.logo_ready = true; si se revierte
-- y no queda ningún otro logo aprobado, vuelve a false.
create function sync_company_logo_ready()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_still_has_logo boolean;
begin
  v_row := coalesce(new, old);

  if v_row.kind not in ('logo-png', 'logo-svg') then
    return coalesce(new, old);
  end if;

  select exists (
    select 1 from brand_assets
    where company_id = v_row.company_id
      and kind in ('logo-png', 'logo-svg')
      and status = 'aprobado'
  ) into v_still_has_logo;

  update companies set logo_ready = v_still_has_logo where id = v_row.company_id;

  return coalesce(new, old);
end;
$$;

create trigger brand_assets_sync_logo_ready
  after insert or update or delete on brand_assets
  for each row execute function sync_company_logo_ready();
