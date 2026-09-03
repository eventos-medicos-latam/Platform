import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutPanelLeftIcon, BuildingIcon, CheckCircleIcon,
  PlusIcon, GridIcon, LayoutListIcon,
} from 'lucide-react';
import { KPICard } from '../../../components/novo/ui/KPICard';
import type { NovoEvent } from '../../../types/novo';

interface EventContext { event: NovoEvent }

type StandStatus = 'ocupado' | 'reservado' | 'disponible';
type StandSize   = '3x3' | '3x6' | '6x6';

interface Stand {
  id: string;
  code: string;
  size: StandSize;
  company?: string;
  status: StandStatus;
  price: number;
  zone: string;
}

const STATUS_CONFIG: Record<StandStatus, { label: string; color: string; bg: string; border: string }> = {
  ocupado:    { label: 'Ocupado',    color: '#E1EAF4', bg: '#1a4a7a',              border: '#2d6fae'  },
  reservado:  { label: 'Reservado',  color: '#F59E0B', bg: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.4)' },
  disponible: { label: 'Disponible', color: '#00C9A0', bg: 'rgba(0,201,160,.08)',  border: 'rgba(0,201,160,.25)' },
};

const MOCK_STANDS: Stand[] = [
  { id: 'st01', code: 'A-01', size: '6x6', company: 'Roche Colombia',     status: 'ocupado',    price: 8000000, zone: 'Zona A' },
  { id: 'st02', code: 'A-02', size: '3x6', company: 'Nestlé Health',      status: 'ocupado',    price: 5000000, zone: 'Zona A' },
  { id: 'st03', code: 'A-03', size: '3x6', company: 'Pfizer Colombia',    status: 'reservado',  price: 5000000, zone: 'Zona A' },
  { id: 'st04', code: 'A-04', size: '3x3',                                 status: 'disponible', price: 3000000, zone: 'Zona A' },
  { id: 'st05', code: 'A-05', size: '3x3',                                 status: 'disponible', price: 3000000, zone: 'Zona A' },
  { id: 'st06', code: 'B-01', size: '3x6', company: 'Tecnoquímicas',      status: 'ocupado',    price: 5000000, zone: 'Zona B' },
  { id: 'st07', code: 'B-02', size: '3x3', company: 'Novartis Colombia',  status: 'reservado',  price: 3000000, zone: 'Zona B' },
  { id: 'st08', code: 'B-03', size: '3x3',                                 status: 'disponible', price: 3000000, zone: 'Zona B' },
  { id: 'st09', code: 'B-04', size: '3x3',                                 status: 'disponible', price: 3000000, zone: 'Zona B' },
  { id: 'st10', code: 'B-05', size: '6x6', company: 'Instituto Salud',    status: 'ocupado',    price: 8000000, zone: 'Zona B' },
  { id: 'st11', code: 'C-01', size: '3x3',                                 status: 'disponible', price: 3000000, zone: 'Zona C' },
  { id: 'st12', code: 'C-02', size: '3x3',                                 status: 'disponible', price: 3000000, zone: 'Zona C' },
];

const SIZE_W: Record<StandSize, number> = { '3x3': 1, '3x6': 1.5, '6x6': 2 };

