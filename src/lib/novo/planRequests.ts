import { getEditionByNovoSlug } from '../../data/editions';
import { supabase } from '../supabaseClient';

export type PlanRequestStatus = 'nueva' | 'en-conversacion' | 'aprobada' | 'descartada';

export type PlanRequestRow = {
  id: string;
  edition_id: string;
  plan_id: string | null;
  ally_role: string | null;
  company: string;
  nit: string | null;
  contact_name: string;
  contact_email: string;
  contact_whatsapp: string | null;
  category: string | null;
  country: string | null;
  city: string | null;
  notes: string | null;
  status: PlanRequestStatus;
  created_at: string;
};

const ALLY_LABELS: Record<string, string> = {
  'sociedad-medica': 'Sociedad médica o científica',
  'aliado-academico': 'Universidad o grupo de investigación',
  'media-partner': 'Medio especializado',
};

const PLAN_LABELS: Record<string, string> = {
  protagonista: 'Paquete Protagonista',
  conexion: 'Paquete Conexión',
  'pop-up': 'Pop Up',
};

function asStatus(value: string): PlanRequestStatus {
  if (value === 'nueva' || value === 'en-conversacion' || value === 'aprobada' || value === 'descartada') return value;
  return 'nueva';
}

function mapRow(row: Record<string, unknown>): PlanRequestRow {
  return {
    id: String(row.id),
    edition_id: String(row.edition_id ?? ''),
    plan_id: (row.plan_id as string | null) ?? null,
    ally_role: (row.ally_role as string | null) ?? null,
    company: String(row.company ?? ''),
    nit: (row.nit as string | null) ?? null,
    contact_name: String(row.contact_name ?? ''),
    contact_email: String(row.contact_email ?? ''),
    contact_whatsapp: (row.contact_whatsapp as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    status: asStatus(String(row.status ?? 'nueva')),
    created_at: String(row.created_at ?? ''),
  };
}

export function planRequestKindLabel(row: Pick<PlanRequestRow, 'plan_id' | 'ally_role'>): string {
  if (row.plan_id) return PLAN_LABELS[row.plan_id] ?? row.plan_id;
  if (row.ally_role) return ALLY_LABELS[row.ally_role] ?? row.ally_role;
  return 'Sin plan';
}

export function editionIdsForNovoEvent(event: { id: string; slug: string }): string[] {
  const catalogId = getEditionByNovoSlug(event.slug)?.id;
  return [...new Set([event.id, catalogId].filter(Boolean) as string[])];
}

export async function listPlanRequestsForEvent(event: { id: string; slug: string }): Promise<PlanRequestRow[]> {
  const ids = editionIdsForNovoEvent(event);
  const query = supabase
    .from('plan_requests')
    .select('*')
    .in('edition_id', ids)
    .order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function submitPublicPlanRequest(input: {
  editionId: string;
  planId: string | null;
  company: string;
  nit: string | null;
  contactName: string;
  contactEmail: string;
  contactWhatsapp: string | null;
  category: string | null;
  country: string | null;
  city: string | null;
  notes: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc('submit_plan_request', {
    p_edition_id: input.editionId,
    p_plan_id: input.planId,
    p_ally_role: null,
    p_company: input.company,
    p_nit: input.nit,
    p_category: input.category,
    p_country: input.country,
    p_city: input.city,
    p_contact_name: input.contactName,
    p_contact_email: input.contactEmail,
    p_contact_whatsapp: input.contactWhatsapp,
    p_notes: input.notes,
  });
  if (error || !data) {
    throw new Error(error?.message || 'No pudimos enviar tu solicitud. Intenta de nuevo en un momento.');
  }
  return String(data);
}

export async function updatePlanRequestStatus(id: string, status: PlanRequestStatus): Promise<PlanRequestRow> {
  const { data, error } = await supabase
    .from('plan_requests')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}
