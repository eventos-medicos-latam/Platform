import { supabase } from '../supabaseClient';
import type { NovoAgendaActivityType } from '../../types/novo';

export type AgendaActivityType = NovoAgendaActivityType;

export type AgendaSpeakerChoice = {
  event_speaker_id: string | null;
  speaker_profile_id: string;
  name: string;
  assigned: boolean;
};

export type EventSpaceRow = {
  id: string;
  event_id: string;
  name: string;
};

export type AgendaItemRow = {
  id: string;
  event_id: string;
  space_id: string | null;
  space_name: string;
  name: string;
  activity_type: AgendaActivityType;
  item_date: string;
  start_time: string;
  end_time: string;
  description: string;
  is_highlight: boolean;
  event_speaker_ids: string[];
  speaker_profile_ids: string[];
  speaker_names: string[];
};

export type AgendaWrite = {
  event_id: string;
  name: string;
  activity_type: AgendaActivityType;
  item_date: string;
  start_time: string;
  end_time: string;
  space_id: string | null;
  new_space_name: string;
  description: string;
  is_highlight: boolean;
  speaker_profile_ids: string[];
};

type SpaceEmbed = { id: string; name: string };
type ItemQueryRow = {
  id: string;
  event_id: string;
  space_id: string | null;
  name: string;
  activity_type: string;
  item_date: string;
  start_time: string;
  end_time: string;
  description: string | null;
  is_highlight: boolean | null;
  event_spaces: SpaceEmbed | SpaceEmbed[] | null;
};

type PersonEmbed = { full_name: string };
type ProfileEmbed = {
  id: string;
  public_title: string | null;
  people: PersonEmbed | PersonEmbed[] | null;
};
type EventSpeakerEmbed = {
  id: string;
  speaker_id: string;
  speaker_profiles: ProfileEmbed | ProfileEmbed[] | null;
};
type LinkRow = {
  agenda_item_id: string;
  event_speaker_id: string;
  event_speakers: EventSpeakerEmbed | EventSpeakerEmbed[] | null;
};

const ITEM_SELECT = `
  id, event_id, space_id, name, activity_type, item_date, start_time, end_time, description, is_highlight,
  event_spaces:space_id(id, name)
`.replace(/\s+/g, ' ').trim();

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function throwIf(error: { message: string } | null) {
  if (error) throw error;
}

function asType(value: string | null | undefined): AgendaActivityType {
  if (value === 'panel' || value === 'taller' || value === 'break' || value === 'operacion' || value === 'conferencia') {
    return value;
  }
  return 'conferencia';
}

export function sliceTime(value: string | null | undefined) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

