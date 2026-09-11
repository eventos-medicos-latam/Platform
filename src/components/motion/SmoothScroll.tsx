import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

type LenisWindow = Window & { lenis?: Lenis };

function usesNativeScroll(pathname: string) {
  return (
    pathname === '/login' ||
    pathname.startsWith('/novo') ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/speaker') ||
    pathname.startsWith('/admin')
  );
}

/**
 * Scroll suavizado en el sitio público. En paneles (Novo, portal, speaker)
 * Lenis captura la rueda y bloquea el scroll de menús laterales y modales.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const native = usesNativeScroll(pathname);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || native) return;
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6,
    });
    (window as LenisWindow).lenis = lenis;
    let frame = 0;
    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      delete (window as LenisWindow).lenis;
    };
  }, [native]);
  return <>{children}</>;
}
