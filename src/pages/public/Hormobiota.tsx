import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRightIcon } from 'lucide-react';
import { PageTransition } from '../../components/motion/PageTransition';
import { ScrollScene } from '../../components/motion/ScrollScene';
import { FlipCountdown } from '../../components/event/FlipCountdown';
import { LegacyOrbit } from '../../components/public/LegacyOrbit';
import { BridgesDeck } from '../../components/public/BridgesDeck';
import { NextEventPanel } from '../../components/public/NextEventPanel';
import { RotatingWord } from '../../components/ui/RotatingWord';
import { editions, featuredEditionId, getFamily } from '../../data/editions';
import { legacyEvents } from '../../data/legacy';
import { media } from '../../data/media';
import { EASE_EMPHASIS } from '../../utils/motion';

/**
 * Página de marca de Hormobiota. Es el producto principal de Eventos Médicos
 * LATAM: aquí se explica qué es, de dónde viene y a dónde va. Usa el mismo
 * sistema visual del resto del sitio — campo de color continuo, trama viva y
 * profundidad real — con la identidad lavanda como acento propio.
 */
export function Hormobiota() {
  const heroRef = useRef<HTMLDivElement>(null);
  const thesisRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const {
    scrollYProgress
  } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16]);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-14%']);
  const logoScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.82]);
  const heroFade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  // El bloque de tesis gira levemente al entrar: profundidad ligada al scroll.
  const {
    scrollYProgress: thesisProgress
  } = useScroll({
    target: thesisRef,
    offset: ['start end', 'center center']
  });
  const thesisRotate = useTransform(thesisProgress, [0, 1], [7, 0]);
  const thesisY = useTransform(thesisProgress, [0, 1], [56, 0]);
  const edition = editions.find((item) => item.id === featuredEditionId);
  const family = edition ? getFamily(edition.familyId) : undefined;
  const eventPath = edition && family ? `/eventos/${family.slug}/${edition.slug}` : '/eventos';
  const previous = legacyEvents.find((item) => item.id === 'leg-hormobiota-1');
  return <PageTransition>
      {/* Hero de marca */}
      <section ref={heroRef} className="surface-deep relative isolate flex min-h-[94svh] items-center overflow-hidden" style={{
      ['--accent-rgb' as string]: 'var(--tone-hormobiota)'
    }}>
        <motion.div className="absolute inset-0 -z-20" style={reduce ? undefined : {
        y: imageY,
        scale: imageScale
      }}>
          <img src={media.hormobiotaHero} alt="" aria-hidden="true" className="h-full w-full object-cover opacity-45" />
        </motion.div>
        <div className="absolute inset-0 -z-10" aria-hidden="true" style={{
        background: 'linear-gradient(180deg, rgba(26,26,61,0.92) 0%, rgba(26,26,61,0.74) 42%, rgba(26,26,61,0.98) 100%)'
      }} />

        <motion.div className="mx-auto w-full max-w-shell px-6 py-28" style={reduce ? undefined : {
        y: contentY,
        opacity: heroFade
      }}>
          {/* Firma corporativa: la empresa avala, el producto protagoniza */}
          <motion.div initial={{
          opacity: 0,
          y: 12
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.28,
          ease: EASE_EMPHASIS
        }} className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Un proyecto de
            </span>
            <img src={media.logoWhite} alt="Eventos Médicos LATAM" className="h-5 w-auto opacity-90" draggable={false} />
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          y: 30,
          rotateX: -10
        }} animate={{
          opacity: 1,
          y: 0,
          rotateX: 0
        }} transition={{
          duration: 0.32,
          ease: EASE_EMPHASIS,
          delay: 0.08
        }} style={reduce ? undefined : {
          scale: logoScale,
          transformOrigin: 'left center'
        }} className="mt-9 inline-block">
            <img src={media.logoHormobiotaDark} alt="HormoBiota 2.0 — donde se unen las hormonas con la microbiota" className="h-36 w-auto sm:h-48 lg:h-56" draggable={false} />
          </motion.div>

          <motion.p initial={{
          opacity: 0,
          y: 16
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.3,
          ease: EASE_EMPHASIS,
          delay: 0.16
        }} className="mt-10 max-w-3xl text-[clamp(1.25rem,2.6vw,1.9rem)] font-medium leading-snug text-white">
            Donde el intestino{' '}
            <RotatingWord words={['conversa', 'regula', 'decide']} className="font-bold text-hb-violet" />{' '}
            con las hormonas.
          </motion.p>

          <motion.div initial={{
          opacity: 0,
          y: 16
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.3,
          ease: EASE_EMPHASIS,
          delay: 0.24
        }} className="mt-10 flex flex-wrap items-center gap-4">
            <Link to={eventPath} className="grad-futuro group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-elev3 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
              Conocer Hormobiota 2
              <ArrowRightIcon size={16} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-1" />
            </Link>
            {edition ? <FlipCountdown targetDate={edition.startDate} size="sm" /> : null}
          </motion.div>
        </motion.div>
      </section>

      {/* Qué es — panel que se endereza con el scroll */}
      <section className="tint-aurora py-20 lg:py-28">
        <div ref={thesisRef} className="mx-auto max-w-shell px-6 [perspective:1400px]">
          <motion.div style={reduce ? undefined : {
          rotateX: thesisRotate,
          y: thesisY
        }} className="rounded-[2rem] border border-white bg-white/85 p-8 shadow-elev4 backdrop-blur sm:p-12">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-hb-deep">
                  Qué es Hormobiota
                </p>
                <h2 className="mt-4 text-[clamp(1.9rem,3.8vw,3rem)] font-bold leading-[1.03] tracking-tight text-hb-ink">
                  No es un congreso más
                  <span className="block font-normal text-ink-muted">es una tesis clínica</span>
                </h2>
              </div>
              <div className="space-y-5 text-lg leading-relaxed text-ink">
                <p>
                  Durante años la medicina estudió cada sistema por separado: el intestino por un
                  lado, las hormonas por otro, la inmunidad en su propio capítulo. Hormobiota parte
                  de la idea contraria — que esos sistemas se hablan permanentemente y que entender
                  esa conversación cambia lo que hacemos en consulta.
                </p>
                <p>
                  El nombre lo dice todo:{' '}
                  <strong className="font-semibold text-hb-ink">
                    donde se unen las hormonas con la microbiota
                  </strong>
                  . Cada edición amplía el mapa de conexiones y traduce la evidencia a decisiones
                  concretas para el profesional que atiende pacientes reales.
                </p>
                <p>
                  Es el producto principal de Eventos Médicos LATAM y su línea académica permanente:
                  no un evento aislado, sino un programa que continúa entre congreso y congreso con
                  webinars, conversatorios, contenido y comunidad.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Los seis puentes, en baraja 3D */}
      {edition ? <section className="surface-deep relative isolate overflow-hidden py-20 text-white lg:py-28" style={{
      ['--accent-rgb' as string]: 'var(--tone-hormobiota)'
    }}>
          <div className="relative mx-auto max-w-shell px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-hb-violet">
              {edition.trackAxis.pluralLabel}
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(1.9rem,3.8vw,3rem)] font-bold leading-[1.03] tracking-tight">
              El cuerpo leído
              <span className="block font-normal text-white/55">como una sola red</span>
            </h2>

            <BridgesDeck tracks={edition.trackAxis.tracks} label={edition.trackAxis.pluralLabel} />

            <Link to={`${eventPath}/agenda`} className="group mt-12 inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:border-white">
              Ver el programa completo
              <ArrowRightIcon size={16} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-1" />
            </Link>
          </div>
        </section> : null}

      {/* Trayectoria completa */}
      <LegacyOrbit />

      {/* De dónde viene */}
      {previous ? <ScrollScene depth="soft">
          <section className="tint-aurora py-20 lg:py-28">
            <div className="mx-auto max-w-shell px-6">
              <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                <motion.div initial={{
              opacity: 0,
              y: 24,
              rotateY: -8
            }} whileInView={{
              opacity: 1,
              y: 0,
              rotateY: 0
            }} viewport={{
              once: true,
              margin: '-80px'
            }} transition={{
              duration: 0.3,
              ease: EASE_EMPHASIS
            }} className="overflow-hidden rounded-3xl shadow-elev4 [perspective:1200px]">
                  <img src={previous.image} alt="Primera edición de Hormobiota" className="aspect-[4/3] w-full object-cover" />
                </motion.div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-hb-deep">
                    La primera edición
                  </p>
                  <h2 className="mt-4 text-[clamp(1.8rem,3.4vw,2.7rem)] font-bold leading-[1.04] tracking-tight text-hb-ink">
                    Hormobiota 2026
                    <span className="block font-normal text-ink-muted">donde empezó todo</span>
                  </h2>
                  <p className="mt-5 text-lg leading-relaxed text-ink">{previous.description}</p>
                  <dl className="mt-8 grid grid-cols-2 gap-4">
                    {[{
                  label: 'Asistentes',
                  value: previous.attendees ?? '—'
                }, {
                  label: 'Año',
                  value: previous.year
                }].map((item) => <div key={item.label} className="rounded-2xl border border-white bg-white/80 p-5 shadow-elev1 backdrop-blur">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                          {item.label}
                        </dt>
                        <dd className="mt-1 text-3xl font-bold tabular-nums text-hb-ink">
                          {item.value}
                        </dd>
                      </div>)}
                  </dl>
                  <Link to="/eventos/hormobiota/hormobiota-2026" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-hb-deep underline decoration-hb-violet underline-offset-4 transition-colors duration-150 ease-emphasis hover:text-hb-ink">
                    Ver las memorias de 2026
                    <ArrowRightIcon size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </ScrollScene> : null}

      {/* Próxima edición: el panel de preventa vive aquí, no en la Home */}
      <ScrollScene depth="soft">
        <NextEventPanel />
      </ScrollScene>
    </PageTransition>;
}