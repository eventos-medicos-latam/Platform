import type {
  Ally,
  CommunityMember,
  ContentItem,
  FormDefinition,
  LegalDocument,
  SecondaryEvent,
  SeoRecord } from
'../types/content';

/** Aliados segmentados por rol. Nada en negociación se publica. */
export const allies: Ally[] = [
{
  id: 'al-001',
  name: 'Eventos Médicos LATAM',
  role: 'organizador',
  editionIds: ['ed-hormobiota-2026', 'ed-hormobiota-2027'],
  web: 'PENDIENTE',
  description: 'Organizador y operador del congreso.',
  status: 'publicado'
},
{
  id: 'al-002',
  name: 'PENDIENTE · entidad certificadora',
  role: 'certificador',
  editionIds: ['ed-hormobiota-2027'],
  web: 'PENDIENTE',
  description: 'Certificación académica del congreso en definición.',
  status: 'en-revision'
},
{
  id: 'al-003',
  name: 'PENDIENTE · sociedad médica',
  role: 'sociedad-medica',
  editionIds: ['ed-hormobiota-2027'],
  web: 'PENDIENTE',
  description: 'Aval de sociedad médica en conversación.',
  status: 'borrador'
},
{
  id: 'al-004',
  name: 'PENDIENTE · aliado académico',
  role: 'aliado-academico',
  editionIds: ['ed-hormobiota-2027'],
  web: 'PENDIENTE',
  description: 'Universidad o institución académica en conversación.',
  status: 'borrador'
},
{
  id: 'al-005',
  name: 'Universidad Pontificia Bolivariana',
  role: 'aliado-institucional',
  editionIds: ['ed-hormobiota-2027'],
  web: 'PENDIENTE',
  description: 'Sede del congreso: Auditorio Forum, UPB Medellín. Alcance de la alianza: PENDIENTE.',
  status: 'en-revision'
},
{
  id: 'al-006',
  name: 'PENDIENTE · media partner',
  role: 'media-partner',
  editionIds: ['ed-hormobiota-2027'],
  web: 'PENDIENTE',
  description: 'Difusión en medios especializados.',
  status: 'borrador'
}];


export const contentItems: ContentItem[] = [
{
  id: 'ct-001',
  kind: 'articulo',
  title: 'La medicina que dejó de mirar órganos aislados',
  excerpt:
  'Por qué el enfoque de redes cambia la manera de leer un paciente y qué significa para la práctica clínica diaria.',
  editionId: 'ed-hormobiota-2027',
  author: 'Comité académico',
  date: '2026-08-12',
  readingTime: '6 min',
  status: 'publicado'
},
{
  id: 'ct-002',
  kind: 'articulo',
  title: 'Del intestino a la señal endocrina: qué sabemos hoy',
  excerpt: 'Una introducción al segundo puente de Hormobiota 2 y a la evidencia que lo sostiene.',
  editionId: 'ed-hormobiota-2027',
  trackId: 'puente-2',
  author: 'Comité académico',
  date: '2026-08-05',
  readingTime: '8 min',
  status: 'publicado'
},
{
  id: 'ct-003',
  kind: 'memoria',
  title: 'Memorias Hormobiota 2026',
  excerpt: 'Resumen de la primera edición: conclusiones, materiales y registro fotográfico.',
  editionId: 'ed-hormobiota-2026',
  author: 'Eventos Médicos LATAM',
  date: '2026-05-10',
  readingTime: 'PENDIENTE',
  status: 'en-revision'
},
{
  id: 'ct-004',
  kind: 'entrevista',
  title: 'Entrevista · eje intestino-piel',
  excerpt: 'Conversación sobre dermatología integrativa y microbiota. Publicación programada.',
  editionId: 'ed-hormobiota-2027',
  trackId: 'puente-6',
  author: 'PENDIENTE',
  date: '2026-09-01',
  readingTime: '12 min',
  status: 'borrador'
},
{
  id: 'ct-005',
  kind: 'recurso',
  title: 'Guía Ruta Hormobiota (PDF)',
  excerpt: 'Guía descargable que acompaña los 21 días previos al congreso.',
  editionId: 'ed-hormobiota-2027',
  author: 'Eventos Médicos LATAM',
  date: '2026-08-01',
  readingTime: 'PDF',
  status: 'aprobado'
},
{
  id: 'ct-006',
  kind: 'video',
  title: 'Qué es Hormobiota en 90 segundos',
  excerpt: 'Presentación breve del concepto de la familia de eventos.',
  author: 'Eventos Médicos LATAM',
  date: '2026-07-22',
  readingTime: '1:30',
  status: 'publicado'
}];


