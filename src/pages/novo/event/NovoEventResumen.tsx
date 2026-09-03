import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UsersIcon, DollarSignIcon, CalendarCheckIcon, TrendingUpIcon,
  MapPinIcon, ClockIcon, GlobeIcon, CheckCircleIcon, AlertCircleIcon,
} from 'lucide-react';
import { KPICard } from '../../../components/novo/ui/KPICard';
import { formatCurrency } from '../../../lib/novo/events';
import type { NovoEvent } from '../../../types/novo';

interface EventContext { event: NovoEvent }

const MODALITY_CONFIG: Record<string, { label: string; color: string }> = {
  presencial: { label: 'Presencial',  color: '#00C9A0' },
  virtual:    { label: 'Virtual',     color: '#5B8AF0' },
  hibrido:    { label: 'Híbrido',     color: '#A78BFA' },
};

const MOCK_ALERTS = [
  { id: 1, type: 'warning', text: 'Nestlé: pago vencido desde el 9 sep 2025' },
  { id: 2, type: 'info',    text: '2 stands disponibles sin asignar' },
  { id: 3, type: 'ok',      text: 'Microsite publicado y visible al público' },
];

const MOCK_AGENDA_PREVIEW = [
  { time: '08:00', title: 'Registro y acreditación', type: 'operacion' },
  { time: '09:00', title: 'Conferencia inaugural: Dra. Valentina Ospina', type: 'conferencia' },
  { time: '10:30', title: 'Coffee break', type: 'break' },
  { time: '11:00', title: 'Panel: Microbiota y salud hormonal', type: 'panel' },
  { time: '13:00', title: 'Almuerzo', type: 'break' },
];

const AGENDA_COLORS: Record<string, string> = {
  operacion:  '#3A5470',
  conferencia:'#00C9A0',
  panel:      '#5B8AF0',
  break:      '#F59E0B',
  taller:     '#A78BFA',
};

export function NovoEventResumen() {
  const { event } = useOutletContext<EventContext>();

  const pctRegistros = event.goals?.registros && event.registrations_count
    ? Math.round((event.registrations_count / event.goals.registros) * 100) : 0;
  const pctIngresos = event.goals?.ingresos && event.revenue
    ? Math.round((event.revenue / event.goals.ingresos) * 100) : 0;
  const modality = MODALITY_CONFIG[event.modality ?? 'presencial'];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#00C9A0' }}>
                {event.event_type}
              </span>
              <span className="text-xs" style={{ color: '#3A5470' }}>·</span>
              <span className="text-xs font-semibold" style={{ color: modality.color }}>
                {modality.label}
              </span>
            </div>
            <h1
              className="text-2xl font-bold leading-tight"
              style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}
            >
              {event.name}
            </h1>
            {event.tagline && (
              <p className="mt-1 text-sm italic" style={{ color: '#7A9CB8' }}>{event.tagline}</p>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {[
            { icon: CalendarCheckIcon, text: `${formatDate(event.start_date)}${event.end_date !== event.start_date ? ` → ${formatDate(event.end_date)}` : ''}` },
            { icon: ClockIcon,          text: `${event.start_time} – ${event.end_time}` },
            { icon: MapPinIcon,         text: `${event.venue_name ?? ''}, ${event.venue_city}` },
            ...(event.platform_name ? [{ icon: GlobeIcon, text: event.platform_name }] : []),
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <item.icon size={13} style={{ color: '#3A5470', flexShrink: 0 }} />
              <span className="text-xs" style={{ color: '#7A9CB8' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard
          label="Registros"
          value={(event.registrations_count ?? 0).toLocaleString('es-CO')}
          sub={`Meta: ${(event.goals?.registros ?? 0).toLocaleString('es-CO')}`}
          icon={UsersIcon}
          accent="#00C9A0"
          progress={pctRegistros}
          delay={0}
        />
        <KPICard
          label="Ingresos"
          value={formatCurrency(event.revenue ?? 0)}
          sub={`Meta: ${formatCurrency(event.goals?.ingresos ?? 0)}`}
          icon={DollarSignIcon}
          accent="#FF7043"
          progress={pctIngresos}
          delay={0.05}
        />
        <KPICard
          label="Conversión"
          value={`${pctRegistros}%`}
          sub="registros vs meta"
          icon={TrendingUpIcon}
          accent="#5B8AF0"
          delay={0.1}
        />
        <KPICard
          label="Capacidad"
          value={`${event.max_capacity ?? '—'}`}
          sub={`${event.registrations_count ?? 0} inscritos`}
          icon={UsersIcon}
          accent="#A78BFA"
          progress={event.max_capacity ? Math.round(((event.registrations_count ?? 0) / event.max_capacity) * 100) : 0}
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Alertas */}
        <div className="col-span-1">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3A5470' }}>
            Alertas
          </p>
          <div className="space-y-2">
            {MOCK_ALERTS.map(alert => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: alert.id * 0.06 }}
                className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
                style={{
                  background: '#0E1520',
                  border: `1px solid ${alert.type === 'warning' ? 'rgba(242,68,99,.25)' : alert.type === 'ok' ? 'rgba(0,201,160,.15)' : '#1E2D45'}`,
                }}
              >
                {alert.type === 'ok'
                  ? <CheckCircleIcon size={14} style={{ color: '#00C9A0', flexShrink: 0, marginTop: 1 }} />
                  : <AlertCircleIcon size={14} style={{ color: alert.type === 'warning' ? '#F24463' : '#F59E0B', flexShrink: 0, marginTop: 1 }} />
                }
                <p className="text-xs leading-snug" style={{ color: '#7A9CB8' }}>{alert.text}</p>
              </motion.div>
            ))}
          </div>

          {/* Descripción */}
          {event.description && (
            <div className="mt-4 rounded-xl p-4" style={{ background: '#0E1520', border: '1px solid #1E2D45' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#3A5470' }}>
                Descripción
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#7A9CB8' }}>{event.description}</p>
            </div>
          )}
        </div>

        {/* Agenda preview */}
        <div className="col-span-2">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3A5470' }}>
            Agenda del día — vista rápida
          </p>
          <div className="overflow-hidden rounded-2xl" style={{ background: '#0E1520', border: '1px solid #1E2D45' }}>
            {MOCK_AGENDA_PREVIEW.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{ borderBottom: i < MOCK_AGENDA_PREVIEW.length - 1 ? '1px solid #152238' : 'none' }}
              >
                <div className="w-12 shrink-0">
                  <p className="text-xs font-bold tabular-nums" style={{ color: '#3A5470' }}>{item.time}</p>
                </div>
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: AGENDA_COLORS[item.type] ?? '#3A5470' }}
                />
                <p className="text-sm flex-1" style={{ color: '#E1EAF4' }}>{item.title}</p>
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-semibold capitalize"
                  style={{ background: `${AGENDA_COLORS[item.type] ?? '#3A5470'}20`, color: AGENDA_COLORS[item.type] ?? '#3A5470' }}
                >
                  {item.type}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Cover image si existe */}
          {event.cover_image_url && (
            <div className="mt-4 overflow-hidden rounded-2xl" style={{ border: '1px solid #1E2D45', height: 140 }}>
              <img
                src={event.cover_image_url}
                alt={event.name}
                className="h-full w-full object-cover"
                style={{ opacity: 0.6 }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
