import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { type MotionValue, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowRightIcon } from 'lucide-react';
import { editions, featuredEditionId, getFamily } from '../../data/editions';
import { media } from '../../data/media';
import { TrackIcon } from '../ui/TrackIcon';
import { EASE_EMPHASIS } from '../../utils/motion';
interface StepIndicatorProps {
  progress: MotionValue<number>;
  start: number;
  end: number;
}

/** Segmento del indicador: se llena mientras su puente está en pantalla. */
function StepIndicator({
  progress,
  start,
  end
}: StepIndicatorProps) {
  const scaleX = useTransform(progress, [start, end], [0, 1], {
    clamp: true
  });
  return <li className="h-1 flex-1 overflow-hidden rounded-full bg-white/12">
      <motion.span className="block h-full origin-left rounded-full bg-accent" style={{
      scaleX
    }} />
    </li>;
}

/**
 * Sección anclada: mientras haces scroll, la pantalla se queda fija y el
 * recorrido avanza lateralmente puente por puente. Es el momento protagonista
 * de la Home: el scroll deja de mover la página y empieza a mover el contenido.
 */
export function PinnedBridges() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const {
    scrollYProgress
  } = useScroll({
    target: ref,
    offset: ['start start', 'end end']
  });
  const eased = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    mass: 0.35
  });
  const edition = editions.find((item) => item.id === featuredEditionId);
  const family = edition ? getFamily(edition.familyId) : undefined;
  const tracks = edition?.trackAxis.tracks ?? [];
  const path = edition && family ? `/eventos/${family.slug}/${edition.slug}` : '/eventos';

  // Recorrido horizontal: n paneles menos el que ya está en pantalla.
  const shift = useTransform(eased, [0.06, 0.94], ['0%', `-${(tracks.length - 1) * 100}%`]);
  const lineScale = useTransform(eased, [0.06, 0.94], [0, 1]);
  // Lavado fucsia que crece con el recorrido.
  const fuchsiaWash = useTransform(eased, [0.15, 0.95], [0, 1]);
  if (tracks.length === 0 || !edition) return null;

  // Sin movimiento reducido: se entrega como lista vertical legible.
  if (reduce) {
    return <section className="brand-field-violet bg-hb-ink py-20 text-white">
        <div className="mx-auto max-w-shell px-6">
          <img src={media.logoHormobiotaDark} alt="HormoBiota 2.0" className="mb-6 h-24 w-auto" />
          <h2 className="text-3xl font-bold tracking-tight">{edition.trackAxis.pluralLabel}</h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track) => <li key={track.id} className="glass-panel rounded-2xl p-6">
                <TrackIcon icon={track.icon} size={30} className="text-accent" />
                <h3 className="mt-4 text-lg font-semibold">{track.name}</h3>
                <p className="mt-2 text-sm text-white/65">{track.description}</p>
              </li>)}
          </ul>
        </div>
      </section>;
  }
  return <div ref={ref}
  // Altura total = una pantalla por puente. Es lo que genera el anclaje.
  style={{
    height: `${tracks.length * 100}vh`,
    ['--accent-rgb' as string]: edition.accentRgb
  }} className="relative bg-hb-ink">
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden text-white">
        {/* Campo de marca: arranca en azul y violeta */}
        <div className="brand-field-violet absolute inset-0" aria-hidden="true" />
        {/* El recorrido termina en fucsia: la capa entra a medida que se avanza
           por los puentes, así el programa cierra en el extremo de la gama. */}
        <motion.div className="brand-field-fuchsia absolute inset-0" aria-hidden="true" style={{
        opacity: fuchsiaWash
      }} />

        {/* Encabezado fijo del recorrido */}
        <div className="relative mx-auto w-full max-w-shell shrink-0 px-6 pt-20">
          <img src={media.logoHormobiotaDark} alt="HormoBiota 2.0" className="h-20 w-auto sm:h-24" draggable={false} />
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.26em] text-hb-violet">
            {edition.name} · Programa académico
          </p>
          <h2 className="mt-4 max-w-2xl text-[clamp(1.8rem,3.6vw,3rem)] font-bold leading-[1.05] tracking-tight">
            {edition.trackAxis.pluralLabel}
            <span className="block font-normal text-white/50">de la red biológica</span>
          </h2>

          {/* Línea de progreso del recorrido */}
          <div className="mt-8 h-px w-full bg-white/12">
            <motion.div className="h-px origin-left bg-accent" style={{
            scaleX: lineScale
          }} aria-hidden="true" />
          </div>
        </div>

        {/* Carril horizontal */}
        <motion.ul className="relative flex flex-1 items-center" style={{
        x: shift,
        willChange: 'transform'
      }}>
          {tracks.map((track, index) => <li key={track.id} className="flex h-full w-screen shrink-0 items-center px-6 sm:px-10 lg:px-20">
              <div className="mx-auto flex w-full max-w-3xl items-start gap-6 sm:gap-10">
                {/* Número e icono del puente */}
                <div className="shrink-0">
                  <span className="block text-[clamp(3rem,7vw,6rem)] font-bold leading-none text-white/12 tabular-nums">
                    {String(track.order).padStart(2, '0')}
                  </span>
                  <span className="mt-4 grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-accent ring-1 ring-inset ring-accent/30 sm:h-20 sm:w-20">
                    <TrackIcon icon={track.icon} size={36} />
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                    {edition.trackAxis.label} {track.order} de {tracks.length}
                  </p>
                  <h3 className="mt-3 text-[clamp(1.5rem,3vw,2.5rem)] font-bold leading-tight tracking-tight">
                    {track.name}
                  </h3>
                  <p className="mt-2 text-base font-medium text-white/55 sm:text-lg">
                    {track.subtitle}
                  </p>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70">
                    {track.description}
                  </p>

                  {index === tracks.length - 1 ? <Link to={path} style={{
                backgroundColor: 'rgb(var(--tone-futuro))',
                boxShadow: 'var(--elev-3), 0 0 48px rgb(var(--tone-futuro) / 0.45)'
              }} className="group mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                      Ver el programa completo
                      <ArrowRightIcon size={16} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-1" />
                    </Link> : null}
                </div>
              </div>
            </li>)}
        </motion.ul>

        {/* Indicador de puentes */}
        <div className="relative mx-auto w-full max-w-shell shrink-0 px-6 pb-10">
          <ol className="flex gap-2" aria-hidden="true">
            {tracks.map((track, index) => <StepIndicator key={track.id} progress={eased} start={index / tracks.length} end={(index + 1) / tracks.length} />)}
          </ol>
        </div>
      </div>
    </div>;
}