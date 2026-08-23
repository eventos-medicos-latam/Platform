import type { Modality, PublicationStatus } from './event';

export type TicketKind =
'preventa' |
'general' |
'vip' |
'estudiante' |
'grupo' |
'invitado' |
'cortesia' |
'patrocinador';

export interface Ticket {
  id: string;
  editionId: string;
  name: string;
  kind: TicketKind;
  modality: Modality;
  /** null cuando el precio aún no está aprobado. */
  price: number | null;
  currency: 'COP';
  vatRate: number;
  quota: number;
  sold: number;
  startDate: string;
  endDate: string;
  benefits: string[];
  status: PublicationStatus;
  visible: boolean;
  wompiEnabled: boolean;
  emitsQr: boolean;
}

export type SponsorTierId = 'digital' | 'stand' | 'speaker';

export interface SponsorPackage {
  id: string;
  editionId: string;
  tier: SponsorTierId;
  name: string;
  summary: string;
  /** Valor de referencia antes de IVA. Solo visible en Dashboard mientras sea borrador. */
  priceBeforeVat: number | null;
  currency: 'COP';
  vatRate: number;
  benefits: string[];
  totalInventory: number;
  reserved: number;
  sold: number;
  status: PublicationStatus;
  order: number;
}

/** Beneficios con disponibilidad limitada (p.ej. speaker patrocinado por puente). */
export interface SponsorBenefitInventory {
  id: string;
  editionId: string;
  benefit: string;
  trackId?: string;
  total: number;
  reserved: number;
  sold: number;
  companyIds: string[];
}

export type StandStatus = 'disponible' | 'reservado' | 'vendido' | 'bloqueado' | 'no-disponible';

export interface Stand {
  id: string;
  editionId: string;
  number: string;
  category: string;
  location: string;
  size: string;
  price: number | null;
  status: StandStatus;
  companyId?: string;
  benefits: string[];
  /** Posición en el plano: rejilla de 12 columnas por 8 filas. */
  plan: {col: number;row: number;w: number;h: number;};
}

/** Elementos fijos del plano que no se venden: accesos, tarima, zonas de servicio. */
export interface PlanFeature {
  id: string;
  label: string;
  kind: 'acceso' | 'tarima' | 'servicio' | 'circulacion';
  plan: {col: number;row: number;w: number;h: number;};
}

export type BannerSurface = 'evento' | 'corporativo' | 'contenido';

export interface BannerSlot {
  id: string;
  companyId: string;
  /** Nivel visual dentro del banner: define tamaño y frecuencia. */
  tier: 'principal' | 'destacado' | 'apoyo';
  order: number;
  active: boolean;
  /** Métricas de muestra: la estructura queda lista para datos reales. */
  impressions: number;
  clicks: number;
  logoReady: boolean;
}

export interface SponsorBannerConfig {
  editionId: string;
  enabled: boolean;
  headingLabel: string;
  surfaces: BannerSurface[];
  /** Segundos que tarda una vuelta completa de la cinta. */
  desktopSpeedSeconds: number;
  mobileSpeedSeconds: number;
  mobileEnabled: boolean;
  collapsible: boolean;
  slots: BannerSlot[];
}

export type PaymentStatus =
'pending' |
'approved' |
'declined' |
'failed' |
'expired' |
'cancelled' |
'refunded';

export type QrStatus = 'active' | 'used' | 'cancelled' | 'invalid';

export interface Registration {
  id: string;
  editionId: string;
  ticketId: string;
  fullName: string;
  email: string;
  whatsapp: string;
  city: string;
  specialty: string;
  /** Valor del eje de interés configurable (puente, track, área). */
  trackInterestId?: string;
  modality: Modality;
  amount: number | null;
  paymentStatus: PaymentStatus;
  qrCode: string;
  qrStatus: QrStatus;
  checkedInAt?: string;
  source: string;
  crmSynced: boolean;
  consentCommercial: boolean;
  createdAt: string;
}

export interface OrderDraft {
  editionId: string;
  ticketId: string;
  fullName: string;
  email: string;
  whatsapp: string;
  city: string;
  specialty: string;
  trackInterestId?: string;
  consentData: boolean;
  consentCommercial: boolean;
}