export const secondaryEvents: SecondaryEvent[] = [
{
  id: 'se-001',
  title: 'Microbiota y salud metabólica',
  kind: 'webinar',
  date: '2026-09-18',
  time: '19:00',
  durationMinutes: 60,
  speakerLabel: 'PENDIENTE',
  modality: 'virtual',
  price: 0,
  seats: 500,
  registered: 312,
  relatedEditionId: 'ed-hormobiota-2027',
  trackId: 'puente-1',
  platform: 'Sala virtual (enlace por correo y WhatsApp)',
  description:
  'Qué dice la evidencia actual sobre el eje intestino-metabolismo y cómo traducirlo a decisiones de consulta.',
  crmTag: 'webinar-microbiota-sep26',
  status: 'publicado'
},
{
  id: 'se-004',
  title: 'Eje intestino-hormona en la práctica clínica',
  kind: 'conversatorio',
  date: '2026-09-30',
  time: '19:30',
  durationMinutes: 75,
  speakerLabel: 'PENDIENTE',
  modality: 'virtual',
  price: 0,
  seats: 400,
  registered: 168,
  relatedEditionId: 'ed-hormobiota-2027',
  trackId: 'puente-2',
  platform: 'Sala virtual (enlace por correo y WhatsApp)',
  description:
  'Conversación abierta entre especialistas sobre casos reales, con preguntas del público en vivo.',
  crmTag: 'conversatorio-intestino-hormona-sep26',
  status: 'publicado'
},
{
  id: 'se-002',
  title: 'Sueño y neuroinflamación',
  kind: 'conversatorio',
  date: '2026-10-16',
  time: '19:00',
  durationMinutes: 75,
  speakerLabel: 'PENDIENTE',
  modality: 'virtual',
  price: 0,
  seats: 300,
  registered: 94,
  relatedEditionId: 'ed-hormobiota-2027',
  trackId: 'puente-4',
  platform: 'Sala virtual (enlace por correo y WhatsApp)',
  description:
  'Cómo la arquitectura del sueño modula la inflamación y qué se puede intervenir realmente.',
  crmTag: 'conversatorio-sueno-oct26',
  status: 'publicado'
},
{
  id: 'se-005',
  title: 'Inmunidad, músculo y envejecimiento',
  kind: 'webinar',
  date: '2026-10-29',
  time: '19:00',
  durationMinutes: 60,
  speakerLabel: 'PENDIENTE',
  modality: 'virtual',
  price: 0,
  seats: 500,
  registered: 41,
  relatedEditionId: 'ed-hormobiota-2027',
  trackId: 'puente-3',
  platform: 'Sala virtual (enlace por correo y WhatsApp)',
  description:
  'El músculo como órgano inmunometabólico: implicaciones para el paciente que envejece.',
  crmTag: 'webinar-inmunidad-oct26',
  status: 'aprobado'
},
{
  id: 'se-003',
  title: 'Biomarcadores de longevidad',
  kind: 'masterclass',
  date: '2026-11-20',
  time: 'PENDIENTE',
  durationMinutes: 180,
  speakerLabel: 'PENDIENTE',
  modality: 'hibrido',
  price: null,
  seats: null,
  registered: 0,
  relatedEditionId: 'ed-hormobiota-2027',
  trackId: 'puente-5',
  platform: 'PENDIENTE',
  description:
  'Sesión práctica de tres horas sobre interpretación de biomarcadores. Cupo reducido, con taller.',
  crmTag: 'masterclass-longevidad-nov26',
  status: 'aprobado'
},
{
  id: 'se-006',
  title: 'Piel como espejo metabólico',
  kind: 'webinar',
  date: '2026-12-10',
  time: '19:00',
  durationMinutes: 60,
  speakerLabel: 'PENDIENTE',
  modality: 'virtual',
  price: 0,
  seats: 500,
  registered: 0,
  relatedEditionId: 'ed-hormobiota-2027',
  trackId: 'puente-6',
  platform: 'Sala virtual (enlace por correo y WhatsApp)',
  description: 'Manifestaciones cutáneas de la disfunción metabólica y hormonal.',
  crmTag: 'webinar-piel-dic26',
  status: 'aprobado'
},
{
  id: 'se-007',
  title: 'Apertura de la Ruta Hormobiota',
  kind: 'lanzamiento',
  date: '2027-04-02',
  time: '19:00',
  durationMinutes: 45,
  speakerLabel: 'PENDIENTE',
  modality: 'virtual',
  price: 0,
  seats: 1000,
  registered: 0,
  relatedEditionId: 'ed-hormobiota-2027',
  platform: 'Sala virtual (enlace por correo y WhatsApp)',
  description:
  'Sesión inaugural de la experiencia de 21 días previa al congreso. Abierta a todos los inscritos.',
  crmTag: 'lanzamiento-ruta-abr27',
  status: 'aprobado'
}];


