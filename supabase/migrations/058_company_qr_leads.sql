-- Captura de leads QR en el Portal de empresas.
-- Scanner ≠ módulo QR/Contactos: aquí solo se persiste la interacción.
-- No se crea otra persona: el token identifica person_qr → person_id.
-- El payload de system_events.qr.lead_captured queda listo para n8n/GHL
-- (y más adelante Google Sheets) sin guardar el seguimiento comercial aquí.

create index if not exists qr_interactions_company_idx
  on qr_interactions (company_id, event_id, occurred_at desc)
  where company_id is not null;

create unique index if not exists qr_leads_unique_with_stand
  on qr_interactions (person_qr_id, event_id, company_id, stand_unit_id)
  where company_id is not null
    and stand_unit_id is not null
    and result = 'ok';

create unique index if not exists qr_leads_unique_without_stand
  on qr_interactions (person_qr_id, event_id, company_id)
  where company_id is not null
    and stand_unit_id is null
    and result = 'ok';

create or replace function company_has_event_access(p_company_id uuid, p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from stand_units su
    where su.event_id = p_event_id and su.company_id = p_company_id
    union
    select 1 from event_sponsors es
    where es.event_id = p_event_id and es.company_id = p_company_id
    union
    select 1 from company_payments cp
    where cp.event_id = p_event_id and cp.company_id = p_company_id
  );
$$;

create or replace function ensure_company_scanner_person()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_person_id uuid;
  v_name text;
  v_email text;
begin
  v_company_id := my_company_id();
  if v_company_id is null then
    raise exception 'Tu usuario no está vinculado a una empresa';
  end if;

  select p.person_id, p.full_name, p.email
    into v_person_id, v_name, v_email
  from profiles p
  where p.id = auth.uid();

  if not found then
    raise exception 'No hay perfil de sesión';
  end if;

  if v_person_id is null then
    insert into people (full_name)
    values (coalesce(nullif(btrim(v_name), ''), coalesce(v_email, 'Colaborador')))
    returning id into v_person_id;

    update profiles
       set person_id = v_person_id
     where id = auth.uid()
       and person_id is null;

    if coalesce(v_email, '') <> '' then
      insert into person_identifiers (
        person_id, identifier_type, raw_value, normalized_value, is_primary
      ) values (
        v_person_id, 'email', v_email, lower(btrim(v_email)), true
      )
      on conflict (identifier_type, normalized_value) do nothing;
    end if;
  end if;

  insert into company_memberships (company_id, person_id, job_title, status)
  values (v_company_id, v_person_id, 'Colaborador', 'activo')
  on conflict (company_id, person_id) do nothing;

  return v_person_id;
end;
$$;

create or replace function company_qr_scan_context()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_scanner uuid;
begin
  v_company_id := my_company_id();
  if v_company_id is null then
    raise exception 'Tu usuario no está vinculado a una empresa';
  end if;
  v_scanner := ensure_company_scanner_person();

  return jsonb_build_object(
    'company_id', v_company_id,
    'scanner_person_id', v_scanner,
    'scanner_name', coalesce((select full_name from people where id = v_scanner), ''),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id,
        'name', e.name,
        'start_date', e.start_date,
        'stands', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', su.id,
            'label', su.unit_number
          ) order by su.unit_number)
          from stand_units su
          where su.event_id = e.id
            and su.company_id = v_company_id
        ), '[]'::jsonb)
      ) order by e.start_date desc nulls last, e.name)
      from events e
      where company_has_event_access(v_company_id, e.id)
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function capture_company_qr_lead(
  p_token text,
  p_event_id uuid,
  p_stand_unit_id uuid default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_scanner uuid;
  v_token text;
  v_qr_id uuid;
  v_person_id uuid;
  v_person_name text;
  v_existing qr_interactions%rowtype;
  v_prev_name text;
  v_row qr_interactions%rowtype;
  v_note text;
begin
  v_company_id := my_company_id();
  if v_company_id is null then
    raise exception 'Tu usuario no está vinculado a una empresa';
  end if;
  if p_event_id is null then
    raise exception 'Elige el evento';
  end if;
  if not company_has_event_access(v_company_id, p_event_id) then
    raise exception 'Tu empresa no está vinculada a este evento';
  end if;
  if p_stand_unit_id is not null and not exists (
    select 1 from stand_units
    where id = p_stand_unit_id
      and event_id = p_event_id
      and company_id = v_company_id
  ) then
    raise exception 'Este stand no pertenece a tu empresa en este evento';
  end if;

  v_scanner := ensure_company_scanner_person();
  v_token := btrim(regexp_replace(coalesce(p_token, ''), '^qr:', '', 'i'));
  if v_token = '' then
    return jsonb_build_object('ok', false, 'duplicate', false, 'message', 'Pega o escanea el código QR del asistente.');
  end if;

  select id, person_id into v_qr_id, v_person_id
  from person_qr
  where qr_token = v_token
  limit 1;

  if v_qr_id is null then
    return jsonb_build_object('ok', false, 'duplicate', false, 'message', 'Este código no está registrado.');
  end if;

  select full_name into v_person_name from people where id = v_person_id;
  v_note := nullif(btrim(coalesce(p_note, '')), '');

  select qi.* into v_existing
  from qr_interactions qi
  where qi.company_id = v_company_id
    and qi.event_id = p_event_id
    and qi.person_qr_id = v_qr_id
    and qi.result = 'ok'
    and qi.stand_unit_id is not distinct from p_stand_unit_id
  order by qi.occurred_at asc
  limit 1;

  if found then
    select full_name into v_prev_name from people where id = v_existing.scanner_person_id;
    return jsonb_build_object(
      'ok', false,
      'duplicate', true,
      'message', 'Contacto ya registrado',
      'name', coalesce(v_person_name, 'Asistente'),
      'previous_at', v_existing.occurred_at,
      'previous_by', coalesce(v_prev_name, 'un colaborador'),
      'contact_id', v_existing.id
    );
  end if;

  insert into qr_interactions (
    person_qr_id, event_id, scanner_person_id, company_id, stand_unit_id,
    result, note, consent_given
  ) values (
    v_qr_id, p_event_id, v_scanner, v_company_id, p_stand_unit_id,
    'ok', v_note, true
  )
  returning * into v_row;

  insert into system_events (
    event_type, family, entity_type, entity_id, event_context, payload, status
  ) values (
    'qr.lead_captured',
    'qr',
    'qr_interaction',
    v_row.id,
    p_event_id,
    jsonb_build_object(
      'interaction_id', v_row.id,
      'person_id', v_person_id,
      'person_name', coalesce(v_person_name, 'Asistente'),
      'event_id', p_event_id,
      'company_id', v_company_id,
      'stand_unit_id', p_stand_unit_id,
      'scanner_person_id', v_scanner,
      'note', v_note,
      'occurred_at', v_row.occurred_at,
      'destination', 'n8n'
    ),
    'pending'
  );

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'message', 'Contacto capturado',
    'name', coalesce(v_person_name, 'Asistente'),
    'contact_id', v_row.id
  );
