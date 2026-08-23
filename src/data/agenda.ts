import type { AgendaItem, AgendaType } from '../types/event';
import { PENDING_LABEL } from '../utils/format';

interface Draft {
  title: string;
  description: string;
  type: AgendaType;
  trackId?: string;
  speakerIds?: string[];
}

const day1: Draft[] = [
{ title: 'Registro y acreditación', description: 'Entrega de credenciales y acceso al auditorio.', type: 'registro' },
{
  title: 'Apertura · Los puentes internos',
  description: 'Presentación del concepto de la edición: la medicina como red, no como órganos aislados.',
  type: 'keynote'
},
{
  title: 'Puente 1 · Sistema gastrointestinal',
  description: 'Microbiota como origen y cimiento de la red.',
  type: 'conferencia',
  trackId: 'puente-1',
  speakerIds: ['spk-2027-01']
},
{ title: 'Coffee break', description: 'Espacio de industria y networking.', type: 'break' },
{
  title: 'Puente 2 · Metabolismo y hormonas',
  description: 'Del intestino a la señal endocrina.',
  type: 'conferencia',
  trackId: 'puente-2',
  speakerIds: ['spk-2027-02']
},
{
  title: 'Almuerzo dialogado',
  description: 'Mesas por puente de interés para conversación dirigida.',
  type: 'almuerzo'
},
{
  title: 'Puente 3 · Inmunidad y sistema musculoesquelético',
  description: 'Las dos caras de la resiliencia.',
  type: 'conferencia',
  trackId: 'puente-3',
  speakerIds: ['spk-2027-03']
},
{ title: 'Coffee break', description: 'Espacio de industria y networking.', type: 'break' },
{
  title: 'Puente 4 · Sueño y neuroinflamación',
  description: 'Reparación y regulación.',
  type: 'conferencia',
  trackId: 'puente-4',
  speakerIds: ['spk-2027-04']
},
{
  title: 'Panel magistral',
  description: 'Conversación entre los ponentes de los cuatro primeros puentes.',
  type: 'panel',
  speakerIds: ['spk-2027-07']
},
{ title: 'Cóctel de networking', description: 'Cierre del día 1 con la industria participante.', type: 'coctel' }];


const day2: Draft[] = [
{ title: 'Registro', description: 'Acceso y acreditación del segundo día.', type: 'registro' },
{
  title: 'Apertura · Los puentes de destino',
  description: 'Enlace entre los puentes internos y la expresión clínica visible.',
  type: 'keynote'
},
{
  title: 'Puente 5 · Longevidad celular',
  description: 'Nutrición, biomarcadores, activación celular y sarcopenia.',
  type: 'conferencia',
  trackId: 'puente-5',
  speakerIds: ['spk-2027-05']
},
{ title: 'Coffee break', description: 'Espacio de industria y networking.', type: 'break' },
{
  title: 'Puente 6 · Piel',
  description: 'Eje intestino-piel, dermatología integrativa, medicina estética y regenerativa.',
  type: 'conferencia',
  trackId: 'puente-6',
  speakerIds: ['spk-2027-06']
},
{
  title: 'Panel integrador',
  description: 'Los seis puentes leídos como una sola red.',
  type: 'panel'
},
{ title: 'Cierre magistral', description: 'Conferencia de cierre académico.', type: 'keynote' },
{ title: 'Cierre protocolario', description: 'Certificados, agradecimientos y próxima edición.', type: 'cierre' }];


function buildDay(
editionId: string,
day: number,
dayLabel: string,
dayConcept: string,
date: string,
drafts: Draft[])
: AgendaItem[] {
  return drafts.map((draft, index) => ({
    id: `ag-${editionId}-d${day}-${index + 1}`,
    editionId,
    day,
    dayLabel,
    dayConcept,
    date,
    /** Horarios en borrador: se marcan, no se inventan. */
    start: PENDING_LABEL,
    end: PENDING_LABEL,
    title: draft.title,
    description: draft.description,
    speakerIds: draft.speakerIds ?? [],
    type: draft.type,
    trackId: draft.trackId,
    room: 'Auditorio Forum',
    order: index + 1,
    visible: true,
    status: 'borrador'
  }));
}

export const agenda: AgendaItem[] = [
...buildDay(
  'ed-hormobiota-2027',
  1,
  'Viernes 23 de abril',
  'Los puentes internos',
  '2027-04-23',
  day1
),
...buildDay(
  'ed-hormobiota-2027',
  2,
  'Sábado 24 de abril',
  'Los puentes de destino',
  '2027-04-24',
  day2
),
{
  id: 'ag-2026-d1-1',
  editionId: 'ed-hormobiota-2026',
  day: 1,
  dayLabel: 'Viernes 17 de abril de 2026',
  dayConcept: 'Microbiota y sistema endocrino',
  date: '2026-04-17',
  start: PENDING_LABEL,
  end: PENDING_LABEL,
  title: 'Programa día 1',
  description: 'Detalle del programa ejecutado: PENDIENTE en el archivo histórico.',
  speakerIds: ['spk-2026-01'],
  type: 'conferencia',
  room: 'PENDIENTE',
  order: 1,
  visible: true,
  status: 'aprobado'
},
{
  id: 'ag-2026-d2-1',
  editionId: 'ed-hormobiota-2026',
  day: 2,
  dayLabel: 'Sábado 18 de abril de 2026',
  dayConcept: 'Salud metabólica',
  date: '2026-04-18',
  start: PENDING_LABEL,
  end: PENDING_LABEL,
  title: 'Programa día 2',
  description: 'Detalle del programa ejecutado: PENDIENTE en el archivo histórico.',
  speakerIds: ['spk-2026-02'],
  type: 'conferencia',
  room: 'PENDIENTE',
  order: 1,
  visible: true,
  status: 'aprobado'
}];


export function agendaByEdition(editionId: string): AgendaItem[] {
  return agenda.
  filter((item) => item.editionId === editionId).
  sort((a, b) => a.day - b.day || a.order - b.order);
}

export function agendaDays(editionId: string): {day: number;label: string;concept: string;items: AgendaItem[];}[] {
  const items = agendaByEdition(editionId);
  const days = [...new Set(items.map((item) => item.day))];
  return days.map((day) => {
    const dayItems = items.filter((item) => item.day === day);
    return {
      day,
      label: dayItems[0]?.dayLabel ?? `Día ${day}`,
      concept: dayItems[0]?.dayConcept ?? '',
      items: dayItems
    };
  });
}

export const agendaTypeLabels: Record<AgendaType, string> = {
  registro: 'Registro',
  conferencia: 'Conferencia',
  keynote: 'Keynote',
  panel: 'Panel',
  'mesa-redonda': 'Mesa redonda',
  workshop: 'Workshop',
  break: 'Break',
  almuerzo: 'Almuerzo',
  networking: 'Networking',
  coctel: 'Cóctel',
  activacion: 'Activación',
  cierre: 'Cierre'
};