/** Solo lo aprobado o publicado se ofrece en la web. */
export function publicSecondaryEvents(): SecondaryEvent[] {
  return secondaryEvents.
  filter((item) => item.status === 'publicado' || item.status === 'aprobado').
  sort((a, b) => a.date.localeCompare(b.date));
}

export const communityMembers: CommunityMember[] = [
{ id: 'cm-1', fullName: 'Datos de muestra 01', email: 'PENDIENTE', city: 'Medellín', specialty: 'Medicina interna', interestTrackId: 'puente-2', source: 'home-comunidad', consentCommercial: true, crmSynced: true, createdAt: '2026-08-18' },
{ id: 'cm-2', fullName: 'Datos de muestra 02', email: 'PENDIENTE', city: 'Bogotá', specialty: 'Nutrición clínica', interestTrackId: 'puente-5', source: 'webinar-microbiota-sep26', consentCommercial: true, crmSynced: true, createdAt: '2026-08-17' },
{ id: 'cm-3', fullName: 'Datos de muestra 03', email: 'PENDIENTE', city: 'Cali', specialty: 'Dermatología', interestTrackId: 'puente-6', source: 'home-comunidad', consentCommercial: false, crmSynced: true, createdAt: '2026-08-15' },
{ id: 'cm-4', fullName: 'Datos de muestra 04', email: 'PENDIENTE', city: 'Medellín', specialty: 'Endocrinología', interestTrackId: 'puente-2', source: 'evento-hormobiota-2', consentCommercial: true, crmSynced: false, createdAt: '2026-08-14' },
{ id: 'cm-5', fullName: 'Datos de muestra 05', email: 'PENDIENTE', city: 'Pereira', specialty: 'Medicina funcional', interestTrackId: 'puente-1', source: 'home-comunidad', consentCommercial: true, crmSynced: true, createdAt: '2026-08-11' }];


