-- =========================================================
-- El formulario público de "Contacto" nunca guardaba nada: el botón
-- "Enviar solicitud" solo simulaba el envío en el navegador. Mismo
-- patrón de bug (y misma solución) que plan_requests/submit_plan_request
-- en 026: RPC SECURITY DEFINER, sin policy pública de SELECT.
-- =========================================================

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  reason text not null,
  name text not null,
  email text not null,
  whatsapp text,
  company text,
  message text,
  status text not null default 'nuevo',
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;

create policy contact_messages_admin_all on contact_messages
  for all using (is_admin()) with check (is_admin());

create function submit_contact_message(
  p_reason text,
  p_name text,
  p_email text,
  p_whatsapp text default null,
  p_company text default null,
  p_message text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into contact_messages (reason, name, email, whatsapp, company, message)
  values (p_reason, p_name, p_email, p_whatsapp, p_company, p_message);
end;
$$;

revoke execute on function submit_contact_message(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function submit_contact_message(text, text, text, text, text, text) to anon, authenticated;
