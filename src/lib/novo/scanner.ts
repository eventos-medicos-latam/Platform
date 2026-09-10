import { supabase } from '../supabaseClient';

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

function bogotaDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

function throwIf(error: { message: string } | null) {
  if (error) throw error;
}

export async function scanPersonQr(input: {
  eventId: string;
  token: string;
  interaction: ScanInteractionKey;
}): Promise<ScanOutcome> {
  const token = input.token.trim();
  if (!token) {
    return { ok: false, result: 'denied', name: '', message: 'Pega el código QR del asistente.' };
  }

  const { data: qr, error: qrError } = await supabase
    .from('person_qr')
    .select('id, person_id')
    .eq('qr_token', token)
    .maybeSingle();
  throwIf(qrError);
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
  const registration = (regs ?? [])[0];
  if (!registration) {
    await supabase.from('qr_interactions').insert({
      person_qr_id: qr.id,
      event_id: input.eventId,
      note: input.interaction,
      result: 'denied',
    });
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
    const { error: attendError } = await supabase.from('event_registrations').update({
      status: 'asistio',
      attended: true,
    }).eq('id', registration.id);
    throwIf(attendError);
  }

  if (result === 'duplicate') {
    return { ok: false, result, name, message: 'Ya utilizado para esta interacción.' };
  }
  return { ok: true, result: 'ok', name, message: 'Acceso permitido' };
}

export async function listRecentScans(eventId: string, limit = 12): Promise<ScanLogEntry[]> {
  const { data, error } = await supabase
    .from('qr_interactions')
    .select('id, result, note, occurred_at, person_qr:person_qr_id(person_id, people:person_id(full_name))')
    .eq('event_id', eventId)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  throwIf(error);

  return (data ?? []).map((row) => {
    const qr = Array.isArray(row.person_qr) ? row.person_qr[0] : row.person_qr;
    const person = qr ? (Array.isArray(qr.people) ? qr.people[0] : qr.people) : null;
    const note = (row.note ?? 'entrada') as ScanInteractionKey;
    return {
      id: row.id,
      person: person?.full_name ?? 'Asistente',
      interaction: ['entrada', 'coffee', 'lunch', 'kit', 'vip', 'certificado'].includes(note) ? note : 'entrada',
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
