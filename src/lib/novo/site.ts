import { supabase } from '../supabaseClient';
import { listEventSponsors, type EventSponsorRow, type PlanTier } from './sponsors';

export type SitePageId = 'nosotros' | 'comunidad' | 'aliados' | 'contacto' | 'tienda';

export type SiteSettings = Record<string, string>;

export type SiteEventRow = {
  id: string;
  name: string;
  slug: string;
  is_public: boolean;
  is_featured: boolean;
  publication_status: string;
  operational_status: string;
};

export type SiteProductRow = {
  id: string;
  name: string;
  price: number | null;
  status: string;
  featured: boolean;
};

export type ContactMessageRow = {
  id: string;
  reason: string;
  name: string;
  email: string;
  whatsapp: string | null;
  company: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

export const SITE_PAGE_KEYS: Record<SitePageId, string> = {
  nosotros: 'page_nosotros_visible',
  comunidad: 'page_comunidad_visible',
  aliados: 'page_aliados_visible',
  contacto: 'page_contacto_visible',
  tienda: 'page_tienda_visible',
};

export const SITE_PAGES: { id: SitePageId; label: string; slug: string }[] = [
  { id: 'nosotros', label: 'Nosotros', slug: 'nosotros' },
  { id: 'comunidad', label: 'Comunidad', slug: 'comunidad' },
  { id: 'aliados', label: 'Aliados', slug: 'aliados' },
  { id: 'contacto', label: 'Contacto', slug: 'contacto' },
];

export const SITE_SETTING_KEYS = [
  'home_hero_title',
  'home_hero_subtitle',
  'home_cta_text',
  'contact_email',
  'contact_whatsapp_dial_code',
  'contact_whatsapp_number',
  'contact_city',
  'contact_country',
  'social_instagram',
  'social_linkedin',
  'social_facebook',
  'logo_url',
  'favicon_url',
  'seo_title',
  'seo_description',
  'site_url',
  'nav_links',
  ...Object.values(SITE_PAGE_KEYS),
] as const;

function throwIf(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function setting(values: SiteSettings, key: string, fallback = ''): string {
  return (values[key] ?? '').trim() || fallback;
}

export function pageVisible(values: SiteSettings, page: SitePageId): boolean {
  return values[SITE_PAGE_KEYS[page]] !== 'false';
}

const PATH_PAGE: Record<string, SitePageId> = {
  '/nosotros': 'nosotros',
  '/comunidad': 'comunidad',
  '/aliados': 'aliados',
  '/contacto': 'contacto',
  '/tienda': 'tienda',
};

export function pathVisible(values: SiteSettings, pathname: string): boolean {
  const page = PATH_PAGE[pathname];
  if (!page) return true;
  return pageVisible(values, page);
}

export async function getPublicSettings(keys?: string[]): Promise<SiteSettings> {
  let query = supabase.from('public_settings').select('key, value');
  if (keys?.length) query = query.in('key', keys);
  const { data, error } = await query;
  throwIf(error);
  return Object.fromEntries((data ?? []).map((row) => [row.key, row.value ?? '']));
}

export async function upsertPublicSettings(entries: Record<string, string>): Promise<void> {
  const rows = Object.entries(entries).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));
  if (!rows.length) return;
  const { error } = await supabase.from('public_settings').upsert(rows);
  throwIf(error);
}

export async function listSiteEvents(): Promise<SiteEventRow[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, name, slug, is_public, is_featured, publication_status, operational_status')
    .order('start_date', { ascending: false });
  throwIf(error);
  return (data ?? []) as SiteEventRow[];
}

export async function patchSiteEvent(
  id: string,
  patch: Partial<Pick<SiteEventRow, 'is_public' | 'is_featured' | 'publication_status'>>,
): Promise<void> {
  const { error } = await supabase.from('events').update(patch).eq('id', id);
  throwIf(error);
}

export async function setFeaturedSiteEvent(eventId: string, events: SiteEventRow[]): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({ is_featured: true, is_public: true, publication_status: 'publicado' })
    .eq('id', eventId);
  throwIf(error);
  await Promise.all(
    events
      .filter((event) => event.id !== eventId && event.is_featured)
      .map((event) => patchSiteEvent(event.id, { is_featured: false })),
  );
}

export async function listSiteProducts(): Promise<SiteProductRow[]> {
  const { data, error } = await supabase
    .from('info_products')
    .select('id, name, price, status, featured')
    .order('name');
  throwIf(error);
  return (data ?? []) as SiteProductRow[];
}

export async function setSiteProductVisible(id: string, visible: boolean): Promise<void> {
  const { error } = await supabase
    .from('info_products')
    .update({ status: visible ? 'publicado' : 'borrador' })
    .eq('id', id);
  throwIf(error);
}

export async function listContactMessages(): Promise<ContactMessageRow[]> {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('id, reason, name, email, whatsapp, company, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(30);
  throwIf(error);
  return (data ?? []) as ContactMessageRow[];
}

export async function markContactMessageAttended(id: string): Promise<void> {
  const { error } = await supabase.from('contact_messages').update({ status: 'atendido' }).eq('id', id);
  throwIf(error);
}

export function featuredSiteEvent(events: SiteEventRow[]): SiteEventRow | null {
  return events.find((event) => event.is_featured && event.is_public) ?? events.find((event) => event.is_public) ?? null;
}

export async function listFeaturedEventSponsors(events: SiteEventRow[]): Promise<{
  event: SiteEventRow | null;
  sponsors: EventSponsorRow[];
}> {
  const event = featuredSiteEvent(events);
  if (!event) return { event: null, sponsors: [] };
  const sponsors = await listEventSponsors(event.id).catch(() => [] as EventSponsorRow[]);
  return { event, sponsors };
}

export const BANNER_TIERS: { id: PlanTier; label: string; color: string }[] = [
  { id: 'platino', label: 'Platino', color: '#E5C97B' },
  { id: 'oro', label: 'Oro', color: '#C9A84C' },
  { id: 'plata', label: 'Plata', color: '#A0A8B8' },
  { id: 'bronce', label: 'Bronce', color: '#B87333' },
  { id: 'aliado', label: 'Aliado', color: '#00C9A0' },
];

export function siteUrlFromDomain(domain: string): string {
  const trimmed = domain.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function domainFromSiteUrl(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}
