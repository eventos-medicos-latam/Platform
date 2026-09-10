import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { CheckIcon, MapPinIcon, MicIcon, TicketIcon } from 'lucide-react';
import { EventPageHeader } from '../../components/event/EventPageHeader';
import { PageTransition } from '../../components/motion/PageTransition';
import { DisplayTitle } from '../../components/ui/DisplayTitle';
import { media } from '../../data/media';
import { formatCurrency, publicVenueLabel } from '../../lib/novo/events';
import { listAgenda, type AgendaItemRow } from '../../lib/novo/agenda';
import { listPublicEventSpeakers, type PublicEventSpeaker } from '../../lib/novo/speakers';
import { listPublicTickets, type EventTicketRow } from '../../lib/novo/tickets';
import { EventProgram } from '../event/EventProgram';
import type { NovoPublicOutlet } from './NovoPublicEventLayout';

export function NovoPublicAgenda() {
  const { edition } = useOutletContext<NovoPublicOutlet>();
  if (edition) return <EventProgram />;
  return <NovoAgendaFallback />;
}

function NovoAgendaFallback() {
  const { event } = useOutletContext<NovoPublicOutlet>();
  const [agenda, setAgenda] = useState<AgendaItemRow[]>([]);
  const [tickets, setTickets] = useState<EventTicketRow[]>([]);
  const [speakers, setSpeakers] = useState<PublicEventSpeaker[]>([]);
  const registerTo = `/e/${event.slug}/inscripcion`;
  const venueLabel = publicVenueLabel(event);

  useEffect(() => {
    Promise.all([
      listAgenda(event.id).catch(() => []),
      listPublicTickets(event.id).catch(() => []),
      listPublicEventSpeakers(event.id).catch(() => []),
    ]).then(([nextAgenda, nextTickets, nextSpeakers]) => {
      setAgenda(nextAgenda);
      setTickets(nextTickets);
      setSpeakers(nextSpeakers);
    });
  }, [event.id]);

  return (
    <PageTransition>
      <EventPageHeader
        eyebrow="Agenda"
        image={event.cover_image_url || media.stage}
        parts={[{ text: 'Todo lo que necesitas', tone: 'bold' }, { text: 'para vivir el evento', tone: 'light' }]}
        lead="Agenda, speakers, ubicación y tickets — en un solo lugar."
      />

      <section id="agenda" className="tint-aurora">
        <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
          <DisplayTitle as="h2" size="md" parts={[{ text: 'Programa académico', tone: 'bold' }]} />
          {agenda.length > 0 ? (
            <ol className="mt-9 overflow-hidden rounded-3xl border border-white bg-white/90 shadow-elev2">
              {agenda.map((item, index) => (
                <li
                  key={item.id}
                  className="flex gap-4 px-5 py-4"
                  style={{ borderBottom: index < agenda.length - 1 ? '1px solid var(--line, #e8e8ef)' : 'none' }}
                >
                  <div className="w-16 shrink-0">
                    <p className="text-xs font-bold tabular-nums text-accent">{item.start_time}</p>
                    <p className="text-[10px] text-ink-muted">{item.end_time}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand">{item.name}</p>
                    <p className="text-xs text-ink-muted">
                      {item.speaker_names.join(' · ')}
                      {item.space_name ? ` · ${item.space_name}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink">
              La estructura del programa se publica cuando el comité académico la apruebe.
            </p>
          )}
        </div>
      </section>

      {speakers.length > 0 ? (
        <section id="speakers" className="tint-aurora pb-16">
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
                  <p className="font-bold text-brand leading-tight">{speaker.name}</p>
                  <p className="mt-1 text-xs text-ink-muted">{speaker.specialty || speaker.title}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {venueLabel ? (
        <section id="ubicacion" className="tint-aurora pb-16">
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
        <section id="tickets" className="tint-aurora pb-20">
          <div className="mx-auto max-w-shell px-6">
            <DisplayTitle as="h2" size="md" parts={[{ text: 'Entradas', tone: 'bold' }]} />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {tickets.map((ticket) => {
                const soldOut = ticket.capacity != null && ticket.sold >= ticket.capacity;
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
                      {ticket.current_price > 0 ? formatCurrency(ticket.current_price) : 'Gratis'}
                    </p>
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
