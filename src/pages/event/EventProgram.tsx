import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BedDoubleIcon, CarIcon, CheckIcon, MapPinIcon, PlaneIcon, UserRoundIcon } from 'lucide-react';
import type { Edition } from '../../types/event';
import { PageTransition } from '../../components/motion/PageTransition';
import { EventPageHeader } from '../../components/event/EventPageHeader';
import { SpeakerProposalModal } from '../../components/event/SpeakerProposalModal';
import { DisplayTitle } from '../../components/ui/DisplayTitle';
import { TrackIcon } from '../../components/ui/TrackIcon';
import { Pending } from '../../components/ui/Pending';
import { OrbitCarousel } from '../../components/ui/OrbitCarousel';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Reveal, RevealItem } from '../../components/motion/Reveal';
import { editionMedia } from '../../data/media';
import { agendaDays, agendaTypeLabels } from '../../data/agenda';
import { speakersByEdition } from '../../data/speakers';
import { publicTickets, ticketAvailability } from '../../data/tickets';
import { formatCop, formatTimeRange, withVat } from '../../utils/format';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';

const quietTypes = ['break', 'almuerzo', 'coctel', 'registro', 'networking'];

const jumpLinks = [{
  id: 'agenda',
  label: 'Agenda'
}, {
  id: 'speakers',
  label: 'Speakers'
}, {
  id: 'ubicacion',
  label: 'Ubicación'
}, {
  id: 'tickets',
  label: 'Tickets'
}];

function SectionHeader({
  eyebrow,
  title,
  lead



}: {eyebrow: string;title: string;lead?: string;}) {
  return <div className="max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">{eyebrow}</p>
      <DisplayTitle as="h2" size="md" className="mt-3" parts={[{
      text: title,
      tone: 'bold'
    }]} />
      {lead ? <p className="mt-3 text-base leading-relaxed text-ink">{lead}</p> : null}
    </div>;
}

/**
 * Todo lo que un profesional necesita para decidir y prepararse: agenda,
 * speakers, ubicación y tickets, en una sola página con navegación de
 * salto — en vez de cuatro pestañas separadas. Las preguntas frecuentes
 * viven en su propia pestaña "Preguntas y respuestas", y la participación
 * de marca (audiencia distinta) en "Registro".
 */
