import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRightIcon, CalendarDaysIcon, MapPinIcon } from 'lucide-react';
import { media } from '../../data/media';
import { organization } from '../../data/organization';
import {
  eventAccentRgb, getFeaturedPublicEvent, publicDateLabel, publicEventPath, publicVenueLabel,
} from '../../lib/novo/events';
import type { NovoEvent } from '../../types/novo';
import { FlipCountdown } from '../event/FlipCountdown';
import { RotatingWord } from '../ui/RotatingWord';
import { EASE_EMPHASIS } from '../../utils/motion';

/** Palabras que rotan en el titular: el verbo cambia, la promesa se mantiene. */
const claimVerbs = ['conecta', 'transforma', 'trasciende'];

/**
 * Hero de bienvenida: el logo es protagonista a escala grande, el titular tiene
 * una palabra viva que rota, y todo el bloque se transforma de forma continua
 * mientras haces scroll.
 */
export function HomeHero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [edition, setEdition] = useState<NovoEvent | null>(null);
  const {
    scrollYProgress
  } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.18]);
  const logoScale = useTransform(scrollYProgress, [0, 0.55], [1, 0.72]);
  const logoOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-14%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const veil = useTransform(scrollYProgress, [0, 1], [0, 0.55]);
  const eventPath = edition ? publicEventPath(edition) : '/eventos';
  const eventTitle = edition
    ? [edition.name, edition.tagline].filter(Boolean).join(' — ')
    : '';
  const countdownDate = edition?.start_date?.slice(0, 10) ?? '';

  useEffect(() => {
    let alive = true;
    getFeaturedPublicEvent()
      .then((event) => { if (alive) setEdition(event); })
      .catch(() => { if (alive) setEdition(null); });
    return () => { alive = false; };
  }, []);
  return <section ref={ref} className="relative isolate min-h-[100svh] overflow-hidden bg-brand-deep">
      {/* Fotografía con parallax */}
      <motion.div className="absolute inset-0 -z-20" style={reduce ? undefined : {
      y: imageY,
      scale: imageScale
    }}>
        <img src={media.heroAuditorium} alt="Auditorio durante una conferencia médica" className="h-full w-full object-cover" />
      </motion.div>
      <div className="absolute inset-0 -z-10" style={{
      background: 'linear-gradient(180deg, rgba(6,17,33,0.94) 0%, rgba(6,17,33,0.86) 45%, rgba(6,17,33,0.98) 100%)'
    }} aria-hidden="true" />
      {/* Velo que se oscurece al bajar: la transición al siguiente bloque es continua */}
      <motion.div className="absolute inset-0 -z-10 bg-brand-deep" style={reduce ? undefined : {
      opacity: veil
    }} aria-hidden="true" />

      <div className="mx-auto flex min-h-[100svh] max-w-shell flex-col justify-center px-6 pb-14 pt-28">
        {/* Logo protagonista */}
        <motion.div style={reduce ? undefined : {
        scale: logoScale,
        opacity: logoOpacity
      }} className="origin-left">
          <motion.img src={media.logoWhite} alt="Eventos Médicos LATAM" className="h-14 w-auto sm:h-20 lg:h-[104px]" initial={{
          opacity: 0,
          y: 24
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.3,
          ease: EASE_EMPHASIS,
          delay: 0.06
        }} draggable={false} />
        </motion.div>

        <motion.div className="mt-10" style={reduce ? undefined : {
        y: contentY,
        opacity: contentOpacity
      }}>
          <motion.p initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.28,
          ease: EASE_EMPHASIS,
          delay: 0.18
        }} className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/65">
            <span className="h-px w-10 bg-accent" aria-hidden="true" />
            {organization.city} · Educación médica continua
          </motion.p>

          {/* Titular con palabra viva */}
          <h1 className="mt-6 max-w-4xl text-[clamp(2.3rem,6.4vw,5rem)] font-bold leading-[1] tracking-tight text-white">
            <motion.span className="block" initial={{
            opacity: 0,
            y: 18
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.3,
            ease: EASE_EMPHASIS,
            delay: 0.22
          }}>
              Educación médica que
            </motion.span>
            <motion.span className="block text-accent" initial={{
            opacity: 0,
            y: 18
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.3,
            ease: EASE_EMPHASIS,
            delay: 0.28
          }}>
              <RotatingWord words={claimVerbs} />
            </motion.span>
            <motion.span className="block font-normal text-white/55" initial={{
            opacity: 0,
            y: 18
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.3,
            ease: EASE_EMPHASIS,
            delay: 0.34
          }}>
              especialidades
            </motion.span>
          </h1>

          <motion.p initial={{
          opacity: 0,
          y: 12
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.28,
          ease: EASE_EMPHASIS,
          delay: 0.4
        }} className="mt-8 max-w-xl text-lg leading-relaxed text-white/70">
            {organization.valueProposition}
          </motion.p>

          <motion.div initial={{
          opacity: 0,
          y: 12
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.28,
          ease: EASE_EMPHASIS,
          delay: 0.46
        }} className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/eventos" className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-brand-deep shadow-elev3 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
              Ver próximos eventos
              <ArrowRightIcon size={16} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-1" />
            </Link>
            <Link to="/digital" className="inline-flex items-center rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:border-white">
              Sesiones en línea
            </Link>
          </motion.div>
        </motion.div>

        {/* Próximo evento anclado al pie del hero */}
        {edition ? <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.3,
        ease: EASE_EMPHASIS,
        delay: 0.54
      }} className="mt-auto border-t border-white/12 pt-6" style={{
        ['--accent-rgb' as string]: eventAccentRgb(edition)
      }}>
            <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                  Próximo evento
                </p>
                <Link to={eventPath} className="mt-2 block text-2xl font-bold tracking-tight text-white transition-colors duration-200 ease-emphasis hover:text-white/80 sm:text-3xl">
                  {eventTitle}
                </Link>
                <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon size={15} className="text-accent" />
                    <dt className="sr-only">Fecha</dt>
                    <dd>{publicDateLabel(edition.start_date, edition.end_date)}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon size={15} className="text-accent" />
                    <dt className="sr-only">Lugar</dt>
                    <dd>
                      {publicVenueLabel(edition)}
                    </dd>
                  </div>
                </dl>
              </div>
              {countdownDate ? <FlipCountdown targetDate={countdownDate} size="md" /> : null}
            </div>
          </motion.div> : null}
      </div>
    </section>;
}