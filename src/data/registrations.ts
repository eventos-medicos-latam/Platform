import type { PaymentStatus, Registration } from '../types/commerce';

/** Registros de muestra para operar el Dashboard. Datos personales en PENDIENTE. */
export const registrations: Registration[] = [
{ id: 'rg-001', editionId: 'ed-hormobiota-2027', ticketId: 'tkt-2027-preventa', fullName: 'Datos de muestra 01', email: 'PENDIENTE', whatsapp: 'PENDIENTE', city: 'Medellín', specialty: 'Endocrinología', trackInterestId: 'puente-2', modality: 'presencial', amount: null, paymentStatus: 'pending', qrCode: 'HB2-0001', qrStatus: 'active', source: 'evento-hormobiota-2', crmSynced: true, consentCommercial: true, createdAt: '2026-08-18' },
{ id: 'rg-002', editionId: 'ed-hormobiota-2027', ticketId: 'tkt-2027-preventa', fullName: 'Datos de muestra 02', email: 'PENDIENTE', whatsapp: 'PENDIENTE', city: 'Bogotá', specialty: 'Nutrición clínica', trackInterestId: 'puente-5', modality: 'presencial', amount: null, paymentStatus: 'approved', qrCode: 'HB2-0002', qrStatus: 'active', source: 'ruta-hormobiota', crmSynced: true, consentCommercial: true, createdAt: '2026-08-17' },
{ id: 'rg-003', editionId: 'ed-hormobiota-2027', ticketId: 'tkt-2027-general', fullName: 'Datos de muestra 03', email: 'PENDIENTE', whatsapp: 'PENDIENTE', city: 'Cali', specialty: 'Dermatología', trackInterestId: 'puente-6', modality: 'presencial', amount: null, paymentStatus: 'declined', qrCode: 'HB2-0003', qrStatus: 'invalid', source: 'evento-hormobiota-2', crmSynced: true, consentCommercial: false, createdAt: '2026-08-16' },
{ id: 'rg-004', editionId: 'ed-hormobiota-2027', ticketId: 'tkt-2027-estudiante', fullName: 'Datos de muestra 04', email: 'PENDIENTE', whatsapp: 'PENDIENTE', city: 'Medellín', specialty: 'Residente', trackInterestId: 'puente-1', modality: 'presencial', amount: null, paymentStatus: 'pending', qrCode: 'HB2-0004', qrStatus: 'active', source: 'webinar-microbiota-sep26', crmSynced: false, consentCommercial: true, createdAt: '2026-08-15' },
{ id: 'rg-005', editionId: 'ed-hormobiota-2027', ticketId: 'tkt-2027-general', fullName: 'Datos de muestra 05', email: 'PENDIENTE', whatsapp: 'PENDIENTE', city: 'Pereira', specialty: 'Medicina funcional', trackInterestId: 'puente-3', modality: 'presencial', amount: null, paymentStatus: 'expired', qrCode: 'HB2-0005', qrStatus: 'cancelled', source: 'evento-hormobiota-2', crmSynced: true, consentCommercial: true, createdAt: '2026-08-14' },
{ id: 'rg-006', editionId: 'ed-hormobiota-2027', ticketId: 'tkt-2027-cortesia', fullName: 'Datos de muestra 06', email: 'PENDIENTE', whatsapp: 'PENDIENTE', city: 'Medellín', specialty: 'Industria', trackInterestId: 'puente-5', modality: 'presencial', amount: 0, paymentStatus: 'approved', qrCode: 'HB2-0006', qrStatus: 'used', checkedInAt: 'PENDIENTE', source: 'cortesia-marca-01', crmSynced: true, consentCommercial: false, createdAt: '2026-08-12' },
{ id: 'rg-007', editionId: 'ed-hormobiota-2027', ticketId: 'tkt-2027-preventa', fullName: 'Datos de muestra 07', email: 'PENDIENTE', whatsapp: 'PENDIENTE', city: 'Barranquilla', specialty: 'Gastroenterología', trackInterestId: 'puente-1', modality: 'presencial', amount: null, paymentStatus: 'refunded', qrCode: 'HB2-0007', qrStatus: 'cancelled', source: 'evento-hormobiota-2', crmSynced: true, consentCommercial: true, createdAt: '2026-08-10' },
{ id: 'rg-008', editionId: 'ed-hormobiota-2027', ticketId: 'tkt-2027-general', fullName: 'Datos de muestra 08', email: 'PENDIENTE', whatsapp: 'PENDIENTE', city: 'Medellín', specialty: 'Ginecología', trackInterestId: 'puente-4', modality: 'presencial', amount: null, paymentStatus: 'cancelled', qrCode: 'HB2-0008', qrStatus: 'cancelled', source: 'ruta-hormobiota', crmSynced: false, consentCommercial: true, createdAt: '2026-08-08' }];


export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  declined: 'Declined',
  failed: 'Failed',
  expired: 'Expired',
  cancelled: 'Cancelled',
  refunded: 'Refunded'
};

export function registrationsByEdition(editionId: string): Registration[] {
  return registrations.filter((registration) => registration.editionId === editionId);
}

export function registrationsByTrack(editionId: string): {trackId: string;total: number;}[] {
  const map = new Map<string, number>();
  registrationsByEdition(editionId).forEach((registration) => {
    const key = registration.trackInterestId ?? 'sin-definir';
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return [...map.entries()].map(([trackId, total]) => ({ trackId, total }));
}