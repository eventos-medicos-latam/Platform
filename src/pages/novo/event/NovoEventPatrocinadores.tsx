import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BuildingIcon, DollarSignIcon, CheckCircleIcon, AlertCircleIcon,
  ChevronRightIcon, PlusIcon, StarIcon,
} from 'lucide-react';
import { KPICard } from '../../../components/novo/ui/KPICard';
import type { NovoEvent } from '../../../types/novo';

interface EventContext { event: NovoEvent }

type PlanTier = 'platino' | 'oro' | 'plata' | 'bronce' | 'aliado';
type SponsorStatus = 'activo' | 'pendiente_pago' | 'negociacion' | 'declinado';

interface Sponsor {
  id: string;
  company: string;
  contact: string;
  plan: PlanTier;
  amount: number;
  status: SponsorStatus;
  benefits_checked: number;
  benefits_total: number;
}

const PLAN_CONFIG: Record<PlanTier, { label: string; color: string; bg: string }> = {
  platino: { label: 'Platino', color: '#A78BFA', bg: 'rgba(167,139,250,.12)' },
  oro:     { label: 'Oro',     color: '#F59E0B', bg: 'rgba(245,158,11,.12)'  },
  plata:   { label: 'Plata',   color: '#7A9CB8', bg: 'rgba(122,156,184,.12)' },
  bronce:  { label: 'Bronce',  color: '#FF7043', bg: 'rgba(255,112,67,.12)'  },
  aliado:  { label: 'Aliado',  color: '#00C9A0', bg: 'rgba(0,201,160,.12)'   },
};

const STATUS_CONFIG: Record<SponsorStatus, { label: string; color: string; bg: string }> = {
  activo:          { label: 'Activo',       color: '#00C9A0', bg: 'rgba(0,201,160,.12)'   },
  pendiente_pago:  { label: 'Pago pend.',   color: '#F59E0B', bg: 'rgba(245,158,11,.12)'  },
  negociacion:     { label: 'Negociación',  color: '#5B8AF0', bg: 'rgba(91,138,240,.12)'  },
  declinado:       { label: 'Declinado',    color: '#F24463', bg: 'rgba(242,68,99,.12)'   },
};

const MOCK_SPONSORS: Sponsor[] = [
  { id: 'sp1', company: 'Roche Colombia',       contact: 'Felipe Restrepo',  plan: 'platino', amount: 18000000, status: 'activo',         benefits_checked: 8, benefits_total: 10 },
  { id: 'sp2', company: 'Nestlé Health Sci.',   contact: 'Ana Gutiérrez',    plan: 'oro',     amount: 12000000, status: 'pendiente_pago', benefits_checked: 5, benefits_total: 7  },
  { id: 'sp3', company: 'Pfizer Colombia',      contact: 'Marcos Velásquez', plan: 'oro',     amount: 12000000, status: 'activo',         benefits_checked: 7, benefits_total: 7  },
  { id: 'sp4', company: 'Tecnoquímicas',        contact: 'Gloria Suárez',    plan: 'plata',   amount: 7000000,  status: 'activo',         benefits_checked: 4, benefits_total: 5  },
  { id: 'sp5', company: 'Novartis Colombia',    contact: 'Sofía Castro',     plan: 'bronce',  amount: 4000000,  status: 'negociacion',    benefits_checked: 0, benefits_total: 3  },
  { id: 'sp6', company: 'Instituto de Salud',   contact: 'Dr. Rivera',       plan: 'aliado',  amount: 0,        status: 'activo',         benefits_checked: 2, benefits_total: 2  },
];

const fmt = (n: number) => n === 0 ? 'Aliado' : `$${(n / 1_000_000).toFixed(0)}M`;

