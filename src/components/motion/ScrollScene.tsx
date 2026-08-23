import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
interface ScrollSceneProps {
  children: React.ReactNode;
  className?: string;
  /** Intensidad del recorrido vertical del contenido dentro de la sección. */
  depth?: 'soft' | 'medium' | 'strong';
  id?: string;
}

/**
 * Escena ligada al scroll: el contenido se transforma de forma CONTINUA
 * mientras la sección atraviesa la pantalla, en lugar de animarse una sola vez
 * al aparecer. Es lo que evita que el sitio se sienta como páginas quietas.
 */
export function ScrollScene({
  children,
  className = '',
  depth = 'medium',
  id
}: ScrollSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const {
    scrollYProgress
  } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  const eased = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4
  });
  const range = {
    soft: 26,
    medium: 44,
    strong: 68
  }[depth];
  const y = useTransform(eased, [0, 0.5, 1], [range, 0, -range]);
  // Sin escala: reducir la sección deja ver el fondo del documento por los
  // costados y la web se percibe metida en un marco.
  // Se atenúa solo en los extremos, sin llegar a lavar el contenido legible.
  const opacity = useTransform(eased, [0, 0.12, 0.9, 1], [0.72, 1, 1, 0.78]);
  if (reduce) {
    return <section id={id} className={className}>
        {children}
      </section>;
  }
  return <section id={id} ref={ref} className={className}>
      <motion.div style={{
      y,
      opacity,
      willChange: 'transform, opacity'
    }}>
        {children}
      </motion.div>
    </section>;
}
interface ParallaxLayerProps {
  children: React.ReactNode;
  /** Positivo baja más lento que la página; negativo, más rápido. */
  speed?: number;
  className?: string;
}

/** Capa con velocidad propia: da profundidad real a imágenes de fondo. */
export function ParallaxLayer({
  children,
  speed = 12,
  className = ''
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const {
    scrollYProgress
  } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  const y = useTransform(scrollYProgress, [0, 1], [`${-speed}%`, `${speed}%`]);
  return <div ref={ref} className={className}>
      <motion.div className="h-full w-full" style={reduce ? undefined : {
      y
    }}>
        {children}
      </motion.div>
    </div>;
}