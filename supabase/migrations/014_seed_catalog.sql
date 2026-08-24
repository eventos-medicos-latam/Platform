-- =========================================================
-- SEED — contenido estructural/editorial real (no transaccional).
-- Extraído literalmente de src/data/*.ts. Las entidades transaccionales
-- (companies, participations, registrations, banner_slots, etc.) se
-- dejan vacías a propósito: se llenan con uso real de la plataforma.
-- =========================================================

-- =========================================================
-- event_families
-- =========================================================

insert into event_families (id, slug, name, tagline, description, since) values
('fam-hormobiota', 'hormobiota', 'Hormobiota', 'Microbiota, hormonas y longevidad',
 'Familia de congresos de Eventos Médicos LATAM dedicada a la relación entre microbiota, sistema endocrino y longevidad. Cada edición amplía el mapa de conexiones entre sistemas.',
 2026);

-- =========================================================
-- editions (previous/next_edition_id se completan después con UPDATE
-- para evitar la referencia circular entre las dos filas)
-- =========================================================

insert into editions (
  id, family_id, slug, name, edition_label, year, claim, concept_lead, concept, status,
  start_date, end_date, date_label, venue_name, venue_address, venue_city, venue_country, venue_notes,
  modality, accent_rgb, hero_kicker, sections, track_axis_label, track_axis_plural_label,
  track_axis_interest_question, audience, benefits, certification, capacity, results, pre_experience
) values (
  'ed-hormobiota-2027', 'fam-hormobiota', 'hormobiota-2-2027', 'Hormobiota 2', 'Segunda edición · 2027', 2027,
  'El puente: del intestino a la longevidad',
  'La medicina del siglo XXI ya no trata órganos aislados. Trata redes.',
  array[
    'Hormobiota 2 plantea que la microbiota no funciona como un órgano aislado, sino como una red que conecta diferentes sistemas del organismo.',
    'El programa académico recorre seis puentes que van del sistema gastrointestinal a la longevidad celular y la piel, mostrando cómo una señal que nace en el intestino termina expresándose en el metabolismo, la inmunidad, el sueño y la apariencia.'
  ],
  'preventa', date '2027-04-23', date '2027-04-24', '23 y 24 de abril de 2027',
  'Auditorio Forum, UPB Medellín', 'Universidad Pontificia Bolivariana, Circular 1 · PENDIENTE (dirección exacta del acceso)',
  'Medellín', 'Colombia', 'Parqueaderos, rutas de acceso y hoteles aliados: PENDIENTE.',
  'presencial', '124 107 192', 'Congreso internacional · Educación médica continua',
  array['hero','concepto','ejes','publico','agenda','speakers','beneficios','modalidades','tickets','certificacion','patrocinadores','aliados','stands','ubicacion','faq','cta']::edition_section[],
  'Puente', 'Los seis puentes', '¿Cuál puente te interesa más?',
  array['Médicos generales y especialistas','Endocrinología, gastroenterología y nutrición clínica','Ginecología, dermatología y medicina estética','Medicina funcional, deportiva y antienvejecimiento','Residentes y estudiantes de últimos semestres','Industria farmacéutica y de nutrición clínica'],
  array['Dos días de programa académico organizado por puentes','Ruta Hormobiota: 21 días de contenido previo al evento','Certificado de asistencia (entidad certificadora PENDIENTE)','Networking dirigido por puente de interés','Memorias digitales del congreso','Cóctel de networking al cierre del día 1'],
  'PENDIENTE · entidad certificadora y número de horas en definición', 'PENDIENTE',
  '[]'::jsonb,
  '{"name":"Ruta Hormobiota","durationLabel":"21 días antes del congreso","description":"Una experiencia previa que prepara al asistente: contenido diario asociado a los seis puentes, comunidad y guía descargable. Se opera con GoHighLevel y WhatsApp, no requiere plataforma aparte.","channels":["WhatsApp","Email","Guía PDF","Comunidad"]}'::jsonb
);

insert into editions (
  id, family_id, slug, name, edition_label, year, claim, concept_lead, concept, status,
  start_date, end_date, date_label, venue_name, venue_address, venue_city, venue_country, venue_notes,
  modality, accent_rgb, hero_kicker, sections, track_axis_label, track_axis_plural_label,
  track_axis_interest_question, audience, benefits, certification, capacity, results
) values (
  'ed-hormobiota-2026', 'fam-hormobiota', 'hormobiota-2026', 'Hormobiota', 'Primera edición · 2026', 2026,
  'Microbiota, hormonas y salud metabólica',
  'La primera edición abrió la conversación entre microbiota y sistema endocrino.',
  array[
    'Hormobiota 2026 reunió en Medellín a profesionales de la salud alrededor de la relación entre microbiota, hormonas y salud metabólica.',
    'La edición dejó las bases del concepto que Hormobiota 2 amplía: los sistemas del cuerpo no se entienden por separado.'
  ],
  'historico', date '2026-04-17', date '2026-04-18', '17 y 18 de abril de 2026',
  'Medellín, Colombia', 'PENDIENTE', 'Medellín', 'Colombia', 'Sede exacta de la primera edición: PENDIENTE en el archivo.',
  'presencial', '124 107 192', 'Evento realizado · Archivo histórico',
  array['hero','concepto','agenda','speakers','certificacion','galeria','memorias','resultados','patrocinadores','aliados','cta']::edition_section[],
  'Eje temático', 'Ejes temáticos', '¿Cuál eje te interesa más?',
  array['Médicos generales y especialistas','Nutrición clínica y medicina funcional','Industria farmacéutica y de nutrición'],
  '{}',
  'PENDIENTE · certificación emitida en la primera edición', 'PENDIENTE',
  '[{"label":"Asistentes","value":"PENDIENTE"},{"label":"Speakers","value":"PENDIENTE"},{"label":"Empresas participantes","value":"PENDIENTE"},{"label":"Horas académicas","value":"PENDIENTE"}]'::jsonb
);

update editions set previous_edition_id = 'ed-hormobiota-2026' where id = 'ed-hormobiota-2027';
update editions set next_edition_id = 'ed-hormobiota-2027' where id = 'ed-hormobiota-2026';

-- =========================================================
-- tracks — los seis puentes de Hormobiota 2 · 2027
-- =========================================================

insert into tracks (id, edition_id, order_num, name, subtitle, description, icon) values
('puente-1', 'ed-hormobiota-2027', 1, 'Sistema gastrointestinal', 'Origen y cimiento',
 'La microbiota como punto de partida: barrera intestinal, diversidad microbiana y su papel estructural en el resto de la red.', 'gut'),
('puente-2', 'ed-hormobiota-2027', 2, 'Metabolismo y hormonas', 'Del intestino a la señal endocrina',
 'Cómo la señal que nace en el intestino se traduce en regulación metabólica y hormonal.', 'hormone'),
('puente-3', 'ed-hormobiota-2027', 3, 'Inmunidad y sistema musculoesquelético', 'Las dos caras de la resiliencia',
 'Inflamación, respuesta inmune y función muscular como expresión de la misma capacidad de resistir.', 'immune'),
('puente-4', 'ed-hormobiota-2027', 4, 'Sueño y neuroinflamación', 'Reparación y regulación',
 'El descanso como mecanismo de reparación y su relación con los procesos neuroinflamatorios.', 'sleep'),
('puente-5', 'ed-hormobiota-2027', 5, 'Longevidad celular', 'Nutrición, biomarcadores y sarcopenia',
 'Activación celular, biomarcadores de longevidad, nutrición e intervención sobre la sarcopenia.', 'cell'),
('puente-6', 'ed-hormobiota-2027', 6, 'Piel', 'Eje intestino-piel',
 'Dermatología integrativa, medicina estética y regenerativa leídas desde el eje intestino-piel.', 'skin');

-- =========================================================
-- participation_plan_types — los 3 planes reales, copy completo
-- =========================================================

insert into participation_plan_types (
  id, name, verb, tagline, intro, mockup, benefit_groups, ideal_for, closing,
  space, max_staff, guest_passes, includes_bridge, includes_speaker
) values (
  'pop-up', 'Pop Up', 'Estar presente', 'Presencia de marca simple y directa',
  array[
    'El Pop Up Hormobiota es una estación comercial compacta para marcas que quieren presencia presencial durante el evento sin montar un stand completo.',
    'Permite presentar productos o servicios, entregar muestras o información y conversar directamente con los asistentes en un espacio sencillo y profesional.'
  ],
  '/6a377214-6ce0-4f52-b0d6-21031ee7bd6e.jpg',
  '[
    {"title":"Presencia física","items":["Espacio comercial asignado dentro de la zona de exhibición.","1 mesa para presentación de productos, muestras o material informativo.","2 sillas.","Espacio para 1 pendón tipo roll-up, banner vertical o elemento gráfico portátil.","Exhibición de productos y material promocional sobre la mesa.","Contacto directo con los asistentes durante los dos días."]},
    {"title":"Equipo de marca","items":["Acceso para máximo 2 colaboradores encargados de atender el espacio."]}
  ]'::jsonb,
  array['Participar presencialmente en Hormobiota.','Dar a conocer un producto o servicio.','Exhibir muestras o material comercial.','Conversar directamente con profesionales.','Probar la experiencia antes de una participación de mayor escala.'],
  'Una forma práctica de estar presente y acercar tu marca a la comunidad Hormobiota.',
  'estacion', 2, 0, false, false
), (
  'conexion', 'Paquete Conexión', 'Conectar', 'Ruta 21 + presencia digital + web + stand + relacionamiento',
  array[
    'Diseñado para marcas que quieren ir más allá de la presencia física y formar parte del ecosistema Hormobiota antes y durante el evento.',
    'Combina presencia digital, participación en la Ruta Hormobiota, exposición en la página web, stand físico y relacionamiento directo con profesionales de la categoría de interés.'
  ],
  '/4aaff8ba-1e62-415f-82db-238bccf29f4d.jpg',
  '[
    {"title":"Ruta Hormobiota — 21 días","items":["Integración de la marca dentro del contenido de la Ruta de 21 días.","Asociación con el puente, temática o nicho relacionado con la categoría.","Logo dentro de la guía PDF de la Ruta.","Presencia dentro de la comunidad digital vinculada a la Ruta.","Lista de profesionales inscritos interesados en su categoría, entregada 7 días antes del evento, según autorizaciones de tratamiento de datos."]},
    {"title":"Presencia en web y ecosistema digital","items":["Logo y presencia de marca en la página web oficial de Hormobiota.","Presencia digital en páginas y comunicaciones de los eventos en los que participe.","Integración de marca dentro de contenidos digitales de su categoría.","Presencia dentro del ecosistema digital previo al evento."]},
    {"title":"Redes sociales","items":["3 menciones de marca en redes sociales de Hormobiota.","Presencia en contenidos del puente o nicho correspondiente.","Inclusión en comunicaciones digitales seleccionadas."]},
    {"title":"Presencia física","items":["Stand físico en el foyer durante los dos días del evento.","Espacio para exhibición, relacionamiento y atención de asistentes.","Presentación de productos, muestras, materiales educativos o información comercial.","Acceso para máximo 4 colaboradores de la marca."]},
    {"title":"Branding del evento","items":["Logo en piezas físicas seleccionadas: backing, escarapelas y señalética.","Elementos de branding relacionados con la experiencia del evento.","Presencia dentro del entorno digital asociado al evento."]},
    {"title":"Relacionamiento","items":["Mesa cercana al nicho o puente de interés durante el almuerzo dialogado del viernes.","Conversaciones con profesionales relacionados con su categoría.","10 invitaciones para profesionales de la salud de la marca."]}
  ]'::jsonb,
  array['Tener un stand formal dentro del evento.','Presentar productos y servicios.','Tener presencia en la página web de Hormobiota.','Mantener visibilidad digital antes del evento.','Participar en la Ruta Hormobiota.','Generar conversaciones con profesionales de su categoría.'],
  'Conexión transforma la presencia de marca en una experiencia de relacionamiento antes y durante Hormobiota.',
  'stand', 4, 10, false, false
), (
  'protagonista', 'Paquete Protagonista', 'Posicionarte', 'Posicionamiento integral + speaker + presencia académica',
  array[
    'La modalidad de mayor visibilidad e integración de Hormobiota 2027.',
    'Para marcas que no solo quieren participar comercialmente, sino posicionarse dentro de una conversación científica específica, asociar su marca a uno de los puentes temáticos y mantener presencia en el ecosistema durante varios meses.'
  ],
  '/285ac78b-9248-4269-8506-398003778faa.jpg',
  '[
    {"title":"Todo lo del Paquete Conexión","items":["Ruta Hormobiota de 21 días con integración de marca y logo en la guía PDF.","Stand físico durante los dos días y máximo 4 colaboradores.","Branding en backing, escarapelas, señalética y piezas digitales.","Mesa en el almuerzo dialogado del nicho correspondiente."]},
    {"title":"Presencia web y digital ampliada","items":["Logo y presencia destacada en la página web oficial.","Presencia digital en las comunicaciones de todos los eventos y actividades.","Exposición digital antes, durante y después del evento.","Visibilidad continua durante 3 a 6 meses."]},
    {"title":"Plan completo de menciones","items":["Plan ampliado de presencia en redes sociales.","Integración en contenidos de la temática patrocinada.","Asociación de la marca con el contenido de su puente."]},
    {"title":"Speaker","items":["Participación con un speaker dentro del espacio académico de su puente.","La marca puede proponer su propio speaker, presentar un profesional de su área o pedir acompañamiento de Hormobiota.","Sujeto a revisión y aprobación del Comité Científico."]},
    {"title":"Espacio académico","items":["Espacio dentro de la programación académica del puente patrocinado.","Formato de charla, presentación académica o simposio corto.","El formato definitivo depende de la estructura académica y del Comité Científico."]},
    {"title":"Naming del puente","items":["Asociación del nombre de la marca con uno de los puentes temáticos.","Ejemplo: «El puente al sistema GI, presentado por [MARCA]».","Exclusividad: 1 marca por puente, 6 espacios en toda la edición."]},
    {"title":"Relacionamiento","items":["Mesa del nicho de interés durante el almuerzo dialogado.","Contacto directo con profesionales de la temática.","20 invitaciones para profesionales de la salud de la marca."]}
  ]'::jsonb,
  array['Posicionamiento dentro de una categoría científica específica.','Presencia destacada en la página web.','Exposición digital durante varios meses.','Asociar la marca con contenidos educativos.','Participar mediante un speaker.','Vincular su nombre con uno de los puentes Hormobiota.'],
  'Protagonista lleva a la marca más allá del stand: la integra dentro de la conversación científica y del ecosistema Hormobiota.',
  'stand', 4, 20, true, true
);

-- =========================================================
-- participation_plan_editions — precio/inventario 2027
-- =========================================================

insert into participation_plan_editions (plan_id, edition_id, price, total_inventory, sold, availability_note) values
('pop-up', 'ed-hormobiota-2027', 3200000, 5, 1, 'Máximo 5 estaciones en la zona de exhibición.'),
('conexion', 'ed-hormobiota-2027', 8900000, 8, 2, 'Espacios limitados, sujetos a la capacidad física del foyer.'),
('protagonista', 'ed-hormobiota-2027', 19500000, 6, 2, '6 cupos en toda la edición · 1 marca por puente.');

-- =========================================================
-- plan_comparison_rows
-- =========================================================

insert into plan_comparison_rows (edition_id, label, plan_values, footnote, order_num) values
('ed-hormobiota-2027', 'Inversión', '{"pop-up":"$3.200.000","conexion":"$8.900.000","protagonista":"$19.500.000"}', false, 1),
('ed-hormobiota-2027', 'Tipo de espacio', '{"pop-up":"Estación Pop Up","conexion":"Stand","protagonista":"Stand"}', false, 2),
('ed-hormobiota-2027', 'Exhibición de producto', '{"pop-up":"✓","conexion":"✓","protagonista":"✓"}', false, 3),
('ed-hormobiota-2027', 'Máximo de colaboradores', '{"pop-up":"2","conexion":"4","protagonista":"4"}', false, 4),
('ed-hormobiota-2027', 'Invitados profesionales', '{"pop-up":"—","conexion":"10","protagonista":"20"}', false, 5),
('ed-hormobiota-2027', 'Ruta Hormobiota 21 días', '{"pop-up":"—","conexion":"✓","protagonista":"✓"}', false, 6),
('ed-hormobiota-2027', 'Logo en guía PDF', '{"pop-up":"—","conexion":"✓","protagonista":"✓"}', false, 7),
('ed-hormobiota-2027', 'Presencia comunidad digital', '{"pop-up":"—","conexion":"✓","protagonista":"✓"}', false, 8),
('ed-hormobiota-2027', 'Presencia página web', '{"pop-up":"—","conexion":"✓","protagonista":"✓ destacada"}', false, 9),
('ed-hormobiota-2027', 'Presencia digital en eventos', '{"pop-up":"—","conexion":"✓","protagonista":"✓ ampliada"}', false, 10),
('ed-hormobiota-2027', 'Profesionales interesados por categoría', '{"pop-up":"—","conexion":"✓","protagonista":"✓"}', true, 11),
('ed-hormobiota-2027', 'Redes sociales', '{"pop-up":"—","conexion":"3 menciones","protagonista":"Plan completo"}', false, 12),
('ed-hormobiota-2027', 'Branding físico', '{"pop-up":"—","conexion":"✓","protagonista":"✓"}', false, 13),
('ed-hormobiota-2027', 'Almuerzo dialogado / nicho', '{"pop-up":"—","conexion":"✓","protagonista":"✓"}', false, 14),
('ed-hormobiota-2027', 'Speaker', '{"pop-up":"—","conexion":"—","protagonista":"✓"}', false, 15),
('ed-hormobiota-2027', 'Espacio académico', '{"pop-up":"—","conexion":"—","protagonista":"✓"}', false, 16),
('ed-hormobiota-2027', 'Naming del puente', '{"pop-up":"—","conexion":"—","protagonista":"✓"}', false, 17),
('ed-hormobiota-2027', 'Visibilidad digital extendida', '{"pop-up":"—","conexion":"—","protagonista":"3–6 meses"}', false, 18),
('ed-hormobiota-2027', 'Exclusividad por puente', '{"pop-up":"—","conexion":"—","protagonista":"✓"}', false, 19),
('ed-hormobiota-2027', 'Disponibilidad', '{"pop-up":"Máximo 5 estaciones","conexion":"Limitada","protagonista":"6 cupos · 1 por puente"}', false, 20);

-- =========================================================
-- bridge_sponsorships — inventario base, sin empresa asignada
-- (los mocks asignaban company_id de compañías demo que NO se siembran)
-- =========================================================

insert into bridge_sponsorships (track_id, company_id, status) values
('puente-1', null, 'disponible'),
('puente-2', null, 'disponible'),
('puente-3', null, 'disponible'),
('puente-4', null, 'disponible'),
('puente-5', null, 'disponible'),
('puente-6', null, 'disponible');

-- =========================================================
-- speakers (uuid explícitos para poder enlazarlos en agenda_item_speakers)
-- =========================================================

insert into speakers (id, edition_id, slot_label, name, specialty, role, institution, country, city, bio, talks, track_id, order_num, featured, status) values
('00000000-0000-4000-8000-000000000001', 'ed-hormobiota-2027', 'Puente 1 · Conferencia de apertura', 'PENDIENTE', 'Gastroenterología', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', array['Microbiota como origen y cimiento'], 'puente-1', 1, true, 'en-negociacion'),
('00000000-0000-4000-8000-000000000002', 'ed-hormobiota-2027', 'Puente 2 · Conferencia central', 'PENDIENTE', 'Endocrinología', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', array['Del intestino a la señal endocrina'], 'puente-2', 2, true, 'en-negociacion'),
('00000000-0000-4000-8000-000000000003', 'ed-hormobiota-2027', 'Puente 3 · Conferencia central', 'PENDIENTE', 'Inmunología / Medicina deportiva', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', array['Inmunidad y músculo: las dos caras de la resiliencia'], 'puente-3', 3, false, 'invitado'),
('00000000-0000-4000-8000-000000000004', 'ed-hormobiota-2027', 'Puente 4 · Conferencia central', 'PENDIENTE', 'Neurología / Medicina del sueño', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', array['Sueño, reparación y neuroinflamación'], 'puente-4', 4, false, 'invitado'),
('00000000-0000-4000-8000-000000000005', 'ed-hormobiota-2027', 'Puente 5 · Conferencia central', 'PENDIENTE', 'Nutrición clínica / Longevidad', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', array['Biomarcadores, nutrición y sarcopenia'], 'puente-5', 5, true, 'en-negociacion'),
('00000000-0000-4000-8000-000000000006', 'ed-hormobiota-2027', 'Puente 6 · Conferencia central', 'PENDIENTE', 'Dermatología integrativa', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', array['Eje intestino-piel'], 'puente-6', 6, false, 'invitado'),
('00000000-0000-4000-8000-000000000007', 'ed-hormobiota-2027', 'Panel magistral día 1 · moderación', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', array['Los puentes internos'], null, 7, false, 'invitado'),
('00000000-0000-4000-8000-000000000008', 'ed-hormobiota-2027', 'Speaker patrocinado (inventario comercial)', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', array['PENDIENTE'], 'puente-5', 8, false, 'invitado'),
('00000000-0000-4000-8000-000000000009', 'ed-hormobiota-2026', 'Conferencia de apertura 2026', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', array['PENDIENTE'], null, 1, false, 'invitado'),
('00000000-0000-4000-8000-000000000010', 'ed-hormobiota-2026', 'Cierre magistral 2026', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'PENDIENTE', array['PENDIENTE'], null, 2, false, 'invitado');

-- =========================================================
-- agenda_items (uuid explícitos) + agenda_item_speakers
-- =========================================================

insert into agenda_items (id, edition_id, day, day_label, day_concept, date, start_time, end_time, title, description, type, track_id, room, order_num, visible, status) values
('00000000-0000-4000-9000-000000000001', 'ed-hormobiota-2027', 1, 'Viernes 23 de abril', 'Los puentes internos', '2027-04-23', 'PENDIENTE', 'PENDIENTE', 'Registro y acreditación', 'Entrega de credenciales y acceso al auditorio.', 'registro', null, 'Auditorio Forum', 1, true, 'borrador'),
('00000000-0000-4000-9000-000000000002', 'ed-hormobiota-2027', 1, 'Viernes 23 de abril', 'Los puentes internos', '2027-04-23', 'PENDIENTE', 'PENDIENTE', 'Apertura · Los puentes internos', 'Presentación del concepto de la edición: la medicina como red, no como órganos aislados.', 'keynote', null, 'Auditorio Forum', 2, true, 'borrador'),
('00000000-0000-4000-9000-000000000003', 'ed-hormobiota-2027', 1, 'Viernes 23 de abril', 'Los puentes internos', '2027-04-23', 'PENDIENTE', 'PENDIENTE', 'Puente 1 · Sistema gastrointestinal', 'Microbiota como origen y cimiento de la red.', 'conferencia', 'puente-1', 'Auditorio Forum', 3, true, 'borrador'),
('00000000-0000-4000-9000-000000000004', 'ed-hormobiota-2027', 1, 'Viernes 23 de abril', 'Los puentes internos', '2027-04-23', 'PENDIENTE', 'PENDIENTE', 'Coffee break', 'Espacio de industria y networking.', 'break', null, 'Auditorio Forum', 4, true, 'borrador'),
('00000000-0000-4000-9000-000000000005', 'ed-hormobiota-2027', 1, 'Viernes 23 de abril', 'Los puentes internos', '2027-04-23', 'PENDIENTE', 'PENDIENTE', 'Puente 2 · Metabolismo y hormonas', 'Del intestino a la señal endocrina.', 'conferencia', 'puente-2', 'Auditorio Forum', 5, true, 'borrador'),
('00000000-0000-4000-9000-000000000006', 'ed-hormobiota-2027', 1, 'Viernes 23 de abril', 'Los puentes internos', '2027-04-23', 'PENDIENTE', 'PENDIENTE', 'Almuerzo dialogado', 'Mesas por puente de interés para conversación dirigida.', 'almuerzo', null, 'Auditorio Forum', 6, true, 'borrador'),
('00000000-0000-4000-9000-000000000007', 'ed-hormobiota-2027', 1, 'Viernes 23 de abril', 'Los puentes internos', '2027-04-23', 'PENDIENTE', 'PENDIENTE', 'Puente 3 · Inmunidad y sistema musculoesquelético', 'Las dos caras de la resiliencia.', 'conferencia', 'puente-3', 'Auditorio Forum', 7, true, 'borrador'),
('00000000-0000-4000-9000-000000000008', 'ed-hormobiota-2027', 1, 'Viernes 23 de abril', 'Los puentes internos', '2027-04-23', 'PENDIENTE', 'PENDIENTE', 'Coffee break', 'Espacio de industria y networking.', 'break', null, 'Auditorio Forum', 8, true, 'borrador'),
('00000000-0000-4000-9000-000000000009', 'ed-hormobiota-2027', 1, 'Viernes 23 de abril', 'Los puentes internos', '2027-04-23', 'PENDIENTE', 'PENDIENTE', 'Puente 4 · Sueño y neuroinflamación', 'Reparación y regulación.', 'conferencia', 'puente-4', 'Auditorio Forum', 9, true, 'borrador'),
('00000000-0000-4000-9000-000000000010', 'ed-hormobiota-2027', 1, 'Viernes 23 de abril', 'Los puentes internos', '2027-04-23', 'PENDIENTE', 'PENDIENTE', 'Panel magistral', 'Conversación entre los ponentes de los cuatro primeros puentes.', 'panel', null, 'Auditorio Forum', 10, true, 'borrador'),
('00000000-0000-4000-9000-000000000011', 'ed-hormobiota-2027', 1, 'Viernes 23 de abril', 'Los puentes internos', '2027-04-23', 'PENDIENTE', 'PENDIENTE', 'Cóctel de networking', 'Cierre del día 1 con la industria participante.', 'coctel', null, 'Auditorio Forum', 11, true, 'borrador'),
('00000000-0000-4000-9000-000000000012', 'ed-hormobiota-2027', 2, 'Sábado 24 de abril', 'Los puentes de destino', '2027-04-24', 'PENDIENTE', 'PENDIENTE', 'Registro', 'Acceso y acreditación del segundo día.', 'registro', null, 'Auditorio Forum', 1, true, 'borrador'),
('00000000-0000-4000-9000-000000000013', 'ed-hormobiota-2027', 2, 'Sábado 24 de abril', 'Los puentes de destino', '2027-04-24', 'PENDIENTE', 'PENDIENTE', 'Apertura · Los puentes de destino', 'Enlace entre los puentes internos y la expresión clínica visible.', 'keynote', null, 'Auditorio Forum', 2, true, 'borrador'),
('00000000-0000-4000-9000-000000000014', 'ed-hormobiota-2027', 2, 'Sábado 24 de abril', 'Los puentes de destino', '2027-04-24', 'PENDIENTE', 'PENDIENTE', 'Puente 5 · Longevidad celular', 'Nutrición, biomarcadores, activación celular y sarcopenia.', 'conferencia', 'puente-5', 'Auditorio Forum', 3, true, 'borrador'),
('00000000-0000-4000-9000-000000000015', 'ed-hormobiota-2027', 2, 'Sábado 24 de abril', 'Los puentes de destino', '2027-04-24', 'PENDIENTE', 'PENDIENTE', 'Coffee break', 'Espacio de industria y networking.', 'break', null, 'Auditorio Forum', 4, true, 'borrador'),
('00000000-0000-4000-9000-000000000016', 'ed-hormobiota-2027', 2, 'Sábado 24 de abril', 'Los puentes de destino', '2027-04-24', 'PENDIENTE', 'PENDIENTE', 'Puente 6 · Piel', 'Eje intestino-piel, dermatología integrativa, medicina estética y regenerativa.', 'conferencia', 'puente-6', 'Auditorio Forum', 5, true, 'borrador'),
('00000000-0000-4000-9000-000000000017', 'ed-hormobiota-2027', 2, 'Sábado 24 de abril', 'Los puentes de destino', '2027-04-24', 'PENDIENTE', 'PENDIENTE', 'Panel integrador', 'Los seis puentes leídos como una sola red.', 'panel', null, 'Auditorio Forum', 6, true, 'borrador'),
('00000000-0000-4000-9000-000000000018', 'ed-hormobiota-2027', 2, 'Sábado 24 de abril', 'Los puentes de destino', '2027-04-24', 'PENDIENTE', 'PENDIENTE', 'Cierre magistral', 'Conferencia de cierre académico.', 'keynote', null, 'Auditorio Forum', 7, true, 'borrador'),
('00000000-0000-4000-9000-000000000019', 'ed-hormobiota-2027', 2, 'Sábado 24 de abril', 'Los puentes de destino', '2027-04-24', 'PENDIENTE', 'PENDIENTE', 'Cierre protocolario', 'Certificados, agradecimientos y próxima edición.', 'cierre', null, 'Auditorio Forum', 8, true, 'borrador'),
('00000000-0000-4000-9000-000000000020', 'ed-hormobiota-2026', 1, 'Viernes 17 de abril de 2026', 'Microbiota y sistema endocrino', '2026-04-17', 'PENDIENTE', 'PENDIENTE', 'Programa día 1', 'Detalle del programa ejecutado: PENDIENTE en el archivo histórico.', 'conferencia', null, 'PENDIENTE', 1, true, 'aprobado'),
('00000000-0000-4000-9000-000000000021', 'ed-hormobiota-2026', 2, 'Sábado 18 de abril de 2026', 'Salud metabólica', '2026-04-18', 'PENDIENTE', 'PENDIENTE', 'Programa día 2', 'Detalle del programa ejecutado: PENDIENTE en el archivo histórico.', 'conferencia', null, 'PENDIENTE', 1, true, 'aprobado');

insert into agenda_item_speakers (agenda_item_id, speaker_id) values
('00000000-0000-4000-9000-000000000003', '00000000-0000-4000-8000-000000000001'),
('00000000-0000-4000-9000-000000000005', '00000000-0000-4000-8000-000000000002'),
('00000000-0000-4000-9000-000000000007', '00000000-0000-4000-8000-000000000003'),
('00000000-0000-4000-9000-000000000009', '00000000-0000-4000-8000-000000000004'),
('00000000-0000-4000-9000-000000000010', '00000000-0000-4000-8000-000000000007'),
('00000000-0000-4000-9000-000000000014', '00000000-0000-4000-8000-000000000005'),
('00000000-0000-4000-9000-000000000016', '00000000-0000-4000-8000-000000000006'),
('00000000-0000-4000-9000-000000000020', '00000000-0000-4000-8000-000000000009'),
('00000000-0000-4000-9000-000000000021', '00000000-0000-4000-8000-000000000010');

-- =========================================================
-- faq_items
-- =========================================================

insert into faq_items (edition_id, question, answer, order_num, visible) values
('ed-hormobiota-2027', '¿Cuándo y dónde es Hormobiota 2?', 'El 23 y 24 de abril de 2027 en el Auditorio Forum de la UPB, Medellín, Colombia. El detalle de accesos y parqueaderos es PENDIENTE.', 1, true),
('ed-hormobiota-2027', '¿Cuánto cuesta la inscripción?', 'Las tarifas están en revisión. Puedes dejar tus datos en la lista de preventa y te avisamos en el momento en que se publiquen, antes de la apertura general.', 2, true),
('ed-hormobiota-2027', '¿El congreso otorga certificación?', 'Sí, se entrega certificado de asistencia. La entidad certificadora y el número de horas académicas son PENDIENTE.', 3, true),
('ed-hormobiota-2027', '¿Qué es la Ruta Hormobiota?', 'Una experiencia previa de 21 días con contenido diario asociado a los seis puentes, comunidad y guía descargable. Se entrega por WhatsApp y correo, sin plataforma adicional.', 4, true),
('ed-hormobiota-2027', '¿Hay modalidad virtual?', 'La primera versión del evento es presencial. Modalidad virtual o híbrida: PENDIENTE.', 5, true),
('ed-hormobiota-2027', '¿Tienen hoteles o tarifas para viajeros?', 'Hoteles aliados y tarifas preferenciales: PENDIENTE.', 6, true),
('ed-hormobiota-2027', '¿Cómo se selecciona a los speakers?', 'El comité académico revisa cada propuesta y la asigna a un puente. Solo publicamos speakers confirmados, nunca invitaciones en curso.', 7, true),
('ed-hormobiota-2027', '¿Cómo participa una empresa?', 'Con paquetes de patrocinio, stand o activaciones. Solicita la propuesta y el equipo comercial te comparte disponibilidad e inventario real de la edición.', 8, true);

-- =========================================================
-- tickets (id se deja en default gen_random_uuid(), no se referencia
-- desde ninguna otra tabla del seed)
-- =========================================================

insert into tickets (edition_id, name, kind, modality, price, vat_rate, quota, sold, start_date, end_date, benefits, status, visible, wompi_enabled, emits_qr) values
('ed-hormobiota-2027', 'Preventa', 'preventa', 'presencial', null, 0.19, 120, 0, '2026-09-01', '2026-12-15', array['Acceso a los dos días del congreso','Ruta Hormobiota (21 días previos)','Memorias digitales','Cóctel de networking'], 'en-revision', true, true, true),
('ed-hormobiota-2027', 'General presencial', 'general', 'presencial', null, 0.19, 400, 0, '2026-12-16', '2027-04-22', array['Acceso a los dos días del congreso','Memorias digitales','Certificado de asistencia'], 'en-revision', true, true, true),
('ed-hormobiota-2027', 'Estudiante', 'estudiante', 'presencial', null, 0.19, 60, 0, '2026-09-01', '2027-04-22', array['Acceso a los dos días','Requiere certificado de estudio vigente'], 'borrador', true, true, true),
('ed-hormobiota-2027', 'Grupo institucional (desde 5)', 'grupo', 'presencial', null, 0.19, 100, 0, '2026-09-01', '2027-04-15', array['Tarifa por grupo','Facturación institucional','Gestión de asistentes por un responsable'], 'borrador', false, false, true),
('ed-hormobiota-2027', 'Cortesía patrocinador', 'patrocinador', 'presencial', 0, 0, 40, 0, '2026-09-01', '2027-04-22', array['Entradas incluidas en el paquete de patrocinio'], 'aprobado', false, false, true);

-- =========================================================
-- stands (todas en 'disponible'/sin company_id: el mapa físico es real,
-- las asignaciones de venta se reconstruirán con empresas reales)
-- =========================================================

insert into stands (edition_id, number, category, location, size, status, benefits, plan_col, plan_row, plan_w, plan_h) values
('ed-hormobiota-2027', '01', 'Stand', 'Frente al pasillo central', '3 × 2 m', 'disponible', array['3 × 2 m','Cabecera del recinto','Energía y mesa'], 1, 1, 3, 2),
('ed-hormobiota-2027', '02', 'Stand', 'Frente al pasillo central', '3 × 2 m', 'disponible', array['3 × 2 m','Cabecera del recinto'], 4, 1, 3, 2),
('ed-hormobiota-2027', '03', 'Stand', 'Frente al pasillo central', '3 × 2 m', 'disponible', array['3 × 2 m','Cabecera del recinto'], 7, 1, 3, 2),
('ed-hormobiota-2027', '04', 'Stand', 'Frente al pasillo central', '3 × 2 m', 'disponible', array['3 × 2 m','Esquina superior derecha'], 10, 1, 3, 2),
('ed-hormobiota-2027', '05', 'Stand', 'Ala izquierda', '3 × 2 m', 'disponible', array['3 × 2 m','Energía y mesa'], 1, 3, 3, 2),
('ed-hormobiota-2027', '06', 'Stand', 'Ala izquierda', '3 × 2 m', 'disponible', array['3 × 2 m','Energía y mesa'], 1, 5, 3, 2),
('ed-hormobiota-2027', '07', 'Stand', 'Ala izquierda', '3 × 2 m', 'disponible', array['3 × 2 m','Junto a networking'], 1, 7, 3, 2),
('ed-hormobiota-2027', '08', 'Stand', 'Ala derecha', '3 × 2 m', 'disponible', array['3 × 2 m','Energía y mesa'], 10, 3, 3, 2),
('ed-hormobiota-2027', '09', 'Stand', 'Ala derecha', '3 × 2 m', 'bloqueado', array['Reservado por logística'], 10, 5, 3, 2),
('ed-hormobiota-2027', '10', 'Stand', 'Ala derecha', '3 × 2 m', 'disponible', array['3 × 2 m','Junto a networking'], 10, 7, 3, 2),
('ed-hormobiota-2027', '11', 'Stand', 'Junto al acceso principal', '3 × 2 m', 'disponible', array['3 × 2 m','Primer contacto al ingresar'], 1, 9, 3, 2),
('ed-hormobiota-2027', '12', 'Stand', 'Junto al acceso principal', '3 × 2 m', 'disponible', array['3 × 2 m','Primer contacto al ingresar'], 10, 9, 3, 2),
('ed-hormobiota-2027', 'P1', 'Pop Up', 'Costado de exhibición', 'Mesa + 2 sillas', 'disponible', array['1 mesa y 2 sillas','Espacio para 1 pendón'], 14, 2, 3, 1),
('ed-hormobiota-2027', 'P2', 'Pop Up', 'Costado de exhibición', 'Mesa + 2 sillas', 'disponible', array['1 mesa y 2 sillas','Espacio para 1 pendón'], 14, 3, 3, 1),
('ed-hormobiota-2027', 'P3', 'Pop Up', 'Costado de exhibición', 'Mesa + 2 sillas', 'disponible', array['1 mesa y 2 sillas','Espacio para 1 pendón'], 14, 4, 3, 1),
('ed-hormobiota-2027', 'P4', 'Pop Up', 'Costado de exhibición', 'Mesa + 2 sillas', 'disponible', array['1 mesa y 2 sillas','Espacio para 1 pendón'], 14, 5, 3, 1),
('ed-hormobiota-2027', 'P5', 'Pop Up', 'Costado de exhibición', 'Mesa + 2 sillas', 'disponible', array['1 mesa y 2 sillas','Espacio para 1 pendón'], 14, 6, 3, 1);

-- =========================================================
-- plan_features — elementos fijos del plano
-- =========================================================

insert into plan_features (edition_id, label, kind, plan_col, plan_row, plan_w, plan_h) values
('ed-hormobiota-2027', 'Pasillo de circulación', 'circulacion', 4, 3, 6, 4),
('ed-hormobiota-2027', 'Auditorio Forum', 'tarima', 4, 7, 6, 2),
('ed-hormobiota-2027', 'Acceso principal', 'acceso', 4, 9, 6, 2),
('ed-hormobiota-2027', 'Zona Pop Up', 'circulacion', 14, 1, 3, 1),
('ed-hormobiota-2027', 'Zona coffee', 'servicio', 14, 8, 3, 3);

-- =========================================================
-- sponsor_banner_configs — solo la config (banner_slots requiere
-- companies reales, se deja vacío)
-- =========================================================

insert into sponsor_banner_configs (edition_id, enabled, heading_label, surfaces, desktop_speed_seconds, mobile_speed_seconds, mobile_enabled, collapsible) values
('ed-hormobiota-2027', true, 'Con el apoyo de', array['evento','corporativo']::banner_surface[], 30, 22, true, true);

-- =========================================================
-- content_items
-- =========================================================

insert into content_items (kind, title, excerpt, edition_id, track_id, author, date, reading_time, status) values
('articulo', 'La medicina que dejó de mirar órganos aislados', 'Por qué el enfoque de redes cambia la manera de leer un paciente y qué significa para la práctica clínica diaria.', 'ed-hormobiota-2027', null, 'Comité académico', '2026-08-12', '6 min', 'publicado'),
('articulo', 'Del intestino a la señal endocrina: qué sabemos hoy', 'Una introducción al segundo puente de Hormobiota 2 y a la evidencia que lo sostiene.', 'ed-hormobiota-2027', 'puente-2', 'Comité académico', '2026-08-05', '8 min', 'publicado'),
('memoria', 'Memorias Hormobiota 2026', 'Resumen de la primera edición: conclusiones, materiales y registro fotográfico.', 'ed-hormobiota-2026', null, 'Eventos Médicos LATAM', '2026-05-10', 'PENDIENTE', 'en-revision'),
('entrevista', 'Entrevista · eje intestino-piel', 'Conversación sobre dermatología integrativa y microbiota. Publicación programada.', 'ed-hormobiota-2027', 'puente-6', 'PENDIENTE', '2026-09-01', '12 min', 'borrador'),
('recurso', 'Guía Ruta Hormobiota (PDF)', 'Guía descargable que acompaña los 21 días previos al congreso.', 'ed-hormobiota-2027', null, 'Eventos Médicos LATAM', '2026-08-01', 'PDF', 'aprobado'),
('video', 'Qué es Hormobiota en 90 segundos', 'Presentación breve del concepto de la familia de eventos.', null, null, 'Eventos Médicos LATAM', '2026-07-22', '1:30', 'publicado');

-- =========================================================
-- allies (uuid explícitos para ally_editions) + ally_editions
-- =========================================================

insert into allies (id, name, role, web, description, status) values
('00000000-0000-4000-a000-000000000001', 'Eventos Médicos LATAM', 'organizador', 'PENDIENTE', 'Organizador y operador del congreso.', 'publicado'),
('00000000-0000-4000-a000-000000000002', 'PENDIENTE · entidad certificadora', 'certificador', 'PENDIENTE', 'Certificación académica del congreso en definición.', 'en-revision'),
('00000000-0000-4000-a000-000000000003', 'PENDIENTE · sociedad médica', 'sociedad-medica', 'PENDIENTE', 'Aval de sociedad médica en conversación.', 'borrador'),
('00000000-0000-4000-a000-000000000004', 'PENDIENTE · aliado académico', 'aliado-academico', 'PENDIENTE', 'Universidad o institución académica en conversación.', 'borrador'),
('00000000-0000-4000-a000-000000000005', 'Universidad Pontificia Bolivariana', 'aliado-institucional', 'PENDIENTE', 'Sede del congreso: Auditorio Forum, UPB Medellín. Alcance de la alianza: PENDIENTE.', 'en-revision'),
('00000000-0000-4000-a000-000000000006', 'PENDIENTE · media partner', 'media-partner', 'PENDIENTE', 'Difusión en medios especializados.', 'borrador');

insert into ally_editions (ally_id, edition_id) values
('00000000-0000-4000-a000-000000000001', 'ed-hormobiota-2026'),
('00000000-0000-4000-a000-000000000001', 'ed-hormobiota-2027'),
('00000000-0000-4000-a000-000000000002', 'ed-hormobiota-2027'),
('00000000-0000-4000-a000-000000000003', 'ed-hormobiota-2027'),
('00000000-0000-4000-a000-000000000004', 'ed-hormobiota-2027'),
('00000000-0000-4000-a000-000000000005', 'ed-hormobiota-2027'),
('00000000-0000-4000-a000-000000000006', 'ed-hormobiota-2027');

-- =========================================================
-- secondary_events
-- =========================================================

insert into secondary_events (title, kind, date, time, duration_minutes, speaker_label, modality, price, seats, registered, related_edition_id, track_id, platform, description, crm_tag, status) values
('Microbiota y salud metabólica', 'webinar', '2026-09-18', '19:00', 60, 'PENDIENTE', 'virtual', 0, 500, 312, 'ed-hormobiota-2027', 'puente-1', 'Sala virtual (enlace por correo y WhatsApp)', 'Qué dice la evidencia actual sobre el eje intestino-metabolismo y cómo traducirlo a decisiones de consulta.', 'webinar-microbiota-sep26', 'publicado'),
('Eje intestino-hormona en la práctica clínica', 'conversatorio', '2026-09-30', '19:30', 75, 'PENDIENTE', 'virtual', 0, 400, 168, 'ed-hormobiota-2027', 'puente-2', 'Sala virtual (enlace por correo y WhatsApp)', 'Conversación abierta entre especialistas sobre casos reales, con preguntas del público en vivo.', 'conversatorio-intestino-hormona-sep26', 'publicado'),
('Sueño y neuroinflamación', 'conversatorio', '2026-10-16', '19:00', 75, 'PENDIENTE', 'virtual', 0, 300, 94, 'ed-hormobiota-2027', 'puente-4', 'Sala virtual (enlace por correo y WhatsApp)', 'Cómo la arquitectura del sueño modula la inflamación y qué se puede intervenir realmente.', 'conversatorio-sueno-oct26', 'publicado'),
('Inmunidad, músculo y envejecimiento', 'webinar', '2026-10-29', '19:00', 60, 'PENDIENTE', 'virtual', 0, 500, 41, 'ed-hormobiota-2027', 'puente-3', 'Sala virtual (enlace por correo y WhatsApp)', 'El músculo como órgano inmunometabólico: implicaciones para el paciente que envejece.', 'webinar-inmunidad-oct26', 'aprobado'),
('Biomarcadores de longevidad', 'masterclass', '2026-11-20', 'PENDIENTE', 180, 'PENDIENTE', 'hibrido', null, null, 0, 'ed-hormobiota-2027', 'puente-5', 'PENDIENTE', 'Sesión práctica de tres horas sobre interpretación de biomarcadores. Cupo reducido, con taller.', 'masterclass-longevidad-nov26', 'aprobado'),
('Piel como espejo metabólico', 'webinar', '2026-12-10', '19:00', 60, 'PENDIENTE', 'virtual', 0, 500, 0, 'ed-hormobiota-2027', 'puente-6', 'Sala virtual (enlace por correo y WhatsApp)', 'Manifestaciones cutáneas de la disfunción metabólica y hormonal.', 'webinar-piel-dic26', 'aprobado'),
('Apertura de la Ruta Hormobiota', 'lanzamiento', '2027-04-02', '19:00', 45, 'PENDIENTE', 'virtual', 0, 1000, 0, 'ed-hormobiota-2027', null, 'Sala virtual (enlace por correo y WhatsApp)', 'Sesión inaugural de la experiencia de 21 días previa al congreso. Abierta a todos los inscritos.', 'lanzamiento-ruta-abr27', 'aprobado');

-- =========================================================
-- info_products
-- =========================================================

insert into info_products (name, kind, format, claim, description, price, vat_rate, volume_label, includes, related_edition_id, track_id, status, featured) values
('Memorias Hormobiota 2026', 'memorias', 'mixto', 'Las 14 conferencias de la primera edición, con material de apoyo', 'Acceso completo a las grabaciones de la primera edición, presentaciones de los speakers y documento de conclusiones del comité académico.', 189000, 0.19, '14 conferencias · 11 h', array['Grabaciones en calidad completa','Presentaciones descargables','Documento de conclusiones','Acceso por 12 meses'], 'ed-hormobiota-2026', null, 'publicado', true),
('Microbiota aplicada a la consulta', 'curso', 'video', 'Curso corto para traducir la evidencia a decisiones clínicas', 'Seis módulos que recorren la interpretación de estudios de microbiota y su aplicación en decisiones de consulta, con casos comentados.', 320000, 0.19, '6 módulos · 4 h', array['Seis módulos en video','Casos clínicos comentados','Certificado de participación','Acceso por 12 meses'], null, 'puente-1', 'publicado', true),
('Guía de biomarcadores de longevidad', 'guia', 'pdf', 'Referencia rápida de interpretación, en una sola pieza', 'Documento de consulta con los biomarcadores más usados, rangos de referencia y criterios de interpretación en el contexto de longevidad.', 89000, 0.19, '48 páginas', array['PDF de alta resolución','Tabla de rangos imprimible','Actualizaciones incluidas'], null, 'puente-5', 'publicado', false),
('Membresía Comunidad Hormobiota', 'membresia', 'acceso', 'Todo el contenido, las sesiones en vivo y preventa en los congresos', 'Acceso anual a la biblioteca completa, a todas las sesiones en línea con material descargable y a la preventa de cada edición.', null, 0.19, 'Acceso anual', array['Biblioteca completa de memorias','Sesiones en vivo con material','Preventa en cada congreso','Comunidad privada'], null, null, 'aprobado', false),
('Protocolos de consulta integrativa', 'plantilla', 'pdf', 'Formatos listos para estructurar la primera consulta', 'Conjunto de formatos editables para anamnesis, seguimiento y plan de intervención en consulta integrativa.', 129000, 0.19, '9 formatos', array['Formatos editables','Guía de uso','Ejemplos diligenciados'], null, null, 'publicado', false);

-- =========================================================
-- upcoming_products (singleton)
-- =========================================================

insert into upcoming_products (id, name, category, claim, description, pillars, stage, launch_window, pioneers, status) values (
  1, 'Hormobiota Fórmula', 'Suplemento de vitaminas y soporte hormonal', 'La ciencia del congreso, ahora en una fórmula',
  array[
    'Un suplemento desarrollado desde el mismo marco académico que sostiene Hormobiota: la relación entre microbiota, señal hormonal y longevidad celular.',
    'La formulación está en desarrollo junto al comité científico. No se publica composición ni claim clínico hasta que el respaldo esté completo y el registro sanitario en trámite.'
  ],
  '[
    {"id":"pl-1","title":"Eje intestino-hormona","description":"Soporte del terreno intestinal como punto de partida de la señal endocrina.","icon":"gut"},
    {"id":"pl-2","title":"Micronutrientes clave","description":"Vitaminas y minerales con función documentada en la regulación hormonal.","icon":"hormone"},
    {"id":"pl-3","title":"Longevidad celular","description":"Componentes orientados a la función mitocondrial y al estrés oxidativo.","icon":"cell"}
  ]'::jsonb,
  'formulacion', 'PENDIENTE', 214, 'publicado'
);

-- =========================================================
-- organization_profile (singleton) + organization_metrics
-- =========================================================

insert into organization_profile (id, name, legal_name, city, country, claim, value_proposition, description, focus, contact_email, contact_whatsapp) values (
  1, 'Eventos Médicos LATAM', 'PENDIENTE · razón social', 'Medellín', 'Colombia',
  'Educación médica continua que conecta especialidades',
  'Diseñamos y operamos congresos, cursos y experiencias académicas para profesionales de la salud en Latinoamérica.',
  array[
    'Eventos Médicos LATAM es una organización con sede en Medellín dedicada a la educación médica continua: congresos, cursos, webinars, masterclass y conversatorios para profesionales de la salud.',
    'Cada evento se construye con criterio académico y operación profesional: comité de contenido, speakers, certificación, experiencia del asistente y relación con la industria.',
    'Nuestros eventos no son piezas aisladas. Funcionan como familias que vuelven año tras año, con comunidad, contenido y memoria propia.'
  ],
  array[
    'Programa académico con criterio clínico, no comercial',
    'Experiencia del asistente antes, durante y después del evento',
    'Relación de largo plazo con sociedades médicas y universidades',
    'Operación medible para las empresas que participan'
  ],
  'PENDIENTE', 'PENDIENTE'
);

insert into organization_metrics (label, value, note, status, order_num) values
('Eventos realizados', 'PENDIENTE', 'Se publica cuando el equipo confirme el histórico completo.', 'borrador', 1),
('Profesionales asistentes', 'PENDIENTE', 'Consolidado de registros por edición.', 'borrador', 2),
('Comunidad médica', 'PENDIENTE', 'Contactos con consentimiento vigente en GoHighLevel.', 'borrador', 3),
('Sede principal', 'Medellín, Colombia', 'Dato corporativo confirmado.', 'publicado', 4),
('Familias de eventos', '1 activa', 'Hormobiota. Otras familias se suman sin rehacer la plataforma.', 'publicado', 5),
('Proyección', 'Nacional e internacional', 'Speakers y aliados de la región.', 'publicado', 6);

-- =========================================================
-- legacy_events — trayectoria institucional
-- =========================================================

insert into legacy_events (id, order_num, year, topic, name, claim, description, highlights, image, tone_var, href, status, attendees) values
('leg-inflamacion', 1, 2022, 'Inflamación', 'Inflamación', 'El origen silencioso de la enfermedad crónica', 'La primera edición puso la inflamación de bajo grado en el centro de la conversación clínica: cómo se mide, cómo se sostiene en el tiempo y por qué explica buena parte de lo que vemos en consulta.', array['Inflamación de bajo grado','Marcadores en consulta','Abordaje multidisciplinario'], '/8ab2f475-596c-4a26-9a03-0206a8452934.jpg', 'var(--tone-inflamacion)', '/nosotros', 'realizado', 210),
('leg-obesidad', 2, 2023, 'Obesidad', 'Obesidad', 'De la balanza al metabolismo', 'La segunda edición desmontó la lectura simplista del peso y llevó la discusión al terreno metabólico y endocrino, con énfasis en el tejido adiposo como órgano activo.', array['Tejido adiposo como órgano','Resistencia a la insulina','Manejo farmacológico actual'], '/5f6a8ad7-b03b-413f-96d7-92781dd38f59.jpg', 'var(--tone-obesidad)', '/nosotros', 'realizado', 280),
('leg-longevidad', 3, 2024, 'Longevidad', 'Longevidad', 'Vivir más y vivir mejor no son lo mismo', 'La tercera edición separó expectativa de vida de calidad de vida, y trajo la evidencia sobre envejecimiento celular, biomarcadores y las intervenciones que hoy sí tienen respaldo.', array['Envejecimiento celular','Biomarcadores de longevidad','Intervenciones con evidencia'], '/632f8133-7202-4a3e-ba59-4ac84cd8e320.jpg', 'var(--tone-longevidad)', '/nosotros', 'realizado', 340),
('leg-hormobiota-1', 4, 2026, 'Hormobiota', 'Hormobiota', 'Donde se unen las hormonas con la microbiota', 'La cuarta edición conectó los tres temas anteriores en una sola tesis: el diálogo entre microbiota y sistema endocrino. Ahí nació Hormobiota como marca propia y como línea académica permanente.', array['Eje intestino-hormona','Nace la marca Hormobiota','Primera comunidad propia'], '/e0e49db4-ac80-4ea1-b8bd-2da97c634488.jpg', 'var(--tone-hormobiota)', '/hormobiota', 'realizado', 420),
('leg-hormobiota-2', 5, 2027, 'Hormobiota 2', 'Hormobiota 2', 'El puente: del intestino a la longevidad', 'La quinta edición amplía la tesis a seis puentes que recorren el cuerpo como una red: intestino, hormonas, inmunidad y músculo, sueño, longevidad celular y piel.', array['Los seis puentes','Dos días de programa','Auditorio Forum UPB, Medellín'], '/d4f3ab70-d106-434e-a5aa-86a250795de7.jpg', 'var(--tone-hormobiota)', '/eventos/hormobiota/hormobiota-2-2027', 'proximo', null);

-- =========================================================
-- legal_documents (updated_at se deja en su default now())
-- =========================================================

insert into legal_documents (title, summary, status, body) values
('Política de tratamiento de datos y Habeas Data', 'Cómo recolectamos, usamos y protegemos los datos personales de asistentes y contactos.', 'en-revision', array[
  'Eventos Médicos LATAM opera en Colombia y trata datos personales conforme a la Ley 1581 de 2012 y sus decretos reglamentarios.',
  'El titular autoriza el tratamiento de sus datos con una finalidad específica: gestión de su inscripción, entrega de información académica del evento y, cuando lo autorice de forma separada, comunicaciones comerciales.',
  'Los datos de asistentes no se comparten automáticamente con patrocinadores. Cualquier entrega de información depende del consentimiento expreso del titular y de la finalidad autorizada.',
  'El titular puede conocer, actualizar, rectificar y suprimir sus datos, y revocar la autorización, escribiendo al canal de contacto oficial. Responsable del tratamiento: PENDIENTE.'
]),
('Términos y condiciones', 'Condiciones de uso de la plataforma y de participación en los eventos.', 'borrador', array[
  'El uso de esta plataforma implica la aceptación de estos términos.',
  'La programación académica, los speakers y los horarios pueden ajustarse por razones de fuerza mayor. Los cambios se comunican por los canales registrados.',
  'Contenido restante: PENDIENTE de revisión legal.'
]),
('Política de compra y reembolsos', 'Condiciones de pago, cesión de entradas y devoluciones.', 'borrador', array[
  'Los pagos se procesan a través de Wompi. La confirmación del registro depende de la aprobación de la transacción.',
  'Condiciones de reembolso, plazos y cesión de entradas: PENDIENTE de aprobación.'
]),
('Consentimiento de comunicaciones', 'Autorización separada para recibir información comercial y académica.', 'en-revision', array[
  'El consentimiento para comunicaciones comerciales se solicita de forma separada del consentimiento de tratamiento de datos.',
  'El titular puede retirar su autorización en cualquier momento desde el enlace incluido en cada comunicación.'
]);

-- =========================================================
-- seo_records
-- =========================================================

insert into seo_records (scope, meta_title, meta_description, slug, og_image, canonical, indexable, schema) values
('Home corporativa', 'Eventos Médicos LATAM · Educación médica continua', 'Congresos, cursos y experiencias académicas para profesionales de la salud en Latinoamérica.', '/', 'PENDIENTE', 'PENDIENTE', true, 'Organization'),
('Hormobiota 2 · 2027', 'Hormobiota 2 · El puente: del intestino a la longevidad', '23 y 24 de abril de 2027, Auditorio Forum UPB Medellín.', '/eventos/hormobiota/hormobiota-2-2027', 'PENDIENTE', 'PENDIENTE', true, 'Event'),
('Hormobiota 2026', 'Hormobiota 2026 · Evento realizado', 'Archivo histórico de la primera edición de Hormobiota.', '/eventos/hormobiota/hormobiota-2026', 'PENDIENTE', 'PENDIENTE', true, 'Event'),
('Comunidad', 'Comunidad médica · Eventos Médicos LATAM', 'Contenido académico, webinars y avisos de eventos.', '/comunidad', 'PENDIENTE', 'PENDIENTE', true, 'WebPage');

-- =========================================================
-- form_definitions — metadata de integración GoHighLevel (admin-only)
-- =========================================================

insert into form_definitions (name, purpose, crm_payload, crm_tags, submissions, last_synced_at, active) values
('Contacto general', 'Consultas con motivo (asistir, patrocinar, stand, alianza, speaker, comercial, otro).', array['nombre','email','whatsapp','motivo','mensaje','fuente','consentimiento'], array['contacto-web'], 0, null, true),
('Comunidad médica', 'Registro a newsletter, contenido académico y avisos de eventos.', array['nombre','email','whatsapp','ciudad','especialidad','interes','fuente','consentimiento'], array['comunidad','newsletter'], 5, '2026-08-18', true),
('Inscripción a evento', 'Registro con selección de ticket y pago por Wompi.', array['nombre','email','whatsapp','evento','edicion','ticket','modalidad','puente','pago','fuente','consentimiento'], array['inscripcion','hormobiota-2-2027'], 0, null, true),
('Registro a webinar', 'Registro a eventos secundarios y contenido en vivo.', array['nombre','email','whatsapp','webinar','modalidad','fuente','consentimiento'], array['webinar'], 0, null, true),
('Solicitud de patrocinio', 'Solicitud de propuesta comercial. No expone precios en borrador.', array['empresa','contacto','email','whatsapp','evento','interes','presupuesto','fuente'], array['patrocinio','oportunidad-comercial'], 0, null, true),
('Solicitud de stand', 'Interés en zona comercial y disponibilidad de stands.', array['empresa','contacto','email','whatsapp','evento','stand','fuente'], array['stand','oportunidad-comercial'], 0, null, true),
('Lista de espera', 'Captura de interés cuando un ticket está agotado o sin precio aprobado.', array['nombre','email','whatsapp','evento','ticket','fuente','consentimiento'], array['lista-espera'], 0, null, true),
('Descarga de recurso', 'Entrega de guía PDF y material académico.', array['nombre','email','recurso','fuente','consentimiento'], array['descarga','ruta-hormobiota'], 0, null, true),
('Alta de empresa', 'Creación de empresa y acceso al Portal.', array['empresa','nit','contacto','email','whatsapp','evento','rol'], array['empresa','portal'], 0, null, true);

-- =========================================================
-- community_members — se dejan vacíos (son leads reales, no catálogo)
-- =========================================================
-- (intencionalmente sin INSERT: community_members del mock son datos de
-- muestra transaccionales, no contenido editorial)

