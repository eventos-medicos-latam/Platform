import React, { useState } from 'react';
import { Outlet, useLocation, useParams, NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon, LayoutDashboardIcon, InfoIcon, CalendarDaysIcon,
  TicketIcon, BuildingIcon, LayoutPanelLeftIcon, MessageSquareIcon,
  GlobeIcon, SettingsIcon, ChevronRightIcon, ChevronDownIcon,
  ZapIcon, ExternalLinkIcon,
} from 'lucide-react';
import { MOCK_EVENTS } from '../../../lib/novo/mock';

const EVENT_NAV = [
  { path: '',               label: 'Resumen',        icon: LayoutDashboardIcon, end: true },
  { path: 'informacion',    label: 'Información',    icon: InfoIcon },
  { path: 'agenda',         label: 'Agenda',         icon: CalendarDaysIcon },
  { path: 'inscripciones',  label: 'Inscripciones',  icon: TicketIcon },
  { path: 'patrocinadores', label: 'Patrocinadores', icon: BuildingIcon },
  { path: 'stands',         label: 'Stands',         icon: LayoutPanelLeftIcon },
  { path: 'comunicaciones', label: 'Comunicaciones', icon: MessageSquareIcon },
  { path: 'web',            label: 'Página Web',     icon: GlobeIcon },
  { path: 'configuracion',  label: 'Config.',        icon: SettingsIcon },
];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  proximo:    { label: 'Próximo',    color: '#5B8AF0', bg: 'rgba(91,138,240,.15)'  },
  en_curso:   { label: 'En curso',  color: '#00C9A0', bg: 'rgba(0,201,160,.15)'   },
  finalizado: { label: 'Finalizado',color: '#3A5470', bg: 'rgba(58,84,112,.2)'    },
  cancelado:  { label: 'Cancelado', color: '#F24463', bg: 'rgba(242,68,99,.15)'   },
  borrador:   { label: 'Borrador',  color: '#F59E0B', bg: 'rgba(245,158,11,.15)'  },
};

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  virtual:    'Virtual',
  hibrido:    'Híbrido',
};

