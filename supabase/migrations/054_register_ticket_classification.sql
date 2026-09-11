-- Inscripción pública: paciente o profesional de la salud.
-- La especialidad solo se guarda si el perfil es profesional.

drop function if exists novo_register_ticket(uuid, uuid, text, text, text, text);

create function novo_register_ticket(
  p_event_id uuid,
  p_ticket_type_id uuid,
  p_full_name text,
  p_email text,
  p_phone text default null,
  p_specialty text default null,
  p_classification text default 'profesional'
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
  v_new_person boolean := false;
  v_class novo_person_classification;
begin
  if p_full_name is null or length(trim(p_full_name)) < 2 then
    raise exception 'Nombre inválido';
  end if;

  v_email := lower(trim(coalesce(p_email, '')));
  if v_email !~ '^[^@]+@[^@]+\.[^@]+$' then
    raise exception 'Correo inválido';
  end if;

  if lower(trim(coalesce(p_classification, ''))) = 'paciente' then
    v_class := 'paciente';
  else
    v_class := 'profesional';
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
    v_new_person := true;

    insert into person_identifiers (person_id, identifier_type, raw_value, normalized_value, is_primary)
    values (v_person_id, 'email', trim(p_email), v_email, true);
  else
    update people set full_name = trim(p_full_name) where id = v_person_id;
  end if;

  delete from person_classifications
  where person_id = v_person_id
    and event_id = p_event_id
    and classification is distinct from v_class;

  begin
    insert into person_classifications (person_id, classification, source, event_id)
    values (v_person_id, v_class, 'web-registro', p_event_id);
  exception when unique_violation then
    null;
  end;

  if v_new_person then
    begin
      insert into person_classifications (person_id, classification, source)
      values (v_person_id, v_class, 'web-registro');
    exception when unique_violation then
      null;
    end;
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

  if v_class = 'profesional' and p_specialty is not null and length(trim(p_specialty)) > 0 then
    insert into professional_profiles (person_id, specialty)
    values (v_person_id, trim(p_specialty))
    on conflict (person_id) do update
      set specialty = excluded.specialty;
  end if;

  v_needs_payment := coalesce(v_price, 0) > 0 and v_event.is_free = false;
  v_ref := case when v_needs_payment then 'NV-TKT-' || gen_random_uuid()::text else null end;

  select id into v_reg_id
  from event_registrations
  where person_id = v_person_id
    and event_id = p_event_id
    and status = 'espera'
  order by created_at desc
  limit 1;

  if v_reg_id is not null then
    update event_registrations set
      ticket_type_id = v_ticket.id,
      registration_type = 'compra',
      origin = 'web',
      amount_paid = case when v_needs_payment then 0 else v_price end,
      status = case when v_needs_payment then 'espera' else 'confirmado' end,
      wompi_reference = v_ref
    where id = v_reg_id;
  else
    insert into event_registrations (
      person_id, event_id, ticket_type_id, registration_type, origin,
      amount_paid, status, wompi_reference
    ) values (
      v_person_id, p_event_id, v_ticket.id, 'compra', 'web',
      case when v_needs_payment then 0 else v_price end,
      case when v_needs_payment then 'espera' else 'confirmado' end,
      v_ref
    ) returning id into v_reg_id;
  end if;

  insert into person_qr (person_id)
  values (v_person_id)
  on conflict (person_id) do nothing;

  select qr_token into v_qr from person_qr where person_id = v_person_id;

  if not v_needs_payment then
    insert into ticket_entitlements (
      registration_id, ticket_type_id, person_id, event_id, price_paid, status
    )
    select v_reg_id, v_ticket.id, v_person_id, p_event_id, v_price, 'activo'
    where not exists (
      select 1 from ticket_entitlements
      where registration_id = v_reg_id
        and ticket_type_id = v_ticket.id
        and status = 'activo'
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

revoke all on function novo_register_ticket(uuid, uuid, text, text, text, text, text) from public;
grant execute on function novo_register_ticket(uuid, uuid, text, text, text, text, text) to anon, authenticated;
