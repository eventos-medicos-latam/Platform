import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import type { Track } from '../../types/event';
import { TrackIcon } from '../ui/TrackIcon';
import { EASE_EMPHASIS } from '../../utils/motion';
interface BridgesDeckProps {
  tracks: Track[];
  label: string;
}

/**
 * Baraja 3D de los puentes. Cada tarjeta se inclina siguiendo el puntero sobre
 * un plano con perspectiva real, y el brillo se desplaza con el mismo gesto:
 * la profundidad la produce el movimiento, no una sombra pintada.
 */
function BridgeCard({
  track,
  index



}: {track: Track;index: number;}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLLIElement>(null);
  const [hovered, setHovered] = useState(false);

  // Posición relativa del puntero, -0.5 … 0.5 en cada eje.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, {
    stiffness: 220,
    damping: 26
  });
  const sy = useSpring(py, {
    stiffness: 220,
    damping: 26
  });
  const rotateY = useTransform(sx, [-0.5, 0.5], [11, -11]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-11, 11]);
  const glowX = useTransform(sx, [-0.5, 0.5], [12, 88]);
  const glowY = useTransform(sy, [-0.5, 0.5], [10, 90]);
  const glow = useTransform([glowX, glowY], ([x, y]: number[]) => `radial-gradient(circle at ${x}% ${y}%, rgb(var(--tone-hormobiota) / 0.16), transparent 62%)`);
  function track3d(event: React.PointerEvent<HTMLLIElement>) {
    if (reduce) return;
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    px.set((event.clientX - box.left) / box.width - 0.5);
    py.set((event.clientY - box.top) / box.height - 0.5);
  }
  function reset() {
    setHovered(false);
    px.set(0);
    py.set(0);
  }
  return <motion.li ref={ref} initial={{
    opacity: 0,
    y: 28,
    rotateX: -8
  }} whileInView={{
    opacity: 1,
    y: 0,
    rotateX: 0
  }} viewport={{
    once: true,
    margin: '-70px'
  }} transition={{
    duration: 0.3,
    ease: EASE_EMPHASIS,
    delay: Math.min(index, 5) * 0.06
  }} onPointerMove={track3d} onPointerEnter={() => setHovered(true)} onPointerLeave={reset} className="[perspective:1100px]">
      <motion.article style={{
      rotateX: reduce ? 0 : rotateX,
      rotateY: reduce ? 0 : rotateY,
      transformStyle: 'preserve-3d',
      boxShadow: hovered ? '0 26px 60px -22px rgb(var(--tone-hormobiota) / 0.55), var(--elev-4)' : 'var(--elev-2)'
    }} animate={{
      y: hovered && !reduce ? -6 : 0
    }} transition={{
      duration: 0.22,
      ease: EASE_EMPHASIS
    }} className="relative h-full overflow-hidden rounded-3xl border border-white/70 bg-white p-7">
        {/* Brillo que sigue al puntero */}
        <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{
        opacity: hovered ? 1 : 0,
        background: glow,
        transition: 'opacity 200ms'
      }} />

        {/* Número al fondo del plano */}
        <span aria-hidden="true" className="pointer-events-none absolute -right-3 -top-6 text-[6.5rem] font-bold leading-none tabular-nums text-hb-ink/[0.05]" style={{
        transform: 'translateZ(-30px)'
      }}>
          {String(track.order).padStart(2, '0')}
        </span>

        <div className="relative" style={{
        transform: 'translateZ(38px)'
      }}>
          <motion.span className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-elev3" style={{
          backgroundColor: 'rgb(var(--tone-hormobiota))'
        }} animate={{
          scale: hovered && !reduce ? 1.06 : 1
        }} transition={{
          duration: 0.2,
          ease: EASE_EMPHASIS
        }}>
            <TrackIcon icon={track.icon} size={26} />
          </motion.span>
        </div>

        <div className="relative mt-6" style={{
        transform: 'translateZ(22px)'
      }}>
          <h3 className="text-xl font-bold leading-snug tracking-tight text-hb-ink">{track.name}</h3>
          <p className="mt-1 text-sm font-semibold text-hb-deep">{track.subtitle}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{track.description}</p>
        </div>

        {/* Filo inferior que se dibuja al entrar el puntero */}
        <motion.span aria-hidden="true" className="grad-futuro absolute inset-x-0 bottom-0 h-1 origin-left" animate={{
        scaleX: hovered ? 1 : 0
      }} transition={{
        duration: 0.24,
        ease: EASE_EMPHASIS
      }} />
      </motion.article>
    </motion.li>;
}
export function BridgesDeck({
  tracks,
  label
}: BridgesDeckProps) {
  return <ul aria-label={label} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {tracks.map((track, index) => <BridgeCard key={track.id} track={track} index={index} />)}
    </ul>;
}