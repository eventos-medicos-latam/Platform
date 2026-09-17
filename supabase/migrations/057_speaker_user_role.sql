-- Speaker self-signup envía raw_user_meta_data.role = 'speaker'.
-- user_role solo tenía admin | empresa, así que handle_new_user
-- cascaba el insert y Auth devolvía "Database error saving new user".

alter type user_role add value if not exists 'speaker';

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  resolved_role user_role := 'empresa';
  v_person_id uuid;
  v_email text;
  v_name text;
  v_specialty text;
  v_institution text;
  v_country text;
  v_slug text;
  v_email_norm text;
begin
  requested_role := lower(btrim(coalesce(new.raw_user_meta_data ->> 'role', '')));
  v_email := coalesce(new.email, '');
  v_name := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), v_email, 'Speaker');
  v_specialty := nullif(btrim(new.raw_user_meta_data ->> 'especialidad'), '');
  v_institution := nullif(btrim(new.raw_user_meta_data ->> 'institucion'), '');
  v_country := nullif(btrim(new.raw_user_meta_data ->> 'pais'), '');
  v_email_norm := lower(btrim(v_email));

  if requested_role <> '' and requested_role <> 'admin'
     and requested_role = any (enum_range(null::user_role)::text[]) then
    resolved_role := requested_role::user_role;
  end if;

  insert into public.profiles (id, email, full_name, role, company_id)
  values (new.id, v_email, v_name, resolved_role, null);

  if requested_role = 'speaker' then
    begin
      select pi.person_id into v_person_id
      from person_identifiers pi
      where pi.identifier_type = 'email'
        and pi.normalized_value = v_email_norm
      limit 1;

      if v_person_id is null then
        insert into people (full_name, country)
        values (v_name, v_country)
        returning id into v_person_id;

        if v_email_norm <> '' then
          insert into person_identifiers (
            person_id, identifier_type, raw_value, normalized_value, is_primary
          ) values (
            v_person_id, 'email', v_email, v_email_norm, true
          )
          on conflict (identifier_type, normalized_value) do nothing;
        end if;

        insert into person_identifiers (
          person_id, identifier_type, raw_value, normalized_value, is_primary
        ) values (
          v_person_id, 'auth_user_id', new.id::text, new.id::text, false
        )
        on conflict (identifier_type, normalized_value) do nothing;

        insert into person_classifications (person_id, classification, source)
        values (v_person_id, 'speaker', 'web-registro')
        on conflict (person_id, classification, event_id) do nothing;
      end if;

      update profiles
         set person_id = v_person_id
       where id = new.id
         and person_id is null;

      v_slug := nullif(trim(both '-' from regexp_replace(
        translate(
          lower(v_name),
          'áàäâãéèëêíìïîóòöôõúùüûñç',
          'aaaaaeeeeiiiiooooouuuunc'
        ),
        '[^a-z0-9]+', '-', 'g'
      )), '');
      if v_slug is null then
        v_slug := 'speaker';
      end if;
      if exists (select 1 from speaker_profiles where public_slug = v_slug) then
        v_slug := v_slug || '-' || substr(replace(v_person_id::text, '-', ''), 1, 6);
      end if;

      insert into speaker_profiles (
        person_id, public_title, public_institution, specialty, public_slug, is_public
      ) values (
        v_person_id, v_name, v_institution, v_specialty, v_slug, false
      )
      on conflict (person_id) do update
        set public_title = coalesce(speaker_profiles.public_title, excluded.public_title),
            public_institution = coalesce(speaker_profiles.public_institution, excluded.public_institution),
            specialty = coalesce(speaker_profiles.specialty, excluded.specialty);
    exception when others then
      -- El usuario de Auth y el profile ya existen; no revertir el alta.
      null;
    end;
  end if;

  return new;
end;
$$;
