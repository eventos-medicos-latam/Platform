import type { FaqItem } from '../types/event';

export const faqs: FaqItem[] = [
{
  id: 'faq-2027-1',
  editionId: 'ed-hormobiota-2027',
  question: '¿Cuándo y dónde es Hormobiota 2?',
  answer:
  'El 23 y 24 de abril de 2027 en el Auditorio Forum de la UPB, Medellín, Colombia. El detalle de accesos y parqueaderos es PENDIENTE.',
  order: 1,
  visible: true
},
{
  id: 'faq-2027-2',
  editionId: 'ed-hormobiota-2027',
  question: '¿Cuánto cuesta la inscripción?',
  answer:
  'Las tarifas están en revisión. Puedes dejar tus datos en la lista de preventa y te avisamos en el momento en que se publiquen, antes de la apertura general.',
  order: 2,
  visible: true
},
{
  id: 'faq-2027-3',
  editionId: 'ed-hormobiota-2027',
  question: '¿El congreso otorga certificación?',
  answer:
  'Sí, se entrega certificado de asistencia. La entidad certificadora y el número de horas académicas son PENDIENTE.',
  order: 3,
  visible: true
},
{
  id: 'faq-2027-4',
  editionId: 'ed-hormobiota-2027',
  question: '¿Qué es la Ruta Hormobiota?',
  answer:
  'Una experiencia previa de 21 días con contenido diario asociado a los seis puentes, comunidad y guía descargable. Se entrega por WhatsApp y correo, sin plataforma adicional.',
  order: 4,
  visible: true
},
{
  id: 'faq-2027-5',
  editionId: 'ed-hormobiota-2027',
  question: '¿Hay modalidad virtual?',
  answer: 'La primera versión del evento es presencial. Modalidad virtual o híbrida: PENDIENTE.',
  order: 5,
  visible: true
},
{
  id: 'faq-2027-6',
  editionId: 'ed-hormobiota-2027',
  question: '¿Tienen hoteles o tarifas para viajeros?',
  answer: 'Hoteles aliados y tarifas preferenciales: PENDIENTE.',
  order: 6,
  visible: true
},
{
  id: 'faq-2027-7',
  editionId: 'ed-hormobiota-2027',
  question: '¿Cómo se selecciona a los speakers?',
  answer:
  'El comité académico revisa cada propuesta y la asigna a un puente. Solo publicamos speakers confirmados, nunca invitaciones en curso.',
  order: 7,
  visible: true
},
{
  id: 'faq-2027-8',
  editionId: 'ed-hormobiota-2027',
  question: '¿Cómo participa una empresa?',
  answer:
  'Con paquetes de patrocinio, stand o activaciones. Solicita la propuesta y el equipo comercial te comparte disponibilidad e inventario real de la edición.',
  order: 8,
  visible: true
}];


export function faqsByEdition(editionId: string): FaqItem[] {
  return faqs.
  filter((faq) => faq.editionId === editionId && faq.visible).
  sort((a, b) => a.order - b.order);
}