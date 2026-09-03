// =========================================================
// NOVO ARCHITECTURE — TypeScript types
// Espejo fiel del schema SQL de las migraciones 032–040
// =========================================================

// ─── Enums ────────────────────────────────────────────────

export type NovoEventType =
  | 'congreso' | 'webinar' | 'masterclass' | 'simposio'
  | 'lanzamiento' | 'conversatorio' | 'curso' | 'otro';

export type NovoEventModality = 'presencial' | 'virtual' | 'hibrido';
export type NovoEventAudience = 'profesionales' | 'pacientes' | 'ambos' | 'general';

export type NovoEventOperationalStatus =
  | 'borrador' | 'proximo' | 'activo' | 'finalizado' | 'cancelado' | 'archivado';

export type NovoEventPublicationStatus =
  | 'borrador' | 'vista-previa' | 'publicado' | 'oculto';

export type NovoIdentifierType =
  | 'email' | 'telefono' | 'whatsapp' | 'documento'
  | 'auth_user_id' | 'ghl_contact_id' | 'qr_id' | 'hotmart_id' | 'otro';

export type NovoPersonClassification =
  | 'profesional' | 'paciente' | 'publico-general' | 'speaker'
  | 'colaborador' | 'invitado' | 'staff-eml' | 'comunidad'
  | 'comprador' | 'moderador' | 'otro';

export type NovoProductCategory =
  | 'participacion' | 'stand' | 'ticket' | 'evento-digital'
  | 'infoproducto' | 'servicio-corporativo' | 'otro';

export type NovoAgreementStatus =
  | 'borrador' | 'en-negociacion' | 'aprobado' | 'cerrado' | 'cancelado';

export type NovoAgreementOrigin = 'evento' | 'corporativo';

export type NovoPaymentMethod =
  | 'wompi' | 'transferencia' | 'efectivo' | 'manual' | 'otro';

export type NovoRegistrationType =
  | 'compra' | 'invitacion' | 'cortesia' | 'colaborador'
  | 'sponsor' | 'importacion' | 'manual';

export type NovoRegistrationOrigin =
  | 'web' | 'social' | 'portal-empresa' | 'eml' | 'campana'
  | 'importacion' | 'qr' | 'otro';

export type NovoQrInteractionRule =
  | 'una-vez' | 'una-vez-dia' | 'multiples' | 'ilimitado' | 'por-actividad';

export type NovoStandUnitStatus =
  | 'disponible' | 'reservado' | 'vendido' | 'bloqueado' | 'no-disponible';

export type NovoPlatformRole =
  | 'super-admin' | 'admin-operativo' | 'asesor-comercial'
  | 'staff-qr' | 'empresa' | 'speaker' | 'soporte' | 'developer';

// ─── Personas ─────────────────────────────────────────────

export interface Person {
  id: string;
  full_name: string;
  birth_date?: string;
  city?: string;
  country?: string;
  avatar_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joins opcionales
  identifiers?: PersonIdentifier[];
  classifications?: PersonClassification[];
  professional_profile?: ProfessionalProfile;
}

export interface PersonIdentifier {
  id: string;
  person_id: string;
  identifier_type: NovoIdentifierType;
  raw_value: string;
  normalized_value: string;
  verified: boolean;
  is_primary: boolean;
  created_at: string;
}

export interface PersonClassification {
  id: string;
  person_id: string;
  classification: NovoPersonClassification;
  source?: string;
  event_id?: string;
  created_at: string;
}

export interface ProfessionalProfile {
  id: string;
  person_id: string;
  profession?: string;
  specialty?: string;
  subspecialty?: string;
  institution?: string;
  areas_of_interest?: string[];
  linkedin_url?: string;
  created_at: string;
  updated_at: string;
}

// ─── Eventos ──────────────────────────────────────────────

export interface NovoEvent {
  id: string;
  name: string;
  slug: string;
  event_type: NovoEventType;
  modality: NovoEventModality;
  audience: NovoEventAudience;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  timezone: string;
  venue_name?: string;
  venue_address?: string;
  venue_city?: string;
  venue_country?: string;
  platform_name?: string;
  platform_url?: string;
  is_public: boolean;
  is_free: boolean;
  contracting_company_id?: string;
  cover_image_url?: string;
  logo_url?: string;
  primary_color?: string;
  accent_color?: string;
  description?: string;
  tagline?: string;
  has_certificate: boolean;
  certificate_send_at?: string;
  max_capacity?: number;
  is_featured: boolean;
  goals?: Record<string, number>;
  operational_status: NovoEventOperationalStatus;
  publication_status: NovoEventPublicationStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joins / computed
  registrations_count?: number;
  revenue?: number;
  contracting_company?: { id: string; name: string };
}

export interface EventSettings {
  id: string;
  event_id: string;
  sections: {
    hero: boolean; info: boolean; speakers: boolean; agenda: boolean;
    tickets: boolean; sponsors: boolean; stands: boolean; gallery: boolean;
    location: boolean; faq: boolean; contact: boolean; cta: boolean;
  };
  custom?: Record<string, unknown>;
  updated_at: string;
}

