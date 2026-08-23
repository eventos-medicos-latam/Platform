import type { Transition, Variants } from 'framer-motion';

/**
 * Sistema de movimiento. Reglas fijas:
 * - Curva de énfasis para entradas, ease-in-out para desplazamientos.
 * - Tope de 300 ms por elemento.
 * - Solo transform y opacity.
 * - Nada entra desde escala 0.
 */
export const EASE_EMPHASIS = [0.23, 1, 0.32, 1] as const;

export const DURATION = {
  press: 0.12,
  tooltip: 0.16,
  dropdown: 0.2,
  page: 0.22,
  panel: 0.28
} as const;

export const STAGGER = 0.04;

export const pageTransition: Transition = {
  duration: DURATION.page,
  ease: EASE_EMPHASIS
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0, transition: pageTransition },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: 'easeOut' } }
};

/** Cascada de entrada para el hero y para bloques narrativos. */
export const cascadeParent = (delayChildren = 0): Variants => ({
  initial: {},
  enter: {
    transition: { staggerChildren: STAGGER, delayChildren }
  }
});

export const cascadeChild: Variants = {
  initial: { opacity: 0, y: 12 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.panel, ease: EASE_EMPHASIS }
  }
};

export const revealChild: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.panel, ease: EASE_EMPHASIS }
  }
};

/** Cascada tope 6 elementos: el último nunca debe sentirse tarde. */
export const revealParent: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: STAGGER, delayChildren: 0.02 }
  }
};

export const panelVariants: Variants = {
  initial: { opacity: 0, x: 24 },
  enter: { opacity: 1, x: 0, transition: { duration: DURATION.panel, ease: EASE_EMPHASIS } },
  exit: { opacity: 0, x: 24, transition: { duration: 0.18, ease: 'easeOut' } }
};

export const popVariants: Variants = {
  initial: { opacity: 0, y: 6, scale: 0.97 },
  enter: { opacity: 1, y: 0, scale: 1, transition: { duration: DURATION.dropdown, ease: EASE_EMPHASIS } },
  exit: { opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.14, ease: 'easeOut' } }
};

export const pressProps = {
  whileTap: { scale: 0.985 },
  transition: { duration: DURATION.press, ease: EASE_EMPHASIS }
};