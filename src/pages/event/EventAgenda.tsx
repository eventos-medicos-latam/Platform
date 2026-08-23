import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { Edition } from '../../types/event';
import { PageTransition } from '../../components/motion/PageTransition';
import { EventPageHeader } from '../../components/event/EventPageHeader';
import { editionMedia } from '../../data/media';
import { agendaDays, agendaTypeLabels } from '../../data/agenda';
import { speakersByEdition } from '../../data/speakers';
import { TrackIcon } from '../../components/ui/TrackIcon';
import { Pending } from '../../components/ui/Pending';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';
import { formatTimeRange } from '../../utils/format';
const quietTypes = ['break', 'almuerzo', 'coctel', 'registro', 'networking'];
export function EventAgenda() {
  const {
    edition
  } = useOutletContext<{
    edition: Edition;
  }>();
  const days = agendaDays(edition.id);
  const [activeDay, setActiveDay] = useState(days[0]?.day ?? 1);
  const day = days.find((item) => item.day === activeDay) ?? days[0];
  const speakers = speakersByEdition(edition.id);
  return <PageTransition>
      <EventPageHeader eyebrow="Agenda" image={editionMedia[edition.id]} parts={edition.status === 'historico' ? [{
      text: 'Programa',
      tone: 'bold'
    }, {
      text: 'realizado',
      tone: 'light'
    }] : [{
      text: 'Programa',
      tone: 'bold'
    }, {
      text: 'académico',
      tone: 'light'
    }]} lead={edition.status === 'historico' ? 'Registro del programa ejecutado en la primera edición.' : 'La estructura de los dos días está definida. Los horarios exactos se publican cuando el comité académico los apruebe.'} facts={[{
      label: 'Días',
      value: String(days.length)
    }, {
      label: 'Bloques',
      value: String(days.reduce((total, item) => total + item.items.length, 0))
    }, {
      label: 'Puentes',
      value: String(edition.trackAxis.tracks.length)
    }]}>
        {days.length > 1 ? <div className="flex flex-wrap gap-2" role="tablist" aria-label="Días del evento">
            {days.map((item) => {
          const isActive = item.day === activeDay;
          return <button key={item.day} type="button" role="tab" aria-selected={isActive} onClick={() => setActiveDay(item.day)} className={`relative rounded-2xl px-5 py-3 text-left transition-colors duration-200 ease-emphasis ${isActive ? 'text-white' : 'text-white/70 hover:text-white'}`}>
                  {isActive ? <motion.span layoutId="agenda-day-pill" className="grad-futuro absolute inset-0 rounded-2xl shadow-elev3" transition={{
              type: 'spring',
              stiffness: 320,
              damping: 30
            }} /> : <span className="absolute inset-0 rounded-2xl border border-white/20" aria-hidden="true" />}
                  <span className="relative block text-sm font-semibold">Día {item.day}</span>
                  <span className="relative mt-0.5 block text-xs opacity-70">{item.label}</span>
                </button>;
        })}
          </div> : null}
      </EventPageHeader>

      <section className="tint-aurora">
        <div className="mx-auto max-w-shell px-6 py-14 lg:py-20">
          {day ? <>
              <div className="flex flex-wrap items-baseline justify-between gap-3 rounded-2xl border border-white bg-white/80 px-6 py-4 shadow-elev1 backdrop-blur">
                <h2 className="text-xl font-bold tracking-tight text-brand">{day.label}</h2>
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
                const itemSpeakers = speakers.filter((speaker) => item.speakerIds.includes(speaker.id));
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
                        {/* Filo del puente al que pertenece el bloque */}
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
                              <h3 className={`text-base font-semibold leading-snug ${isQuiet ? 'text-ink' : 'text-brand'}`}>
                                {item.title}
                              </h3>
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

              <p className="mt-6 rounded-2xl border border-white bg-white/70 px-5 py-4 text-sm text-ink-muted backdrop-blur">
                La agenda es un borrador configurable: el orden y los horarios pueden ajustarse hasta la
                publicación definitiva.
              </p>
            </> : <div className="rounded-3xl border border-dashed border-line bg-white/70 px-6 py-14 text-center backdrop-blur">
              <p className="text-base font-medium text-brand">Agenda no publicada</p>
              <p className="mt-1.5 text-sm text-ink-muted">
                El programa se publica cuando el comité académico lo aprueba.
              </p>
            </div>}
        </div>
      </section>
    </PageTransition>;
}