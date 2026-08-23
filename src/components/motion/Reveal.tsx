import React from 'react';
import { motion } from 'framer-motion';
import { revealChild, revealParent } from '../../utils/motion';
interface RevealProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'ul' | 'li' | 'header';
}

/**
 * Aparición por scroll, una sola vez. Solo se usa en secciones con carga
 * narrativa: nunca en tablas, formularios o listas densas.
 */
export function Reveal({
  children,
  className
}: RevealProps) {
  return <motion.div className={className} variants={revealParent} initial="hidden" whileInView="visible" viewport={{
    once: true,
    margin: '-64px'
  }}>
      {children}
    </motion.div>;
}
export function RevealItem({
  children,
  className
}: RevealProps) {
  return <motion.div className={className} variants={revealChild}>
      {children}
    </motion.div>;
}