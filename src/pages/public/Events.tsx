import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRightIcon, CalendarDaysIcon, LayersIcon, MapPinIcon, SearchXIcon } from 'lucide-react';
import { PageTransition } from '../../components/motion/PageTransition';
import { LegacyOrbit } from '../../components/public/LegacyOrbit';
import { DigitalSessionsStrip } from '../../components/public/DigitalSessionsStrip';
import { PageHero } from '../../components/public/PageHero';
import { media } from '../../data/media';
import { EASE_EMPHASIS } from '../../utils/motion';
import { listPublicEvents } from '../../lib/novo/events';
import type { NovoEvent, NovoEventOperationalStatus, NovoEventType } from '../../types/novo';

const TYPE_LABEL: Record<NovoEventType, string> = {
  congreso: 'Congreso',
  webinar: 'Webinar',
  masterclass: 'Masterclass',
  simposio: 'Simposio',
  lanzamiento: 'Lanzamiento',
  conversatorio: 'Conversatorio',
  curso: 'Curso',
  otro: 'Evento',
};

const STATUS_FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'proximos', label: 'Próximos', statuses: ['proximo'] },
  { id: 'activos', label: 'En curso', statuses: ['activo'] },
  { id: 'realizados', label: 'Realizados', statuses: ['finalizado', 'archivado'] },
] as const;

const LIVE_STATUSES: NovoEventOperationalStatus[] = ['proximo', 'activo'];

function hexToRgb(hex: string | null | undefined): string {
  const raw = (hex || '#00C9A0').replace('#', '').trim();
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw.padEnd(6, '0').slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return '0 201 160';
  return `${n >> 16 & 255} ${n >> 8 & 255} ${n & 255}`;
}

function formatDateRange(start: string, end: string) {
  const from = new Date(`${start.slice(0, 10)}T12:00:00`);
  const to = new Date(`${(end || start).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(from.getTime())) return start;
  if (start.slice(0, 10) === (end || start).slice(0, 10)) {
    return from.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return `${from.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })} – ${to.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

function statusBadge(status: NovoEventOperationalStatus) {
  if (status === 'activo') return 'En curso';
  if (status === 'finalizado' || status === 'archivado') return 'Realizado';
  return 'Próximamente';
}

function UpcomingEventCard({ event }: { event: NovoEvent }) {
  const to = `/e/${event.slug}`;
  const img = event.cover_image_url || media.archiveHall;
  const accentRgb = hexToRgb(event.accent_color || event.primary_color);
  const place = [event.venue_name, event.venue_city].filter(Boolean).join(' · ') || 'Colombia';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.32, ease: EASE_EMPHASIS }}
      className="group relative overflow-hidden rounded-3xl text-white"
      style={{ boxShadow: 'var(--elev-3)' }}>
      <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" draggable={false} />
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(160deg, rgba(6,17,33,0.85) 0%, rgba(6,17,33,0.65) 50%, rgba(6,17,33,0.9) 100%)',
      }} />
      <div className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{ boxShadow: `inset 0 0 0 2px rgb(${accentRgb} / 0.4)` }} />

      <div className="relative flex min-h-[320px] flex-col justify-between p-7 sm:p-8 lg:p-10">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ background: `rgb(${accentRgb} / 0.25)`, color: `rgb(${accentRgb})`, border: `1px solid rgb(${accentRgb} / 0.4)` }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: `rgb(${accentRgb})` }} />
              {statusBadge(event.operational_status)}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
              {TYPE_LABEL[event.event_type] ?? event.event_type}
            </span>
          </div>
          <h3 className="mt-4 text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            {event.name}
          </h3>
          {event.tagline ? <p className="mt-2 text-base leading-relaxed text-white/70">{event.tagline}</p> : null}
        </div>

        <div>
          <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/65">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon size={14} className="shrink-0" style={{ color: `rgb(${accentRgb})` }} />
              <dd>{formatDateRange(event.start_date, event.end_date)}</dd>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon size={14} className="shrink-0" style={{ color: `rgb(${accentRgb})` }} />
              <dd>{place}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to={to}
              className="group/btn inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-transform duration-200 ease-emphasis hover:-translate-y-0.5"
              style={{ background: `rgb(${accentRgb})` }}>
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

