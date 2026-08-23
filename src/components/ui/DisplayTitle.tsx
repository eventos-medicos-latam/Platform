import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE_EMPHASIS } from '../../utils/motion';
export interface TitlePart {
  text: string;
  /** bold: peso fuerte en color principal. light: peso normal, más aire. accent: color de acento. */
  tone?: 'bold' | 'light' | 'accent';
  /** Fuerza salto de línea después de esta parte. */
  br?: boolean;
}
interface DisplayTitleProps {
  parts: TitlePart[];
  as?: 'h1' | 'h2' | 'h3';
  /** xl para héroes, lg para secciones, md para bloques internos. */
  size?: 'xl' | 'lg' | 'md';
  surface?: 'dark' | 'light';
  /** Animación por palabra al entrar en pantalla. */
  animate?: boolean;
  className?: string;
}
const sizes = {
  xl: 'text-[clamp(2.5rem,6.4vw,5.2rem)] leading-[0.98]',
  lg: 'text-[clamp(1.9rem,3.8vw,3rem)] leading-[1.06]',
  md: 'text-[clamp(1.5rem,2.5vw,2.1rem)] leading-[1.14]'
} as const;

/**
 * Titular editorial: mezcla peso ligero y bold, y color de marca con acento
 * dentro de una misma frase. Es el recurso tipográfico que da carácter.
 *
 * El espaciado entre palabras se resuelve con `gap` en lugar de padding, para
 * que no quede aire sobrante al final de la última palabra de cada tramo.
 */
export function DisplayTitle({
  parts,
  as: Tag = 'h2',
  size = 'lg',
  surface = 'light',
  animate = true,
  className = ''
}: DisplayTitleProps) {
  const reduce = useReducedMotion();
  let wordIndex = -1;
  const toneClass = (tone: TitlePart['tone']) => {
    if (tone === 'accent') return 'font-bold text-accent';
    if (tone === 'light') {
      return surface === 'dark' ? 'font-normal text-white/70' : 'font-normal text-ink-muted';
    }
    return surface === 'dark' ? 'font-bold text-white' : 'font-bold text-brand';
  };
  return <Tag className={`flex flex-wrap items-baseline gap-x-[0.26em] tracking-tight ${sizes[size]} ${className}`}>
      {parts.map((part, partIndex) => <React.Fragment key={`${part.text}-${partIndex}`}>
          <span className={`flex flex-wrap items-baseline gap-x-[0.26em] ${toneClass(part.tone)}`}>
            {part.text.split(' ').map((word) => {
          wordIndex += 1;
          const delay = 0.04 + wordIndex * 0.038;
          return <span key={`${word}-${wordIndex}`}
          // El padding inferior compensado evita que se recorten descendentes.
          className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em]">
                  {animate && !reduce ? <motion.span className="inline-block" initial={{
              y: '108%',
              opacity: 0
            }} whileInView={{
              y: 0,
              opacity: 1
            }} viewport={{
              once: true,
              margin: '-60px'
            }} transition={{
              duration: 0.28,
              ease: EASE_EMPHASIS,
              delay
            }}>
                      {word}
                    </motion.span> : <span className="inline-block">{word}</span>}
                </span>;
        })}
          </span>
          {part.br ? <span className="w-full" aria-hidden="true" /> : null}
        </React.Fragment>)}
    </Tag>;
}