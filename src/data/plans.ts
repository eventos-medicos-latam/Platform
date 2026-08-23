import type {
  BrandGuest,
  BrandStaffMember,
  BridgeSponsorship,
  ParticipationPlan,
  PlanComparisonRow,
  PlanId,
  PlanRequest } from
'../types/participation';

/**
 * Los tres planes de participación de Hormobiota 2 · 2027.
 * Precios públicos por decisión comercial.
 */
export const planMockups = {
  protagonista: "/285ac78b-9248-4269-8506-398003778faa.jpg",

  conexion: "/4aaff8ba-1e62-415f-82db-238bccf29f4d.jpg",

  'pop-up': "/6a377214-6ce0-4f52-b0d6-21031ee7bd6e.jpg"

} as const;

/** Orden comercial: primero el plan principal. */
const popUpPlan: ParticipationPlan = {
  id: 'pop-up',
  name: 'Pop Up',
  verb: 'Estar presente',
  tagline: 'Presencia de marca simple y directa',
  price: 3200000,
  intro: [
  'El Pop Up Hormobiota es una estación comercial compacta para marcas que quieren presencia presencial durante el evento sin montar un stand completo.',
  'Permite presentar productos o servicios, entregar muestras o información y conversar directamente con los asistentes en un espacio sencillo y profesional.'],

  benefitGroups: [
  {
    title: 'Presencia física',
    items: [
    'Espacio comercial asignado dentro de la zona de exhibición.',
    '1 mesa para presentación de productos, muestras o material informativo.',
    '2 sillas.',
    'Espacio para 1 pendón tipo roll-up, banner vertical o elemento gráfico portátil.',
    'Exhibición de productos y material promocional sobre la mesa.',
    'Contacto directo con los asistentes durante los dos días.']

  },
  {
    title: 'Equipo de marca',
    items: ['Acceso para máximo 2 colaboradores encargados de atender el espacio.']
  }],

  idealFor: [
  'Participar presencialmente en Hormobiota.',
  'Dar a conocer un producto o servicio.',
  'Exhibir muestras o material comercial.',
  'Conversar directamente con profesionales.',
  'Probar la experiencia antes de una participación de mayor escala.'],

  closing: 'Una forma práctica de estar presente y acercar tu marca a la comunidad Hormobiota.',
  mockup: planMockups['pop-up'],
  space: 'estacion',
  maxStaff: 2,
  guestPasses: 0,
  includesBridge: false,
  includesSpeaker: false,
  totalInventory: 5,
  sold: 1,
  availabilityNote: 'Máximo 5 estaciones en la zona de exhibición.'
};

const conexionPlan: ParticipationPlan = {
  id: 'conexion',
  name: 'Paquete Conexión',
  verb: 'Conectar',
  tagline: 'Ruta 21 + presencia digital + web + stand + relacionamiento',
  price: 8900000,
  intro: [
  'Diseñado para marcas que quieren ir más allá de la presencia física y formar parte del ecosistema Hormobiota antes y durante el evento.',
  'Combina presencia digital, participación en la Ruta Hormobiota, exposición en la página web, stand físico y relacionamiento directo con profesionales de la categoría de interés.'],

  benefitGroups: [
  {
    title: 'Ruta Hormobiota — 21 días',
    items: [
    'Integración de la marca dentro del contenido de la Ruta de 21 días.',
    'Asociación con el puente, temática o nicho relacionado con la categoría.',
    'Logo dentro de la guía PDF de la Ruta.',
    'Presencia dentro de la comunidad digital vinculada a la Ruta.',
    'Lista de profesionales inscritos interesados en su categoría, entregada 7 días antes del evento, según autorizaciones de tratamiento de datos.']

  },
  {
    title: 'Presencia en web y ecosistema digital',
    items: [
    'Logo y presencia de marca en la página web oficial de Hormobiota.',
    'Presencia digital en páginas y comunicaciones de los eventos en los que participe.',
    'Integración de marca dentro de contenidos digitales de su categoría.',
    'Presencia dentro del ecosistema digital previo al evento.']

  },
  {
    title: 'Redes sociales',
    items: [
    '3 menciones de marca en redes sociales de Hormobiota.',
    'Presencia en contenidos del puente o nicho correspondiente.',
    'Inclusión en comunicaciones digitales seleccionadas.']

  },
  {
    title: 'Presencia física',
    items: [
    'Stand físico en el foyer durante los dos días del evento.',
    'Espacio para exhibición, relacionamiento y atención de asistentes.',
    'Presentación de productos, muestras, materiales educativos o información comercial.',
    'Acceso para máximo 4 colaboradores de la marca.']

  },
  {
    title: 'Branding del evento',
    items: [
    'Logo en piezas físicas seleccionadas: backing, escarapelas y señalética.',
    'Elementos de branding relacionados con la experiencia del evento.',
    'Presencia dentro del entorno digital asociado al evento.']

  },
  {
    title: 'Relacionamiento',
    items: [
    'Mesa cercana al nicho o puente de interés durante el almuerzo dialogado del viernes.',
    'Conversaciones con profesionales relacionados con su categoría.',
    '10 invitaciones para profesionales de la salud de la marca.']

  }],

  idealFor: [
  'Tener un stand formal dentro del evento.',
  'Presentar productos y servicios.',
  'Tener presencia en la página web de Hormobiota.',
  'Mantener visibilidad digital antes del evento.',
  'Participar en la Ruta Hormobiota.',
  'Generar conversaciones con profesionales de su categoría.'],

  closing:
  'Conexión transforma la presencia de marca en una experiencia de relacionamiento antes y durante Hormobiota.',
  mockup: planMockups.conexion,
  space: 'stand',
  maxStaff: 4,
  guestPasses: 10,
  includesBridge: false,
  includesSpeaker: false,
  totalInventory: 8,
  sold: 2,
  availabilityNote: 'Espacios limitados, sujetos a la capacidad física del foyer.'
};

