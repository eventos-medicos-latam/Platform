-- =========================================================
-- banner_slots exigía company_id (empresa registrada). Se permite
-- también un logo "abierto" — media partner, aliado in-kind, etc. —
-- sin registro de empresa detrás. Exactamente uno de los dos debe
-- estar lleno.
-- =========================================================

alter table banner_slots alter column company_id drop not null;

alter table banner_slots
  add column standalone_name text,
  add column standalone_logo_url text;

alter table banner_slots
  add constraint banner_slots_company_or_standalone_chk check (
    (company_id is not null and standalone_name is null and standalone_logo_url is null)
    or (company_id is null and standalone_name is not null and standalone_logo_url is not null)
  );
