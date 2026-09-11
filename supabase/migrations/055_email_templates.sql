-- Plantillas de correo (editables en Novo) + cola de envío.
-- Los secretos de Resend siguen en Vault; aquí solo vive el contenido.

create table if not exists email_templates (
  key text primary key,
  audience text not null check (audience in ('cliente', 'empresa')),
  name text not null,
  description text not null default '',
  subject text not null,
  body_html text not null,
  attach_ticket_pdf boolean not null default false,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table email_templates enable row level security;
drop policy if exists email_templates_admin on email_templates;
create policy email_templates_admin on email_templates
  for all using (is_admin()) with check (is_admin());

create table if not exists email_outbox (
  id uuid primary key default gen_random_uuid(),
  template_key text not null references email_templates (key),
  to_email text not null,
  variables jsonb not null default '{}'::jsonb,
  registration_id uuid null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'error', 'skipped')),
  error text null,
  created_at timestamptz not null default now(),
  sent_at timestamptz null
);

create index if not exists email_outbox_status_idx on email_outbox (status, created_at);
create unique index if not exists email_outbox_reminder_once
  on email_outbox (template_key, registration_id)
  where registration_id is not null
    and template_key in ('attendee_reminder_7d', 'attendee_reminder_1d')
    and status in ('pending', 'sent');

alter table email_outbox enable row level security;
drop policy if exists email_outbox_admin on email_outbox;
create policy email_outbox_admin on email_outbox
  for all using (is_admin()) with check (is_admin());

create or replace function enqueue_email(
  p_key text,
  p_to text,
  p_vars jsonb default '{}'::jsonb,
  p_registration_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_enabled boolean;
  v_email text;
begin
  v_email := lower(trim(coalesce(p_to, '')));
  if v_email !~ '^[^@]+@[^@]+\.[^@]+$' then
    return null;
  end if;

  select enabled into v_enabled from email_templates where key = p_key;
  if v_enabled is not true then
    return null;
  end if;

  insert into email_outbox (template_key, to_email, variables, registration_id)
  values (p_key, v_email, coalesce(p_vars, '{}'::jsonb), p_registration_id)
  returning id into v_id;
  return v_id;
exception
  when unique_violation then
    return null;
end;
$$;

revoke all on function enqueue_email(text, text, jsonb, uuid) from public, anon;
grant execute on function enqueue_email(text, text, jsonb, uuid) to authenticated, service_role;

create or replace function trigger_email_outbox()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- pg_net (no supabase_functions.http_request: ese helper exige Database Webhooks).
  perform net.http_post(
    url := 'https://jbglybgnlhcgutpvlgca.supabase.co/functions/v1/send-template-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZ2x5YmdubGhjZ3V0cHZsZ2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MDIzNTYsImV4cCI6MjEwMzA3ODM1Nn0.d9WYxg_LJuHkF29K9Mr2cDx8VunisYx_kRHLC1JhsWg',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZ2x5YmdubGhjZ3V0cHZsZ2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MDIzNTYsImV4cCI6MjEwMzA3ODM1Nn0.d9WYxg_LJuHkF29K9Mr2cDx8VunisYx_kRHLC1JhsWg'
    ),
    body := jsonb_build_object('outbox_id', NEW.id)
  );
  return NEW;
end;
$$;

drop trigger if exists email_outbox_dispatch on email_outbox;
create trigger email_outbox_dispatch
  after insert on email_outbox
  for each row
  when (NEW.status = 'pending')
  execute function trigger_email_outbox();

-- ── Disparos: inscripciones Novo ───────────────────────────
create or replace function trigger_registration_emails()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_key text;
begin
  if TG_OP = 'UPDATE' and OLD.status is not distinct from NEW.status then
    return NEW;
  end if;
  v_key := case NEW.status
    when 'espera' then 'attendee_pending_payment'
    when 'confirmado' then 'attendee_confirmed'
    when 'cancelado' then 'attendee_cancelled'
    else null
  end;
  if v_key is null then
    return NEW;
  end if;
  select pi.raw_value into v_email
  from person_identifiers pi
  where pi.person_id = NEW.person_id
    and pi.identifier_type = 'email'
  order by pi.is_primary desc nulls last
  limit 1;
  if v_email is null then
    return NEW;
  end if;
  perform enqueue_email(v_key, v_email, '{}'::jsonb, NEW.id);
  return NEW;
