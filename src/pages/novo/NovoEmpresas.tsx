import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  SearchIcon, PlusIcon, BuildingIcon,
  TrendingUpIcon, FileTextIcon,
} from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { AgreementStatusPill } from '../../components/novo/ui/StatusPill';
import { MOCK_AGREEMENTS } from '../../lib/novo/mock';
import { formatCurrency } from '../../lib/novo/events';

// ── Mock companies ──────────────────────────────────────────────────────────
const MOCK_COMPANIES = [
  {
    id: 'co-001', name: 'Laboratorios Roche Colombia', sector: 'Farmacéutica',
    city: 'Bogotá', website: 'roche.com', contacts: 8, events: 3,
    total_deal: 18000000, status: 'cerrado' as const,
    emoji: '🔬',
  },
  {
    id: 'co-002', name: 'Nestlé Health Science', sector: 'Nutrición médica',
    city: 'Cali', website: 'nestle.com', contacts: 4, events: 1,
    total_deal: 8500000, status: 'aprobado' as const,
    emoji: '🥛',
  },
  {
    id: 'co-003', name: 'Abbott Laboratories', sector: 'Diagnóstico',
    city: 'Bogotá', website: 'abbott.com', contacts: 5, events: 2,
    total_deal: 12000000, status: 'cerrado' as const,
    emoji: '💊',
  },
  {
    id: 'co-004', name: 'Pfizer Colombia', sector: 'Farmacéutica',
    city: 'Bogotá', website: 'pfizer.com', contacts: 3, events: 2,
    total_deal: null, status: 'pendiente' as const,
    emoji: '🧪',
  },
  {
    id: 'co-005', name: 'Nutresa Salud', sector: 'Alimentación',
    city: 'Medellín', website: 'nutresa.com', contacts: 2, events: 1,
    total_deal: 5000000, status: 'cerrado' as const,
    emoji: '🌿',
  },
  {
    id: 'co-006', name: 'MSD Colombia', sector: 'Farmacéutica',
    city: 'Bogotá', website: 'msd.com', contacts: 4, events: 0,
    total_deal: null, status: 'pendiente' as const,
    emoji: '🏥',
  },
];

type AgreementStatus = 'cerrado' | 'aprobado' | 'pendiente';

const STATUS_STYLES: Record<AgreementStatus, { color: string; bg: string; label: string }> = {
  cerrado:  { color: '#00C9A0', bg: 'rgba(0,201,160,.12)',   label: 'Cerrado'      },
  aprobado: { color: '#F59E0B', bg: 'rgba(245,158,11,.12)',  label: 'Aprobado'     },
  pendiente:{ color: '#5B8AF0', bg: 'rgba(91,138,240,.12)',  label: 'En negociación'},
};

export function NovoEmpresas() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_COMPANIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.sector.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase()),
  );

  const totalAcordado = MOCK_COMPANIES.reduce((s, c) => s + (c.total_deal ?? 0), 0);
  const cerradas = MOCK_COMPANIES.filter(c => c.status === 'cerrado').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>
            CRM global
          </p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>
            Empresas
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#7A9CB8' }}>
            {MOCK_COMPANIES.length} empresas · acuerdos, cartera y participaciones
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}
        >
          <PlusIcon size={15} strokeWidth={2.5} /> Nueva empresa
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <KPICard label="Total empresas" value={MOCK_COMPANIES.length.toString()}
          sub="en la plataforma" icon={BuildingIcon} delay={0} />
        <KPICard label="Acuerdos cerrados" value={cerradas.toString()}
          sub={`de ${MOCK_COMPANIES.length} empresas`}
          icon={FileTextIcon} accent="#A78BFA" delay={0.05} />
        <KPICard label="Total acordado" value={formatCurrency(totalAcordado)}
          sub="acumulado todos los eventos"
          icon={TrendingUpIcon} accent="#FF7043" delay={0.1} />
      </div>

      {/* Búsqueda */}
      <div className="mb-4">
        <div
          className="relative inline-flex items-center"
          style={{ background: '#112035', border: '1px solid #1e3450', borderRadius: 12 }}
        >
          <SearchIcon size={14} className="absolute left-3" style={{ color: '#3A5470' }} />
          <input
            type="text"
            placeholder="Buscar empresa, sector o ciudad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent pl-9 pr-4 py-2 text-sm outline-none w-72"
            style={{ color: '#E1EAF4' }}
          />
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
            gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 1fr',
            color: '#3A5470',
            borderBottom: '1px solid #1a2e45',
            background: '#182d47',
          }}
        >
          <span>Empresa</span>
          <span>Sector</span>
          <span>Ciudad</span>
          <span>Eventos</span>
          <span>Acuerdo total</span>
          <span>Estado</span>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: '#3A5470' }}>
            <p className="text-sm">Sin resultados</p>
          </div>
        )}

        {filtered.map((co, i) => {
          const st = STATUS_STYLES[co.status];
          return (
            <motion.div
              key={co.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1], delay: i * 0.04 }}
              className="group grid items-center px-5 py-4 transition-colors duration-150 cursor-pointer"
              style={{
                gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 1fr',
                borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#182d47')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Empresa */}
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ background: '#182d47', border: '1px solid #1e3450' }}
                >
                  {co.emoji}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: '#E1EAF4' }}>
                    {co.name}
                  </p>
                  <p className="text-xs" style={{ color: '#3A5470' }}>
                    {co.website} · {co.contacts} contactos
                  </p>
                </div>
              </div>

              {/* Sector */}
              <div>
                <p className="text-sm" style={{ color: '#7A9CB8' }}>{co.sector}</p>
              </div>

              {/* Ciudad */}
              <div>
                <p className="text-sm" style={{ color: '#7A9CB8' }}>{co.city}</p>
              </div>

              {/* Eventos */}
              <div>
                <p className="text-sm font-semibold tabular-nums" style={{ color: '#E1EAF4' }}>
                  {co.events}
                </p>
              </div>

              {/* Acuerdo */}
              <div>
                <p className="text-sm font-semibold tabular-nums"
                  style={{ color: co.total_deal ? '#00C9A0' : '#3A5470' }}>
                  {co.total_deal ? formatCurrency(co.total_deal) : '—'}
                </p>
              </div>

              {/* Estado */}
              <div>
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{ color: st.color, background: st.bg }}
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
