import React, { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { getEdition, getEditionBySlug, getFamily } from '../../data/editions';
import { media } from '../../data/media';
import { editionStatusMeta, StatusBadge } from '../ui/StatusBadge';
import { SponsorBanner } from '../public/SponsorBanner';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';
import type { EditionSection } from '../../types/event';
const subNav: {
  path: string;
  label: string;
  section?: EditionSection;
}[] = [{
  path: '',
  label: 'Inicio'
}, {
  path: 'agenda',
  label: 'Agenda',
  section: 'agenda'
}, {
  path: 'patrocinadores',
  label: 'Participación de marca',
  section: 'patrocinadores'
}, {
  path: 'speakers',
  label: 'Speakers',
  section: 'speakers'
}, {
  path: 'tickets',
  label: 'Tickets',
  section: 'tickets'
}, {
  path: 'ubicacion',
  label: 'Ubicación',
  section: 'ubicacion'
}, {
  path: 'faq',
  label: 'FAQ',
  section: 'faq'
}];
const salesOpen = ['preventa', 'venta-activa'];
export function EventLayout() {
  const {
    familySlug = '',
    editionSlug = ''
  } = useParams();
  const location = useLocation();
  const edition = getEditionBySlug(familySlug, editionSlug);
  useEffect(() => {
    window.scrollTo({
      top: 0
    });
  }, [location.pathname]);
  if (!edition) {
    return <div className="flex min-h-screen w-full flex-col bg-canvas">
        <PublicHeader />
        <main className="mx-auto flex max-w-shell flex-1 flex-col items-start px-6 py-24">
          <h1 className="text-3xl font-bold tracking-tight text-brand">Evento no encontrado</h1>
          <p className="mt-3 text-base text-ink">
            La edición que buscas no existe o todavía no está publicada.
          </p>
          <Link to="/eventos" className="mt-8 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white">
            Ver todos los eventos
          </Link>
        </main>
        <PublicFooter />
      </div>;
  }
  const family = getFamily(edition.familyId);
  const base = `/eventos/${familySlug}/${editionSlug}`;
  const status = editionStatusMeta[edition.status];
  const previous = edition.previousEditionId ? getEdition(edition.previousEditionId) : undefined;
  const next = edition.nextEditionId ? getEdition(edition.nextEditionId) : undefined;
  const isRegistration = location.pathname.includes('/inscripcion');
  const canRegister = salesOpen.includes(edition.status);
  const items = subNav.filter((item) => !item.section || edition.sections.includes(item.section));
  return <div className="flex min-h-screen w-full flex-col bg-canvas" style={{
    ['--accent-rgb' as string]: edition.accentRgb
  }}>
      <PublicHeader />

      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-shell px-6 py-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {/* Marca del producto: el evento pertenece a Hormobiota */}
            {family?.slug === 'hormobiota' ? <Link to="/hormobiota" className="mr-1 shrink-0" aria-label="Hormobiota">
                <img src={media.logoHormobiota} alt="HormoBiota 2.0" className="h-12 w-auto" draggable={false} />
              </Link> : null}
            <Link to="/eventos" className="text-sm text-ink-muted hover:text-brand">
              Eventos
            </Link>
            <span className="text-ink-muted/50">/</span>
            <span className="text-sm text-ink-muted">{family?.name}</span>
            <span className="text-ink-muted/50">/</span>
            <span className="text-sm font-semibold text-brand">
              {edition.name} · {edition.year}
            </span>
            <StatusBadge label={status.label} tone={status.tone} />
            <div className="ml-auto flex items-center gap-2">
              {previous ? <Link to={`/eventos/${familySlug}/${previous.slug}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 ease-emphasis hover:border-brand/40">
                  <ArrowLeftIcon size={13} /> {previous.name} {previous.year}
                </Link> : null}
              {next ? <Link to={`/eventos/${familySlug}/${next.slug}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 ease-emphasis hover:border-brand/40">
                  {next.name} {next.year} <ArrowRightIcon size={13} />
                </Link> : null}
            </div>
          </div>
        </div>
      </div>

      <nav aria-label="Secciones del evento" className="sticky top-[57px] z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-shell px-6">
          <ul className="no-scrollbar flex gap-1 overflow-x-auto">
            {items.map((item) => <li key={item.path}>
                <NavLink to={item.path ? `${base}/${item.path}` : base} end={item.path === ''} className={({
              isActive
            }) => `relative block whitespace-nowrap px-3.5 py-3 text-sm font-medium transition-colors duration-150 ease-emphasis ${isActive ? 'text-brand' : 'text-ink-muted hover:text-brand'}`}>
                  {({
                isActive
              }) => <>
                      {item.label}
                      {isActive ? <motion.span layoutId="event-nav-underline" className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent" transition={{
                  duration: DURATION.dropdown,
                  ease: EASE_EMPHASIS
                }} /> : null}
                    </>}
                </NavLink>
              </li>)}
            {edition.sections.includes('tickets') ? <li className="ml-auto hidden items-center py-2 md:flex">
                <Link to={`${base}/inscripcion`} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
                  {canRegister ? 'Inscribirme' : 'Recibir información'}
                </Link>
              </li> : null}
          </ul>
        </div>
      </nav>

      <main className="flex-1">
        <Outlet context={{
        edition
      }} />
      </main>

      <PublicFooter />

      {/* Barra de inscripción móvil: siempre por encima de la franja de patrocinadores. */}
      {!isRegistration && edition.sections.includes('tickets') ? <div className="fixed inset-x-0 bottom-[52px] z-30 border-t border-line bg-brand px-4 py-2.5 md:hidden">
          <Link to={`${base}/inscripcion`} className="block rounded-lg bg-white py-2.5 text-center text-sm font-semibold text-brand">
            {canRegister ? 'Inscribirme a ' : 'Recibir información de '}
            {edition.name}
          </Link>
        </div> : null}

      {!isRegistration ? <SponsorBanner surface="evento" mode="fixed" /> : null}
      {!isRegistration ? <div className="h-28 md:hidden" aria-hidden="true" /> : null}
    </div>;
}