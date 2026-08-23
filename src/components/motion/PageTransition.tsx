import React from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '../../utils/motion';
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/** Envuelve cada página: entrada y salida encadenadas de 220 ms. */
export function PageTransition({
  children,
  className
}: PageTransitionProps) {
  return <motion.div initial="initial" animate="enter" exit="exit" variants={pageVariants} className={className}>
      {children}
    </motion.div>;
}