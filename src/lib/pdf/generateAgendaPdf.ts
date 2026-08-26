import type { Edition } from '../../types/event';
import { supabase } from '../supabaseClient';
import { media } from '../../data/media';
import { fetchAgendaForPdf } from './fetchAgendaForPdf';

function absoluteUrl(path: string): string {
  return new URL(path, window.location.origin).toString();
}

/**
 * Todo pasa aquí adentro (fetch + render + descarga), cargado con import()
 * dinámico desde el botón — @react-pdf/renderer nunca entra al bundle
 * inicial.
 */
export async function generateAgendaPdf(edition: Edition): Promise<void> {
  const [days, { data: settingsRows }, { pdf }, { AgendaPdfDocument }] = await Promise.all([
    fetchAgendaForPdf(edition.id),
    supabase.from('public_settings').select('key, value').eq('key', 'logo_url').maybeSingle(),
    import('@react-pdf/renderer'),
    import('../../components/pdf/AgendaPdfDocument')
  ]);

  const logoUrl = settingsRows?.value ? settingsRows.value : absoluteUrl(media.logoHormobiota);
  const dateLine = edition.startDate === edition.endDate
    ? new Date(`${edition.startDate}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    : `${new Date(`${edition.startDate}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })} – ${new Date(`${edition.endDate}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  const venueLine = `${edition.venue.name} · ${edition.venue.city}, ${edition.venue.country}`;
  const generatedAtLabel = new Date().toLocaleString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const blob = await pdf(
    AgendaPdfDocument({
      logoUrl,
      eventName: edition.name,
      editionLabel: edition.editionLabel ?? `${edition.year}`,
      venueLine,
      dateLine,
      days,
      generatedAtLabel
    })
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `agenda-${edition.slug}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
