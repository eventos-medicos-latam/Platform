import type { Ticket } from '../types/commerce';

/**
 * REGLA DE DATOS: ningún precio de ticket está aprobado todavía.
 * price = null se muestra como PENDIENTE y el flujo público ofrece
 * reserva en lista de preventa en lugar de cobro.
 */
export const tickets: Ticket[] = [
{
  id: 'tkt-2027-preventa',
  editionId: 'ed-hormobiota-2027',
  name: 'Preventa',
  kind: 'preventa',
  modality: 'presencial',
  price: null,
  currency: 'COP',
  vatRate: 0.19,
  quota: 120,
  sold: 0,
  startDate: '2026-09-01',
  endDate: '2026-12-15',
  benefits: [
  'Acceso a los dos días del congreso',
  'Ruta Hormobiota (21 días previos)',
  'Memorias digitales',
  'Cóctel de networking'],

  status: 'en-revision',
  visible: true,
  wompiEnabled: true,
  emitsQr: true
},
{
  id: 'tkt-2027-general',
  editionId: 'ed-hormobiota-2027',
  name: 'General presencial',
  kind: 'general',
  modality: 'presencial',
  price: null,
  currency: 'COP',
  vatRate: 0.19,
  quota: 400,
  sold: 0,
  startDate: '2026-12-16',
  endDate: '2027-04-22',
  benefits: ['Acceso a los dos días del congreso', 'Memorias digitales', 'Certificado de asistencia'],
  status: 'en-revision',
  visible: true,
  wompiEnabled: true,
  emitsQr: true
},
{
  id: 'tkt-2027-estudiante',
  editionId: 'ed-hormobiota-2027',
  name: 'Estudiante',
  kind: 'estudiante',
  modality: 'presencial',
  price: null,
  currency: 'COP',
  vatRate: 0.19,
  quota: 60,
  sold: 0,
  startDate: '2026-09-01',
  endDate: '2027-04-22',
  benefits: ['Acceso a los dos días', 'Requiere certificado de estudio vigente'],
  status: 'borrador',
  visible: true,
  wompiEnabled: true,
  emitsQr: true
},
{
  id: 'tkt-2027-grupo',
  editionId: 'ed-hormobiota-2027',
  name: 'Grupo institucional (desde 5)',
  kind: 'grupo',
  modality: 'presencial',
  price: null,
  currency: 'COP',
  vatRate: 0.19,
  quota: 100,
  sold: 0,
  startDate: '2026-09-01',
  endDate: '2027-04-15',
  benefits: ['Tarifa por grupo', 'Facturación institucional', 'Gestión de asistentes por un responsable'],
  status: 'borrador',
  visible: false,
  wompiEnabled: false,
  emitsQr: true
},
{
  id: 'tkt-2027-cortesia',
  editionId: 'ed-hormobiota-2027',
  name: 'Cortesía patrocinador',
  kind: 'patrocinador',
  modality: 'presencial',
  price: 0,
  currency: 'COP',
  vatRate: 0,
  quota: 40,
  sold: 0,
  startDate: '2026-09-01',
  endDate: '2027-04-22',
  benefits: ['Entradas incluidas en el paquete de patrocinio'],
  status: 'aprobado',
  visible: false,
  wompiEnabled: false,
  emitsQr: true
}];


export function ticketsByEdition(editionId: string): Ticket[] {
  return tickets.filter((ticket) => ticket.editionId === editionId);
}

export function publicTickets(editionId: string): Ticket[] {
  return ticketsByEdition(editionId).filter((ticket) => ticket.visible);
}

export function ticketAvailability(ticket: Ticket): number {
  return Math.max(0, ticket.quota - ticket.sold);
}