export function EventProgram() {
  const {
    edition
  } = useOutletContext<{edition: Edition;}>();

  const days = agendaDays(edition.id);
  const [activeDay, setActiveDay] = useState(days[0]?.day ?? 1);
  const day = days.find((item) => item.day === activeDay) ?? days[0];

  const speakerSlots = speakersByEdition(edition.id);
  const publishedSpeakers = speakerSlots.filter((speaker) => speaker.status === 'publicado');
  const [proposalTopic, setProposalTopic] = useState<string | null>(null);

  const tickets = publicTickets(edition.id);

  const availableJumps = jumpLinks.filter((link) => edition.sections.includes(link.id as 'agenda' | 'speakers' | 'ubicacion' | 'tickets'));

  return <PageTransition>
      <EventPageHeader eyebrow="Agenda" image={editionMedia[edition.id]} parts={[{
      text: 'Todo lo que necesitas',
      tone: 'bold'
    }, {
      text: 'para vivir el evento',
      tone: 'light'
    }]} lead="Agenda, speakers, ubicación y tickets — en un solo lugar, sin ir y venir entre pestañas.">
        {availableJumps.length > 0 ? <div className="flex flex-wrap gap-2">
            {availableJumps.map((link) => <a key={link.id} href={`#${link.id}`} className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white/85 transition-colors duration-150 ease-emphasis hover:border-white hover:text-white">
                {link.label}
              </a>)}
          </div> : null}
      </EventPageHeader>

      {/* Agenda */}
      {edition.sections.includes('agenda') ? <section id="agenda" className="scroll-mt-20 tint-aurora">
          <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeader eyebrow="Agenda" title={edition.status === 'historico' ? 'Programa realizado' : 'Programa académico'} lead={edition.status === 'historico' ? 'Registro del programa ejecutado en la primera edición.' : 'La estructura de los días está definida. Los horarios exactos se publican cuando el comité académico los apruebe.'} />
              {days.length > 1 ? <div className="flex flex-wrap gap-2" role="tablist" aria-label="Días del evento">
                  {days.map((item) => {
                const isActive = item.day === activeDay;
                return <button key={item.day} type="button" role="tab" aria-selected={isActive} onClick={() => setActiveDay(item.day)} className={`relative rounded-2xl px-5 py-3 text-left transition-colors duration-200 ease-emphasis ${isActive ? 'text-white' : 'text-ink hover:text-brand'}`}>
                        {isActive ? <motion.span layoutId="program-agenda-day-pill" className="grad-futuro absolute inset-0 rounded-2xl shadow-elev3" transition={{
                    type: 'spring',
                    stiffness: 320,
                    damping: 30
                  }} /> : <span className="absolute inset-0 rounded-2xl border border-line" aria-hidden="true" />}
                        <span className="relative block text-sm font-semibold">Día {item.day}</span>
                        <span className="relative mt-0.5 block text-xs opacity-70">{item.label}</span>
                      </button>;
              })}
                </div> : null}
            </div>

            {day ? <>
                <div className="mt-9 flex flex-wrap items-baseline justify-between gap-3 rounded-2xl border border-white bg-white/80 px-6 py-4 shadow-elev1 backdrop-blur">
                  <h3 className="text-xl font-bold tracking-tight text-brand">{day.label}</h3>
                  <p className="text-sm font-semibold text-accent">{day.concept}</p>
                </div>

                <AnimatePresence mode="wait">
                  <motion.ol key={day.day} initial={{
                opacity: 0,
                y: 10
              }} animate={{
                opacity: 1,
                y: 0
              }} exit={{
                opacity: 0,
                y: -8
              }} transition={{
                duration: DURATION.panel,
                ease: EASE_EMPHASIS
              }} className="mt-5 space-y-2.5">
                    {day.items.map((item, index) => {
                  const track = edition.trackAxis.tracks.find((entry) => entry.id === item.trackId);
                  const itemSpeakers = speakerSlots.filter((speaker) => item.speakerIds.includes(speaker.id));
                  const isQuiet = quietTypes.includes(item.type);
                  return <motion.li key={item.id} initial={{
                    opacity: 0,
                    x: -14
                  }} animate={{
                    opacity: 1,
                    x: 0
                  }} transition={{
                    duration: 0.24,
                    ease: EASE_EMPHASIS,
                    delay: Math.min(index, 8) * 0.035
                  }} whileHover={{
                    x: 5
                  }} className={`relative flex flex-wrap gap-x-6 gap-y-3 overflow-hidden rounded-2xl border border-white px-5 py-5 shadow-elev1 backdrop-blur transition-shadow duration-200 ease-emphasis hover:shadow-elev3 sm:px-6 ${isQuiet ? 'bg-white/55' : 'bg-white/90'}`}>
                          <span className={`absolute inset-y-0 left-0 w-1 ${isQuiet ? 'bg-line' : 'grad-futuro'}`} aria-hidden="true" />
                          <div className="w-[112px] shrink-0 pl-1">
                            <p className="text-sm font-semibold text-brand">
                              {item.start === 'PENDIENTE' ? <Pending /> : formatTimeRange(item.start, item.end)}
                            </p>
                            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                              {agendaTypeLabels[item.type]}
                            </p>
                          </div>

                          <div className="min-w-[240px] flex-1">
                            <div className="flex items-start gap-3">
                              {track ? <TrackIcon icon={track.icon} size={22} className="mt-0.5 shrink-0 text-brand" /> : null}
                              <div>
                                <h4 className={`text-base font-semibold leading-snug ${isQuiet ? 'text-ink' : 'text-brand'}`}>
                                  {item.title}
                                </h4>
                                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                                  {item.description}
                                </p>
                                {itemSpeakers.length > 0 ? <ul className="mt-2.5 space-y-1">
                                    {itemSpeakers.map((speaker) => <li key={speaker.id} className="flex items-center gap-2 text-sm">
                                        <span className="text-ink-muted">{speaker.slotLabel}:</span>
                                        {speaker.status === 'confirmado' || speaker.status === 'publicado' ? <span className="font-medium text-brand">{speaker.name}</span> : <Pending note="speaker por confirmar" />}
                                      </li>)}
                                  </ul> : null}
                              </div>
                            </div>
                          </div>

                          <div className="text-sm text-ink-muted">
                            {item.room === 'PENDIENTE' ? <Pending /> : item.room}
                          </div>
                        </motion.li>;
                })}
                  </motion.ol>
                </AnimatePresence>
              </> : <div className="mt-9 rounded-3xl border border-dashed border-line bg-white/70 px-6 py-14 text-center backdrop-blur">
                <p className="text-base font-medium text-brand">Agenda no publicada</p>
                <p className="mt-1.5 text-sm text-ink-muted">
                  El programa se publica cuando el comité académico lo aprueba.
                </p>
              </div>}
          </div>
        </section> : null}

      {/* Speakers */}
      {edition.sections.includes('speakers') ? <section id="speakers" className="scroll-mt-20 surface-deep relative isolate overflow-hidden py-16 text-white lg:py-20">
          <div className="relative mx-auto max-w-shell px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-hb-violet">Speakers</p>
            <DisplayTitle as="h2" size="md" surface="dark" className="mt-3" parts={[{
          text: 'Quién dicta cada puente',
          tone: 'bold'
        }]} />
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/85">
              Solo publicamos speakers confirmados. Mientras el comité académico cierra cada
              invitación, mostramos el espacio reservado y su tema.
            </p>

            <div className="mt-10">
              {publishedSpeakers.length > 0 ? <OrbitCarousel surface="dark" items={publishedSpeakers.map((speaker) => ({
            id: speaker.id,
            label: speaker.name,
            content: <>
                        <span className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-hb-violet">
                          <UserRoundIcon size={24} />
                        </span>
                        <span className="mt-6 block text-xl font-bold leading-snug tracking-tight text-white">
                          {speaker.name}
                        </span>
                        <span className="mt-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-hb-violet">
                          {speaker.specialty}
                        </span>
                        <span className="mt-3 block text-sm leading-relaxed text-white/75">
                          {speaker.bio}
                        </span>
                      </>
          }))} /> : <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-8 backdrop-blur lg:p-10">
                  <Reveal>
                    <ul className="grid gap-3 md:grid-cols-2">
                      {speakerSlots.map((slot) => {
                  const track = edition.trackAxis.tracks.find((entry) => entry.id === slot.trackId);
                  const topic = slot.talks[0] === 'PENDIENTE' ? slot.slotLabel : slot.talks[0];
                  return <RevealItem key={slot.id}>
                            <button type="button" onClick={() => setProposalTopic(topic)} className="flex h-full w-full items-start gap-4 rounded-2xl border border-white/15 bg-white/[0.05] px-5 py-5 text-left transition-colors duration-150 ease-emphasis hover:border-hb-violet/50">
                              {track ? <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/10 text-hb-violet">
                                  <TrackIcon icon={track.icon} size={24} />
                                </span> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/10 text-hb-violet">
                                  <UserRoundIcon size={20} />
                                </span>}
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                                  {slot.slotLabel}
                                </p>
                                <p className="mt-1.5 text-base font-semibold leading-snug text-white">
                                  {slot.talks[0] === 'PENDIENTE' ? 'Tema por definir' : slot.talks[0]}
                                </p>
                                <p className="mt-1 text-sm text-white/60">{slot.specialty}</p>
                                <p className="mt-2 text-xs font-semibold text-hb-violet">
                                  Proponer un speaker para este espacio
                                </p>
                              </div>
                            </button>
                          </RevealItem>;
                })}
                    </ul>
                  </Reveal>

                  <div className="mt-8 flex flex-wrap gap-3 border-t border-white/15 pt-6">
                    <button type="button" onClick={() => setProposalTopic('')} className="grad-futuro rounded-full px-5 py-3 text-sm font-semibold text-white shadow-elev2 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                      Proponer un speaker
                    </button>
                    <Link to="../inscripcion" className="rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 ease-emphasis hover:border-white">
                      Avísame cuando se publiquen
                    </Link>
                  </div>
                </div>}
            </div>
          </div>
        </section> : null}

      {/* Ubicación */}
      {edition.sections.includes('ubicacion') ? <section id="ubicacion" className="scroll-mt-20 tint-aurora">
          <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
            <SectionHeader eyebrow="Ubicación" title="Cómo llegar y dónde quedarte" lead={`${edition.venue.name} · ${edition.venue.city}, ${edition.venue.country}. Sede, accesos, transporte y hoteles con tarifa preferencial.`} />

            <Reveal className="mt-9 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
              <RevealItem>
                <div className="card-lift h-full rounded-3xl border border-white bg-white/90 p-8 shadow-elev2 backdrop-blur">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    <MapPinIcon size={15} className="text-accent" /> Sede
                  </span>
                  <h3 className="mt-4 text-2xl font-bold tracking-tight text-brand">{edition.venue.name}</h3>
                  <p className="mt-2 text-base text-ink">
                    {edition.venue.city}, {edition.venue.country}
                  </p>
                  <dl className="mt-6 divide-y divide-line border-t border-line">
                    {[{
                  label: 'Dirección',
                  value: edition.venue.address ?? 'PENDIENTE'
                }, {
                  label: 'Capacidad',
                  value: 'PENDIENTE'
                }, {
                  label: 'Parqueadero',
                  value: 'PENDIENTE'
                }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 py-3">
                        <dt className="text-sm text-ink-muted">{row.label}</dt>
                        <dd className="text-sm font-medium text-brand">
                          {row.value === 'PENDIENTE' ? <Pending /> : row.value}
                        </dd>
                      </div>)}
                  </dl>
                </div>
              </RevealItem>

              <RevealItem>
                <ul className="grid h-full gap-4">
                  {[{
                icon: PlaneIcon,
                title: 'Llegada aérea',
                text: 'Aeropuerto José María Córdova (MDE). Traslados: PENDIENTE.'
              }, {
                icon: CarIcon,
                title: 'Transporte urbano',
                text: 'Rutas y recomendaciones de movilidad: PENDIENTE.'
              }, {
                icon: BedDoubleIcon,
                title: 'Hoteles aliados',
                text: 'Convenios y tarifas preferenciales: PENDIENTE.'
              }].map((item) => <li key={item.title} className="card-lift relative overflow-hidden rounded-2xl border border-white bg-white/90 p-6 shadow-elev1 backdrop-blur">
                      <span className="grad-futuro absolute inset-y-0 left-0 w-1" aria-hidden="true" />
                      <item.icon size={20} className="text-accent" />
                      <h4 className="mt-3 text-base font-bold text-brand">{item.title}</h4>
                      <p className="mt-1.5 text-sm text-ink-muted">{item.text}</p>
                    </li>)}
                </ul>
              </RevealItem>
            </Reveal>
          </div>
        </section> : null}

      {/* Tickets */}
      {edition.sections.includes('tickets') ? <section id="tickets" className="scroll-mt-20 surface-deep relative isolate overflow-hidden py-16 text-white lg:py-20">
          <div className="relative mx-auto max-w-shell px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-hb-violet">Tickets</p>
            <DisplayTitle as="h2" size="md" surface="dark" className="mt-3" parts={[{
          text: 'Modalidades de inscripción',
          tone: 'bold'
        }]} />
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/85">
              Las tarifas están en revisión. Puedes reservar tu lugar en la lista de preventa y te
              avisamos en el momento en que se publiquen.
            </p>

            <Reveal className="mt-9">
              <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {tickets.map((ticket) => {
              const available = ticketAvailability(ticket);
              const finalPrice = withVat(ticket.price, ticket.vatRate);
              const soldOut = available === 0;
              return <RevealItem key={ticket.id} className="h-full">
                      <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/[0.06] p-7 backdrop-blur">
                        <span className="grad-futuro absolute inset-x-0 top-0 h-1" aria-hidden="true" />
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold leading-snug text-white">{ticket.name}</h3>
                            <p className="mt-1 text-xs uppercase tracking-wide text-white/55">{ticket.modality}</p>
                          </div>
                          {soldOut ? <StatusBadge label="Agotado" tone="warning" /> : null}
                        </div>

                        <div className="mt-5">
                          {ticket.price === null ? <Pending note="tarifa en revisión" /> : <>
                              <p className="text-2xl font-bold text-white">{formatCop(finalPrice)}</p>
                              <p className="mt-1 text-xs text-white/55">{formatCop(ticket.price)} + IVA</p>
                            </>}
                        </div>

                        <ul className="mt-5 space-y-2">
                          {ticket.benefits.map((benefit) => <li key={benefit} className="flex gap-2.5 text-sm text-white/85">
                              <CheckIcon size={16} className="mt-0.5 shrink-0 text-hb-violet" />
                              {benefit}
                            </li>)}
                        </ul>

                        <div className="mt-auto pt-6">
                          <p className="mb-3 text-xs text-white/55">
                            Cupo: {ticket.quota} · Disponibles: {available}
                          </p>
                          <Link to={`../inscripcion?ticket=${ticket.id}`} className={`block rounded-full px-4 py-3 text-center text-sm font-semibold transition-transform duration-200 ease-emphasis ${soldOut ? 'border border-white/25 text-white/60' : 'grad-futuro text-white shadow-elev2 hover:-translate-y-0.5'}`}>
                            {soldOut ? 'Unirme a la lista de espera' : ticket.price === null ? 'Reservar mi lugar' : 'Inscribirme'}
                          </Link>
                        </div>
                      </div>
                    </RevealItem>;
            })}
              </ul>
            </Reveal>

            <div className="mt-8 rounded-3xl border border-white/15 bg-white/[0.06] p-7 backdrop-blur">
              <h3 className="text-base font-bold tracking-tight text-white">Pagos y facturación</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
                Los pagos se procesan con Wompi. Al aprobarse la transacción, el registro se confirma
                y se emite el código QR de acceso.
              </p>
            </div>
          </div>
        </section> : null}

      <SpeakerProposalModal open={proposalTopic !== null} topic={proposalTopic ?? ''} editionName={edition.name} onClose={() => setProposalTopic(null)} />
    </PageTransition>;
}
