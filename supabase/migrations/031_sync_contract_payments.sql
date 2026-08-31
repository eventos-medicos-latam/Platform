-- Una sola fuente de verdad para el saldo del contrato:
-- participations.paid_amount = suma de company_payments en estado pagado.
-- Al pactar un valor sin cuotas, se siembran Adelanto (50%) y Saldo (50%).

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

drop trigger if exists company_payments_sync_paid_amount on company_payments;
create trigger company_payments_sync_paid_amount
  after insert or update or delete on company_payments
  for each row execute function sync_participation_paid_amount();

create or replace function seed_participation_installments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_already_paid numeric(12, 2);
  v_advance numeric(12, 2);
  v_balance numeric(12, 2);
begin
  if new.agreed_amount is null or new.agreed_amount <= 0 then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.agreed_amount is not distinct from new.agreed_amount then
    return new;
  end if;

  select count(*) into v_count
  from company_payments
  where company_id = new.company_id
    and edition_id = new.edition_id;

  if v_count > 0 then
    return new;
  end if;

  v_already_paid := coalesce(new.paid_amount, 0);

  if v_already_paid <= 0 then
    v_advance := round(new.agreed_amount / 2, 2);
    v_balance := new.agreed_amount - v_advance;
    insert into company_payments (company_id, edition_id, concept, amount, status, due_date)
    values
      (new.company_id, new.edition_id, 'Adelanto', v_advance, 'pendiente', current_date + 15),
      (new.company_id, new.edition_id, 'Saldo', v_balance, 'pendiente', current_date + 60);
  elsif v_already_paid >= new.agreed_amount then
    insert into company_payments (company_id, edition_id, concept, amount, status, paid_at)
    values (new.company_id, new.edition_id, 'Pago del convenio', new.agreed_amount, 'pagado', now());
  else
    insert into company_payments (company_id, edition_id, concept, amount, status, paid_at)
    values (new.company_id, new.edition_id, 'Adelanto', v_already_paid, 'pagado', now());
    insert into company_payments (company_id, edition_id, concept, amount, status, due_date)
    values (new.company_id, new.edition_id, 'Saldo', new.agreed_amount - v_already_paid, 'pendiente', current_date + 60);
  end if;

  return new;
end;
$$;

drop trigger if exists participations_seed_installments on participations;
create trigger participations_seed_installments
  after insert or update of agreed_amount on participations
  for each row execute function seed_participation_installments();

-- Participaciones ya existentes: mismo criterio, sin pisar cobros armados a mano.
do $$
declare
  r record;
begin
  for r in
    select p.*
    from participations p
    where p.agreed_amount is not null
      and p.agreed_amount > 0
      and not exists (
        select 1 from company_payments c
        where c.company_id = p.company_id and c.edition_id = p.edition_id
      )
  loop
    if coalesce(r.paid_amount, 0) <= 0 then
      insert into company_payments (company_id, edition_id, concept, amount, status, due_date)
      values
        (r.company_id, r.edition_id, 'Adelanto', round(r.agreed_amount / 2, 2), 'pendiente', current_date + 15),
        (r.company_id, r.edition_id, 'Saldo', r.agreed_amount - round(r.agreed_amount / 2, 2), 'pendiente', current_date + 60);
    elsif r.paid_amount >= r.agreed_amount then
      insert into company_payments (company_id, edition_id, concept, amount, status, paid_at)
      values (r.company_id, r.edition_id, 'Pago del convenio', r.agreed_amount, 'pagado', now());
    else
      insert into company_payments (company_id, edition_id, concept, amount, status, paid_at)
      values (r.company_id, r.edition_id, 'Adelanto', r.paid_amount, 'pagado', now());
      insert into company_payments (company_id, edition_id, concept, amount, status, due_date)
      values (r.company_id, r.edition_id, 'Saldo', r.agreed_amount - r.paid_amount, 'pendiente', current_date + 60);
    end if;
  end loop;
end;
$$;

-- Recalcular paid_amount de todo lo que ya exista.
update participations p
set paid_amount = coalesce((
  select sum(c.amount)
  from company_payments c
  where c.company_id = p.company_id
    and c.edition_id = p.edition_id
    and c.status = 'pagado'
), 0);
