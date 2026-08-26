import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageTransition } from '../../components/motion/PageTransition';
import { CommunitySignup } from '../../components/public/CommunitySignup';
import { fetchSecondaryEvents } from '../../lib/publicData';
import type { SecondaryEvent } from '../../types/content';
import { editions, featuredEditionId } from '../../data/editions';
import { formatFullDate } from '../../utils/format';
import { TrackIcon } from '../../components/ui/TrackIcon';
import { Reveal, RevealItem } from '../../components/motion/Reveal';
import { PageHero } from '../../components/public/PageHero';
import { media } from '../../data/media';
export function Community() {
  const edition = editions.find((item) => item.id === featuredEditionId);
  const [upcoming, setUpcoming] = useState<SecondaryEvent[]>([]);
  useEffect(() => {
    fetchSecondaryEvents().then((events) => setUpcoming(events.filter((event) => event.status === 'aprobado' || event.status === 'publicado')));
  }, []);
  return <PageTransition>
      <PageHero eyebrow="Comunidad médica" title={[{
      text: 'Un solo registro',
      tone: 'bold'
    }, {
      text: 'para toda la agenda académica',
      tone: 'light'
    }]} lead="Recibe la apertura de inscripciones, los webinars y el contenido académico segmentado por tu área de interés real." image={media.stage} />

      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-start">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-support">
                Cómo funciona
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-brand">
                Te escribimos solo de lo que te interesa
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-ink">
                Al unirte recibes la apertura de inscripciones, los webinars, el contenido académico
                por área de interés y las novedades de cada edición.
              </p>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-muted">
                Tu autorización de comunicaciones comerciales es separada y revocable. Los datos de la
                comunidad no se entregan automáticamente a patrocinadores.{' '}
                <Link to="/legal" className="font-semibold text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand">
                  Ver política
                </Link>
                .
              </p>
            </div>
            <div className="rounded-xl border border-line bg-canvas p-6 lg:p-8">
              <CommunitySignup />
            </div>
          </div>
        </div>
      </section>

      {edition && edition.trackAxis.tracks.length > 0 ? <section className="tint-violet border-b border-line">
          <div className="mx-auto max-w-shell px-6 py-14">
            <Reveal>
              <RevealItem>
                <h2 className="text-2xl font-bold tracking-tight text-brand">
                  Segmentamos por interés real
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink">
                  El campo de interés se configura por evento. En {edition.name} son los seis puentes:
                  eso determina qué contenido recibes y con quién te conectamos en el networking.
                </p>
              </RevealItem>
              <RevealItem>
                <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {edition.trackAxis.tracks.map((track) => <li key={track.id} className="card-lift flex items-start gap-3 rounded-2xl border border-line bg-white px-5 py-5" style={{
                ['--accent-rgb' as string]: edition.accentRgb
              }}>
                      <TrackIcon icon={track.icon} className="mt-0.5 shrink-0 text-accent" />
                      <div>
                        <p className="text-sm font-semibold text-brand">{track.name}</p>
                        <p className="mt-1 text-sm text-ink-muted">{track.subtitle}</p>
                      </div>
                    </li>)}
                </ul>
              </RevealItem>
            </Reveal>
          </div>
        </section> : null}

      <section className="bg-white">
        <div className="mx-auto max-w-shell px-6 py-14 lg:py-20">
          <h2 className="text-2xl font-bold tracking-tight text-brand">Próximas actividades</h2>
          {upcoming.length === 0 ? <p className="mt-4 text-sm text-ink-muted">
              No hay actividades publicadas en este momento.
            </p> : <ul className="mt-8 grid gap-5 md:grid-cols-2">
              {upcoming.map((event) => <li key={event.id} className="rounded-xl border border-line bg-canvas p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    {event.kind} · {event.modality}
                  </p>
                  <h3 className="mt-2.5 text-lg font-semibold leading-snug text-brand">
                    {event.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted">
                    {formatFullDate(event.date)} · {event.time} h
                  </p>
                  <p className="mt-4 text-sm text-ink">
                    Speaker: <span className="font-medium">{event.speakerLabel}</span>
                  </p>
                </li>)}
            </ul>}
        </div>
      </section>
    </PageTransition>;
}