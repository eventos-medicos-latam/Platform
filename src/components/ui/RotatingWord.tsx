import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EASE_EMPHASIS } from '../../utils/motion';
interface RotatingWordProps {
  words: string[];
  /** Milisegundos que cada palabra permanece visible. */
  interval?: number;
  className?: string;
}

/**
 * Palabra que rota dentro de un titular: sale hacia arriba y entra la
 * siguiente. El ancho se reserva con la palabra más larga para que el resto
 * del titular no se desplace en cada cambio.
 */
export function RotatingWord({
  words,
  interval = 2400,
  className = ''
}: RotatingWordProps) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce || words.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [interval, reduce, words.length]);
  const longest = words.reduce((a, b) => b.length > a.length ? b : a, '');
  if (reduce) {
    return <span className={className}>{words[0]}</span>;
  }
  return <span className={`relative inline-grid overflow-hidden align-bottom ${className}`}>
      {/* Reserva de espacio: invisible, define el ancho de la caja. */}
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {longest}
      </span>
      <span className="col-start-1 row-start-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={words[index]} className="word-rotate inline-block whitespace-nowrap" initial={{
          y: '105%',
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} exit={{
          y: '-105%',
          opacity: 0
        }} transition={{
          duration: 0.28,
          ease: EASE_EMPHASIS
        }}>
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </span>
      {/* Lectura estable para tecnologías asistivas. */}
      <span className="sr-only">{words.join(', ')}</span>
    </span>;
}