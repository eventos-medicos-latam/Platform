-- =========================================================
-- Ciclo de vida real de la invitación a colaboradores/invitados
-- de una marca: crear -> aceptar/rechazar -> (cerca del evento)
-- reconfirmar asistencia -> recién ahí se activa el boleto.
-- Por seguridad, el boleto NUNCA se activa al aceptar: se activa
-- solo al reconfirmar, dentro de los 14 días previos al evento.
--
-- Una sola lista de asistentes al evento: no hay una tabla aparte
-- de "invitados". Un profesional invitado por la marca es, desde
-- el momento en que se le invita, una fila más de `registrations`
-- (etiquetada source = 'invitado-patrocinio'), igual que una
-- compra pública o una compra extra de la empresa. La ÚNICA lista
-- que queda aparte es `brand_staff_members` (colaboradores/staff),
-- porque no son asistentes que compran o reciben una entrada
-- pública: son el equipo que atiende el espacio.
-- =========================================================

-- Defensivo: si 016_integrations.sql no llegó a correr en este
-- proyecto, esta función no existiría y las triggers de más abajo
-- fallarían al crearse. `create or replace` no hace daño si ya
-- existía. El envío real a GHL queda "en vivo" recién cuando se
-- carguen las credenciales en /admin/configuracion — mientras
-- tanto, esta función simplemente no logra nada útil (la Edge
-- Function responde "Integración no configurada" y no pasa nada
-- más), sin afectar el resto del flujo.
create extension if not exists pg_net;

create or replace function trigger_ghl_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform supabase_functions.http_request(
    url := 'https://jbglybgnlhcgutpvlgca.supabase.co/functions/v1/ghl-sync-contact',
    method := 'POST',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZ2x5YmdubGhjZ3V0cHZsZ2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MDIzNTYsImV4cCI6MjEwMzA3ODM1Nn0.d9WYxg_LJuHkF29K9Mr2cDx8VunisYx_kRHLC1JhsWg'
    ),
    body := jsonb_build_object('table', TG_TABLE_NAME, 'record', to_jsonb(NEW))
  );
  return NEW;
end;
$$;

drop table if exists brand_guests cascade;
drop type if exists guest_status;

alter type staff_accreditation_status add value if not exists 'rechazado';

alter table brand_staff_members
  add column invitation_token uuid not null default gen_random_uuid(),
  add column responded_at timestamptz null,
  add column reconfirmed_at timestamptz null,
  add column reconfirm_requested_at timestamptz null;

create unique index brand_staff_members_invitation_token_idx on brand_staff_members (invitation_token);

-- =========================================================
-- registrations: de dónde sale un boleto y a quién pertenece.
-- `source` distingue el caso: 'compra-publica' (comportamiento
-- actual, sin cambios), 'compra-empresa' (empresa compra extra
-- vía Wompi desde el Portal), 'equipo-patrocinio' (colaborador),
-- 'invitado-patrocinio' (invitado profesional de la empresa).
-- =========================================================

alter table registrations
  add column company_id uuid null references companies (id),
  add column staff_id uuid null references brand_staff_members (id),
  add column invitation_token uuid null default gen_random_uuid(),
  add column responded_at timestamptz null,
  add column reconfirmed_at timestamptz null,
  add column reconfirm_requested_at timestamptz null;

create unique index registrations_invitation_token_idx on registrations (invitation_token);

alter table registrations enable row level security;

create policy registrations_company_read on registrations
  for select using (company_id = my_company_id() or is_admin());

-- Solo el registro de un invitado profesional se puede editar/borrar
-- desde el Portal, y solo antes de que reconfirme asistencia (una
-- vez reconfirmado, el boleto ya está activo y no debe tocarse).
create policy registrations_company_update on registrations
  for update using (company_id = my_company_id() and source = 'invitado-patrocinio')
  with check (company_id = my_company_id() and source = 'invitado-patrocinio');

create policy registrations_company_delete on registrations
  for delete using (company_id = my_company_id() and source = 'invitado-patrocinio' and reconfirmed_at is null);

