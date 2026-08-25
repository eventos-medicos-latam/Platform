import React, { useEffect, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { ModuleHeader, Panel } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { standStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { supabase } from '../../lib/supabaseClient';
import { AdminModal, modalFieldClass, ModalField } from '../../components/admin/AdminModal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { RowActions } from '../../components/admin/RowActions';
import { moveToTrash } from '../../lib/trash';

interface Stand {
  id: string;
  edition_id: string;
  number: string;
  category: string;
  location: string;
  size: string;
  price: number | null;
  status: keyof typeof standStatusMeta;
  company_id: string | null;
  benefits: string[];
  plan_col: number;
  plan_row: number;
  plan_w: number;
  plan_h: number;
}

interface Company {
  id: string;
  trade_name: string;
}

const statusStyles: Record<Stand['status'], string> = {
  disponible: 'border-emerald-200 bg-emerald-50',
  reservado: 'border-amber-200 bg-amber-50',
  vendido: 'border-brand/30 bg-brand-soft',
  bloqueado: 'border-line bg-canvas',
  'no-disponible': 'border-rose-200 bg-rose-50'
};
const statusOptions = Object.entries(standStatusMeta) as [Stand['status'], { label: string }][];

const emptyForm = (editionId: string): Omit<Stand, 'id'> => ({
  edition_id: editionId,
  number: '',
  category: 'Stand',
  location: '',
  size: '',
  price: null,
  status: 'disponible',
  company_id: null,
  benefits: [],
  plan_col: 1,
  plan_row: 1,
  plan_w: 3,
  plan_h: 2
});

export function StandsAdmin() {
  const { activeEditionId } = usePlatform();
  const [stands, setStands] = useState<Stand[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Stand, 'id'>>(emptyForm(activeEditionId));
  const [benefitsText, setBenefitsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trashTarget, setTrashTarget] = useState<Stand | null>(null);
  const [trashing, setTrashing] = useState(false);

  const load = async () => {
    const [{ data: standRows }, { data: companyRows }] = await Promise.all([
      supabase.from('stands').select('*').eq('edition_id', activeEditionId).order('number'),
      supabase.from('companies').select('id, trade_name')
    ]);
    setStands(standRows ?? []);
    setCompanies(companyRows ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditionId]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(activeEditionId));
    setBenefitsText('');
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (stand: Stand) => {
    setEditingId(stand.id);
    const { id: _id, ...rest } = stand;
    setForm(rest);
    setBenefitsText(stand.benefits.join('\n'));
    setError(null);
    setModalOpen(true);
  };

  const openDuplicate = (stand: Stand) => {
    setEditingId(null);
    const { id: _id, ...rest } = stand;
    setForm({ ...rest, number: `${stand.number}-copia`, status: 'disponible', company_id: null });
    setBenefitsText(stand.benefits.join('\n'));
    setError(null);
    setModalOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    const payload = { ...form, benefits: benefitsText.split('\n').map((line) => line.trim()).filter(Boolean) };
    const { error: submitError } = editingId
      ? await supabase.from('stands').update(payload).eq('id', editingId)
      : await supabase.from('stands').insert(payload);
    setSaving(false);
    if (submitError) {
      setError(submitError.message);
      return;
    }
    setModalOpen(false);
    load();
  };

  const confirmTrash = async () => {
    if (!trashTarget) return;
    setTrashing(true);
    const { error: trashError } = await moveToTrash('stands', trashTarget.id);
    setTrashing(false);
    if (trashError) {
      setError(trashError);
      return;
    }
    setTrashTarget(null);
    load();
  };

  const counts = (Object.keys(statusStyles) as Stand['status'][]).map((status) => ({
    status,
    total: stands.filter((stand) => stand.status === status).length
  }));

  return <>
      <ModuleHeader eyebrow="Comercial" title="Mapa de stands" description="Zona comercial de la edición activa." actions={<button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
            <PlusIcon size={15} /> Nuevo stand
          </button>} />

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel emphasis title="Plano" description="Cada bloque es un stand con su estado actual.">
          <ul className="grid grid-cols-2 gap-3 px-5 py-5 sm:grid-cols-3 lg:grid-cols-4">
            {stands.map((stand) => {
            const meta = standStatusMeta[stand.status];
            const company = companies.find((item) => item.id === stand.company_id);
            return <li key={stand.id} className={`rounded-xl border p-4 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5 ${statusStyles[stand.status]}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-lg font-bold tabular-nums text-brand">{stand.number}</span>
                    <StatusBadge label={meta.label} tone={meta.tone} />
                  </div>
                  <p className="mt-2 text-xs font-medium text-ink">{stand.category}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{stand.location}</p>
                  <p className="mt-2 truncate text-xs font-semibold text-brand">
                    {company?.trade_name ?? '—'}
                  </p>
                  <div className="mt-3 flex justify-end border-t border-line/60 pt-2">
                    <RowActions onEdit={() => openEdit(stand)} onDuplicate={() => openDuplicate(stand)} onDelete={() => setTrashTarget(stand)} />
                  </div>
                </li>;
          })}
          </ul>
        </Panel>

        <Panel title="Disponibilidad" description="Resumen por estado.">
          <dl className="divide-y divide-line">
            {counts.map((entry) => <div key={entry.status} className="flex items-center justify-between gap-4 px-5 py-3">
                <dt className="flex items-center gap-2 text-sm text-ink-muted">
                  <span className={`h-3 w-3 rounded border ${statusStyles[entry.status]}`} aria-hidden="true" />
                  {standStatusMeta[entry.status].label}
                </dt>
                <dd className="text-sm font-semibold text-brand">{entry.total}</dd>
              </div>)}
            <div className="flex items-center justify-between gap-4 px-5 py-3">
              <dt className="text-sm font-semibold text-brand">Total</dt>
              <dd className="text-sm font-semibold text-brand">{stands.length}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar stand' : 'Nuevo stand'} onSubmit={submit} submitting={saving} error={error}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField label="Número">
              <input className={modalFieldClass} value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} />
            </ModalField>
            <ModalField label="Categoría">
              <input className={modalFieldClass} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
            </ModalField>
            <ModalField label="Ubicación">
              <input className={modalFieldClass} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            </ModalField>
            <ModalField label="Tamaño">
              <input className={modalFieldClass} value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} />
            </ModalField>
            <ModalField label="Precio (COP)">
              <input type="number" className={modalFieldClass} value={form.price ?? ''} onChange={(event) => setForm({ ...form, price: event.target.value === '' ? null : Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Estado">
              <select className={modalFieldClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Stand['status'] })}>
                {statusOptions.map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
            </ModalField>
            <ModalField label="Empresa asignada">
              <select className={modalFieldClass} value={form.company_id ?? ''} onChange={(event) => setForm({ ...form, company_id: event.target.value || null })}>
                <option value="">Sin asignar</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.trade_name}</option>)}
              </select>
            </ModalField>
          </div>
          <ModalField label="Beneficios (uno por línea)">
            <textarea className={modalFieldClass} rows={3} value={benefitsText} onChange={(event) => setBenefitsText(event.target.value)} />
          </ModalField>
          <div className="grid grid-cols-4 gap-3">
            <ModalField label="Col">
              <input type="number" className={modalFieldClass} value={form.plan_col} onChange={(event) => setForm({ ...form, plan_col: Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Fila">
              <input type="number" className={modalFieldClass} value={form.plan_row} onChange={(event) => setForm({ ...form, plan_row: Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Ancho">
              <input type="number" className={modalFieldClass} value={form.plan_w} onChange={(event) => setForm({ ...form, plan_w: Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Alto">
              <input type="number" className={modalFieldClass} value={form.plan_h} onChange={(event) => setForm({ ...form, plan_h: Number(event.target.value) })} />
            </ModalField>
          </div>
        </div>
      </AdminModal>

      <ConfirmDialog open={Boolean(trashTarget)} title="¿Mover este stand a la papelera?" description={trashTarget?.number} onConfirm={confirmTrash} onCancel={() => setTrashTarget(null)} loading={trashing} confirmLabel="Mover a la papelera" />
    </>;
}
