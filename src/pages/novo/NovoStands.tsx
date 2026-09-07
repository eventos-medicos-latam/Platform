import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon, LayoutIcon, CheckCircleIcon, ClockIcon,
  PencilIcon, TrashIcon, XIcon, BuildingIcon,
} from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { RowActions } from '../../components/novo/ui/RowActions';
import { formatCurrency } from '../../lib/novo/events';
import {
  NovoModal, ModalBtn, FormField, FormInput, FormSelect, FormTextarea, FormSection,
} from '../../components/novo/ui/NovoModal';

/* ── Tipos ─────────────────────────────────────────────────── */
type StandStatus = 'vendido' | 'reservado' | 'disponible';

interface StandType {
  id: string; name: string; area: string; price: number;
  price_min?: number; description: string; emoji: string;
}
interface StandUnit {
  id: string; code: string; type_id: string; type_name: string;
  event: string; company: string | null; status: StandStatus; price: number; notas?: string;
}

/* ── Config ────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<StandStatus, { color: string; bg: string; label: string }> = {
  vendido:    { color: '#00C9A0', bg: 'rgba(0,201,160,.12)',   label: 'Vendido'    },
  reservado:  { color: '#F59E0B', bg: 'rgba(245,158,11,.12)',  label: 'Reservado'  },
  disponible: { color: '#3A5470', bg: 'rgba(58,84,112,.15)',   label: 'Disponible' },
};
const BG = '#112035'; const BG_DEEP = '#0d1829'; const BORDER = '#1e3450';
const TEXT_HI = '#E1EAF4'; const TEXT_LO = '#7A9CB8'; const TEXT_DIM = '#3A5470';
const EVENTS = ['La Eterna Primavera', 'Hormobiota VI', 'Webinar Vitamina D'];

/* ── Datos mock ────────────────────────────────────────────── */
const INIT_TYPES: StandType[] = [
  { id: 'st-001', name: 'Estándar 3×2',    area: '6 m²',  price: 4200000, price_min: 3500000, description: 'Mesa + 2 sillas + luz + panel trasero', emoji: '🏪' },
  { id: 'st-002', name: 'Premium 4×3',     area: '12 m²', price: 8500000, price_min: 7000000, description: 'TV 55" + sofá + mostrador + luz focal',  emoji: '🏬' },
  { id: 'st-003', name: 'Corporativo 6×4', area: '24 m²', price: 18000000, price_min: 15000000, description: 'Diseño custom + almacén + sala privada', emoji: '🏢' },
  { id: 'st-004', name: 'Micro 2×2',       area: '4 m²',  price: 2200000, price_min: 2000000, description: 'Mesa + 1 silla + roll-up', emoji: '🛖' },
];

const INIT_UNITS: StandUnit[] = [
  { id: 'su-001', code: 'A-01', type_id: 'st-001', type_name: 'Estándar 3×2', event: 'La Eterna Primavera', company: 'Roche Colombia',  status: 'vendido',    price: 4200000 },
  { id: 'su-002', code: 'A-02', type_id: 'st-001', type_name: 'Estándar 3×2', event: 'La Eterna Primavera', company: 'Nestlé Health',   status: 'vendido',    price: 4200000 },
  { id: 'su-003', code: 'A-03', type_id: 'st-001', type_name: 'Estándar 3×2', event: 'La Eterna Primavera', company: null,              status: 'disponible', price: 4200000 },
  { id: 'su-004', code: 'B-01', type_id: 'st-002', type_name: 'Premium 4×3',  event: 'La Eterna Primavera', company: 'Abbott',          status: 'reservado',  price: 8500000 },
  { id: 'su-005', code: 'B-02', type_id: 'st-002', type_name: 'Premium 4×3',  event: 'La Eterna Primavera', company: null,              status: 'disponible', price: 8500000 },
  { id: 'su-006', code: 'C-01', type_id: 'st-003', type_name: 'Corporativo 6×4', event: 'La Eterna Primavera', company: null,           status: 'disponible', price: 18000000 },
  { id: 'su-007', code: 'HB-A1', type_id: 'st-001', type_name: 'Estándar 3×2', event: 'Hormobiota VI',      company: 'Roche Colombia',  status: 'vendido',    price: 4200000 },
  { id: 'su-008', code: 'HB-B1', type_id: 'st-002', type_name: 'Premium 4×3',  event: 'Hormobiota VI',      company: 'MSD Colombia',    status: 'vendido',    price: 8500000 },
];