end;
$$;

drop trigger if exists event_registrations_emails on event_registrations;
create trigger event_registrations_emails
  after insert or update of status on event_registrations
  for each row execute function trigger_registration_emails();

-- ── Disparos: postulaciones Aliados ────────────────────────
create or replace function trigger_plan_request_emails()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_plan text;
begin
  if TG_OP = 'INSERT' then
    v_key := 'ally_request_received';
  elsif TG_OP = 'UPDATE' and OLD.status is distinct from NEW.status then
    v_key := case NEW.status
      when 'en-conversacion' then 'ally_in_conversation'
      when 'aprobada' then 'ally_approved'
      when 'descartada' then 'ally_rejected'
      else null
    end;
  end if;
  if v_key is null then
    return NEW;
  end if;
  v_plan := coalesce(NEW.plan_id::text, NEW.ally_role::text, '');
  perform enqueue_email(
    v_key,
    NEW.contact_email,
    jsonb_build_object(
      'nombre', coalesce(NEW.contact_name, ''),
      'empresa', coalesce(NEW.company, ''),
      'plan', v_plan,
      'plan_request_id', NEW.id::text,
      'edition_id', coalesce(NEW.edition_id, '')
    )
  );
  return NEW;
end;
$$;

drop trigger if exists plan_requests_emails on plan_requests;
create trigger plan_requests_emails
  after insert or update of status on plan_requests
  for each row execute function trigger_plan_request_emails();

-- ── Disparos: pagos de empresa ─────────────────────────────
create or replace function company_notify_email(p_company_id uuid)
returns text
language sql
stable
set search_path = public
as $$
  select coalesce(nullif(trim(contact_email), ''), nullif(trim(email_principal), ''))
  from companies
  where id = p_company_id;
$$;

create or replace function trigger_company_payment_emails()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_key text;
begin
  v_email := company_notify_email(NEW.company_id);
  if v_email is null then
    return NEW;
  end if;
  if TG_OP = 'INSERT' and NEW.status = 'pendiente' then
    v_key := 'ally_payment_link';
  elsif TG_OP = 'UPDATE' and OLD.status is distinct from NEW.status and NEW.status = 'pagado' then
    v_key := 'ally_payment_received';
  end if;
  if v_key is null then
    return NEW;
  end if;
  perform enqueue_email(
    v_key,
    v_email,
    jsonb_build_object(
      'concepto', coalesce(NEW.concept, ''),
      'monto', coalesce(NEW.amount::text, ''),
      'payment_id', NEW.id::text,
      'empresa_id', NEW.company_id::text,
      'event_id', coalesce(NEW.event_id::text, ''),
      'edition_id', coalesce(NEW.edition_id::text, '')
    )
  );
  return NEW;
end;
$$;

drop trigger if exists company_payments_emails on company_payments;
create trigger company_payments_emails
  after insert or update of status on company_payments
  for each row execute function trigger_company_payment_emails();

-- ── Disparos: stand confirmado ─────────────────────────────
create or replace function trigger_stand_confirmed_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_code text;
begin
  if NEW.status is distinct from 'confirmado' then
    return NEW;
  end if;
  if TG_OP = 'UPDATE' and OLD.status is not distinct from NEW.status then
    return NEW;
  end if;
  v_email := company_notify_email(NEW.company_id);
  if v_email is null then
    return NEW;
  end if;
  select unit_number into v_code from stand_units where id = NEW.stand_unit_id;
  perform enqueue_email(
    'ally_stand_confirmed',
    v_email,
    jsonb_build_object(
      'stand', coalesce(v_code, ''),
      'empresa_id', NEW.company_id::text,
      'event_id', coalesce(NEW.event_id::text, '')
    )
  );
  return NEW;
