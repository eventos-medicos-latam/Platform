-- Confirma un ticket Novo pagado en Wompi (webhook o vuelta del checkout).
-- Idempotente: reconfirmar la misma referencia no duplica el entitlement ni el pago.

create or replace function novo_confirm_ticket_payment(
  p_reference text,
  p_amount numeric,
  p_transaction_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg event_registrations%rowtype;
  v_amount numeric;
begin
  if p_reference is null or p_reference not like 'NV-TKT-%' then
    return false;
  end if;

  select * into v_reg
  from event_registrations
  where wompi_reference = p_reference
  for update;

  if not found then
    return false;
  end if;

  v_amount := coalesce(nullif(p_amount, 0), v_reg.amount_paid, 0);

  update event_registrations
  set
    status = 'confirmado',
    amount_paid = v_amount
  where id = v_reg.id;

  if v_reg.ticket_type_id is not null then
    insert into ticket_entitlements (
      registration_id, ticket_type_id, person_id, event_id, price_paid, status
    )
    select v_reg.id, v_reg.ticket_type_id, v_reg.person_id, v_reg.event_id, v_amount, 'activo'
    where not exists (
      select 1 from ticket_entitlements
      where registration_id = v_reg.id and status = 'activo'
    );
  end if;

  begin
    if not exists (select 1 from novo_payments where wompi_ref = p_reference) then
      insert into novo_payments (
        event_id, amount, currency, method, status, reference, transaction_id, wompi_ref, processed_at
      ) values (
        v_reg.event_id,
        v_amount,
        'COP',
        'wompi',
        'approved',
        p_reference,
        p_transaction_id,
        p_reference,
        now()
      );
    else
      update novo_payments
      set
        amount = v_amount,
        status = 'approved',
        transaction_id = coalesce(p_transaction_id, transaction_id),
        processed_at = coalesce(processed_at, now())
      where wompi_ref = p_reference;
    end if;
  exception when others then
    null;
  end;

  return true;
end;
$$;

revoke all on function novo_confirm_ticket_payment(text, numeric, text) from public;
grant execute on function novo_confirm_ticket_payment(text, numeric, text) to service_role, postgres;
