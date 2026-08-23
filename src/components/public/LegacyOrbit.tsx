import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, GripVerticalIcon } from 'lucide-react';
import { legacyEvents } from '../../data/legacy';
import { EASE_EMPHASIS } from '../../utils/motion';
import { FutureEditionPoster } from './FutureEditionPoster';

/** Desplazamiento lateral por tarjeta, en píxeles. */
const STEP = 300;
/** Arrastre mínimo para pasar de tarjeta. */
const DRAG_THRESHOLD = 70;

/**
 * Trayectoria de ediciones en eje horizontal 3D. Las tarjetas son anchas y
 * fotográficas: la del centro está de frente y revela su panel de información,
 * las laterales se inclinan y retroceden. Se recorre arrastrando con el dedo o
 * el mouse, con las flechas del teclado, o con los controles.
 */
export function LegacyOrbit() {
  const reduce = useReducedMotion();
  const total = legacyEvents.length;
  // Arranca en la edición más reciente: es la que importa comercialmente.
  const [active, setActive] = useState(total - 1);
  const [revealed, setRevealed] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const dragOrigin = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const go = useCallback((delta: number) => {
    setActive((current) => Math.min(Math.max(current + delta, 0), total - 1));
    setRevealed(false);
  }, [total]);

  /** Traduce la posición del tirador a la edición más cercana. */
  const scrubTo = useCallback((clientX: number) => {
    const rail = trackRef.current;
    if (!rail) return;
    const box = rail.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - box.left) / box.width, 0), 1);
    const index = Math.round(ratio * (total - 1));
    setActive(index);
    setRevealed(false);
  }, [total]);

  // Arrastre con el dedo o el mouse sobre todo el carril.
  useEffect(() => {
    function onUp(clientX: number) {
      if (dragOrigin.current === null) return;
      const delta = clientX - dragOrigin.current;
      dragOrigin.current = null;
      if (Math.abs(delta) > DRAG_THRESHOLD) go(delta < 0 ? 1 : -1);
    }
    const mouseUp = (event: MouseEvent) => onUp(event.clientX);
    const touchEnd = (event: TouchEvent) => onUp(event.changedTouches[0]?.clientX ?? 0);
    window.addEventListener('mouseup', mouseUp);
    window.addEventListener('touchend', touchEnd);
    return () => {
      window.removeEventListener('mouseup', mouseUp);
      window.removeEventListener('touchend', touchEnd);
    };
  }, [go]);
  const current = legacyEvents[active];
  return <section className="surface-deep relative isolate overflow-hidden py-20 text-white lg:py-24">
      <div className="grid-texture absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-shell px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-hb-violet">
              Trayectoria
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(1.9rem,4vw,3.2rem)] font-bold leading-[1.05] tracking-tight">
              Cinco ediciones,
              <span className="block font-normal text-white/50">una sola tesis en construcción</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/60">
            Cada evento resolvió una pieza del rompecabezas. Hormobiota es donde todas se conectan.
            Arrastra para recorrer la historia.
          </p>
        </div>

        {/* Línea de tiempo con tirador arrastrable */}
        <div className="mt-12">
          <div ref={trackRef} role="slider" tabIndex={0} aria-label="Línea de tiempo de ediciones" aria-valuemin={1} aria-valuemax={total} aria-valuenow={active + 1} aria-valuetext={`${current.name}, ${current.year}`} onPointerDown={(event) => {
          setScrubbing(true);
          (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
          scrubTo(event.clientX);
        }} onPointerMove={(event) => {
          if (scrubbing) scrubTo(event.clientX);
        }} onPointerUp={() => setScrubbing(false)} onPointerCancel={() => setScrubbing(false)} onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            go(1);
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            go(-1);
          }
        }} className="relative h-8 cursor-grab touch-none select-none active:cursor-grabbing">
            {/* Riel */}
            <span className="pointer-events-none absolute left-0 right-0 top-3.5 h-1 rounded-full bg-white/15" aria-hidden="true" />
            {/* Recorrido cubierto */}
            <motion.span className="pointer-events-none absolute left-0 top-3.5 h-1 rounded-full bg-hb-violet" aria-hidden="true" animate={{
            width: `${active / (total - 1) * 100}%`
          }} transition={{
            type: 'spring',
            stiffness: 210,
            damping: 28
          }} />
            {/* Paradas */}
            {legacyEvents.map((event, index) => <span key={event.id} aria-hidden="true" className={`pointer-events-none absolute top-[11px] h-2.5 w-2.5 -translate-x-1/2 rounded-full transition-colors duration-200 ${index <= active ? 'bg-hb-violet' : 'bg-white/25'}`} style={{
            left: `${index / (total - 1) * 100}%`
          }} />)}
            {/* Tirador */}
            <motion.span aria-hidden="true" className="pointer-events-none absolute top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-elev3 ring-4 ring-hb-violet/35" animate={{
            left: `${active / (total - 1) * 100}%`,
            scale: scrubbing ? 1.12 : 1
          }} transition={{
            type: 'spring',
            stiffness: 260,
            damping: 26
          }}>
              <GripVerticalIcon size={15} className="text-hb-ink" />
            </motion.span>
          </div>

          {/* Años */}
          <ol className="mt-3 flex justify-between" aria-hidden="true">
            {legacyEvents.map((event, index) => <li key={event.id} className={`text-[11px] font-semibold tabular-nums transition-colors duration-200 ${index === active ? 'text-hb-violet' : 'text-white/40'}`}>
                {event.year}
              </li>)}
          </ol>
        </div>

        {/* Carril 3D */}
        <div className="scene-3d mt-10">
          <div className="relative h-[300px] select-none preserve-3d sm:h-[380px] lg:h-[440px]" role="listbox" aria-label="Trayectoria de ediciones" tabIndex={0} onMouseDown={(event) => {
          dragOrigin.current = event.clientX;
        }} onTouchStart={(event) => {
          dragOrigin.current = event.touches[0]?.clientX ?? null;
        }} onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            go(1);
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            go(-1);
          }
        }} style={{
          cursor: 'grab'
        }}>
            {legacyEvents.map((event, index) => {
            const offset = index - active;
            const distance = Math.abs(offset);
            const isActive = offset === 0;
            if (distance > 2) return null;
            return <motion.div key={event.id} role="option" aria-selected={isActive} onMouseEnter={() => isActive ? setRevealed(true) : undefined} onMouseLeave={() => setRevealed(false)} onClick={() => {
              if (!isActive) {
                setActive(index);
                setRevealed(false);
              }
            }} className="absolute left-1/2 top-0 h-full w-[86vw] max-w-[860px] overflow-hidden rounded-3xl" animate={reduce ? {
              x: '-50%',
              opacity: isActive ? 1 : 0
            } : {
              x: `calc(-50% + ${offset * STEP}px)`,
              rotateY: offset * -30,
              z: -distance * 260,
              scale: isActive ? 1 : 0.9
            }} transition={{
              type: 'spring',
              stiffness: 190,
              damping: 27,
              mass: 0.8
            }} style={{
              zIndex: 10 - distance,
              transformStyle: 'preserve-3d',
              // La próxima edición irradia fucsia; se intensifica al
              // quedar al frente y al pasar el cursor.
              boxShadow: event.status === 'proximo' ? isActive ? `var(--elev-4), 0 0 ${revealed ? '90px' : '60px'} rgb(var(--tone-futuro) / ${revealed ? 0.55 : 0.4})` : 'var(--elev-2), 0 0 34px rgb(var(--tone-futuro) / 0.28)' : isActive ? 'var(--elev-4)' : 'var(--elev-2)',
              transition: 'box-shadow 260ms cubic-bezier(0.23, 1, 0.32, 1)',
              ['--accent-rgb' as string]: event.toneVar
            }}>
                  {/* La próxima edición no es archivo: es un afiche con su
                   propio lenguaje. Se resuelve en un componente aparte. */}
                  {event.status === 'proximo' ? <FutureEditionPoster event={event} isActive={isActive} /> : <>
                  <img src={event.image} alt={`${event.name} — edición ${event.order}`} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                  {/* Scrim base: garantiza contraste del texto sobre la foto */}
                  <div className="absolute inset-0" aria-hidden="true" style={{
                  background: 'linear-gradient(75deg, rgba(6,17,33,0.96) 0%, rgba(6,17,33,0.8) 46%, rgba(6,17,33,0.36) 100%)'
                }} />
                  {/* Barra de tono: da color propio a cada edición realizada. */}
                  <div className="absolute inset-y-0 left-0 w-1.5 bg-accent" aria-hidden="true" />

                  <div className="relative flex h-full flex-col justify-end p-6 sm:p-9 lg:p-10">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                        Edición {event.order}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                        {event.year} · Realizado
                      </span>
                    </div>

                    <h3 className="mt-4 text-[clamp(1.6rem,3.6vw,3rem)] font-bold leading-[1.04] tracking-tight">
                      {event.name}
                      <span className="mt-1 block text-[clamp(0.95rem,1.5vw,1.35rem)] font-normal text-white/60">
                        {event.claim}
                      </span>
                    </h3>

                    {/* Panel que se revela al pasar el cursor sobre la tarjeta activa */}
                    <AnimatePresence initial={false}>
                      {isActive && (revealed || reduce) ? <motion.div initial={{
                      opacity: 0,
                      height: 0
                    }} animate={{
                      opacity: 1,
                      height: 'auto'
                    }} exit={{
                      opacity: 0,
                      height: 0
                    }} transition={{
                      duration: 0.26,
                      ease: EASE_EMPHASIS
                    }} className="overflow-hidden">
                          <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
                            {event.description}
                          </p>
                          <ul className="mt-4 flex flex-wrap gap-2">
                            {event.highlights.map((item) => <li key={item} className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/75">
                                {item}
                              </li>)}
                          </ul>
                        </motion.div> : null}
                    </AnimatePresence>

                    <div className="mt-7 flex flex-wrap items-center gap-4">
                      <Link to={event.href} className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-deep shadow-elev3 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5" onClick={(clickEvent) => clickEvent.stopPropagation()}>
                        Conocer más
                        <ArrowRightIcon size={16} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-1" />
                      </Link>
                      {event.attendees ? <p className="text-sm text-white/55">
                          <span className="font-semibold text-white">{event.attendees}</span>{' '}
                          asistentes
                        </p> : null}
                    </div>
                  </div>
                  </>}
                </motion.div>;
          })}
          </div>
        </div>

        {/* Controles */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <p className="hidden text-sm text-white/50 sm:block">
            {current.topic} · edición {current.order} de {total}
          </p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => go(-1)} disabled={active === 0} aria-label="Edición anterior" className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition-colors duration-150 ease-emphasis hover:border-white hover:bg-white/10 disabled:opacity-30">
              <ChevronLeftIcon size={19} />
            </button>
            <button type="button" onClick={() => go(1)} disabled={active === total - 1} aria-label="Edición siguiente" className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition-colors duration-150 ease-emphasis hover:border-white hover:bg-white/10 disabled:opacity-30">
              <ChevronRightIcon size={19} />
            </button>
          </div>
        </div>
      </div>
    </section>;
}