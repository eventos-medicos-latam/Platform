import { supabase } from '../supabaseClient';
import type { NovoEvent } from '../../types/novo';

export type ScanInteractionKey = 'entrada' | 'coffee' | 'lunch' | 'kit' | 'vip' | 'certificado';

export type ScanLogEntry = {
  id: string;
  person: string;
  interaction: ScanInteractionKey;
  ok: boolean;
  result: 'ok' | 'denied' | 'duplicate';
  occurred_at: string;
};

export type ScanOutcome = {
  ok: boolean;
  result: 'ok' | 'denied' | 'duplicate';
  name: string;
  message: string;
};

const ONCE: ScanInteractionKey[] = ['entrada', 'kit', 'certificado'];
const ONCE_PER_DAY: ScanInteractionKey[] = ['coffee', 'lunch'];
const KNOWN: ScanInteractionKey[] = ['entrada', 'coffee', 'lunch', 'kit', 'vip', 'certificado'];
const ADMIT: string[] = ['confirmado', 'asistio'];
const EVENT_STORAGE_KEY = 'novo-scanner-event-id';

function bogotaDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

function throwIf(error: { message: string } | null) {
  if (error) throw error;
}

export function normalizeQrToken(raw: string): string {
  const trimmed = raw.trim().replace(/^qr:/i, '');
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get('qr')
      || url.searchParams.get('token')
      || url.searchParams.get('code');
    if (fromQuery?.trim()) return fromQuery.trim();
    const last = url.pathname.split('/').filter(Boolean).pop();
    if (last) return decodeURIComponent(last);
  } catch {
    /* not a URL */
  }
  return trimmed;
}

export function pickScannerEventId(events: NovoEvent[]): string {
  if (events.length === 0) return '';
  try {
    const stored = sessionStorage.getItem(EVENT_STORAGE_KEY);
    if (stored && events.some((event) => event.id === stored)) return stored;
  } catch {
    /* ignore */
  }
  const featured = events.find((event) => event.is_featured);
  const live = events.find((event) => event.operational_status === 'activo');
  const next = events.find((event) => event.operational_status === 'proximo');
  return (featured ?? live ?? next ?? events[0]).id;
}

