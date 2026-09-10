-- Eventos bandera Novo, copiados de las tarjetas públicas de /eventos.
-- No toca editions / event_families de Hormobiota.

insert into events (
  name, slug, tagline, description,
  event_type, modality, audience,
  start_date, end_date, timezone,
  venue_name, venue_address, venue_city, venue_country,
  is_public, is_free, is_featured, has_certificate,
  cover_image_url, logo_url, primary_color, accent_color,
  operational_status, publication_status
) values
(
  'La Eterna Primavera de tus Hormonas',
  'eterna-primavera-2026',
  'Hormonas, intestino y bienestar: la conexión que lo cambia todo',
  'La Eterna Primavera 2026 es un espacio creado para quienes tienen preguntas sobre su salud hormonal: pacientes, hombres y mujeres que quieren entender cómo las hormonas, el intestino y la alimentación determinan cómo nos sentimos cada día.

Inflamación, peso, energía, sueño, estado de ánimo: aprende qué dice la ciencia en un lenguaje claro y práctico, con especialistas que explican lo complejo de forma que puedes aplicar en tu vida.',
  'congreso',
  'hibrido',
  'ambos',
  '2026-11-07',
  '2026-11-07',
  'America/Bogota',
  'Medellín, Colombia',
  null,
  'Medellín',
  'Colombia',
  true, false, true, true,
  '/la_eterna_fondos.png',
  '/lA_ETERNA_PRIMAVERA_fondos ocuros..png',
  '#D25A8C',
  '#D25A8C',
  'proximo',
  'publicado'
),
(
  'Hormobiota 2',
  'hormobiota-2-2027',
  'El puente: del intestino a la longevidad',
  'Hormobiota 2 plantea que la microbiota no funciona como un órgano aislado, sino como una red que conecta diferentes sistemas del organismo.

El programa académico recorre seis puentes que van del sistema gastrointestinal a la longevidad celular y la piel, mostrando cómo una señal que nace en el intestino termina expresándose en el metabolismo, la inmunidad, el sueño y la apariencia.',
  'congreso',
  'presencial',
  'profesionales',
  '2027-04-23',
  '2027-04-24',
  'America/Bogota',
  'Auditorio Forum, UPB Medellín',
  'Universidad Pontificia Bolivariana, Circular 1',
  'Medellín',
  'Colombia',
  true, false, true, true,
  '/d4f3ab70-d106-434e-a5aa-86a250795de7.jpg',
  '/Hombobiota2_logook_oscuros.png',
  '#7C6BC0',
  '#7C6BC0',
  'proximo',
  'publicado'
)
on conflict (slug) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  description = excluded.description,
  event_type = excluded.event_type,
  modality = excluded.modality,
  audience = excluded.audience,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  venue_name = excluded.venue_name,
  venue_address = excluded.venue_address,
  venue_city = excluded.venue_city,
  venue_country = excluded.venue_country,
  is_public = excluded.is_public,
  is_featured = excluded.is_featured,
  has_certificate = excluded.has_certificate,
  cover_image_url = excluded.cover_image_url,
  logo_url = excluded.logo_url,
  primary_color = excluded.primary_color,
  accent_color = excluded.accent_color,
  operational_status = excluded.operational_status,
  publication_status = excluded.publication_status;

select id, slug, name, start_date, publication_status, is_public
from events
where slug in ('eterna-primavera-2026', 'hormobiota-2-2027')
order by start_date;
