import React from 'react';

export const TILE_DESKTOP = 'h-[132px] w-[132px]';
export const TILE_MOBILE = 'h-[76px] w-[76px]';

export function monogram(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

interface SponsorLogoTileProps {
  name: string;
  logoUrl: string | null;
  hasLogo: boolean;
  size?: 'desktop' | 'mobile';
  onClick?: () => void;
}

/** El recuadro de logo que usa la cinta pública — compartido con la vista
 * previa del admin para que sea pixel-idéntica a lo que ve un visitante. */
export function SponsorLogoTile({ name, logoUrl, hasLogo, size = 'desktop', onClick }: SponsorLogoTileProps) {
  const sizing = size === 'mobile' ? TILE_MOBILE : TILE_DESKTOP;
  const className = `group grid ${sizing} shrink-0 place-items-center overflow-hidden rounded-2xl border bg-white p-3 transition-[transform,box-shadow,border-color] duration-200 ease-emphasis ${hasLogo ? 'border-line/70 shadow-elev1 hover:scale-[1.09] hover:border-brand/30 hover:shadow-elev4' : 'border-dashed border-line'}`;
  const content = hasLogo && logoUrl ? <img src={logoUrl} alt={name} className="h-full w-full object-contain" draggable={false} loading="lazy" /> : <span className="flex flex-col items-center gap-1.5 px-1 text-center">
      <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-md bg-brand-soft text-[11px] font-bold text-brand">
        {monogram(name)}
      </span>
      <span className="truncate text-[10px] font-medium text-ink-muted">
        {name}
      </span>
    </span>;
  if (onClick) {
    return <button type="button" onClick={onClick} aria-label={`Ver información de ${name}`} className={className}>
        {content}
      </button>;
  }
  return <div className={className}>{content}</div>;
}