/** Formularios y su carga útil hacia GoHighLevel. */
export const formDefinitions: FormDefinition[] = [
{
  id: 'fm-contacto',
  name: 'Contacto general',
  purpose: 'Consultas con motivo (asistir, patrocinar, stand, alianza, speaker, comercial, otro).',
  crmPayload: ['nombre', 'email', 'whatsapp', 'motivo', 'mensaje', 'fuente', 'consentimiento'],
  crmTags: ['contacto-web'],
  submissions: 0,
  lastSyncedAt: 'PENDIENTE',
  active: true
},
{
  id: 'fm-comunidad',
  name: 'Comunidad médica',
  purpose: 'Registro a newsletter, contenido académico y avisos de eventos.',
  crmPayload: ['nombre', 'email', 'whatsapp', 'ciudad', 'especialidad', 'interes', 'fuente', 'consentimiento'],
  crmTags: ['comunidad', 'newsletter'],
  submissions: 5,
  lastSyncedAt: '2026-08-18',
  active: true
},
{
  id: 'fm-inscripcion',
  name: 'Inscripción a evento',
  purpose: 'Registro con selección de ticket y pago por Wompi.',
  crmPayload: ['nombre', 'email', 'whatsapp', 'evento', 'edicion', 'ticket', 'modalidad', 'puente', 'pago', 'fuente', 'consentimiento'],
  crmTags: ['inscripcion', 'hormobiota-2-2027'],
  submissions: 0,
  lastSyncedAt: 'PENDIENTE',
  active: true
},
{
  id: 'fm-webinar',
  name: 'Registro a webinar',
  purpose: 'Registro a eventos secundarios y contenido en vivo.',
  crmPayload: ['nombre', 'email', 'whatsapp', 'webinar', 'modalidad', 'fuente', 'consentimiento'],
  crmTags: ['webinar'],
  submissions: 0,
  lastSyncedAt: 'PENDIENTE',
  active: true
},
{
  id: 'fm-patrocinio',
  name: 'Solicitud de patrocinio',
  purpose: 'Solicitud de propuesta comercial. No expone precios en borrador.',
  crmPayload: ['empresa', 'contacto', 'email', 'whatsapp', 'evento', 'interes', 'presupuesto', 'fuente'],
  crmTags: ['patrocinio', 'oportunidad-comercial'],
  submissions: 0,
  lastSyncedAt: 'PENDIENTE',
  active: true
},
{
  id: 'fm-stand',
  name: 'Solicitud de stand',
  purpose: 'Interés en zona comercial y disponibilidad de stands.',
  crmPayload: ['empresa', 'contacto', 'email', 'whatsapp', 'evento', 'stand', 'fuente'],
  crmTags: ['stand', 'oportunidad-comercial'],
  submissions: 0,
  lastSyncedAt: 'PENDIENTE',
  active: true
},
{
  id: 'fm-espera',
  name: 'Lista de espera',
  purpose: 'Captura de interés cuando un ticket está agotado o sin precio aprobado.',
  crmPayload: ['nombre', 'email', 'whatsapp', 'evento', 'ticket', 'fuente', 'consentimiento'],
  crmTags: ['lista-espera'],
  submissions: 0,
  lastSyncedAt: 'PENDIENTE',
  active: true
},
{
  id: 'fm-descarga',
  name: 'Descarga de recurso',
  purpose: 'Entrega de guía PDF y material académico.',
  crmPayload: ['nombre', 'email', 'recurso', 'fuente', 'consentimiento'],
  crmTags: ['descarga', 'ruta-hormobiota'],
  submissions: 0,
  lastSyncedAt: 'PENDIENTE',
  active: true
},
{
  id: 'fm-empresa',
  name: 'Alta de empresa',
  purpose: 'Creación de empresa y acceso al Portal.',
  crmPayload: ['empresa', 'nit', 'contacto', 'email', 'whatsapp', 'evento', 'rol'],
  crmTags: ['empresa', 'portal'],
  submissions: 0,
  lastSyncedAt: 'PENDIENTE',
  active: true
}];


