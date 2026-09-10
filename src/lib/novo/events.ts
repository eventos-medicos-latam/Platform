import { supabase } from '../supabaseClient';
import type {
  NovoEvent, DashboardStats, EventKpis, EventRegistration, NovoEventType, NovoEventModality,
  NovoEventAudience, NovoEventOperationalStatus, NovoEventPublicationStatus,
} from '../../types/novo';

export type EventWrite = {
  name: string;
  slug?: string;
  tagline?: string | null;
  description?: string | null;
  event_type: NovoEventType;
  modality: NovoEventModality;
  audience: NovoEventAudience;
  operational_status: NovoEventOperationalStatus;
  publication_status?: NovoEventPublicationStatus;
  is_public: boolean;
  is_free: boolean;
  is_featured: boolean;
  start_date: string;
  end_date: string;
  start_time?: string | null;
  end_time?: string | null;
  timezone?: string;
  venue_name?: string | null;
  venue_city?: string | null;
  venue_address?: string | null;
  venue_country?: string | null;
  platform_name?: string | null;
  platform_url?: string | null;
  max_capacity?: number | null;
  has_certificate: boolean;
  certificate_send_at?: string | null;
  contracting_company_id?: string | null;
  cover_image_url?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  goals?: Record<string, number> | null;
};

export type EventSettingsPatch = {
  sections: {
    hero: boolean; info: boolean; speakers: boolean; agenda: boolean;
    tickets: boolean; sponsors: boolean; stands: boolean; gallery: boolean;
    location: boolean; faq: boolean; contact: boolean; cta: boolean;
  };
  custom: Record<string, unknown>;
};

export const DEFAULT_EVENT_SECTIONS: EventSettingsPatch['sections'] = {
  hero: true, info: true, speakers: true, agenda: true,
  tickets: true, sponsors: true, stands: true, gallery: false,
  location: true, faq: true, contact: true, cta: true,
};

export type EventWebFaq = { q: string; a: string };

export type EventWebTrackIcon = 'gut' | 'hormone' | 'immune' | 'sleep' | 'cell' | 'skin';

export type EventWebEje = {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  icon?: EventWebTrackIcon;
};

export type EventWebAlly = { name: string; logo_url?: string };
export type EventWebStat = { label: string; value: string };

export type EventWebContent = {
  hero_title?: string;
  hero_subtitle?: string;
  hero_kicker?: string;
  hero_logo?: string;
  hero_cta_label?: string;
  hero_cta_url?: string;
  hero_image?: string;
  concepto_title?: string;
  concepto_lead?: string;
  concepto_body?: string;
  concepto_image?: string;
  concepto_caption?: string;
  publico_title?: string;
  publico_items?: string[];
  beneficios_title?: string;
  beneficios_items?: string[];
  ejes_kicker?: string;
  ejes_title?: string;
  ejes_subtitle?: string;
  ejes_label?: string;
  ejes_question?: string;
  ejes_items?: EventWebEje[];
  experiencia_name?: string;
  experiencia_duration?: string;
  experiencia_body?: string;
  experiencia_channels?: string[];
  certificacion_body?: string;
  patrocinadores_title?: string;
  patrocinadores_body?: string;
  aliados_title?: string;
  aliados_items?: EventWebAlly[];
  stands_title?: string;
  stands_body?: string;
  ubicacion_venue?: string;
  ubicacion_address?: string;
  ubicacion_city?: string;
  ubicacion_maps?: string;
  ubicacion_transport?: string;
  faq_items?: EventWebFaq[];
  resultados_title?: string;
  resultados_items?: EventWebStat[];
  cta_title?: string;
  cta_body?: string;
  cta_label?: string;
  cta_url?: string;
  galeria_images?: string[];
  seo_title?: string;
  seo_description?: string;
  seo_image?: string;
};

export type PublicEventWeb = {
  sections: EventSettingsPatch['sections'];
  extra: Record<string, boolean>;
  content: EventWebContent;
};

export function parseEventWeb(settings: EventSettingsPatch | null): PublicEventWeb | null {
  if (!settings) return null;
  const raw = settings.custom.web;
  const web = (raw && typeof raw === 'object') ? raw as { extra?: Record<string, boolean>; content?: EventWebContent } : {};
  return {
    sections: settings.sections,
    extra: web.extra ?? {},
    content: web.content ?? {},
  };
}

