import { supabase } from '../supabaseClient';

export type PlanTier = 'platino' | 'oro' | 'plata' | 'bronce' | 'aliado';
export type SponsorStatus = 'activo' | 'pendiente_pago' | 'negociacion' | 'declinado';

export type EventSponsorRow = {
  id: string;
  event_id: string;
  company_id: string;
  company_name: string;
  logo: string;
  contact_name: string;
  contact_email: string;
  contact_tel: string;
  plan: PlanTier;
  amount: number;
  status: SponsorStatus;
  benefits_checked: number;
  benefits_total: number;
  notas: string;
};

export type EventSponsorWrite = {
  company_id: string;
  company_name?: string;
  logo: string;
  contact_name: string;
  contact_email: string;
  contact_tel: string;
  plan: PlanTier;
  amount: number;
  status: SponsorStatus;
  benefits_checked: number;
  benefits_total: number;
  notas: string;
};

type CompanyEmbed = { trade_name: string; logo_url: string | null };
type QueryRow = {
  id: string;
  event_id: string;
  company_id: string;
  company_name: string | null;
  logo_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_tel: string | null;
  plan: string;
  amount: number;
  status: string;
  benefits_checked: number;
  benefits_total: number;
  notes: string | null;
  companies: CompanyEmbed | CompanyEmbed[] | null;
};

const SELECT = `
  id, event_id, company_id, company_name, logo_url, contact_name, contact_email, contact_tel,
  plan, amount, status, benefits_checked, benefits_total, notes,
  companies:company_id(trade_name, logo_url)
`.replace(/\s+/g, ' ').trim();

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function asPlan(value: string): PlanTier {
  if (value === 'platino' || value === 'oro' || value === 'plata' || value === 'bronce' || value === 'aliado') return value;
  return 'oro';
}

function asStatus(value: string): SponsorStatus {
  if (value === 'activo' || value === 'pendiente_pago' || value === 'negociacion' || value === 'declinado') return value;
  return 'negociacion';
}

function mapRow(row: QueryRow): EventSponsorRow {
  const company = one(row.companies);
  return {
    id: row.id,
    event_id: row.event_id,
    company_id: row.company_id,
    company_name: row.company_name || company?.trade_name || 'Empresa',
    logo: row.logo_url || company?.logo_url || '',
    contact_name: row.contact_name ?? '',
    contact_email: row.contact_email ?? '',
    contact_tel: row.contact_tel ?? '',
    plan: asPlan(row.plan),
    amount: Number(row.amount) || 0,
    status: asStatus(row.status),
    benefits_checked: row.benefits_checked ?? 0,
    benefits_total: row.benefits_total ?? 5,
    notas: row.notes ?? '',
  };
}

function throwIf(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === '23505') throw new Error('Esa empresa ya es patrocinadora de este evento.');
  throw error;
}

function payloadFrom(eventId: string, input: EventSponsorWrite) {
  return {
    event_id: eventId,
    company_id: input.company_id,
    company_name: input.company_name?.trim() || null,
    logo_url: input.logo.trim() || null,
    contact_name: input.contact_name.trim() || null,
    contact_email: input.contact_email.trim() || null,
    contact_tel: input.contact_tel.trim() || null,
    plan: input.plan,
    amount: input.amount,
    status: input.status,
    benefits_checked: input.benefits_checked,
    benefits_total: input.benefits_total,
    notes: input.notas.trim() || null,
  };
}

export async function listEventSponsors(eventId: string): Promise<EventSponsorRow[]> {
  const { data, error } = await supabase
    .from('event_sponsors')
    .select(SELECT)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  throwIf(error);
  return (data as QueryRow[] | null)?.map(mapRow) ?? [];
}

export async function listPublicSponsors(eventId: string): Promise<EventSponsorRow[]> {
  const { data, error } = await supabase
    .from('event_sponsors')
    .select(SELECT)
    .eq('event_id', eventId)
    .eq('status', 'activo')
    .order('created_at', { ascending: true });
  throwIf(error);
  return (data as QueryRow[] | null)?.map(mapRow) ?? [];
}

export async function createEventSponsor(eventId: string, input: EventSponsorWrite): Promise<EventSponsorRow> {
  const { data, error } = await supabase
    .from('event_sponsors')
    .insert(payloadFrom(eventId, input))
    .select(SELECT)
    .single();
  throwIf(error);
  return mapRow(data as unknown as QueryRow);
}

export async function updateEventSponsor(id: string, eventId: string, input: EventSponsorWrite): Promise<EventSponsorRow> {
  const { data, error } = await supabase
    .from('event_sponsors')
    .update(payloadFrom(eventId, input))
    .eq('id', id)
    .select(SELECT)
    .single();
  throwIf(error);
  return mapRow(data as unknown as QueryRow);
}

export async function deleteEventSponsor(id: string): Promise<void> {
  const { error } = await supabase.from('event_sponsors').delete().eq('id', id);
  throwIf(error);
}
