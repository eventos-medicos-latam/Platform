-- =========================================================
-- tickets
-- =========================================================

create table tickets (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references editions (id) on delete cascade,
  name text,
  kind ticket_kind not null,
  modality modality not null,
  price numeric(12, 2) null,
  currency text not null default 'COP' check (currency = 'COP'),
  vat_rate numeric(5, 2) not null default 0,
  quota int not null default 0,
  sold int not null default 0,
  start_date date,
  end_date date,
  benefits text[] not null default '{}',
  status publication_status not null default 'borrador',
  visible boolean not null default true,
  wompi_enabled boolean not null default false,
  emits_qr boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sold <= quota)
);

create trigger tickets_set_updated_at
  before update on tickets
  for each row execute function set_updated_at();

alter table tickets enable row level security;

create policy tickets_public_read on tickets
  for select using (visible and status = 'publicado');

create policy tickets_admin_all on tickets
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- registrations
-- =========================================================

create table registrations (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references editions (id) on delete cascade,
  ticket_id uuid not null references tickets (id),
  full_name text,
  email text,
  whatsapp text,
  city text,
  specialty text,
  track_interest_id text null references tracks (id),
  modality modality not null,
  amount numeric(12, 2) null,
  payment_status payment_status not null default 'pending',
  qr_code text not null unique,
  qr_status qr_status not null default 'active',
  checked_in_at timestamptz null,
  source text,
  crm_synced boolean not null default false,
  consent_commercial boolean not null default false,
  ip_address inet null,
  created_at timestamptz not null default now()
);

-- Genera un qr_code único si no viene informado
create function generate_registration_qr()
returns trigger
language plpgsql
as $$
declare
  candidate text;
  exists_already boolean;
begin
  if new.qr_code is not null and new.qr_code <> '' then
    return new;
  end if;

  loop
    candidate := 'HB-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
    select exists (select 1 from registrations where qr_code = candidate) into exists_already;
    exit when not exists_already;
  end loop;

  new.qr_code := candidate;
  return new;
end;
$$;

create trigger registrations_generate_qr
  before insert on registrations
  for each row execute function generate_registration_qr();

-- Incrementa/decrementa tickets.sold de forma atómica al aprobar/revertir un pago
create function sync_ticket_sold()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  was_approved boolean;
  is_approved boolean;
begin
  was_approved := (tg_op = 'UPDATE') and (old.payment_status = 'approved');
  is_approved := new.payment_status = 'approved';

  if is_approved and not was_approved then
    update tickets set sold = sold + 1 where id = new.ticket_id and sold < quota;
    if not found then
      raise exception 'El ticket % está agotado', new.ticket_id;
    end if;
  elsif was_approved and not is_approved then
    update tickets set sold = greatest(sold - 1, 0) where id = old.ticket_id;
  end if;

  return new;
end;
$$;

create trigger registrations_sync_ticket_sold
  after insert or update on registrations
  for each row execute function sync_ticket_sold();

alter table registrations enable row level security;

-- Grupo D: público solo INSERT (compra de ticket), sin SELECT de filas ajenas
create policy registrations_public_insert on registrations
  for insert to anon, authenticated
  with check (
    exists (select 1 from editions e where e.id = registrations.edition_id and e.status <> 'borrador')
  );

create policy registrations_admin_all on registrations
  for all using (is_admin()) with check (is_admin());
