-- Estado operativo de la inscripción Novo (además de attended).
alter table event_registrations
  add column if not exists status text not null default 'confirmado';

update event_registrations
  set status = 'asistio'
  where attended = true and status = 'confirmado';

do $$ begin
  alter table event_registrations
    add constraint event_registrations_status_check
    check (status in ('confirmado', 'asistio', 'espera', 'cancelado'));
exception
  when duplicate_object then null;
end $$;
