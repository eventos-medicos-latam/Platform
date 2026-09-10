import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LandmarkIcon } from 'lucide-react';
import { listPublicAllies, type NovoCompany } from '../../lib/novo/companies';
import { OrbitCarousel, type OrbitItem } from '../ui/OrbitCarousel';

interface AlliesCarouselProps {
  onlyPublished?: boolean;
  showLink?: boolean;
}

function roleOf(company: NovoCompany) {
  const sector = company.sector.toLowerCase();
  if (sector.includes('certific')) return 'Certificador';
  if (sector.includes('universidad') || sector.includes('académ')) return 'Aliado académico';
  if (sector.includes('sociedad')) return 'Sociedad médica';
  if (sector.includes('media') || sector.includes('prensa')) return 'Media partner';
  return company.sector || 'Aliado';
}

export function AlliesCarousel({
  showLink = true,
}: AlliesCarouselProps) {
  const [companies, setCompanies] = useState<NovoCompany[] | null>(null);

  useEffect(() => {
    listPublicAllies()
      .then(setCompanies)
      .catch(() => setCompanies([]));
  }, []);

  if (companies === null) return null;
  if (companies.length === 0) {
    return (
      <section className="surface-deep relative isolate overflow-hidden py-20 text-white lg:py-24" aria-label="Aliados institucionales">
        <div className="relative mx-auto max-w-shell px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Aliados</p>
          <h2 className="mt-4 max-w-2xl text-[clamp(1.9rem,4vw,3.2rem)] font-bold leading-[1.05] tracking-tight">
            Instituciones que respaldan
            <span className="block font-normal text-white/50">cada programa académico</span>
          </h2>
          <p className="mt-6 max-w-xl text-sm text-white/55">
            Los aliados publicados desde empresas Novo aparecen aquí. Todavía no hay logos públicos.
          </p>
        </div>
      </section>
    );
  }

  const items: OrbitItem[] = companies.map((company) => ({
    id: company.id,
    label: company.name,
    content: <>
        <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-brand-soft text-brand">
          {company.logo
            ? <img src={company.logo} alt="" className="h-full w-full object-contain" />
            : <LandmarkIcon size={22} />}
        </span>
        <span className="mt-6 block text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
          {roleOf(company)}
        </span>
        <span className="mt-2 block text-xl font-bold leading-snug tracking-tight text-brand">
          {company.name}
        </span>
        <span className="mt-3 block text-sm leading-relaxed text-ink-muted">
          {company.notas || [company.ciudad, company.pais].filter(Boolean).join(' · ') || 'Aliado EML'}
        </span>
        <span className="mt-auto flex items-center gap-2 border-t border-line pt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Acuerdo confirmado
        </span>
      </>
  }));

  return (
    <section className="surface-deep relative isolate overflow-hidden py-20 text-white lg:py-24" aria-label="Aliados institucionales">
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
          {showLink ? (
            <Link to="/aliados" className="text-sm font-semibold text-white underline decoration-white/30 underline-offset-4 transition-colors duration-150 ease-emphasis hover:decoration-white">
              Ver todos los aliados
            </Link>
          ) : null}
        </div>
        <OrbitCarousel items={items} surface="dark" className="mt-14" />
      </div>
    </section>
  );
}
