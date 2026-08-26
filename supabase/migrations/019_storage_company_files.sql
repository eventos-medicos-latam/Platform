-- =========================================================
-- Storage: archivos que la empresa sube desde el Portal
-- (documentos y activos de marca). Bucket privado; cada
-- empresa solo ve/escribe su propia carpeta, admin ve todo.
-- Convención de ruta: {company_id}/{documents|brand-assets}/{archivo}
-- =========================================================

insert into storage.buckets (id, name, public)
values ('company-files', 'company-files', false)
on conflict (id) do nothing;

create policy company_files_read on storage.objects
  for select using (
    bucket_id = 'company-files'
    and ((storage.foldername(name))[1] = my_company_id()::text or is_admin())
  );

create policy company_files_insert on storage.objects
  for insert with check (
    bucket_id = 'company-files'
    and ((storage.foldername(name))[1] = my_company_id()::text or is_admin())
  );

create policy company_files_admin_update on storage.objects
  for update using (bucket_id = 'company-files' and is_admin());

create policy company_files_admin_delete on storage.objects
  for delete using (bucket_id = 'company-files' and is_admin());