export function rememberScannerEventId(eventId: string) {
  try {
    if (eventId) sessionStorage.setItem(EVENT_STORAGE_KEY, eventId);
  } catch {
    /* ignore */
  }
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function findPersonQr(token: string) {
  const candidates = [...new Set([token, safeDecode(token)].filter(Boolean))];
  for (const value of candidates) {
    const { data, error } = await supabase
      .from('person_qr')
      .select('id, person_id')
      .eq('qr_token', value)
      .maybeSingle();
    throwIf(error);
    if (data) return data;
  }
  return null;
}

async function logDenied(personQrId: string, eventId: string, interaction: ScanInteractionKey) {
  const { error } = await supabase.from('qr_interactions').insert({
    person_qr_id: personQrId,
    event_id: eventId,
    note: interaction,
    result: 'denied',
  });
  throwIf(error);
}

export async function scanPersonQr(input: {
  eventId: string;
  token: string;
  interaction: ScanInteractionKey;
}): Promise<ScanOutcome> {
  const token = normalizeQrToken(input.token);
  if (!token) {
    return { ok: false, result: 'denied', name: '', message: 'Pega o escanea el código QR del asistente.' };
  }

  const qr = await findPersonQr(token);
  if (!qr) {
    return { ok: false, result: 'denied', name: 'QR no encontrado', message: 'Este código no está registrado.' };
  }

  const { data: peopleRow, error: peopleError } = await supabase
    .from('people')
    .select('full_name')
    .eq('id', qr.person_id)
    .maybeSingle();
  throwIf(peopleError);
  const name = peopleRow?.full_name ?? 'Asistente';

  const { data: regs, error: regError } = await supabase
    .from('event_registrations')
    .select('id, status')
    .eq('event_id', input.eventId)
    .eq('person_id', qr.person_id)
    .neq('status', 'cancelado')
    .order('created_at', { ascending: false });
  throwIf(regError);

  const rows = regs ?? [];
  const admitted = rows.filter((row) => ADMIT.includes(row.status));
  const waiting = rows.filter((row) => row.status === 'espera');

  if (admitted.length === 0 && waiting.length > 0) {
    await logDenied(qr.id, input.eventId, input.interaction);
    return { ok: false, result: 'denied', name, message: 'Pago pendiente. No puede ingresar.' };
  }
  if (admitted.length === 0) {
    await logDenied(qr.id, input.eventId, input.interaction);
    return { ok: false, result: 'denied', name, message: 'No tiene inscripción vigente en este evento.' };
  }

  const { data: previous, error: prevError } = await supabase
    .from('qr_interactions')
    .select('id, occurred_at')
    .eq('person_qr_id', qr.id)
    .eq('event_id', input.eventId)
    .eq('note', input.interaction)
    .eq('result', 'ok');
  throwIf(prevError);

  let result: 'ok' | 'duplicate' = 'ok';
  const prev = previous ?? [];
  if (ONCE.includes(input.interaction) && prev.length > 0) result = 'duplicate';
  if (ONCE_PER_DAY.includes(input.interaction)) {
    const today = bogotaDay(new Date().toISOString());
    if (prev.some((row) => bogotaDay(row.occurred_at) === today)) result = 'duplicate';
  }

  const { error: insertError } = await supabase.from('qr_interactions').insert({
    person_qr_id: qr.id,
    event_id: input.eventId,
    note: input.interaction,
    result,
  });
  throwIf(insertError);

  if (result === 'ok' && input.interaction === 'entrada') {
    const ids = admitted.map((row) => row.id);
    const { error: attendError } = await supabase.from('event_registrations').update({
      status: 'asistio',
      attended: true,
    }).in('id', ids);
    throwIf(attendError);
  }

  if (result === 'duplicate') {
    return { ok: false, result, name, message: 'Ya utilizado para esta interacción.' };
  }
  return { ok: true, result: 'ok', name, message: 'Acceso permitido' };
}

type ScanPersonQrEmbed = {
  people?: { full_name?: string } | { full_name?: string }[] | null;
};

export async function listRecentScans(eventId: string, limit = 12): Promise<ScanLogEntry[]> {
  const { data, error } = await supabase
    .from('qr_interactions')
    .select('id, result, note, occurred_at, person_qr:person_qr_id(people:person_id(full_name))')
    .eq('event_id', eventId)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  throwIf(error);

  return (data ?? []).map((row) => {
    const qr = (Array.isArray(row.person_qr) ? row.person_qr[0] : row.person_qr) as ScanPersonQrEmbed | null;
    const person = qr ? (Array.isArray(qr.people) ? qr.people[0] : qr.people) : null;
    const note = (row.note ?? 'entrada') as ScanInteractionKey;
    return {
      id: row.id,
      person: person?.full_name ?? 'Asistente',
      interaction: KNOWN.includes(note) ? note : 'entrada',
      ok: row.result === 'ok',
      result: row.result === 'duplicate' || row.result === 'denied' ? row.result : 'ok',
      occurred_at: row.occurred_at,
    };
  });
}

export async function countTodayScans(eventId: string): Promise<Record<string, number>> {
  const start = `${bogotaDay(new Date().toISOString())}T00:00:00-05:00`;
  const { data, error } = await supabase
    .from('qr_interactions')
    .select('note, result, occurred_at')
    .eq('event_id', eventId)
    .eq('result', 'ok')
    .gte('occurred_at', start);
  throwIf(error);
  const counts: Record<string, number> = { entrada: 0, coffee: 0, lunch: 0, kit: 0, vip: 0, certificado: 0 };
  for (const row of data ?? []) {
    const key = row.note || 'entrada';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
