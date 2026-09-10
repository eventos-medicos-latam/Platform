import { supabase } from '../supabaseClient';
import { moveToTrash } from '../trash';

export type DigitalKind = 'webinar' | 'masterclass' | 'conversatorio' | 'curso' | 'lanzamiento';
export type DigitalStatus = 'borrador' | 'aprobado' | 'publicado';

export type DigitalSession = {
  id: string;
  title: string;
  kind: DigitalKind;
  status: DigitalStatus;
  date: string;
  time: string;
  speaker: string;
  registered: number;
  platform: string;
  description: string;
};

export type DigitalWrite = {
  title: string;
  kind: DigitalKind;
  status: DigitalStatus;
  date: string | null;
  time: string;
  speaker: string;
  platform: string;
  description: string;
};

const KINDS: DigitalKind[] = ['webinar', 'masterclass', 'conversatorio', 'curso', 'lanzamiento'];
const STATUSES: DigitalStatus[] = ['borrador', 'aprobado', 'publicado'];

function asKind(value: string | null | undefined): DigitalKind {
  return KINDS.includes(value as DigitalKind) ? (value as DigitalKind) : 'webinar';
}

function asStatus(value: string | null | undefined): DigitalStatus {
  return STATUSES.includes(value as DigitalStatus) ? (value as DigitalStatus) : 'borrador';
}

type Row = {
  id: string;
  title: string | null;
  kind: string;
  date: string | null;
  time: string | null;
  speaker_label: string | null;
  registered: number | null;
  platform: string | null;
  description: string | null;
  status: string;
};

function mapRow(row: Row): DigitalSession {
  return {
    id: row.id,
    title: row.title || 'Sesión sin título',
    kind: asKind(row.kind),
    status: asStatus(row.status),
    date: row.date ?? '',
    time: row.time && row.time !== 'PENDIENTE' ? row.time : '',
    speaker: row.speaker_label && row.speaker_label !== 'PENDIENTE' ? row.speaker_label : '',
    registered: row.registered ?? 0,
    platform: row.platform || 'Zoom',
    description: row.description ?? '',
  };
}

export async function listDigitalSessions(): Promise<DigitalSession[]> {
  const { data, error } = await supabase
    .from('secondary_events')
    .select('id, title, kind, date, time, speaker_label, registered, platform, description, status')
    .order('date', { ascending: false });
  if (error) throw error;
  return ((data as Row[] | null) ?? []).map(mapRow);
}

export async function createDigitalSession(input: DigitalWrite): Promise<DigitalSession> {
  const { data, error } = await supabase
    .from('secondary_events')
    .insert({
      title: input.title.trim(),
      kind: input.kind,
      status: input.status,
      date: input.date || null,
      time: input.time.trim() || 'PENDIENTE',
      speaker_label: input.speaker.trim() || 'PENDIENTE',
      modality: 'virtual',
      platform: input.platform || null,
      description: input.description.trim() || null,
      registered: 0,
      crm_tag: '',
    })
    .select('id, title, kind, date, time, speaker_label, registered, platform, description, status')
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function updateDigitalSession(id: string, input: DigitalWrite): Promise<DigitalSession> {
  const { data, error } = await supabase
    .from('secondary_events')
    .update({
      title: input.title.trim(),
      kind: input.kind,
      status: input.status,
      date: input.date || null,
      time: input.time.trim() || 'PENDIENTE',
      speaker_label: input.speaker.trim() || 'PENDIENTE',
      platform: input.platform || null,
      description: input.description.trim() || null,
    })
    .eq('id', id)
    .select('id, title, kind, date, time, speaker_label, registered, platform, description, status')
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function duplicateDigitalSession(session: DigitalSession): Promise<DigitalSession> {
  return createDigitalSession({
    title: `${session.title} (copia)`,
    kind: session.kind,
    status: 'borrador',
    date: session.date || null,
    time: session.time,
    speaker: session.speaker,
    platform: session.platform,
    description: session.description,
  });
}

export async function trashDigitalSession(id: string): Promise<void> {
  const { error } = await moveToTrash('secondary_events', id);
  if (error) throw new Error(error);
}
