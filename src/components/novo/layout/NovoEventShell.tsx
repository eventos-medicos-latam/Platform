import React, { useState } from 'react';
import { Outlet, useLocation, useParams, NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon, LayoutDashboardIcon, InfoIcon, CalendarDaysIcon,
  TicketIcon, BuildingIcon, LayoutPanelLeftIcon, MessageSquareIcon,
  GlobeIcon, SettingsIcon, ChevronDownIcon,
  ZapIcon, ExternalLinkIcon, ChevronRightIcon,
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
  { path: 'web',            label: 'Web',            icon: GlobeIcon },
  { path: 'configuracion',  label: 'Config.',        icon: SettingsIcon },
];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  proximo:    { label: 'Próximo',    color: '#5B8AF0', bg: 'rgba(91,138,240,.15)'  },
  en_curso:   { label: 'En curso',  color: '#00C9A0', bg: 'rgba(0,201,160,.15)'   },
  finalizado: { label: 'Finalizado',color: '#3A5470', bg: 'rgba(58,84,112,.2)'    },
  cancelado:  { label: 'Cancelado', color: '#F24463', bg: 'rgba(242,68,99,.15)'   },
  borrador:   { label: 'Borrador',  color: '#F59E0B', bg: 'rgba(245,158,11,.15)'  },
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

  return (
    <div className="flex min-h-screen w-full flex-col" style={{ background: '#0d1829', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>

      {/* ── Top bar 1: contexto del evento ────────────────────────────────── */}
      <div className="sticky top-0 z-30"
        style={{ background: 'rgba(10,33,64,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Fila superior: breadcrumb + acciones */}
        <div className="flex items-center gap-3 px-6 py-3">
          {/* Volver */}
          <Link to="/novo/eventos"
            className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2 py-1.5 transition-all shrink-0"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent'; }}>
            <ArrowLeftIcon size={11} /> Eventos
          </Link>

          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 14 }}>·</span>

          {/* Selector de evento */}
          <div className="relative flex-1 min-w-0">
            <button type="button" onClick={() => setEventsOpen(o => !o)}
              className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-left transition-all max-w-xs"
              style={{ background: eventsOpen ? 'rgba(0,201,160,.08)' : 'transparent' }}
              onMouseEnter={e => { if (!eventsOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!eventsOpen) e.currentTarget.style.background = 'transparent'; }}>
              <span className="text-sm font-bold text-white truncate" style={{ fontFamily: "'Sora', sans-serif" }}>
                {event.name}
              </span>
              <ChevronDownIcon size={12} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0, transform: eventsOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {/* Dropdown eventos */}
            <AnimatePresence>
              {eventsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute left-0 top-full mt-1.5 z-50 w-72 rounded-xl overflow-hidden py-1"
                  style={{ background: '#112035', border: '1px solid #1e3450', boxShadow: '0 12px 32px rgba(0,0,0,.6)' }}>
                  {MOCK_EVENTS.map(ev => (
                    <Link key={ev.id} to={`/novo/eventos/${ev.id}`}
                      onClick={() => setEventsOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 transition-colors"
                      style={{ background: ev.id === event.id ? 'rgba(0,201,160,.08)' : 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = ev.id === event.id ? 'rgba(0,201,160,.12)' : 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ev.id === event.id ? 'rgba(0,201,160,.08)' : 'transparent'; }}>
                      <ZapIcon size={11} style={{ color: ev.id === event.id ? '#00C9A0' : '#3A5470', flexShrink: 0 }} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: ev.id === event.id ? '#00C9A0' : '#E1EAF4' }}>{ev.name}</p>
                        <p className="text-[9px]" style={{ color: '#3A5470' }}>{ev.venue_city}</p>
                      </div>
                      {ev.id === event.id && <ChevronRightIcon size={10} style={{ color: '#00C9A0', marginLeft: 'auto', flexShrink: 0 }} />}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Derecha: ocupación + badge + link */}
          <div className="flex items-center gap-3 shrink-0">
            {event.max_capacity && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-1.5 w-20 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pctOcupado}%`, background: pctOcupado > 80 ? '#F59E0B' : '#00C9A0' }} />
                </div>
                <span className="text-[10px] tabular-nums" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {event.registrations_count ?? 0}/{event.max_capacity}
                </span>
              </div>
            )}
            <span className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold"
              style={{ color: status.color, background: status.bg }}>{status.label}</span>
            <Link to={`/novo/eventos/${event.id}/web`}
              className="hidden lg:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              style={{ background: 'rgba(0,201,160,.08)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,201,160,.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,201,160,.08)'; }}>
              <ExternalLinkIcon size={11} /> Ver página
            </Link>
          </div>
        </div>

        {/* Fila inferior: nav horizontal */}
        <nav className="flex items-end gap-0.5 px-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {EVENT_NAV.map((item) => {
            const to = item.path ? `${base}/${item.path}` : base;
            return (
              <NavLink key={to} to={to} end={item.end}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 shrink-0"
                style={({ isActive }) => ({
                  color: isActive ? '#00C9A0' : 'rgba(255,255,255,0.45)',
                  background: isActive ? 'rgba(0,201,160,.08)' : 'transparent',
                  borderBottom: isActive ? '2px solid #00C9A0' : '2px solid transparent',
                  marginBottom: -1,
                })}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  if (!el.getAttribute('aria-current')) {
                    el.style.color = 'rgba(255,255,255,0.8)';
                    el.style.background = 'rgba(255,255,255,0.04)';
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  if (!el.getAttribute('aria-current')) {
                    el.style.color = 'rgba(255,255,255,0.45)';
                    el.style.background = 'transparent';
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={13} strokeWidth={isActive ? 2.2 : 1.75}
                      style={{ color: isActive ? '#00C9A0' : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* ── Contenido ─────────────────────────────────────────────────────── */}
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
  );
}
