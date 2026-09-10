import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutPanelLeftIcon, BuildingIcon, CheckCircleIcon,
  PlusIcon, CopyIcon, GridIcon, LayoutListIcon,
} from 'lucide-react';
import { KPICard } from '../../../components/novo/ui/KPICard';
import { RowActions } from '../../../components/novo/ui/RowActions';
import { formatCurrency } from '../../../lib/novo/events';
import { listCompanies, type NovoCompany } from '../../../lib/novo/companies';
import {
  createStandUnit, createStandUnitsBulk, deleteStandUnit, generateStandCodes,
  listStandTypes, listStandUnits, updateStandUnit,
  type CatalogStandType, type EventStandUnit, type StandStatus,
} from '../../../lib/novo/stands';
import {
  NovoModal, ModalBtn,
  FormField, FormInput, FormSelect, FormSection,
} from '../../../components/novo/ui/NovoModal';
import type { NovoEventOutlet } from '../../../types/novo';

const STATUS_CONFIG: Record<StandStatus, { label: string; color: string; bg: string; border: string }> = {
  vendido:    { label: 'Vendido',    color: '#E1EAF4', bg: '#1a4a7a',              border: '#2d6fae'  },
  reservado:  { label: 'Reservado',  color: '#F59E0B', bg: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.4)' },
  disponible: { label: 'Disponible', color: '#00C9A0', bg: 'rgba(0,201,160,.08)',  border: 'rgba(0,201,160,.25)' },
};

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }));

const EMPTY_FORM = {
  code: '', zone: 'Zona A', type_id: '', quantity: '1',
  price: '', company_id: '', status: 'disponible' as StandStatus, notas: '',
};

const QTY_PRESETS = [1, 5, 10, 20] as const;

function tileWidth(typeName: string, area: string) {
  const hay = `${typeName} ${area}`.toLowerCase();
  if (hay.includes('6x4') || hay.includes('6×4') || hay.includes('corporativo')) return 2;
  if (hay.includes('4x3') || hay.includes('4×3') || hay.includes('premium')) return 1.5;
  return 1;
}

