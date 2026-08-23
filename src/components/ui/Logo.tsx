import React from 'react';
import { media } from '../../data/media';
interface LogoProps {
  /** onDark: el logo blanco va directo sobre una superficie oscura.
   *  onLight: se encapsula en una placa oscura, porque el archivo es blanco. */
  surface?: 'onDark' | 'onLight';
  compact?: boolean;
  className?: string;
}

/**
 * Logo oficial de Eventos Médicos LATAM: archivo blanco con fondo transparente.
 * Regla de marca: solo se muestra sobre fondo oscuro. En superficies claras se
 * encapsula en una placa de color institucional, nunca se invierte ni se recolorea.
 */
export function Logo({
  surface = 'onDark',
  compact = false,
  className = ''
}: LogoProps) {
  const height = compact ? 'h-6' : 'h-8 sm:h-9';
  const image = <img src={media.logoWhite} alt="Eventos Médicos LATAM" className={`${height} w-auto select-none`} draggable={false} />;
  if (surface === 'onLight') {
    return <span className={`inline-flex items-center rounded-xl bg-brand-deep px-3 py-2 shadow-elev2 ${className}`}>
        {image}
      </span>;
  }
  return <span className={`inline-flex items-center ${className}`}>{image}</span>;
}