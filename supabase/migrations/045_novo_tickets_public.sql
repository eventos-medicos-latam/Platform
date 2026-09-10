-- Tickets Novo: columnas para compra pública, RLS de etapas y RPC de inscripción.
-- No toca las tablas Hormobiota (tickets, registrations, editions).

alter table event_registrations
  add column if not exists ticket_type_id uuid references ticket_types(id) on delete set null;

alter table event_registrations
  add column if not exists wompi_reference text;

create unique index if not exists event_registrations_wompi_reference_uidx
  on event_registrations (wompi_reference)
  where wompi_reference is not null;

-- Vista previa: quien tiene el enlace puede ver el microsite.
drop policy if exists events_public_read on events;
create policy events_public_read on events
  for select using (
    is_public = true
    and publication_status in ('publicado', 'vista-previa')
  );

alter table ticket_price_stages enable row level security;
drop policy if exists ticket_price_stages_admin on ticket_price_stages;
drop policy if exists ticket_price_stages_public on ticket_price_stages;
create policy ticket_price_stages_admin on ticket_price_stages for all using (is_admin());
create policy ticket_price_stages_public on ticket_price_stages for select using (
  exists (
    select 1 from ticket_types t
    where t.id = ticket_price_stages.ticket_type_id and t.is_visible = true
  )
);

alter table ticket_holds enable row level security;
drop policy if exists ticket_holds_admin on ticket_holds;
create policy ticket_holds_admin on ticket_holds for all using (is_admin());

-- Nombre del speaker en agenda pública
drop policy if exists people_public_via_speaker on people;
create policy people_public_via_speaker on people
  for select using (
    exists (
      select 1 from speaker_profiles sp
      where sp.person_id = people.id and sp.is_public = true
    )
  );

create or replace function novo_ticket_unit_price(p_ticket_type_id uuid)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ticket ticket_types%rowtype;
  v_stage ticket_price_stages%rowtype;
  v_sold integer;
  v_price numeric;
begin
  select * into v_ticket from ticket_types where id = p_ticket_type_id;
  if not found then
    return 0;
  end if;

  select count(*) into v_sold
  from ticket_entitlements
  where ticket_type_id = p_ticket_type_id and status = 'activo';

  select * into v_stage
  from ticket_price_stages
  where ticket_type_id = p_ticket_type_id
    and (
      (valid_until is not null and valid_until >= current_date)
      or (quantity_limit is not null and v_sold < quantity_limit)
    )
  order by sort_order, created_at
  limit 1;

  v_price := coalesce(v_stage.price, v_ticket.base_price, 0);
  return round(v_price * (1 + coalesce(v_ticket.tax_pct, 0) / 100.0), 2);
end;
$$;

