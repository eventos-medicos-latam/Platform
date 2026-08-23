import type { Edition, EventFamily, TrackAxis } from '../types/event';

export const eventFamilies: EventFamily[] = [
{
  id: 'fam-hormobiota',
  slug: 'hormobiota',
  name: 'Hormobiota',
  tagline: 'Microbiota, hormonas y longevidad',
  description:
  'Familia de congresos de Eventos Médicos LATAM dedicada a la relación entre microbiota, sistema endocrino y longevidad. Cada edición amplía el mapa de conexiones entre sistemas.',
  since: 2026
}];


/** Eje de clasificación de Hormobiota 2: los seis puentes. */
const bridgesAxis: TrackAxis = {
  label: 'Puente',
  pluralLabel: 'Los seis puentes',
  interestQuestion: '¿Cuál puente te interesa más?',
  tracks: [
  {
    id: 'puente-1',
    order: 1,
    name: 'Sistema gastrointestinal',
    subtitle: 'Origen y cimiento',
    description:
    'La microbiota como punto de partida: barrera intestinal, diversidad microbiana y su papel estructural en el resto de la red.',
    icon: 'gut'
  },
  {
    id: 'puente-2',
    order: 2,
    name: 'Metabolismo y hormonas',
    subtitle: 'Del intestino a la señal endocrina',
    description:
    'Cómo la señal que nace en el intestino se traduce en regulación metabólica y hormonal.',
    icon: 'hormone'
  },
  {
    id: 'puente-3',
    order: 3,
    name: 'Inmunidad y sistema musculoesquelético',
    subtitle: 'Las dos caras de la resiliencia',
    description:
    'Inflamación, respuesta inmune y función muscular como expresión de la misma capacidad de resistir.',
    icon: 'immune'
  },
  {
    id: 'puente-4',
    order: 4,
    name: 'Sueño y neuroinflamación',
    subtitle: 'Reparación y regulación',
    description:
    'El descanso como mecanismo de reparación y su relación con los procesos neuroinflamatorios.',
    icon: 'sleep'
  },
  {
    id: 'puente-5',
    order: 5,
    name: 'Longevidad celular',
    subtitle: 'Nutrición, biomarcadores y sarcopenia',
    description:
    'Activación celular, biomarcadores de longevidad, nutrición e intervención sobre la sarcopenia.',
    icon: 'cell'
  },
  {
    id: 'puente-6',
    order: 6,
    name: 'Piel',
    subtitle: 'Eje intestino-piel',
    description:
    'Dermatología integrativa, medicina estética y regenerativa leídas desde el eje intestino-piel.',
    icon: 'skin'
  }]

};

const historicAxis: TrackAxis = {
  label: 'Eje temático',
  pluralLabel: 'Ejes temáticos',
  interestQuestion: '¿Cuál eje te interesa más?',
  tracks: []
};