export function NovoEventShell() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [eventsOpen, setEventsOpen] = useState(false);

  const event = MOCK_EVENTS.find(e => e.id === id) ?? MOCK_EVENTS[0];
  const status = STATUS_LABELS[event.operational_status ?? 'borrador'] ?? STATUS_LABELS.borrador;
  const base = `/novo/eventos/${event.id}`;

  const pctOcupado = event.max_capacity
    ? Math.min(100, Math.round(((event.registrations_count ?? 0) / event.max_capacity) * 100))
    : 0;

  // Ruta activa — para el label en el header
  const currentNav = EVENT_NAV.find(item => {
    const to = item.path ? `${base}/${item.path}` : base;
    return item.path === '' ? location.pathname === base : location.pathname.startsWith(to);
  });

  return (
    <div className="flex min-h-screen w-full" style={{ background: '#0d1829', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>

      {/* ── Sidebar lateral del evento ─────────────────────────────────────── */}
      <aside className="hidden lg:flex sticky top-0 h-screen w-[220px] shrink-0 flex-col"
        style={{ background: '#0a2140', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Back + evento selector */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Link to="/novo/eventos"
            className="flex items-center gap-1.5 text-xs font-semibold mb-4 transition-all rounded-lg px-2 py-1.5 w-fit"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <ArrowLeftIcon size={11} /> Mis Eventos
          </Link>

          {/* Selector de eventos */}
          <div className="relative">
            <button type="button" onClick={() => setEventsOpen(o => !o)}
              className="w-full flex items-start gap-2 rounded-xl p-2.5 text-left transition-all"
              style={{ background: eventsOpen ? 'rgba(0,201,160,.08)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              onMouseEnter={e => { if (!eventsOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (!eventsOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                    style={{ color: status.color, background: status.bg }}>{status.label}</span>
                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {MODALITY_LABELS[event.modality ?? 'presencial']}
                  </span>
                </div>
                <p className="text-xs font-bold leading-tight text-white truncate" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {event.name}
                </p>
                <p className="text-[9px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {event.venue_city} · {new Date(event.start_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <ChevronDownIcon size={12} style={{ color: 'rgba(255,255,255,0.3)', marginTop: 2, flexShrink: 0, transform: eventsOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {/* Dropdown otros eventos */}
            <AnimatePresence>
              {eventsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl overflow-hidden py-1"
                  style={{ background: '#112035', border: '1px solid #1e3450', boxShadow: '0 12px 32px rgba(0,0,0,.6)' }}
                >
                  {MOCK_EVENTS.map(ev => (
                    <Link key={ev.id} to={`/novo/eventos/${ev.id}`}
                      onClick={() => setEventsOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 transition-colors"
                      style={{ background: ev.id === event.id ? 'rgba(0,201,160,.08)' : 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = ev.id === event.id ? 'rgba(0,201,160,.12)' : 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ev.id === event.id ? 'rgba(0,201,160,.08)' : 'transparent'; }}
                    >
                      <ZapIcon size={11} style={{ color: ev.id === event.id ? '#00C9A0' : '#3A5470', flexShrink: 0 }} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: ev.id === event.id ? '#00C9A0' : '#E1EAF4' }}>{ev.name}</p>
                        <p className="text-[9px]" style={{ color: '#3A5470' }}>{ev.venue_city}</p>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {EVENT_NAV.map((item) => {
              const to = item.path ? `${base}/${item.path}` : base;
              return (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={item.end}
                    className="group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-200"
                    style={({ isActive }) => ({
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                      background: isActive ? 'rgba(0,201,160,.10)' : 'transparent',
                      fontWeight: isActive ? 600 : 400,
                      boxShadow: isActive ? '0 0 0 1px rgba(0,201,160,0.18) inset' : 'none',
                    })}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      if (!el.getAttribute('aria-current')) {
                        el.style.background = 'rgba(255,255,255,0.05)';
                        el.style.color = 'rgba(255,255,255,0.85)';
                        el.style.boxShadow = '0 2px 8px rgba(0,0,0,.2)';
                      }
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      if (!el.getAttribute('aria-current')) {
                        el.style.background = 'transparent';
                        el.style.color = 'rgba(255,255,255,0.5)';
                        el.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span layoutId="event-nav-marker"
                            className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
                            style={{ background: '#00C9A0', boxShadow: '0 0 8px rgba(0,201,160,.5)' }}
                            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                          />
                        )}
                        <item.icon size={14} strokeWidth={isActive ? 2 : 1.75}
                          style={{ color: isActive ? '#00C9A0' : 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                        <span className="truncate flex-1 text-xs">{item.label}</span>
                        {isActive && <ChevronRightIcon size={10} strokeWidth={2.5} style={{ color: '#00C9A0', opacity: 0.5 }} />}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Ocupación */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.25)' }}>Ocupación</span>
            <span className="text-[10px] font-bold tabular-nums text-white">
              {event.registrations_count ?? 0} / {event.max_capacity ?? '—'}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pctOcupado}%`, background: pctOcupado > 80 ? '#F59E0B' : '#00C9A0' }} />
          </div>
          <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{pctOcupado}% del aforo</p>
        </div>
      </aside>

      {/* ── Área de contenido ─────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Top bar contextual */}
        <div className="sticky top-0 z-20 flex items-center gap-3 px-6 py-3"
          style={{ background: 'rgba(13,24,41,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link to="/novo/eventos" className="text-xs font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
              Eventos
            </Link>
            <ChevronRightIcon size={11} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <span className="text-xs font-semibold text-white truncate">{event.name}</span>
            {currentNav && currentNav.path && (
              <>
                <ChevronRightIcon size={11} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                <span className="text-xs" style={{ color: '#00C9A0' }}>{currentNav.label}</span>
              </>
            )}
          </div>
          {/* Acciones rápidas */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold"
              style={{ color: status.color, background: status.bg }}>{status.label}</span>
            <Link to={`/novo/eventos/${event.id}/web`}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              style={{ background: 'rgba(0,201,160,.08)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,201,160,.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,201,160,.08)'; }}>
              <ExternalLinkIcon size={11} /> Ver página pública
            </Link>
          </div>
        </div>

        {/* Contenido con animación por ruta */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1 px-6 py-7 lg:px-8 lg:py-8"
          >
            <Outlet context={{ event }} />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
