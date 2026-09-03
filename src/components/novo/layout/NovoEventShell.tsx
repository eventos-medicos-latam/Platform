import React from 'react';
import { Outlet, useLocation, useParams, NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon, LayoutDashboardIcon, InfoIcon, CalendarDaysIcon,
  TicketIcon, BuildingIcon, LayoutPanelLeftIcon, MessageSquareIcon,
  GlobeIcon, SettingsIcon, ChevronRightIcon,
} from 'lucide-react';
import { MOCK_EVENTS } from '../../../lib/novo/mock';

const EVENT_NAV = [
  { path: '',               label: 'Resumen',              icon: LayoutDashboardIcon, end: true },
  { path: 'informacion',    label: 'Información',          icon: InfoIcon },
  { path: 'agenda',         label: 'Agenda',               icon: CalendarDaysIcon },
  { path: 'inscripciones',  label: 'Inscripciones',        icon: TicketIcon },
  { path: 'patrocinadores', label: 'Patrocinadores',       icon: BuildingIcon },
  { path: 'stands',         label: 'Stands',               icon: LayoutPanelLeftIcon },
  { path: 'comunicaciones', label: 'Comunicaciones',       icon: MessageSquareIcon },
  { path: 'web',            label: 'Página Web',           icon: GlobeIcon },
  { path: 'configuracion',  label: 'Configuración',        icon: SettingsIcon },
];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  proximo:    { label: 'Próximo',    color: '#5B8AF0', bg: 'rgba(91,138,240,.12)'  },
  en_curso:   { label: 'En curso',  color: '#00C9A0', bg: 'rgba(0,201,160,.12)'   },
  finalizado: { label: 'Finalizado',color: '#3A5470', bg: 'rgba(58,84,112,.15)'   },
  cancelado:  { label: 'Cancelado', color: '#F24463', bg: 'rgba(242,68,99,.12)'   },
  borrador:   { label: 'Borrador',  color: '#F59E0B', bg: 'rgba(245,158,11,.12)'  },
};

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  virtual:    'Virtual',
  hibrido:    'Híbrido',
};

export function NovoEventShell() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const event = MOCK_EVENTS.find(e => e.id === id) ?? MOCK_EVENTS[0];
  const status = STATUS_LABELS[event.operational_status ?? 'borrador'] ?? STATUS_LABELS.borrador;
  const base = `/novo/eventos/${event.id}`;

  const pctOcupado = event.max_capacity
    ? Math.min(100, Math.round(((event.registrations_count ?? 0) / event.max_capacity) * 100))
    : 0;

  return (
    <div
      className="flex min-h-screen w-full"
      style={{ background: '#080C14', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Sidebar contextual del evento */}
      <aside
        className="hidden lg:flex sticky top-0 h-screen w-[220px] shrink-0 flex-col"
        style={{ background: '#080C14', borderRight: '1px solid #1E2D45' }}
      >
        {/* Volver + info del evento */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid #1E2D45' }}>
          <Link
            to="/novo/eventos"
            className="flex items-center gap-1.5 text-xs font-semibold mb-4 opacity-40 hover:opacity-80 transition-opacity"
            style={{ color: '#7A9CB8' }}
          >
            <ArrowLeftIcon size={12} />
            Mis Eventos
          </Link>

          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ color: status.color, background: status.bg }}
            >
              {status.label}
            </span>
            <span className="text-[10px]" style={{ color: '#3A5470' }}>
              {MODALITY_LABELS[event.modality ?? 'presencial']}
            </span>
          </div>

          <p className="text-sm font-bold leading-tight" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>
            {event.name}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: '#3A5470' }}>
            {event.venue_city} · {new Date(event.start_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {/* Nav — lista plana sin grupos */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-0.5">
            {EVENT_NAV.map((item) => {
              const to = item.path ? `${base}/${item.path}` : base;
              return (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={item.end}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-all duration-150 ${
                        isActive ? 'font-semibold' : 'font-medium opacity-50 hover:opacity-80'
                      }`
                    }
                    style={({ isActive }) => ({
                      color: isActive ? '#00C9A0' : '#7A9CB8',
                      background: isActive ? 'rgba(0,201,160,0.08)' : 'transparent',
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="event-nav-marker"
                            className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
                            style={{ background: '#00C9A0' }}
                            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                          />
                        )}
                        <item.icon size={14} strokeWidth={isActive ? 2 : 1.75} />
                        <span className="truncate flex-1">{item.label}</span>
                        {isActive && <ChevronRightIcon size={11} strokeWidth={2} style={{ opacity: 0.5 }} />}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Ocupación */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid #1E2D45' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#3A5470' }}>
              Ocupación
            </span>
            <span className="text-[10px] font-bold tabular-nums" style={{ color: '#E1EAF4' }}>
              {event.registrations_count ?? 0} / {event.max_capacity ?? '—'}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: '#1E2D45' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pctOcupado}%`, background: '#00C9A0' }}
            />
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1 px-6 py-7 lg:px-8 lg:py-8"
          >
            <Outlet context={{ event }} />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