end;
$$;

drop trigger if exists stand_reservations_emails on stand_reservations;
create trigger stand_reservations_emails
  after insert or update of status on stand_reservations
  for each row execute function trigger_stand_confirmed_email();

-- ── Disparos: invitación staff ─────────────────────────────
create or replace function trigger_staff_invite_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.email is null or length(trim(NEW.email)) = 0 then
    return NEW;
  end if;
  perform enqueue_email(
    'ally_staff_invite',
    NEW.email,
    jsonb_build_object(
      'nombre', coalesce(NEW.name, ''),
      'token', NEW.invitation_token::text,
      'staff_id', NEW.id::text,
      'empresa_id', NEW.company_id::text
    )
  );
  return NEW;
end;
$$;

drop trigger if exists brand_staff_invite_email on brand_staff_members;
create trigger brand_staff_invite_email
  after insert on brand_staff_members
  for each row execute function trigger_staff_invite_email();

-- ── Disparos: tickets extra (portal Hormobiota / empresa) ──
create or replace function trigger_extra_ticket_emails()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_email text;
begin
  if coalesce(NEW.source, '') is distinct from 'compra-empresa' then
    return NEW;
  end if;
  if TG_OP = 'INSERT' and coalesce(NEW.payment_status, '') not in ('approved', '') then
    return NEW;
  end if;
  if TG_OP = 'UPDATE' and coalesce(OLD.payment_status, '') = 'approved' then
    return NEW;
  end if;
  if TG_OP = 'UPDATE' and coalesce(NEW.payment_status, '') is distinct from 'approved' then
    return NEW;
  end if;
  if NEW.company_id is not null then
    v_company_email := company_notify_email(NEW.company_id);
    if v_company_email is not null then
      perform enqueue_email(
        'ally_extra_tickets',
        v_company_email,
        jsonb_build_object(
          'nombre', coalesce(NEW.full_name, ''),
          'asistente_email', coalesce(NEW.email, ''),
          'empresa_id', NEW.company_id::text
        )
      );
    end if;
  end if;
  if NEW.email is not null then
    perform enqueue_email(
      'attendee_confirmed',
      NEW.email,
      jsonb_build_object(
        'nombre', coalesce(NEW.full_name, ''),
        'qr', coalesce(NEW.qr_code, ''),
        'hormobiota_registration_id', NEW.id::text
      )
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists registrations_extra_ticket_emails on registrations;
create trigger registrations_extra_ticket_emails
  after insert or update of payment_status on registrations
  for each row execute function trigger_extra_ticket_emails();

-- ── Plantillas ─────────────────────────────────────────────
insert into email_templates (key, audience, name, description, subject, body_html, attach_ticket_pdf, sort_order) values
(
  'attendee_pending_payment',
  'cliente',
  'Inscripción creada (ticket con costo)',
  'Se envía cuando la inscripción queda en espera de pago Wompi.',
  'Recibimos tu inscripción a {{evento}}',
  '<p>Hola {{nombre}},</p><p>Registramos tu inscripción a <strong>{{evento}}</strong> con la entrada <strong>{{ticket}}</strong>.</p><p>Valor a pagar: <strong>{{monto}}</strong>.</p><p>Completa el pago para confirmar tu cupo. Si cerraste Wompi, vuelve a la página de inscripción del evento o escríbenos.</p><p>Fecha: {{fecha}}<br/>Lugar: {{lugar}}</p>',
  false,
  10
),
(
  'attendee_confirmed',
  'cliente',
  'Pago aprobado / ticket gratis',
  'Se envía al confirmar el cupo. Adjunta un PDF con el ticket y el código QR.',
  'Tu cupo está confirmado · {{evento}}',
  '<p>Hola {{nombre}},</p><p>Tu cupo a <strong>{{evento}}</strong> quedó confirmado.</p><p>Entrada: <strong>{{ticket}}</strong><br/>Fecha: {{fecha}}<br/>Lugar: {{lugar}}</p><p>Adjuntamos tu ticket en PDF. El código QR es tu acceso al evento: <strong>{{qr}}</strong>.</p><p>Guarda este correo. Te esperamos.</p>',
  true,
  20
),
(
  'attendee_cancelled',
  'cliente',
  'Cancelación de inscripción',
  'Se envía cuando el equipo cancela una inscripción.',
  'Cancelamos tu inscripción a {{evento}}',
  '<p>Hola {{nombre}},</p><p>Tu inscripción a <strong>{{evento}}</strong> fue cancelada.</p><p>Si esto no coincide con lo que esperabas o necesitas un reembolso, responde este correo o escríbenos al equipo de Eventos Médicos LATAM.</p>',
  false,
  30
),
(
  'attendee_reminder_7d',
  'cliente',
  'Recordatorio 7 días antes',
  'Se envía a inscripciones confirmadas una semana antes del evento.',
  'Faltan 7 días para {{evento}}',
  '<p>Hola {{nombre}},</p><p>Faltan 7 días para <strong>{{evento}}</strong>.</p><p>Fecha: {{fecha}}<br/>Lugar: {{lugar}}<br/>Tu QR: <strong>{{qr}}</strong></p><p>Revisa tu ticket adjunto si lo recibiste al confirmar, o responde este correo si no lo encuentras.</p>',
  true,
  40
),
(
  'attendee_reminder_1d',
  'cliente',
  'Recordatorio 1 día antes',
  'Se envía a inscripciones confirmadas el día anterior.',
  'Mañana es {{evento}}',
  '<p>Hola {{nombre}},</p><p>Mañana es <strong>{{evento}}</strong>.</p><p>Fecha: {{fecha}}<br/>Lugar: {{lugar}}</p><p>Ten a la mano tu QR: <strong>{{qr}}</strong>. Preséntalo en acreditación.</p>',
  true,
  50
),
(
  'ally_request_received',
  'empresa',
  'Postulación enviada',
  'Se envía al aliado cuando envía Pop Up, Conexión, Protagonista o alianza.',
  'Recibimos la postulación de {{empresa}}',
  '<p>Hola {{nombre}},</p><p>Recibimos la postulación de <strong>{{empresa}}</strong> ({{plan}}).</p><p>Esto no implica cobro. El equipo comercial revisa disponibilidad y te escribe con el siguiente paso.</p>',
  false,
  60
),
(
  'ally_in_conversation',
  'empresa',
  'Postulación en conversación',
  'Se envía cuando el estado pasa a “en conversación”.',
  'Siguiente paso para {{empresa}}',
  '<p>Hola {{nombre}},</p><p>La postulación de <strong>{{empresa}}</strong> ({{plan}}) pasó a conversación comercial.</p><p>Te contactaremos para confirmar stand, condiciones y documentos. Si tienes material listo, respóndenos este correo.</p>',
  false,
  70
),
(
  'ally_approved',
  'empresa',
  'Postulación aprobada',
  'Se envía al marcar la postulación como aprobada.',
  '{{empresa}} quedó confirmada',
  '<p>Hola {{nombre}},</p><p>La participación de <strong>{{empresa}}</strong> ({{plan}}) fue aprobada.</p><p>Entra al portal para ver stand, pagos y equipo: {{enlace}}</p>',
  false,
  80
),
(
  'ally_rejected',
  'empresa',
  'Postulación descartada',
  'Se envía al descartar una postulación.',
  'No fue posible el cupo de {{empresa}}',
  '<p>Hola {{nombre}},</p><p>En esta edición no fue posible confirmar la participación de <strong>{{empresa}}</strong> ({{plan}}).</p><p>Si quieres otra zona, plan o evento, responde este correo y lo revisamos.</p>',
  false,
  90
),
(
  'ally_payment_link',
  'empresa',
  'Link de pago / factura',
  'Se envía al crear una cuota pendiente para la empresa.',
  'Pago pendiente · {{concepto}}',
  '<p>Hola,</p><p>Quedó registrada una cuota para tu participación:</p><p><strong>{{concepto}}</strong><br/>Valor: <strong>{{monto}}</strong></p><p>Págala desde el portal: {{enlace}}</p>',
  false,
  100
),
(
  'ally_payment_received',
  'empresa',
  'Pago recibido',
  'Se envía cuando Wompi o el equipo marca un pago de empresa como pagado.',
  'Confirmamos el pago de {{concepto}}',
  '<p>Hola,</p><p>Registramos el pago de <strong>{{concepto}}</strong> por <strong>{{monto}}</strong>.</p><p>Puedes ver el estado en el portal: {{enlace}}</p>',
  false,
  110
),
(
  'ally_stand_confirmed',
  'empresa',
  'Stand confirmado',
  'Se envía al confirmar el stand de la empresa.',
  'Tu stand {{stand}} quedó confirmado',
  '<p>Hola,</p><p>El stand <strong>{{stand}}</strong> quedó confirmado para <strong>{{evento}}</strong>.</p><p>Fecha: {{fecha}}<br/>Lugar: {{lugar}}</p><p>El detalle de montaje y el plano están en el portal: {{enlace}}</p>',
  false,
  120
),
(
  'ally_staff_invite',
  'empresa',
  'Invitación a colaborador (staff)',
  'Se envía al colaborador cuando la empresa lo agrega al equipo.',
  'Acredítate con {{empresa}} en {{evento}}',
  '<p>Hola {{nombre}},</p><p><strong>{{empresa}}</strong> te acreditó como colaborador en <strong>{{evento}}</strong>.</p><p>Acepta o rechaza aquí: {{enlace}}</p><p>El QR se activa cuando reconfirmes asistencia (desde 14 días antes del evento).</p>',
  false,
  130
),
(
  'ally_extra_tickets',
  'empresa',
  'Tickets extra comprados',
  'Se envía a la empresa cuando registra o paga entradas extra para un asistente.',
  'Entrada extra registrada · {{evento}}',
  '<p>Hola,</p><p>Quedó registrada una entrada extra de <strong>{{empresa}}</strong> para <strong>{{nombre}}</strong> ({{asistente_email}}) en {{evento}}.</p><p>El asistente recibe su ticket por separado cuando el cupo está confirmado.</p>',
  false,
  140
)
on conflict (key) do update set
  audience = excluded.audience,
  name = excluded.name,
  description = excluded.description,
  attach_ticket_pdf = excluded.attach_ticket_pdf,
  sort_order = excluded.sort_order;

-- Recordatorios 7d / 1d: el admin los dispara desde Novo → Correos.
-- No reescribe plantillas ya editadas (subject/body se conservan en el ON CONFLICT).
create or replace function enqueue_due_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  v_count integer := 0;
  v_id uuid;
begin
  if not is_admin() then
    raise exception 'No autorizado';
  end if;

  for rec in
    select distinct on (er.id)
      er.id,
      pi.raw_value as email,
      case
        when e.start_date = (current_date + 7) then 'attendee_reminder_7d'
        when e.start_date = (current_date + 1) then 'attendee_reminder_1d'
      end as template_key
    from event_registrations er
    join events e on e.id = er.event_id
    join person_identifiers pi
      on pi.person_id = er.person_id
     and pi.identifier_type = 'email'
    where er.status = 'confirmado'
      and e.start_date in (current_date + 7, current_date + 1)
    order by er.id, pi.is_primary desc nulls last
  loop
    if rec.template_key is null then
      continue;
    end if;
    v_id := enqueue_email(rec.template_key, rec.email, '{}'::jsonb, rec.id);
    if v_id is not null then
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

revoke all on function enqueue_due_reminders() from public, anon;
grant execute on function enqueue_due_reminders() to authenticated;
