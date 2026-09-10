import React, { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PackageIcon, PlusIcon, SearchIcon, ShoppingBagIcon, TagIcon,
  LayersIcon, ExternalLinkIcon, CheckIcon,
} from 'lucide-react';
import { KPICard } from '../../../components/novo/ui/KPICard';
import { RowActions } from '../../../components/novo/ui/RowActions';
import { NovoModal, ModalBtn, FormField, FormInput, FormTextarea } from '../../../components/novo/ui/NovoModal';
import { formatCurrency } from '../../../lib/novo/events';
import {
  listProducts, listEventProducts, assignProductToEvent, updateEventProduct,
  setEventProductAvailable, removeEventProduct,
  type CatalogProduct, type AssignedProductRow,
} from '../../../lib/novo/products';
import type { NovoEvent } from '../../../types/novo';

interface EventContext { event: NovoEvent }

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  participacion: { color: '#FF7043', bg: 'rgba(255,112,67,.12)',  label: 'Participación' },
  ticket:        { color: '#00C9A0', bg: 'rgba(0,201,160,.12)',   label: 'Ticket'        },
  stand:         { color: '#5B8AF0', bg: 'rgba(91,138,240,.12)',  label: 'Stand'         },
  infoproducto:  { color: '#A78BFA', bg: 'rgba(167,139,250,.12)', label: 'Infoproducto'  },
  certificado:   { color: '#7A9CB8', bg: 'rgba(122,156,184,.10)', label: 'Certificado'   },
  otro:          { color: '#E1EAF4', bg: 'rgba(225,234,244,.12)', label: 'Otro'          },
};

const FILTERS = ['Todos', 'Participación', 'Tickets', 'Stands'] as const;
type Filter = typeof FILTERS[number];

const EMPTY_FORM = { price: '', inventory: '', is_available: 'true', benefits: '', conditions: '' };

