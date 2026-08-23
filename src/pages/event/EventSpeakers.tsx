import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { SpeakerProposalModal } from '../../components/event/SpeakerProposalModal';
import { UserRoundIcon } from 'lucide-react';
import type { Edition } from '../../types/event';
import { PageTransition } from '../../components/motion/PageTransition';
import { DisplayTitle } from '../../components/ui/DisplayTitle';
import { EventPageHeader } from '../../components/event/EventPageHeader';
import { media } from '../../data/media';
import { speakersByEdition } from '../../data/speakers';
import { TrackIcon } from '../../components/ui/TrackIcon';
import { OrbitCarousel } from '../../components/ui/OrbitCarousel';
import { Reveal, RevealItem } from '../../components/motion/Reveal';
export function EventSpeakers() {
  const {
    edition
  } = useOutletContext<{
    edition: Edition;
  }>();
  const slots = speakersByEdition(edition.id);
  const published = slots.filter((speaker) => speaker.status === 'publicado');
  // El tema elegido en la parrilla viaja al modal, sin cambiar de página.
  const [proposalTopic, setProposalTopic] = useState<string | null>(null);
  return <PageTransition>
      <EventPageHeader eyebrow="Speakers" image={media.stage} parts={[{
      text: 'Quién dicta',
      tone: 'bold'
    }, {
      text: 'cada puente',
      tone: 'light'
    }]} lead="Solo publicamos speakers confirmados. Mientras el comité académico cierra cada invitación, mostramos el espacio reservado y su tema." facts={[{
      label: 'Espacios académicos',
      value: String(slots.length)
    }, {
      label: 'Publicados',
      value: String(published.length)
    }]} />

      <section className="tint-aurora">
        <div className="mx-auto max-w-shell px-6 py-14 lg:py-20">
          {published.length > 0 ? <OrbitCarousel surface="light" items={published.map((speaker) => ({
          id: speaker.id,
          label: speaker.name,
          content: <>
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
                      <UserRoundIcon size={24} />
                    </span>
                    <span className="mt-6 block text-xl font-bold leading-snug tracking-tight text-brand">
                      {speaker.name}
                    </span>
                    <span className="mt-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                      {speaker.specialty}
                    </span>
                    <span className="mt-3 block text-sm leading-relaxed text-ink-muted">
                      {speaker.bio}
                    </span>
                  </>
        }))} /> : <div className="rounded-3xl border border-white bg-white/85 p-8 shadow-elev3 backdrop-blur lg:p-10">
              <DisplayTitle size="md" parts={[{
            text: 'Parrilla académica',
            tone: 'bold'
          }, {
            text: 'en confirmación',
            tone: 'light'
          }]} />
              <p className="mt-4 max-w-2xl text-base text-ink">
                Estos son los espacios académicos ya definidos. Cada uno se publicará con nombre,
                institución y biografía en el momento en que la confirmación quede firmada.
              </p>

              <Reveal>
                <ul className="mt-8 grid gap-3 md:grid-cols-2">
                  {slots.map((slot) => {
                const track = edition.trackAxis.tracks.find((entry) => entry.id === slot.trackId);
                const topic = slot.talks[0] === 'PENDIENTE' ? slot.slotLabel : slot.talks[0];
                return <RevealItem key={slot.id}>
                        <button type="button" onClick={() => setProposalTopic(topic)} className="card-lift flex h-full w-full items-start gap-4 rounded-2xl border border-line bg-white px-5 py-5 text-left shadow-elev1 hover:border-accent/50">
                          {track ? <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                              <TrackIcon icon={track.icon} size={24} />
                            </span> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                              <UserRoundIcon size={20} />
                            </span>}
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                              {slot.slotLabel}
                            </p>
                            <p className="mt-1.5 text-base font-semibold leading-snug text-brand">
                              {slot.talks[0] === 'PENDIENTE' ? 'Tema por definir' : slot.talks[0]}
                            </p>
                            <p className="mt-1 text-sm text-ink-muted">{slot.specialty}</p>
                            <p className="mt-2 text-xs font-semibold text-accent">
                              Proponer un speaker para este espacio
                            </p>
                          </div>
                        </button>
                      </RevealItem>;
              })}
                </ul>
              </Reveal>

              <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
                <button type="button" onClick={() => setProposalTopic('')} className="grad-futuro rounded-full px-5 py-3 text-sm font-semibold text-white shadow-elev2 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                  Proponer un speaker
                </button>
                <Link to="../inscripcion" className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand/40">
                  Avísame cuando se publiquen
                </Link>
              </div>
            </div>}
        </div>
      </section>

      <SpeakerProposalModal open={proposalTopic !== null} topic={proposalTopic ?? ''} editionName={edition.name} onClose={() => setProposalTopic(null)} />
    </PageTransition>;
}