create or replace function novo_register_ticket(
  p_event_id uuid,
  p_ticket_type_id uuid,
  p_full_name text,
  p_email text,
  p_phone text default null,
  p_specialty text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
  v_ticket ticket_types%rowtype;
  v_person_id uuid;
  v_reg_id uuid;
  v_qr text;
  v_email text;
  v_phone text;
  v_price numeric;
  v_sold integer;
  v_needs_payment boolean;
  v_ref text;
begin
  if p_full_name is null or length(trim(p_full_name)) < 2 then
    raise exception 'Nombre inválido';
  end if;

  v_email := lower(trim(coalesce(p_email, '')));
  if v_email !~ '^[^@]+@[^@]+\.[^@]+$' then
    raise exception 'Correo inválido';
  end if;

  select * into v_event from events where id = p_event_id;
  if not found then
    raise exception 'Evento no encontrado';
  end if;
  if v_event.publication_status not in ('publicado', 'vista-previa') then
    raise exception 'Este evento no está publicado';
  end if;

  select * into v_ticket
  from ticket_types
  where id = p_ticket_type_id
    and event_id = p_event_id
    and is_visible = true;
  if not found then
    raise exception 'Ticket no disponible';
  end if;

  if v_ticket.sale_start is not null and now() < v_ticket.sale_start then
    raise exception 'La venta aún no comienza';
  end if;
  if v_ticket.sale_end is not null and now() > v_ticket.sale_end then
    raise exception 'La venta ya cerró';
  end if;

  select count(*) into v_sold
  from ticket_entitlements
  where ticket_type_id = v_ticket.id and status = 'activo';
  if v_ticket.capacity is not null and v_sold >= v_ticket.capacity then
    raise exception 'Cupos agotados';
  end if;

  v_price := novo_ticket_unit_price(v_ticket.id);

  select pi.person_id into v_person_id
  from person_identifiers pi
  where pi.identifier_type = 'email' and pi.normalized_value = v_email
  limit 1;

  if v_person_id is null then
    insert into people (full_name) values (trim(p_full_name))
    returning id into v_person_id;

    insert into person_identifiers (person_id, identifier_type, raw_value, normalized_value, is_primary)
    values (v_person_id, 'email', trim(p_email), v_email, true);

    begin
      insert into person_classifications (person_id, classification, source)
      values (v_person_id, 'profesional', 'web-registro');
    exception when unique_violation then
      null;
    end;
  else
    update people set full_name = trim(p_full_name) where id = v_person_id;
  end if;

  v_phone := regexp_replace(trim(coalesce(p_phone, '')), '[\s()-]', '', 'g');
  if length(v_phone) > 0 then
    begin
      insert into person_identifiers (person_id, identifier_type, raw_value, normalized_value, is_primary)
      values (v_person_id, 'telefono', trim(p_phone), v_phone, false)
      on conflict (identifier_type, normalized_value) do nothing;
    exception when unique_violation then
      null;
    end;
  end if;

  if p_specialty is not null and length(trim(p_specialty)) > 0 then
    insert into professional_profiles (person_id, specialty)
    values (v_person_id, trim(p_specialty))
    on conflict (person_id) do update
      set specialty = excluded.specialty
      where professional_profiles.specialty is null;
  end if;

  if exists (
    select 1 from event_registrations
    where person_id = v_person_id and event_id = p_event_id
  ) then
    raise exception 'Esta persona ya está inscrita en este evento';
  end if;

  v_needs_payment := coalesce(v_price, 0) > 0 and v_event.is_free = false;
  v_ref := case when v_needs_payment then 'NV-TKT-' || gen_random_uuid()::text else null end;

  insert into event_registrations (
    person_id, event_id, ticket_type_id, registration_type, origin,
    amount_paid, status, wompi_reference
  ) values (
    v_person_id, p_event_id, v_ticket.id, 'compra', 'web',
    case when v_needs_payment then 0 else v_price end,
    case when v_needs_payment then 'espera' else 'confirmado' end,
    v_ref
  ) returning id into v_reg_id;

  insert into person_qr (person_id)
  values (v_person_id)
  on conflict (person_id) do nothing;

  select qr_token into v_qr from person_qr where person_id = v_person_id;

  if not v_needs_payment then
    insert into ticket_entitlements (
      registration_id, ticket_type_id, person_id, event_id, price_paid, status
    ) values (
      v_reg_id, v_ticket.id, v_person_id, p_event_id, v_price, 'activo'
    );
  end if;

  return jsonb_build_object(
    'registration_id', v_reg_id,
    'person_id', v_person_id,
    'qr_token', v_qr,
    'amount', v_price,
    'needs_payment', v_needs_payment,
    'wompi_reference', v_ref,
    'ticket_name', v_ticket.name
  );
end;
$$;

revoke all on function novo_ticket_unit_price(uuid) from public;
grant execute on function novo_ticket_unit_price(uuid) to anon, authenticated;

revoke all on function novo_register_ticket(uuid, uuid, text, text, text, text) from public;
grant execute on function novo_register_ticket(uuid, uuid, text, text, text, text) to anon, authenticated;
