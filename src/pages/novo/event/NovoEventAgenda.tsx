import React, { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDaysIcon, MicIcon, UsersIcon, CoffeeIcon,
  PlusIcon, LayoutListIcon, GridIcon, StarIcon,
} from 'lucide-react';
import type { NovoEventOutlet } from '../../../types/novo';
import { RowActions } from '../../../components/novo/ui/RowActions';
import {
  NovoModal, ModalBtn,
  FormField, FormInput, FormSelect, FormTextarea, FormSection,
} from '../../../components/novo/ui/NovoModal';
import {
  createAgendaItem, deleteAgendaItem, duplicateAgendaItem, listAgenda,
  listAgendaSpeakerChoices, listSpaces, updateAgendaItem,
  type AgendaActivityType, type AgendaItemRow, type AgendaSpeakerChoice, type EventSpaceRow,
} from '../../../lib/novo/agenda';

const TYPE_CONFIG: Record<AgendaActivityType, { label: string; color: string; icon: React.ElementType }> = {
  conferencia: { label: 'Conferencia', color: '#00C9A0', icon: MicIcon         },
  panel:       { label: 'Panel',       color: '#5B8AF0', icon: UsersIcon       },
  taller:      { label: 'Taller',      color: '#A78BFA', icon: LayoutListIcon  },
  break:       { label: 'Break',       color: '#F59E0B', icon: CoffeeIcon      },
  operacion:   { label: 'Operación',   color: '#3A5470', icon: CalendarDaysIcon },
};

const EMPTY_FORM = {
  name: '',
  activity_type: 'conferencia' as AgendaActivityType,
  item_date: '',
  start_time: '09:00',
  end_time: '10:00',
  space_id: '',
  new_space_name: '',
  description: '',
  is_highlight: false,
  speaker_profile_ids: [] as string[],
};

function formatDay(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}

function groupByDate(items: AgendaItemRow[]) {
  const groups: { date: string; items: AgendaItemRow[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.date === item.item_date) last.items.push(item);
    else groups.push({ date: item.item_date, items: [item] });
  }
  return groups;
}

