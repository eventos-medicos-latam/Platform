import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayersIcon, SearchXIcon } from 'lucide-react';
import { PageTransition } from '../../components/motion/PageTransition';
import { editions, eventFamilies } from '../../data/editions';
import { EventCard } from '../../components/public/EventCard';
import { LegacyOrbit } from '../../components/public/LegacyOrbit';
import { DigitalSessionsStrip } from '../../components/public/DigitalSessionsStrip';
import { PageHero } from '../../components/public/PageHero';
import { media } from '../../data/media';
import { EASE_EMPHASIS } from '../../utils/motion';
const statusFilters = [{
  id: 'todos',
  label: 'Todos'
}, {
  id: 'abiertos',
  label: 'Inscripciones abiertas',
  statuses: ['preventa', 'venta-activa']
}, {
  id: 'proximos',
  label: 'Próximos',
  statuses: ['proximamente', 'prelanzamiento']
}, {
  id: 'realizados',
  label: 'Realizados',
  statuses: ['historico', 'post-evento', 'cerrado']
}];
export function Events() {
  const [familyId, setFamilyId] = useState('todas');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [year, setYear] = useState('todos');
  const years = useMemo(() => [...new Set(editions.map((edition) => String(edition.year)))].sort(), []);
  const filtered = editions.filter((edition) => edition.status !== 'borrador').filter((edition) => familyId === 'todas' ? true : edition.familyId === familyId).filter((edition) => year === 'todos' ? true : String(edition.year) === year).filter((edition) => {
    const filter = statusFilters.find((item) => item.id === statusFilter);
    if (!filter?.statuses) return true;
    return filter.statuses.includes(edition.status);
  });
  const families = [{
    id: 'todas',
    name: 'Todas las familias'
  }, ...eventFamilies];
  return <PageTransition>
      <PageHero eyebrow="Eventos" title={[{
      text: 'Congresos, cursos',
      tone: 'bold'
    }, {
      text: 'y experiencias académicas',
      tone: 'light'
    }]} lead="Cada evento vive dentro de una familia y conserva sus ediciones anteriores como archivo consultable." image={media.archiveHall} facts={[{
      label: 'Familias',
      value: String(eventFamilies.length)
    }, {
      label: 'Ediciones publicadas',
      value: String(editions.filter((e) => e.status !== 'borrador').length)
    }]} />

      {/* Trayectoria completa: mismo recorrido 3D que en la Home */}
      <LegacyOrbit />

      {/* Archivo completo, filtrable */}
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

          {/* Filtros: pastilla que se desliza al activo */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {statusFilters.map((filter) => {
            const isActive = statusFilter === filter.id;
            return <button key={filter.id} type="button" onClick={() => setStatusFilter(filter.id)} className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 ease-emphasis ${isActive ? 'text-white' : 'text-ink-muted hover:text-brand'}`}>
                  {isActive ? <motion.span layoutId="events-filter-pill" className="grad-futuro absolute inset-0 rounded-full shadow-elev2" transition={{
                type: 'spring',
                stiffness: 320,
                damping: 30
              }} /> : null}
                  <span className="relative">{filter.label}</span>
                </button>;
          })}

            <div className="ml-auto flex flex-wrap gap-2">
              <select value={familyId} onChange={(event) => setFamilyId(event.target.value)} aria-label="Filtrar por familia" className="rounded-full border border-white bg-white/85 px-4 py-2 text-sm text-ink shadow-elev1 outline-none backdrop-blur transition-colors duration-150 ease-emphasis focus:border-brand-support">
                {families.map((family) => <option key={family.id} value={family.id}>
                    {family.name}
                  </option>)}
              </select>
              <select value={year} onChange={(event) => setYear(event.target.value)} aria-label="Filtrar por año" className="rounded-full border border-white bg-white/85 px-4 py-2 text-sm text-ink shadow-elev1 outline-none backdrop-blur transition-colors duration-150 ease-emphasis focus:border-brand-support">
                <option value="todos">Todos los años</option>
                {years.map((item) => <option key={item} value={item}>
                    {item}
                  </option>)}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? <div className="mt-12 rounded-3xl border border-white bg-white/80 p-12 text-center shadow-elev1 backdrop-blur">
              <SearchXIcon size={26} className="mx-auto text-ink-muted" />
              <p className="mt-4 font-semibold text-brand">Sin ediciones con estos filtros</p>
              <p className="mt-1 text-sm text-ink-muted">
                Prueba con otra familia o amplía el rango de años.
              </p>
            </div> : <motion.ul layout className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((edition, index) => <motion.li key={edition.id} layout initial={{
              opacity: 0,
              y: 26,
              rotateX: -8
            }} animate={{
              opacity: 1,
              y: 0,
              rotateX: 0
            }} exit={{
              opacity: 0,
              y: -12
            }} transition={{
              duration: 0.28,
              ease: EASE_EMPHASIS,
              delay: Math.min(index, 5) * 0.05
            }}>
                    <EventCard edition={edition} emphasis={edition.status === 'preventa'} />
                  </motion.li>)}
              </AnimatePresence>
            </motion.ul>}
        </div>
      </section>

      <DigitalSessionsStrip />
    </PageTransition>;
}