-- La microsite /e/eterna-primavera-2026/aliados usa el id de catálogo
-- ed-eterna-primavera-2026. plan_requests.edition_id apunta a editions,
-- y esa fila nunca se sembró (014 solo cubre Hormobiota). El drawer
-- insertaba en directo, tragaba el error de FK/RLS y mostraba éxito.
--
-- 1) Sembrar familia + edición para que el RPC pueda recibir leads.
-- 2) Permitir postulación sin plan ni ally_role ("Registrar mi empresa").
-- 3) Ampliar submit_plan_request con notas.

insert into event_families (id, slug, name, tagline, description, since) values
(
  'fam-eterna-primavera',
  'eterna-primavera',
  'La Eterna Primavera',
  'Salud hormonal femenina en todas sus etapas',
  'Congreso de Eventos Médicos LATAM dedicado a la salud hormonal de la mujer: menopausia, SOP, tiroides y bienestar hormonal abordados desde la evidencia y con un enfoque integral.',
  2023
)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  tagline = excluded.tagline,
  description = excluded.description,
  since = excluded.since;

insert into editions (
  id, family_id, slug, name, edition_label, year, claim, concept_lead, concept, status,
  start_date, end_date, date_label, venue_name, venue_address, venue_city, venue_country, venue_notes,
  modality, accent_rgb, hero_kicker, sections, track_axis_label, track_axis_plural_label,
  track_axis_interest_question, audience, benefits, certification, capacity
) values (
  'ed-eterna-primavera-2026',
  'fam-eterna-primavera',
  'eterna-primavera-2026',
  'La Eterna Primavera de tus Hormonas',
  'Edición 2026 · Noviembre',
  2026,
  'Hormonas, intestino y bienestar: la conexión que lo cambia todo',
  'Cuando las hormonas funcionan bien, todo funciona bien.',
  array[
    'La Eterna Primavera 2026 es un espacio creado para quienes tienen preguntas sobre su salud hormonal: pacientes, hombres y mujeres que quieren entender cómo las hormonas, el intestino y la alimentación determinan cómo nos sentimos cada día.',
    'Inflamación, peso, energía, sueño, estado de ánimo: aprende qué dice la ciencia en un lenguaje claro y práctico, con especialistas que explican lo complejo de forma que puedes aplicar en tu vida.'
  ],
  'proximamente',
  date '2026-11-07',
  date '2026-11-07',
  '7 de noviembre de 2026',
  'Medellín, Colombia',
  'PENDIENTE',
  'Medellín',
  'Colombia',
  'Sede exacta en definición. Transmisión en línea disponible.',
  'hibrido',
  '210 90 140',
  'Congreso · Hormonas, intestino y bienestar',
  array['hero','concepto','publico','agenda','speakers','beneficios','tickets','certificacion','patrocinadores','aliados','faq','cta']::edition_section[],
  'Eje temático',
  'Ejes temáticos',
  '¿Cuál eje te interesa más?',
  array[
    'Personas con dudas sobre sus hormonas o metabolismo',
    'Pacientes con hipotiroidismo, POMS o resistencia a la insulina',
    'Hombres y mujeres interesados en la salud hormonal',
    'Personas con interés en nutrición, intestino e inflamación',
    'Quienes buscan mejorar su bienestar desde la alimentación',
    'Profesionales de la salud que acompañan a sus pacientes'
  ],
  array[
    'Conferencias en lenguaje claro, sin tecnicismos',
    'Respuestas a las preguntas que más se hacen sobre hormonas',
    'Conexión con personas que viven los mismos procesos',
    'Certificado de asistencia',
    'Memorias digitales del congreso'
  ],
  'PENDIENTE',
  'PENDIENTE'
)
on conflict (id) do update set
  family_id = excluded.family_id,
  slug = excluded.slug,
  name = excluded.name,
  edition_label = excluded.edition_label,
  year = excluded.year,
  claim = excluded.claim,
  concept_lead = excluded.concept_lead,
  concept = excluded.concept,
  status = excluded.status,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  date_label = excluded.date_label,
  venue_name = excluded.venue_name,
  venue_city = excluded.venue_city,
  venue_country = excluded.venue_country,
  modality = excluded.modality,
  accent_rgb = excluded.accent_rgb,
  hero_kicker = excluded.hero_kicker,
  sections = excluded.sections,
  audience = excluded.audience,
  benefits = excluded.benefits;

alter table plan_requests drop constraint if exists plan_requests_type_check;
alter table plan_requests add constraint plan_requests_type_check check (
  not (plan_id is not null and ally_role is not null)
);

drop function if exists public.submit_plan_request(text, text, text, text, text, text, text, text, text, text, text);

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
  p_contact_whatsapp text default null,
  p_notes text default null
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
    contact_name, contact_email, contact_whatsapp, notes
  )
  values (
    p_edition_id,
    nullif(p_plan_id, '')::plan_id_enum,
    nullif(p_ally_role, '')::company_role,
    p_company, p_nit, p_category, p_country, p_city,
    p_contact_name, p_contact_email, p_contact_whatsapp, nullif(p_notes, '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function submit_plan_request(text, text, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function submit_plan_request(text, text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;
