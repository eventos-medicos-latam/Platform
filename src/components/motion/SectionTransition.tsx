import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
interface SectionTransitionProps {
  children: React.ReactNode;
  className?: string;
  /**
   * lift: la sección sube y se asienta al entrar (paso entre secciones).
   * settle: además de subir, se acerca ligeramente — para bloques protagonistas.
   * sink: la sección se aleja al salir, dando profundidad al apilado.
   */
  variant?: 'lift' | 'settle' | 'sink';
  id?: string;
}

/**
 * Paso entre secciones ligado al scroll: cada sección entra con un
 * desplazamiento corto y se aleja al salir, creando la sensación de capas
 * apiladas en lugar de un corte plano. Solo transform y opacity.
 */
export function SectionTransition({
  children,
  className = '',
  variant = 'lift',
  id
}: SectionTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const {
    scrollYProgress
  } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  const y = useTransform(scrollYProgress, [0, 0.25, 0.8, 1], variant === 'sink' ? ['56px', '0px', '0px', '-32px'] : ['64px', '0px', '0px', '-16px']);
  // Sin escala: encoger la sección descubre el fondo del documento a los lados
  // y la web se ve enmarcada, sobre todo en móvil.
  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.86, 1], [0, 1, 1, 0.55]);
  if (reduce) {
    return <section id={id} className={className}>
        {children}
      </section>;
  }
  return <motion.section id={id} ref={ref} className={className} style={{
    y,
    opacity,
    transformOrigin: 'center top',
    willChange: 'transform, opacity'
  }}>
      {children}
    </motion.section>;
}

/** Barra de progreso de lectura, fija en el borde superior. */
export function ScrollProgress() {
  const {
    scrollYProgress
  } = useScroll();
  const reduce = useReducedMotion();
  if (reduce) return null;
  return <motion.div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-accent" style={{
    scaleX: scrollYProgress
  }} />;
}