import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Al cambiar de ruta, la vista vuelve al inicio de la página de forma
 * inmediata. Sin esto, el scroll suavizado conserva la posición anterior y
 * aterrizas a media sección, sobre todo en móvil.
 */
export function ScrollReset() {
  const {
    pathname
  } = useLocation();
  useEffect(() => {
    const lenis = (window as unknown as {
      lenis?: {
        scrollTo: (t: number, o?: object) => void;
      };
    }).lenis;
    if (lenis) {
      lenis.scrollTo(0, {
        immediate: true
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
}