export function webSectionOn(web: PublicEventWeb | null, dbKey: keyof EventSettingsPatch['sections']): boolean {
  if (!web) return DEFAULT_EVENT_SECTIONS[dbKey];
  return web.sections[dbKey];
}

export function webExtraOn(web: PublicEventWeb | null, id: string, fallback = false): boolean {
  if (!web) return fallback;
  return web.extra[id] ?? fallback;
}

type EventRow = NovoEvent & {
  companies?: { id: string; trade_name: string } | null;
};

function slugify(name: string) {
  const base = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return base || `evento-${Date.now()}`;
}

function mapEvent(row: EventRow): NovoEvent {
  const { companies, ...rest } = row;
  return {
    ...rest,
    start_time: rest.start_time ? String(rest.start_time).slice(0, 5) : undefined,
    end_time: rest.end_time ? String(rest.end_time).slice(0, 5) : undefined,
    contracting_company: companies
      ? { id: companies.id, name: companies.trade_name }
      : rest.contracting_company_id
        ? { id: rest.contracting_company_id, name: '' }
        : undefined,
  };
}

const EVENT_SELECT = '*, companies:contracting_company_id(id, trade_name)';

type EventStat = { count: number; revenue: number };

async function loadEventStats(eventIds: string[]): Promise<Record<string, EventStat>> {
  const stats: Record<string, EventStat> = {};
  for (const id of eventIds) stats[id] = { count: 0, revenue: 0 };
  if (eventIds.length === 0) return stats;
  const { data, error } = await supabase
    .from('event_registrations')
    .select('event_id, amount_paid, status')
    .in('event_id', eventIds);
  if (error) throw error;
  for (const row of data ?? []) {
    if (row.status === 'cancelado') continue;
    const bucket = stats[row.event_id] ?? { count: 0, revenue: 0 };
    bucket.count += 1;
    bucket.revenue += Number(row.amount_paid) || 0;
    stats[row.event_id] = bucket;
  }
  return stats;
}

function withStats(event: NovoEvent, stats: Record<string, EventStat>): NovoEvent {
  const bucket = stats[event.id];
  if (!bucket) return event;
  return { ...event, registrations_count: bucket.count, revenue: bucket.revenue };
}

export async function listEvents(): Promise<NovoEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .order('start_date', { ascending: false });
  if (error) throw error;
  const events = (data as EventRow[] | null)?.map(mapEvent) ?? [];
  const stats = await loadEventStats(events.map((event) => event.id));
  return events.map((event) => withStats(event, stats));
}

export async function getEvent(id: string): Promise<NovoEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const event = mapEvent(data as EventRow);
  const stats = await loadEventStats([event.id]);
  return withStats(event, stats);
}

const PUBLIC_EVENT_SELECT = '*';

export async function getEventBySlug(slug: string): Promise<NovoEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select(PUBLIC_EVENT_SELECT)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEvent(data as EventRow) : null;
}

export async function listPublicEvents(): Promise<NovoEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select(PUBLIC_EVENT_SELECT)
    .eq('is_public', true)
    .in('publication_status', ['publicado', 'vista-previa'])
    .order('start_date', { ascending: true });
  if (error) throw error;
  return (data as EventRow[] | null)?.map(mapEvent) ?? [];
}

const LIVE_PUBLIC: NovoEventOperationalStatus[] = ['proximo', 'activo'];

export function publicEventPath(event: Pick<NovoEvent, 'slug'>): string {
  return `/e/${event.slug}`;
}

export function publicVenueLabel(event: Pick<NovoEvent, 'venue_name' | 'venue_city' | 'venue_country'>): string {
  const name = event.venue_name?.trim() || '';
  const city = event.venue_city?.trim() || '';
  const country = event.venue_country?.trim() || '';
  const haystack = `${name} ${city}`.toLowerCase();
  const parts: string[] = [];
  if (name) parts.push(name);
  if (city && !name.toLowerCase().includes(city.toLowerCase())) parts.push(city);
  if (country && !haystack.includes(country.toLowerCase())) parts.push(country);
  return parts.join(' · ') || 'Colombia';
}

