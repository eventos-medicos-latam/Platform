-- Stands vendidos se asignan a una empresa del CRM y a una cuota en company_payments.
alter table stand_units
  add column if not exists company_id uuid references companies(id) on delete set null;

alter table stand_units
  add column if not exists payment_id uuid references company_payments(id) on delete set null;

alter table stand_units
  add column if not exists price numeric(12,2);

alter table stand_units
  add column if not exists location_hint text;

create index if not exists stand_units_company_id_idx on stand_units(company_id);
create index if not exists stand_units_payment_id_idx on stand_units(payment_id);
create index if not exists stand_units_event_company_idx on stand_units(event_id, company_id);

do $$ begin
  alter table stand_units
    add constraint stand_units_assigned_needs_company
    check (status not in ('vendido', 'reservado') or company_id is not null);
exception
  when duplicate_object then null;
end $$;