export function NovoEventPatrocinadores() {
  const { event } = useOutletContext<EventContext>();
  const [selected, setSelected] = useState<Sponsor | null>(null);
  const [filter, setFilter] = useState<PlanTier | 'todos'>('todos');

  const activos   = MOCK_SPONSORS.filter(s => s.status === 'activo');
  const ingresos  = activos.reduce((sum, s) => sum + s.amount, 0);
  const pending   = MOCK_SPONSORS.filter(s => s.status === 'pendiente_pago').length;

  const filtered = filter === 'todos' ? MOCK_SPONSORS : MOCK_SPONSORS.filter(s => s.plan === filter);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Patrocinadores</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>Empresas · planes · beneficios · pagos</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{ background: 'rgba(0,201,160,.12)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
          <PlusIcon size={13} /> Agregar empresa
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Patrocinadores"  value={MOCK_SPONSORS.length.toString()} icon={BuildingIcon}    accent="#00C9A0" delay={0}    />
        <KPICard label="Activos"          value={activos.length.toString()}        icon={CheckCircleIcon} accent="#00C9A0" progress={Math.round((activos.length/MOCK_SPONSORS.length)*100)} delay={0.05} />
        <KPICard label="Ingresos patro."  value={`$${(ingresos/1_000_000).toFixed(0)}M`} icon={DollarSignIcon}  accent="#FF7043" delay={0.1}  />
        <KPICard label="Pagos pendientes" value={pending.toString()}               icon={AlertCircleIcon} accent="#F59E0B" delay={0.15} />
      </div>

      {/* Filtro plan */}
      <div className="mb-4 flex rounded-xl overflow-hidden" style={{ border: '1px solid #1e3450', width: 'fit-content' }}>
        {(['todos', 'platino', 'oro', 'plata', 'bronce', 'aliado'] as const).map(p => (
          <button key={p} onClick={() => setFilter(p)}
            className="px-3.5 py-2 text-xs font-semibold transition-colors"
            style={{
              background: filter === p ? '#182d47' : '#112035',
              color: filter === p ? '#E1EAF4' : '#2a4a6b',
              borderRight: '1px solid #1e3450',
            }}>
            {p === 'todos' ? 'Todos' : PLAN_CONFIG[p].label}
          </button>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Tabla */}
        <div className="flex-1 overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
          <div className="grid px-5 py-3" style={{ gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1fr', borderBottom: '1px solid #1e3450' }}>
            {['Empresa', 'Contacto', 'Plan', 'Monto', 'Beneficios', 'Estado'].map(h => (
              <p key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#2a4a6b' }}>{h}</p>
            ))}
          </div>
          {filtered.map((sp, i) => {
            const plan = PLAN_CONFIG[sp.plan];
            const st   = STATUS_CONFIG[sp.status];
            const isSelected = selected?.id === sp.id;
            const pctBenefits = Math.round((sp.benefits_checked / sp.benefits_total) * 100);
            return (
              <motion.div key={sp.id}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.04 }}
                onClick={() => setSelected(isSelected ? null : sp)}
                className="grid px-5 py-4 cursor-pointer transition-colors"
                style={{
                  gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1fr',
                  borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none',
                  background: isSelected ? '#182d47' : 'transparent',
                }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#182d4740')}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: plan.bg, border: `1px solid ${plan.color}30` }}>
                    <BuildingIcon size={14} style={{ color: plan.color }} />
                  </div>
                  <p className="text-sm font-semibold truncate" style={{ color: '#E1EAF4' }}>{sp.company}</p>
                </div>
                <p className="flex items-center text-xs" style={{ color: '#7A9CB8' }}>{sp.contact}</p>
                <div className="flex items-center">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ color: plan.color, background: plan.bg }}>
                    <StarIcon size={9} /> {plan.label}
                  </span>
                </div>
                <p className="flex items-center text-sm font-semibold tabular-nums" style={{ color: '#E1EAF4' }}>{fmt(sp.amount)}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#1e3450' }}>
                    <div className="h-full rounded-full" style={{ width: `${pctBenefits}%`, background: '#00C9A0' }} />
                  </div>
                  <span className="text-[10px] tabular-nums" style={{ color: '#3A5470' }}>{sp.benefits_checked}/{sp.benefits_total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ color: st.color, background: st.bg }}>{st.label}</span>
                  <ChevronRightIcon size={12} style={{ color: '#2a4a6b', marginLeft: 'auto' }} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Panel detalle */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 260 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden shrink-0 rounded-2xl"
              style={{ background: '#112035', border: '1px solid #1e3450' }}
            >
              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: PLAN_CONFIG[selected.plan].color }}>
                    {PLAN_CONFIG[selected.plan].label}
                  </span>
                </div>
                <p className="text-sm font-bold mb-1" style={{ color: '#E1EAF4' }}>{selected.company}</p>
                <p className="text-xs mb-5" style={{ color: '#7A9CB8' }}>{selected.contact}</p>

                <div className="rounded-xl p-4 mb-4" style={{ background: '#0d1829', border: '1px solid #1e3450' }}>
                  <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#3A5470' }}>Monto comprometido</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: '#E1EAF4' }}>{fmt(selected.amount)}</p>
                  <span className="inline-flex mt-2 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ color: STATUS_CONFIG[selected.status].color, background: STATUS_CONFIG[selected.status].bg }}>
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#3A5470' }}>Beneficios entregados</p>
                    <p className="text-xs font-bold" style={{ color: '#E1EAF4' }}>{selected.benefits_checked}/{selected.benefits_total}</p>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: '#1e3450' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.round((selected.benefits_checked/selected.benefits_total)*100)}%`, background: '#00C9A0' }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button className="rounded-xl py-2 text-xs font-semibold" style={{ background: '#182d47', color: '#7A9CB8', border: '1px solid #1e3450' }}>
                    Editar
                  </button>
                  <button className="rounded-xl py-2 text-xs font-semibold" style={{ background: 'rgba(0,201,160,.1)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
                    Beneficios
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
