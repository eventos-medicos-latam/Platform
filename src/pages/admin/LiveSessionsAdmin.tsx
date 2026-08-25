import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { publicationStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { Pending } from '../../components/ui/Pending';
import { usePlatform } from '../../contexts/PlatformContext';
import { supabase } from '../../lib/supabaseClient';
import { AdminModal, modalFieldClass, ModalField } from '../../components/admin/AdminModal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { RowActions } from '../../components/admin/RowActions';
import { moveToTrash } from '../../lib/trash';

interface SecondaryEvent {
  id: string;
  title: string;
  kind: string;
  date: string | null;
  time: string;
  speaker_label: string;
  modality: string;
  price: number | null;
  seats: number | null;
  registered: number;
  related_edition_id: string | null;
  crm_tag: string;
  status: keyof typeof publicationStatusMeta;
  description: string | null;
  duration_minutes: number | null;
  platform: string | null;
  track_id: string | null;
}

const kindLabels: Record<string, string> = { webinar: 'Webinar', conversatorio: 'Conversatorio', masterclass: 'Masterclass', curso: 'Curso', lanzamiento: 'Lanzamiento' };
const modalityOptions = ['presencial', 'virtual', 'hibrido'];
type Filter = 'todos' | keyof typeof kindLabels;

const emptyForm = (editionId: string): Omit<SecondaryEvent, 'id'> => ({
  title: '', kind: 'webinar', date: null, time: 'PENDIENTE', speaker_label: 'PENDIENTE', modality: 'virtual', price: 0, seats: null, registered: 0, related_edition_id: editionId, crm_tag: '', status: 'borrador', description: '', duration_minutes: null, platform: null, track_id: null
});

export function LiveSessionsAdmin() {
  const { activeEditionId } = usePlatform();
  const [sessions, setSessions] = useState<SecondaryEvent[]>([]);
  const [filter, setFilter] = useState<Filter>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SecondaryEvent, 'id'>>(emptyForm(activeEditionId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trashTarget, setTrashTarget] = useState<SecondaryEvent | null>(null);
  const [trashing, setTrashing] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('secondary_events').select('*').order('date');
    setSessions(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const list = useMemo(() => sessions.filter((item) => filter === 'todos' || item.kind === filter), [sessions, filter]);
  const totals = useMemo(() => ({
    publicadas: sessions.filter((item) => item.status === 'publicado').length,
    aprobadas: sessions.filter((item) => item.status === 'aprobado').length,
    borrador: sessions.filter((item) => item.status === 'borrador').length,
    inscritos: sessions.reduce((sum, item) => sum + item.registered, 0)
  }), [sessions]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm(activeEditionId)); setError(null); setModalOpen(true); };
  const openEdit = (session: SecondaryEvent) => { setEditingId(session.id); const { id: _id, ...rest } = session; setForm(rest); setError(null); setModalOpen(true); };
  const openDuplicate = (session: SecondaryEvent) => { setEditingId(null); const { id: _id, ...rest } = session; setForm({ ...rest, title: `${session.title} (copia)`, registered: 0, status: 'borrador' }); setError(null); setModalOpen(true); };

  const submit = async () => {
    setSaving(true);
    setError(null);
    const { error: submitError } = editingId
      ? await supabase.from('secondary_events').update(form).eq('id', editingId)
      : await supabase.from('secondary_events').insert(form);
    setSaving(false);
    if (submitError) { setError(submitError.message); return; }
    setModalOpen(false);
    load();
  };

  const confirmTrash = async () => {
    if (!trashTarget) return;
    setTrashing(true);
    const { error: trashError } = await moveToTrash('secondary_events', trashTarget.id);
    setTrashing(false);
    if (trashError) { setError(trashError); return; }
    setTrashTarget(null);
    load();
  };

  return <>
      <ModuleHeader eyebrow="Contenido" title="Formación en vivo" description="Webinars, conversatorios y masterclass. Alimenta la agenda digital pública." actions={<button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
            <PlusIcon size={15} /> Nueva sesión
          </button>} />

      <dl className="mb-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {[{ label: 'Publicadas', value: totals.publicadas }, { label: 'Aprobadas sin publicar', value: totals.aprobadas }, { label: 'En borrador', value: totals.borrador }, { label: 'Inscritos acumulados', value: totals.inscritos }].map((item) => <div key={item.label} className="bg-white px-5 py-4">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{item.label}</dt>
            <dd className="mt-1.5 text-2xl font-bold tabular-nums text-brand">{item.value}</dd>
          </div>)}
      </dl>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(['todos', 'webinar', 'conversatorio', 'masterclass', 'lanzamiento'] as Filter[]).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150 ease-emphasis ${filter === item ? 'bg-brand text-white' : 'border border-line bg-white text-ink-muted hover:text-brand'}`}>
            {item === 'todos' ? 'Todas' : kindLabels[item]}
          </button>)}
      </div>

      <Panel emphasis title={`${list.length} sesiones`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px]">
            <thead className="bg-canvas">
              <tr>
                <th className={thClass}>Sesión</th>
                <th className={thClass}>Tipo</th>
                <th className={thClass}>Fecha</th>
                <th className={thClass}>Ponente</th>
                <th className={thClass}>Modalidad</th>
                <th className={thClass}>Cupo</th>
                <th className={thClass}>Inscritos</th>
                <th className={thClass}>Estado</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((session) => {
              const meta = publicationStatusMeta[session.status];
              return <tr key={session.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-medium text-brand`}>{session.title}</td>
                    <td className={tdClass}>{kindLabels[session.kind]}</td>
                    <td className={tdClass}>{session.date}</td>
                    <td className={tdClass}>{session.speaker_label === 'PENDIENTE' ? <Pending /> : session.speaker_label}</td>
                    <td className={`${tdClass} capitalize`}>{session.modality}</td>
                    <td className={tdClass}>{session.seats === null ? <Pending /> : session.seats}</td>
                    <td className={`${tdClass} font-semibold tabular-nums`}>{session.registered}</td>
                    <td className={tdClass}>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </td>
                    <td className={tdClass}>
                      <RowActions onEdit={() => openEdit(session)} onDuplicate={() => openDuplicate(session)} onDelete={() => setTrashTarget(session)} />
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>
      </Panel>

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar sesión' : 'Nueva sesión'} onSubmit={submit} submitting={saving} error={error}>
        <div className="space-y-4">
          <ModalField label="Título">
            <input className={modalFieldClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </ModalField>
          <ModalField label="Descripción">
            <textarea className={modalFieldClass} rows={2} value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </ModalField>
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField label="Tipo">
              <select className={modalFieldClass} value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}>
                {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </ModalField>
            <ModalField label="Modalidad">
              <select className={modalFieldClass} value={form.modality} onChange={(event) => setForm({ ...form, modality: event.target.value })}>
                {modalityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </ModalField>
            <ModalField label="Fecha">
              <input type="date" className={modalFieldClass} value={form.date ?? ''} onChange={(event) => setForm({ ...form, date: event.target.value || null })} />
            </ModalField>
            <ModalField label="Hora">
              <input className={modalFieldClass} value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} />
            </ModalField>
            <ModalField label="Duración (min)">
              <input type="number" className={modalFieldClass} value={form.duration_minutes ?? ''} onChange={(event) => setForm({ ...form, duration_minutes: event.target.value === '' ? null : Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Ponente">
              <input className={modalFieldClass} value={form.speaker_label} onChange={(event) => setForm({ ...form, speaker_label: event.target.value })} />
            </ModalField>
            <ModalField label="Plataforma">
              <input className={modalFieldClass} value={form.platform ?? ''} onChange={(event) => setForm({ ...form, platform: event.target.value || null })} />
            </ModalField>
            <ModalField label="Cupo (vacío = ilimitado)">
              <input type="number" className={modalFieldClass} value={form.seats ?? ''} onChange={(event) => setForm({ ...form, seats: event.target.value === '' ? null : Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Inscritos">
              <input type="number" className={modalFieldClass} value={form.registered} onChange={(event) => setForm({ ...form, registered: Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Etiqueta CRM">
              <input className={modalFieldClass} value={form.crm_tag} onChange={(event) => setForm({ ...form, crm_tag: event.target.value })} />
            </ModalField>
            <ModalField label="Estado">
              <select className={modalFieldClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as SecondaryEvent['status'] })}>
                {Object.entries(publicationStatusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
            </ModalField>
          </div>
        </div>
      </AdminModal>

      <ConfirmDialog open={Boolean(trashTarget)} title="¿Mover esta sesión a la papelera?" description={trashTarget?.title} onConfirm={confirmTrash} onCancel={() => setTrashTarget(null)} loading={trashing} confirmLabel="Mover a la papelera" />
    </>;
}