const protagonistaPlan: ParticipationPlan = {
  id: 'protagonista',
  name: 'Paquete Protagonista',
  verb: 'Posicionarte',
  tagline: 'Posicionamiento integral + speaker + presencia académica',
  price: 19500000,
  intro: [
  'La modalidad de mayor visibilidad e integración de Hormobiota 2027.',
  'Para marcas que no solo quieren participar comercialmente, sino posicionarse dentro de una conversación científica específica, asociar su marca a uno de los puentes temáticos y mantener presencia en el ecosistema durante varios meses.'],

  benefitGroups: [
  {
    title: 'Todo lo del Paquete Conexión',
    items: [
    'Ruta Hormobiota de 21 días con integración de marca y logo en la guía PDF.',
    'Stand físico durante los dos días y máximo 4 colaboradores.',
    'Branding en backing, escarapelas, señalética y piezas digitales.',
    'Mesa en el almuerzo dialogado del nicho correspondiente.']

  },
  {
    title: 'Presencia web y digital ampliada',
    items: [
    'Logo y presencia destacada en la página web oficial.',
    'Presencia digital en las comunicaciones de todos los eventos y actividades.',
    'Exposición digital antes, durante y después del evento.',
    'Visibilidad continua durante 3 a 6 meses.']

  },
  {
    title: 'Plan completo de menciones',
    items: [
    'Plan ampliado de presencia en redes sociales.',
    'Integración en contenidos de la temática patrocinada.',
    'Asociación de la marca con el contenido de su puente.']

  },
  {
    title: 'Speaker',
    items: [
    'Participación con un speaker dentro del espacio académico de su puente.',
    'La marca puede proponer su propio speaker, presentar un profesional de su área o pedir acompañamiento de Hormobiota.',
    'Sujeto a revisión y aprobación del Comité Científico.']

  },
  {
    title: 'Espacio académico',
    items: [
    'Espacio dentro de la programación académica del puente patrocinado.',
    'Formato de charla, presentación académica o simposio corto.',
    'El formato definitivo depende de la estructura académica y del Comité Científico.']

  },
  {
    title: 'Naming del puente',
    items: [
    'Asociación del nombre de la marca con uno de los puentes temáticos.',
    'Ejemplo: «El puente al sistema GI, presentado por [MARCA]».',
    'Exclusividad: 1 marca por puente, 6 espacios en toda la edición.']

  },
  {
    title: 'Relacionamiento',
    items: [
    'Mesa del nicho de interés durante el almuerzo dialogado.',
    'Contacto directo con profesionales de la temática.',
    '20 invitaciones para profesionales de la salud de la marca.']

  }],

  idealFor: [
  'Posicionamiento dentro de una categoría científica específica.',
  'Presencia destacada en la página web.',
  'Exposición digital durante varios meses.',
  'Asociar la marca con contenidos educativos.',
  'Participar mediante un speaker.',
  'Vincular su nombre con uno de los puentes Hormobiota.'],

  closing:
  'Protagonista lleva a la marca más allá del stand: la integra dentro de la conversación científica y del ecosistema Hormobiota.',
  mockup: planMockups.protagonista,
  space: 'stand',
  maxStaff: 4,
  guestPasses: 20,
  includesBridge: true,
  includesSpeaker: true,
  totalInventory: 6,
  sold: 2,
  availabilityNote: '6 cupos en toda la edición · 1 marca por puente.'
};

