import React, { useEffect, useState } from 'react';
import { LockIcon, PlusIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { speakerStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { Pending } from '../../components/ui/Pending';
import { supabase } from '../../lib/supabaseClient';
import { AdminModal, modalFieldClass, ModalField } from '../../components/admin/AdminModal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { RowActions } from '../../components/admin/RowActions';
import { moveToTrash } from '../../lib/trash';

interface Speaker {
  id: string;
  edition_id: string;
  slot_label: string;
  name: string;
  specialty: string;
  role: string;
  institution: string;
  country: string;
  city: string;
  bio: string;
  talks: string[];
  track_id: string | null;
  order_num: number;
  featured: boolean;
  status: keyof typeof speakerStatusMeta;
}

interface Track {
  id: string;
  name: string;
}

const statusOptions = Object.entries(speakerStatusMeta) as [Speaker['status'], { label: string }][];

const emptyForm = (editionId: string): Omit<Speaker, 'id'> => ({
  edition_id: editionId,
  slot_label: '',
  name: '',
  specialty: '',
  role: '',
  institution: '',
  country: '',
  city: '',
  bio: '',
  talks: [''],
  track_id: null,
  order_num: 0,
  featured: false,
  status: 'invitado'
});

export function SpeakersAdmin() {
  const { activeEditionId } = usePlatform();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Speaker, 'id'>>(emptyForm(activeEditionId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trashTarget, setTrashTarget] = useState<Speaker | null>(null);
  const [trashing, setTrashing] = useState(false);

  const load = async () => {
    const [{ data: speakerRows }, { data: trackRows }] = await Promise.all([
      supabase.from('speakers').select('*').eq('edition_id', activeEditionId).order('order_num'),
      supabase.from('tracks').select('id, name').eq('edition_id', activeEditionId)
    ]);
    setSpeakers(speakerRows ?? []);
    setTracks(trackRows ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditionId]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(activeEditionId));
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (speaker: Speaker) => {
    setEditingId(speaker.id);
    setForm({ ...speaker, talks: speaker.talks.length > 0 ? speaker.talks : [''] });
    setError(null);
    setModalOpen(true);
  };

  const openDuplicate = (speaker: Speaker) => {
    setEditingId(null);
    setForm({ ...speaker, slot_label: `${speaker.slot_label} (copia)`, status: 'invitado' });
    setError(null);
    setModalOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    const payload = { ...form, talks: form.talks.filter((talk) => talk.trim() !== '') };
    const { error: submitError } = editingId
      ? await supabase.from('speakers').update(payload).eq('id', editingId)
      : await supabase.from('speakers').insert(payload);
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
    const { error: trashError } = await moveToTrash('speakers', trashTarget.id);
    setTrashing(false);
    if (trashError) {
      setError(trashError);
      return;
    }
    setTrashTarget(null);
    load();
  };

  const publishable = speakers.filter((speaker) => speaker.status === 'confirmado' || speaker.status === 'publicado').length;

  return <>
      <ModuleHeader eyebrow="Operación" title="Speakers" description="Un speaker solo puede publicarse cuando está confirmado. El resto vive aquí, nunca en la web." actions={<button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
            <PlusIcon size={15} /> Nuevo speaker
          </button>} />

      <Panel emphasis title={`${speakers.length} espacios académicos`} description={`${publishable} pueden publicarse hoy`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-canvas">
              <tr>
                <th className={thClass}>Espacio</th>
                <th className={thClass}>Nombre</th>
                <th className={thClass}>Especialidad</th>
                <th className={thClass}>Track</th>
                <th className={thClass}>Tema</th>
                <th className={thClass}>Estado</th>
                <th className={thClass}>Publicable</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {speakers.map((speaker) => {
              const meta = speakerStatusMeta[speaker.status];
              const track = tracks.find((item) => item.id === speaker.track_id);
              const canPublish = speaker.status === 'confirmado' || speaker.status === 'publicado';
              return <tr key={speaker.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} text-xs uppercase tracking-wide text-ink-muted`}>
                      {speaker.slot_label}
                    </td>
                    <td className={`${tdClass} font-medium text-brand`}>
                      {speaker.name === 'PENDIENTE' || !speaker.name ? <Pending /> : speaker.name}
                    </td>
                    <td className={tdClass}>{speaker.specialty}</td>
                    <td className={tdClass}>{track?.name ?? '—'}</td>
                    <td className={tdClass}>
                      {speaker.talks[0] === 'PENDIENTE' || !speaker.talks[0] ? <Pending /> : speaker.talks[0]}
                    </td>
                    <td className={tdClass}>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </td>
                    <td className={tdClass}>
                      {canPublish ? 'Sí' : <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                          <LockIcon size={13} /> Bloqueado
                        </span>}
                    </td>
                    <td className={tdClass}>
                      <RowActions onEdit={() => openEdit(speaker)} onDuplicate={() => openDuplicate(speaker)} onDelete={() => setTrashTarget(speaker)} />
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>
      </Panel>

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar speaker' : 'Nuevo speaker'} onSubmit={submit} submitting={saving} error={error}>
        <div className="space-y-4">
          <ModalField label="Espacio (slot)">
            <input className={modalFieldClass} value={form.slot_label} onChange={(event) => setForm({ ...form, slot_label: event.target.value })} />
          </ModalField>
          <ModalField label="Nombre">
            <input className={modalFieldClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </ModalField>
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField label="Especialidad">
              <input className={modalFieldClass} value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} />
            </ModalField>
            <ModalField label="Rol">
              <input className={modalFieldClass} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
            </ModalField>
            <ModalField label="Institución">
              <input className={modalFieldClass} value={form.institution} onChange={(event) => setForm({ ...form, institution: event.target.value })} />
            </ModalField>
            <ModalField label="País / Ciudad">
              <div className="flex gap-2">
                <input className={modalFieldClass} placeholder="País" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
                <input className={modalFieldClass} placeholder="Ciudad" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
              </div>
            </ModalField>
          </div>
          <ModalField label="Bio">
            <textarea className={modalFieldClass} rows={3} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
          </ModalField>
          <ModalField label="Tema de la charla">
            <input className={modalFieldClass} value={form.talks[0] ?? ''} onChange={(event) => setForm({ ...form, talks: [event.target.value] })} />
          </ModalField>
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField label="Track">
              <select className={modalFieldClass} value={form.track_id ?? ''} onChange={(event) => setForm({ ...form, track_id: event.target.value || null })}>
                <option value="">Sin track</option>
                {tracks.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}
              </select>
            </ModalField>
            <ModalField label="Estado">
              <select className={modalFieldClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Speaker['status'] })}>
                {statusOptions.map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
            </ModalField>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-ink">
            <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} />
            Destacado
          </label>
        </div>
      </AdminModal>

      <ConfirmDialog open={Boolean(trashTarget)} title="¿Mover este speaker a la papelera?" description={trashTarget?.name} onConfirm={confirmTrash} onCancel={() => setTrashTarget(null)} loading={trashing} confirmLabel="Mover a la papelera" />
    </>;
}