export function NovoEventStands() {
  const { event } = useOutletContext<NovoEventOutlet>();
  const [stands, setStands] = useState<EventStandUnit[]>([]);
  const [types, setTypes] = useState<CatalogStandType[]>([]);
  const [companies, setCompanies] = useState<NovoCompany[]>([]);
  const [selected, setSelected] = useState<EventStandUnit | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<StandStatus | 'todos'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventStandUnit | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const f = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const reload = () => listStandUnits(event.id).then(setStands).catch(() => setStands([]));

  useEffect(() => {
    listStandTypes().then(setTypes).catch(() => setTypes([]));
    listCompanies().then(setCompanies).catch(() => setCompanies([]));
  }, []);

  useEffect(() => {
    reload();
    setSelected(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const openCreate = (quantity = '1') => {
    setEditing(null);
    setError(null);
    setForm({
      ...EMPTY_FORM,
      quantity,
      type_id: types[0]?.id ?? '',
      price: types[0] ? String(types[0].price) : '',
    });
    setModalOpen(true);
  };
  const openEdit = (s: EventStandUnit) => {
    setEditing(s);
    setError(null);
    setForm({
      code: s.code, zone: s.zone || 'Zona A', type_id: s.type_id, quantity: '1',
      price: String(s.price), company_id: s.company_id ?? '', status: s.status, notas: s.notas,
    });
    setModalOpen(true);
  };

  const quantity = editing ? 1 : Math.min(40, Math.max(1, Number(form.quantity) || 1));
  const bulkCodes = !editing && quantity > 1 && form.code.trim()
    ? generateStandCodes(form.code, quantity, stands.map(s => s.code))
    : [];

  const handleSave = async () => {
    if (!form.type_id) return;
    setSaving(true);
    setError(null);
    const type = types.find(t => t.id === form.type_id);
    const price = Number(form.price) || (type?.price ?? 0);
    try {
      if (!editing && quantity > 1) {
        const created = await createStandUnitsBulk({
          codes: bulkCodes,
          type_id: form.type_id,
          event_id: event.id,
          price,
          zone: form.zone.trim(),
          notas: form.notas,
        });
        setStands(prev => [...prev, ...created].sort((a, b) => a.code.localeCompare(b.code, 'es')));
        setModalOpen(false);
        return;
      }
      const input = {
        code: form.code.trim(),
        type_id: form.type_id,
        event_id: event.id,
        company_id: form.company_id || null,
        status: form.status,
        price,
        zone: form.zone.trim(),
        notas: form.notas,
      };
      const saved = editing
        ? await updateStandUnit(editing.id, input, editing.payment_id)
        : await createStandUnit(input);
      setStands(prev => editing ? prev.map(s => s.id !== editing.id ? s : saved) : [...prev, saved]);
      if (selected?.id === editing?.id) setSelected(saved);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el stand.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (unit: EventStandUnit) => {
    if (!confirm('¿Eliminar este stand?')) return;
    try {
      await deleteStandUnit(unit.id, unit.payment_id);
      setStands(prev => prev.filter(s => s.id !== unit.id));
      if (selected?.id === unit.id) setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el stand.');
    }
  };

  const counts = {
    total:      stands.length,
    vendido:    stands.filter(s => s.status === 'vendido').length,
    reservado:  stands.filter(s => s.status === 'reservado').length,
    disponible: stands.filter(s => s.status === 'disponible').length,
  };
  const ingresos = stands.filter(s => s.status === 'vendido').reduce((sum, st) => sum + st.price, 0);
  const filtered = filter === 'todos' ? stands : stands.filter(s => s.status === filter);
  const zones = [...new Set(filtered.map(s => s.zone || 'Sin zona'))];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Stands</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>Inventario de este evento · si se vende, se liga a la empresa y a una cuota</p>
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
          <button onClick={() => openCreate('5')}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-95"
            style={{ background: '#182d47', color: '#7A9CB8', border: '1px solid #1e3450' }}>
            <CopyIcon size={13} /> Crear varios
          </button>
          <button onClick={() => openCreate('1')}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-95"
            style={{ background: 'rgba(0,201,160,.12)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
            <PlusIcon size={13} /> Agregar stand
          </button>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl px-4 py-2.5 text-xs" style={{ background: 'rgba(242,68,99,.12)', color: '#F24463' }}>{error}</p>
      ) : null}

      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Total stands"    value={counts.total.toString()}      icon={LayoutPanelLeftIcon} accent="#7A9CB8" delay={0}    />
        <KPICard label="Vendidos"         value={counts.vendido.toString()}    icon={BuildingIcon}         accent="#5B8AF0" progress={counts.total ? Math.round((counts.vendido/counts.total)*100) : 0} delay={0.05} />
        <KPICard label="Disponibles"      value={counts.disponible.toString()} icon={CheckCircleIcon}     accent="#00C9A0" delay={0.1}  />
        <KPICard label="Ingresos stands"  value={formatCurrency(ingresos)} icon={LayoutPanelLeftIcon} accent="#FF7043" delay={0.15} />
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #1e3450' }}>
          {(['todos', 'disponible', 'reservado', 'vendido'] as const).map(item => (
            <button key={item} onClick={() => setFilter(item)}
              className="px-3.5 py-2 text-xs font-semibold transition-colors"
              style={{
                background: filter === item ? '#182d47' : '#112035',
                color: filter === item ? '#E1EAF4' : '#2a4a6b',
                borderRight: '1px solid #1e3450',
              }}>
              {item === 'todos' ? 'Todos' : STATUS_CONFIG[item].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-5">
        <div className="flex-1">
          {filtered.length === 0 ? (
            <div className="rounded-2xl py-16 text-center" style={{ background: '#112035', border: '1px solid #1e3450', color: '#3A5470' }}>
              <p className="text-sm">Aún no hay stands en este evento.</p>
            </div>
          ) : view === 'grid' ? (
            zones.map(zone => (
              <div key={zone} className="mb-6">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3A5470' }}>{zone}</p>
                <div className="flex flex-wrap gap-3">
                  {filtered.filter(s => (s.zone || 'Sin zona') === zone).map((stand, i) => {
                    const cfg = STATUS_CONFIG[stand.status];
                    const isSelected = selected?.id === stand.id;
                    const type = types.find(t => t.id === stand.type_id);
                    const w = tileWidth(stand.type_name, type?.area ?? '');
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
                        <p className="text-[9px] mt-0.5" style={{ color: '#3A5470' }}>{stand.type_name}</p>
                        {stand.company_name ? (
                          <p className="text-[10px] font-semibold mt-1 leading-tight" style={{ color: '#7A9CB8' }}>{stand.company_name}</p>
                        ) : (
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
                {['Código', 'Tipo', 'Empresa', 'Precio', 'Estado', ''].map(h => (
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
                    <p className="flex items-center text-xs" style={{ color: '#7A9CB8' }}>{stand.type_name}</p>
                    <p className="flex items-center text-sm" style={{ color: stand.company_name ? '#E1EAF4' : '#2a4a6b' }}>{stand.company_name ?? '—'}</p>
                    <p className="flex items-center text-sm tabular-nums" style={{ color: '#E1EAF4' }}>{formatCurrency(stand.price)}</p>
                    <span className="flex items-center">
                      <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                    </span>
                    <div className="flex items-center" onClick={e => e.stopPropagation()}>
                      <RowActions
                        onEdit={() => openEdit(stand)}
                        onDelete={() => { void handleDelete(stand); }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
                  { label: 'Tipo',     value: selected.type_name },
                  { label: 'Zona',     value: selected.zone || '—' },
                  { label: 'Precio',   value: formatCurrency(selected.price) },
                  { label: 'Empresa',  value: selected.company_name ?? 'Sin asignar' },
                  { label: 'Transacción', value: selected.payment_id
                    ? (selected.payment_status === 'pagado' ? 'Pagada' : 'Cuota pendiente')
                    : 'Sin transacción' },
                ].map((item) => (
                  <div key={item.label} className="mb-3">
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
                  <button onClick={() => { void handleDelete(selected); }}
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

      <NovoModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar stand' : quantity > 1 ? 'Crear varios stands' : 'Nuevo stand'}
        subtitle={editing ? `Stand ${editing.code}` : quantity > 1
          ? `Misma zona, tipo y precio · se numeran desde el código`
          : `Agregar un stand a ${event.name}`}
        width={520}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn
              variant="primary"
              onClick={() => { void handleSave(); }}
              disabled={saving || !form.code || !form.type_id || (!editing && quantity > 1 && bulkCodes.length === 0)}
            >
              {saving
                ? 'Guardando…'
                : editing
                  ? 'Guardar cambios'
                  : quantity > 1
                    ? `Crear ${bulkCodes.length} stands`
                    : 'Crear stand'}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-5">
          {error ? (
            <p className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(242,68,99,.12)', color: '#F24463' }}>{error}</p>
          ) : null}
          <FormSection title="Información del stand">
            <div className="grid grid-cols-3 gap-4">
              <FormField label={quantity > 1 ? 'Código inicial' : 'Código'} required hint={quantity > 1 ? 'Ej. A-01' : undefined}>
                <FormInput value={form.code} onChange={f('code')} placeholder="A-01" />
              </FormField>
              <FormField label="Zona">
                <FormInput value={form.zone} onChange={f('zone')} placeholder="Zona A" />
              </FormField>
              <FormField label="Tipo" required hint={types.length === 0 ? 'Crea tipos en Stands.' : undefined}>
                <FormSelect value={form.type_id} onChange={v => {
                  const type = types.find(t => t.id === v);
                  setForm(p => ({ ...p, type_id: v, price: type && !p.price ? String(type.price) : p.price }));
                }} options={[{ value: '', label: 'Seleccionar…' }, ...types.map(t => ({ value: t.id, label: t.name }))]} />
              </FormField>
            </div>
            {!editing ? (
              <FormField label="Cantidad" hint="Hasta 40. Los que ya existan se saltan.">
                <div className="flex items-center gap-2">
                  <div className="w-24">
                    <FormInput type="number" value={form.quantity} onChange={f('quantity')} placeholder="1" />
                  </div>
                  <div className="flex gap-1">
                    {QTY_PRESETS.map((n) => (
                      <button key={n} type="button" onClick={() => setForm(p => ({ ...p, quantity: String(n) }))}
                        className="rounded-lg px-2.5 py-2 text-[11px] font-semibold"
                        style={{
                          background: quantity === n ? 'rgba(0,201,160,.15)' : '#182d47',
                          color: quantity === n ? '#00C9A0' : '#7A9CB8',
                          border: `1px solid ${quantity === n ? 'rgba(0,201,160,.35)' : '#1e3450'}`,
                        }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </FormField>
            ) : null}
            {bulkCodes.length > 0 ? (
              <p className="rounded-xl px-3 py-2 text-xs leading-relaxed" style={{ background: '#0d1829', color: '#7A9CB8', border: '1px solid #1e3450' }}>
                Se crearán {bulkCodes.length}: <span style={{ color: '#E1EAF4' }}>{bulkCodes.slice(0, 12).join(', ')}{bulkCodes.length > 12 ? `… +${bulkCodes.length - 12}` : ''}</span>
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Precio ($)">
                <FormInput type="number" value={form.price} onChange={f('price')} placeholder="3000000" />
              </FormField>
              {quantity === 1 ? (
                <FormField label="Estado">
                  <FormSelect value={form.status} onChange={v => setForm(p => ({ ...p, status: v as StandStatus }))} options={STATUS_OPTIONS} />
                </FormField>
              ) : (
                <FormField label="Estado" hint="Los lotes salen disponibles.">
                  <FormInput value="Disponible" onChange={() => {}} disabled />
                </FormField>
              )}
            </div>
          </FormSection>
          {quantity === 1 ? (
            <FormSection title="Asignación">
              <FormField label="Empresa" hint={form.status === 'disponible' ? 'Vacío si está disponible.' : 'Obligatoria al reservar o vender. Se crea una cuota en Pagos.'}>
                <FormSelect value={form.company_id} onChange={f('company_id')}
                  options={[{ value: '', label: 'Sin asignar' }, ...companies.map(c => ({ value: c.id, label: `${c.name} · ${c.ciudad}` }))]} />
              </FormField>
              <FormField label="Notas internas">
                <FormInput value={form.notas} onChange={f('notas')} placeholder="Observaciones, requerimientos especiales…" />
              </FormField>
            </FormSection>
          ) : (
            <FormSection title="Notas">
              <FormField label="Notas internas">
                <FormInput value={form.notas} onChange={f('notas')} placeholder="Observaciones, requerimientos especiales…" />
              </FormField>
            </FormSection>
          )}
        </div>
      </NovoModal>
    </div>
  );
}
