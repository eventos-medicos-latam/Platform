import React from 'react';
import { Link } from 'react-router-dom';
import { LandmarkIcon } from 'lucide-react';
import { allies } from '../../data/content';
import type { CompanyRole } from '../../types/company';
import { OrbitCarousel, type OrbitItem } from '../ui/OrbitCarousel';
export const roleLabels: Record<CompanyRole, string> = {
  organizador: 'Organizador',
  certificador: 'Certificador',
  'sociedad-medica': 'Sociedad médica',
  'aliado-academico': 'Aliado académico',
  'aliado-institucional': 'Aliado institucional',
  patrocinador: 'Patrocinador',
  expositor: 'Expositor',
  'media-partner': 'Media partner',
  'aliado-comercial': 'Aliado comercial',
  marca: 'Marca'
};
interface AlliesCarouselProps {
  onlyPublished?: boolean;
  showLink?: boolean;
}

/** Aliados en eje circular, con avance automático. */
export function AlliesCarousel({
  onlyPublished = true,
  showLink = true
}: AlliesCarouselProps) {
  const list = onlyPublished ? allies.filter((ally) => ally.status === 'publicado') : allies;
  const inProgress = allies.filter((ally) => ally.status !== 'publicado').length;
  if (list.length === 0) return null;
  const items: OrbitItem[] = list.map((ally) => ({
    id: ally.id,
    label: ally.name,
    content: <>
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
          <LandmarkIcon size={22} />
        </span>
        <span className="mt-6 block text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
          {roleLabels[ally.role]}
        </span>
        <span className="mt-2 block text-xl font-bold leading-snug tracking-tight text-brand">
          {ally.name}
        </span>
        <span className="mt-3 block text-sm leading-relaxed text-ink-muted">{ally.description}</span>
        <span className="mt-auto flex items-center gap-2 border-t border-line pt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          <span className={`h-1.5 w-1.5 rounded-full ${ally.status === 'publicado' ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden="true" />
          {ally.status === 'publicado' ? 'Acuerdo confirmado' : 'En conversación'}
        </span>
      </>
  }));
  return <section className="surface-deep relative isolate overflow-hidden py-20 text-white lg:py-24" aria-label="Aliados institucionales">
      

      <div className="relative mx-auto max-w-shell px-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
              Aliados
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(1.9rem,4vw,3.2rem)] font-bold leading-[1.05] tracking-tight">
              Instituciones que respaldan
              <span className="block font-normal text-white/50">cada programa académico</span>
            </h2>
          </div>
          {showLink ? <Link to="/aliados" className="text-sm font-semibold text-white underline decoration-white/30 underline-offset-4 transition-colors duration-150 ease-emphasis hover:decoration-white">
              Ver todos los aliados
            </Link> : null}
        </div>

        <OrbitCarousel items={items} surface="dark" className="mt-14" />

        {onlyPublished && inProgress > 0 ? <p className="mt-8 text-center text-sm text-white/50">
            {inProgress} instituciones más en conversación. No se publican mientras el acuerdo esté en
            negociación.
          </p> : null}
      </div>
    </section>;
}