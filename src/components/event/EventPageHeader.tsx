import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import type { TitlePart } from '../ui/DisplayTitle';
import { DisplayTitle } from '../ui/DisplayTitle';
import { EASE_EMPHASIS } from '../../utils/motion';
interface EventPageHeaderProps {
  eyebrow: string;
  parts: TitlePart[];
  lead: string;
  image: string;
  /** Datos cortos que aparecen como pastillas de vidrio bajo el texto. */
  facts?: {
    label: string;
    value: string;
  }[];
  children?: React.ReactNode;
}

/**
 * Encabezado cinematográfico compartido por las páginas internas del evento.
 * Fotografía con parallax sobre el campo de color continuo, para que ninguna
 * subpágina arranque como un título suelto sobre blanco.
 */
export function EventPageHeader({
  eyebrow,
  parts,
  lead,
  image,
  facts,
  children
}: EventPageHeaderProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const {
    scrollYProgress
  } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.14]);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-10%']);
  return <section ref={ref} className="surface-deep relative isolate overflow-hidden text-white">
      <motion.div className="absolute inset-0 -z-10" style={reduce ? undefined : {
      y: imageY,
      scale: imageScale
    }}>
        <img src={image} alt="" aria-hidden="true" className="h-full w-full object-cover opacity-40" />
      </motion.div>
      <div className="absolute inset-0 -z-10" aria-hidden="true" style={{
      background: 'linear-gradient(180deg, rgba(26,26,61,0.9) 0%, rgba(26,26,61,0.76) 50%, rgba(26,26,61,0.98) 100%)'
    }} />

      <motion.div className="mx-auto max-w-shell px-6 py-16 lg:py-20" style={reduce ? undefined : {
      y: contentY
    }}>
        <motion.p initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.26,
        ease: EASE_EMPHASIS
      }} className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-hb-violet">
          <span className="h-px w-9 bg-hb-violet" aria-hidden="true" />
          {eyebrow}
        </motion.p>

        <DisplayTitle as="h1" size="lg" surface="dark" className="mt-5 max-w-3xl" parts={parts} />

        <motion.p initial={{
        opacity: 0,
        y: 14
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.28,
        ease: EASE_EMPHASIS,
        delay: 0.12
      }} className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 lg:text-lg">
          {lead}
        </motion.p>

        {facts && facts.length > 0 ? <motion.dl initial={{
        opacity: 0,
        y: 14
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.28,
        ease: EASE_EMPHASIS,
        delay: 0.18
      }} className="mt-9 flex flex-wrap gap-3">
            {facts.map((fact) => <motion.div key={fact.label} whileHover={reduce ? undefined : {
          y: -4
        }} transition={{
          duration: 0.2,
          ease: EASE_EMPHASIS
        }} className="glass-panel rounded-2xl px-5 py-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-lg font-bold tabular-nums">{fact.value}</dd>
              </motion.div>)}
          </motion.dl> : null}

        {children ? <div className="mt-9">{children}</div> : null}
      </motion.div>
    </section>;
}