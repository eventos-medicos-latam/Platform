-- =========================================================
-- Extensiones necesarias para las integraciones
-- =========================================================

create extension if not exists supabase_vault with schema vault;
create extension if not exists pg_net;

-- =========================================================
-- Columnas nuevas para vincular con las integraciones externas
-- =========================================================

alter table registrations
  add column wompi_reference text unique null,
  add column wompi_transaction_id text null;

alter table info_products
  add column hotmart_checkout_url text null,
  add column hotmart_product_id text null;

alter table plan_requests
  add column crm_synced boolean not null default false;

-- =========================================================
-- hotmart_sales — log informativo de ventas externas
-- =========================================================

create table hotmart_sales (
  id uuid primary key default gen_random_uuid(),
  info_product_id uuid null references info_products (id),
  hotmart_transaction_id text not null unique,
  hotmart_product_id text,
  buyer_email text,
  buyer_name text,
  amount numeric(12, 2),
  status text not null,
  raw_payload jsonb not null,
  received_at timestamptz not null default now()
);

alter table hotmart_sales enable row level security;

create policy hotmart_sales_admin_all on hotmart_sales
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- public_settings — valores que SÍ pueden llegar al navegador
-- =========================================================

create table public_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public_settings enable row level security;

create policy public_settings_public_read on public_settings
  for select using (true);

create policy public_settings_admin_write on public_settings
  for insert with check (is_admin());

create policy public_settings_admin_update on public_settings
  for update using (is_admin()) with check (is_admin());

create policy public_settings_admin_delete on public_settings
  for delete using (is_admin());

-- =========================================================
-- secret_settings — solo METADATA del secreto (nunca el valor)
-- =========================================================

create table secret_settings (
  key text primary key,
  vault_secret_id uuid not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles (id)
);

alter table secret_settings enable row level security;

create policy secret_settings_admin_read on secret_settings
  for select using (is_admin());

-- Sin policy de insert/update/delete: todo pasa por set_integration_secret().

-- =========================================================
-- set_integration_secret — único camino de ESCRITURA de secretos
-- =========================================================

create function set_integration_secret(p_key text, p_value text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_existing_id uuid;
  v_new_id uuid;
begin
  if not is_admin() then
    raise exception 'No autorizado';
  end if;

  select vault_secret_id into v_existing_id from secret_settings where key = p_key;

  if v_existing_id is not null then
    perform vault.update_secret(v_existing_id, p_value);
    update secret_settings set updated_at = now(), updated_by = auth.uid() where key = p_key;
  else
    v_new_id := vault.create_secret(p_value, p_key);
    insert into secret_settings (key, vault_secret_id, updated_by)
      values (p_key, v_new_id, auth.uid());
  end if;
end;
$$;

revoke execute on function set_integration_secret(text, text) from public, anon;
grant execute on function set_integration_secret(text, text) to authenticated;

-- =========================================================
-- get_integration_secret — único camino de LECTURA de secretos.
-- SOLO service_role puede ejecutarla (Edge Functions). Un admin
-- autenticado por el cliente normal NUNCA puede leer el valor real.
-- =========================================================

create function get_integration_secret(p_key text)
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret
  from vault.decrypted_secrets ds
  join secret_settings ss on ss.vault_secret_id = ds.id
  where ss.key = p_key;
$$;

revoke execute on function get_integration_secret(text) from public, anon, authenticated;
grant execute on function get_integration_secret(text) to service_role;

-- =========================================================
-- Trigger de sincronización a GoHighLevel (GHL)
-- Dispara la Edge Function ghl-sync-contact en cada nuevo lead.
-- Usa la anon key (ya es pública) solo para pasar el filtro de PostgREST;
-- la Edge Function NUNCA confía en el payload del trigger más allá del
-- id — vuelve a leer la fila real con service_role antes de sincronizar.
-- =========================================================

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

create trigger registrations_ghl_sync
  after insert on registrations
  for each row execute function trigger_ghl_sync();

create trigger community_members_ghl_sync
  after insert on community_members
  for each row execute function trigger_ghl_sync();

create trigger plan_requests_ghl_sync
  after insert on plan_requests
  for each row execute function trigger_ghl_sync();
