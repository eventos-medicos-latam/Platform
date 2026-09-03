import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarDaysIcon, UsersIcon, DollarSignIcon,
  BuildingIcon, TrendingUpIcon, AlertTriangleIcon,
  CheckCircleIcon, ChevronRightIcon, ZapIcon,
  ClockIcon, ArrowRightIcon,
} from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { EventStatusPill, ModalityBadge } from '../../components/novo/ui/StatusPill';
import {
  getDashboardStats, getAlerts, getRecentRegistrations,
  listEvents, formatCurrency, formatDate,
} from '../../lib/novo/events';
import type { DashboardStats, NovoEvent, EventRegistration } from '../../types/novo';

const ALERT_COLOR: Record<string, string> = {
  alta:  '#F24463',
  media: '#F59E0B',
  baja:  '#5B8AF0',
};

export function NovoOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<NovoEvent[]>([]);
  const [alerts, setAlerts] = useState<{ id: string; level: 'alta' | 'media' | 'baja'; message: string; link: string; event?: string }[]>([]);
  const [recent, setRecent] = useState<EventRegistration[]>([]);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      listEvents(),
      getAlerts(),
      getRecentRegistrations(),
    ]).then(([s, e, a, r]) => {
      setStats(s);
      setEvents(e);
      setAlerts(a);
      setRecent(r);
    });
  }, []);

  const featuredEvent = events.find((e) => e.is_featured) ?? events[0];
  const upcomingEvents = events.filter((e) => ['proximo', 'activo'].includes(e.operational_status)).slice(0, 5);

  return (
    <div className="space-y-8">

      {/* Bienvenida */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="flex items-end justify-between"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>
            Panel de control
          </p>
          <h1
            className="text-2xl font-bold leading-tight"
            style={{ color: '#E1EAF4', fontFamily: "'Sora', 'Inter', sans-serif" }}
          >
            Resumen General
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#7A9CB8' }}>
            {new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </p>
        </div>
        <Link
          to="/novo/eventos"
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 hover:opacity-90 active:scale-95"
          style={{ background: '#162031', color: '#7A9CB8', border: '1px solid #1E2D45' }}
        >
          Ver todos los eventos
          <ArrowRightIcon size={14} />
        </Link>
      </motion.div>

      {/* KPIs globales */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KPICard
          label="Total Eventos"
          value={stats?.total_events ?? '—'}
          sub={`${stats?.active_events ?? 0} activos · ${stats?.upcoming_events ?? 0} próximos`}
          icon={CalendarDaysIcon}
          accent="#5B8AF0"
          delay={0}
        />
        <KPICard
          label="Registros"
          value={stats ? stats.total_registrations.toLocaleString('es-CO') : '—'}
          sub="todas las ediciones"
          icon={UsersIcon}
          accent="#00C9A0"
          delay={0.07}
        />
        <KPICard
          label="Ingresos"
          value={stats ? formatCurrency(stats.total_revenue) : '—'}
          sub="acumulado 2025"
          icon={DollarSignIcon}
          accent="#FF7043"
          delay={0.14}
        />
        <KPICard
          label="Empresas"
          value={stats?.total_companies ?? '—'}
          sub="en la plataforma"
          icon={BuildingIcon}
          accent="#A78BFA"
          delay={0.21}
        />
      </div>

      {/* Evento protagonista + Alertas */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* Evento protagonista */}
        {featuredEvent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.28 }}
            className="xl:col-span-2 relative overflow-hidden rounded-2xl"
            style={{ border: '1px solid #1E2D45', background: '#0E1520' }}
          >
            {featuredEvent.cover_image_url && (
              <div
                className="h-36 w-full bg-center bg-cover"
                style={{
                  backgroundImage: `url(${featuredEvent.cover_image_url})`,
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 100%)',
                }}
              />
            )}
            <div className="p-5">
              <div className="mb-1 flex items-center gap-2">
                <ZapIcon size={12} style={{ color: '#F59E0B' }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#F59E0B' }}>
                  Evento protagonista
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', 'Inter', sans-serif" }}>
                    {featuredEvent.name}
                  </h2>
                  <p className="text-sm" style={{ color: '#7A9CB8' }}>
                    {formatDate(featuredEvent.start_date)} · {featuredEvent.venue_city ?? featuredEvent.platform_name}
                  </p>
                </div>
                <EventStatusPill status={featuredEvent.operational_status} />
              </div>

              {/* KPIs del evento protagonista */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  {
                    label: 'Registros',
                    value: featuredEvent.registrations_count ?? 0,
                    max: featuredEvent.max_capacity,
                    accent: '#00C9A0',
                  },
                  {
                    label: 'Ingresos',
                    value: featuredEvent.revenue ? formatCurrency(featuredEvent.revenue) : '—',
                    max: undefined,
                    accent: '#FF7043',
                  },
                  {
                    label: 'Meta registros',
                    value: featuredEvent.goals?.registros
                      ? `${Math.round(((featuredEvent.registrations_count ?? 0) / featuredEvent.goals.registros) * 100)}%`
                      : '—',
                    max: undefined,
                    accent: '#5B8AF0',
                  },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-xl p-3"
                    style={{ background: '#162031', border: '1px solid #1E2D45' }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#3A5470' }}>
                      {kpi.label}
                    </p>
                    <p className="text-lg font-bold tabular-nums" style={{ color: kpi.accent, fontFamily: "'Sora', sans-serif" }}>
                      {typeof kpi.value === 'number' ? kpi.value.toLocaleString('es-CO') : kpi.value}
                    </p>
                    {kpi.max && (
                      <p className="text-[10px]" style={{ color: '#3A5470' }}>de {kpi.max}</p>
                    )}
                  </div>
                ))}
              </div>

              <Link
                to={`/novo/eventos/${featuredEvent.id}`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors duration-150"
                style={{ color: '#00C9A0' }}
              >
                Ver módulos del evento <ChevronRightIcon size={12} />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Panel de alertas */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.32 }}
          className="rounded-2xl p-5"
          style={{ border: '1px solid #1E2D45', background: '#0E1520' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold" style={{ color: '#E1EAF4' }}>
              Alertas
            </h3>
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: '#F2446318', color: '#F24463', border: '1px solid #F2446330' }}
            >
              {alerts.filter((a) => a.level === 'alta').length}
            </span>
          </div>
          <ul className="space-y-2.5">
            {alerts.length === 0 && (
              <li className="flex items-center gap-2 text-xs" style={{ color: '#3A5470' }}>
                <CheckCircleIcon size={14} style={{ color: '#00C9A0' }} />
                Sin alertas pendientes
              </li>
            )}
            {alerts.map((alert) => (
              <li key={alert.id}>
                <Link
                  to={alert.link}
                  className="flex items-start gap-2.5 rounded-xl p-3 transition-colors duration-150"
                  style={{ background: '#162031', border: `1px solid ${ALERT_COLOR[alert.level]}20` }}
                >
                  <AlertTriangleIcon
                    size={13}
                    className="mt-0.5 shrink-0"
                    style={{ color: ALERT_COLOR[alert.level] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-snug" style={{ color: '#E1EAF4' }}>
                      {alert.message}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: `${ALERT_COLOR[alert.level]}20`, color: ALERT_COLOR[alert.level] }}
                      >
                        {alert.level}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Próximos eventos + Actividad reciente */}
      <div className="grid gap-6 xl:grid-cols-2">

        {/* Próximos eventos */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.38 }}
          className="rounded-2xl"
          style={{ border: '1px solid #1E2D45', background: '#0E1520' }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #152238' }}>
            <h3 className="text-sm font-bold" style={{ color: '#E1EAF4' }}>Próximos eventos</h3>
            <Link to="/novo/eventos" className="text-xs font-semibold" style={{ color: '#00C9A0' }}>
              Ver todos →
            </Link>
          </div>
          <ul>
            {upcomingEvents.map((ev, i) => (
              <li
                key={ev.id}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150"
                style={{ borderBottom: i < upcomingEvents.length - 1 ? '1px solid #152238' : 'none' }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base"
                  style={{ background: '#162031', border: '1px solid #1E2D45' }}
                >
                  {ev.event_type === 'webinar' ? '🖥' : ev.modality === 'virtual' ? '📡' : '🏥'}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/novo/eventos/${ev.id}`}
                    className="block truncate text-sm font-semibold transition-colors duration-100 hover:text-[#00C9A0]"
                    style={{ color: '#E1EAF4' }}
                  >
                    {ev.name}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2">
                    <ClockIcon size={10} style={{ color: '#3A5470' }} />
                    <span className="text-xs" style={{ color: '#3A5470' }}>
                      {formatDate(ev.start_date)}
                    </span>
                    <ModalityBadge modality={ev.modality} />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums" style={{ color: '#E1EAF4' }}>
                    {(ev.registrations_count ?? 0).toLocaleString('es-CO')}
                  </p>
                  <p className="text-[10px]" style={{ color: '#3A5470' }}>registros</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Actividad reciente */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.44 }}
          className="rounded-2xl"
          style={{ border: '1px solid #1E2D45', background: '#0E1520' }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #152238' }}>
            <h3 className="text-sm font-bold" style={{ color: '#E1EAF4' }}>Actividad reciente</h3>
            <Link to="/novo/registros" className="text-xs font-semibold" style={{ color: '#00C9A0' }}>
              Ver registros →
            </Link>
          </div>
          <ul>
            {recent.map((reg, i) => (
              <li
                key={reg.id}
                className="flex items-center gap-3 px-5 py-3.5"
                style={{ borderBottom: i < recent.length - 1 ? '1px solid #152238' : 'none' }}
              >
                {/* Avatar inicial */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #5B8AF0, #00C9A0)', color: '#fff' }}
                >
                  {(reg.person?.full_name ?? '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: '#E1EAF4' }}>
                    {reg.person?.full_name ?? 'Persona'}
                  </p>
                  <p className="truncate text-xs" style={{ color: '#3A5470' }}>
                    {reg.event?.name} · {reg.registration_type}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold tabular-nums" style={{ color: '#00C9A0' }}>
                    {reg.amount_paid ? formatCurrency(reg.amount_paid) : 'Gratuito'}
                  </p>
                  <p className="text-[10px]" style={{ color: '#3A5470' }}>
                    {new Intl.RelativeTimeFormat('es', { numeric: 'auto' }).format(-1, 'day')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