export function sliceDate(value: string | null | undefined) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function minutesOf(time: string) {
  const [h, m] = sliceTime(time).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function speakerName(profile: ProfileEmbed | null) {
  const person = one(profile?.people ?? null);
  return person?.full_name || profile?.public_title || 'Speaker';
}

type LinkedSpeaker = { event_speaker_id: string; speaker_profile_id: string; name: string };

function mapItem(
  row: ItemQueryRow,
  speakersByItem: Record<string, LinkedSpeaker[]>,
): AgendaItemRow {
  const space = one(row.event_spaces);
  const speakers = speakersByItem[row.id] ?? [];
  return {
    id: row.id,
    event_id: row.event_id,
    space_id: row.space_id,
    space_name: space?.name ?? '',
    name: row.name,
    activity_type: asType(row.activity_type),
    item_date: sliceDate(row.item_date),
    start_time: sliceTime(row.start_time),
    end_time: sliceTime(row.end_time),
    description: row.description ?? '',
    is_highlight: Boolean(row.is_highlight),
    event_speaker_ids: speakers.map((s) => s.event_speaker_id),
    speaker_profile_ids: speakers.map((s) => s.speaker_profile_id).filter(Boolean),
    speaker_names: speakers.map((s) => s.name),
  };
}

async function loadSpeakerLinks(itemIds: string[]): Promise<Record<string, LinkedSpeaker[]>> {
  if (itemIds.length === 0) return {};
  const { data, error } = await supabase
    .from('event_agenda_item_speakers')
    .select(`
      agenda_item_id, event_speaker_id,
      event_speakers:event_speaker_id(
        id, speaker_id,
        speaker_profiles:speaker_id(id, public_title, people:person_id(full_name))
      )
    `.replace(/\s+/g, ' ').trim())
    .in('agenda_item_id', itemIds);
  throwIf(error);
  const map: Record<string, LinkedSpeaker[]> = {};
  for (const row of (data as LinkRow[] | null) ?? []) {
    const eventSpeaker = one(row.event_speakers);
    const profile = one(eventSpeaker?.speaker_profiles ?? null);
    if (!map[row.agenda_item_id]) map[row.agenda_item_id] = [];
    map[row.agenda_item_id].push({
      event_speaker_id: eventSpeaker?.id ?? row.event_speaker_id,
      speaker_profile_id: eventSpeaker?.speaker_id ?? profile?.id ?? '',
      name: speakerName(profile),
    });
  }
  return map;
}

async function mapItems(data: ItemQueryRow[] | null): Promise<AgendaItemRow[]> {
  const rows = data ?? [];
  const links = await loadSpeakerLinks(rows.map((row) => row.id));
  return rows.map((row) => mapItem(row, links));
}

export async function listSpaces(eventId: string): Promise<EventSpaceRow[]> {
  const { data, error } = await supabase
    .from('event_spaces')
    .select('id, event_id, name')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  throwIf(error);
  return (data ?? []) as EventSpaceRow[];
}

async function findOrCreateSpace(eventId: string, name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const spaces = await listSpaces(eventId);
  const existing = spaces.find((space) => space.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from('event_spaces')
    .insert({
      event_id: eventId,
      name: trimmed,
      sort_order: spaces.length,
    })
    .select('id')
    .single();
  throwIf(error);
  return data.id as string;
}

export async function listAgendaSpeakerChoices(eventId: string): Promise<AgendaSpeakerChoice[]> {
  const [{ data: profiles, error: profileError }, { data: assigned, error: assignedError }] = await Promise.all([
    supabase.from('speaker_profiles').select('id, public_title, people:person_id(full_name)').order('created_at', { ascending: false }),
    supabase.from('event_speakers').select('id, speaker_id').eq('event_id', eventId),
  ]);
  throwIf(profileError);
  throwIf(assignedError);
  const assignedByProfile = new Map((assigned ?? []).map((row) => [row.speaker_id as string, row.id as string]));
  return ((profiles as ProfileEmbed[] | null) ?? []).map((profile) => ({
    event_speaker_id: assignedByProfile.get(profile.id) ?? null,
    speaker_profile_id: profile.id,
    name: speakerName(profile),
    assigned: assignedByProfile.has(profile.id),
  }));
}

async function ensureEventSpeaker(eventId: string, speakerProfileId: string): Promise<string> {
  const { data: existing, error: findError } = await supabase
    .from('event_speakers')
    .select('id')
    .eq('event_id', eventId)
    .eq('speaker_id', speakerProfileId)
    .maybeSingle();
  throwIf(findError);
  if (existing?.id) return existing.id as string;
  const { data, error } = await supabase
    .from('event_speakers')
    .insert({
      event_id: eventId,
      speaker_id: speakerProfileId,
      status: 'invitado',
    })
    .select('id')
    .single();
  throwIf(error);
  return data.id as string;
}

async function syncItemSpeakers(itemId: string, eventId: string, speakerProfileIds: string[]) {
  const unique = [...new Set(speakerProfileIds.filter(Boolean))];
  const eventSpeakerIds = await Promise.all(unique.map((id) => ensureEventSpeaker(eventId, id)));
  const { error: deleteError } = await supabase
    .from('event_agenda_item_speakers')
    .delete()
    .eq('agenda_item_id', itemId);
  throwIf(deleteError);
  if (eventSpeakerIds.length === 0) return;
  const { error } = await supabase.from('event_agenda_item_speakers').insert(
    eventSpeakerIds.map((event_speaker_id) => ({
      agenda_item_id: itemId,
      event_speaker_id,
      role: 'ponente',
    })),
  );
  throwIf(error);
}

export async function listAgenda(eventId: string): Promise<AgendaItemRow[]> {
  const { data, error } = await supabase
    .from('event_agenda_items')
    .select(ITEM_SELECT)
    .eq('event_id', eventId)
    .order('item_date', { ascending: true })
    .order('start_time', { ascending: true })
    .order('sort_order', { ascending: true });
  throwIf(error);
  return mapItems(data as ItemQueryRow[] | null);
}

async function resolveSpaceId(input: AgendaWrite): Promise<string | null> {
  const created = await findOrCreateSpace(input.event_id, input.new_space_name);
  if (created) return created;
  return input.space_id || null;
}

function itemPayload(input: AgendaWrite, spaceId: string | null) {
  return {
    event_id: input.event_id,
    space_id: spaceId,
    name: input.name.trim(),
    activity_type: input.activity_type,
    item_date: sliceDate(input.item_date),
    start_time: sliceTime(input.start_time) || '09:00',
    end_time: sliceTime(input.end_time) || '10:00',
    description: input.description.trim() || null,
    is_highlight: input.is_highlight,
    sort_order: minutesOf(input.start_time),
  };
}

async function reloadItem(id: string): Promise<AgendaItemRow> {
  const { data, error } = await supabase.from('event_agenda_items').select(ITEM_SELECT).eq('id', id).single();
  throwIf(error);
  const [mapped] = await mapItems([data as ItemQueryRow]);
  return mapped;
}

export async function createAgendaItem(input: AgendaWrite): Promise<AgendaItemRow> {
  const spaceId = await resolveSpaceId(input);
  const { data, error } = await supabase
    .from('event_agenda_items')
    .insert(itemPayload(input, spaceId))
    .select('id')
    .single();
  throwIf(error);
  await syncItemSpeakers(data.id, input.event_id, input.speaker_profile_ids);
  return reloadItem(data.id);
}

export async function updateAgendaItem(id: string, input: AgendaWrite): Promise<AgendaItemRow> {
  const spaceId = await resolveSpaceId(input);
  const { error } = await supabase.from('event_agenda_items').update(itemPayload(input, spaceId)).eq('id', id);
  throwIf(error);
  await syncItemSpeakers(id, input.event_id, input.speaker_profile_ids);
  return reloadItem(id);
}

export async function deleteAgendaItem(id: string): Promise<void> {
  const { error } = await supabase.from('event_agenda_items').delete().eq('id', id);
  throwIf(error);
}

export async function duplicateAgendaItem(item: AgendaItemRow): Promise<AgendaItemRow> {
  const { data, error } = await supabase
    .from('event_agenda_items')
    .insert({
      event_id: item.event_id,
      space_id: item.space_id,
      name: `${item.name} (copia)`,
      activity_type: item.activity_type,
      item_date: item.item_date,
      start_time: item.start_time,
      end_time: item.end_time,
      description: item.description || null,
      is_highlight: false,
      sort_order: minutesOf(item.start_time),
    })
    .select('id')
    .single();
  throwIf(error);
  if (item.event_speaker_ids.length > 0) {
    const { error: linkError } = await supabase.from('event_agenda_item_speakers').insert(
      item.event_speaker_ids.map((event_speaker_id) => ({
        agenda_item_id: data.id,
        event_speaker_id,
        role: 'ponente',
      })),
    );
    throwIf(linkError);
  }
  return reloadItem(data.id);
}
