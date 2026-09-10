-- Slug estable para el directorio público /speakers/:slug
alter table speaker_profiles
  add column if not exists public_slug text;

update speaker_profiles sp
set public_slug = nullif(trim(both '-' from regexp_replace(
  translate(
    lower(coalesce(p.full_name, sp.id::text)),
    'áàäâãéèëêíìïîóòöôõúùüûñç',
    'aaaaaeeeeiiiiooooouuuunc'
  ),
  '[^a-z0-9]+', '-', 'g'
)), '')
from people p
where p.id = sp.person_id
  and sp.public_slug is null;

update speaker_profiles sp
set public_slug = ranked.public_slug || '-' || ranked.rn
from (
  select id, public_slug,
    row_number() over (partition by public_slug order by created_at) as rn
  from speaker_profiles
  where public_slug is not null
) ranked
where sp.id = ranked.id
  and ranked.rn > 1;

create unique index if not exists speaker_profiles_public_slug_uidx
  on speaker_profiles (public_slug)
  where public_slug is not null;