end;
$$;

create or replace function list_company_qr_contacts()
returns table (
  id uuid,
  occurred_at timestamptz,
  note text,
  event_id uuid,
  event_name text,
  stand_unit_id uuid,
  stand_label text,
  scanner_person_id uuid,
  scanner_name text,
  person_id uuid,
  person_name text,
  specialty text,
  email text,
  phone text
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_company_id uuid;
begin
  v_company_id := my_company_id();
  if v_company_id is null then
    raise exception 'Tu usuario no está vinculado a una empresa';
  end if;

  return query
  select
    qi.id,
    qi.occurred_at,
    qi.note,
    qi.event_id,
    e.name,
    qi.stand_unit_id,
    su.unit_number,
    qi.scanner_person_id,
    sp.full_name,
    pq.person_id,
    pe.full_name,
    coalesce(pp.specialty, spp.specialty),
    (
      select pi.raw_value
      from person_identifiers pi
      where pi.person_id = pq.person_id and pi.identifier_type = 'email'
      order by pi.is_primary desc, pi.created_at
      limit 1
    ),
    (
      select pi.raw_value
      from person_identifiers pi
      where pi.person_id = pq.person_id and pi.identifier_type in ('telefono', 'whatsapp')
      order by pi.is_primary desc, pi.created_at
      limit 1
    )
  from qr_interactions qi
  join person_qr pq on pq.id = qi.person_qr_id
  join people pe on pe.id = pq.person_id
  left join events e on e.id = qi.event_id
  left join stand_units su on su.id = qi.stand_unit_id
  left join people sp on sp.id = qi.scanner_person_id
  left join professional_profiles pp on pp.person_id = pq.person_id
  left join speaker_profiles spp on spp.person_id = pq.person_id
  where qi.company_id = v_company_id
    and qi.result = 'ok'
  order by qi.occurred_at desc;
end;
$$;

create or replace function update_company_qr_lead_note(p_id uuid, p_note text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
begin
  v_company_id := my_company_id();
  if v_company_id is null then
    raise exception 'Tu usuario no está vinculado a una empresa';
  end if;

  update qr_interactions
     set note = nullif(btrim(coalesce(p_note, '')), '')
   where id = p_id
     and company_id = v_company_id
     and result = 'ok';

  if not found then
    raise exception 'No se encontró el contacto';
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function company_has_event_access(uuid, uuid) to authenticated;
grant execute on function ensure_company_scanner_person() to authenticated;
grant execute on function company_qr_scan_context() to authenticated;
grant execute on function capture_company_qr_lead(text, uuid, uuid, text) to authenticated;
grant execute on function list_company_qr_contacts() to authenticated;
grant execute on function update_company_qr_lead_note(uuid, text) to authenticated;
