import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, SearchIcon, ShoppingBagIcon, TagIcon, LayersIcon } from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { formatCurrency } from '../../lib/novo/events';
import {
  listProducts, createProduct, updateProduct, deleteProduct,
  setProductActive, duplicateProduct, type CatalogProduct,
} from '../../lib/novo/products';
import { RowActions } from '../../components/novo/ui/RowActions';
import { NovoModal, ModalBtn, FormField, FormInput, FormSelect, FormTextarea } from '../../components/novo/ui/NovoModal';

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  participacion: { color: '#FF7043', bg: 'rgba(255,112,67,.12)', label: 'Participación' },
  ticket:        { color: '#00C9A0', bg: 'rgba(0,201,160,.12)',  label: 'Ticket'        },
  stand:         { color: '#5B8AF0', bg: 'rgba(91,138,240,.12)', label: 'Stand'         },
  infoproducto:  { color: '#A78BFA', bg: 'rgba(167,139,250,.12)',label: 'Infoproducto'  },
  certificado:   { color: '#7A9CB8', bg: 'rgba(122,156,184,.10)',label: 'Certificado'   },
  otro:          { color: '#E1EAF4', bg: 'rgba(225,234,244,.12)',label: 'Otro'          },
};

const FILTERS = ['Todos', 'Participación', 'Tickets', 'Stands', 'Infoproductos', 'Otros'] as const;
type Filter = typeof FILTERS[number];

const EMPTY_PROD = { name: '', category: 'ticket', description: '', price_list: '', price_min: '', emoji: '🎟️' };

