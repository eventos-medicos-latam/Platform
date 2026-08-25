-- =========================================================
-- trash — papelera única para las 13 pantallas del dashboard.
-- Evita agregar una columna "borrado" en cada tabla individual.
-- =========================================================

create table trash (
  id uuid primary key default gen_random_uuid(),
  source_table text not null,
  source_id text not null,
  row_data jsonb not null,
  deleted_at timestamptz not null default now(),
  deleted_by uuid references profiles (id)
);

alter table trash enable row level security;

create policy trash_admin_all on trash
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- move_to_trash — copia la fila a trash y la borra de su tabla.
-- Whitelist explícita de tablas permitidas: defensa en profundidad,
-- nunca confiar solo en is_admin() para una función que arma DML
-- dinámico con el nombre de tabla como parámetro.
-- =========================================================

create function move_to_trash(p_table text, p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
begin
  if not is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_table not in (
    'agenda_items', 'speakers', 'tickets', 'registrations', 'participations',
    'plan_requests', 'banner_slots', 'stands', 'company_payments',
    'company_documents', 'requirements', 'secondary_events', 'info_products'
  ) then
    raise exception 'Tabla no permitida: %', p_table;
  end if;

  execute format('select to_jsonb(t) from %I t where id = $1', p_table)
    into v_row
    using p_id;

  if v_row is null then
    raise exception 'Fila no encontrada';
  end if;

  insert into trash (source_table, source_id, row_data, deleted_by)
    values (p_table, p_id, v_row, auth.uid());

  execute format('delete from %I where id = $1', p_table) using p_id;
end;
$$;

-- =========================================================
-- restore_from_trash — reinserta la fila en su tabla original.
-- =========================================================

create function restore_from_trash(p_trash_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trash record;
begin
  if not is_admin() then
    raise exception 'No autorizado';
  end if;

  select * into v_trash from trash where id = p_trash_id;
  if v_trash is null then
    raise exception 'No existe en la papelera';
  end if;

  execute format(
    'insert into %I select * from jsonb_populate_record(null::%I, $1)',
    v_trash.source_table, v_trash.source_table
  ) using v_trash.row_data;

  delete from trash where id = p_trash_id;
end;
$$;

revoke execute on function move_to_trash(text, text) from public, anon;
revoke execute on function restore_from_trash(uuid) from public, anon;
grant execute on function move_to_trash(text, text) to authenticated;
grant execute on function restore_from_trash(uuid) to authenticated;
