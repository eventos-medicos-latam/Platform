-- =========================================================
-- Bucket público para activos del sitio (logo, banner, etc.) que se
-- administran desde /admin/organizacion. `company-files` no sirve
-- para esto: es privado y solo entrega signed URLs temporales; un
-- logo necesita una URL pública y estable que la web anónima pueda
-- usar directo en un <img src>.
-- =========================================================

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

create policy site_assets_public_read on storage.objects
  for select using (bucket_id = 'site-assets');

create policy site_assets_admin_write on storage.objects
  for insert with check (bucket_id = 'site-assets' and is_admin());

create policy site_assets_admin_update on storage.objects
  for update using (bucket_id = 'site-assets' and is_admin());

create policy site_assets_admin_delete on storage.objects
  for delete using (bucket_id = 'site-assets' and is_admin());
