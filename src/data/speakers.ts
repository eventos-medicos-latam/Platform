import type { Speaker } from '../types/event';

/**
 * REGLA DE DATOS: no se inventan speakers. Cada registro es un espacio
 * académico reservado (slot) con el nombre en PENDIENTE hasta que el
 * equipo confirme. Nada que no esté "confirmado" o "publicado" llega a la web.
 */
export const speakers: Speaker[] = [
{
  id: 'spk-2027-01',
  editionId: 'ed-hormobiota-2027',
  slotLabel: 'Puente 1 · Conferencia de apertura',
  name: 'PENDIENTE',
  specialty: 'Gastroenterología',
  role: 'PENDIENTE',
  institution: 'PENDIENTE',
  country: 'PENDIENTE',
  city: 'PENDIENTE',
  bio: 'PENDIENTE',
  talks: ['Microbiota como origen y cimiento'],
  trackId: 'puente-1',
  order: 1,
  featured: true,
  status: 'en-negociacion'
},
{
  id: 'spk-2027-02',
  editionId: 'ed-hormobiota-2027',
  slotLabel: 'Puente 2 · Conferencia central',
  name: 'PENDIENTE',
  specialty: 'Endocrinología',
  role: 'PENDIENTE',
  institution: 'PENDIENTE',
  country: 'PENDIENTE',
  city: 'PENDIENTE',
  bio: 'PENDIENTE',
  talks: ['Del intestino a la señal endocrina'],
  trackId: 'puente-2',
  order: 2,
  featured: true,
  status: 'en-negociacion'
},
{
  id: 'spk-2027-03',
  editionId: 'ed-hormobiota-2027',
  slotLabel: 'Puente 3 · Conferencia central',
  name: 'PENDIENTE',
  specialty: 'Inmunología / Medicina deportiva',
  role: 'PENDIENTE',
  institution: 'PENDIENTE',
  country: 'PENDIENTE',
  city: 'PENDIENTE',
  bio: 'PENDIENTE',
  talks: ['Inmunidad y músculo: las dos caras de la resiliencia'],
  trackId: 'puente-3',
  order: 3,
  featured: false,
  status: 'invitado'
},
{
  id: 'spk-2027-04',
  editionId: 'ed-hormobiota-2027',
  slotLabel: 'Puente 4 · Conferencia central',
  name: 'PENDIENTE',
  specialty: 'Neurología / Medicina del sueño',
  role: 'PENDIENTE',
  institution: 'PENDIENTE',
  country: 'PENDIENTE',
  city: 'PENDIENTE',
  bio: 'PENDIENTE',
  talks: ['Sueño, reparación y neuroinflamación'],
  trackId: 'puente-4',
  order: 4,
  featured: false,
  status: 'invitado'
},
{
  id: 'spk-2027-05',
  editionId: 'ed-hormobiota-2027',
  slotLabel: 'Puente 5 · Conferencia central',
  name: 'PENDIENTE',
  specialty: 'Nutrición clínica / Longevidad',
  role: 'PENDIENTE',
  institution: 'PENDIENTE',
  country: 'PENDIENTE',
  city: 'PENDIENTE',
  bio: 'PENDIENTE',
  talks: ['Biomarcadores, nutrición y sarcopenia'],
  trackId: 'puente-5',
  order: 5,
  featured: true,
  status: 'en-negociacion'
},
{
  id: 'spk-2027-06',
  editionId: 'ed-hormobiota-2027',
  slotLabel: 'Puente 6 · Conferencia central',
  name: 'PENDIENTE',
  specialty: 'Dermatología integrativa',
  role: 'PENDIENTE',
  institution: 'PENDIENTE',
  country: 'PENDIENTE',
  city: 'PENDIENTE',
  bio: 'PENDIENTE',
  talks: ['Eje intestino-piel'],
  trackId: 'puente-6',
  order: 6,
  featured: false,
  status: 'invitado'
},
{
  id: 'spk-2027-07',
  editionId: 'ed-hormobiota-2027',
  slotLabel: 'Panel magistral día 1 · moderación',
  name: 'PENDIENTE',
  specialty: 'PENDIENTE',
  role: 'PENDIENTE',
  institution: 'PENDIENTE',
  country: 'PENDIENTE',
  city: 'PENDIENTE',
  bio: 'PENDIENTE',
  talks: ['Los puentes internos'],
  order: 7,
  featured: false,
  status: 'invitado'
},
{
  id: 'spk-2027-08',
  editionId: 'ed-hormobiota-2027',
  slotLabel: 'Speaker patrocinado (inventario comercial)',
  name: 'PENDIENTE',
  specialty: 'PENDIENTE',
  role: 'PENDIENTE',
  institution: 'PENDIENTE',
  country: 'PENDIENTE',
  city: 'PENDIENTE',
  bio: 'PENDIENTE',
  talks: ['PENDIENTE'],
  trackId: 'puente-5',
  order: 8,
  featured: false,
  status: 'invitado'
},
{
  id: 'spk-2026-01',
  editionId: 'ed-hormobiota-2026',
  slotLabel: 'Conferencia de apertura 2026',
  name: 'PENDIENTE',
  specialty: 'PENDIENTE',
  role: 'PENDIENTE',
  institution: 'PENDIENTE',
  country: 'PENDIENTE',
  city: 'PENDIENTE',
  bio: 'PENDIENTE',
  talks: ['PENDIENTE'],
  order: 1,
  featured: false,
  status: 'invitado'
},
{
  id: 'spk-2026-02',
  editionId: 'ed-hormobiota-2026',
  slotLabel: 'Cierre magistral 2026',
  name: 'PENDIENTE',
  specialty: 'PENDIENTE',
  role: 'PENDIENTE',
  institution: 'PENDIENTE',
  country: 'PENDIENTE',
  city: 'PENDIENTE',
  bio: 'PENDIENTE',
  talks: ['PENDIENTE'],
  order: 2,
  featured: false,
  status: 'invitado'
}];


export function speakersByEdition(editionId: string): Speaker[] {
  return speakers.filter((speaker) => speaker.editionId === editionId).sort((a, b) => a.order - b.order);
}

/** Solo confirmados o publicados pueden mostrarse en la web. */
export function publicSpeakers(editionId: string): Speaker[] {
  return speakersByEdition(editionId).filter(
    (speaker) => speaker.status === 'confirmado' || speaker.status === 'publicado'
  );
}