import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUpIcon, UsersIcon, TicketIcon, DollarSignIcon } from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { formatCurrency, listEvents } from '../../lib/novo/events';
import type { NovoEvent } from '../../types/novo';

type Period = string;

export function NovoAnalitica() {
  const [period, setPeriod] = useState<Period>('todos');
  const [events, setEvents] = useState<NovoEvent[]>([]);

  useEffect(() => {
    listEvents().then(setEvents).catch(() => setEvents([]));
  }, []);

  const visible = period === 'todos' ? events : events.filter((event) => event.id === period);
  const totalRegs = visible.reduce((sum, event) => sum + (event.registrations_count ?? 0), 0);
  const totalRev = visible.reduce((sum, event) => sum + (event.revenue ?? 0), 0);
  const ticketAvg = totalRegs ? Math.round(totalRev / totalRegs) : 0;
  const attendedGoal = visible.reduce((sum, event) => sum + (event.goals?.registros ?? 0), 0);
  const vsGoal = attendedGoal ? Math.round((totalRegs / attendedGoal) * 100) : null;

  const BAR_DATA = visible.map(e => ({
    name: e.name.split(' ').slice(0, 2).join(' '),
    registros: e.registrations_count ?? 0,
    meta: e.goals?.registros ?? 0,
    revenue: e.revenue ?? 0,
  }));
  const MAX_REG = Math.max(1, ...BAR_DATA.map(d => Math.max(d.registros, d.meta)));
  const denom = visible.length || 1;
  const modalityData = [
    { label: 'Presencial', key: 'presencial', color: '#00C9A0' },
    { label: 'Híbrido',    key: 'hibrido',    color: '#5B8AF0' },
    { label: 'Virtual',    key: 'virtual',    color: '#A78BFA' },
  ].map((item) => ({ ...item, pct: Math.round((visible.filter((event) => event.modality === item.key).length / denom) * 100) }));
  const audienceData = [
    { label: 'Profesionales', key: 'profesionales', color: '#00C9A0' },
    { label: 'Pacientes',     key: 'pacientes',     color: '#5B8AF0' },
    { label: 'Ambos',         key: 'ambos',         color: '#F59E0B' },
    { label: 'Público general', key: 'general',     color: '#3A5470' },
  ].map((item) => ({ ...item, pct: Math.round((visible.filter((event) => event.audience === item.key).length / denom) * 100) }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>
            KPIs y tendencias
          </p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>
            Analítica
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#7A9CB8' }}>
            Métricas clave · comparativo de metas · tendencias
          </p>
        </div>
        <div className="flex gap-0.5 p-1 rounded-xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
          {[{ id: 'todos', label: 'Todos' }, ...events.map((event) => ({ id: event.id, label: event.name.split(' ').slice(0, 2).join(' ') }))].map(p => (
            <button key={p.id} type="button" onClick={() => setPeriod(p.id)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
              style={{ background: period === p.id ? '#1e3450' : 'transparent', color: period === p.id ? '#E1EAF4' : '#3A5470' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs top */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Registros" value={totalRegs.toLocaleString('es-CO')} sub="inscripciones vigentes"
          icon={UsersIcon} accent="#00C9A0" delay={0} />
        <KPICard label="Ingresos" value={formatCurrency(totalRev)} sub="tickets e inscripciones"
          icon={DollarSignIcon} accent="#FF7043" delay={0.05} />
        <KPICard label="Ticket promedio" value={totalRegs ? formatCurrency(ticketAvg) : '—'} sub="por inscripción"
          icon={TicketIcon} accent="#5B8AF0" delay={0.1} />
        <KPICard label="Vs. meta" value={vsGoal !== null ? `${vsGoal}%` : '—'} sub="registros vs metas"
          icon={TrendingUpIcon} accent="#A78BFA" delay={0.15}
          progress={vsGoal ?? 0} />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Chart de barras — registros vs meta */}
        <div className="rounded-2xl p-5" style={{ background: '#112035', border: '1px solid #1e3450' }}>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: '#E1EAF4' }}>Registros vs. Meta</p>
            <div className="flex items-center gap-3 text-[10px]" style={{ color: '#3A5470' }}>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#00C9A0' }} /> Real
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#1e3450' }} /> Meta
              </span>
            </div>
          </div>
          <div className="flex items-end gap-3" style={{ height: 130 }}>
            {BAR_DATA.length === 0 && (
              <p className="text-xs self-center" style={{ color: '#3A5470' }}>Crea eventos para ver el comparativo.</p>
            )}
            {BAR_DATA.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative flex items-end gap-0.5" style={{ height: 100 }}>
                  {/* Barra meta */}
                  <div className="flex-1 rounded-t-sm" style={{ height: `${(d.meta / MAX_REG) * 100}%`, background: '#1e3450' }} />
                  {/* Barra real */}
                  <motion.div
                    className="flex-1 rounded-t-sm"
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.registros / MAX_REG) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: i * 0.08 }}
                    style={{ background: '#00C9A0' }}
                  />
                </div>
                <p className="text-center text-[9px] leading-tight" style={{ color: '#3A5470' }}>
                  {d.name}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1">
            {BAR_DATA.map((d, i) => (
              <p key={i} className="text-center text-[10px] tabular-nums font-semibold" style={{ color: '#7A9CB8' }}>
                {d.registros > 0 ? d.registros.toLocaleString('es-CO') : '—'}
              </p>
            ))}
          </div>
        </div>

        {/* Split modalidad + audiencia */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <p className="mb-4 text-sm font-bold" style={{ color: '#E1EAF4' }}>Por modalidad</p>
            <div className="space-y-3">
              {modalityData.map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: '#7A9CB8' }}>{m.label}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: '#E1EAF4' }}>{m.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: '#1e3450' }}>
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${m.pct}%` }}
                      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: i * 0.1 }}
                      style={{ background: m.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <p className="mb-4 text-sm font-bold" style={{ color: '#E1EAF4' }}>Perfil del asistente</p>
            <div className="space-y-3">
              {audienceData.map((a, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: '#7A9CB8' }}>{a.label}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: '#E1EAF4' }}>{a.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: '#1e3450' }}>
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${a.pct}%` }}
                      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.3 + i * 0.08 }}
                      style={{ background: a.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla resumen por evento */}
      <div className="mt-5 overflow-hidden rounded-2xl" style={{ border: '1px solid #1e3450', background: '#112035' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #1a2e45', background: '#182d47' }}>
          <p className="text-sm font-bold" style={{ color: '#E1EAF4' }}>Resumen por evento</p>
        </div>
        <div className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-2.5"
          style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', color: '#3A5470', borderBottom: '1px solid #1a2e45' }}>
          <span>Evento</span><span>Registros</span><span>Meta</span><span>Ingresos</span><span>Conversión</span>
        </div>
        {visible.length === 0 && (
          <div className="px-5 py-8 text-sm" style={{ color: '#7A9CB8' }}>Aún no hay eventos.</div>
        )}
        {visible.map((e, i) => {
          const pct = e.goals?.registros && e.registrations_count
            ? Math.round((e.registrations_count / e.goals.registros) * 100) : null;
          return (
            <div key={e.id} className="grid items-center px-5 py-3.5"
              style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderBottom: i < visible.length - 1 ? '1px solid #1a2e45' : 'none' }}>
              <p className="text-sm font-semibold truncate" style={{ color: '#E1EAF4' }}>{e.name}</p>
              <p className="text-sm tabular-nums font-semibold" style={{ color: '#E1EAF4' }}>
                {(e.registrations_count ?? 0).toLocaleString('es-CO')}
              </p>
              <p className="text-sm tabular-nums" style={{ color: '#7A9CB8' }}>
                {e.goals?.registros?.toLocaleString('es-CO') ?? '—'}
              </p>
              <p className="text-sm tabular-nums" style={{ color: e.revenue ? '#00C9A0' : '#3A5470' }}>
                {e.revenue ? formatCurrency(e.revenue) : '—'}
              </p>
              <p className="text-sm tabular-nums font-semibold"
                style={{ color: pct ? (pct >= 80 ? '#00C9A0' : pct >= 50 ? '#F59E0B' : '#F24463') : '#3A5470' }}>
                {pct !== null ? `${pct}%` : '—'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
