import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon, SearchIcon, FilterIcon,
  ExternalLinkIcon, CopyIcon, MoreHorizontalIcon,
  UsersIcon, MapPinIcon, MonitorIcon, ZapIcon,
} from 'lucide-react';
import type { NovoEvent, NovoEventOperationalStatus } from '../../../types/novo';
import { EventStatusPill, ModalityBadge } from '../ui/StatusPill';
import { formatDate, formatCurrency } from '../../../lib/novo/events';

const FILTERS: { label: string; value: NovoEventOperationalStatus | 'todos' }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activo' },
  { label: 'Próximos', value: 'proximo' },
  { label: 'Borradores', value: 'borrador' },
  { label: 'Finalizados', value: 'finalizado' },
  { label: 'Cancelados', value: 'cancelado' },
  { label: 'Archivados', value: 'archivado' },
];

const MODALITY_ICON: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>> = {
  presencial: MapPinIcon,
  virtual: MonitorIcon,
  hibrido: ZapIcon,
};

interface Props {
  events: NovoEvent[];
  onCreateEvent?: () => void;
}

export function EventsTable({ events, onCreateEvent }: Props) {
  const [filter, setFilter] = useState<NovoEventOperationalStatus | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = events.filter((e) => {
    const matchFilter = filter === 'todos' || e.operational_status === filter;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.venue_city ?? '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', 'Inter', sans-serif" }}>
            Mis Eventos
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#7A9CB8' }}>
            {events.length} eventos · motor universal
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateEvent}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}
        >
          <PlusIcon size={16} strokeWidth={2.5} />
          Crear evento
        </button>
      </div>

      {/* Controles */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Búsqueda */}
        <div
          className="relative flex items-center"
          style={{ background: '#112035', border: '1px solid #1e3450', borderRadius: 12 }}
        >
          <SearchIcon size={14} className="absolute left-3" style={{ color: '#3A5470' }} />
          <input
            type="text"
            placeholder="Buscar evento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent pl-9 pr-4 py-2 text-sm outline-none w-52"
            style={{ color: '#E1EAF4' }}
          />
        </div>

        {/* Filtros por estado */}
        <div
          className="flex items-center gap-0.5 p-1 rounded-xl"
          style={{ background: '#112035', border: '1px solid #1e3450' }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
              style={{
                background: filter === f.value ? '#1e3450' : 'transparent',
                color: filter === f.value ? '#E1EAF4' : '#3A5470',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ border: '1px solid #1e3450', background: '#112035' }}
      >
        {/* Cabecera */}
        <div
          className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-3"
          style={{
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto',
            color: '#3A5470',
            borderBottom: '1px solid #1a2e45',
          }}
        >
          <span>Evento</span>
          <span>Modalidad</span>
          <span>Fecha</span>
          <span>Registros</span>
          <span>Ingresos</span>
          <span>Estado</span>
          <span />
        </div>

        {/* Filas */}
        {filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: '#3A5470' }}>
            <p className="text-sm">Sin resultados para esta búsqueda</p>
          </div>
        )}
        {filtered.map((event, i) => {
          const ModalIcon = MODALITY_ICON[event.modality] ?? MapPinIcon;
          const regProgress = event.max_capacity && event.registrations_count
            ? (event.registrations_count / event.max_capacity) * 100 : undefined;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1], delay: i * 0.04 }}
              className="group relative grid items-center px-5 py-4 transition-colors duration-150"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto',
                borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none',
                background: 'transparent',
              }}
              onMouseEnter={(el) => (el.currentTarget.style.background = '#182d47')}
              onMouseLeave={(el) => (el.currentTarget.style.background = 'transparent')}
            >
              {/* Nombre */}
              <div className="flex items-center gap-3 min-w-0 pr-4">
                {event.cover_image_url ? (
                  <img
                    src={event.cover_image_url}
                    alt=""
                    className="h-9 w-14 rounded-lg object-cover shrink-0"
                    style={{ border: '1px solid #1e3450' }}
                  />
                ) : (
                  <div
                    className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg text-lg"
                    style={{ background: '#182d47', border: '1px solid #1e3450' }}
                  >
                    🏥
                  </div>
                )}
                <div className="min-w-0">
                  <Link
                    to={`/novo/eventos/${event.id}`}
                    className="block truncate text-sm font-semibold transition-colors duration-100 hover:text-[#00C9A0]"
                    style={{ color: '#E1EAF4' }}
                  >
                    {event.name}
                  </Link>
                  <p className="truncate text-xs mt-0.5" style={{ color: '#3A5470' }}>
                    {event.venue_city ?? event.platform_name ?? 'Sin ubicación'}
                    {event.contracting_company && ` · ${event.contracting_company.name}`}
                  </p>
                </div>
              </div>

              {/* Modalidad */}
              <div><ModalityBadge modality={event.modality} /></div>

              {/* Fecha */}
              <div>
                <p className="text-sm tabular-nums" style={{ color: '#7A9CB8' }}>
                  {formatDate(event.start_date)}
                </p>
              </div>

              {/* Registros */}
              <div>
                <p className="text-sm font-semibold tabular-nums" style={{ color: '#E1EAF4' }}>
                  {(event.registrations_count ?? 0).toLocaleString('es-CO')}
                </p>
                {regProgress !== undefined && (
                  <div className="mt-1.5 h-1 w-16 overflow-hidden rounded-full" style={{ background: '#1e3450' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(regProgress, 100)}%`, background: '#00C9A0' }}
                    />
                  </div>
                )}
              </div>

              {/* Ingresos */}
              <div>
                <p className="text-sm font-semibold tabular-nums" style={{ color: '#E1EAF4' }}>
                  {event.revenue ? formatCurrency(event.revenue) : '—'}
                </p>
              </div>

              {/* Estado */}
              <div><EventStatusPill status={event.operational_status} /></div>

              {/* Acciones */}
              <div className="relative flex items-center gap-1 pl-2">
                <Link
                  to={`/eventos/${event.slug}`}
                  target="_blank"
                  className="flex h-7 w-7 items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: '#3A5470', background: '#182d47' }}
                  title="Ver sitio público"
                >
                  <ExternalLinkIcon size={13} />
                </Link>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: '#3A5470', background: '#182d47' }}
                  onClick={() => setOpenMenu(openMenu === event.id ? null : event.id)}
                >
                  <MoreHorizontalIcon size={13} />
                </button>
                {openMenu === event.id && (
                  <div
                    className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl py-1"
                    style={{ background: '#182d47', border: '1px solid #1e3450', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                  >
                    {[
                      { label: 'Abrir', to: `/novo/eventos/${event.id}` },
                      { label: 'Editar', to: `/novo/eventos/${event.id}/editar` },
                      { label: 'Clonar', to: '#' },
                    ].map((a) => (
                      <Link
                        key={a.label}
                        to={a.to}
                        className="block px-3.5 py-2 text-xs font-medium transition-colors"
                        style={{ color: '#7A9CB8' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#E1EAF4')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#7A9CB8')}
                        onClick={() => setOpenMenu(null)}
                      >
                        {a.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
