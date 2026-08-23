import React, { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Scroll suavizado global. Es la base de todo el movimiento ligado al scroll:
 * sin esto el navegador avanza a saltos y cualquier transformación continua se
 * ve entrecortada. Se desactiva por completo con prefers-reduced-motion.
 */
export function SmoothScroll({
  children


}: {children: React.ReactNode;}) {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6
    });
    // Expuesto para que la navegación pueda volver al inicio sin animación.
    (window as unknown as {
      lenis?: Lenis;
    }).lenis = lenis;
    let frame = 0;
    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      delete (window as unknown as {
        lenis?: Lenis;
      }).lenis;
    };
  }, []);
  return <>{children}</>;
}