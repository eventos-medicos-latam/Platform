-- =========================================================
-- plan_requests — lead entrante del configurador público
-- (aún NO es una participation)
-- =========================================================

create table plan_requests (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references editions (id),
  plan_id plan_id_enum not null references participation_plan_types (id),
  space_id uuid null references stands (id),
  track_id text null references tracks (id),
  speaker_choice speaker_choice null,
  company text,
  nit text,
  contact_name text,
  contact_email text,
  contact_whatsapp text,
  category text,
  notes text,
  status plan_request_status not null default 'nueva',
  ip_address inet null,
  created_at timestamptz not null default now()
);

alter table plan_requests enable row level security;

-- Grupo D: público solo INSERT, sin SELECT (RETURNING funciona porque solo
-- evalúa el WITH CHECK del insert, no requiere policy de select).
create policy plan_requests_public_insert on plan_requests
  for insert to anon, authenticated
  with check (
    exists (select 1 from editions e where e.id = plan_requests.edition_id and e.status <> 'borrador')
  );

create policy plan_requests_admin_all on plan_requests
  for all using (is_admin()) with check (is_admin());
