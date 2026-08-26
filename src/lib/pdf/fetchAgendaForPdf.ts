import { supabase } from '../supabaseClient';

export interface PdfAgendaItem {
  id: string;
  start_time: string;
  end_time: string;
  title: string;
  description: string;
  type: string;
  room: string;
  trackName: string | null;
  speakerNames: string[];
}

export interface PdfAgendaDay {
  day: number;
  label: string;
  concept: string;
  items: PdfAgendaItem[];
}

/**
 * Mismo query que ya usa la sección pública de Agenda (EventProgram.tsx) —
 * para que la plantilla del PDF nunca quede desincronizada con lo que se ve
 * en la web.
 */
export async function fetchAgendaForPdf(editionId: string): Promise<PdfAgendaDay[]> {
  const [{ data: itemRows }, { data: linkRows }, { data: speakerRows }, { data: trackRows }] = await Promise.all([
    supabase.from('agenda_items').select('*').eq('edition_id', editionId).eq('visible', true).eq('status', 'publicado').order('day').order('order_num'),
    supabase.from('agenda_item_speakers').select('agenda_item_id, speaker_id'),
    supabase.from('speakers').select('id, name').eq('edition_id', editionId),
    supabase.from('tracks').select('id, name').eq('edition_id', editionId)
  ]);

  const speakerNameById = new Map((speakerRows ?? []).map((row) => [row.id, row.name]));
  const trackNameById = new Map((trackRows ?? []).map((row) => [row.id, row.name]));
  const speakerIdsByItem: Record<string, string[]> = {};
  (linkRows ?? []).forEach((row) => {
    speakerIdsByItem[row.agenda_item_id] = [...(speakerIdsByItem[row.agenda_item_id] ?? []), row.speaker_id];
  });

  const items: PdfAgendaItem[] = (itemRows ?? []).map((item) => ({
    id: item.id,
    start_time: item.start_time,
    end_time: item.end_time,
    title: item.title,
    description: item.description,
    type: item.type,
    room: item.room,
    trackName: item.track_id ? trackNameById.get(item.track_id) ?? null : null,
    speakerNames: (speakerIdsByItem[item.id] ?? []).map((id) => speakerNameById.get(id)).filter((name): name is string => Boolean(name))
  }));

  const dayNumbers = [...new Set(items.map((item) => (itemRows ?? []).find((row) => row.id === item.id)?.day))];
  return dayNumbers
    .filter((day): day is number => typeof day === 'number')
    .map((day) => {
      const source = (itemRows ?? []).find((row) => row.day === day);
      const dayItemIds = new Set((itemRows ?? []).filter((row) => row.day === day).map((row) => row.id));
      return {
        day,
        label: source?.day_label ?? `Día ${day}`,
        concept: source?.day_concept ?? '',
        items: items.filter((item) => dayItemIds.has(item.id))
      };
    });
}
