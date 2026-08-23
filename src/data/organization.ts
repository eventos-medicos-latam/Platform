import type { OrganizationProfile } from '../types/content';

export const organization: OrganizationProfile = {
  name: 'Eventos Médicos LATAM',
  legalName: 'PENDIENTE · razón social',
  city: 'Medellín',
  country: 'Colombia',
  claim: 'Educación médica continua que conecta especialidades',
  valueProposition:
  'Diseñamos y operamos congresos, cursos y experiencias académicas para profesionales de la salud en Latinoamérica.',
  description: [
  'Eventos Médicos LATAM es una organización con sede en Medellín dedicada a la educación médica continua: congresos, cursos, webinars, masterclass y conversatorios para profesionales de la salud.',
  'Cada evento se construye con criterio académico y operación profesional: comité de contenido, speakers, certificación, experiencia del asistente y relación con la industria.',
  'Nuestros eventos no son piezas aisladas. Funcionan como familias que vuelven año tras año, con comunidad, contenido y memoria propia.'],

  focus: [
  'Programa académico con criterio clínico, no comercial',
  'Experiencia del asistente antes, durante y después del evento',
  'Relación de largo plazo con sociedades médicas y universidades',
  'Operación medible para las empresas que participan'],

  contactEmail: 'PENDIENTE',
  contactWhatsapp: 'PENDIENTE',
  metrics: [
  {
    id: 'met-eventos',
    label: 'Eventos realizados',
    value: 'PENDIENTE',
    note: 'Se publica cuando el equipo confirme el histórico completo.',
    status: 'borrador'
  },
  {
    id: 'met-asistentes',
    label: 'Profesionales asistentes',
    value: 'PENDIENTE',
    note: 'Consolidado de registros por edición.',
    status: 'borrador'
  },
  {
    id: 'met-comunidad',
    label: 'Comunidad médica',
    value: 'PENDIENTE',
    note: 'Contactos con consentimiento vigente en GoHighLevel.',
    status: 'borrador'
  },
  {
    id: 'met-ciudad',
    label: 'Sede principal',
    value: 'Medellín, Colombia',
    note: 'Dato corporativo confirmado.',
    status: 'publicado'
  },
  {
    id: 'met-familias',
    label: 'Familias de eventos',
    value: '1 activa',
    note: 'Hormobiota. Otras familias se suman sin rehacer la plataforma.',
    status: 'publicado'
  },
  {
    id: 'met-proyeccion',
    label: 'Proyección',
    value: 'Nacional e internacional',
    note: 'Speakers y aliados de la región.',
    status: 'publicado'
  }]

};