-- =========================================================
-- Novo Documentos / Sitio / Soporte
-- Catálogo resources usable (tipo, acceso, empresa)
-- Tickets de soporte con evento Novo y solicitante
-- =========================================================

alter table resources
  add column if not exists file_type text,
  add column if not exists file_size_bytes bigint,
  add column if not exists access_level text not null default 'publico',
  add column if not exists company_id uuid references companies (id) on delete set null;

alter table resources
  drop constraint if exists resources_access_level_check;
alter table resources
  add constraint resources_access_level_check
  check (access_level in ('publico', 'empresa', 'interno', 'privado'));

create index if not exists resources_company_id_idx on resources (company_id);
create index if not exists resources_access_idx on resources (access_level, is_active);

do $$ begin
  alter table event_resources
    drop constraint event_resources_resource_id_fkey;
exception
  when undefined_object then null;
end $$;

alter table event_resources
  add constraint event_resources_resource_id_fkey
  foreign key (resource_id) references resources (id) on delete cascade;

drop trigger if exists resources_set_updated_at on resources;
create trigger resources_set_updated_at
  before update on resources
  for each row execute function set_updated_at();

-- Mesa de ayuda: tickets de empresa (portal) o de un solicitante / evento Novo
alter table support_tickets
  alter column company_id drop not null;

alter table support_tickets
  add column if not exists event_id uuid references events (id) on delete set null,
  add column if not exists requester_name text,
  add column if not exists requester_email text,
  add column if not exists priority text not null default 'media',
  add column if not exists category text not null default 'otro';

alter table support_tickets
  drop constraint if exists support_tickets_priority_check;
alter table support_tickets
  add constraint support_tickets_priority_check
  check (priority in ('alta', 'media', 'baja'));

alter table support_tickets
  drop constraint if exists support_tickets_category_check;
alter table support_tickets
  add constraint support_tickets_category_check
  check (category in ('registro', 'pago', 'acceso', 'contenido', 'tecnico', 'otro'));

alter table support_tickets
  drop constraint if exists support_tickets_actor_check;
alter table support_tickets
  add constraint support_tickets_actor_check
  check (
    company_id is not null
    or coalesce(requester_email, '') <> ''
    or coalesce(requester_name, '') <> ''
  );

create index if not exists support_tickets_event_id_idx on support_tickets (event_id);
create index if not exists support_tickets_status_idx on support_tickets (status, created_at desc);

drop policy if exists support_tickets_admin_delete on support_tickets;
create policy support_tickets_admin_delete on support_tickets
  for delete using (is_admin());

drop policy if exists support_ticket_messages_admin_delete on support_ticket_messages;
create policy support_ticket_messages_admin_delete on support_ticket_messages
  for delete using (is_admin());
