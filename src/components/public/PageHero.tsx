import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { DisplayTitle, type TitlePart } from '../ui/DisplayTitle';
import { EASE_EMPHASIS } from '../../utils/motion';
interface PageHeroProps {
  eyebrow: string;
  title: TitlePart[];
  lead: string;
  image: string;
  imageAlt?: string;
  /** Datos cortos que refuerzan la página (2-4 pares). */
  facts?: {
    label: string;
    value: string;
  }[];
  children?: React.ReactNode;
  accentRgb?: string;
}

/** Encabezado cinematográfico compartido por todas las páginas internas. */
export function PageHero({
  eyebrow,
  title,
  lead,
  image,
  imageAlt = '',
  facts,
  children,
  accentRgb
}: PageHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const {
    scrollYProgress
  } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.14]);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-16%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  return <section ref={ref} className="relative isolate flex min-h-[62vh] items-end overflow-hidden bg-brand-deep" style={accentRgb ? {
    ['--accent-rgb' as string]: accentRgb
  } as React.CSSProperties : undefined}>
      <motion.div className="absolute inset-0 -z-10" style={reduce ? undefined : {
      y: imageY,
      scale: imageScale
    }}>
        <img src={image} alt={imageAlt} className="h-full w-full object-cover" />
      </motion.div>
      <div className="absolute inset-0 -z-10" aria-hidden="true" style={{
      background: 'linear-gradient(180deg, rgba(6,17,33,0.9) 0%, rgba(6,17,33,0.6) 40%, rgba(6,17,33,0.95) 100%)'
    }} />

      <motion.div className="mx-auto w-full max-w-shell px-6 pb-16 pt-32 lg:pb-20" style={reduce ? undefined : {
      y: contentY,
      opacity: contentOpacity
    }}>
        <motion.p initial={{
        opacity: 0,
        y: 8
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.26,
        ease: EASE_EMPHASIS
      }} className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/65">
          <span className="h-px w-9 bg-accent" aria-hidden="true" />
          {eyebrow}
        </motion.p>

        <DisplayTitle as="h1" parts={title} size="xl" surface="dark" className="mt-6 max-w-4xl" />

        <motion.p initial={{
        opacity: 0,
        y: 12
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.28,
        ease: EASE_EMPHASIS,
        delay: 0.26
      }} className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">
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
        delay: 0.32
      }} className="mt-10 flex flex-wrap gap-x-12 gap-y-5 border-t border-white/15 pt-6">
            {facts.map((fact) => <div key={fact.label}>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-lg font-semibold text-white">{fact.value}</dd>
              </div>)}
          </motion.dl> : null}

        {children ? <motion.div initial={{
        opacity: 0,
        y: 14
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.28,
        ease: EASE_EMPHASIS,
        delay: 0.36
      }} className="mt-9">
            {children}
          </motion.div> : null}
      </motion.div>
    </section>;
}