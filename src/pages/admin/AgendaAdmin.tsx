import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { agendaTypeLabels } from '../../data/agenda';
import { Pending } from '../../components/ui/Pending';
import { publicationStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';
import { formatTimeRange } from '../../utils/format';
import { supabase } from '../../lib/supabaseClient';
import { AdminModal, modalFieldClass, ModalField } from '../../components/admin/AdminModal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { RowActions } from '../../components/admin/RowActions';
import { moveToTrash } from '../../lib/trash';

interface AgendaItem {
  id: string;
  edition_id: string;
  day: number;
  day_label: string;
  day_concept: string;
  date: string | null;
  start_time: string;
  end_time: string;
  title: string;
  description: string;
  type: keyof typeof agendaTypeLabels;
  track_id: string | null;
  room: string;
  order_num: number;
  visible: boolean;
  status: keyof typeof publicationStatusMeta;
}

interface Track { id: string; name: string; }
interface Speaker { id: string; name: string; }

const statusOptions = Object.entries(publicationStatusMeta) as [AgendaItem['status'], { label: string }][];

const emptyForm = (editionId: string): Omit<AgendaItem, 'id'> => ({
  edition_id: editionId,
  day: 1,
  day_label: '',
  day_concept: '',
  date: null,
  start_time: 'PENDIENTE',
  end_time: 'PENDIENTE',
  title: '',
  description: '',
  type: 'conferencia',
  track_id: null,
  room: '',
  order_num: 0,
  visible: true,
  status: 'borrador'
});

export function AgendaAdmin() {
  const { activeEditionId } = usePlatform();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [speakersByItem, setSpeakersByItem] = useState<Record<string, string[]>>({});
  const [activeDay, setActiveDay] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<AgendaItem, 'id'>>(emptyForm(activeEditionId));
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trashTarget, setTrashTarget] = useState<AgendaItem | null>(null);
  const [trashing, setTrashing] = useState(false);

  const load = async () => {
    const [{ data: itemRows }, { data: trackRows }, { data: speakerRows }, { data: linkRows }] = await Promise.all([
      supabase.from('agenda_items').select('*').eq('edition_id', activeEditionId).order('day').order('order_num'),
      supabase.from('tracks').select('id, name').eq('edition_id', activeEditionId),
      supabase.from('speakers').select('id, name').eq('edition_id', activeEditionId),
      supabase.from('agenda_item_speakers').select('agenda_item_id, speaker_id')
    ]);
    setItems(itemRows ?? []);
    setTracks(trackRows ?? []);
    setSpeakers(speakerRows ?? []);
    const grouped: Record<string, string[]> = {};
    (linkRows ?? []).forEach((row) => {
      grouped[row.agenda_item_id] = [...(grouped[row.agenda_item_id] ?? []), row.speaker_id];
    });
    setSpeakersByItem(grouped);
    if (itemRows && itemRows.length > 0) setActiveDay(itemRows[0].day);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditionId]);

  const days = useMemo(() => [...new Set(items.map((item) => item.day))].sort((a, b) => a - b), [items]);
  const dayItems = items.filter((item) => item.day === activeDay);
  const dayInfo = dayItems[0];

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm(activeEditionId), day: activeDay, day_label: dayInfo?.day_label ?? '', day_concept: dayInfo?.day_concept ?? '', date: dayInfo?.date ?? null });
    setSelectedSpeakers([]);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: AgendaItem) => {
    setEditingId(item.id);
    const { id: _id, ...rest } = item;
    setForm(rest);
    setSelectedSpeakers(speakersByItem[item.id] ?? []);
    setError(null);
    setModalOpen(true);
  };

  const openDuplicate = (item: AgendaItem) => {
    setEditingId(null);
    const { id: _id, ...rest } = item;
    setForm({ ...rest, title: `${item.title} (copia)` });
    setSelectedSpeakers(speakersByItem[item.id] ?? []);
    setError(null);
    setModalOpen(true);
  };

  const toggleSpeaker = (speakerId: string) => {
    setSelectedSpeakers((current) => current.includes(speakerId) ? current.filter((id) => id !== speakerId) : [...current, speakerId]);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    let itemId = editingId;
    if (editingId) {
      const { error: updateError } = await supabase.from('agenda_items').update(form).eq('id', editingId);
      if (updateError) {
        setSaving(false);
        setError(updateError.message);
        return;
      }
    } else {
      const { data, error: insertError } = await supabase.from('agenda_items').insert(form).select('id').single();
      if (insertError || !data) {
        setSaving(false);
        setError(insertError?.message ?? 'Error creando la actividad');
        return;
      }
      itemId = data.id;
    }

    await supabase.from('agenda_item_speakers').delete().eq('agenda_item_id', itemId);
    if (selectedSpeakers.length > 0) {
      await supabase.from('agenda_item_speakers').insert(selectedSpeakers.map((speakerId) => ({ agenda_item_id: itemId, speaker_id: speakerId })));
    }

    setSaving(false);
    setModalOpen(false);
    load();
  };

  const confirmTrash = async () => {
    if (!trashTarget) return;
    setTrashing(true);
    const { error: trashError } = await moveToTrash('agenda_items', trashTarget.id);
    setTrashing(false);
    if (trashError) {
      setError(trashError);
      return;
    }
    setTrashTarget(null);
    load();
  };

  return <>
      <ModuleHeader eyebrow="Operación" title="Agenda" description="Editor por día. Cada actividad tiene tipo, track y sala." actions={<div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-line p-0.5">
              {days.map((day) => <button key={day} type="button" onClick={() => setActiveDay(day)} className={`relative rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ease-emphasis ${day === activeDay ? 'text-white' : 'text-ink-muted'}`}>
                    {day === activeDay ? <motion.span layoutId="agenda-day-tab" className="absolute inset-0 rounded-md bg-brand" transition={{
              duration: DURATION.dropdown,
              ease: EASE_EMPHASIS
            }} /> : null}
                    <span className="relative">Día {day}</span>
                  </button>)}
            </div>
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
              <PlusIcon size={15} /> Nueva actividad
            </button>
          </div>} />

      {dayInfo ? <Panel emphasis title={dayInfo.day_label} description={dayInfo.day_concept}>
          <AnimatePresence mode="wait">
            <motion.div key={activeDay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16, ease: EASE_EMPHASIS }} className="overflow-x-auto">
              <table className="w-full min-w-[940px]">
                <thead className="bg-canvas">
                  <tr>
                    <th className={thClass}>Horario</th>
                    <th className={thClass}>Tipo</th>
                    <th className={thClass}>Actividad</th>
                    <th className={thClass}>Track</th>
                    <th className={thClass}>Speaker</th>
                    <th className={thClass}>Sala</th>
                    <th className={thClass}>Estado</th>
                    <th className={thClass} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {dayItems.map((item) => {
                  const track = tracks.find((entry) => entry.id === item.track_id);
                  const itemSpeakers = (speakersByItem[item.id] ?? []).map((id) => speakers.find((s) => s.id === id)?.name).filter(Boolean);
                  const meta = publicationStatusMeta[item.status];
                  return <tr key={item.id} className="transition-colors duration-150 hover:bg-canvas">
                        <td className={tdClass}>
                          {item.start_time === 'PENDIENTE' ? <Pending /> : formatTimeRange(item.start_time, item.end_time)}
                        </td>
                        <td className={`${tdClass} text-xs uppercase tracking-wide text-ink-muted`}>
                          {agendaTypeLabels[item.type]}
                        </td>
                        <td className={`${tdClass} font-medium text-brand`}>{item.title}</td>
                        <td className={tdClass}>{track?.name ?? '—'}</td>
                        <td className={tdClass}>{itemSpeakers.length === 0 ? '—' : itemSpeakers.join(', ')}</td>
                        <td className={tdClass}>
                          {item.room === 'PENDIENTE' || !item.room ? <Pending /> : item.room}
                        </td>
                        <td className={tdClass}>
                          <StatusBadge label={meta.label} tone={meta.tone} />
                        </td>
                        <td className={tdClass}>
                          <RowActions onEdit={() => openEdit(item)} onDuplicate={() => openDuplicate(item)} onDelete={() => setTrashTarget(item)} />
                        </td>
                      </tr>;
                })}
                </tbody>
              </table>
            </motion.div>
          </AnimatePresence>
        </Panel> : <Panel title="Sin agenda">
          <p className="px-5 py-10 text-center text-sm text-ink-muted">
            Esta edición todavía no tiene actividades cargadas.
          </p>
        </Panel>}

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar actividad' : 'Nueva actividad'} onSubmit={submit} submitting={saving} error={error}>
        <div className="space-y-4">
          <ModalField label="Título">
            <input className={modalFieldClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </ModalField>
          <ModalField label="Descripción">
            <textarea className={modalFieldClass} rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </ModalField>
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField label="Día">
              <input type="number" min={1} className={modalFieldClass} value={form.day} onChange={(event) => setForm({ ...form, day: Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Orden">
              <input type="number" className={modalFieldClass} value={form.order_num} onChange={(event) => setForm({ ...form, order_num: Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Etiqueta del día">
              <input className={modalFieldClass} value={form.day_label} onChange={(event) => setForm({ ...form, day_label: event.target.value })} />
            </ModalField>
            <ModalField label="Concepto del día">
              <input className={modalFieldClass} value={form.day_concept} onChange={(event) => setForm({ ...form, day_concept: event.target.value })} />
            </ModalField>
            <ModalField label="Fecha">
              <input type="date" className={modalFieldClass} value={form.date ?? ''} onChange={(event) => setForm({ ...form, date: event.target.value || null })} />
            </ModalField>
            <ModalField label="Sala">
              <input className={modalFieldClass} value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })} />
            </ModalField>
            <ModalField label="Inicio">
              <input className={modalFieldClass} value={form.start_time} onChange={(event) => setForm({ ...form, start_time: event.target.value })} />
            </ModalField>
            <ModalField label="Fin">
              <input className={modalFieldClass} value={form.end_time} onChange={(event) => setForm({ ...form, end_time: event.target.value })} />
            </ModalField>
            <ModalField label="Tipo">
              <select className={modalFieldClass} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as AgendaItem['type'] })}>
                {Object.entries(agendaTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </ModalField>
            <ModalField label="Track">
              <select className={modalFieldClass} value={form.track_id ?? ''} onChange={(event) => setForm({ ...form, track_id: event.target.value || null })}>
                <option value="">Sin track</option>
                {tracks.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}
              </select>
            </ModalField>
            <ModalField label="Estado">
              <select className={modalFieldClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as AgendaItem['status'] })}>
                {statusOptions.map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
            </ModalField>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-ink">
            <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={form.visible} onChange={(event) => setForm({ ...form, visible: event.target.checked })} />
            Visible
          </label>
          <ModalField label="Speakers">
            <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-lg border border-line p-3">
              {speakers.length === 0 ? <p className="text-xs text-ink-muted">No hay speakers cargados en esta edición.</p> : speakers.map((speaker) => <label key={speaker.id} className="flex items-center gap-2 text-sm text-ink">
                    <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={selectedSpeakers.includes(speaker.id)} onChange={() => toggleSpeaker(speaker.id)} />
                    {speaker.name || 'PENDIENTE'}
                  </label>)}
            </div>
          </ModalField>
        </div>
      </AdminModal>

      <ConfirmDialog open={Boolean(trashTarget)} title="¿Mover esta actividad a la papelera?" description={trashTarget?.title} onConfirm={confirmTrash} onCancel={() => setTrashTarget(null)} loading={trashing} confirmLabel="Mover a la papelera" />
    </>;
}
