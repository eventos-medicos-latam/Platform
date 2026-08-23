import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { EASE_EMPHASIS } from '../../utils/motion';
export interface OrbitItem {
  id: string;
  /** Contenido de la tarjeta. El armazón (fondo, borde, radio) lo pone la órbita. */
  content: React.ReactNode;
  /** Etiqueta accesible del punto de navegación. */
  label: string;
}
interface OrbitCarouselProps {
  items: OrbitItem[];
  /** dark: sección oscura (controles claros). light: sección clara. */
  surface?: 'dark' | 'light';
  /** Altura del carril. Ajústala al contenido más alto. */
  height?: string;
  /** Milisegundos entre avances automáticos. 0 lo desactiva. */
  autoplayMs?: number;
  className?: string;
}

/**
 * Carrusel en eje circular reutilizable. Todas las tarjetas comparten el mismo
 * armazón visual que el resto del sitio: lo único que cambia es su posición en
 * el eje. Avanza solo, se detiene cuando el usuario interactúa, y usa un resorte
 * para que el giro se sienta suave en vez de un salto.
 */
export function OrbitCarousel({
  items,
  surface = 'dark',
  height = 'h-[400px] sm:h-[380px]',
  autoplayMs = 4200,
  className = ''
}: OrbitCarouselProps) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = items.length;
  const railRef = useRef<HTMLDivElement>(null);
  const go = useCallback((delta: number) => setActive((current) => (current + delta + total) % total), [total]);

  // Avance automático. Se detiene al interactuar y cuando la pestaña no está visible.
  useEffect(() => {
    if (reduce || paused || autoplayMs === 0 || total < 2) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setActive((current) => (current + 1) % total);
    }, autoplayMs);
    return () => window.clearInterval(timer);
  }, [autoplayMs, paused, reduce, total]);

  /** Distancia con signo al centro, en el rango [-mitad, +mitad]. */
  const offsetOf = (index: number): number => {
    const raw = index - active;
    if (raw > total / 2) return raw - total;
    if (raw < -total / 2) return raw + total;
    return raw;
  };
  if (total === 0) return null;
  const dotBase = surface === 'dark' ? 'bg-white/25 hover:bg-white/50' : 'bg-line hover:bg-brand/40';
  const arrowBase = surface === 'dark' ? 'border-white/20 text-white hover:border-white hover:bg-white/10' : 'border-line text-brand hover:border-brand/40 hover:bg-brand-soft';

  // Sin movimiento: retícula legible, sin órbita ni avance automático.
  if (reduce) {
    return <ul className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {items.map((item) => <li key={item.id} className="flex flex-col rounded-3xl border border-line bg-white p-7 text-left shadow-elev2">
            {item.content}
          </li>)}
      </ul>;
  }
  return <div className={className}>
      <div className="scene-3d">
        <div ref={railRef} className={`relative select-none overflow-x-clip preserve-3d ${height}`} role="listbox" aria-label="Carrusel" tabIndex={0} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          go(1);
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          go(-1);
        }
      }}>
          {items.map((item, index) => {
          const offset = offsetOf(index);
          const distance = Math.abs(offset);
          const isActive = offset === 0;
          // Fuera del alcance visible: se retira para no cargar la escena.
          if (distance > 2) return null;
          return <motion.button key={item.id} type="button" role="option" aria-selected={isActive} tabIndex={isActive ? 0 : -1} onClick={() => isActive ? undefined : setActive(index)} className="absolute left-1/2 top-0 flex h-full w-[290px] cursor-pointer flex-col rounded-3xl border border-line bg-white p-7 text-left sm:w-[350px]" animate={{
            x: `calc(-50% + ${offset * 215}px)`,
            rotateY: offset * -22,
            z: -distance * 170,
            scale: isActive ? 1 : 0.94
          }}
          // Resorte suave: el giro se asienta en vez de frenar en seco.
          transition={{
            type: 'spring',
            stiffness: 210,
            damping: 26,
            mass: 0.7
          }} style={{
            zIndex: 10 - distance,
            transformStyle: 'preserve-3d',
            boxShadow: isActive ? 'var(--elev-4)' : 'var(--elev-2)'
          }}>
                {item.content}

                {/* Scrim de profundidad: atenúa las laterales sin cambiarles el
                 tratamiento visual. */}
                <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-3xl bg-brand-deep" animate={{
              opacity: isActive ? 0 : distance > 1 ? 0.62 : 0.34
            }} transition={{
              duration: 0.3,
              ease: EASE_EMPHASIS
            }} />
              </motion.button>;
        })}
        </div>
      </div>

      {/* Controles */}
      <div className="mt-10 flex items-center justify-center gap-4">
        <button type="button" onClick={() => go(-1)} aria-label="Anterior" className={`grid h-11 w-11 place-items-center rounded-full border transition-colors duration-150 ease-emphasis ${arrowBase}`}>
          <ChevronLeftIcon size={19} />
        </button>

        <ol className="flex items-center gap-1.5">
          {items.map((item, index) => <li key={item.id}>
              <button type="button" onClick={() => setActive(index)} aria-label={`Ver ${item.label}`} aria-current={index === active} className={`h-1.5 rounded-full transition-all duration-200 ease-emphasis ${index === active ? 'w-7 bg-accent' : `w-1.5 ${dotBase}`}`} />
            </li>)}
        </ol>

        <button type="button" onClick={() => go(1)} aria-label="Siguiente" className={`grid h-11 w-11 place-items-center rounded-full border transition-colors duration-150 ease-emphasis ${arrowBase}`}>
          <ChevronRightIcon size={19} />
        </button>
      </div>
    </div>;
}