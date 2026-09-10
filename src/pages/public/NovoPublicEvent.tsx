import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDaysIcon, MapPinIcon, TicketIcon, MicIcon } from 'lucide-react';
import { PageTransition } from '../../components/motion/PageTransition';
import {
  formatCurrency, getEventBySlug, getPublicEventWeb, webExtraOn, webSectionOn,
  type PublicEventWeb,
} from '../../lib/novo/events';
import { listAgenda, type AgendaItemRow } from '../../lib/novo/agenda';
import { listPublicTickets, type EventTicketRow } from '../../lib/novo/tickets';
import { listPublicEventSpeakers, type PublicEventSpeaker } from '../../lib/novo/speakers';
import type { NovoEvent } from '../../types/novo';

function formatDay(iso: string) {
  if (!iso) return '';
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function NovoPublicEvent() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<NovoEvent | null>(null);
  const [web, setWeb] = useState<PublicEventWeb | null>(null);
  const [missing, setMissing] = useState(false);
  const [agenda, setAgenda] = useState<AgendaItemRow[]>([]);
  const [tickets, setTickets] = useState<EventTicketRow[]>([]);
  const [speakers, setSpeakers] = useState<PublicEventSpeaker[]>([]);

  useEffect(() => {
    if (!slug) return;
    getEventBySlug(slug)
      .then((found) => {
        if (!found) {
          setMissing(true);
          return;
        }
        setEvent(found);
        Promise.all([
          listAgenda(found.id).catch(() => []),
          listPublicTickets(found.id).catch(() => []),
          listPublicEventSpeakers(found.id).catch(() => []),
          getPublicEventWeb(found.id),
        ]).then(([nextAgenda, nextTickets, nextSpeakers, nextWeb]) => {
          setAgenda(nextAgenda);
          setTickets(nextTickets);
          setSpeakers(nextSpeakers);
          setWeb(nextWeb);
        });
      })
      .catch(() => setMissing(true));
  }, [slug]);

  if (missing) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-shell px-6 py-24 text-center">
          <p className="text-lg font-bold text-brand">Evento no disponible</p>
          <p className="mt-2 text-sm text-ink-muted">Puede estar en borrador o el enlace es incorrecto.</p>
          <Link to="/eventos" className="mt-6 inline-block text-sm font-semibold text-brand">Ver todos los eventos</Link>
        </div>
      </PageTransition>
    );
  }

  if (!event) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-shell px-6 py-24 text-center text-sm text-ink-muted">Cargando evento…</div>
      </PageTransition>
    );
  }

  const accent = event.accent_color || event.primary_color || '#00C9A0';
  const registerTo = `/e/${event.slug}/inscripcion`;
  const copy = web?.content ?? {};
  const heroTitle = copy.hero_title || event.name;
  const heroSubtitle = copy.hero_subtitle || event.tagline || '';
  const heroImage = copy.hero_image || event.cover_image_url;
  const heroCtaLabel = copy.hero_cta_label || 'Inscribirme';
  const heroCtaUrl = copy.hero_cta_url || (tickets.length > 0 ? registerTo : '');
  const aboutTitle = copy.concepto_title || 'Acerca del evento';
  const aboutBody = copy.concepto_body || event.description || '';
  const venueName = copy.ubicacion_venue || event.venue_name || '';
  const venueCity = copy.ubicacion_city || event.venue_city || '';
  const venueAddress = copy.ubicacion_address || event.venue_address || '';
  const venueLine = [...new Set([venueName, venueAddress, [venueCity, event.venue_country].filter(Boolean).join(', ')].filter(Boolean))];
  const faqs = (copy.faq_items ?? []).filter((item) => item.q.trim());
  const gallery = (copy.galeria_images ?? []).filter(Boolean);
  const showHero = webSectionOn(web, 'hero');
  const showAbout = webSectionOn(web, 'info') && Boolean(aboutBody);
  const showTickets = webSectionOn(web, 'tickets') && tickets.length > 0;
  const showAgenda = webSectionOn(web, 'agenda') && agenda.length > 0;
  const showSpeakers = webSectionOn(web, 'speakers') && speakers.length > 0;
  const showLocation = webSectionOn(web, 'location') && venueLine.length > 0;
  const showFaq = webSectionOn(web, 'faq') && faqs.length > 0;
  const showGallery = webSectionOn(web, 'gallery') && gallery.length > 0;
  const showCta = webSectionOn(web, 'cta');
  const showCertificate = webExtraOn(web, 'certificacion') && event.has_certificate;
  const ctaTitle = copy.cta_title || '¿Listo para asistir?';
  const ctaBody = copy.cta_body || '';
  const ctaLabel = copy.cta_label || heroCtaLabel;
  const ctaUrl = copy.cta_url || heroCtaUrl || registerTo;

  return (
    <PageTransition>
      {showHero ? (
        <section className="relative overflow-hidden bg-brand-deep text-white">
          {heroImage ? (
            <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
          ) : null}
          <div className="relative mx-auto max-w-shell px-6 py-16 lg:py-24">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{event.event_type}</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight lg:text-5xl">{heroTitle}</h1>
            {heroSubtitle ? <p className="mt-3 max-w-xl text-white/70">{heroSubtitle}</p> : null}
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/75">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDaysIcon size={14} /> {formatDay(event.start_date)}
              </span>
              {venueLine[0] ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPinIcon size={14} /> {venueLine.join(' · ')}
                </span>
              ) : null}
            </div>
            {heroCtaUrl ? (
              heroCtaUrl.startsWith('/') ? (
                <Link to={heroCtaUrl}
                  className="mt-8 inline-flex items-center rounded-xl px-5 py-3 text-sm font-bold text-brand-deep"
                  style={{ background: accent }}>
                  {heroCtaLabel}
                </Link>
              ) : (
                <a href={heroCtaUrl}
                  className="mt-8 inline-flex items-center rounded-xl px-5 py-3 text-sm font-bold text-brand-deep"
                  style={{ background: accent }}>
                  {heroCtaLabel}
                </a>
              )
            ) : null}
          </div>
        </section>
      ) : null}

      {showAbout ? (
        <section className="mx-auto max-w-shell px-6 py-12">
          <div className={`grid gap-8 ${copy.concepto_image ? 'lg:grid-cols-2 lg:items-start' : ''}`}>
            <div>
              <h2 className="text-xl font-bold text-brand">{aboutTitle}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted whitespace-pre-line">{aboutBody}</p>
            </div>
            {copy.concepto_image ? (
              <img src={copy.concepto_image} alt="" className="w-full rounded-2xl object-cover" />
            ) : null}
          </div>
        </section>
      ) : null}

      {showTickets ? (
        <section className="bg-canvas py-12">
          <div className="mx-auto max-w-shell px-6">
            <h2 className="text-xl font-bold text-brand">Entradas</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tickets.map((ticket) => {
                const soldOut = ticket.capacity != null && ticket.sold >= ticket.capacity;
                return (
                  <article key={ticket.id} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-ink">{ticket.name}</p>
                        <p className="mt-1 text-xs text-ink-muted">{ticket.description || 'Acceso al evento'}</p>
                      </div>
                      <TicketIcon size={16} className="text-brand" />
                    </div>
                    <p className="mt-4 text-lg font-bold tabular-nums text-brand">
                      {ticket.current_price > 0 ? formatCurrency(ticket.current_price) : 'Gratis'}
                    </p>
                    {ticket.benefits.length > 0 ? (
                      <ul className="mt-3 space-y-1 text-xs text-ink-muted">
                        {ticket.benefits.map((item) => <li key={item}>· {item}</li>)}
                      </ul>
                    ) : null}
                    <Link
                      to={soldOut ? '#' : `${registerTo}?ticket=${ticket.id}`}
                      className={`mt-5 inline-flex rounded-xl px-4 py-2 text-xs font-semibold ${soldOut ? 'pointer-events-none bg-line text-ink-muted' : 'bg-brand text-white'}`}
                    >
                      {soldOut ? 'Agotado' : 'Elegir'}
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {showAgenda ? (
        <section className="mx-auto max-w-shell px-6 py-12">
          <h2 className="text-xl font-bold text-brand">Agenda</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
            {agenda.map((item, i) => (
              <div key={item.id} className="flex gap-4 px-5 py-3.5" style={{ borderBottom: i < agenda.length - 1 ? '1px solid #e8eef4' : 'none' }}>
                <div className="w-16 shrink-0">
                  <p className="text-xs font-bold tabular-nums text-brand">{item.start_time}</p>
                  <p className="text-[10px] text-ink-muted">{item.end_time}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{item.name}</p>
                  <p className="text-xs text-ink-muted">
                    {item.speaker_names.join(' · ')}
                    {item.space_name ? ` · ${item.space_name}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {showSpeakers ? (
        <section className="bg-canvas py-12">
          <div className="mx-auto max-w-shell px-6">
            <h2 className="text-xl font-bold text-brand">Speakers</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {speakers.map((speaker) => (
                <article key={speaker.id} className="rounded-2xl border border-line bg-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-xs font-bold text-brand">
                      {speaker.photo_url
                        ? <img src={speaker.photo_url} alt="" className="h-full w-full object-cover" />
                        : <MicIcon size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">{speaker.name}</p>
                      <p className="text-xs text-ink-muted">{speaker.specialty || speaker.title}</p>
                    </div>
                  </div>
                  {speaker.bio ? <p className="mt-3 text-xs leading-relaxed text-ink-muted">{speaker.bio}</p> : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showLocation ? (
        <section className="mx-auto max-w-shell px-6 py-12">
          <h2 className="text-xl font-bold text-brand">Ubicación</h2>
          <div className="mt-4 max-w-xl space-y-1 text-sm text-ink-muted">
            {venueLine.map((line) => (
              <p key={line} className={line === venueLine[0] ? 'font-semibold text-ink' : undefined}>{line}</p>
            ))}
            {copy.ubicacion_transport ? <p className="mt-3 whitespace-pre-line">{copy.ubicacion_transport}</p> : null}
            {copy.ubicacion_maps ? (
              <a href={copy.ubicacion_maps} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-brand">
                Ver en el mapa
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      {showCertificate ? (
        <section className="bg-canvas py-12">
          <div className="mx-auto max-w-shell px-6">
            <h2 className="text-xl font-bold text-brand">Certificación</h2>
            <p className="mt-3 max-w-xl text-sm text-ink-muted">
              Este evento otorga certificado de asistencia.
              {event.certificate_send_at ? ` Se envía a partir del ${formatDay(event.certificate_send_at)}.` : ''}
            </p>
          </div>
        </section>
      ) : null}

      {showFaq ? (
        <section className="mx-auto max-w-shell px-6 py-12">
          <h2 className="text-xl font-bold text-brand">Preguntas frecuentes</h2>
          <div className="mt-6 space-y-3">
            {faqs.map((item) => (
              <details key={item.q} className="rounded-2xl border border-line bg-white px-5 py-4">
                <summary className="cursor-pointer text-sm font-semibold text-ink">{item.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted whitespace-pre-line">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {showGallery ? (
        <section className="bg-canvas py-12">
          <div className="mx-auto max-w-shell px-6">
            <h2 className="text-xl font-bold text-brand">Galería</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((src) => (
                <img key={src} src={src} alt="" className="h-48 w-full rounded-2xl object-cover" />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showCta ? (
        <section className="bg-brand-deep py-16 text-white">
          <div className="mx-auto max-w-shell px-6 text-center">
            <h2 className="text-2xl font-bold">{ctaTitle}</h2>
            {ctaBody ? <p className="mx-auto mt-3 max-w-xl text-sm text-white/70">{ctaBody}</p> : null}
            {ctaUrl.startsWith('/') ? (
              <Link to={ctaUrl} className="mt-8 inline-flex rounded-xl px-5 py-3 text-sm font-bold text-brand-deep" style={{ background: accent }}>
                {ctaLabel}
              </Link>
            ) : (
              <a href={ctaUrl} className="mt-8 inline-flex rounded-xl px-5 py-3 text-sm font-bold text-brand-deep" style={{ background: accent }}>
                {ctaLabel}
              </a>
            )}
          </div>
        </section>
      ) : null}
    </PageTransition>
  );
}