export function publicDateLabel(start: string, end?: string): string {
  const from = new Date(`${start.slice(0, 10)}T12:00:00`);
  const to = new Date(`${(end || start).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(from.getTime())) return start;
  if (start.slice(0, 10) === (end || start).slice(0, 10)) {
    return from.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return `${from.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })} – ${to.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

export function eventAccentRgb(event: Pick<NovoEvent, 'accent_color' | 'primary_color'>): string {
  const raw = (event.accent_color || event.primary_color || '#00C9A0').replace('#', '').trim();
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw.padEnd(6, '0').slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return '0 201 160';
  return `${n >> 16 & 255} ${n >> 8 & 255} ${n & 255}`;
}

export async function getFeaturedPublicEvent(): Promise<NovoEvent | null> {
  const all = await listPublicEvents();
  const featured = all
    .filter((event) => event.is_featured && LIVE_PUBLIC.includes(event.operational_status))
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  if (featured[0]) return featured[0];
  return all.find((event) => LIVE_PUBLIC.includes(event.operational_status)) ?? all[0] ?? null;
}

export async function createEvent(input: EventWrite): Promise<NovoEvent> {
  const payload = {
    ...input,
    slug: input.slug || slugify(input.name),
    timezone: input.timezone ?? 'America/Bogota',
    publication_status: input.publication_status ?? 'borrador',
    venue_country: input.venue_country || 'Colombia',
  };
  const { data, error } = await supabase
    .from('events')
    .insert(payload)
    .select(EVENT_SELECT)
    .single();
  if (error) throw error;
  return mapEvent(data as EventRow);
}

export async function updateEvent(id: string, input: EventWrite): Promise<NovoEvent> {
  const { data, error } = await supabase
    .from('events')
    .update(input)
    .eq('id', id)
    .select(EVENT_SELECT)
    .single();
  if (error) throw error;
  return mapEvent(data as EventRow);
}

export async function patchEvent(
  id: string,
  patch: Partial<EventWrite> & { publication_status?: NovoEventPublicationStatus },
): Promise<NovoEvent> {
  const { data, error } = await supabase
    .from('events')
    .update(patch)
    .eq('id', id)
    .select(EVENT_SELECT)
    .single();
  if (error) throw error;
  return mapEvent(data as EventRow);
}

export async function getEventSettings(eventId: string): Promise<EventSettingsPatch | null> {
  const { data, error } = await supabase
    .from('event_settings')
    .select('sections, custom')
    .eq('event_id', eventId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const sections = { ...DEFAULT_EVENT_SECTIONS, ...(data.sections as Partial<EventSettingsPatch['sections']> | null) };
  const custom = (data.custom && typeof data.custom === 'object') ? data.custom as Record<string, unknown> : {};
  return { sections, custom };
}

export async function getPublicEventWeb(eventId: string): Promise<PublicEventWeb | null> {
  try {
    return parseEventWeb(await getEventSettings(eventId));
  } catch {
    return null;
  }
}

export async function upsertEventSettings(eventId: string, input: EventSettingsPatch): Promise<void> {
  const { error } = await supabase
    .from('event_settings')
    .upsert(
      { event_id: eventId, sections: input.sections, custom: input.custom, updated_at: new Date().toISOString() },
      { onConflict: 'event_id' },
    );
  if (error) throw error;
}

export async function duplicateEvent(event: NovoEvent): Promise<NovoEvent> {
  const copy = await createEvent({
    name: `${event.name} (copia)`,
    slug: `${slugify(event.name)}-copia-${Date.now().toString(36)}`,
    tagline: event.tagline ?? null,
    description: event.description ?? null,
    event_type: event.event_type,
    modality: event.modality,
    audience: event.audience,
    operational_status: 'borrador',
    publication_status: 'borrador',
    is_public: false,
    is_free: event.is_free,
    is_featured: false,
    start_date: event.start_date,
    end_date: event.end_date,
    start_time: event.start_time ?? null,
    end_time: event.end_time ?? null,
    timezone: event.timezone,
    venue_name: event.venue_name ?? null,
    venue_city: event.venue_city ?? null,
    venue_address: event.venue_address ?? null,
    venue_country: event.venue_country ?? 'Colombia',
    platform_name: event.platform_name ?? null,
    platform_url: event.platform_url ?? null,
    max_capacity: event.max_capacity ?? null,
    has_certificate: event.has_certificate,
    certificate_send_at: event.certificate_send_at ?? null,
    contracting_company_id: event.contracting_company_id ?? event.contracting_company?.id ?? null,
    cover_image_url: event.cover_image_url ?? null,
    logo_url: event.logo_url ?? null,
    primary_color: event.primary_color ?? null,
    accent_color: event.accent_color ?? null,
    goals: event.goals ?? null,
  });
  const settings = await getEventSettings(event.id);
  if (settings) await upsertEventSettings(copy.id, settings);
  return copy;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    { count: total_events },
    { count: active_events },
    { count: upcoming_events },
    { count: total_companies },
    { data: regs },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('operational_status', 'activo'),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('operational_status', 'proximo'),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('event_registrations').select('amount_paid, status'),
  ]);
  const live = (regs ?? []).filter((row) => row.status !== 'cancelado');
  return {
    total_events: total_events ?? 0,
    active_events: active_events ?? 0,
    upcoming_events: upcoming_events ?? 0,
    total_registrations: live.length,
    total_revenue: live.reduce((sum, row) => sum + (Number(row.amount_paid) || 0), 0),
    total_companies: total_companies ?? 0,
  };
}

