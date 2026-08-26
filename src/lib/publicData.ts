import { supabase } from './supabaseClient';
import type { SecondaryEvent } from '../types/content';

/**
 * Trae TODAS las sesiones digitales de Supabase (cualquier estado), con la
 * misma forma que usaban los componentes públicos contra el mock — así el
 * filtro "aprobado"/"publicado" y el resto de la lógica de cada página no
 * cambian, solo la fuente de los datos.
 */
export async function fetchSecondaryEvents(): Promise<SecondaryEvent[]> {
  const { data } = await supabase
    .from('secondary_events')
    .select('id, title, kind, date, time, speaker_label, modality, price, seats, registered, related_edition_id, crm_tag, status, description, duration_minutes, platform, track_id');
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    kind: row.kind,
    date: row.date ?? '',
    time: row.time,
    speakerLabel: row.speaker_label,
    modality: row.modality,
    price: row.price,
    seats: row.seats,
    registered: row.registered,
    relatedEditionId: row.related_edition_id ?? undefined,
    crmTag: row.crm_tag,
    status: row.status,
    description: row.description ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    platform: row.platform ?? undefined,
    trackId: row.track_id ?? undefined
  }));
}