-- Defensa en profundidad: aunque la política de arriba permite a la
-- empresa actualizar su propia fila de invitado, nunca debe poder
-- tocar el estado del boleto ni los datos de pago/origen desde el
-- cliente — eso solo lo hacen las funciones internas de este
-- archivo, que marcan set_config('app.internal_write', 'on', true)
-- antes de escribir esos campos.
create function prevent_registration_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- service_role (Edge Functions como wompi-webhook, que ya actualiza
  -- payment_status legítimamente) y las funciones internas de este
  -- archivo (marcadas con app.internal_write) quedan exentas; también
  -- el admin del dashboard, que sí puede editar cualquier campo.
  if is_admin() or current_user = 'service_role' or coalesce(current_setting('app.internal_write', true), 'off') = 'on' then
    return new;
  end if;
  if new.qr_status is distinct from old.qr_status
    or new.qr_code is distinct from old.qr_code
    or new.payment_status is distinct from old.payment_status
    or new.amount is distinct from old.amount
    or new.source is distinct from old.source
    or new.ticket_id is distinct from old.ticket_id
    or new.edition_id is distinct from old.edition_id
    or new.company_id is distinct from old.company_id
    or new.staff_id is distinct from old.staff_id
    or new.invitation_token is distinct from old.invitation_token
    or new.responded_at is distinct from old.responded_at
    or new.reconfirmed_at is distinct from old.reconfirmed_at
    or new.reconfirm_requested_at is distinct from old.reconfirm_requested_at
  then
    raise exception 'No autorizado a modificar este campo del registro';
  end if;
  return new;
end;
$$;

create trigger registrations_prevent_tampering
  before update on registrations
  for each row execute function prevent_registration_tampering();

-- =========================================================
-- Invitar a un profesional: crea directamente su fila en
-- `registrations` con el boleto inactivo (qr_status = 'invalid').
-- El company_id sale de la sesión, nunca del cliente.
-- =========================================================

