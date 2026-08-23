import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRightIcon, CalendarIcon, MapPinIcon } from 'lucide-react';
import type { Edition } from '../../types/event';
import { getFamily } from '../../data/editions';
import { editionMedia } from '../../data/media';
import { editionStatusMeta, StatusBadge } from '../ui/StatusBadge';
import { EASE_EMPHASIS } from '../../utils/motion';
interface EventCardProps {
  edition: Edition;
  emphasis?: boolean;
}

/**
 * Tarjeta de edición sobre un plano con perspectiva: se inclina siguiendo el
 * puntero, la fotografía se aleja al fondo y el texto flota por encima. La
 * profundidad la produce el gesto, no un borde.
 */
export function EventCard({
  edition,
  emphasis = false
}: EventCardProps) {
  const family = getFamily(edition.familyId);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, {
    stiffness: 210,
    damping: 26
  });
  const sy = useSpring(py, {
    stiffness: 210,
    damping: 26
  });
  const rotateY = useTransform(sx, [-0.5, 0.5], [10, -10]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-10, 10]);
  const shineX = useTransform(sx, [-0.5, 0.5], [10, 90]);
  const shineY = useTransform(sy, [-0.5, 0.5], [8, 92]);
  const shine = useTransform([shineX, shineY], ([x, y]: number[]) => `radial-gradient(circle at ${x}% ${y}%, rgb(var(--accent-rgb) / 0.28), transparent 58%)`);
  if (!family) return null;
  const status = editionStatusMeta[edition.status];
  const to = `/eventos/${family.slug}/${edition.slug}`;
  function move(event: React.PointerEvent<HTMLDivElement>) {
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
  return <div ref={ref} onPointerMove={move} onPointerEnter={() => setHovered(true)} onPointerLeave={reset} className="h-full [perspective:1200px]">
      <motion.article style={{
      rotateX: reduce ? 0 : rotateX,
      rotateY: reduce ? 0 : rotateY,
      transformStyle: 'preserve-3d',
      ['--accent-rgb' as string]: edition.accentRgb,
      boxShadow: hovered ? '0 30px 70px -26px rgb(var(--accent-rgb) / 0.6), var(--elev-4)' : 'var(--elev-2)'
    }} animate={{
      y: hovered && !reduce ? -8 : 0
    }} transition={{
      duration: 0.24,
      ease: EASE_EMPHASIS
    }} className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-hb-ink text-white">
        {/* Fotografía hundida al fondo del plano */}
        <div className="absolute inset-0" style={{
        transform: 'translateZ(-40px) scale(1.08)'
      }}>
          <motion.img src={editionMedia[edition.id]} alt="" className="h-full w-full object-cover" animate={{
          scale: hovered && !reduce ? 1.08 : 1
        }} transition={{
          duration: 0.3,
          ease: EASE_EMPHASIS
        }} />
          <div className="absolute inset-0" aria-hidden="true" style={{
          background: 'linear-gradient(180deg, rgba(26,26,61,0.4) 0%, rgba(26,26,61,0.8) 55%, rgba(26,26,61,0.97) 100%)'
        }} />
        </div>

        {/* Brillo del color de la edición, siguiendo el puntero */}
        <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{
        background: shine,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 220ms'
      }} />

        <div className="relative flex h-full min-h-[340px] flex-col p-6" style={{
        transform: 'translateZ(34px)'
      }}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              {family.name} · {edition.year}
            </p>
            <StatusBadge label={status.label} tone={emphasis ? 'accent' : status.tone === 'neutral' ? 'draft' : status.tone} />
          </div>

          <h3 className="mt-auto text-2xl font-bold leading-tight tracking-tight">{edition.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/75">{edition.claim}</p>

          <dl className="mt-5 space-y-1.5 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <CalendarIcon size={14} className="shrink-0 text-accent" />
              <dt className="sr-only">Fecha</dt>
              <dd>{edition.dateLabel}</dd>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon size={14} className="shrink-0 text-accent" />
              <dt className="sr-only">Lugar</dt>
              <dd>
                {edition.venue.name} · {edition.venue.city}
              </dd>
            </div>
          </dl>

          <Link to={to} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
            {edition.status === 'historico' ? 'Ver el archivo' : 'Ver evento'}
            <ArrowUpRightIcon size={15} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            <span className="absolute inset-0" aria-hidden="true" />
          </Link>
        </div>

        {/* Filo con la trama viva */}
        <motion.span aria-hidden="true" className="grad-futuro absolute inset-x-0 bottom-0 h-1 origin-left" animate={{
        scaleX: hovered ? 1 : 0
      }} transition={{
        duration: 0.24,
        ease: EASE_EMPHASIS
      }} />
      </motion.article>
    </div>;
}