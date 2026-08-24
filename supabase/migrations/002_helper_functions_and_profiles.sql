-- =========================================================
-- Funciones helper genéricas
-- =========================================================

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- profiles
-- =========================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'empresa',
  company_id uuid null, -- FK a companies se agrega en 005_companies.sql (companies aún no existe)
  full_name text not null default '',
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Funciones de autorización — SECURITY DEFINER + search_path fijo para:
--   1) no quedar atrapadas en la propia RLS de profiles (recursión infinita)
--   2) evitar hijacking de search_path
create function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create function my_company_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select company_id from profiles where id = auth.uid();
$$;

-- Alta automática de profile cuando se crea un usuario en auth.users
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, company_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'empresa'),
    nullif(new.raw_user_meta_data ->> 'company_id', '')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Evita que un usuario 'empresa' se autoasigne rol admin o cambie de compañía
create function prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() and (new.role <> old.role or new.company_id is distinct from old.company_id) then
    raise exception 'No tienes permiso para cambiar el rol o la compañía de este perfil';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_privilege_escalation
  before update on profiles
  for each row execute function prevent_profile_privilege_escalation();

-- =========================================================
-- RLS de profiles
-- =========================================================

alter table profiles enable row level security;

create policy profiles_select on profiles
  for select
  using (id = auth.uid() or is_admin());

create policy profiles_update on profiles
  for update
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- No hay policy de insert/delete: el insert real ocurre vía handle_new_user()
-- (security definer, ignora RLS); delete queda deshabilitado para todos los roles.
