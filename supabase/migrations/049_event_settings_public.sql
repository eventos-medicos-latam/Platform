-- La página pública /e/:slug necesita leer secciones y copy guardados en event_settings.
create policy event_settings_public_read on event_settings
  for select using (
    exists (
      select 1 from events e
      where e.id = event_settings.event_id
        and e.is_public = true
        and e.publication_status in ('publicado', 'vista-previa')
    )
  );