/** Orden de presentación: Protagonista primero, Pop Up al final. */
export const participationPlans: ParticipationPlan[] = [
protagonistaPlan,
conexionPlan,
popUpPlan];


export function getPlan(id: PlanId): ParticipationPlan | undefined {
  return participationPlans.find((plan) => plan.id === id);
}

/** Tabla comparativa publicada en la web. */
export const planComparison: PlanComparisonRow[] = [
{
  label: 'Inversión',
  values: { 'pop-up': '$3.200.000', conexion: '$8.900.000', protagonista: '$19.500.000' }
},
{
  label: 'Tipo de espacio',
  values: { 'pop-up': 'Estación Pop Up', conexion: 'Stand', protagonista: 'Stand' }
},
{ label: 'Exhibición de producto', values: { 'pop-up': '✓', conexion: '✓', protagonista: '✓' } },
{ label: 'Máximo de colaboradores', values: { 'pop-up': '2', conexion: '4', protagonista: '4' } },
{
  label: 'Invitados profesionales',
  values: { 'pop-up': '—', conexion: '10', protagonista: '20' }
},
{ label: 'Ruta Hormobiota 21 días', values: { 'pop-up': '—', conexion: '✓', protagonista: '✓' } },
{ label: 'Logo en guía PDF', values: { 'pop-up': '—', conexion: '✓', protagonista: '✓' } },
{ label: 'Presencia comunidad digital', values: { 'pop-up': '—', conexion: '✓', protagonista: '✓' } },
{
  label: 'Presencia página web',
  values: { 'pop-up': '—', conexion: '✓', protagonista: '✓ destacada' }
},
{
  label: 'Presencia digital en eventos',
  values: { 'pop-up': '—', conexion: '✓', protagonista: '✓ ampliada' }
},
{
  label: 'Profesionales interesados por categoría',
  values: { 'pop-up': '—', conexion: '✓', protagonista: '✓' },
  footnote: true
},
{
  label: 'Redes sociales',
  values: { 'pop-up': '—', conexion: '3 menciones', protagonista: 'Plan completo' }
},
{ label: 'Branding físico', values: { 'pop-up': '—', conexion: '✓', protagonista: '✓' } },
{ label: 'Almuerzo dialogado / nicho', values: { 'pop-up': '—', conexion: '✓', protagonista: '✓' } },
{ label: 'Speaker', values: { 'pop-up': '—', conexion: '—', protagonista: '✓' } },
{ label: 'Espacio académico', values: { 'pop-up': '—', conexion: '—', protagonista: '✓' } },
{ label: 'Naming del puente', values: { 'pop-up': '—', conexion: '—', protagonista: '✓' } },
{
  label: 'Visibilidad digital extendida',
  values: { 'pop-up': '—', conexion: '—', protagonista: '3–6 meses' }
},
{ label: 'Exclusividad por puente', values: { 'pop-up': '—', conexion: '—', protagonista: '✓' } },
{
  label: 'Disponibilidad',
  values: {
    'pop-up': 'Máximo 5 estaciones',
    conexion: 'Limitada',
    protagonista: '6 cupos · 1 por puente'
  }
}];


export const comparisonFootnote =
'La entrega y utilización de información de profesionales está sujeta a las autorizaciones de tratamiento de datos y políticas aplicables.';

/** Estado de exclusividad de cada puente para el plan Protagonista. */
export const bridgeSponsorships: BridgeSponsorship[] = [
{ trackId: 'puente-1', companyId: 'co-002', status: 'confirmado' },
{ trackId: 'puente-2', companyId: 'co-004', status: 'reservado' },
{ trackId: 'puente-3', companyId: null, status: 'disponible' },
{ trackId: 'puente-4', companyId: null, status: 'disponible' },
{ trackId: 'puente-5', companyId: null, status: 'disponible' },
{ trackId: 'puente-6', companyId: null, status: 'disponible' }];