export async function getEventKpis(_eventId: string): Promise<EventKpis | null> {
  return null;
}

export async function getRecentRegistrations(): Promise<EventRegistration[]> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('id, person_id, event_id, registration_type, origin, amount_paid, status, attended, created_at, people:person_id(id, full_name), events:event_id(id, name, slug)')
    .order('created_at', { ascending: false })
    .limit(8);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const person = Array.isArray(row.people) ? row.people[0] : row.people;
    const event = Array.isArray(row.events) ? row.events[0] : row.events;
    return {
      id: row.id,
      person_id: row.person_id,
      event_id: row.event_id,
      registration_type: row.registration_type as EventRegistration['registration_type'],
      origin: row.origin as EventRegistration['origin'],
      amount_paid: Number(row.amount_paid) || 0,
      status: (row.status === 'asistio' || row.status === 'espera' || row.status === 'cancelado' || row.status === 'confirmado')
        ? row.status
        : (row.attended ? 'asistio' : 'confirmado'),
      attended: Boolean(row.attended) || row.status === 'asistio',
      created_at: row.created_at,
      person: person ? { id: person.id, full_name: person.full_name } : undefined,
      event: event ? { id: event.id, name: event.name, slug: event.slug } : undefined,
    };
  });
}

export async function getAgreements() {
  return [];
}

export type NovoAlert = {
  id: string;
  level: 'alta' | 'media' | 'baja';
  message: string;
  link: string;
  event?: string;
};

export async function getAlerts(): Promise<NovoAlert[]> {
  const [{ count: espera }, { count: libres }] = await Promise.all([
    supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('status', 'espera'),
    supabase.from('stand_units').select('*', { count: 'exact', head: true }).eq('status', 'disponible'),
  ]);
  const alerts: NovoAlert[] = [];
  if ((espera ?? 0) > 0) {
    alerts.push({
      id: 'espera',
      level: 'alta',
      message: `${espera} inscripciones en espera de pago`,
      link: '/novo/registros',
    });
  }
  if ((libres ?? 0) > 0) {
    alerts.push({
      id: 'stands',
      level: 'media',
      message: `${libres} stands disponibles sin asignar`,
      link: '/novo/stands',
    });
  }
  return alerts;
}

export async function getEventAlerts(event: NovoEvent): Promise<{ id: string; type: 'warning' | 'info' | 'ok'; text: string }[]> {
  const [{ count: espera }, { count: libres }] = await Promise.all([
    supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', event.id).eq('status', 'espera'),
    supabase.from('stand_units').select('*', { count: 'exact', head: true }).eq('event_id', event.id).eq('status', 'disponible'),
  ]);
  const alerts: { id: string; type: 'warning' | 'info' | 'ok'; text: string }[] = [];
  if ((espera ?? 0) > 0) alerts.push({ id: 'espera', type: 'warning', text: `${espera} inscripciones en espera de pago` });
  if ((libres ?? 0) > 0) alerts.push({ id: 'stands', type: 'info', text: `${libres} stands disponibles sin asignar` });
  if (event.publication_status === 'publicado' && event.is_public) {
    alerts.push({ id: 'web', type: 'ok', text: 'Microsite publicado y visible al público' });
  } else {
    alerts.push({ id: 'web', type: 'info', text: 'Microsite aún no publicado' });
  }
  return alerts;
}

export function formatCurrency(value: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(iso));
}

export function formatDateShort(iso: string) {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric', month: 'short',
  }).format(new Date(iso));
}
