import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutPanelLeftIcon, BuildingIcon, CheckCircleIcon,
  PlusIcon, GridIcon, LayoutListIcon,
} from 'lucide-react';
import { KPICard } from '../../../components/novo/ui/KPICard';
import { RowActions } from '../../../components/novo/ui/RowActions';
import {
  NovoModal, ModalBtn,
  FormField, FormInput, FormSelect, FormSection,
} from '../../../components/novo/ui/NovoModal';
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
  notas?: string;
}

const STATUS_CONFIG: Record<StandStatus, { label: string; color: string; bg: string; border: string }> = {
  ocupado:    { label: 'Ocupado',    color: '#E1EAF4', bg: '#1a4a7a',              border: '#2d6fae'  },
  reservado:  { label: 'Reservado',  color: '#F59E0B', bg: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.4)' },
  disponible: { label: 'Disponible', color: '#00C9A0', bg: 'rgba(0,201,160,.08)',  border: 'rgba(0,201,160,.25)' },
};

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }));
const SIZE_OPTIONS = [
  { value: '3x3', label: '3×3 m (pequeño)' },
  { value: '3x6', label: '3×6 m (mediano)' },
  { value: '6x6', label: '6×6 m (grande)'  },
];

const INIT_STANDS: Stand[] = [
  { id: 'st01', code: 'A-01', size: '6x6', company: 'Roche Colombia',    status: 'ocupado',    price: 8000000, zone: 'Zona A' },
  { id: 'st02', code: 'A-02', size: '3x6', company: 'Nestlé Health',     status: 'ocupado',    price: 5000000, zone: 'Zona A' },
  { id: 'st03', code: 'A-03', size: '3x6', company: 'Pfizer Colombia',   status: 'reservado',  price: 5000000, zone: 'Zona A' },
  { id: 'st04', code: 'A-04', size: '3x3',                                status: 'disponible', price: 3000000, zone: 'Zona A' },
  { id: 'st05', code: 'A-05', size: '3x3',                                status: 'disponible', price: 3000000, zone: 'Zona A' },
  { id: 'st06', code: 'B-01', size: '3x6', company: 'Tecnoquímicas',     status: 'ocupado',    price: 5000000, zone: 'Zona B' },
  { id: 'st07', code: 'B-02', size: '3x3', company: 'Novartis Colombia', status: 'reservado',  price: 3000000, zone: 'Zona B' },
  { id: 'st08', code: 'B-03', size: '3x3',                                status: 'disponible', price: 3000000, zone: 'Zona B' },
  { id: 'st09', code: 'B-04', size: '3x3',                                status: 'disponible', price: 3000000, zone: 'Zona B' },
  { id: 'st10', code: 'B-05', size: '6x6', company: 'Instituto Salud',   status: 'ocupado',    price: 8000000, zone: 'Zona B' },
  { id: 'st11', code: 'C-01', size: '3x3',                                status: 'disponible', price: 3000000, zone: 'Zona C' },
  { id: 'st12', code: 'C-02', size: '3x3',                                status: 'disponible', price: 3000000, zone: 'Zona C' },
];

const SIZE_W: Record<StandSize, number> = { '3x3': 1, '3x6': 1.5, '6x6': 2 };

const EMPTY_FORM = {
  code: '', zone: 'Zona A', size: '3x3' as StandSize,
  price: '3000000', company: '', status: 'disponible' as StandStatus, notas: '',
};

