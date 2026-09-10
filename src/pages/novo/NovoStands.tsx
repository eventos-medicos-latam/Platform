import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon, LayoutIcon, CheckCircleIcon, ClockIcon,
  PencilIcon, XIcon,
} from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { RowActions } from '../../components/novo/ui/RowActions';
import { formatCurrency, listEvents } from '../../lib/novo/events';
import type { NovoEvent } from '../../types/novo';
import { listCompanies, type NovoCompany } from '../../lib/novo/companies';
import {
  createStandType, createStandUnit, deleteStandType, deleteStandUnit,
  listStandTypes, listStandUnits, updateStandType, updateStandUnit,
  type CatalogStandType, type EventStandUnit, type StandStatus,
} from '../../lib/novo/stands';
import {
  NovoModal, ModalBtn, FormField, FormInput, FormSelect, FormSection,
} from '../../components/novo/ui/NovoModal';

const STATUS_CONFIG: Record<StandStatus, { color: string; bg: string; label: string }> = {
  vendido:    { color: '#00C9A0', bg: 'rgba(0,201,160,.12)',   label: 'Vendido'    },
  reservado:  { color: '#F59E0B', bg: 'rgba(245,158,11,.12)',  label: 'Reservado'  },
  disponible: { color: '#3A5470', bg: 'rgba(58,84,112,.15)',   label: 'Disponible' },
};
const BG = '#112035'; const BORDER = '#1e3450';
const TEXT_HI = '#E1EAF4'; const TEXT_LO = '#7A9CB8'; const TEXT_DIM = '#3A5470';

const EMPTY_TYPE = { name: '', area: '', price: '', price_min: '', description: '', emoji: '🏪' };
const EMPTY_UNIT = { code: '', type_id: '', event_id: '', company_id: '', status: 'disponible' as StandStatus, price: '', notas: '' };