function ArchiveEventCard({ event }: { event: NovoEvent }) {
  const accentRgb = hexToRgb(event.accent_color || event.primary_color);
  const img = event.cover_image_url || media.archiveHall;
  const place = [event.venue_name, event.venue_city].filter(Boolean).join(' · ') || 'Colombia';

  return (
    <Link to={`/e/${event.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white bg-white/80 shadow-elev1 backdrop-blur transition-colors hover:border-brand">
      <div className="relative h-40 overflow-hidden">
        <img src={img} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
          style={{ background: `rgb(${accentRgb} / 0.85)` }}>
          {statusBadge(event.operational_status)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
          {TYPE_LABEL[event.event_type] ?? event.event_type}
        </p>
        <h3 className="mt-1 text-lg font-bold leading-tight text-brand">{event.name}</h3>
        {event.tagline ? <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{event.tagline}</p> : null}
        <p className="mt-4 text-sm text-ink-muted">
          {formatDateRange(event.start_date, event.end_date)} · {place}
        </p>
      </div>
    </Link>
  );
}

export function Events() {
  const [typeFilter, setTypeFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [year, setYear] = useState('todos');
  const [novoEvents, setNovoEvents] = useState<NovoEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    listPublicEvents()
      .then(setNovoEvents)
      .catch(() => setNovoEvents([]))
      .finally(() => setLoaded(true));
  }, []);

  const upcoming = useMemo(() => {
    const live = novoEvents
      .filter((event) => LIVE_STATUSES.includes(event.operational_status))
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    const featured = live.filter((event) => event.is_featured);
    return featured.length > 0 ? featured : live;
  }, [novoEvents]);

  const years = useMemo(
    () => [...new Set(novoEvents.map((event) => event.start_date.slice(0, 4)).filter(Boolean))].sort(),
    [novoEvents],
  );

  const types = useMemo(
    () => [...new Set(novoEvents.map((event) => event.event_type))],
    [novoEvents],
  );

  const filtered = novoEvents
    .filter((event) => event.operational_status !== 'cancelado' && event.operational_status !== 'borrador')
    .filter((event) => typeFilter === 'todos' ? true : event.event_type === typeFilter)
    .filter((event) => year === 'todos' ? true : event.start_date.startsWith(year))
    .filter((event) => {
      const filter = STATUS_FILTERS.find((item) => item.id === statusFilter);
      if (!filter || !('statuses' in filter) || !filter.statuses) return true;
      return (filter.statuses as readonly string[]).includes(event.operational_status);
    });

  return (
    <PageTransition>
      <PageHero
        eyebrow="Eventos"
        title={[{ text: 'Congresos, cursos', tone: 'bold' }, { text: 'y experiencias académicas', tone: 'light' }]}
        lead="Los eventos publicados desde el panel aparecen aquí. Cada uno tiene su propia página de inscripción."
        image={media.archiveHall}
        facts={[
          { label: 'Publicados', value: String(novoEvents.length) },
          { label: 'Próximos', value: String(upcoming.length) },
        ]}
      />

      {upcoming.length > 0 && (
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
                {upcoming.length === 1
                  ? 'Un evento abierto en el calendario público.'
                  : `${upcoming.length} eventos en el calendario público. Inscripciones desde cada microsite.`}
              </p>
            </div>

            <div className={`grid gap-6 ${upcoming.length === 1 ? 'max-w-2xl' : 'md:grid-cols-2'}`}>
              {upcoming.map((event) => (
                <UpcomingEventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      <LegacyOrbit />

      <section className="tint-aurora py-20 lg:py-28">
        <div className="mx-auto max-w-shell px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-support">
                Calendario
              </p>
              <h2 className="mt-3 text-[clamp(1.8rem,3.4vw,2.7rem)] font-bold leading-[1.04] tracking-tight text-brand">
                Busca por tipo,
                <span className="font-normal text-ink-muted"> año o estado</span>
              </h2>
            </div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-4 py-2 text-sm font-semibold text-brand shadow-elev1 backdrop-blur">
              <LayersIcon size={15} className="text-accent" />
              {filtered.length} {filtered.length === 1 ? 'evento' : 'eventos'}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((filter) => {
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
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filtrar por tipo"
                className="rounded-full border border-white bg-white/85 px-4 py-2 text-sm text-ink shadow-elev1 outline-none backdrop-blur transition-colors duration-150 ease-emphasis focus:border-brand-support">
                <option value="todos">Todos los tipos</option>
                {types.map((type) => <option key={type} value={type}>{TYPE_LABEL[type] ?? type}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(e.target.value)}
                aria-label="Filtrar por año"
                className="rounded-full border border-white bg-white/85 px-4 py-2 text-sm text-ink shadow-elev1 outline-none backdrop-blur transition-colors duration-150 ease-emphasis focus:border-brand-support">
                <option value="todos">Todos los años</option>
                {years.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>

          {!loaded ? (
            <p className="mt-12 text-center text-sm text-ink-muted">Cargando eventos…</p>
          ) : filtered.length === 0 ? (
            <div className="mt-12 rounded-3xl border border-white bg-white/80 p-12 text-center shadow-elev1 backdrop-blur">
              <SearchXIcon size={26} className="mx-auto text-ink-muted" />
              <p className="mt-4 font-semibold text-brand">Sin eventos con estos filtros</p>
              <p className="mt-1 text-sm text-ink-muted">Prueba con otro tipo o amplía el rango de años.</p>
            </div>
          ) : (
            <motion.ul layout className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((event, index) => (
                  <motion.li key={event.id} layout
                    initial={{ opacity: 0, y: 26, rotateX: -8 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.28, ease: EASE_EMPHASIS, delay: Math.min(index, 5) * 0.05 }}>
                    <ArchiveEventCard event={event} />
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