export const editions: Edition[] = [
{
  id: 'ed-hormobiota-2027',
  familyId: 'fam-hormobiota',
  slug: 'hormobiota-2-2027',
  name: 'Hormobiota 2',
  editionLabel: 'Segunda edición · 2027',
  year: 2027,
  claim: 'El puente: del intestino a la longevidad',
  conceptLead: 'La medicina del siglo XXI ya no trata órganos aislados. Trata redes.',
  concept: [
  'Hormobiota 2 plantea que la microbiota no funciona como un órgano aislado, sino como una red que conecta diferentes sistemas del organismo.',
  'El programa académico recorre seis puentes que van del sistema gastrointestinal a la longevidad celular y la piel, mostrando cómo una señal que nace en el intestino termina expresándose en el metabolismo, la inmunidad, el sueño y la apariencia.'],

  status: 'preventa',
  startDate: '2027-04-23',
  endDate: '2027-04-24',
  dateLabel: '23 y 24 de abril de 2027',
  venue: {
    name: 'Auditorio Forum, UPB Medellín',
    address: 'Universidad Pontificia Bolivariana, Circular 1 · PENDIENTE (dirección exacta del acceso)',
    city: 'Medellín',
    country: 'Colombia',
    notes: 'Parqueaderos, rutas de acceso y hoteles aliados: PENDIENTE.'
  },
  modality: 'presencial',
  // Lavanda del logotipo oficial de Hormobiota.
  accentRgb: '124 107 192',
  heroKicker: 'Congreso internacional · Educación médica continua',
  sections: [
  'hero',
  'concepto',
  'ejes',
  'publico',
  'agenda',
  'speakers',
  'beneficios',
  'modalidades',
  'tickets',
  'certificacion',
  'patrocinadores',
  'aliados',
  'stands',
  'ubicacion',
  'faq',
  'cta'],

  trackAxis: bridgesAxis,
  audience: [
  'Médicos generales y especialistas',
  'Endocrinología, gastroenterología y nutrición clínica',
  'Ginecología, dermatología y medicina estética',
  'Medicina funcional, deportiva y antienvejecimiento',
  'Residentes y estudiantes de últimos semestres',
  'Industria farmacéutica y de nutrición clínica'],

  benefits: [
  'Dos días de programa académico organizado por puentes',
  'Ruta Hormobiota: 21 días de contenido previo al evento',
  'Certificado de asistencia (entidad certificadora PENDIENTE)',
  'Networking dirigido por puente de interés',
  'Memorias digitales del congreso',
  'Cóctel de networking al cierre del día 1'],

  certification: 'PENDIENTE · entidad certificadora y número de horas en definición',
  capacity: 'PENDIENTE',
  previousEditionId: 'ed-hormobiota-2026',
  preExperience: {
    name: 'Ruta Hormobiota',
    durationLabel: '21 días antes del congreso',
    description:
    'Una experiencia previa que prepara al asistente: contenido diario asociado a los seis puentes, comunidad y guía descargable. Se opera con GoHighLevel y WhatsApp, no requiere plataforma aparte.',
    channels: ['WhatsApp', 'Email', 'Guía PDF', 'Comunidad']
  }
},
{
  id: 'ed-hormobiota-2026',
  familyId: 'fam-hormobiota',
  slug: 'hormobiota-2026',
  name: 'Hormobiota',
  editionLabel: 'Primera edición · 2026',
  year: 2026,
  claim: 'Microbiota, hormonas y salud metabólica',
  conceptLead: 'La primera edición abrió la conversación entre microbiota y sistema endocrino.',
  concept: [
  'Hormobiota 2026 reunió en Medellín a profesionales de la salud alrededor de la relación entre microbiota, hormonas y salud metabólica.',
  'La edición dejó las bases del concepto que Hormobiota 2 amplía: los sistemas del cuerpo no se entienden por separado.'],

  status: 'historico',
  startDate: '2026-04-17',
  endDate: '2026-04-18',
  dateLabel: '17 y 18 de abril de 2026',
  venue: {
    name: 'Medellín, Colombia',
    address: 'PENDIENTE',
    city: 'Medellín',
    country: 'Colombia',
    notes: 'Sede exacta de la primera edición: PENDIENTE en el archivo.'
  },
  modality: 'presencial',
  accentRgb: '124 107 192',
  heroKicker: 'Evento realizado · Archivo histórico',
  sections: [
  'hero',
  'concepto',
  'agenda',
  'speakers',
  'certificacion',
  'galeria',
  'memorias',
  'resultados',
  'patrocinadores',
  'aliados',
  'cta'],

  trackAxis: historicAxis,
  audience: [
  'Médicos generales y especialistas',
  'Nutrición clínica y medicina funcional',
  'Industria farmacéutica y de nutrición'],

  benefits: [],
  certification: 'PENDIENTE · certificación emitida en la primera edición',
  capacity: 'PENDIENTE',
  nextEditionId: 'ed-hormobiota-2027',
  results: [
  { label: 'Asistentes', value: 'PENDIENTE' },
  { label: 'Speakers', value: 'PENDIENTE' },
  { label: 'Empresas participantes', value: 'PENDIENTE' },
  { label: 'Horas académicas', value: 'PENDIENTE' }]

}];


export function getEdition(id: string): Edition | undefined {
  return editions.find((edition) => edition.id === id);
}

export function getEditionBySlug(familySlug: string, editionSlug: string): Edition | undefined {
  const family = eventFamilies.find((item) => item.slug === familySlug);
  if (!family) return undefined;
  return editions.find((edition) => edition.familyId === family.id && edition.slug === editionSlug);
}

export function getFamily(id: string): EventFamily | undefined {
  return eventFamilies.find((family) => family.id === id);
}

/** Edición destacada en la home corporativa. */
export const featuredEditionId = 'ed-hormobiota-2027';