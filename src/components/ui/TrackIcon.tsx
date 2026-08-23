import React from 'react';
import type { Track } from '../../types/event';
interface TrackIconProps {
  icon: Track['icon'];
  className?: string;
  /** Tamaño en px del lado del icono. */
  size?: number;
}

/**
 * Iconografía propia de los ejes temáticos: trazo institucional de 1.5px
 * más una forma sólida en el acento del evento. No se usan emojis ni iconos
 * genéricos para los puentes: son la firma visual de la edición.
 */
export function TrackIcon({
  icon,
  className = '',
  size = 28
}: TrackIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true
  };
  switch (icon) {
    case 'gut':
      return <svg {...common}>
          <path d="M7 3.5v4.2c0 1.7 1.4 3 3.1 3h1.3c1.7 0 3.1 1.4 3.1 3.1v1.3c0 1.7-1.4 3.1-3.1 3.1H10c-1.7 0-3 1.4-3 3.1" />
          <path d="M17 3.5v4.6" />
          <circle cx="17" cy="11.4" r="2.1" className="fill-accent" stroke="none" />
        </svg>;
    case 'hormone':
      return <svg {...common}>
          <path d="M4 6.5h4.5M4 17.5h4.5" />
          <path d="M8.5 6.5c0 3 7 5 7 8 0 1.7-1.3 3-3 3" />
          <path d="M15.5 6.5c0 2-2.6 3.4-4.4 4.6" />
          <circle cx="18.2" cy="6.5" r="2.2" className="fill-accent" stroke="none" />
        </svg>;
    case 'immune':
      return <svg {...common}>
          <path d="M12 3.4 5.5 5.9v5.4c0 4 2.7 7.3 6.5 9.3 3.8-2 6.5-5.3 6.5-9.3V5.9z" />
          <path d="M12 8.6v6.8M9 12h6" className="text-accent" />
          <circle cx="12" cy="12" r="1.9" className="fill-accent" stroke="none" />
        </svg>;
    case 'sleep':
      return <svg {...common}>
          <path d="M18.6 14.2A7 7 0 0 1 9.8 5.4a7 7 0 1 0 8.8 8.8z" />
          <path d="M3.5 19.5c1.2 0 1.2-1.2 2.4-1.2s1.2 1.2 2.4 1.2 1.2-1.2 2.4-1.2 1.2 1.2 2.4 1.2" className="text-accent" />
          <circle cx="16.4" cy="7.6" r="1.6" className="fill-accent" stroke="none" />
        </svg>;
    case 'cell':
      return <svg {...common}>
          <circle cx="12" cy="12" r="8.3" />
          <path d="M12 3.7c3 2.4 3 14.2 0 16.6" className="text-accent" />
          <circle cx="9.4" cy="10.4" r="2.4" className="fill-accent" stroke="none" />
        </svg>;
    case 'skin':
      return <svg {...common}>
          <path d="M3.6 7.4h16.8M3.6 12h16.8M3.6 16.6h16.8" />
          <path d="M8.4 4.6v14.8" className="text-accent" />
          <circle cx="15.4" cy="12" r="2.1" className="fill-accent" stroke="none" />
        </svg>;
    default:
      return null;
  }
}