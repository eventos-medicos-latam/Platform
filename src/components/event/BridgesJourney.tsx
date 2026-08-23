import React, { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import type { TrackAxis } from '../../types/event';
import { TrackIcon } from '../ui/TrackIcon';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';
interface BridgesJourneyProps {
  axis: TrackAxis;
}

/**
 * Recorrido de los ejes temáticos sobre superficie oscura.
 *
 * Los nodos y el detalle viven dentro de UNA sola pieza: el nodo activo se
 * eleva sobre un arco y un conector desciende hasta la tarjeta, de modo que
 * botones y contenido se leen como un mismo objeto y no como dos bloques
 * sueltos. Contraste alto en todos los textos (blanco y lavanda claro).
 */
export function BridgesJourney({
  axis
}: BridgesJourneyProps) {
  const reduce = useReducedMotion();
  const railRef = useRef<HTMLUListElement>(null);
  const [activeId, setActiveId] = useState(axis.tracks[0]?.id ?? '');
  const active = axis.tracks.find((track) => track.id === activeId) ?? axis.tracks[0];
  if (!active) return null;
  const total = axis.tracks.length;
  const activeIndex = axis.tracks.findIndex((track) => track.id === active.id);
  function go(delta: number) {
    const next = Math.min(Math.max(activeIndex + delta, 0), total - 1);
    setActiveId(axis.tracks[next].id);
  }
  return <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.06] p-6 shadow-elev4 backdrop-blur-xl sm:p-8 lg:p-10" onKeyDown={(event) => {
    if (event.key === 'ArrowRight') go(1);
    if (event.key === 'ArrowLeft') go(-1);
  }}>
      {/* Halo que sigue al puente activo */}
      <motion.span aria-hidden="true" className="pointer-events-none absolute -top-24 h-64 w-64 rounded-full blur-3xl" style={{
      backgroundColor: 'rgb(var(--tone-hormobiota) / 0.35)'
    }} animate={{
      left: `calc(${(activeIndex + 0.5) / total * 100}% - 8rem)`
    }} transition={{
      type: 'spring',
      stiffness: 160,
      damping: 26
    }} />

      {/* Arco de nodos */}
      <div className="relative [perspective:1000px]">
        {/* Riel */}
        <div className="absolute inset-x-6 top-[34px] hidden h-px bg-white/15 md:block" aria-hidden="true" />
        <motion.div className="grad-futuro absolute left-6 top-[34px] hidden h-[3px] origin-left rounded-full md:block" aria-hidden="true" style={{
        right: '1.5rem'
      }} animate={{
        scaleX: (activeIndex + 1) / total
      }} transition={{
        duration: DURATION.panel,
        ease: EASE_EMPHASIS
      }} />

        <ul ref={railRef} role="tablist" aria-label={axis.pluralLabel} className="no-scrollbar relative flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-6 md:gap-4 md:overflow-visible">
          {axis.tracks.map((track, index) => {
          const isActive = track.id === active.id;
          const isPast = index < activeIndex;
          // Curvatura: los extremos caen un poco, el centro sube.
          const arc = reduce ? 0 : Math.abs(index - (total - 1) / 2) * 5;
          return <li key={track.id} className="min-w-[150px] snap-start md:min-w-0">
                <motion.button type="button" role="tab" aria-selected={isActive} onClick={() => setActiveId(track.id)} className="group flex w-full flex-col items-center text-center focus:outline-none" animate={{
              y: isActive ? -10 : arc,
              scale: isActive ? 1.06 : 1
            }} transition={{
              type: 'spring',
              stiffness: 260,
              damping: 24
            }} style={{
              transformStyle: 'preserve-3d'
            }}>
                  <span className={`relative grid h-16 w-16 place-items-center rounded-2xl transition-colors duration-200 ease-emphasis ${isActive ? 'grad-futuro text-white' : isPast ? 'border border-white/25 bg-white/12 text-hb-violet' : 'border border-white/15 bg-white/[0.06] text-white/70 group-hover:border-white/40 group-hover:text-white'}`} style={isActive ? {
                boxShadow: '0 18px 40px -14px rgb(var(--tone-futuro) / 0.75)'
              } : undefined}>
                    <TrackIcon icon={track.icon} size={28} />
                    <span className={`absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold tabular-nums ${isActive ? 'bg-white text-hb-ink' : 'bg-white/15 text-white/80'}`}>
                      {track.order}
                    </span>
                  </span>

                  <span className={`mt-3 text-sm font-semibold leading-snug ${isActive ? 'text-white' : 'text-white/75 group-hover:text-white'}`}>
                    {track.name}
                  </span>
                </motion.button>
              </li>;
        })}
        </ul>

        {/* Conector: baja del nodo activo hasta la tarjeta */}
        <motion.span aria-hidden="true" className="pointer-events-none absolute -bottom-8 hidden h-8 w-px md:block" style={{
        backgroundColor: 'rgb(var(--tone-futuro) / 0.7)'
      }} animate={{
        left: `${(activeIndex + 0.5) / total * 100}%`
      }} transition={{
        type: 'spring',
        stiffness: 200,
        damping: 26
      }} />
      </div>

      {/* Detalle del puente activo, dentro de la misma pieza */}
      <div className="relative mt-8">
        {/* Punta que apunta al nodo activo */}
        <motion.span aria-hidden="true" className="absolute -top-2 hidden h-4 w-4 rotate-45 rounded-sm border-l border-t border-white/20 bg-white/[0.09] md:block" animate={{
        left: `calc(${(activeIndex + 0.5) / total * 100}% - 0.5rem)`
      }} transition={{
        type: 'spring',
        stiffness: 200,
        damping: 26
      }} />

        <div className="rounded-3xl border border-white/15 bg-white/[0.09] p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={active.id} initial={{
            opacity: 0,
            y: 14,
            rotateX: -6
          }} animate={{
            opacity: 1,
            y: 0,
            rotateX: 0
          }} exit={{
            opacity: 0,
            y: -8
          }} transition={{
            duration: DURATION.panel,
            ease: EASE_EMPHASIS
          }}>
              <div className="flex flex-wrap items-start gap-5">
                <span className="grad-futuro grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-white shadow-elev3">
                  <TrackIcon icon={active.icon} size={32} />
                </span>
                <div className="min-w-[240px] flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-hb-violet">
                    {axis.label} {active.order} · {active.subtitle}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight text-white lg:text-3xl">
                    {active.name}
                  </h3>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/85">
                    {active.description}
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-white/15 pt-5">
                <span className="text-sm font-semibold text-white">Conecta con:</span>
                {axis.tracks.filter((track) => track.id !== active.id).map((track) => <button key={track.id} type="button" onClick={() => setActiveId(track.id)} className="rounded-full border border-white/25 px-3.5 py-1.5 text-xs font-semibold text-white/85 transition-colors duration-150 ease-emphasis hover:border-hb-violet hover:bg-white/10 hover:text-white">
                      {track.name}
                    </button>)}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navegación */}
        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-white/70">
            <span className="font-bold text-white">{activeIndex + 1}</span> de {total}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => go(-1)} disabled={activeIndex === 0} aria-label="Puente anterior" className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-white transition-colors duration-150 ease-emphasis hover:border-white disabled:opacity-30">
              <ArrowLeftIcon size={17} />
            </button>
            <button type="button" onClick={() => go(1)} disabled={activeIndex === total - 1} aria-label="Puente siguiente" className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-white transition-colors duration-150 ease-emphasis hover:border-white disabled:opacity-30">
              <ArrowRightIcon size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>;
}