import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { media } from '../../data/media';
import { EASE_EMPHASIS } from '../../utils/motion';
const SEEN_KEY = 'emlatam-intro-seen';

/**
 * Bienvenida de marca: al entrar al sitio, el logo se presenta grande y solo
 * sobre fondo institucional, y luego el velo se abre para revelar el hero.
 * Se muestra una sola vez por sesión y nunca bloquea el contenido: el hero ya
 * está montado detrás.
 */
export function BrandIntro() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (reduce) return;
    if (sessionStorage.getItem(SEEN_KEY)) return;
    setVisible(true);
    sessionStorage.setItem(SEEN_KEY, '1');
    const timer = window.setTimeout(() => setVisible(false), 1250);
    return () => window.clearTimeout(timer);
  }, [reduce]);
  return <AnimatePresence>
      {visible ? <motion.div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-brand-deep" initial={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} transition={{
      duration: 0.28,
      ease: EASE_EMPHASIS
    }} aria-hidden="true">
          <div className="grid-texture absolute inset-0" />

          {/* Barrido de acento que cruza detrás del logo */}
          <motion.span className="absolute h-px w-full bg-accent/60" initial={{
        scaleX: 0
      }} animate={{
        scaleX: 1
      }} transition={{
        duration: 0.42,
        ease: EASE_EMPHASIS,
        delay: 0.1
      }} style={{
        transformOrigin: 'left'
      }} />

          <motion.div className="relative px-8" initial={{
        opacity: 0,
        y: 16,
        scale: 0.96
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        y: -24,
        scale: 0.9
      }} transition={{
        duration: 0.3,
        ease: EASE_EMPHASIS
      }}>
            <img src={media.logoWhite} alt="" className="h-14 w-auto sm:h-20 lg:h-24" draggable={false} />
          </motion.div>
        </motion.div> : null}
    </AnimatePresence>;
}