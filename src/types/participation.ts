/**
 * Modelo de participación de marca.
 *
 * Todo nace del PLAN. El espacio físico, el puente temático y el speaker son
 * consecuencias del plan elegido, nunca puntos de entrada independientes.
 */

export type PlanId = 'pop-up' | 'conexion' | 'protagonista';

/** Tipo de espacio físico que habilita cada plan. */
export type SpaceKind = 'estacion' | 'stand';

export interface PlanBenefitGroup {
  /** Título del bloque de beneficios (Ruta, Digital, Físico…). */
  title: string;
  items: string[];
}

export interface ParticipationPlan {
  id: PlanId;
  /** Nombre comercial: POP UP, PAQUETE CONEXIÓN, PAQUETE PROTAGONISTA. */
  name: string;
  /** Verbo de posicionamiento: Estar presente / Conectar / Posicionarte. */
  verb: string;
  tagline: string;
  /** Precio en COP. Público por decisión comercial. */
  price: number;
  intro: string[];
  /** Fotografía de referencia de cómo se ve el espacio del plan. */
  mockup: string;
  benefitGroups: PlanBenefitGroup[];
  idealFor: string[];
  closing: string;

  /** Qué habilita el plan. Gobierna los pasos del configurador. */
  space: SpaceKind;
  maxStaff: number;
  /** Invitados profesionales de la salud que puede registrar la marca. */
  guestPasses: number;
  includesBridge: boolean;
  includesSpeaker: boolean;

  /** Inventario del plan para esta edición. */
  totalInventory: number | null;
  sold: number;
  availabilityNote: string;
}

/** Fila de la tabla comparativa. */
export interface PlanComparisonRow {
  label: string;
  values: Record<PlanId, string>;
  footnote?: boolean;
}

/** Estado de un puente temático frente al plan Protagonista. */
export interface BridgeSponsorship {
  trackId: string;
  companyId: string | null;
  status: 'disponible' | 'reservado' | 'confirmado';
}

/** Cómo la marca resuelve el speaker del plan Protagonista. */
export type SpeakerChoice = 'propio' | 'propuesta' | 'acompanamiento';

/** Solicitud generada por el configurador público. */
export interface PlanRequest {
  id: string;
  editionId: string;
  planId: PlanId;
  spaceId: string | null;
  trackId: string | null;
  speakerChoice: SpeakerChoice | null;
  company: string;
  nit: string;
  contactName: string;
  contactEmail: string;
  contactWhatsapp: string;
  category: string;
  notes: string;
  createdAt: string;
  status: 'nueva' | 'en-conversacion' | 'aprobada' | 'descartada';
}

/** Colaborador de la marca que atiende el espacio. */
export interface BrandStaffMember {
  id: string;
  companyId: string;
  name: string;
  role: string;
  email: string;
  whatsapp: string;
  document: string;
  accreditationStatus: 'pendiente' | 'acreditado';
}

/** Profesional de la salud invitado por la marca. */
export interface BrandGuest {
  id: string;
  companyId: string;
  name: string;
  specialty: string;
  email: string;
  whatsapp: string;
  city: string;
  status: 'invitado' | 'registrado' | 'asistio';
}