-- =========================================================
-- NOVO ARCHITECTURE — Acuerdos comerciales y recaudo
-- Un acuerdo cerrado es inmutable. Cambios = adendas.
-- =========================================================

create table if not exists commercial_agreements (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references companies(id),
  event_id            uuid references events(id),        -- null = corporativo directo
  origin              novo_agreement_origin not null,
  status              novo_agreement_status not null default 'borrador',

  total               numeric(14,2) not null default 0,
  currency            text not null default 'COP',

  -- Snapshot congelado al cerrar (inmutable)
  snapshot            jsonb,
  current_version     integer not null default 1,
  closed_at           timestamptz,
  closed_by           uuid references profiles(id),

  notes               text,
  created_by          uuid references profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger commercial_agreements_set_updated_at
  before update on commercial_agreements
  for each row execute function set_updated_at();

-- Líneas del acuerdo
create table if not exists agreement_lines (
  id              uuid primary key default gen_random_uuid(),
  agreement_id    uuid not null references commercial_agreements(id) on delete cascade,
  product_id      uuid references products(id),
  description     text not null,
  quantity        integer not null default 1,
  list_price      numeric(12,2) not null,
  min_price       numeric(12,2),
  negotiated_price numeric(12,2) not null,
  discount_pct    numeric(5,2) default 0,
  subtotal        numeric(14,2) not null,
  custom_values   jsonb,
  created_at      timestamptz not null default now()
);

-- Versiones / adendas (nunca sobrescribir el acuerdo base)
create table if not exists agreement_versions (
  id              uuid primary key default gen_random_uuid(),
  agreement_id    uuid not null references commercial_agreements(id) on delete cascade,
  version_number  integer not null,
  version_type    text not null default 'version', -- 'version' | 'adenda'
  summary         text not null,
  snapshot        jsonb not null, -- copia completa del estado en ese momento
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now()
);

-- Calendario de recaudo (flexible, no 50/50 rígido)
create table if not exists collection_schedule (
  id              uuid primary key default gen_random_uuid(),
  agreement_id    uuid not null references commercial_agreements(id) on delete cascade,
  installment_no  integer not null,
  label           text,                              -- "Anticipo", "Cuota 1", etc.
  due_date        date not null,
  amount          numeric(14,2) not null,
  percentage      numeric(5,2),                      -- % del total si aplica
  status          text not null default 'pendiente', -- pendiente | pagado | vencido
  paid_at         timestamptz,
  payment_id      uuid,                              -- FK a payments al pagar
  change_reason   text,                              -- si se cambió la fecha
  changed_by      uuid references profiles(id),
  changed_at      timestamptz,
  created_at      timestamptz not null default now()
);

-- Pagos (fuente de verdad de transacciones)
create table if not exists novo_payments (
  id                  uuid primary key default gen_random_uuid(),
  agreement_id        uuid references commercial_agreements(id),
  schedule_id         uuid references collection_schedule(id),
  company_id          uuid references companies(id),
  event_id            uuid references events(id),

  amount              numeric(14,2) not null,
  currency            text not null default 'COP',
  method              novo_payment_method not null,
  status              payment_status not null default 'pending',

  reference           text,
  transaction_id      text,
  wompi_ref           text,
  receipt_url         text,
  notes               text,

  processed_at        timestamptz,
  created_by          uuid references profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table collection_schedule
  add constraint collection_schedule_payment_fk
  foreign key (payment_id) references novo_payments(id);

create trigger novo_payments_set_updated_at
  before update on novo_payments
  for each row execute function set_updated_at();

-- =========================================================
-- RLS
-- =========================================================

alter table commercial_agreements enable row level security;

create policy agreements_admin_all on commercial_agreements
  for all using (is_admin());

create policy agreements_empresa_read on commercial_agreements
  for select using (
    company_id = my_company_id()
  );

alter table agreement_lines enable row level security;
create policy agreement_lines_admin on agreement_lines for all using (is_admin());

alter table agreement_versions enable row level security;
create policy agreement_versions_admin on agreement_versions for all using (is_admin());

alter table collection_schedule enable row level security;
create policy collection_schedule_admin on collection_schedule for all using (is_admin());
create policy collection_schedule_empresa on collection_schedule
  for select using (
    exists (
      select 1 from commercial_agreements ca
      where ca.id = collection_schedule.agreement_id
        and ca.company_id = my_company_id()
    )
  );

alter table novo_payments enable row level security;
create policy novo_payments_admin on novo_payments for all using (is_admin());
create policy novo_payments_empresa on novo_payments
  for select using (company_id = my_company_id());
