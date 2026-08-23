import type { Modality, PublicationStatus } from './event';
import type { CompanyRole } from './company';

export interface OrganizationMetric {
  id: string;
  label: string;
  value: string;
  note: string;
  status: PublicationStatus;
}

export interface OrganizationProfile {
  name: string;
  legalName: string;
  city: string;
  country: string;
  claim: string;
  valueProposition: string;
  description: string[];
  focus: string[];
  contactEmail: string;
  contactWhatsapp: string;
  metrics: OrganizationMetric[];
}

export type ContentKind =
'articulo' |
'noticia' |
'video' |
'entrevista' |
'memoria' |
'recurso' |
'resumen';

export interface ContentItem {
  id: string;
  kind: ContentKind;
  title: string;
  excerpt: string;
  editionId?: string;
  trackId?: string;
  author: string;
  date: string;
  readingTime: string;
  status: PublicationStatus;
}

export interface Ally {
  id: string;
  name: string;
  role: CompanyRole;
  editionIds: string[];
  web: string;
  description: string;
  status: PublicationStatus;
}

export type SecondaryEventKind =
'webinar' |
'conversatorio' |
'masterclass' |
'curso' |
'lanzamiento';

export interface SecondaryEvent {
  id: string;
  title: string;
  kind: SecondaryEventKind;
  date: string;
  time: string;
  speakerLabel: string;
  modality: Modality;
  price: number | null;
  seats: number | null;
  registered: number;
  relatedEditionId?: string;
  crmTag: string;
  status: PublicationStatus;
  /** Descripción corta para la ficha del calendario. */
  description?: string;
  durationMinutes?: number;
  /** Sala de transmisión. El enlace se envía por automatización tras el registro. */
  platform?: string;
  /** Eje temático relacionado, cuando aplica. */
  trackId?: string;
}

export interface CommunityMember {
  id: string;
  fullName: string;
  email: string;
  city: string;
  specialty: string;
  interestTrackId?: string;
  source: string;
  consentCommercial: boolean;
  crmSynced: boolean;
  createdAt: string;
}

export type ContactReason =
'asistir' |
'patrocinar' |
'stand' |
'alianza' |
'speaker' |
'comercial' |
'otro';

export interface FormDefinition {
  id: string;
  name: string;
  purpose: string;
  /** Campos que viajan a GoHighLevel. */
  crmPayload: string[];
  crmTags: string[];
  submissions: number;
  lastSyncedAt: string;
  active: boolean;
}

export interface SeoRecord {
  id: string;
  scope: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  ogImage: string;
  canonical: string;
  indexable: boolean;
  schema: 'Event' | 'Organization' | 'Article' | 'WebPage';
}

export interface LegalDocument {
  id: string;
  title: string;
  summary: string;
  updatedAt: string;
  status: PublicationStatus;
  body: string[];
}