export const seoRecords: SeoRecord[] = [
{ id: 'seo-home', scope: 'Home corporativa', metaTitle: 'Eventos Médicos LATAM · Educación médica continua', metaDescription: 'Congresos, cursos y experiencias académicas para profesionales de la salud en Latinoamérica.', slug: '/', ogImage: 'PENDIENTE', canonical: 'PENDIENTE', indexable: true, schema: 'Organization' },
{ id: 'seo-h2', scope: 'Hormobiota 2 · 2027', metaTitle: 'Hormobiota 2 · El puente: del intestino a la longevidad', metaDescription: '23 y 24 de abril de 2027, Auditorio Forum UPB Medellín.', slug: '/eventos/hormobiota/hormobiota-2-2027', ogImage: 'PENDIENTE', canonical: 'PENDIENTE', indexable: true, schema: 'Event' },
{ id: 'seo-h1', scope: 'Hormobiota 2026', metaTitle: 'Hormobiota 2026 · Evento realizado', metaDescription: 'Archivo histórico de la primera edición de Hormobiota.', slug: '/eventos/hormobiota/hormobiota-2026', ogImage: 'PENDIENTE', canonical: 'PENDIENTE', indexable: true, schema: 'Event' },
{ id: 'seo-comunidad', scope: 'Comunidad', metaTitle: 'Comunidad médica · Eventos Médicos LATAM', metaDescription: 'Contenido académico, webinars y avisos de eventos.', slug: '/comunidad', ogImage: 'PENDIENTE', canonical: 'PENDIENTE', indexable: true, schema: 'WebPage' }];


export const legalDocuments: LegalDocument[] = [
{
  id: 'lg-habeas',
  title: 'Política de tratamiento de datos y Habeas Data',
  summary: 'Cómo recolectamos, usamos y protegemos los datos personales de asistentes y contactos.',
  updatedAt: 'PENDIENTE',
  status: 'en-revision',
  body: [
  'Eventos Médicos LATAM opera en Colombia y trata datos personales conforme a la Ley 1581 de 2012 y sus decretos reglamentarios.',
  'El titular autoriza el tratamiento de sus datos con una finalidad específica: gestión de su inscripción, entrega de información académica del evento y, cuando lo autorice de forma separada, comunicaciones comerciales.',
  'Los datos de asistentes no se comparten automáticamente con patrocinadores. Cualquier entrega de información depende del consentimiento expreso del titular y de la finalidad autorizada.',
  'El titular puede conocer, actualizar, rectificar y suprimir sus datos, y revocar la autorización, escribiendo al canal de contacto oficial. Responsable del tratamiento: PENDIENTE.']

},
{
  id: 'lg-terminos',
  title: 'Términos y condiciones',
  summary: 'Condiciones de uso de la plataforma y de participación en los eventos.',
  updatedAt: 'PENDIENTE',
  status: 'borrador',
  body: [
  'El uso de esta plataforma implica la aceptación de estos términos.',
  'La programación académica, los speakers y los horarios pueden ajustarse por razones de fuerza mayor. Los cambios se comunican por los canales registrados.',
  'Contenido restante: PENDIENTE de revisión legal.']

},
{
  id: 'lg-compra',
  title: 'Política de compra y reembolsos',
  summary: 'Condiciones de pago, cesión de entradas y devoluciones.',
  updatedAt: 'PENDIENTE',
  status: 'borrador',
  body: [
  'Los pagos se procesan a través de Wompi. La confirmación del registro depende de la aprobación de la transacción.',
  'Condiciones de reembolso, plazos y cesión de entradas: PENDIENTE de aprobación.']

},
{
  id: 'lg-comunicaciones',
  title: 'Consentimiento de comunicaciones',
  summary: 'Autorización separada para recibir información comercial y académica.',
  updatedAt: 'PENDIENTE',
  status: 'en-revision',
  body: [
  'El consentimiento para comunicaciones comerciales se solicita de forma separada del consentimiento de tratamiento de datos.',
  'El titular puede retirar su autorización en cualquier momento desde el enlace incluido en cada comunicación.']

}];