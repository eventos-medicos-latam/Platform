-- =========================================================
-- Speaker patrocinado (planes con includes_speaker = true)
-- =========================================================

create type speaker_submission_status as enum ('enviado', 'en-revision', 'aprobado', 'rechazado');

create table sponsored_speaker_submissions (
  id uuid primary key default gen_random_uuid(),
  participation_id uuid not null references participations (id) on delete cascade,
  name text not null,
  email text not null,
  bio text,
  topic text,
  status speaker_submission_status not null default 'enviado',
  created_at timestamptz not null default now()
);

alter table sponsored_speaker_submissions enable row level security;

create policy sponsored_speaker_submissions_company_read on sponsored_speaker_submissions
  for select using (
    exists (select 1 from participations p where p.id = sponsored_speaker_submissions.participation_id and p.company_id = my_company_id())
    or is_admin()
  );

create policy sponsored_speaker_submissions_company_insert on sponsored_speaker_submissions
  for insert with check (
    exists (select 1 from participations p where p.id = sponsored_speaker_submissions.participation_id and p.company_id = my_company_id())
    or is_admin()
  );

create policy sponsored_speaker_submissions_admin_update on sponsored_speaker_submissions
  for update using (is_admin()) with check (is_admin());

create policy sponsored_speaker_submissions_admin_delete on sponsored_speaker_submissions
  for delete using (is_admin());

-- =========================================================
-- Mesa de ayuda
-- =========================================================

create type support_ticket_status as enum ('abierto', 'en-proceso', 'resuelto', 'cerrado');

create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  edition_id text null references editions (id),
  subject text not null,
  status support_ticket_status not null default 'abierto',
  created_at timestamptz not null default now()
);

alter table support_tickets enable row level security;

create policy support_tickets_company_read on support_tickets
  for select using (company_id = my_company_id() or is_admin());

create policy support_tickets_company_insert on support_tickets
  for insert with check (company_id = my_company_id() or is_admin());

create policy support_tickets_admin_update on support_tickets
  for update using (is_admin()) with check (is_admin());

create table support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets (id) on delete cascade,
  author text,
  is_admin boolean not null default false,
  message text not null,
  created_at timestamptz not null default now()
);

alter table support_ticket_messages enable row level security;

create policy support_ticket_messages_read on support_ticket_messages
  for select using (
    exists (select 1 from support_tickets t where t.id = support_ticket_messages.ticket_id and (t.company_id = my_company_id() or is_admin()))
  );

create policy support_ticket_messages_insert on support_ticket_messages
  for insert with check (
    exists (select 1 from support_tickets t where t.id = support_ticket_messages.ticket_id and (t.company_id = my_company_id() or is_admin()))
  );

-- =========================================================
-- Recursos descargables (biblioteca compartida, misma para
-- todas las empresas de una edición)
-- =========================================================

create type resource_category as enum ('agenda', 'presskit', 'tematico', 'otro');

create table portal_resources (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references editions (id) on delete cascade,
  category resource_category not null default 'otro',
  title text not null,
  description text,
  file_path text null,
  external_url text null,
  order_num int not null default 0,
  created_at timestamptz not null default now()
);

alter table portal_resources enable row level security;

create policy portal_resources_read on portal_resources
  for select to authenticated using (true);

create policy portal_resources_admin_all on portal_resources
  for all using (is_admin()) with check (is_admin());

-- Carpeta compartida dentro del mismo bucket ya usado por documentos
-- de empresa: _shared/{edition_id}/... — lectura para cualquier
-- usuario autenticado, escritura solo admin.
create policy shared_resources_read on storage.objects
  for select to authenticated using (
    bucket_id = 'company-files' and (storage.foldername(name))[1] = '_shared'
  );

create policy shared_resources_admin_write on storage.objects
  for insert with check (
    bucket_id = 'company-files' and (storage.foldername(name))[1] = '_shared' and is_admin()
  );

-- =========================================================
-- Agenda digital: postularse / invitar a un secondary_event
-- =========================================================

create table secondary_event_registrations (
  id uuid primary key default gen_random_uuid(),
  secondary_event_id uuid not null references secondary_events (id) on delete cascade,
  company_id uuid null references companies (id),
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

alter table secondary_event_registrations enable row level security;

create policy secondary_event_registrations_company_read on secondary_event_registrations
  for select using (company_id = my_company_id() or is_admin());

create policy secondary_event_registrations_company_insert on secondary_event_registrations
  for insert with check (company_id = my_company_id() or is_admin());

create policy secondary_event_registrations_admin_all on secondary_event_registrations
  for all using (is_admin()) with check (is_admin());

create function sync_secondary_event_registered()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update secondary_events set registered = registered + 1 where id = new.secondary_event_id;
  return new;
end;
$$;

create trigger secondary_event_registrations_sync
  after insert on secondary_event_registrations
  for each row execute function sync_secondary_event_registered();
