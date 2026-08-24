-- El trigger prevent_profile_privilege_escalation bloqueaba TAMBIÉN los cambios
-- de rol hechos desde el SQL Editor (contexto sin sesión de Supabase Auth,
-- auth.uid() es null ahí), impidiendo promover al primer admin. Se permite el
-- cambio cuando no hay sesión de auth activa (SQL Editor / acceso de servicio);
-- se sigue bloqueando cuando un usuario autenticado no-admin intenta escalar
-- su propio rol o cambiar de compañía a través de la app.

create or replace function prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not is_admin()
     and (new.role <> old.role or new.company_id is distinct from old.company_id) then
    raise exception 'No tienes permiso para cambiar el rol o la compañía de este perfil';
  end if;
  return new;
end;
$$;
