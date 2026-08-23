/**
 * Dominio de eventos: familia -> edición -> contenido de la edición.
 * La edición es la unidad que se vende y se opera.
 */

export type EditionStatus =
'borrador' |
'proximamente' |
'prelanzamiento' |
'preventa' |
'venta-activa' |
'agotado' |
'en-curso' |
'cerrado' |
'post-evento' |
'historico';

/** Ciclo de aprobación de cualquier dato administrable. */
export type PublicationStatus = 'borrador' | 'en-revision' | 'aprobado' | 'publicado' | 'cerrado';

export type SpeakerStatus = 'invitado' | 'en-negociacion' | 'confirmado' | 'cancelado' | 'publicado';

export type Modality = 'presencial' | 'virtual' | 'hibrido';

export type EditionSection =
'hero' |
'concepto' |
'ejes' |
'publico' |
'agenda' |
'speakers' |
'beneficios' |
'modalidades' |
'tickets' |
'certificacion' |
'patrocinadores' |
'aliados' |
'stands' |
'ubicacion' |
'faq' |
'cta' |
'galeria' |
'memorias' |
'resultados';

/** Eje de clasificación configurable por edición (Puentes, Track, Especialidad, Área). */
export interface TrackAxis {
  /** Etiqueta singular, p.ej. "Puente". */
  label: string;
  /** Etiqueta plural para títulos, p.ej. "Los seis puentes". */
  pluralLabel: string;
  /** Pregunta de segmentación en formularios. */
  interestQuestion: string;
  tracks: Track[];
}

export interface Track {
  id: string;
  order: number;
  name: string;
  subtitle: string;
  description: string;
  /** Clave de icono propio (components/ui/TrackIcon). */
  icon: 'gut' | 'hormone' | 'immune' | 'sleep' | 'cell' | 'skin';
}

export interface Venue {
  name: string;
  address: string;
  city: string;
  country: string;
  notes: string;
}

export interface EventFamily {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  since: number;
}

export interface Edition {
  id: string;
  familyId: string;
  slug: string;
  /** Nombre público completo, p.ej. "Hormobiota 2". */
  name: string;
  /** Etiqueta de edición, p.ej. "Segunda edición · 2027". */
  editionLabel: string;
  year: number;
  claim: string;
  conceptLead: string;
  concept: string[];
  status: EditionStatus;
  startDate: string;
  endDate: string;
  dateLabel: string;
  venue: Venue;
  modality: Modality;
  /** Acento propio de la edición, en canales RGB para Tailwind. */
  accentRgb: string;
  heroKicker: string;
  sections: EditionSection[];
  trackAxis: TrackAxis;
  audience: string[];
  benefits: string[];
  certification: string;
  capacity: string;
  previousEditionId?: string;
  nextEditionId?: string;
  results?: EditionResult[];
  preExperience?: PreExperience;
}

export interface EditionResult {
  label: string;
  value: string;
}

/** Experiencia previa al evento (Ruta Hormobiota), operada por GoHighLevel. */
export interface PreExperience {
  name: string;
  durationLabel: string;
  description: string;
  channels: string[];
}

export type AgendaType =
'registro' |
'conferencia' |
'keynote' |
'panel' |
'mesa-redonda' |
'workshop' |
'break' |
'almuerzo' |
'networking' |
'coctel' |
'activacion' |
'cierre';

export interface AgendaItem {
  id: string;
  editionId: string;
  day: number;
  dayLabel: string;
  dayConcept: string;
  date: string;
  /** "PENDIENTE" cuando el horario no está confirmado. */
  start: string;
  end: string;
  title: string;
  description: string;
  speakerIds: string[];
  type: AgendaType;
  trackId?: string;
  room: string;
  sponsorCompanyId?: string;
  order: number;
  visible: boolean;
  status: PublicationStatus;
}

export interface Speaker {
  id: string;
  editionId: string;
  /** Espacio académico reservado mientras no hay nombre confirmado. */
  slotLabel: string;
  name: string;
  photo?: string;
  specialty: string;
  role: string;
  institution: string;
  country: string;
  city: string;
  bio: string;
  web?: string;
  talks: string[];
  trackId?: string;
  order: number;
  featured: boolean;
  status: SpeakerStatus;
}

export interface FaqItem {
  id: string;
  editionId: string;
  question: string;
  answer: string;
  order: number;
  visible: boolean;
}