create function invite_guest(
  p_edition_id text,
  p_full_name text,
  p_email text,
  p_specialty text default null,
  p_city text default null
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
    edition_id, ticket_id, full_name, email, specialty, city, modality, amount,
    payment_status, qr_status, source, company_id, invitation_token
  )
  values (
    p_edition_id, v_ticket_id, p_full_name, p_email, p_specialty, p_city, 'presencial', 0,
    'approved', 'invalid', 'invitado-patrocinio', v_company_id, gen_random_uuid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function invite_guest(text, text, text, text, text) from public, anon;
grant execute on function invite_guest(text, text, text, text, text) to authenticated;

-- =========================================================
-- Emitir el boleto de un colaborador (staff) — solo se llama
-- desde el paso 'reconfirmar' de respond_to_team_invitation.
-- Los invitados profesionales NO pasan por aquí: su fila en
-- registrations ya existe desde que se les invitó (invite_guest);
-- reconfirmar solo activa su qr_status.
-- =========================================================

create function issue_sponsor_ticket(
  p_edition_id text,
  p_company_id uuid,
  p_full_name text,
  p_email text,
  p_staff_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket_id uuid;
  v_qr text;
begin
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
    edition_id, ticket_id, full_name, email, modality, amount,
    payment_status, qr_status, source, company_id, staff_id
  )
  values (
    p_edition_id, v_ticket_id, p_full_name, p_email, 'presencial', 0,
    'approved', 'active', 'equipo-patrocinio', p_company_id, p_staff_id
  )
  returning qr_code into v_qr;

  return v_qr;
end;
$$;

revoke execute on function issue_sponsor_ticket(text, uuid, text, text, uuid) from public, anon, authenticated;

-- =========================================================
-- Lectura pública de una invitación por token — para que la página
-- /invitacion/:kind/:token pueda mostrar el nombre, la empresa y el
-- estado sin necesitar sesión, y para resolver la edición asociada.
-- =========================================================

create function get_team_invitation_info(p_kind text, p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if p_kind not in ('staff', 'guest') then
    raise exception 'Tipo de invitación inválido';
  end if;

  if p_kind = 'staff' then
    select jsonb_build_object(
      'name', s.name,
      'company_name', c.trade_name,
      'status', s.accreditation_status,
      'responded_at', s.responded_at,
      'reconfirmed_at', s.reconfirmed_at,
      'edition_id', p.edition_id,
      'edition_name', e.name,
      'edition_start_date', e.start_date
    ) into v_result
    from brand_staff_members s
    join companies c on c.id = s.company_id
    left join participations p on p.company_id = s.company_id
    left join editions e on e.id = p.edition_id
    where s.invitation_token = p_token
    order by p.created_at desc nulls last
    limit 1;
  else
    select jsonb_build_object(
      'name', g.full_name,
      'company_name', c.trade_name,
      'status', case
        when g.responded_at is null then 'invitado'
        when g.qr_status = 'cancelled' then 'rechazado'
        else 'registrado'
      end,
      'responded_at', g.responded_at,
      'reconfirmed_at', g.reconfirmed_at,
      'edition_id', g.edition_id,
      'edition_name', e.name,
      'edition_start_date', e.start_date
    ) into v_result
    from registrations g
    join companies c on c.id = g.company_id
    join editions e on e.id = g.edition_id
    where g.invitation_token = p_token and g.source = 'invitado-patrocinio';
  end if;

  if v_result is null then
    raise exception 'Invitación no encontrada';
  end if;

  return v_result;
end;
$$;

revoke execute on function get_team_invitation_info(text, uuid) from public, anon, authenticated;
grant execute on function get_team_invitation_info(text, uuid) to anon, authenticated;

-- =========================================================
-- RPC pública de respuesta a la invitación — el token ES la
-- autorización, no requiere sesión (quien invita no tiene cuenta
-- en la plataforma).
-- =========================================================

create function respond_to_team_invitation(
  p_kind text,
  p_token uuid,
  p_action text,
  p_edition_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff brand_staff_members%rowtype;
  v_reg registrations%rowtype;
  v_edition_start date;
  v_qr text;
begin
  if p_kind not in ('staff', 'guest') then
    raise exception 'Tipo de invitación inválido';
  end if;
  if p_action not in ('aceptar', 'rechazar', 'reconfirmar') then
    raise exception 'Acción inválida';
  end if;

  perform set_config('app.internal_write', 'on', true);

  if p_kind = 'staff' then
    select * into v_staff from brand_staff_members where invitation_token = p_token;
    if not found then raise exception 'Invitación no encontrada'; end if;
  else
    select * into v_reg from registrations where invitation_token = p_token and source = 'invitado-patrocinio';
    if not found then raise exception 'Invitación no encontrada'; end if;
  end if;

  if p_action in ('aceptar', 'rechazar') then
    if (p_kind = 'staff' and v_staff.responded_at is not null)
      or (p_kind = 'guest' and v_reg.responded_at is not null) then
      raise exception 'Esta invitación ya fue respondida';
    end if;

    if p_kind = 'staff' then
      update brand_staff_members
        set accreditation_status = case when p_action = 'aceptar' then 'acreditado' else 'rechazado' end,
            responded_at = now()
        where invitation_token = p_token;
    else
      update registrations
        set qr_status = case when p_action = 'aceptar' then 'invalid' else 'cancelled' end,
            responded_at = now()
        where invitation_token = p_token and source = 'invitado-patrocinio';
    end if;

    return jsonb_build_object('ok', true, 'action', p_action);
  end if;

  -- p_action = 'reconfirmar'
  if p_kind = 'staff' then
    if p_edition_id is null then
      raise exception 'Falta la edición para reconfirmar asistencia';
    end if;
    select start_date into v_edition_start from editions where id = p_edition_id;
  else
    select start_date into v_edition_start from editions where id = v_reg.edition_id;
  end if;

  if v_edition_start is null then
    raise exception 'Edición no encontrada o sin fecha de inicio';
  end if;
  if now() < (v_edition_start::timestamptz - interval '14 days') then
    raise exception 'La reconfirmación se habilita 2 semanas antes del evento (%).', v_edition_start;
  end if;

  if p_kind = 'staff' then
    if v_staff.responded_at is null or v_staff.accreditation_status <> 'acreditado' then
      raise exception 'Esta invitación todavía no fue aceptada';
    end if;
    if v_staff.reconfirmed_at is not null then
      raise exception 'La asistencia ya fue reconfirmada';
    end if;
    select issue_sponsor_ticket(p_edition_id, v_staff.company_id, v_staff.name, v_staff.email, v_staff.id) into v_qr;
    update brand_staff_members set reconfirmed_at = now() where invitation_token = p_token;
  else
    if v_reg.responded_at is null or v_reg.qr_status <> 'invalid' then
      raise exception 'Esta invitación todavía no fue aceptada';
    end if;
    if v_reg.reconfirmed_at is not null then
      raise exception 'La asistencia ya fue reconfirmada';
    end if;
    update registrations set qr_status = 'active', reconfirmed_at = now() where id = v_reg.id;
    v_qr := v_reg.qr_code;
  end if;

  return jsonb_build_object('ok', true, 'action', 'reconfirmar', 'qr_code', v_qr);
end;
$$;

revoke execute on function respond_to_team_invitation(text, uuid, text, text) from public, anon, authenticated;
grant execute on function respond_to_team_invitation(text, uuid, text, text) to anon, authenticated;

-- =========================================================
-- Notificaciones: un solo trigger por tabla/caso cubre todo el
-- ciclo. El mapper de la Edge Function decide las tags según el
-- estado actual de la fila (releída siempre con service_role).
-- =========================================================

create trigger brand_staff_members_ghl_sync
  after insert or update on brand_staff_members
  for each row execute function trigger_ghl_sync();

create trigger registrations_guest_invitation_ghl_sync
  after insert or update on registrations
  for each row
  when (new.source = 'invitado-patrocinio')
  execute function trigger_ghl_sync();

-- =========================================================
-- Recordatorio de reconfirmación cerca del evento (batch diario).
-- Si el proyecto de Supabase no permite pg_cron, esta función
-- queda disponible para invocarse a mano como respaldo.
-- =========================================================

create function send_reconfirmation_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  perform set_config('app.internal_write', 'on', true);

  for r in
    select distinct s.id, 'staff'::text as kind
    from brand_staff_members s
    join participations p on p.company_id = s.company_id
    join editions e on e.id = p.edition_id
    where s.accreditation_status = 'acreditado'
      and s.responded_at is not null
      and s.reconfirmed_at is null
      and s.reconfirm_requested_at is null
      and e.start_date is not null
      and e.start_date >= current_date
      and e.start_date - current_date <= 14
    union all
    select distinct g.id, 'guest'::text as kind
    from registrations g
    join editions e on e.id = g.edition_id
    where g.source = 'invitado-patrocinio'
      and g.responded_at is not null
      and g.qr_status = 'invalid'
      and g.reconfirmed_at is null
      and g.reconfirm_requested_at is null
      and e.start_date is not null
      and e.start_date >= current_date
      and e.start_date - current_date <= 14
  loop
    if r.kind = 'staff' then
      update brand_staff_members set reconfirm_requested_at = now() where id = r.id and reconfirm_requested_at is null;
    else
      update registrations set reconfirm_requested_at = now() where id = r.id and reconfirm_requested_at is null;
    end if;

    if found then
      perform supabase_functions.http_request(
        url := 'https://jbglybgnlhcgutpvlgca.supabase.co/functions/v1/ghl-sync-contact',
        method := 'POST',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZ2x5YmdubGhjZ3V0cHZsZ2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MDIzNTYsImV4cCI6MjEwMzA3ODM1Nn0.d9WYxg_LJuHkF29K9Mr2cDx8VunisYx_kRHLC1JhsWg'
        ),
        body := jsonb_build_object(
          'table', case when r.kind = 'staff' then 'brand_staff_members' else 'registrations' end,
          'record', jsonb_build_object('id', r.id)
        )
      );
    end if;
  end loop;
end;
$$;

revoke execute on function send_reconfirmation_reminders() from public, anon, authenticated;

create extension if not exists pg_cron;

do $$
begin
  perform cron.schedule('reconfirmation-reminders', '0 13 * * *', $cron$select send_reconfirmation_reminders()$cron$);
exception when others then
  raise notice 'pg_cron no disponible en este proyecto — invoca send_reconfirmation_reminders() a mano desde el SQL Editor.';
end;
$$;
