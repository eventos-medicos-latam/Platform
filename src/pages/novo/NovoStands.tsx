import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, LayoutIcon, CheckCircleIcon, ClockIcon } from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { formatCurrency } from '../../lib/novo/events';

const MOCK_STAND_TYPES = [
  { id: 'st-001', name: 'Estándar 3×2', area: '6 m²', price: 4200000, description: 'Mesa + 2 sillas + luz + panel trasero', emoji: '🏪' },
  { id: 'st-002', name: 'Premium 4×3',  area: '12 m²', price: 8500000, description: 'TV 55" + sofá + mostrador + luz focal',  emoji: '🏬' },
  { id: 'st-003', name: 'Corporativo 6×4', area: '24 m²', price: 18000000, description: 'Diseño custom + almacén + sala privada', emoji: '🏢' },
  { id: 'st-004', name: 'Micro 2×2', area: '4 m²', price: 2200000, description: 'Mesa + 1 silla + roll-up', emoji: '🛖' },
];

const MOCK_INVENTORY = [
  { id: 'su-001', code: 'A-01', type: 'Estándar 3×2', event: 'La Eterna Primavera', company: 'Roche Colombia',  status: 'vendido'    as const, price: 4200000 },
  { id: 'su-002', code: 'A-02', type: 'Estándar 3×2', event: 'La Eterna Primavera', company: 'Nestlé Health',   status: 'vendido'    as const, price: 4200000 },
  { id: 'su-003', code: 'A-03', type: 'Estándar 3×2', event: 'La Eterna Primavera', company: null,              status: 'disponible' as const, price: 4200000 },
  { id: 'su-004', code: 'B-01', type: 'Premium 4×3',  event: 'La Eterna Primavera', company: 'Abbott',          status: 'reservado'  as const, price: 8500000 },
  { id: 'su-005', code: 'B-02', type: 'Premium 4×3',  event: 'La Eterna Primavera', company: null,              status: 'disponible' as const, price: 8500000 },
  { id: 'su-006', code: 'C-01', type: 'Corporativo 6×4', event: 'La Eterna Primavera', company: null,           status: 'disponible' as const, price: 18000000 },
  { id: 'su-007', code: 'HB-A1', type: 'Estándar 3×2', event: 'Hormobiota VI',      company: 'Roche Colombia',  status: 'vendido'    as const, price: 4200000 },
  { id: 'su-008', code: 'HB-B1', type: 'Premium 4×3',  event: 'Hormobiota VI',      company: 'MSD Colombia',    status: 'vendido'    as const, price: 8500000 },
];

type StandStatus = 'vendido' | 'reservado' | 'disponible';

const STATUS_CONFIG: Record<StandStatus, { color: string; bg: string; label: string }> = {
  vendido:    { color: '#00C9A0', bg: 'rgba(0,201,160,.12)',   label: 'Vendido'    },
  reservado:  { color: '#F59E0B', bg: 'rgba(245,158,11,.12)',  label: 'Reservado'  },
  disponible: { color: '#3A5470', bg: 'rgba(58,84,112,.15)',   label: 'Disponible' },
};

const EVENT_FILTERS = ['Todos', 'La Eterna Primavera', 'Hormobiota VI'] as const;
type EventFilter = typeof EVENT_FILTERS[number];

export function NovoStands() {
  const [eventFilter, setEventFilter] = useState<EventFilter>('Todos');

  const filteredInv = MOCK_INVENTORY.filter(s =>
    eventFilter === 'Todos' || s.event === eventFilter,
  );

  const vendidos    = MOCK_INVENTORY.filter(s => s.status === 'vendido').length;
  const reservados  = MOCK_INVENTORY.filter(s => s.status === 'reservado').length;
  const disponibles = MOCK_INVENTORY.filter(s => s.status === 'disponible').length;
  const pctOcupado  = Math.round(((vendidos + reservados) / MOCK_INVENTORY.length) * 100);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>
            Inventario por evento
          </p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>
            Stands
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#7A9CB8' }}>
            Tipos globales → inventario por evento → ubicación en plano
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}
        >
          <PlusIcon size={15} strokeWidth={2.5} /> Nuevo tipo
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <KPICard label="Stands vendidos" value={vendidos.toString()} sub={`${pctOcupado}% del inventario`}
          icon={CheckCircleIcon} progress={pctOcupado} delay={0} />
        <KPICard label="Reservados" value={reservados.toString()} sub="pendientes de pago"
          icon={ClockIcon} accent="#F59E0B" delay={0.05} />
        <KPICard label="Disponibles" value={disponibles.toString()} sub="en todos los eventos"
          icon={LayoutIcon} accent="#5B8AF0" delay={0.1} />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Tipos */}
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3A5470' }}>
            Tipos de stand — catálogo global
          </p>
          <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid #1e3450', background: '#112035' }}>
            <div className="grid text-[10px] font-bold uppercase tracking-widest px-4 py-3"
              style={{ gridTemplateColumns: 'auto 1fr 1fr', color: '#3A5470', borderBottom: '1px solid #1a2e45', background: '#182d47' }}>
              <span className="w-8" />
              <span>Tipo</span>
              <span>Precio</span>
            </div>
            {MOCK_STAND_TYPES.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="grid items-center px-4 py-3.5 transition-colors cursor-pointer"
                style={{ gridTemplateColumns: 'auto 1fr 1fr', borderBottom: i < MOCK_STAND_TYPES.length - 1 ? '1px solid #1a2e45' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#182d47')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-base mr-3"
                  style={{ background: '#182d47', border: '1px solid #1e3450' }}>
                  {t.emoji}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#E1EAF4' }}>{t.name} · {t.area}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#3A5470' }}>{t.description}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold tabular-nums" style={{ color: '#E1EAF4' }}>
                    {formatCurrency(t.price)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Inventario */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3A5470' }}>
              Inventario
            </p>
            <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: '#112035', border: '1px solid #1e3450' }}>
              {EVENT_FILTERS.map(f => (
                <button key={f} type="button" onClick={() => setEventFilter(f)}
                  className="rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all"
                  style={{ background: eventFilter === f ? '#1e3450' : 'transparent', color: eventFilter === f ? '#E1EAF4' : '#3A5470' }}>
                  {f === 'Todos' ? 'Todos' : f === 'La Eterna Primavera' ? 'EP 2025' : 'HB VI'}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid #1e3450', background: '#112035' }}>
            <div className="grid text-[10px] font-bold uppercase tracking-widest px-4 py-3"
              style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', color: '#3A5470', borderBottom: '1px solid #1a2e45', background: '#182d47' }}>
              <span>Código</span><span>Tipo</span><span>Empresa</span><span>Estado</span>
            </div>
            {filteredInv.map((s, i) => {
              const st = STATUS_CONFIG[s.status];
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="grid items-center px-4 py-3 transition-colors cursor-pointer"
                  style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', borderBottom: i < filteredInv.length - 1 ? '1px solid #1a2e45' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#182d47')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <p className="text-sm font-bold tabular-nums" style={{ color: '#E1EAF4' }}>{s.code}</p>
                  <p className="text-xs" style={{ color: '#7A9CB8' }}>{s.type}</p>
                  <p className="truncate text-xs" style={{ color: s.company ? '#7A9CB8' : '#3A5470' }}>
                    {s.company ?? '—'}
                  </p>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ color: st.color, background: st.bg }}>
                    {st.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