export function bridgeStatus(trackId: string): BridgeSponsorship {
  return (
    bridgeSponsorships.find((item) => item.trackId === trackId) ?? {
      trackId,
      companyId: null,
      status: 'disponible'
    });

}

/** Solicitudes entrantes del configurador público. */
export const planRequests: PlanRequest[] = [
{
  id: 'req-001',
  editionId: 'ed-hormobiota-2027',
  planId: 'protagonista',
  spaceId: 'st-04',
  trackId: 'puente-3',
  speakerChoice: 'acompanamiento',
  company: 'Marca 07',
  nit: 'PENDIENTE',
  contactName: 'Contacto comercial 07',
  contactEmail: 'comercial07@marca.co',
  contactWhatsapp: 'PENDIENTE',
  category: 'Nutrición clínica',
  notes: 'Interesada en el puente de inmunidad y músculo.',
  createdAt: '2026-08-14',
  status: 'nueva'
},
{
  id: 'req-002',
  editionId: 'ed-hormobiota-2027',
  planId: 'conexion',
  spaceId: 'st-05',
  trackId: null,
  speakerChoice: null,
  company: 'Marca 08',
  nit: 'PENDIENTE',
  contactName: 'Contacto comercial 08',
  contactEmail: 'comercial08@marca.co',
  contactWhatsapp: 'PENDIENTE',
  category: 'Suplementación',
  notes: 'Solicita stand en zona cercana al auditorio.',
  createdAt: '2026-08-11',
  status: 'en-conversacion'
},
{
  id: 'req-003',
  editionId: 'ed-hormobiota-2027',
  planId: 'pop-up',
  spaceId: 'st-09',
  trackId: null,
  speakerChoice: null,
  company: 'Marca 09',
  nit: 'PENDIENTE',
  contactName: 'Contacto comercial 09',
  contactEmail: 'comercial09@marca.co',
  contactWhatsapp: 'PENDIENTE',
  category: 'Dispositivos médicos',
  notes: 'Primera participación en Hormobiota.',
  createdAt: '2026-08-06',
  status: 'aprobada'
}];


/** Colaboradores registrados por la marca demo del Portal. */
export const brandStaff: BrandStaffMember[] = [
{
  id: 'stf-001',
  companyId: 'co-001',
  name: 'Colaborador 01',
  role: 'Coordinación de stand',
  email: 'colaborador01@marca.co',
  document: 'PENDIENTE',
  accreditationStatus: 'acreditado'
},
{
  id: 'stf-002',
  companyId: 'co-001',
  name: 'Colaborador 02',
  role: 'Asesoría científica',
  email: 'colaborador02@marca.co',
  document: 'PENDIENTE',
  accreditationStatus: 'pendiente'
}];


/** Profesionales invitados por la marca demo. */
export const brandGuests: BrandGuest[] = [
{
  id: 'gst-001',
  companyId: 'co-001',
  name: 'Profesional invitado 01',
  specialty: 'Endocrinología',
  email: 'invitado01@correo.co',
  city: 'Bogotá',
  status: 'registrado'
},
{
  id: 'gst-002',
  companyId: 'co-001',
  name: 'Profesional invitado 02',
  specialty: 'Gastroenterología',
  email: 'invitado02@correo.co',
  city: 'Medellín',
  status: 'invitado'
},
{
  id: 'gst-003',
  companyId: 'co-001',
  name: 'Profesional invitado 03',
  specialty: 'Nutrición clínica',
  email: 'invitado03@correo.co',
  city: 'Cali',
  status: 'invitado'
}];


/**
 * Categorías del plano habilitadas por cada plan.
 * El Pop Up es una estación compacta; Conexión y Protagonista son stands.
 */
export function categoriesForPlan(planId: PlanId): string[] {
  return planId === 'pop-up' ? ['Pop Up'] : ['Stand'];
}

/** Puente entre el modelo anterior de tiers y los tres planes. */
export function planFromTier(tier: string | undefined): ParticipationPlan {
  if (tier === 'speaker') return protagonistaPlan;
  if (tier === 'stand') return conexionPlan;
  return popUpPlan;
}

export function staffByCompany(companyId: string): BrandStaffMember[] {
  return brandStaff.filter((item) => item.companyId === companyId);
}

export function guestsByCompany(companyId: string): BrandGuest[] {
  return brandGuests.filter((item) => item.companyId === companyId);
}