export function NovoEventAgenda() {
  const { event } = useOutletContext<NovoEventOutlet>();
  const eventStart = (event.start_date ?? '').slice(0, 10);
  const eventEnd = (event.end_date ?? eventStart).slice(0, 10);
  const multiDay = Boolean(eventStart && eventEnd && eventStart !== eventEnd);

  const [sessions, setSessions] = useState<AgendaItemRow[]>([]);
  const [spaces, setSpaces] = useState<EventSpaceRow[]>([]);
  const [speakers, setSpeakers] = useState<AgendaSpeakerChoice[]>([]);
  const [selected, setSelected] = useState<AgendaItemRow | null>(null);
  const [view, setView] = useState<'list' | 'timeline'>('list');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AgendaItemRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const f = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const reloadMeta = () => {
    listSpaces(event.id).then(setSpaces).catch(() => setSpaces([]));
    listAgendaSpeakerChoices(event.id).then(setSpeakers).catch(() => setSpeakers([]));
  };

  const reload = () => {
    listAgenda(event.id)
      .then((rows) => {
        setSessions(rows);
        setSelected((current) => current ? rows.find((row) => row.id === current.id) ?? null : null);
      })
      .catch((err) => {
        setSessions([]);
        setError(err instanceof Error ? err.message : 'No se pudo cargar la agenda.');
      });
  };

  useEffect(() => {
    setError(null);
    reload();
    reloadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const openCreate = () => {
    setEditing(null);
    setError(null);
    setForm({ ...EMPTY_FORM, item_date: eventStart });
    setModalOpen(true);
  };
  const openEdit = (s: AgendaItemRow) => {
    setEditing(s);
    setError(null);
    setForm({
      name: s.name,
      activity_type: s.activity_type,
      item_date: s.item_date,
      start_time: s.start_time,
      end_time: s.end_time,
      space_id: s.space_id ?? '',
      new_space_name: '',
      description: s.description,
      is_highlight: s.is_highlight,
      speaker_profile_ids: s.speaker_profile_ids,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (form.end_time && form.start_time && form.end_time <= form.start_time) {
      setError('La hora de fin debe ser posterior a la de inicio.');
      return;
    }
    setSaving(true);
    setError(null);
    const input = {
      event_id: event.id,
      name: form.name,
      activity_type: form.activity_type,
      item_date: form.item_date || eventStart,
      start_time: form.start_time,
      end_time: form.end_time,
      space_id: form.space_id || null,
      new_space_name: form.new_space_name,
      description: form.description,
      is_highlight: form.is_highlight,
      speaker_profile_ids: form.speaker_profile_ids,
    };
    try {
      const saved = editing
        ? await updateAgendaItem(editing.id, input)
        : await createAgendaItem(input);
      setSessions(prev => {
        const next = editing ? prev.map(s => s.id === editing.id ? saved : s) : [...prev, saved];
        return next.sort((a, b) => a.item_date.localeCompare(b.item_date) || a.start_time.localeCompare(b.start_time));
      });
      if (selected?.id === editing?.id) setSelected(saved);
      reloadMeta();
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la sesión.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta sesión?')) return;
    try {
      await deleteAgendaItem(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    }
  };

  const handleDuplicate = async (s: AgendaItemRow) => {
    try {
      const copy = await duplicateAgendaItem(s);
      setSessions(prev => [...prev, copy].sort((a, b) =>
        a.item_date.localeCompare(b.item_date) || a.start_time.localeCompare(b.start_time)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo duplicar.');
    }
  };

  const toggleSpeaker = (id: string) => {
    setForm(p => ({
      ...p,
      speaker_profile_ids: p.speaker_profile_ids.includes(id)
        ? p.speaker_profile_ids.filter(item => item !== id)
        : [...p.speaker_profile_ids, id],
    }));
  };

  const totalMin = sessions.reduce((acc, s) => {
    const [sh, sm] = s.start_time.split(':').map(Number);
    const [eh, em] = s.end_time.split(':').map(Number);
    return acc + Math.max(0, eh * 60 + em - sh * 60 - sm);
  }, 0);

  const groups = useMemo(() => groupByDate(sessions), [sessions]);
  const assignedSpeakers = speakers.filter(s => s.assigned);
  const catalogSpeakers = speakers.filter(s => !s.assigned);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Agenda del Evento</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>
            {sessions.length === 0
              ? 'Aún no hay sesiones. La web pública tomará este programa.'
              : `${sessions.length} sesiones · ${Math.max(1, Math.round(totalMin / 60))}h programadas`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #1e3450' }}>
            {(['list', 'timeline'] as const).map(v => (
              <button key={v} type="button" onClick={() => setView(v)} className="px-3 py-2 transition-colors"
                style={{ background: view === v ? '#182d47' : '#112035' }}>
                {v === 'list'
                  ? <LayoutListIcon size={14} style={{ color: view === v ? '#E1EAF4' : '#2a4a6b' }} />
                  : <GridIcon       size={14} style={{ color: view === v ? '#E1EAF4' : '#2a4a6b' }} />}
              </button>
            ))}
          </div>
          <button type="button" onClick={openCreate}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-95"
            style={{ background: '#00C9A0', color: '#0d1829' }}>
            <PlusIcon size={13} /> Nueva sesión
          </button>
        </div>
      </div>

      {error && !modalOpen ? (
        <p className="mb-4 rounded-xl px-4 py-2.5 text-xs" style={{ background: 'rgba(242,68,99,.12)', color: '#F24463' }}>{error}</p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-3">
        {(Object.entries(TYPE_CONFIG) as [AgendaActivityType, typeof TYPE_CONFIG[AgendaActivityType]][]).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: cfg.color }} />
            <span className="text-[10px] font-semibold" style={{ color: '#7A9CB8' }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        <div className="flex-1 overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
          {sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <p className="text-sm" style={{ color: '#7A9CB8' }}>Todavía no hay programa para este evento.</p>
              <p className="text-xs mt-1" style={{ color: '#3A5470' }}>Crea la primera sesión: conferencia, panel, taller o break.</p>
            </div>
          )}
          {groups.map((group, gi) => (
            <div key={group.date}>
              {(multiDay || view === 'timeline' || groups.length > 1) && (
                <p className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest capitalize"
                  style={{ color: '#7A9CB8', background: '#182d47', borderBottom: '1px solid #1e3450' }}>
                  {formatDay(group.date)}
                </p>
              )}
              {group.items.map((sess, i) => {
                const cfg = TYPE_CONFIG[sess.activity_type];
                const isSelected = selected?.id === sess.id;
                const last = gi === groups.length - 1 && i === group.items.length - 1;
                return (
                  <motion.div key={sess.id}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.02 }}
                    onClick={() => setSelected(isSelected ? null : sess)}
                    className="flex gap-4 px-5 py-4 cursor-pointer transition-colors group"
                    style={{
                      borderBottom: last ? 'none' : '1px solid #1a2e45',
                      background: isSelected ? '#182d47' : 'transparent',
                      borderLeft: `3px solid ${cfg.color}`,
                    }}
                    onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'rgba(24,45,71,0.4)')}
                    onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="w-20 shrink-0">
                      <p className="text-xs font-bold tabular-nums" style={{ color: '#E1EAF4' }}>{sess.start_time}</p>
                      <p className="text-[10px]" style={{ color: '#3A5470' }}>{sess.end_time}</p>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>
                      <cfg.icon size={14} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold" style={{ color: '#E1EAF4' }}>{sess.name}</p>
                        {sess.is_highlight ? <StarIcon size={11} style={{ color: '#F59E0B' }} /> : null}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-0.5">
                        {sess.speaker_names.length > 0 && (
                          <p className="text-[10px]" style={{ color: '#7A9CB8' }}>
                            <MicIcon size={9} className="inline mr-0.5" />
                            {sess.speaker_names.join(' · ')}
                          </p>
                        )}
                        {sess.space_name && <p className="text-[10px]" style={{ color: '#3A5470' }}>{sess.space_name}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ color: cfg.color, background: `${cfg.color}15` }}>
                        {cfg.label}
                      </span>
                      <RowActions
                        onEdit={() => openEdit(sess)}
                        onDuplicate={() => { void handleDuplicate(sess); }}
                        onDelete={() => { void handleDelete(sess.id); }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 268 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden shrink-0 rounded-2xl"
              style={{ background: '#112035', border: '1px solid #1e3450' }}
            >
              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full" style={{ background: TYPE_CONFIG[selected.activity_type].color }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: TYPE_CONFIG[selected.activity_type].color }}>
                    {TYPE_CONFIG[selected.activity_type].label}
                  </span>
                </div>
                <p className="text-sm font-bold mb-4 leading-snug" style={{ color: '#E1EAF4' }}>{selected.name}</p>
                {[
                  { label: 'Día',     value: formatDay(selected.item_date) },
                  { label: 'Horario', value: `${selected.start_time} – ${selected.end_time}` },
                  ...(selected.speaker_names.length ? [{ label: 'Ponente', value: selected.speaker_names.join(' · ') }] : []),
                  ...(selected.space_name ? [{ label: 'Sala', value: selected.space_name }] : []),
                ].map((item) => (
                  <div key={item.label} className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: '#3A5470' }}>{item.label}</p>
                    <p className="text-xs capitalize" style={{ color: '#7A9CB8' }}>{item.value}</p>
                  </div>
                ))}
                {selected.description && (
                  <div className="mt-3 rounded-xl p-3.5" style={{ background: '#0d1829', border: '1px solid #1e3450' }}>
                    <p className="text-xs leading-relaxed" style={{ color: '#7A9CB8' }}>{selected.description}</p>
                  </div>
                )}
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => openEdit(selected)}
                    className="flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-95"
                    style={{ background: 'rgba(0,201,160,.1)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
                    Editar
                  </button>
                  <button type="button" onClick={() => { void handleDelete(selected.id); }}
                    className="rounded-xl px-3 py-2.5 text-xs font-semibold transition-all active:scale-95"
                    style={{ background: 'rgba(242,68,99,.08)', color: '#F24463', border: '1px solid rgba(242,68,99,.2)' }}>
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NovoModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar sesión' : 'Nueva sesión'}
        subtitle={editing ? `Editando: ${editing.name}` : 'Se guarda en la agenda real de este evento'}
        width={580}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={() => { void handleSave(); }} disabled={saving || !form.name}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear sesión'}
            </ModalBtn>
          </>
        }
      >
        {error ? (
          <p className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(242,68,99,.12)', color: '#F24463' }}>{error}</p>
        ) : null}
        <div className="space-y-5">
          <FormSection title="Información de la sesión">
            <FormField label="Título de la sesión" required>
              <FormInput value={form.name} onChange={f('name')} placeholder="Nombre de la conferencia, taller o panel" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Tipo">
                <FormSelect value={form.activity_type} onChange={v => setForm(p => ({ ...p, activity_type: v as AgendaActivityType }))}
                  options={Object.entries(TYPE_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))} />
              </FormField>
              {multiDay ? (
                <FormField label="Día">
                  <FormInput type="date" value={form.item_date} onChange={f('item_date')} />
                </FormField>
              ) : (
                <FormField label="Sala / Espacio">
                  <FormSelect value={form.space_id} onChange={f('space_id')}
                    options={[{ value: '', label: 'Sin sala' }, ...spaces.map(s => ({ value: s.id, label: s.name }))]} />
                </FormField>
              )}
              {multiDay ? (
                <FormField label="Sala / Espacio">
                  <FormSelect value={form.space_id} onChange={f('space_id')}
                    options={[{ value: '', label: 'Sin sala' }, ...spaces.map(s => ({ value: s.id, label: s.name }))]} />
                </FormField>
              ) : null}
              <FormField label="Hora inicio">
                <FormInput type="time" value={form.start_time} onChange={f('start_time')} />
              </FormField>
              <FormField label="Hora fin">
                <FormInput type="time" value={form.end_time} onChange={f('end_time')} />
              </FormField>
            </div>
            <FormField label="Nuevo espacio" hint="Si no está en la lista, escríbelo aquí y se crea">
              <FormInput value={form.new_space_name} onChange={f('new_space_name')} placeholder="Auditorio A, Foyer…" />
            </FormField>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: '#7A9CB8' }}>
              <input type="checkbox" checked={form.is_highlight}
                onChange={e => setForm(p => ({ ...p, is_highlight: e.target.checked }))} />
              Destacar en la agenda pública
            </label>
          </FormSection>
          <FormSection title="Ponentes y descripción">
            <FormField
              label="Ponentes"
              hint={speakers.length === 0
                ? 'Primero crea speakers en el catálogo.'
                : 'Si eliges uno que aún no está en este evento, se asigna al guardarlo.'}
            >
              {speakers.length === 0 ? (
                <p className="text-xs" style={{ color: '#3A5470' }}>
                  No hay speakers.{' '}
                  <Link to="/novo/speakers" className="font-semibold" style={{ color: '#00C9A0' }}>Ir a Speakers</Link>
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {[...assignedSpeakers, ...catalogSpeakers].map(sp => {
                    const checked = form.speaker_profile_ids.includes(sp.speaker_profile_id);
                    return (
                      <label key={sp.speaker_profile_id} className="flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer"
                        style={{ background: checked ? 'rgba(0,201,160,.08)' : '#0d1829', border: `1px solid ${checked ? 'rgba(0,201,160,.35)' : '#1e3450'}` }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleSpeaker(sp.speaker_profile_id)} />
                        <span className="text-sm flex-1" style={{ color: '#E1EAF4' }}>{sp.name}</span>
                        {!sp.assigned ? (
                          <span className="text-[10px]" style={{ color: '#3A5470' }}>catálogo</span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              )}
            </FormField>
            <FormField label="Descripción">
              <FormTextarea value={form.description} onChange={f('description')}
                placeholder="Resumen o descripción de qué se verá en esta sesión…" rows={3} />
            </FormField>
          </FormSection>
        </div>
      </NovoModal>
    </div>
  );
}
