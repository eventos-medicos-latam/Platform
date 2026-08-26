-- =========================================================
-- trigger_ghl_sync() y send_reconfirmation_reminders() llamaban a
-- supabase_functions.http_request(...), que solo existe si activaste
-- "Database Webhooks" en el Dashboard (no es el caso en este
-- proyecto). Eso rompía CUALQUIER insert público en las tablas con
-- el trigger (plan_requests, registrations, community_members): el
-- trigger fallaba y se revertía el insert completo.
--
-- Se reemplaza por net.http_post(), de la extensión pg_net que ya
-- está habilitada — no depende de ningún toggle del Dashboard.
-- =========================================================

create or replace function trigger_ghl_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://jbglybgnlhcgutpvlgca.supabase.co/functions/v1/ghl-sync-contact',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZ2x5YmdubGhjZ3V0cHZsZ2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MDIzNTYsImV4cCI6MjEwMzA3ODM1Nn0.d9WYxg_LJuHkF29K9Mr2cDx8VunisYx_kRHLC1JhsWg'
    ),
    body := jsonb_build_object('table', TG_TABLE_NAME, 'record', to_jsonb(NEW))
  );
  return NEW;
end;
$$;

create or replace function send_reconfirmation_reminders()
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
      perform net.http_post(
        url := 'https://jbglybgnlhcgutpvlgca.supabase.co/functions/v1/ghl-sync-contact',
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