// ─── Productos ────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  category: NovoProductCategory;
  description?: string;
  list_price: number;
  min_price?: number;
  currency: string;
  image_url?: string;
  is_active: boolean;
  custom_fields?: CustomFieldDef[];
  created_at: string;
  updated_at: string;
}

export interface CustomFieldDef {
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'date';
  required?: boolean;
  options?: string[];
}

export interface EventProduct {
  id: string;
  event_id: string;
  product_id: string;
  price?: number;
  inventory?: number;
  is_available: boolean;
  benefits?: string[];
  conditions?: string;
  product?: Product;
}

// ─── Acuerdos comerciales ─────────────────────────────────

export interface CommercialAgreement {
  id: string;
  company_id: string;
  event_id?: string;
  origin: NovoAgreementOrigin;
  status: NovoAgreementStatus;
  total: number;
  currency: string;
  snapshot?: Record<string, unknown>;
  current_version: number;
  closed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joins
  company?: { id: string; name: string };
  event?: Pick<NovoEvent, 'id' | 'name' | 'slug'>;
  lines?: AgreementLine[];
  schedule?: CollectionScheduleItem[];
}

export interface AgreementLine {
  id: string;
  agreement_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  list_price: number;
  min_price?: number;
  negotiated_price: number;
  discount_pct: number;
  subtotal: number;
  product?: Pick<Product, 'id' | 'name' | 'category'>;
}

export interface CollectionScheduleItem {
  id: string;
  agreement_id: string;
  installment_no: number;
  label?: string;
  due_date: string;
  amount: number;
  percentage?: number;
  status: 'pendiente' | 'pagado' | 'vencido';
  paid_at?: string;
  payment_id?: string;
}

// ─── Tickets y registros ──────────────────────────────────

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  modality?: NovoEventModality;
  access_level: string;
  base_price: number;
  tax_pct: number;
  capacity?: number;
  benefits?: string[];
  sale_start?: string;
  sale_end?: string;
  is_visible: boolean;
  has_qr: boolean;
  sort_order: number;
  price_stages?: TicketPriceStage[];
}

export interface TicketPriceStage {
  id: string;
  ticket_type_id: string;
  stage_name: string;
  price: number;
  valid_until?: string;
  quantity_limit?: number;
  sort_order: number;
}

export interface EventRegistration {
  id: string;
  person_id: string;
  event_id: string;
  registration_type: NovoRegistrationType;
  origin: NovoRegistrationOrigin;
  company_id?: string;
  amount_paid: number;
  payment_id?: string;
  attended: boolean;
  notes?: string;
  created_at: string;
  person?: Pick<Person, 'id' | 'full_name' | 'avatar_url'>;
  event?: Pick<NovoEvent, 'id' | 'name' | 'slug'>;
}

// ─── QR ───────────────────────────────────────────────────

export interface PersonQr {
  id: string;
  person_id: string;
  qr_token: string;
  created_at: string;
}

export interface QrInteraction {
  id: string;
  person_qr_id: string;
  event_id: string;
  interaction_type_id?: string;
  scanner_person_id?: string;
  company_id?: string;
  stand_unit_id?: string;
  result: 'ok' | 'denied' | 'duplicate';
  note?: string;
  consent_given?: boolean;
  occurred_at: string;
}

// ─── Stands ───────────────────────────────────────────────

export interface StandType {
  id: string;
  name: string;
  dimensions?: string;
  includes?: string[];
  image_url?: string;
  description?: string;
  base_price: number;
  currency: string;
  is_active: boolean;
}

export interface StandUnit {
  id: string;
  inventory_id: string;
  event_id: string;
  stand_type_id: string;
  unit_number: string;
  status: NovoStandUnitStatus;
  map_x?: number;
  map_y?: number;
  map_width?: number;
  map_height?: number;
  stand_type?: StandType;
}

// ─── Speakers ─────────────────────────────────────────────

export interface SpeakerProfile {
  id: string;
  person_id: string;
  public_title?: string;
  public_institution?: string;
  specialty?: string;
  subspecialty?: string;
  topics?: string[];
  bio?: string;
  photo_url?: string;
  linkedin_url?: string;
  is_public: boolean;
  badge_count: number;
  person?: Pick<Person, 'id' | 'full_name'>;
}

export interface EventSpeaker {
  id: string;
  event_id: string;
  speaker_id: string;
  status: 'invitado' | 'en-negociacion' | 'confirmado' | 'cancelado' | 'publicado';
  is_featured: boolean;
  speaker?: SpeakerProfile;
}

// ─── Dashboard / KPIs ─────────────────────────────────────

export interface EventKpis {
  event_id: string;
  registrations: number;
  registrations_goal?: number;
  revenue: number;
  revenue_goal?: number;
  sponsorships: number;
  stands_sold: number;
  stands_total: number;
  checkins: number;
  pending_alerts: number;
}

export interface DashboardStats {
  total_events: number;
  active_events: number;
  upcoming_events: number;
  total_registrations: number;
  total_revenue: number;
  total_companies: number;
}

// ─── System Events ────────────────────────────────────────

export interface SystemEvent {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  event_context?: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'delivered' | 'failed' | 'skipped';
  attempts: number;
  occurred_at: string;
}