export function NovoEventStands() {
  const { event } = useOutletContext<EventContext>();
  const [stands, setStands] = useState<Stand[]>(INIT_STANDS);
  const [selected, setSelected] = useState<Stand | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<StandStatus | 'todos'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Stand | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const f = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (s: Stand) => {
    setEditing(s);
    setForm({ code: s.code, zone: s.zone, size: s.size, price: String(s.price), company: s.company ?? '', status: s.status, notas: s.notas ?? '' });
    setModalOpen(true);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      if (editing) {
        const updated: Stand = { ...editing, code: form.code, zone: form.zone, size: form.size as StandSize, price: Number(form.price), company: form.company || undefined, status: form.status, notas: form.notas || undefined };
        setStands(prev => prev.map(s => s.id !== editing.id ? s : updated));
        if (selected?.id === editing.id) setSelected(updated);
      } else {
        const newS: Stand = { id: `st-${Date.now()}`, code: form.code, zone: form.zone, size: form.size as StandSize, price: Number(form.price), company: form.company || undefined, status: form.status, notas: form.notas || undefined };
        setStands(prev => [...prev, newS]);
      }
      setModalOpen(false);
    }, 600);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este stand?')) return;
    setStands(prev => prev.filter(s => s.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const counts = {
    total:      stands.length,
    ocupado:    stands.filter(s => s.status === 'ocupado').length,
    reservado:  stands.filter(s => s.status === 'reservado').length,
    disponible: stands.filter(s => s.status === 'disponible').length,
  };
  const ingresos = stands.filter(s => s.status === 'ocupado').reduce((s, st) => s + st.price, 0);

  const filtered = filter === 'todos' ? stands : stands.filter(s => s.status === filter);
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
          <button onClick={openCreate}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-95"
            style={{ background: 'rgba(0,201,160,.12)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
            <PlusIcon size={13} /> Agregar stand
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Total stands"    value={counts.total.toString()}      icon={LayoutPanelLeftIcon} accent="#7A9CB8" delay={0}    />
        <KPICard label="Ocupados"         value={counts.ocupado.toString()}    icon={BuildingIcon}         accent="#5B8AF0" progress={counts.total ? Math.round((counts.ocupado/counts.total)*100) : 0} delay={0.05} />
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
            <div className="overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
              <div className="grid px-5 py-3" style={{ gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr auto', borderBottom: '1px solid #1e3450' }}>
                {['Código', 'Tamaño', 'Empresa', 'Precio', 'Estado', ''].map(h => (
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
                      gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr auto',
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
                    <div className="flex items-center" onClick={e => e.stopPropagation()}>
                      <RowActions
                        onEdit={() => openEdit(stand)}
                        onDelete={() => handleDelete(stand.id)}
                      />
                    </div>
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

                {selected.notas && (
                  <div className="mt-3 rounded-xl p-3" style={{ background: '#0d1829', border: '1px solid #1e3450' }}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: '#3A5470' }}>Notas</p>
                    <p className="text-xs" style={{ color: '#7A9CB8' }}>{selected.notas}</p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-2">
                  <button onClick={() => openEdit(selected)}
                    className="rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-95"
                    style={{ background: 'rgba(0,201,160,.12)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.25)' }}>
                    {selected.status === 'disponible' ? 'Asignar empresa' : 'Editar asignación'}
                  </button>
                  <button onClick={() => handleDelete(selected.id)}
                    className="rounded-xl py-2 text-xs font-semibold transition-all active:scale-95"
                    style={{ background: 'rgba(242,68,99,.08)', color: '#F24463', border: '1px solid rgba(242,68,99,.2)' }}>
                    Eliminar stand
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ MODAL ══════════════════════════════════════════════════════════ */}
      <NovoModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar stand' : 'Nuevo stand'}
        subtitle={editing ? `Stand ${editing.code}` : 'Agregar un nuevo stand al plano del evento'}
        width={520}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={handleSave} disabled={saving || !form.code}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear stand'}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-5">
          <FormSection title="Información del stand">
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Código" required>
                <FormInput value={form.code} onChange={f('code')} placeholder="A-01" />
              </FormField>
              <FormField label="Zona">
                <FormInput value={form.zone} onChange={f('zone')} placeholder="Zona A" />
              </FormField>
              <FormField label="Tamaño">
                <FormSelect value={form.size} onChange={v => setForm(p => ({ ...p, size: v as StandSize }))} options={SIZE_OPTIONS} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Precio ($)">
                <FormInput type="number" value={form.price} onChange={f('price')} placeholder="3000000" />
              </FormField>
              <FormField label="Estado">
                <FormSelect value={form.status} onChange={v => setForm(p => ({ ...p, status: v as StandStatus }))} options={STATUS_OPTIONS} />
              </FormField>
            </div>
          </FormSection>
          <FormSection title="Asignación">
            <FormField label="Empresa asignada" hint="Dejar vacío si está disponible">
              <FormInput value={form.company} onChange={f('company')} placeholder="Roche Colombia, Pfizer…" />
            </FormField>
            <FormField label="Notas internas">
              <FormInput value={form.notas} onChange={f('notas')} placeholder="Observaciones, requerimientos especiales…" />
            </FormField>
          </FormSection>
        </div>
      </NovoModal>
    </div>
  );
}
