-- =========================================================
-- El formulario público de registro de patrocinio necesita el id
-- de la solicitud recién creada (para pasar al paso de pago). Pero
-- `plan_requests` no tiene policy de SELECT para anon/authenticated
-- (a propósito: son leads comerciales, no deben poder leerse en
-- masa desde el cliente) — y un INSERT con RETURNING sí exige una
-- policy de SELECT aplicable a la fila para poder devolverla,
-- aunque el WITH CHECK del insert haya pasado. Sin esa policy,
-- Postgres revierte el insert completo con el mismo mensaje que un
-- WITH CHECK fallido ("new row violates row-level security
-- policy"), que es justo el error que estaba bloqueando el
-- formulario.
--
-- La solución no es abrir SELECT público (expondría leads de la
-- competencia): es esta función SECURITY DEFINER, que inserta como
-- dueña de la tabla (bypassa RLS) y devuelve solo el id — mismo
-- patrón que invite_guest/issue_sponsor_ticket en 020.
-- =========================================================

create function submit_plan_request(
  p_edition_id text,
  p_company text,
  p_contact_name text,
  p_contact_email text,
  p_plan_id text default null,
  p_ally_role text default null,
  p_nit text default null,
  p_category text default null,
  p_country text default null,
  p_city text default null,
  p_contact_whatsapp text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from editions e where e.id = p_edition_id and e.status <> 'borrador') then
    raise exception 'Esta edición no está disponible para recibir solicitudes';
  end if;

  insert into plan_requests (
    edition_id, plan_id, ally_role, company, nit, category, country, city,
    contact_name, contact_email, contact_whatsapp
  )
  values (
    p_edition_id,
    p_plan_id::plan_id_enum,
    p_ally_role::company_role,
    p_company, p_nit, p_category, p_country, p_city,
    p_contact_name, p_contact_email, p_contact_whatsapp
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function submit_plan_request(text, text, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function submit_plan_request(text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;
