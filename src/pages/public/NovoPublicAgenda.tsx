import React, { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { CheckIcon, MapPinIcon, MicIcon, TicketIcon } from 'lucide-react';
import { EventPageHeader } from '../../components/event/EventPageHeader';
import { PageTransition } from '../../components/motion/PageTransition';
import { DisplayTitle } from '../../components/ui/DisplayTitle';
import { media } from '../../data/media';
import { formatCurrency, publicVenueLabel } from '../../lib/novo/events';
import { listAgenda, type AgendaActivityType, type AgendaItemRow } from '../../lib/novo/agenda';
import { listPublicEventSpeakers, type PublicEventSpeaker } from '../../lib/novo/speakers';
import { currentTicketNetPrice, listPublicTickets, type EventTicketRow } from '../../lib/novo/tickets';
import type { NovoPublicOutlet } from './NovoPublicEventLayout';

const TYPE_LABELS: Record<AgendaActivityType, string> = {
  conferencia: 'Conferencia',
  panel: 'Panel',
  taller: 'Taller',
  break: 'Break',
  operacion: 'Operación',
};

const QUIET_TYPES: AgendaActivityType[] = ['break', 'operacion'];

function formatDay(iso: string) {
  const label = new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function clock(time: string) {
  return time.slice(0, 5);
}

function groupByDate(items: AgendaItemRow[]) {
  const groups: { date: string; items: AgendaItemRow[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.date === item.item_date) last.items.push(item);
    else groups.push({ date: item.item_date, items: [item] });
  }
  return groups;
}

export function NovoPublicAgenda() {
  const { event } = useOutletContext<NovoPublicOutlet>();
  const [agenda, setAgenda] = useState<AgendaItemRow[]>([]);
  const [tickets, setTickets] = useState<EventTicketRow[]>([]);
  const [speakers, setSpeakers] = useState<PublicEventSpeaker[]>([]);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const registerTo = `/e/${event.slug}/inscripcion`;
  const venueLabel = publicVenueLabel(event);
  const days = useMemo(() => groupByDate(agenda), [agenda]);
  const day = days.find((entry) => entry.date === activeDate) ?? days[0];

  useEffect(() => {
    Promise.all([
      listAgenda(event.id).catch(() => []),
      listPublicTickets(event.id).catch(() => []),
      listPublicEventSpeakers(event.id).catch(() => []),
    ]).then(([nextAgenda, nextTickets, nextSpeakers]) => {
      setAgenda(nextAgenda);
      setTickets(nextTickets);
      setSpeakers(nextSpeakers);
      setActiveDate(nextAgenda[0]?.item_date ?? null);
    });
  }, [event.id]);

  const jumps = [
    { id: 'agenda', label: 'Agenda' },
    ...(speakers.length > 0 ? [{ id: 'speakers', label: 'Speakers' }] : []),
    ...(venueLabel ? [{ id: 'ubicacion', label: 'Ubicación' }] : []),
    ...(tickets.length > 0 ? [{ id: 'tickets', label: 'Tickets' }] : []),
  ];

  return (
    <PageTransition>
      <EventPageHeader
        eyebrow="Agenda"
        image={event.cover_image_url || media.stage}
        parts={[{ text: 'Todo lo que necesitas', tone: 'bold' }, { text: 'para vivir el evento', tone: 'light' }]}
        lead="Agenda, speakers, ubicación y tickets — en un solo lugar, sin ir y venir entre pestañas."
      >
        {jumps.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            {jumps.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white/85 transition-colors duration-150 hover:border-white hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </EventPageHeader>

      <section id="agenda" className="scroll-mt-20 tint-aurora">
        <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Agenda</p>
              <DisplayTitle as="h2" size="md" className="mt-3" parts={[{ text: 'Programa académico', tone: 'bold' }]} />
              <p className="mt-3 text-base leading-relaxed text-ink">
                Horarios y espacios del evento. El equipo académico puede ajustar el orden hasta el día del encuentro.
              </p>
            </div>
            {days.length > 1 ? (
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Días del evento">
                {days.map((entry, index) => {
                  const isActive = entry.date === (day?.date ?? '');
                  return (
                    <button
                      key={entry.date}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveDate(entry.date)}
                      className={`rounded-2xl px-5 py-3 text-left ${isActive ? 'grad-futuro text-white shadow-elev3' : 'border border-line text-ink hover:text-brand'}`}
                    >
                      <span className="block text-sm font-semibold">Día {index + 1}</span>
                      <span className="mt-0.5 block text-xs opacity-70">{formatDay(entry.date)}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {day ? (
            <>
              <div className="mt-9 flex flex-wrap items-baseline justify-between gap-3 rounded-2xl border border-white bg-white/80 px-6 py-4 shadow-elev1 backdrop-blur">
                <h3 className="text-xl font-bold tracking-tight text-brand">{formatDay(day.date)}</h3>
                <p className="text-sm font-semibold text-accent">{day.items.length} actividades</p>
              </div>
              <ol className="mt-5 space-y-2.5">
                {day.items.map((item) => {
                  const quiet = QUIET_TYPES.includes(item.activity_type);
                  return (
                    <li
                      key={item.id}
                      className={`relative flex flex-wrap gap-x-6 gap-y-3 overflow-hidden rounded-2xl border border-white px-5 py-5 shadow-elev1 backdrop-blur sm:px-6 ${quiet ? 'bg-white/55' : 'bg-white/90'}`}
                    >
                      <span className={`absolute inset-y-0 left-0 w-1 ${quiet ? 'bg-line' : 'grad-futuro'}`} aria-hidden="true" />
                      <div className="w-[112px] shrink-0 pl-1">
                        <p className="text-sm font-semibold tabular-nums text-brand">
                          {clock(item.start_time)} – {clock(item.end_time)}
                        </p>
                        <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                          {TYPE_LABELS[item.activity_type]}
                        </p>
                      </div>
                      <div className="min-w-[240px] flex-1">
                        <h4 className={`text-base font-semibold leading-snug ${quiet ? 'text-ink' : 'text-brand'}`}>
                          {item.name}
                          {item.is_highlight ? (
                            <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                              Destacada
                            </span>
                          ) : null}
                        </h4>
                        {item.description ? (
                          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.description}</p>
                        ) : null}
                        {item.speaker_names.length > 0 ? (
                          <p className="mt-2.5 text-sm font-medium text-brand">{item.speaker_names.join(' · ')}</p>
                        ) : null}
                      </div>
                      {item.space_name ? (
                        <div className="text-sm text-ink-muted">{item.space_name}</div>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </>
          ) : (
            <div className="mt-9 rounded-3xl border border-dashed border-line bg-white/70 px-6 py-14 text-center backdrop-blur">
              <p className="text-base font-medium text-brand">Agenda no publicada</p>
              <p className="mt-1.5 text-sm text-ink-muted">
                El programa se publica cuando el comité académico lo aprueba.
              </p>
            </div>
          )}
        </div>
      </section>

      {speakers.length > 0 ? (
        <section id="speakers" className="scroll-mt-20 tint-aurora pb-16">
          <div className="mx-auto max-w-shell px-6">
            <DisplayTitle as="h2" size="md" parts={[{ text: 'Quiénes', tone: 'bold' }, { text: 'comparten', tone: 'light' }]} />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {speakers.map((speaker) => (
                <article key={speaker.id} className="rounded-2xl border border-white bg-white/85 p-6 shadow-elev2 backdrop-blur">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft text-brand">
                    {speaker.photo_url
                      ? <img src={speaker.photo_url} alt="" className="h-full w-full object-cover" />
                      : <MicIcon size={22} />}
                  </div>
                  <p className="font-bold leading-tight text-brand">{speaker.name}</p>
                  <p className="mt-1 text-xs text-ink-muted">{speaker.specialty || speaker.title}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {venueLabel ? (
        <section id="ubicacion" className="scroll-mt-20 tint-aurora pb-16">
          <div className="mx-auto max-w-shell px-6">
            <DisplayTitle as="h2" size="md" parts={[{ text: 'Sede del', tone: 'light' }, { text: 'evento', tone: 'bold' }]} />
            <div className="mt-8 max-w-xl rounded-2xl border border-white bg-white/85 p-6 shadow-elev3 backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                  <MapPinIcon size={18} className="text-brand" />
                </div>
                <div>
                  <p className="font-bold text-brand">{event.venue_name || venueLabel}</p>
                  {event.venue_address ? <p className="mt-0.5 text-sm text-ink">{event.venue_address}</p> : null}
                  <p className="text-sm text-ink-muted">{[event.venue_city, event.venue_country].filter(Boolean).join(', ')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {tickets.length > 0 ? (
        <section id="tickets" className="scroll-mt-20 tint-aurora pb-20">
          <div className="mx-auto max-w-shell px-6">
            <DisplayTitle as="h2" size="md" parts={[{ text: 'Entradas', tone: 'bold' }]} />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {tickets.map((ticket) => {
                const soldOut = ticket.capacity != null && ticket.sold >= ticket.capacity;
                const net = currentTicketNetPrice(ticket);
                return (
                  <article key={ticket.id} className="rounded-2xl border border-white bg-white/85 p-6 shadow-elev2 backdrop-blur">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-bold text-brand">{ticket.name}</p>
                        <p className="mt-1 text-sm text-ink-muted">{ticket.description || 'Acceso al evento'}</p>
                      </div>
                      <TicketIcon size={18} className="text-accent" />
                    </div>
                    <p className="mt-5 text-2xl font-bold tabular-nums text-brand">
                      {net > 0 ? formatCurrency(net) : 'Gratis'}
                    </p>
                    {net > 0 && ticket.tax_pct > 0 ? (
                      <p className="mt-1 text-xs text-ink-muted">sin IVA</p>
                    ) : null}
                    {ticket.benefits.length > 0 ? (
                      <ul className="mt-4 space-y-2 text-sm text-ink">
                        {ticket.benefits.map((item) => (
                          <li key={item} className="flex gap-2">
                            <CheckIcon size={16} className="mt-0.5 shrink-0 text-accent" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <Link
                      to={soldOut ? '#' : `${registerTo}?ticket=${ticket.id}`}
                      className={`mt-6 inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-semibold ${soldOut ? 'pointer-events-none bg-line text-ink-muted' : 'grad-futuro text-white shadow-elev3'}`}
                    >
                      {soldOut ? 'Agotado' : 'Inscribirme'}
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
    </PageTransition>
  );
}
