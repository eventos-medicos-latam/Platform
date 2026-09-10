import { getEditionByNovoSlug, getFamily } from '../../data/editions';
import { faqsByEdition } from '../../data/faq';
import type { Track, TrackAxis } from '../../types/event';
import type { EventWebContent, EventWebEje, EventWebTrackIcon } from './events';

const TRACK_ICONS: EventWebTrackIcon[] = ['gut', 'hormone', 'immune', 'sleep', 'cell', 'skin'];

export const TRACK_ICON_OPTIONS: { id: EventWebTrackIcon; label: string }[] = [
  { id: 'gut', label: 'Gastrointestinal' },
  { id: 'hormone', label: 'Hormonas' },
  { id: 'immune', label: 'Inmunidad' },
  { id: 'sleep', label: 'Sueño' },
  { id: 'cell', label: 'Celular' },
  { id: 'skin', label: 'Piel' },
];

export function asTrackIcon(value?: string): EventWebTrackIcon {
  return TRACK_ICONS.includes(value as EventWebTrackIcon) ? (value as EventWebTrackIcon) : 'gut';
}

export function filled(value?: string | null): string {
  const text = (value ?? '').trim();
  return text;
}

export function pickText(...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    const text = filled(candidate);
    if (text) return text;
  }
  return '';
}

export function pickList(cms?: string[] | null, fallback?: string[]): string[] {
  const list = (cms ?? []).map((item) => item.trim()).filter(Boolean);
  if (list.length) return list;
  return (fallback ?? []).map((item) => item.trim()).filter(Boolean);
}

/** Copia del catálogo de marca para prellenar el CMS la primera vez. */
export function catalogWebDefaults(slug: string): EventWebContent {
  const edition = getEditionByNovoSlug(slug);
  if (!edition) return {};
  const family = getFamily(edition.familyId);
  const faqs = faqsByEdition(edition.id);
  return {
    hero_title: edition.name,
    hero_subtitle: edition.claim,
    hero_kicker: edition.heroKicker,
    hero_logo: family?.logoDark,
    hero_cta_label: 'Quiero inscribirme',
    concepto_title: `De qué se trata ${edition.name}`,
    concepto_lead: edition.conceptLead,
    concepto_body: edition.concept.join('\n\n'),
    concepto_image: edition.conceptImage,
    concepto_caption: edition.conceptImageCaption,
    publico_title: '¿Para quién es?',
    publico_items: [...edition.audience],
    beneficios_title: 'Qué incluye',
    beneficios_items: [...edition.benefits],
    ejes_kicker: 'Programa académico',
    ejes_title: edition.trackAxis.pluralLabel,
    ejes_subtitle: 'un recorrido, no una lista',
    ejes_label: edition.trackAxis.label,
    ejes_question: edition.trackAxis.interestQuestion,
    ejes_items: edition.trackAxis.tracks.map((track) => ({
      id: track.id,
      name: track.name,
      subtitle: track.subtitle,
      description: track.description,
      icon: track.icon,
    })),
    experiencia_name: edition.preExperience?.name,
    experiencia_duration: edition.preExperience?.durationLabel,
    experiencia_body: edition.preExperience?.description,
    experiencia_channels: edition.preExperience?.channels ? [...edition.preExperience.channels] : [],
    certificacion_body: edition.certification,
    ubicacion_venue: edition.venue.name,
    ubicacion_address: edition.venue.address,
    ubicacion_city: edition.venue.city,
    ubicacion_transport: edition.venue.notes,
    faq_items: faqs.map((item) => ({ q: item.question, a: item.answer })),
    resultados_items: (edition.results ?? []).map((item) => ({ label: item.label, value: item.value })),
    cta_title: `Nos vemos en ${edition.venue.city}`,
    cta_body: edition.dateLabel,
    cta_label: 'Inscribirme',
    seo_title: edition.name,
    seo_description: edition.conceptLead,
  };
}

export function catalogExtraDefaults(slug: string): Record<string, boolean> {
  const edition = getEditionByNovoSlug(slug);
  if (!edition) {
    return { publico: false, beneficios: false, ejes: false, experiencia: false };
  }
  return {
    publico: edition.audience.length > 0,
    beneficios: edition.benefits.length > 0,
    ejes: edition.trackAxis.tracks.length > 0,
    experiencia: Boolean(edition.preExperience),
    certificacion: Boolean(edition.certification),
    aliados: false,
    resultados: (edition.results?.length ?? 0) > 0,
  };
}

function isPlaceholderFaq(items?: { q: string; a: string }[]) {
  if (!items?.length) return true;
  return items.length === 1 && /aforo/i.test(items[0].q);
}

/** El CMS pisa el catálogo solo cuando el campo ya tiene texto o ítems. */
export function mergeWebContent(saved: EventWebContent | undefined, catalog: EventWebContent): EventWebContent {
  if (!saved) return catalog;
  const next: EventWebContent = { ...catalog };
  (Object.entries(saved) as Array<[keyof EventWebContent, EventWebContent[keyof EventWebContent]]>).forEach(([key, value]) => {
    if (typeof value === 'string') {
      if (value.trim()) next[key] = value as never;
      return;
    }
    if (Array.isArray(value) && value.length) {
      next[key] = value as never;
    }
  });
  if (isPlaceholderFaq(saved.faq_items)) {
    next.faq_items = catalog.faq_items ?? [];
  }
  return next;
}

export function axisFromContent(copy: EventWebContent, fallback?: TrackAxis): TrackAxis | null {
  const items = (copy.ejes_items ?? []).filter((item) => filled(item.name));
  if (items.length > 0) return tracksToAxis(copy, items);
  if (fallback && fallback.tracks.length > 0) return fallback;
  return null;
}

function tracksToAxis(copy: EventWebContent, items: EventWebEje[]): TrackAxis {
  return {
    label: pickText(copy.ejes_label, 'Eje'),
    pluralLabel: pickText(copy.ejes_title, 'Ejes temáticos'),
    interestQuestion: pickText(copy.ejes_question, '¿Cuál te interesa más?'),
    tracks: items.map((item, index): Track => ({
      id: item.id || `eje-${index + 1}`,
      order: index + 1,
      name: item.name.trim(),
      subtitle: (item.subtitle ?? '').trim(),
      description: (item.description ?? '').trim(),
      icon: asTrackIcon(item.icon),
    })),
  };
}