export function NovoProductos() {
  const [products, setProducts]   = useState<CatalogProduct[]>([]);
  const [filter, setFilter]       = useState<Filter>('Todos');
  const [search, setSearch]       = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<CatalogProduct | null>(null);
  const [form, setForm]           = useState(EMPTY_PROD);
  const [saving, setSaving]       = useState(false);

  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    listProducts().then(setProducts).catch(() => setProducts([]));
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_PROD); setModalOpen(true); };
  const openEdit   = (p: CatalogProduct) => {
    setEditing(p);
    setForm({ name: p.name, category: String(p.category), description: p.description, price_list: String(p.price_list), price_min: String(p.price_min ?? ''), emoji: p.emoji });
    setModalOpen(true);
  };
  const handleSave = async () => {
    setSaving(true);
    const input = {
      name: form.name,
      category: form.category,
      description: form.description,
      price_list: Number(form.price_list) || 0,
      price_min: form.price_min.trim() === '' ? null : Number(form.price_min),
      emoji: form.emoji,
    };
    try {
      if (editing) {
        const saved = await updateProduct(editing.id, input);
        setProducts(prev => prev.map(p => p.id !== editing.id ? p : saved));
      } else {
        const saved = await createProduct(input);
        setProducts(prev => [saved, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar. Puede estar asignado a un evento.');
    }
  };
  const handleToggle = async (id: string) => {
    const current = products.find(p => p.id === id);
    if (!current) return;
    try {
      await setProductActive(id, !current.is_active);
      setProducts(prev => prev.map(p => p.id !== id ? p : { ...p, is_active: !p.is_active }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo actualizar.');
    }
  };
  const handleDuplicate = async (p: CatalogProduct) => {
    try {
      const copy = await duplicateProduct(p);
      setProducts(prev => [copy, ...prev]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo duplicar.');
    }
  };

  const filtered = products.filter(p => {
    const matchFilter =
      filter === 'Todos'         ||
      (filter === 'Participación' && p.category === 'participacion') ||
      (filter === 'Tickets'       && p.category === 'ticket')        ||
      (filter === 'Stands'        && p.category === 'stand')         ||
      (filter === 'Infoproductos' && p.category === 'infoproducto') ||
      (filter === 'Otros'         && p.category === 'otro');
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const activos = products.filter(p => p.is_active).length;
  const conMinimo = products.filter(p => p.price_min !== null).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>
            Catálogo global
          </p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>
            Productos
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#7A9CB8' }}>
            Reutilizables en cualquier evento · precio lista + mínimo autorizado
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}
          onClick={openCreate}
        >
          <PlusIcon size={15} strokeWidth={2.5} /> Nuevo producto
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <KPICard label="Productos activos" value={activos.toString()} sub="en catálogo global"
          icon={ShoppingBagIcon} delay={0} />
        <KPICard label="Con precio mínimo" value={conMinimo.toString()} sub="requieren aprobación"
          icon={TagIcon} accent="#F59E0B" delay={0.05} />
        <KPICard label="Categorías" value={String(Object.keys(CATEGORY_CONFIG).length)} sub="participación, ticket, stand…"
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
          {FILTERS.map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
              style={{ background: filter === f ? '#1e3450' : 'transparent', color: filter === f ? '#E1EAF4' : '#3A5470' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid #1e3450', background: '#112035' }}>
        <div
          className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-3"
          style={{ gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr auto', color: '#3A5470', borderBottom: '1px solid #1a2e45', background: '#182d47' }}
        >
          <span>Producto</span><span>Categoría</span><span>Precio lista</span><span>Precio mínimo</span><span>Estado</span><span className="w-20" />
        </div>

        {filtered.map((p, i) => {
          const cat = CATEGORY_CONFIG[p.category] ?? CATEGORY_CONFIG.ticket;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1], delay: i * 0.04 }}
              className="grid items-center px-5 py-4 transition-colors duration-150 cursor-pointer"
              style={{ gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr auto', borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none' }}
              onClick={() => openEdit(p)}
              onMouseEnter={e => (e.currentTarget.style.background = '#182d47')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ background: '#182d47', border: '1px solid #1e3450' }}>{p.emoji}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: '#E1EAF4' }}>{p.name}</p>
                  <p className="truncate text-xs mt-0.5" style={{ color: '#3A5470' }}>{p.description}</p>
                </div>
              </div>
              <div>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{ color: cat.color, background: cat.bg }}>{cat.label}</span>
              </div>
              <div>
                <p className="text-sm font-semibold tabular-nums" style={{ color: '#E1EAF4' }}>
                  {p.price_list === 0 ? 'Gratuito' : formatCurrency(p.price_list)}
                </p>
              </div>
              <div>
                <p className="text-sm tabular-nums" style={{ color: p.price_min ? '#F59E0B' : '#3A5470' }}>
                  {p.price_min ? formatCurrency(p.price_min) : '—'}
                </p>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{ color: p.is_active ? '#00C9A0' : '#3A5470', background: p.is_active ? 'rgba(0,201,160,.12)' : 'rgba(58,84,112,.12)' }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.is_active ? '#00C9A0' : '#3A5470' }} />
                  {p.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="w-20 flex justify-end">
                <RowActions
                  onEdit={() => openEdit(p)}
                  onDuplicate={() => handleDuplicate(p)}
                  onToggle={() => handleToggle(p.id)}
                  toggleActive={p.is_active}
                  onDelete={() => handleDelete(p.id)}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal crear / editar */}
      <NovoModal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar producto' : 'Nuevo producto'}
        subtitle={editing ? `Editando ${editing.name}` : 'Agregar producto al catálogo global'}
        width={520}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={handleSave} disabled={saving || !form.name}>
              {saving ? 'Guardando…' : editing ? 'Guardar' : 'Crear producto'}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Nombre" required>
            <FormInput value={form.name} onChange={f('name')} placeholder="Nombre del producto o plan" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Categoría">
              <FormSelect value={form.category} onChange={f('category')} options={[
                { value: 'participacion', label: 'Participación' },
                { value: 'ticket',        label: 'Ticket' },
                { value: 'stand',         label: 'Stand' },
                { value: 'infoproducto',  label: 'Infoproducto' },
                { value: 'certificado',   label: 'Certificado' },
                { value: 'otro',          label: 'Otro' },
              ]} />
            </FormField>
            <FormField label="Emoji">
              <FormInput value={form.emoji} onChange={f('emoji')} placeholder="🎟️" />
            </FormField>
            <FormField label="Precio lista (COP)" hint="0 = gratuito">
              <FormInput type="number" value={form.price_list} onChange={f('price_list')} placeholder="180000" />
            </FormField>
            <FormField label="Precio mínimo (COP)" hint="Dejar vacío si no aplica">
              <FormInput type="number" value={form.price_min} onChange={f('price_min')} placeholder="150000" />
            </FormField>
          </div>
          <FormField label="Descripción">
            <FormTextarea value={form.description} onChange={f('description')} placeholder="Qué incluye este producto o plan…" rows={2} />
          </FormField>
        </div>
      </NovoModal>
    </div>
  );
}
