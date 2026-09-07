import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRightIcon, CalendarDaysIcon, LayersIcon, MapPinIcon, SearchXIcon } from 'lucide-react';
import { PageTransition } from '../../components/motion/PageTransition';
import { editions, eventFamilies, getFamily } from '../../data/editions';
import { EventCard } from '../../components/public/EventCard';
import { LegacyOrbit } from '../../components/public/LegacyOrbit';
import { DigitalSessionsStrip } from '../../components/public/DigitalSessionsStrip';
import { PageHero } from '../../components/public/PageHero';
import { media, editionMedia } from '../../data/media';
import { EASE_EMPHASIS } from '../../utils/motion';

const upcomingStatuses = ['proximamente', 'prelanzamiento', 'preventa', 'venta-activa'];

const statusFilters = [
  { id: 'todos', label: 'Todos' },
  { id: 'abiertos', label: 'Inscripciones abiertas', statuses: ['preventa', 'venta-activa'] },
  { id: 'proximos', label: 'Próximos', statuses: ['proximamente', 'prelanzamiento'] },
  { id: 'realizados', label: 'Realizados', statuses: ['historico', 'post-evento', 'cerrado'] },
];

/** Tarjeta grande para los próximos eventos — más protagonismo que EventCard */
function UpcomingEventCard({ edition }: { edition: typeof editions[0] }) {
  const family = getFamily(edition.familyId);
  if (!family) return null;
  const to = `/eventos/${family.slug}/${edition.slug}`;
  const img = editionMedia[edition.id] ?? media.archiveHall;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.32, ease: EASE_EMPHASIS }}
      className="group relative overflow-hidden rounded-3xl text-white"
      style={{ boxShadow: 'var(--elev-3)' }}>
      {/* Foto de fondo */}
      <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" draggable={false} />
      {/* Overlay */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(160deg, rgba(6,17,33,0.85) 0%, rgba(6,17,33,0.65) 50%, rgba(6,17,33,0.9) 100%)'
      }} />
      {/* Borde de color */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{ boxShadow: `inset 0 0 0 2px rgb(${edition.accentRgb} / 0.4)` }} />

      <div className="relative flex min-h-[320px] flex-col justify-between p-7 sm:p-8 lg:p-10">
        <div>
          {/* Familia + estado */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ background: `rgb(${edition.accentRgb} / 0.25)`, color: `rgb(${edition.accentRgb})`, border: `1px solid rgb(${edition.accentRgb} / 0.4)` }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: `rgb(${edition.accentRgb})` }} />
              Próximamente
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
              {family.name}
            </span>
          </div>

          {/* Nombre + claim */}
          <h3 className="mt-4 text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            {edition.name}
          </h3>
          <p className="mt-2 text-base leading-relaxed text-white/70">{edition.claim}</p>
        </div>

        <div>
          {/* Detalles */}
          <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/65">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon size={14} className="shrink-0" style={{ color: `rgb(${edition.accentRgb})` }} />
              <dd>{edition.dateLabel}</dd>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon size={14} className="shrink-0" style={{ color: `rgb(${edition.accentRgb})` }} />
              <dd>{edition.venue.name} · {edition.venue.city}</dd>
            </div>
          </dl>

          {/* CTA */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to={to}
              className="group/btn inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-transform duration-200 ease-emphasis hover:-translate-y-0.5"
              style={{ background: `rgb(${edition.accentRgb})` }}>
              Ver evento
              <ArrowRightIcon size={15} className="transition-transform duration-200 ease-emphasis group-hover/btn:translate-x-1" />
            </Link>
            <Link to="/contacto" className="text-sm font-medium text-white/55 underline-offset-2 hover:text-white hover:underline">
              Quiero ser aliado
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function Events() {
  const [familyId, setFamilyId] = useState('todas');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [year, setYear] = useState('todos');

  const upcomingEditions = useMemo(
    () => editions.filter((e) => upcomingStatuses.includes(e.status)).sort((a, b) => a.year - b.year || a.startDate.localeCompare(b.startDate)),
    []
  );

  const years = useMemo(() => [...new Set(editions.map((e) => String(e.year)))].sort(), []);

  const filtered = editions
    .filter((e) => e.status !== 'borrador')
    .filter((e) => familyId === 'todas' ? true : e.familyId === familyId)
    .filter((e) => year === 'todos' ? true : String(e.year) === year)
    .filter((e) => {
      const filter = statusFilters.find((f) => f.id === statusFilter);
      if (!filter?.statuses) return true;
      return filter.statuses.includes(e.status);
    });

  const families = [{ id: 'todas', name: 'Todas las familias' }, ...eventFamilies];

  return (
    <PageTransition>
      <PageHero
        eyebrow="Eventos"
        title={[{ text: 'Congresos, cursos', tone: 'bold' }, { text: 'y experiencias académicas', tone: 'light' }]}
        lead="Cada evento vive dentro de una familia y conserva sus ediciones anteriores como archivo consultable."
        image={media.archiveHall}
        facts={[
          { label: 'Familias', value: String(eventFamilies.length) },
          { label: 'Ediciones publicadas', value: String(editions.filter((e) => e.status !== 'borrador').length) },
        ]}
      />

      {/* ── Próximos eventos ─────────────────────────────────────────── */}
      {upcomingEditions.length > 0 && (
        <section className="bg-canvas py-20 lg:py-28">
          <div className="mx-auto max-w-shell px-6">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                  En el radar
                </p>
                <h2 className="mt-3 text-[clamp(1.8rem,3.4vw,2.7rem)] font-bold leading-[1.04] tracking-tight text-brand">
                  Próximos eventos
                  <span className="block font-normal text-ink-muted">Estos son los que vienen</span>
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
                Dos eventos programados para el segundo semestre de 2026 y el primer semestre de 2027. Inscripciones abiertas o por confirmar.
              </p>
            </div>

            <div className={`grid gap-6 ${upcomingEditions.length === 1 ? 'max-w-2xl' : 'md:grid-cols-2'}`}>
              {upcomingEditions.map((ed) => (
                <UpcomingEventCard key={ed.id} edition={ed} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trayectoria completa ─────────────────────────────────────── */}
      <LegacyOrbit />

      {/* ── Archivo filtrable ────────────────────────────────────────── */}
      <section className="tint-aurora py-20 lg:py-28">
        <div className="mx-auto max-w-shell px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-support">
                Archivo completo
              </p>
              <h2 className="mt-3 text-[clamp(1.8rem,3.4vw,2.7rem)] font-bold leading-[1.04] tracking-tight text-brand">
                Busca por familia,
                <span className="font-normal text-ink-muted"> año o estado</span>
              </h2>
            </div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-4 py-2 text-sm font-semibold text-brand shadow-elev1 backdrop-blur">
              <LayersIcon size={15} className="text-accent" />
              {filtered.length} {filtered.length === 1 ? 'edición' : 'ediciones'}
            </p>
          </div>

          {/* Filtros */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {statusFilters.map((filter) => {
              const isActive = statusFilter === filter.id;
              return (
                <button key={filter.id} type="button" onClick={() => setStatusFilter(filter.id)}
                  className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 ease-emphasis ${isActive ? 'text-white' : 'text-ink-muted hover:text-brand'}`}>
                  {isActive ? (
                    <motion.span layoutId="events-filter-pill"
                      className="grad-futuro absolute inset-0 rounded-full shadow-elev2"
                      transition={{ type: 'spring', stiffness: 320, damping: 30 }} />
                  ) : null}
                  <span className="relative">{filter.label}</span>
                </button>
              );
            })}

            <div className="ml-auto flex flex-wrap gap-2">
              <select value={familyId} onChange={(e) => setFamilyId(e.target.value)}
                aria-label="Filtrar por familia"
                className="rounded-full border border-white bg-white/85 px-4 py-2 text-sm text-ink shadow-elev1 outline-none backdrop-blur transition-colors duration-150 ease-emphasis focus:border-brand-support">
                {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(e.target.value)}
                aria-label="Filtrar por año"
                className="rounded-full border border-white bg-white/85 px-4 py-2 text-sm text-ink shadow-elev1 outline-none backdrop-blur transition-colors duration-150 ease-emphasis focus:border-brand-support">
                <option value="todos">Todos los años</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-12 rounded-3xl border border-white bg-white/80 p-12 text-center shadow-elev1 backdrop-blur">
              <SearchXIcon size={26} className="mx-auto text-ink-muted" />
              <p className="mt-4 font-semibold text-brand">Sin ediciones con estos filtros</p>
              <p className="mt-1 text-sm text-ink-muted">Prueba con otra familia o amplía el rango de años.</p>
            </div>
          ) : (
            <motion.ul layout className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((edition, index) => (
                  <motion.li key={edition.id} layout
                    initial={{ opacity: 0, y: 26, rotateX: -8 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.28, ease: EASE_EMPHASIS, delay: Math.min(index, 5) * 0.05 }}>
                    <EventCard edition={edition} emphasis={edition.status === 'preventa'} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </section>

      <DigitalSessionsStrip />
    </PageTransition>
  );
}
