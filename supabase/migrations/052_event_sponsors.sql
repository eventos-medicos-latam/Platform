-- Patrocinadores Novo por evento. Ligero: no reemplaza commercial_agreements.
-- Logos activos se leen en /e/:slug.

create table if not exists event_sponsors (
  id                 uuid primary key default gen_random_uuid(),
  event_id           uuid not null references events(id) on delete cascade,
  company_id         uuid not null references companies(id) on delete cascade,
  company_name       text,
  plan               text not null default 'oro'
                       check (plan in ('platino', 'oro', 'plata', 'bronce', 'aliado')),
  amount             numeric(14,2) not null default 0,
  status             text not null default 'negociacion'
                       check (status in ('activo', 'pendiente_pago', 'negociacion', 'declinado')),
  contact_name       text,
  contact_email      text,
  contact_tel        text,
  logo_url           text,
  benefits_checked   integer not null default 0,
  benefits_total     integer not null default 5,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (event_id, company_id)
);

create trigger event_sponsors_set_updated_at
  before update on event_sponsors
  for each row execute function set_updated_at();

create index if not exists event_sponsors_event_idx on event_sponsors(event_id, status);

alter table event_sponsors enable row level security;

drop policy if exists event_sponsors_admin on event_sponsors;
create policy event_sponsors_admin on event_sponsors
  for all using (is_admin()) with check (is_admin());

drop policy if exists event_sponsors_public_read on event_sponsors;
create policy event_sponsors_public_read on event_sponsors
  for select using (
    status = 'activo'
    and exists (
      select 1 from events e
      where e.id = event_sponsors.event_id
        and e.is_public = true
        and e.publication_status in ('publicado', 'vista-previa')
    )
  );

-- Empresas con patrocinio activo visible en microsite (logo / nombre).
drop policy if exists companies_public_read on companies;
create policy companies_public_read on companies
  for select using (
    exists (select 1 from banner_slots bs where bs.company_id = companies.id and bs.active)
    or exists (select 1 from participations p where p.company_id = companies.id and p.status = 'publicado')
    or exists (select 1 from stands s where s.company_id = companies.id and s.status = 'vendido')
    or exists (select 1 from event_sponsors es where es.company_id = companies.id and es.status = 'activo')
  );
