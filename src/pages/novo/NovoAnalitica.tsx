import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUpIcon, UsersIcon, TicketIcon, StarIcon } from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { MOCK_EVENTS } from '../../lib/novo/mock';
import { formatCurrency } from '../../lib/novo/events';

const BAR_DATA = MOCK_EVENTS.map(e => ({
  name: e.name.split(' ').slice(0, 2).join(' '),
  registros: e.registrations_count ?? 0,
  meta: e.goals?.registros ?? 0,
  revenue: e.revenue ?? 0,
}));

const MAX_REG = Math.max(...BAR_DATA.map(d => Math.max(d.registros, d.meta)));

const MODALITY_DATA = [
  { label: 'Presencial', pct: 58, color: '#00C9A0' },
  { label: 'Híbrido',    pct: 29, color: '#5B8AF0'  },
  { label: 'Virtual',    pct: 13, color: '#A78BFA'  },
];

const AUDIENCE_DATA = [
  { label: 'Médicos especialistas', pct: 64, color: '#00C9A0' },
  { label: 'Médicos generales',     pct: 22, color: '#5B8AF0'  },
  { label: 'Enfermería',            pct: 8,  color: '#F59E0B'  },
  { label: 'Público general',       pct: 6,  color: '#3A5470'  },
];

type Period = '2025' | 'Hormobiota VI' | 'La Eterna Primavera';
const PERIODS: Period[] = ['2025', 'Hormobiota VI', 'La Eterna Primavera'];

export function NovoAnalitica() {
  const [period, setPeriod] = useState<Period>('2025');

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
        <div className="flex gap-0.5 p-1 rounded-xl" style={{ background: '#0E1520', border: '1px solid #1E2D45' }}>
          {PERIODS.map(p => (
            <button key={p} type="button" onClick={() => setPeriod(p)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
              style={{ background: period === p ? '#1E2D45' : 'transparent', color: period === p ? '#E1EAF4' : '#3A5470' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs top */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Tasa conversión" value="34%" sub="visitantes → registro"
          icon={TrendingUpIcon} accent="#00C9A0" delay={0} />
        <KPICard label="Ticket promedio" value="$174K" sub="todos los eventos"
          icon={TicketIcon} accent="#FF7043" delay={0.05} />
        <KPICard label="Asistencia" value="91%" sub="de inscritos · presencial"
          icon={UsersIcon} accent="#5B8AF0" delay={0.1}
          progress={91} />
        <KPICard label="NPS estimado" value="+72" sub="encuestas post-evento"
          icon={StarIcon} accent="#A78BFA" delay={0.15} />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Chart de barras — registros vs meta */}
        <div className="rounded-2xl p-5" style={{ background: '#0E1520', border: '1px solid #1E2D45' }}>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: '#E1EAF4' }}>Registros vs. Meta</p>
            <div className="flex items-center gap-3 text-[10px]" style={{ color: '#3A5470' }}>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#00C9A0' }} /> Real
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#1E2D45' }} /> Meta
              </span>
            </div>
          </div>
          <div className="flex items-end gap-3" style={{ height: 130 }}>
            {BAR_DATA.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative flex items-end gap-0.5" style={{ height: 100 }}>
                  {/* Barra meta */}
                  <div className="flex-1 rounded-t-sm" style={{ height: `${(d.meta / MAX_REG) * 100}%`, background: '#1E2D45' }} />
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
          <div className="rounded-2xl p-5" style={{ background: '#0E1520', border: '1px solid #1E2D45' }}>
            <p className="mb-4 text-sm font-bold" style={{ color: '#E1EAF4' }}>Por modalidad</p>
            <div className="space-y-3">
              {MODALITY_DATA.map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: '#7A9CB8' }}>{m.label}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: '#E1EAF4' }}>{m.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: '#1E2D45' }}>
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

          <div className="rounded-2xl p-5" style={{ background: '#0E1520', border: '1px solid #1E2D45' }}>
            <p className="mb-4 text-sm font-bold" style={{ color: '#E1EAF4' }}>Perfil del asistente</p>
            <div className="space-y-3">
              {AUDIENCE_DATA.map((a, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: '#7A9CB8' }}>{a.label}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: '#E1EAF4' }}>{a.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: '#1E2D45' }}>
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
      <div className="mt-5 overflow-hidden rounded-2xl" style={{ border: '1px solid #1E2D45', background: '#0E1520' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #152238', background: '#162031' }}>
          <p className="text-sm font-bold" style={{ color: '#E1EAF4' }}>Resumen por evento</p>
        </div>
        <div className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-2.5"
          style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', color: '#3A5470', borderBottom: '1px solid #152238' }}>
          <span>Evento</span><span>Registros</span><span>Meta</span><span>Ingresos</span><span>Conversión</span>
        </div>
        {MOCK_EVENTS.map((e, i) => {
          const pct = e.goals?.registros && e.registrations_count
            ? Math.round((e.registrations_count / e.goals.registros) * 100) : null;
          return (
            <div key={e.id} className="grid items-center px-5 py-3.5"
              style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderBottom: i < MOCK_EVENTS.length - 1 ? '1px solid #152238' : 'none' }}>
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