const EMPTY_TYPE = { name: '', area: '', price: '', price_min: '', description: '', emoji: '🏪' };
const EMPTY_UNIT = { code: '', type_id: 'st-001', event: 'La Eterna Primavera', company: '', status: 'disponible' as StandStatus, price: '', notas: '' };
const EVENT_FILTERS = ['Todos', 'La Eterna Primavera', 'Hormobiota VI'] as const;
type EventFilter = typeof EVENT_FILTERS[number];

/* ══════════════════════════════════════════════════════════ */
export function NovoStands() {
  const [types, setTypes]         = useState<StandType[]>(INIT_TYPES);
  const [units, setUnits]         = useState<StandUnit[]>(INIT_UNITS);
  const [eventFilter, setEventFilter] = useState<EventFilter>('Todos');
  const [selectedUnit, setSelectedUnit] = useState<StandUnit | null>(null);

  /* tipo modal */
  const [typeModal, setTypeModal]  = useState(false);
  const [editingType, setEditingType] = useState<StandType | null>(null);
  const [typeForm, setTypeForm]    = useState(EMPTY_TYPE);
  const [savingType, setSavingType] = useState(false);

  /* unit modal */
  const [unitModal, setUnitModal]  = useState(false);
  const [editingUnit, setEditingUnit] = useState<StandUnit | null>(null);
  const [unitForm, setUnitForm]    = useState(EMPTY_UNIT);
  const [savingUnit, setSavingUnit] = useState(false);

  /* ── Stats ─────────────────────────────────────────────── */
  const vendidos    = units.filter(s => s.status === 'vendido').length;
  const reservados  = units.filter(s => s.status === 'reservado').length;
  const disponibles = units.filter(s => s.status === 'disponible').length;
  const pctOcupado  = Math.round(((vendidos + reservados) / units.length) * 100);

  const filteredUnits = units.filter(s => eventFilter === 'Todos' || s.event === eventFilter);

  /* ── CRUD tipos ─────────────────────────────────────────── */
  const openCreateType = () => { setEditingType(null); setTypeForm(EMPTY_TYPE); setTypeModal(true); };
  const openEditType = (t: StandType) => {
    setEditingType(t);
    setTypeForm({ name: t.name, area: t.area, price: String(t.price), price_min: String(t.price_min ?? ''), description: t.description, emoji: t.emoji });
    setTypeModal(true);
  };
  const handleSaveType = () => {
    setSavingType(true);
    setTimeout(() => {
      const newT: StandType = {
        id: editingType?.id ?? `st-${Date.now()}`,
        name: typeForm.name, area: typeForm.area,
        price: Number(typeForm.price), price_min: typeForm.price_min ? Number(typeForm.price_min) : undefined,
        description: typeForm.description, emoji: typeForm.emoji,
      };
      setTypes(prev => editingType ? prev.map(t => t.id === editingType.id ? newT : t) : [...prev, newT]);
      setSavingType(false); setTypeModal(false);
    }, 650);
  };
  const handleDeleteType = (id: string) => setTypes(prev => prev.filter(t => t.id !== id));

  /* ── CRUD units ─────────────────────────────────────────── */
  const openCreateUnit = () => { setEditingUnit(null); setUnitForm(EMPTY_UNIT); setUnitModal(true); };
  const openEditUnit = (u: StandUnit) => {
    setEditingUnit(u);
    setUnitForm({ code: u.code, type_id: u.type_id, event: u.event, company: u.company ?? '', status: u.status, price: String(u.price), notas: u.notas ?? '' });
    setUnitModal(true);
  };
  const handleSaveUnit = () => {
    setSavingUnit(true);
    setTimeout(() => {
      const t = types.find(t => t.id === unitForm.type_id);
      const newU: StandUnit = {
        id: editingUnit?.id ?? `su-${Date.now()}`,
        code: unitForm.code, type_id: unitForm.type_id, type_name: t?.name ?? '',
        event: unitForm.event, company: unitForm.company || null,
        status: unitForm.status, price: Number(unitForm.price) || (t?.price ?? 0),
        notas: unitForm.notas || undefined,
      };
      setUnits(prev => editingUnit ? prev.map(u => u.id === editingUnit.id ? newU : u) : [...prev, newU]);
      if (selectedUnit?.id === editingUnit?.id) setSelectedUnit(newU);
      setSavingUnit(false); setUnitModal(false);
    }, 650);
  };
  const handleDeleteUnit = (id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    if (selectedUnit?.id === id) setSelectedUnit(null);
  };

  const tf = (k: keyof typeof EMPTY_TYPE) => (v: string) => setTypeForm(p => ({ ...p, [k]: v }));
  const uf = (k: keyof typeof EMPTY_UNIT) => (v: string) => setUnitForm(p => ({ ...p, [k]: v }));

  /* ─────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>
            Inventario por evento
          </p>
          <h1 className="text-xl font-bold" style={{ color: TEXT_HI, fontFamily: "'Sora', sans-serif" }}>
            Stands
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: TEXT_LO }}>
            Tipos globales · inventario por evento · asignaciones
          </p>
        </div>
        <button type="button" onClick={openCreateType}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}>
          <PlusIcon size={15} strokeWidth={2.5} /> Nuevo tipo
        </button>
      </div>

      {/* KPIs */}
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
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_DIM }}>
            Tipos de stand — catálogo global
          </p>
          <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${BORDER}`, background: BG }}>
            <div className="grid text-[10px] font-bold uppercase tracking-widest px-4 py-3"
              style={{ gridTemplateColumns: 'auto 1fr 1fr 40px', color: TEXT_DIM,
                borderBottom: '1px solid #1a2e45', background: '#182d47' }}>
              <span className="w-8" /><span>Tipo</span><span>Precio</span><span />
            </div>
            {types.map((t, i) => (
              <motion.div key={t.id}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="grid items-center px-4 py-3.5 transition-colors"
                style={{ gridTemplateColumns: 'auto 1fr 1fr 40px',
                  borderBottom: i < types.length - 1 ? '1px solid #1a2e45' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#182d47')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-base mr-3"
                  style={{ background: '#182d47', border: `1px solid ${BORDER}` }}>
                  {t.emoji}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: TEXT_HI }}>{t.name} · {t.area}</p>
                  <p className="text-xs mt-0.5" style={{ color: TEXT_DIM }}>{t.description}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold tabular-nums" style={{ color: TEXT_HI }}>{formatCurrency(t.price)}</p>
                  {t.price_min && <p className="text-[10px]" style={{ color: TEXT_DIM }}>mín. {formatCurrency(t.price_min)}</p>}
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <RowActions onEdit={() => openEditType(t)} onDelete={() => handleDeleteType(t.id)} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Inventario */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_DIM }}>Inventario</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                {EVENT_FILTERS.map(f => (
                  <button key={f} type="button" onClick={() => setEventFilter(f)}
                    className="rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all"
                    style={{ background: eventFilter === f ? '#1e3450' : 'transparent', color: eventFilter === f ? TEXT_HI : TEXT_DIM }}>
                    {f === 'Todos' ? 'Todos' : f === 'La Eterna Primavera' ? 'EP 2025' : 'HB VI'}
                  </button>
                ))}
              </div>
              <button type="button" onClick={openCreateUnit}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-all active:scale-95"
                style={{ background: 'rgba(0,201,160,.12)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
                <PlusIcon size={11} /> Agregar
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${BORDER}`, background: BG }}>
            <div className="grid text-[10px] font-bold uppercase tracking-widest px-4 py-3"
              style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 40px', color: TEXT_DIM,
                borderBottom: '1px solid #1a2e45', background: '#182d47' }}>
              <span>Código</span><span>Tipo</span><span>Empresa</span><span>Estado</span><span />
            </div>
            {filteredUnits.map((s, i) => {
              const st = STATUS_CONFIG[s.status];
              const isActive = selectedUnit?.id === s.id;
              return (
                <motion.div key={s.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  onClick={() => setSelectedUnit(isActive ? null : s)}
                  className="group grid items-center px-4 py-3 cursor-pointer transition-colors"
                  style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 40px',
                    borderBottom: i < filteredUnits.length - 1 ? '1px solid #1a2e45' : 'none',
                    background: isActive ? '#182d47' : 'transparent' }}
                  onMouseEnter={e => !isActive && (e.currentTarget.style.background = '#182d47')}
                  onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
                >
                  <p className="text-sm font-bold tabular-nums" style={{ color: TEXT_HI }}>{s.code}</p>
                  <p className="text-xs" style={{ color: TEXT_LO }}>{s.type_name}</p>
                  <p className="truncate text-xs" style={{ color: s.company ? TEXT_LO : TEXT_DIM }}>
                    {s.company ?? '—'}
                  </p>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ color: st.color, background: st.bg }}>{st.label}</span>
                  <div onClick={e => e.stopPropagation()}>
                    <RowActions onEdit={() => openEditUnit(s)} onDelete={() => handleDeleteUnit(s.id)} />
                  </div>
                </motion.div>
              );
            })}
            {filteredUnits.length === 0 && (
              <div className="py-12 text-center" style={{ color: TEXT_DIM }}>
                <p className="text-sm">Sin unidades para este evento</p>
              </div>
            )}
          </div>

          {/* Panel detalle unidad */}
          <AnimatePresence>
            {selectedUnit && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="mt-3 rounded-2xl p-4" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold" style={{ color: TEXT_HI }}>Stand {selectedUnit.code}</p>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => openEditUnit(selectedUnit)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-semibold"
                      style={{ background: '#182d47', color: TEXT_LO }}>
                      <PencilIcon size={10} /> Editar
                    </button>
                    <button type="button" onClick={() => setSelectedUnit(null)}
                      className="rounded-lg p-1" style={{ color: TEXT_DIM }}>
                      <XIcon size={12} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Evento',  value: selectedUnit.event },
                    { label: 'Tipo',    value: selectedUnit.type_name },
                    { label: 'Precio',  value: formatCurrency(selectedUnit.price) },
                    { label: 'Estado',  value: STATUS_CONFIG[selectedUnit.status].label },
                    { label: 'Empresa', value: selectedUnit.company ?? 'Sin asignar' },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT_DIM }}>{item.label}</p>
                      <p className="text-xs font-semibold" style={{ color: TEXT_LO }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                {selectedUnit.notas && (
                  <p className="mt-2 text-[11px] leading-relaxed" style={{ color: TEXT_LO }}>{selectedUnit.notas}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal — Tipo */}
      <NovoModal open={typeModal} onClose={() => setTypeModal(false)}
        title={editingType ? 'Editar tipo de stand' : 'Nuevo tipo de stand'}
        width={520}
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setTypeModal(false)} disabled={savingType}>Cancelar</ModalBtn>
          <ModalBtn variant="primary" onClick={handleSaveType} disabled={savingType || !typeForm.name}>
            {savingType ? 'Guardando…' : editingType ? 'Guardar' : 'Crear tipo'}
          </ModalBtn>
        </>}
      >
        <FormSection title="Detalles del tipo">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombre" required>
              <FormInput placeholder="Ej. Estándar 3×2" value={typeForm.name} onChange={tf('name')} />
            </FormField>
            <FormField label="Emoji">
              <FormInput placeholder="🏪" value={typeForm.emoji} onChange={tf('emoji')} />
            </FormField>
            <FormField label="Área">
              <FormInput placeholder="6 m²" value={typeForm.area} onChange={tf('area')} />
            </FormField>
            <FormField label="Descripción" className="col-span-2">
              <FormInput placeholder="Mesa + sillas + iluminación…" value={typeForm.description} onChange={tf('description')} />
            </FormField>
            <FormField label="Precio lista">
              <FormInput type="number" placeholder="4200000" value={typeForm.price} onChange={tf('price')} />
            </FormField>
            <FormField label="Precio mínimo">
              <FormInput type="number" placeholder="3500000" value={typeForm.price_min} onChange={tf('price_min')} />
            </FormField>
          </div>
        </FormSection>
      </NovoModal>

      {/* Modal — Unidad */}
      <NovoModal open={unitModal} onClose={() => setUnitModal(false)}
        title={editingUnit ? 'Editar stand' : 'Agregar stand al inventario'}
        width={520}
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setUnitModal(false)} disabled={savingUnit}>Cancelar</ModalBtn>
          <ModalBtn variant="primary" onClick={handleSaveUnit} disabled={savingUnit || !unitForm.code}>
            {savingUnit ? 'Guardando…' : editingUnit ? 'Guardar' : 'Agregar stand'}
          </ModalBtn>
        </>}
      >
        <FormSection title="Stand">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Código" required>
              <FormInput placeholder="A-01" value={unitForm.code} onChange={uf('code')} />
            </FormField>
            <FormField label="Tipo">
              <FormSelect value={unitForm.type_id} onChange={uf('type_id')}
                options={types.map(t => ({ value: t.id, label: t.name }))} />
            </FormField>
            <FormField label="Evento">
              <FormSelect value={unitForm.event} onChange={uf('event')}
                options={EVENTS.map(e => ({ value: e, label: e }))} />
            </FormField>
            <FormField label="Estado">
              <FormSelect value={unitForm.status} onChange={uf('status')}
                options={Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))} />
            </FormField>
            <FormField label="Empresa asignada">
              <FormInput placeholder="Roche Colombia…" value={unitForm.company} onChange={uf('company')} />
            </FormField>
            <FormField label="Precio">
              <FormInput type="number" placeholder="4200000" value={unitForm.price} onChange={uf('price')} />
            </FormField>
            <FormField label="Notas" className="col-span-2">
              <FormInput placeholder="Observaciones internas…" value={unitForm.notas} onChange={uf('notas')} />
            </FormField>
          </div>
        </FormSection>
      </NovoModal>
    </div>
  );
}
