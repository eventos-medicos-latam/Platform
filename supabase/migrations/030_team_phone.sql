-- Teléfono de colaboradores de marca (los invitados profesionales
-- ya lo tienen en registrations.whatsapp).
alter table brand_staff_members
  add column if not exists whatsapp text;

-- invite_guest: persistir el teléfono del invitado profesional.
drop function if exists invite_guest(text, text, text, text, text);

create function invite_guest(
  p_edition_id text,
  p_full_name text,
  p_email text,
  p_specialty text default null,
  p_city text default null,
  p_whatsapp text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_ticket_id uuid;
  v_id uuid;
begin
  v_company_id := my_company_id();
  if v_company_id is null then
    raise exception 'Tu usuario no está vinculado a una empresa';
  end if;

  select id into v_ticket_id from tickets
    where edition_id = p_edition_id and kind = 'patrocinador'
    order by created_at
    limit 1;

  if v_ticket_id is null then
    insert into tickets (edition_id, name, kind, modality, price, quota, status, visible, emits_qr)
    values (p_edition_id, 'Cortesía patrocinador', 'patrocinador', 'presencial', 0, 999999, 'publicado', false, true)
    returning id into v_ticket_id;
  end if;

  perform set_config('app.internal_write', 'on', true);

  insert into registrations (
    edition_id, ticket_id, full_name, email, specialty, city, whatsapp, modality, amount,
    payment_status, qr_status, source, company_id, invitation_token
  )
  values (
    p_edition_id, v_ticket_id, p_full_name, p_email, p_specialty, p_city, p_whatsapp, 'presencial', 0,
    'approved', 'invalid', 'invitado-patrocinio', v_company_id, gen_random_uuid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function invite_guest(text, text, text, text, text, text) from public, anon;
grant execute on function invite_guest(text, text, text, text, text, text) to authenticated;
