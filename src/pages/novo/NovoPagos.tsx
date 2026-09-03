import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCardIcon, CheckCircleIcon, ClockIcon, AlertCircleIcon, PlusIcon } from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { MOCK_AGREEMENTS } from '../../lib/novo/mock';
import { formatCurrency, formatDate } from '../../lib/novo/events';

// ── Mock schedule de recaudo ────────────────────────────────────────────────
const MOCK_SCHEDULE = [
  {
    id: 'cs-001', agreement_id: 'agr-001',
    company: 'Laboratorios Roche Colombia', event: 'La Eterna Primavera',
    description: 'Anticipo 50%', amount: 9000000, currency: 'COP',
    due_date: '2025-07-14', paid_at: '2025-07-13',
    status: 'pagado' as const,
  },
  {
    id: 'cs-002', agreement_id: 'agr-001',
    company: 'Laboratorios Roche Colombia', event: 'La Eterna Primavera',
    description: 'Saldo 50%', amount: 9000000, currency: 'COP',
    due_date: '2025-10-31', paid_at: null,
    status: 'proximo' as const,
  },
  {
    id: 'cs-003', agreement_id: 'agr-002',
    company: 'Nestlé Health Science', event: 'La Eterna Primavera',
    description: 'Cuota única 100%', amount: 8500000, currency: 'COP',
    due_date: '2025-09-10', paid_at: null,
    status: 'vencido' as const,
  },
  {
    id: 'cs-004', agreement_id: 'agr-003',
    company: 'Abbott Laboratories', event: 'Hormobiota VI',
    description: 'Anticipo 70%', amount: 8400000, currency: 'COP',
    due_date: '2025-08-01', paid_at: '2025-07-29',
    status: 'pagado' as const,
  },
  {
    id: 'cs-005', agreement_id: 'agr-003',
    company: 'Abbott Laboratories', event: 'Hormobiota VI',
    description: 'Saldo 30%', amount: 3600000, currency: 'COP',
    due_date: '2025-10-05', paid_at: null,
    status: 'proximo' as const,
  },
];

type PayStatus = 'pagado' | 'proximo' | 'vencido';

const STATUS_CONFIG: Record<PayStatus, { color: string; bg: string; border: string; label: string; icon: React.ReactNode }> = {
  pagado:  {
    color: '#00C9A0', bg: 'rgba(0,201,160,.12)', border: 'rgba(0,201,160,.25)',
    label: '✓ Pagado',
    icon: <CheckCircleIcon size={13} />,
  },
  proximo: {
    color: '#5B8AF0', bg: 'rgba(91,138,240,.12)', border: 'rgba(91,138,240,.25)',
    label: 'Próximo',
    icon: <ClockIcon size={13} />,
  },
  vencido: {
    color: '#F24463', bg: 'rgba(242,68,99,.12)', border: 'rgba(242,68,99,.25)',
    label: '⚠ Vencido',
    icon: <AlertCircleIcon size={13} />,
  },
};

const FILTERS = ['Todos', 'Pagados', 'Próximos', 'Vencidos'] as const;
type Filter = typeof FILTERS[number];

export function NovoPagos() {
  const [filter, setFilter] = useState<Filter>('Todos');

  const filtered = MOCK_SCHEDULE.filter(s => {
    if (filter === 'Todos')    return true;
    if (filter === 'Pagados')  return s.status === 'pagado';
    if (filter === 'Próximos') return s.status === 'proximo';
    if (filter === 'Vencidos') return s.status === 'vencido';
    return true;
  });

  const totalAcordado  = MOCK_SCHEDULE.reduce((s, c) => s + c.amount, 0);
  const totalRecaudado = MOCK_SCHEDULE.filter(c => c.status === 'pagado').reduce((s, c) => s + c.amount, 0);
  const totalPendiente = totalAcordado - totalRecaudado;
  const pctRecaudado   = Math.round((totalRecaudado / totalAcordado) * 100);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>
            Recaudo flexible
          </p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>
            Facturación y Pagos
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#7A9CB8' }}>
            Acuerdos · calendarios de recaudo · Wompi + manual
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}
        >
          <PlusIcon size={15} strokeWidth={2.5} /> Registrar pago
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <KPICard
          label="Total acordado" value={formatCurrency(totalAcordado)}
          sub="todos los acuerdos activos"
          icon={CreditCardIcon} accent="#FF7043" delay={0}
        />
        <KPICard
          label="Recaudado" value={formatCurrency(totalRecaudado)}
          sub={`${pctRecaudado}% del total`}
          icon={CheckCircleIcon} accent="#00C9A0" progress={pctRecaudado} delay={0.05}
        />
        <KPICard
          label="Por recaudar" value={formatCurrency(totalPendiente)}
          sub="1 cuota vencida"
          icon={ClockIcon} accent="#F59E0B" delay={0.1}
        />
      </div>

      {/* Filtros */}
      <div className="mb-4">
        <div
          className="inline-flex items-center gap-0.5 p-1 rounded-xl"
          style={{ background: '#112035', border: '1px solid #1e3450' }}
        >
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
              style={{
                background: filter === f ? '#1e3450' : 'transparent',
                color:      filter === f ? '#E1EAF4'  : '#3A5470',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de cuotas */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ border: '1px solid #1e3450', background: '#112035' }}
      >
        <div
          className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-3"
          style={{
            gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr',
            color: '#3A5470',
            borderBottom: '1px solid #1a2e45',
            background: '#182d47',
          }}
        >
          <span>Empresa</span>
          <span>Evento</span>
          <span>Cuota</span>
          <span>Monto</span>
          <span>Vencimiento</span>
          <span>Estado</span>
        </div>

        {filtered.map((item, i) => {
          const st = STATUS_CONFIG[item.status];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1], delay: i * 0.04 }}
              className="grid items-center px-5 py-4 transition-colors duration-150 cursor-pointer"
              style={{
                gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr',
                borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#182d47')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="min-w-0 pr-3">
                <p className="truncate text-sm font-semibold" style={{ color: '#E1EAF4' }}>
                  {item.company}
                </p>
                <p className="text-xs" style={{ color: '#3A5470' }}>
                  Acuerdo #{item.agreement_id}
                </p>
              </div>

              <div className="min-w-0 pr-2">
                <p className="truncate text-sm" style={{ color: '#7A9CB8' }}>{item.event}</p>
              </div>

              <div>
                <p className="text-sm" style={{ color: '#7A9CB8' }}>{item.description}</p>
              </div>

              <div>
                <p className="text-sm font-semibold tabular-nums" style={{ color: '#E1EAF4' }}>
                  {formatCurrency(item.amount)}
                </p>
              </div>

              <div>
                <p
                  className="text-sm tabular-nums"
                  style={{ color: item.status === 'vencido' ? '#F24463' : '#7A9CB8' }}
                >
                  {formatDate(item.due_date)}
                </p>
                {item.paid_at && (
                  <p className="text-xs" style={{ color: '#3A5470' }}>
                    Pagado {formatDate(item.paid_at)}
                  </p>
                )}
              </div>

              <div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border"
                  style={{ color: st.color, background: st.bg, borderColor: st.border }}
                >
                  {st.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
