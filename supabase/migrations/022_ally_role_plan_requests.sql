-- =========================================================
-- plan_requests deja de ser exclusivo de los 3 planes comerciales:
-- una solicitud de alianza institucional (sociedad médica, aliado
-- académico, media partner) también entra por aquí, con plan_id en
-- null y ally_role puesto en su lugar. Es la misma tabla y el mismo
-- flujo de registro público — solo cambia qué campo se llena.
-- =========================================================

alter table plan_requests alter column plan_id drop not null;
alter table plan_requests add column ally_role company_role null;

alter table plan_requests add constraint plan_requests_type_check check (
  (plan_id is not null and ally_role is null) or (plan_id is null and ally_role is not null)
);