export function NovoEventStands() {
  const { event } = useOutletContext<EventContext>();
  const [selected, setSelected] = useState<Stand | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<StandStatus | 'todos'>('todos');

  const counts = {
    total:      MOCK_STANDS.length,
    ocupado:    MOCK_STANDS.filter(s => s.status === 'ocupado').length,
    reservado:  MOCK_STANDS.filter(s => s.status === 'reservado').length,
    disponible: MOCK_STANDS.filter(s => s.status === 'disponible').length,
  };
  const ingresos = MOCK_STANDS.filter(s => s.status === 'ocupado').reduce((s, st) => s + st.price, 0);

  const filtered = filter === 'todos' ? MOCK_STANDS : MOCK_STANDS.filter(s => s.status === filter);
  const zones = [...new Set(filtered.map(s => s.zone))];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Stands</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>Inventario · disponibilidad · asignaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #1e3450' }}>
            {(['grid', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className="px-3 py-2 transition-colors"
                style={{ background: view === v ? '#182d47' : '#112035' }}>
                {v === 'grid'
                  ? <GridIcon       size={14} style={{ color: view === v ? '#E1EAF4' : '#2a4a6b' }} />
                  : <LayoutListIcon size={14} style={{ color: view === v ? '#E1EAF4' : '#2a4a6b' }} />}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
            style={{ background: 'rgba(0,201,160,.12)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
            <PlusIcon size={13} /> Agregar stand
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Total stands"    value={counts.total.toString()}      icon={LayoutPanelLeftIcon} accent="#7A9CB8" delay={0}    />
        <KPICard label="Ocupados"         value={counts.ocupado.toString()}    icon={BuildingIcon}         accent="#5B8AF0" progress={Math.round((counts.ocupado/counts.total)*100)} delay={0.05} />
        <KPICard label="Disponibles"      value={counts.disponible.toString()} icon={CheckCircleIcon}     accent="#00C9A0" delay={0.1}  />
        <KPICard label="Ingresos stands"  value={`$${(ingresos/1_000_000).toFixed(0)}M`} icon={LayoutPanelLeftIcon} accent="#FF7043" delay={0.15} />
      </div>

      {/* Filtro */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #1e3450' }}>
          {(['todos', 'disponible', 'reservado', 'ocupado'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3.5 py-2 text-xs font-semibold transition-colors"
              style={{
                background: filter === f ? '#182d47' : '#112035',
                color: filter === f ? '#E1EAF4' : '#2a4a6b',
                borderRight: '1px solid #1e3450',
              }}>
              {f === 'todos' ? 'Todos' : STATUS_CONFIG[f].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-5">
        <div className="flex-1">
          {view === 'grid' ? (
            /* Plano por zonas */
            zones.map(zone => (
              <div key={zone} className="mb-6">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3A5470' }}>{zone}</p>
                <div className="flex flex-wrap gap-3">
                  {filtered.filter(s => s.zone === zone).map((stand, i) => {
                    const cfg = STATUS_CONFIG[stand.status];
                    const isSelected = selected?.id === stand.id;
                    const w = SIZE_W[stand.size];
                    return (
                      <motion.button key={stand.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15, delay: i * 0.03 }}
                        onClick={() => setSelected(isSelected ? null : stand)}
                        className="rounded-xl p-3 text-left transition-all"
                        style={{
                          width: `${w * 100 + (w - 1) * 12}px`,
                          minHeight: 80,
                          background: isSelected ? cfg.bg : `${cfg.bg}80`,
                          border: `2px solid ${isSelected ? cfg.border : cfg.border + '80'}`,
                        }}
                      >
                        <p className="text-[10px] font-bold" style={{ color: cfg.color }}>{stand.code}</p>
                        <p className="text-[9px] mt-0.5" style={{ color: '#3A5470' }}>{stand.size}m</p>
                        {stand.company && (
                          <p className="text-[10px] font-semibold mt-1 leading-tight" style={{ color: '#7A9CB8' }}>{stand.company}</p>
                        )}
                        {!stand.company && (
                          <p className="text-[9px] mt-1" style={{ color: '#2a4a6b' }}>Disponible</p>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            /* Lista */
            <div className="overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
              <div className="grid px-5 py-3" style={{ gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr', borderBottom: '1px solid #1e3450' }}>
                {['Código', 'Tamaño', 'Empresa', 'Precio', 'Estado'].map(h => (
                  <p key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#2a4a6b' }}>{h}</p>
                ))}
              </div>
              {filtered.map((stand, i) => {
                const cfg = STATUS_CONFIG[stand.status];
                const isSelected = selected?.id === stand.id;
                return (
                  <div key={stand.id}
                    onClick={() => setSelected(isSelected ? null : stand)}
                    className="grid px-5 py-3.5 cursor-pointer transition-colors"
                    style={{
                      gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr',
                      borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none',
                      background: isSelected ? '#182d47' : 'transparent',
                    }}
                    onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#182d4740')}
                    onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
                  >
                    <p className="flex items-center text-sm font-bold" style={{ color: '#E1EAF4' }}>{stand.code}</p>
                    <p className="flex items-center text-xs" style={{ color: '#7A9CB8' }}>{stand.size}m</p>
                    <p className="flex items-center text-sm" style={{ color: stand.company ? '#E1EAF4' : '#2a4a6b' }}>{stand.company ?? '—'}</p>
                    <p className="flex items-center text-sm tabular-nums" style={{ color: '#E1EAF4' }}>${(stand.price/1_000_000).toFixed(0)}M</p>
                    <span className="flex items-center">
                      <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel detalle */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 240 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden shrink-0 rounded-2xl"
              style={{ background: '#112035', border: '1px solid #1e3450' }}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-lg font-bold" style={{ color: '#E1EAF4' }}>{selected.code}</p>
                  <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ color: STATUS_CONFIG[selected.status].color, background: STATUS_CONFIG[selected.status].bg }}>
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                </div>

                {[
                  { label: 'Tamaño',   value: `${selected.size} m` },
                  { label: 'Zona',     value: selected.zone },
                  { label: 'Precio',   value: `$${(selected.price/1_000_000).toFixed(0)}M` },
                  { label: 'Empresa',  value: selected.company ?? 'Sin asignar' },
                ].map((item, i) => (
                  <div key={i} className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: '#3A5470' }}>{item.label}</p>
                    <p className="text-xs font-semibold" style={{ color: '#7A9CB8' }}>{item.value}</p>
                  </div>
                ))}

                <div className="mt-4 grid grid-cols-1 gap-2">
                  {selected.status === 'disponible' ? (
                    <button className="rounded-xl py-2.5 text-xs font-semibold"
                      style={{ background: 'rgba(0,201,160,.12)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.25)' }}>
                      Asignar empresa
                    </button>
                  ) : (
                    <button className="rounded-xl py-2.5 text-xs font-semibold"
                      style={{ background: '#182d47', color: '#7A9CB8', border: '1px solid #1e3450' }}>
                      Editar asignación
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
