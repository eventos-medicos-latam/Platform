import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PencilIcon, PlusIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { formatCop, withVat } from '../../utils/format';
import { publicationStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { Pending } from '../../components/ui/Pending';
import { EASE_EMPHASIS } from '../../utils/motion';
import { supabase } from '../../lib/supabaseClient';
import { AdminModal, modalFieldClass, ModalField } from '../../components/admin/AdminModal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { RowActions } from '../../components/admin/RowActions';
import { moveToTrash } from '../../lib/trash';

interface InfoProduct {
  id: string;
  name: string;
  kind: string;
  format: string;
  claim: string;
  description: string;
  price: number | null;
  vat_rate: number;
  volume_label: string;
  includes: string[];
  status: keyof typeof publicationStatusMeta;
  featured: boolean;
  hotmart_checkout_url: string | null;
}

interface UpcomingProduct {
  id: number;
  name: string;
  category: string;
  claim: string;
  launch_window: string | null;
  pioneers: number;
  status: keyof typeof publicationStatusMeta;
}

const kindLabels: Record<string, string> = { curso: 'Curso', memorias: 'Memorias', guia: 'Guía', plantilla: 'Formatos', membresia: 'Membresía' };
const formatOptions = ['video', 'pdf', 'mixto', 'acceso'];

const emptyForm: Omit<InfoProduct, 'id'> = { name: '', kind: 'curso', format: 'video', claim: '', description: '', price: null, vat_rate: 0.19, volume_label: '', includes: [], status: 'borrador', featured: false, hotmart_checkout_url: null };

export function StoreAdmin() {
  const [products, setProducts] = useState<InfoProduct[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingProduct | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<InfoProduct, 'id'>>(emptyForm);
  const [includesText, setIncludesText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trashTarget, setTrashTarget] = useState<InfoProduct | null>(null);
  const [trashing, setTrashing] = useState(false);
  const [upcomingModalOpen, setUpcomingModalOpen] = useState(false);
  const [upcomingForm, setUpcomingForm] = useState<Omit<UpcomingProduct, 'id'> | null>(null);

  const load = async () => {
    const [{ data: productRows }, { data: upcomingRow }] = await Promise.all([
      supabase.from('info_products').select('*'),
      supabase.from('upcoming_products').select('*').maybeSingle()
    ]);
    setProducts(productRows ?? []);
    setUpcoming(upcomingRow);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setIncludesText(''); setError(null); setModalOpen(true); };
  const openEdit = (product: InfoProduct) => { setEditingId(product.id); const { id: _id, ...rest } = product; setForm(rest); setIncludesText(product.includes.join('\n')); setError(null); setModalOpen(true); };
  const openDuplicate = (product: InfoProduct) => { setEditingId(null); const { id: _id, ...rest } = product; setForm({ ...rest, name: `${product.name} (copia)`, status: 'borrador', featured: false }); setIncludesText(product.includes.join('\n')); setError(null); setModalOpen(true); };

  const submit = async () => {
    setSaving(true);
    setError(null);
    const payload = { ...form, includes: includesText.split('\n').map((line) => line.trim()).filter(Boolean) };
    const { error: submitError } = editingId
      ? await supabase.from('info_products').update(payload).eq('id', editingId)
      : await supabase.from('info_products').insert(payload);
    setSaving(false);
    if (submitError) { setError(submitError.message); return; }
    setModalOpen(false);
    load();
  };

  const confirmTrash = async () => {
    if (!trashTarget) return;
    setTrashing(true);
    const { error: trashError } = await moveToTrash('info_products', trashTarget.id);
    setTrashing(false);
    if (trashError) { setError(trashError); return; }
    setTrashTarget(null);
    load();
  };

  const openUpcomingEdit = () => {
    if (!upcoming) return;
    const { id: _id, ...rest } = upcoming;
    setUpcomingForm(rest);
    setUpcomingModalOpen(true);
  };
  const submitUpcoming = async () => {
    if (!upcoming || !upcomingForm) return;
    setSaving(true);
    setError(null);
    const { error: submitError } = await supabase.from('upcoming_products').update(upcomingForm).eq('id', upcoming.id);
    setSaving(false);
    if (submitError) { setError(submitError.message); return; }
    setUpcomingModalOpen(false);
    load();
  };

  return <>
      <ModuleHeader eyebrow="Contenido" title="Tienda digital" description="Catálogo de productos digitales (checkout real en Hotmart) y producto en desarrollo." actions={<button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
            <PlusIcon size={15} /> Nuevo producto
          </button>} />

      <Panel emphasis title={`${products.length} productos en catálogo`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-canvas">
              <tr>
                <th className={thClass}>Producto</th>
                <th className={thClass}>Tipo</th>
                <th className={thClass}>Formato</th>
                <th className={thClass}>Precio</th>
                <th className={thClass}>Precio final</th>
                <th className={thClass}>Hotmart</th>
                <th className={thClass}>Estado</th>
                <th className={thClass}>Destacado</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((product) => {
              const meta = publicationStatusMeta[product.status];
              return <tr key={product.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-medium text-brand`}>{product.name}</td>
                    <td className={tdClass}>{kindLabels[product.kind]}</td>
                    <td className={`${tdClass} capitalize`}>{product.format}</td>
                    <td className={tdClass}>{product.price === null ? <Pending /> : formatCop(product.price)}</td>
                    <td className={`${tdClass} font-semibold`}>{product.price === null ? '—' : formatCop(withVat(product.price, product.vat_rate))}</td>
                    <td className={tdClass}>{product.hotmart_checkout_url ? <StatusBadge label="Conectado" tone="success" /> : <StatusBadge label="Sin link" tone="draft" />}</td>
                    <td className={tdClass}>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </td>
                    <td className={tdClass}>
                      <motion.span className={`inline-block h-6 w-11 rounded-full p-0.5 ${product.featured ? 'bg-accent' : 'bg-line'}`}>
                        <motion.span className="block h-5 w-5 rounded-full bg-white shadow-elev1" animate={{ x: product.featured ? 20 : 0 }} transition={{ duration: 0.2, ease: EASE_EMPHASIS }} />
                      </motion.span>
                    </td>
                    <td className={tdClass}>
                      <RowActions onEdit={() => openEdit(product)} onDuplicate={() => openDuplicate(product)} onDelete={() => setTrashTarget(product)} />
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>
      </Panel>

      {upcoming ? <div className="mt-6">
          <Panel title={upcoming.name} description={`${upcoming.category} · comunicado como próximamente`} actions={<button type="button" onClick={openUpcomingEdit} className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-xs font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand/40">
                <PencilIcon size={14} /> Editar
              </button>}>
            <dl className="divide-y divide-line px-5 py-4">
              {[{ label: 'Lanzamiento estimado', value: upcoming.launch_window ?? 'PENDIENTE' }, { label: 'Pioneros registrados', value: String(upcoming.pioneers) }, { label: 'Estado', value: publicationStatusMeta[upcoming.status].label }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-sm text-ink-muted">{row.label}</dt>
                  <dd className="text-sm font-semibold text-brand">{row.value === 'PENDIENTE' ? <Pending /> : row.value}</dd>
                </div>)}
            </dl>
          </Panel>
        </div> : null}

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar producto' : 'Nuevo producto'} onSubmit={submit} submitting={saving} error={error}>
        <div className="space-y-4">
          <ModalField label="Nombre">
            <input className={modalFieldClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </ModalField>
          <ModalField label="Claim">
            <input className={modalFieldClass} value={form.claim} onChange={(event) => setForm({ ...form, claim: event.target.value })} />
          </ModalField>
          <ModalField label="Descripción">
            <textarea className={modalFieldClass} rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </ModalField>
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField label="Tipo">
              <select className={modalFieldClass} value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}>
                {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </ModalField>
            <ModalField label="Formato">
              <select className={modalFieldClass} value={form.format} onChange={(event) => setForm({ ...form, format: event.target.value })}>
                {formatOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </ModalField>
            <ModalField label="Precio (COP)">
              <input type="number" className={modalFieldClass} value={form.price ?? ''} onChange={(event) => setForm({ ...form, price: event.target.value === '' ? null : Number(event.target.value) })} />
            </ModalField>
            <ModalField label="IVA">
              <input type="number" step="0.01" className={modalFieldClass} value={form.vat_rate} onChange={(event) => setForm({ ...form, vat_rate: Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Volumen (etiqueta)">
              <input className={modalFieldClass} value={form.volume_label} onChange={(event) => setForm({ ...form, volume_label: event.target.value })} />
            </ModalField>
            <ModalField label="Estado">
              <select className={modalFieldClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as InfoProduct['status'] })}>
                {Object.entries(publicationStatusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
            </ModalField>
          </div>
          <ModalField label="Incluye (uno por línea)">
            <textarea className={modalFieldClass} rows={3} value={includesText} onChange={(event) => setIncludesText(event.target.value)} />
          </ModalField>
          <ModalField label="Link de checkout en Hotmart">
            <input className={modalFieldClass} placeholder="https://pay.hotmart.com/..." value={form.hotmart_checkout_url ?? ''} onChange={(event) => setForm({ ...form, hotmart_checkout_url: event.target.value || null })} />
          </ModalField>
          <label className="flex items-center gap-2.5 text-sm text-ink">
            <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} />
            Destacado
          </label>
        </div>
      </AdminModal>

      {upcomingForm ? <AdminModal open={upcomingModalOpen} onClose={() => setUpcomingModalOpen(false)} title="Editar producto en desarrollo" onSubmit={submitUpcoming} submitting={saving} error={error}>
          <div className="space-y-4">
            <ModalField label="Nombre">
              <input className={modalFieldClass} value={upcomingForm.name} onChange={(event) => setUpcomingForm({ ...upcomingForm, name: event.target.value })} />
            </ModalField>
            <ModalField label="Categoría">
              <input className={modalFieldClass} value={upcomingForm.category} onChange={(event) => setUpcomingForm({ ...upcomingForm, category: event.target.value })} />
            </ModalField>
            <ModalField label="Claim">
              <input className={modalFieldClass} value={upcomingForm.claim} onChange={(event) => setUpcomingForm({ ...upcomingForm, claim: event.target.value })} />
            </ModalField>
            <div className="grid gap-4 sm:grid-cols-2">
              <ModalField label="Ventana de lanzamiento">
                <input className={modalFieldClass} value={upcomingForm.launch_window ?? ''} onChange={(event) => setUpcomingForm({ ...upcomingForm, launch_window: event.target.value || null })} />
              </ModalField>
              <ModalField label="Pioneros registrados">
                <input type="number" className={modalFieldClass} value={upcomingForm.pioneers} onChange={(event) => setUpcomingForm({ ...upcomingForm, pioneers: Number(event.target.value) })} />
              </ModalField>
            </div>
            <ModalField label="Estado">
              <select className={modalFieldClass} value={upcomingForm.status} onChange={(event) => setUpcomingForm({ ...upcomingForm, status: event.target.value as UpcomingProduct['status'] })}>
                {Object.entries(publicationStatusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
            </ModalField>
          </div>
        </AdminModal> : null}

      <ConfirmDialog open={Boolean(trashTarget)} title="¿Mover este producto a la papelera?" description={trashTarget?.name} onConfirm={confirmTrash} onCancel={() => setTrashTarget(null)} loading={trashing} confirmLabel="Mover a la papelera" />
    </>;
}