export function NovoStands() {
  const [types, setTypes] = useState<CatalogStandType[]>([]);
  const [units, setUnits] = useState<EventStandUnit[]>([]);
  const [companies, setCompanies] = useState<NovoCompany[]>([]);
  const [events, setEvents] = useState<NovoEvent[]>([]);
  const [eventFilter, setEventFilter] = useState('Todos');
  const [selectedUnit, setSelectedUnit] = useState<EventStandUnit | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [typeModal, setTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<CatalogStandType | null>(null);
  const [typeForm, setTypeForm] = useState(EMPTY_TYPE);
  const [savingType, setSavingType] = useState(false);

  const [unitModal, setUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<EventStandUnit | null>(null);
  const [unitForm, setUnitForm] = useState(EMPTY_UNIT);
  const [savingUnit, setSavingUnit] = useState(false);

  const reload = async () => {
    const [typeRows, unitRows] = await Promise.all([listStandTypes(), listStandUnits()]);
    setTypes(typeRows);
    setUnits(unitRows);
  };

  useEffect(() => {
    listCompanies().then(setCompanies).catch(() => setCompanies([]));
    listEvents().then(setEvents).catch(() => setEvents([]));
    reload().catch(() => { setTypes([]); setUnits([]); });
  }, []);

  const vendidos = units.filter(s => s.status === 'vendido').length;
  const reservados = units.filter(s => s.status === 'reservado').length;
  const disponibles = units.filter(s => s.status === 'disponible').length;
  const pctOcupado = units.length ? Math.round(((vendidos + reservados) / units.length) * 100) : 0;
  const filteredUnits = units.filter(s => eventFilter === 'Todos' || s.event_id === eventFilter);

  const eventOptions = useMemo(
    () => [{ id: 'Todos', name: 'Todos' }, ...events.map(e => ({ id: e.id, name: e.name }))],
    [events],
  );

  const openCreateType = () => { setEditingType(null); setTypeForm(EMPTY_TYPE); setTypeModal(true); };
  const openEditType = (t: CatalogStandType) => {
    setEditingType(t);
    setTypeForm({ name: t.name, area: t.area, price: String(t.price), price_min: String(t.price_min ?? ''), description: t.description, emoji: t.emoji });
    setTypeModal(true);
  };
  const handleSaveType = async () => {
    setSavingType(true);
    setError(null);
    const input = {
      name: typeForm.name.trim(),
      area: typeForm.area.trim(),
      price: Number(typeForm.price) || 0,
      price_min: typeForm.price_min.trim() === '' ? null : Number(typeForm.price_min),
      description: typeForm.description,
      emoji: typeForm.emoji || '🏪',
    };
    try {
      const saved = editingType ? await updateStandType(editingType.id, input) : await createStandType(input);
      setTypes(prev => editingType ? prev.map(t => t.id === editingType.id ? saved : t) : [...prev, saved]);
      setTypeModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el tipo.');
    } finally {
      setSavingType(false);
    }
  };
  const handleDeleteType = async (id: string) => {
    try {
      await deleteStandType(id);
      setTypes(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el tipo. Puede tener stands asignados.');
    }
  };

  const openCreateUnit = () => {
    setEditingUnit(null);
    setUnitForm({
      ...EMPTY_UNIT,
      type_id: types[0]?.id ?? '',
      event_id: eventFilter !== 'Todos' ? eventFilter : (events[0]?.id ?? ''),
      price: types[0] ? String(types[0].price) : '',
    });
    setUnitModal(true);
  };
  const openEditUnit = (u: EventStandUnit) => {
    setEditingUnit(u);
    setUnitForm({
      code: u.code, type_id: u.type_id, event_id: u.event_id,
      company_id: u.company_id ?? '', status: u.status, price: String(u.price), notas: u.notas,
    });
    setUnitModal(true);
  };
  const handleSaveUnit = async () => {
    if (!unitForm.event_id || !unitForm.type_id) return;
    setSavingUnit(true);
    setError(null);
    const type = types.find(t => t.id === unitForm.type_id);
    const input = {
      code: unitForm.code.trim(),
      type_id: unitForm.type_id,
      event_id: unitForm.event_id,
      company_id: unitForm.company_id || null,
      status: unitForm.status,
      price: Number(unitForm.price) || (type?.price ?? 0),
      zone: '',
      notas: unitForm.notas,
    };
    try {
      const saved = editingUnit
        ? await updateStandUnit(editingUnit.id, input, editingUnit.payment_id)
        : await createStandUnit(input);
      setUnits(prev => editingUnit ? prev.map(u => u.id === editingUnit.id ? saved : u) : [...prev, saved]);
      if (selectedUnit?.id === editingUnit?.id) setSelectedUnit(saved);
      setUnitModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el stand.');
    } finally {
      setSavingUnit(false);
    }
  };
  const handleDeleteUnit = async (unit: EventStandUnit) => {
    try {
      await deleteStandUnit(unit.id, unit.payment_id);
      setUnits(prev => prev.filter(u => u.id !== unit.id));
      if (selectedUnit?.id === unit.id) setSelectedUnit(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el stand.');
    }
  };

  const tf = (k: keyof typeof EMPTY_TYPE) => (v: string) => setTypeForm(p => ({ ...p, [k]: v }));
  const uf = (k: keyof typeof EMPTY_UNIT) => (v: string) => {
    setUnitForm(p => {
      const next = { ...p, [k]: v };
      if (k === 'type_id') {
        const type = types.find(t => t.id === v);
        if (type && !p.price) next.price = String(type.price);
      }
      return next;
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>
            Inventario por evento
          </p>
          <h1 className="text-xl font-bold" style={{ color: TEXT_HI, fontFamily: "'Sora', sans-serif" }}>
            Stands
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: TEXT_LO }}>
            Tipos globales · inventario por evento · si se vende, queda en la empresa y en Pagos
          </p>
        </div>
        <button type="button" onClick={openCreateType}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}>
          <PlusIcon size={15} strokeWidth={2.5} /> Nuevo tipo
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl px-4 py-2.5 text-xs" style={{ background: 'rgba(242,68,99,.12)', color: '#F24463' }}>{error}</p>
      ) : null}

      <div className="mb-6 grid grid-cols-3 gap-4">
        <KPICard label="Stands vendidos" value={vendidos.toString()} sub={`${pctOcupado}% del inventario`}
          icon={CheckCircleIcon} progress={pctOcupado} delay={0} />
        <KPICard label="Reservados" value={reservados.toString()} sub="pendientes de pago"
          icon={ClockIcon} accent="#F59E0B" delay={0.05} />
        <KPICard label="Disponibles" value={disponibles.toString()} sub="en todos los eventos"
          icon={LayoutIcon} accent="#5B8AF0" delay={0.1} />
      </div>

      <div className="grid grid-cols-2 gap-5">
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
                  <p className="text-sm font-semibold" style={{ color: TEXT_HI }}>{t.name}{t.area ? ` · ${t.area}` : ''}</p>
                  <p className="text-xs mt-0.5" style={{ color: TEXT_DIM }}>{t.description || 'Sin descripción'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold tabular-nums" style={{ color: TEXT_HI }}>{formatCurrency(t.price)}</p>
                  {t.price_min != null ? <p className="text-[10px]" style={{ color: TEXT_DIM }}>mín. {formatCurrency(t.price_min)}</p> : null}
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <RowActions onEdit={() => openEditType(t)} onDelete={() => { void handleDeleteType(t.id); }} />
                </div>
              </motion.div>
            ))}
            {types.length === 0 ? (
              <div className="py-12 text-center" style={{ color: TEXT_DIM }}>
                <p className="text-sm">Crea el primer tipo de stand para poder asignarlo a un evento.</p>
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_DIM }}>Inventario</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 p-0.5 rounded-lg max-w-[280px] overflow-x-auto" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                {eventOptions.map(f => (
                  <button key={f.id} type="button" onClick={() => setEventFilter(f.id)}
                    className="rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all whitespace-nowrap"
                    style={{ background: eventFilter === f.id ? '#1e3450' : 'transparent', color: eventFilter === f.id ? TEXT_HI : TEXT_DIM }}>
                    {f.id === 'Todos' ? 'Todos' : f.name}
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
                  <p className="truncate text-xs" style={{ color: s.company_name ? TEXT_LO : TEXT_DIM }}>
                    {s.company_name ?? '—'}
                  </p>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ color: st.color, background: st.bg }}>{st.label}</span>
                  <div onClick={e => e.stopPropagation()}>
                    <RowActions onEdit={() => openEditUnit(s)} onDelete={() => { void handleDeleteUnit(s); }} />
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
                    { label: 'Evento',  value: selectedUnit.event_name },
                    { label: 'Tipo',    value: selectedUnit.type_name },
                    { label: 'Precio',  value: formatCurrency(selectedUnit.price) },
                    { label: 'Estado',  value: STATUS_CONFIG[selectedUnit.status].label },
                    { label: 'Empresa', value: selectedUnit.company_name ?? 'Sin asignar' },
                    { label: 'Transacción', value: selectedUnit.payment_id
                      ? (selectedUnit.payment_status === 'pagado' ? 'Pagada en portal' : 'Cuota pendiente en Pagos')
                      : 'Sin transacción' },
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

      <NovoModal open={typeModal} onClose={() => setTypeModal(false)}
        title={editingType ? 'Editar tipo de stand' : 'Nuevo tipo de stand'}
        width={520}
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setTypeModal(false)} disabled={savingType}>Cancelar</ModalBtn>
          <ModalBtn variant="primary" onClick={() => { void handleSaveType(); }} disabled={savingType || !typeForm.name}>
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

      <NovoModal open={unitModal} onClose={() => setUnitModal(false)}
        title={editingUnit ? 'Editar stand' : 'Agregar stand al inventario'}
        width={520}
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setUnitModal(false)} disabled={savingUnit}>Cancelar</ModalBtn>
          <ModalBtn variant="primary" onClick={() => { void handleSaveUnit(); }} disabled={savingUnit || !unitForm.code || !unitForm.event_id || !unitForm.type_id}>
            {savingUnit ? 'Guardando…' : editingUnit ? 'Guardar' : 'Agregar stand'}
          </ModalBtn>
        </>}
      >
        <FormSection title="Stand">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Código" required>
              <FormInput placeholder="A-01" value={unitForm.code} onChange={uf('code')} />
            </FormField>
            <FormField label="Tipo" required hint={types.length === 0 ? 'Crea un tipo primero.' : undefined}>
              <FormSelect value={unitForm.type_id} onChange={uf('type_id')}
                options={[{ value: '', label: 'Seleccionar tipo…' }, ...types.map(t => ({ value: t.id, label: t.name }))]} />
            </FormField>
            <FormField label="Evento" required hint="El stand queda en el inventario de este evento.">
              <FormSelect value={unitForm.event_id} onChange={uf('event_id')}
                options={[{ value: '', label: 'Seleccionar evento…' }, ...events.map(e => ({ value: e.id, label: e.name }))]} />
            </FormField>
            <FormField label="Estado">
              <FormSelect value={unitForm.status} onChange={uf('status')}
                options={Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))} />
            </FormField>
            <FormField label="Empresa asignada" hint={unitForm.status === 'disponible' ? 'Opcional si está disponible.' : 'Obligatoria al reservar o vender.'}>
              <FormSelect value={unitForm.company_id} onChange={uf('company_id')}
                options={[{ value: '', label: 'Sin asignar' }, ...companies.map(c => ({ value: c.id, label: `${c.name} · ${c.ciudad}` }))]} />
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
