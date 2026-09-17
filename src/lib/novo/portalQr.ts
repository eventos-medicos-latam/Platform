import { supabase } from '../supabaseClient';
import { normalizeQrToken } from './scanner';

export type PortalQrStand = { id: string; label: string };
export type PortalQrEvent = {
  id: string;
  name: string;
  start_date?: string | null;
  stands: PortalQrStand[];
};

export type PortalQrContext = {
  company_id: string;
  scanner_person_id: string;
  scanner_name: string;
  events: PortalQrEvent[];
};

export type PortalQrCapture = {
  ok: boolean;
  duplicate: boolean;
  message: string;
  name?: string;
  previous_at?: string;
  previous_by?: string;
  contact_id?: string;
};

export type PortalQrContact = {
  id: string;
  occurred_at: string;
  note: string | null;
  event_id: string;
  event_name: string | null;
  stand_unit_id: string | null;
  stand_label: string | null;
  scanner_person_id: string | null;
  scanner_name: string | null;
  person_id: string;
  person_name: string;
  specialty: string | null;
  email: string | null;
  phone: string | null;
};

const EVENT_KEY = 'portal-qr-event-id';
const standKey = (eventId: string) => `portal-qr-stand-id:${eventId}`;

function throwIf(error: { message: string } | null) {
  if (error) throw error;
}

export async function loadPortalQrContext(): Promise<PortalQrContext> {
  const { data, error } = await supabase.rpc('company_qr_scan_context');
  throwIf(error);
  const raw = (data ?? {}) as PortalQrContext;
  return {
    company_id: raw.company_id,
    scanner_person_id: raw.scanner_person_id,
    scanner_name: raw.scanner_name ?? '',
    events: Array.isArray(raw.events) ? raw.events.map((event) => ({
      ...event,
      stands: Array.isArray(event.stands) ? event.stands : [],
    })) : [],
  };
}

export function pickPortalQrEventId(events: PortalQrEvent[]): string {
  if (events.length === 0) return '';
  try {
    const stored = sessionStorage.getItem(EVENT_KEY);
    if (stored && events.some((event) => event.id === stored)) return stored;
  } catch {
    /* ignore */
  }
  return events[0].id;
}

export function rememberPortalQrEventId(eventId: string) {
  try {
    if (eventId) sessionStorage.setItem(EVENT_KEY, eventId);
  } catch {
    /* ignore */
  }
}

export function pickPortalQrStandId(event: PortalQrEvent | undefined): string {
  if (!event) return '';
  if (event.stands.length === 1) return event.stands[0].id;
  try {
    const stored = sessionStorage.getItem(standKey(event.id));
    if (stored && event.stands.some((stand) => stand.id === stored)) return stored;
  } catch {
    /* ignore */
  }
  return '';
}

export function rememberPortalQrStandId(eventId: string, standId: string) {
  try {
    if (eventId && standId) sessionStorage.setItem(standKey(eventId), standId);
  } catch {
    /* ignore */
  }
}

export async function capturePortalQrLead(input: {
  token: string;
  eventId: string;
  standId?: string;
  note?: string;
}): Promise<PortalQrCapture> {
  const token = normalizeQrToken(input.token);
  const { data, error } = await supabase.rpc('capture_company_qr_lead', {
    p_token: token,
    p_event_id: input.eventId,
    p_stand_unit_id: input.standId || null,
    p_note: input.note?.trim() || null,
  });
  throwIf(error);
  return data as PortalQrCapture;
}

export async function listPortalQrContacts(): Promise<PortalQrContact[]> {
  const { data, error } = await supabase.rpc('list_company_qr_contacts');
  throwIf(error);
  return (data ?? []) as PortalQrContact[];
}

export async function updatePortalQrNote(id: string, note: string): Promise<void> {
  const { error } = await supabase.rpc('update_company_qr_lead_note', {
    p_id: id,
    p_note: note,
  });
  throwIf(error);
}

export function exportPortalQrCsv(rows: PortalQrContact[]) {
  const header = ['Fecha', 'Evento', 'Stand', 'Asistente', 'Especialidad', 'Email', 'Teléfono', 'Colaborador', 'Nota'];
  const body = rows.map((row) => [
    row.occurred_at,
    row.event_name ?? '',
    row.stand_label ?? '',
    row.person_name,
    row.specialty ?? '',
    row.email ?? '',
    row.phone ?? '',
    row.scanner_name ?? '',
    row.note ?? '',
  ]);
  const csv = [header, ...body]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contactos-qr-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
