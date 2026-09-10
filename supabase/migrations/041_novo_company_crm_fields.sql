-- Campos de CRM que el panel Novo necesita sobre companies (portal).
-- No crea una segunda tabla de empresas.

alter table companies add column if not exists sector text;
alter table companies add column if not exists department text;
alter table companies add column if not exists contact_job_title text;
alter table companies add column if not exists email_principal text;
