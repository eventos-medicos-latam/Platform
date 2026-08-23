import React from 'react';
import { editions, featuredEditionId } from '../../data/editions';
import { TrackIcon } from '../ui/TrackIcon';

/** Cinta cinética con los ejes de la próxima edición: movimiento lineal continuo. */
export function KineticBand() {
  const edition = editions.find((item) => item.id === featuredEditionId);
  const tracks = edition?.trackAxis.tracks ?? [];
  if (!edition || tracks.length === 0) return null;
  const items = [...tracks, ...tracks];
  return <section aria-label={`${edition.trackAxis.pluralLabel} de ${edition.name}`} className="overflow-hidden border-y border-white/10 bg-brand py-5 text-white" style={{
    ['--accent-rgb' as string]: edition.accentRgb,
    ['--marquee-duration' as string]: '38s'
  }}>
      <div className="marquee-track flex w-max items-center gap-10">
        {items.map((track, index) => <span key={`${track.id}-${index}`} className="flex shrink-0 items-center gap-3">
            <TrackIcon icon={track.icon} size={24} className="text-white/70" />
            <span className="text-base font-semibold tracking-tight">{track.name}</span>
            <span className="ml-3 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          </span>)}
      </div>
    </section>;
}