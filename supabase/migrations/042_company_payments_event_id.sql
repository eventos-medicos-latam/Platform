-- Cuotas del portal pueden pertenecer a un evento Novo (events)
-- o a una edición Hormobiota (editions). Un solo libro: company_payments.
-- Wompi sigue cobrando HB-PAY- / HB-BAL- / HB-EALL- sobre estas filas.

alter table company_payments
  add column if not exists event_id uuid references events(id) on delete set null;

alter table company_payments
  alter column edition_id drop not null;

do $$ begin
  alter table company_payments
    add constraint company_payments_event_or_edition
    check (event_id is not null or edition_id is not null);
exception
  when duplicate_object then null;
end $$;

create index if not exists company_payments_event_id_idx on company_payments(event_id);
create index if not exists company_payments_company_event_idx on company_payments(company_id, event_id);

-- Pagos de eventos Novo no tienen edition_id: no tocan participations Hormobiota.
create or replace function sync_participation_paid_amount()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_edition_id text;
begin
  v_company_id := coalesce(new.company_id, old.company_id);
  v_edition_id := coalesce(new.edition_id, old.edition_id);

  if v_edition_id is null then
    return coalesce(new, old);
  end if;

  update participations
  set paid_amount = coalesce((
    select sum(amount)
    from company_payments
    where company_id = v_company_id
      and edition_id = v_edition_id
      and status = 'pagado'
  ), 0)
  where company_id = v_company_id
    and edition_id = v_edition_id;

  return coalesce(new, old);
end;
$$;

-- La empresa ve el nombre del evento al que está pagando, aunque no esté publicado.
drop policy if exists events_empresa_related on events;
create policy events_empresa_related on events
  for select using (
    exists (
      select 1 from company_payments cp
      where cp.event_id = events.id
        and cp.company_id = my_company_id()
    )
    or contracting_company_id = my_company_id()
  );