export function NovoEventProductos() {
  const { event } = useOutletContext<EventContext>();
  const [catalog, setCatalog]     = useState<CatalogProduct[]>([]);
  const [assigned, setAssigned]   = useState<AssignedProductRow[]>([]);
  const [filter, setFilter]       = useState<Filter>('Todos');
  const [search, setSearch]       = useState('');
  const [addOpen, setAddOpen]     = useState(false);
  const [editOpen, setEditOpen]   = useState(false);
  const [editing, setEditing]     = useState<AssignedProductRow | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const f = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    listProducts().then(setCatalog).catch(() => setCatalog([]));
    listEventProducts(event.id).then(setAssigned).catch(() => setAssigned([]));
  }, [event.id]);

  const unusedCatalog = useMemo(
    () => catalog.filter(p => p.is_active && !assigned.some(a => a.product_id === p.id)),
    [catalog, assigned],
  );

  const openEdit = (row: AssignedProductRow) => {
    setEditing(row);
    setForm({
      price: String(row.price),
      inventory: row.inventory === null ? '' : String(row.inventory),
      is_available: row.is_available ? 'true' : 'false',
      benefits: row.benefits,
      conditions: row.conditions,
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const inventory = form.inventory.trim() === '' ? null : Number(form.inventory);
    const payload = {
      price: Number(form.price) || 0,
      inventory: Number.isFinite(inventory) ? inventory : null,
      is_available: form.is_available === 'true',
      benefits: form.benefits,
      conditions: form.conditions,
    };
    try {
      await updateEventProduct(editing.id, payload);
      setAssigned(prev => prev.map(a => a.id !== editing.id ? a : { ...a, ...payload }));
      setEditOpen(false);
      setEditing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (product: CatalogProduct) => {
    try {
      const row = await assignProductToEvent(event.id, product);
      setAssigned(prev => prev.some(a => a.product_id === product.id) ? prev : [...prev, row]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo asignar el producto.');
    }
    window.setTimeout(() => setAddOpen(false), 0);
  };

  const handleRemove = async (id: string) => {
    if (!confirm('¿Quitar este producto del evento? El catálogo global no se modifica.')) return;
    try {
      await removeEventProduct(id);
      setAssigned(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo quitar el producto.');
    }
  };

  const handleToggle = async (id: string) => {
    const row = assigned.find(a => a.id === id);
    if (!row) return;
    try {
      await setEventProductAvailable(id, !row.is_available);
      setAssigned(prev => prev.map(a => a.id !== id ? a : { ...a, is_available: !a.is_available }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo actualizar.');
    }
  };

  const rows = assigned;

  const filtered = rows.filter(row => {
    const matchFilter =
      filter === 'Todos' ||
      (filter === 'Participación' && row.product.category === 'participacion') ||
      (filter === 'Tickets' && row.product.category === 'ticket') ||
      (filter === 'Stands' && row.product.category === 'stand');
    const q = search.toLowerCase();
    const matchSearch = !q
      || row.product.name.toLowerCase().includes(q)
      || row.product.description.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const available = assigned.filter(a => a.is_available).length;
  const belowList = rows.filter(r => r.price < r.product.price_list).length;
  const categories = new Set(rows.map(r => r.product.category)).size;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Productos</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>
            Oferta de este evento · precio, inventario y disponibilidad
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/novo/productos"
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all"
            style={{ background: '#112035', color: '#7A9CB8', border: '1px solid #1e3450' }}
          >
            <ExternalLinkIcon size={12} /> Catálogo global
          </Link>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
            style={{ background: '#00C9A0', color: '#0d1829' }}
          >
            <PlusIcon size={14} /> Agregar del catálogo
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <KPICard label="En este evento" value={assigned.length.toString()} sub={`${available} disponibles`}
          icon={ShoppingBagIcon} delay={0} />
        <KPICard label="Precio especial" value={belowList.toString()} sub="por debajo del lista"
          icon={TagIcon} accent="#F59E0B" delay={0.05} />
        <KPICard label="Categorías" value={categories.toString()} sub="asignadas al evento"
          icon={LayersIcon} accent="#A78BFA" delay={0.1} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div
          className="relative flex items-center"
          style={{ background: '#112035', border: '1px solid #1e3450', borderRadius: 12 }}
        >
          <SearchIcon size={14} className="absolute left-3" style={{ color: '#3A5470' }} />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent pl-9 pr-4 py-2 text-sm outline-none w-56"
            style={{ color: '#E1EAF4' }}
          />
        </div>
        <div
          className="flex items-center gap-0.5 p-1 rounded-xl"
          style={{ background: '#112035', border: '1px solid #1e3450' }}
        >
          {FILTERS.map(item => (
            <button key={item} type="button" onClick={() => setFilter(item)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
              style={{ background: filter === item ? '#1e3450' : 'transparent', color: filter === item ? '#E1EAF4' : '#3A5470' }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid #1e3450', background: '#112035' }}>
        <div
          className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-3"
          style={{ gridTemplateColumns: '2.4fr 1fr 1fr 1fr 0.9fr auto', color: '#3A5470', borderBottom: '1px solid #1a2e45', background: '#182d47' }}
        >
          <span>Producto</span><span>Categoría</span><span>Precio evento</span><span>Inventario</span><span>Estado</span><span className="w-20" />
        </div>

        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center">
            <PackageIcon size={22} className="mx-auto mb-2" style={{ color: '#3A5470' }} />
            <p className="text-sm" style={{ color: '#7A9CB8' }}>No hay productos en este filtro.</p>
            <p className="text-xs mt-1" style={{ color: '#3A5470' }}>Agrega productos del catálogo global a este evento.</p>
          </div>
        )}

        {filtered.map((row, i) => {
          const cat = CATEGORY_CONFIG[row.product.category] ?? CATEGORY_CONFIG.ticket;
          const belowMin = row.product.price_min != null && row.price < row.product.price_min;
          const belowListPrice = row.price < row.product.price_list;
          return (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1], delay: i * 0.04 }}
              className="grid items-center px-5 py-4 transition-colors duration-150 cursor-pointer"
              style={{ gridTemplateColumns: '2.4fr 1fr 1fr 1fr 0.9fr auto', borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none' }}
              onClick={() => openEdit(row)}
              onMouseEnter={e => (e.currentTarget.style.background = '#182d47')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ background: '#182d47', border: '1px solid #1e3450' }}>{row.product.emoji}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: '#E1EAF4' }}>{row.product.name}</p>
                  <p className="truncate text-xs mt-0.5" style={{ color: '#3A5470' }}>{row.product.description}</p>
                </div>
              </div>
              <div>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{ color: cat.color, background: cat.bg }}>{cat.label}</span>
              </div>
              <div>
                <p className="text-sm font-semibold tabular-nums" style={{ color: belowMin ? '#F24463' : '#E1EAF4' }}>
                  {row.price === 0 ? 'Gratuito' : formatCurrency(row.price)}
                </p>
                {belowListPrice && row.price !== 0 && (
                  <p className="text-[10px] mt-0.5 tabular-nums" style={{ color: '#3A5470' }}>
                    lista {formatCurrency(row.product.price_list)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm tabular-nums" style={{ color: '#E1EAF4' }}>
                  {row.inventory === null ? 'Ilimitado' : row.inventory}
                </p>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{
                    color: row.is_available ? '#00C9A0' : '#3A5470',
                    background: row.is_available ? 'rgba(0,201,160,.12)' : 'rgba(58,84,112,.12)',
                  }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: row.is_available ? '#00C9A0' : '#3A5470' }} />
                  {row.is_available ? 'Disponible' : 'Oculto'}
                </span>
              </div>
              <div className="w-20 flex justify-end" onClick={e => e.stopPropagation()}>
                <RowActions
                  onEdit={() => openEdit(row)}
                  onToggle={() => handleToggle(row.id)}
                  toggleActive={row.is_available}
                  onDelete={() => handleRemove(row.id)}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <NovoModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Agregar del catálogo"
        subtitle="Los productos se crean en el catálogo global. Aquí solo se asignan a este evento."
        width={560}
        footer={<ModalBtn variant="secondary" onClick={() => setAddOpen(false)}>Cerrar</ModalBtn>}
      >
        {unusedCatalog.length === 0 ? (
          <p className="text-sm py-4" style={{ color: '#7A9CB8' }}>
            Todos los productos del catálogo ya están en este evento.{' '}
            <Link to="/novo/productos" style={{ color: '#00C9A0' }}>Crear uno nuevo</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {unusedCatalog.map(product => {
              const cat = CATEGORY_CONFIG[product.category] ?? CATEGORY_CONFIG.ticket;
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleAdd(product)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors"
                  style={{ background: '#0d1829', border: '1px solid #1e3450' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,201,160,.4)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e3450')}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ background: '#182d47' }}>{product.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: '#E1EAF4' }}>{product.name}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: '#3A5470' }}>{product.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ color: cat.color, background: cat.bg }}>{cat.label}</span>
                  <span className="shrink-0 text-xs tabular-nums" style={{ color: '#7A9CB8' }}>
                    {product.price_list === 0 ? 'Gratis' : formatCurrency(product.price_list)}
                  </span>
                  <CheckIcon size={14} className="shrink-0" style={{ color: '#00C9A0', opacity: 0.4 }} />
                </button>
              );
            })}
          </div>
        )}
      </NovoModal>

      <NovoModal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditing(null); }}
        title="Configurar en el evento"
        subtitle={editing?.product.name}
        width={520}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => { setEditOpen(false); setEditing(null); }}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Precio en este evento (COP)" hint="Puede diferir del precio lista">
              <FormInput type="number" value={form.price} onChange={f('price')} placeholder="0" />
            </FormField>
            <FormField label="Inventario" hint="Vacío = ilimitado">
              <FormInput type="number" value={form.inventory} onChange={f('inventory')} placeholder="Ilimitado" />
            </FormField>
          </div>
          <FormField label="Disponibilidad">
            <div className="flex gap-2">
              {(['true', 'false'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => f('is_available')(v)}
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold"
                  style={{
                    background: form.is_available === v ? '#182d47' : '#0d1829',
                    color: form.is_available === v ? '#E1EAF4' : '#3A5470',
                    border: `1px solid ${form.is_available === v ? 'rgba(0,201,160,.35)' : '#1e3450'}`,
                  }}
                >
                  {v === 'true' ? 'Disponible' : 'Oculto'}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Beneficios" hint="Uno por línea">
            <FormTextarea value={form.benefits} onChange={f('benefits')} placeholder="Qué incluye en este evento…" rows={3} />
          </FormField>
          <FormField label="Condiciones">
            <FormTextarea value={form.conditions} onChange={f('conditions')} placeholder="Restricciones, fechas de preventa…" rows={2} />
          </FormField>
        </div>
      </NovoModal>
    </div>
  );
}
