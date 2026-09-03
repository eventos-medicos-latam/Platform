import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDaysIcon, MicIcon, UsersIcon, CoffeeIcon,
  PlusIcon, LayoutListIcon, GridIcon,
} from 'lucide-react';
import type { NovoEvent } from '../../../types/novo';
import { RowActions } from '../../../components/novo/ui/RowActions';
import {
  NovoModal, ModalBtn,
  FormField, FormInput, FormSelect, FormTextarea, FormSection,
} from '../../../components/novo/ui/NovoModal';

interface EventContext { event: NovoEvent }

type SessionType = 'conferencia' | 'panel' | 'taller' | 'break' | 'operacion';

interface Session {
  id: string;
  time: string;
  end_time: string;
  title: string;
  type: SessionType;
  speaker?: string;
  room?: string;
  description?: string;
}

const TYPE_CONFIG: Record<SessionType, { label: string; color: string; icon: React.ElementType }> = {
  conferencia: { label: 'Conferencia', color: '#00C9A0', icon: MicIcon         },
  panel:       { label: 'Panel',       color: '#5B8AF0', icon: UsersIcon       },
  taller:      { label: 'Taller',      color: '#A78BFA', icon: LayoutListIcon  },
  break:       { label: 'Break',       color: '#F59E0B', icon: CoffeeIcon      },
  operacion:   { label: 'Operación',   color: '#3A5470', icon: CalendarDaysIcon },
};

const INIT_SESSIONS: Session[] = [
  { id: 's1',  time: '07:30', end_time: '08:30', title: 'Registro y acreditación',                       type: 'operacion',   room: 'Hall principal' },
  { id: 's2',  time: '08:30', end_time: '09:00', title: 'Bienvenida institucional',                     type: 'operacion',   room: 'Auditorio A',  speaker: 'Organización EML' },
  { id: 's3',  time: '09:00', end_time: '10:00', title: 'Conferencia inaugural: Microbiota y salud hormonal', type: 'conferencia', room: 'Auditorio A', speaker: 'Dra. Valentina Ospina', description: 'Panorama actualizado del eje intestino-hormona: evidencia y aplicación clínica.' },
  { id: 's4',  time: '10:00', end_time: '10:30', title: 'Coffee break',                                 type: 'break',       room: 'Foyer' },
  { id: 's5',  time: '10:30', end_time: '11:30', title: 'Panel: Disruptores endocrinos en la práctica diaria', type: 'panel',  room: 'Auditorio A', speaker: 'Dr. Andrés Mejía · Dra. Camila Ríos' },
  { id: 's6',  time: '11:30', end_time: '12:30', title: 'Taller: Lectura de microbioma en consulta',   type: 'taller',      room: 'Sala B', speaker: 'Dr. Juan E. Vargas', description: 'Cómo interpretar informes de microbioma y traducirlos en intervención.' },
  { id: 's7',  time: '12:30', end_time: '13:30', title: 'Almuerzo',                                    type: 'break',       room: 'Restaurante' },
  { id: 's8',  time: '13:30', end_time: '14:30', title: 'Conferencia: Probióticos de última generación', type: 'conferencia', room: 'Auditorio A', speaker: 'Dr. Andrés Mejía' },
  { id: 's9',  time: '14:30', end_time: '15:30', title: 'Panel: Nutrición funcional en ginecología',  type: 'panel',       room: 'Auditorio A', speaker: 'Dra. Valentina Ospina · Dra. Camila Ríos' },
  { id: 's10', time: '15:30', end_time: '16:00', title: 'Clausura y sorteos',                         type: 'operacion',   room: 'Auditorio A', speaker: 'Organización EML' },
];

const EMPTY_FORM = { title: '', type: 'conferencia' as SessionType, time: '09:00', end_time: '10:00', speaker: '', room: '', description: '' };

export function NovoEventAgenda() {
  const { event } = useOutletContext<EventContext>();
  const [sessions, setSessions] = useState<Session[]>(INIT_SESSIONS);
  const [selected, setSelected]   = useState<Session | null>(null);
  const [view, setView]           = useState<'list' | 'timeline'>('list');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Session | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const f = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit   = (s: Session) => {
    setEditing(s);
    setForm({ title: s.title, type: s.type, time: s.time, end_time: s.end_time, speaker: s.speaker ?? '', room: s.room ?? '', description: s.description ?? '' });
    setModalOpen(true);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      if (editing) {
        setSessions(prev => prev.map(s => s.id !== editing.id ? s : { ...s, ...form }));
        if (selected?.id === editing.id) setSelected(s => s ? { ...s, ...form } : null);
      } else {
        const newS: Session = { id: `s-${Date.now()}`, ...form };
        setSessions(prev => [...prev, newS].sort((a, b) => a.time.localeCompare(b.time)));
      }
      setModalOpen(false);
    }, 600);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta sesión?')) return;
    setSessions(prev => prev.filter(s => s.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const handleDuplicate = (s: Session) => {
    setSessions(prev => [...prev, { ...s, id: `s-${Date.now()}`, title: `${s.title} (copia)` }]
      .sort((a, b) => a.time.localeCompare(b.time)));
  };

  const totalMin = sessions.reduce((acc, s) => {
    const [sh, sm] = s.time.split(':').map(Number);
    const [eh, em] = s.end_time.split(':').map(Number);
    return acc + (eh * 60 + em - sh * 60 - sm);
  }, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Agenda del Evento</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>
            {sessions.length} sesiones · {Math.round(totalMin / 60)}h programadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #1e3450' }}>
            {(['list', 'timeline'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className="px-3 py-2 transition-colors"
                style={{ background: view === v ? '#182d47' : '#112035' }}>
                {v === 'list'
                  ? <LayoutListIcon size={14} style={{ color: view === v ? '#E1EAF4' : '#2a4a6b' }} />
                  : <GridIcon       size={14} style={{ color: view === v ? '#E1EAF4' : '#2a4a6b' }} />}
              </button>
            ))}
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-95"
            style={{ background: '#00C9A0', color: '#0d1829' }}>
            <PlusIcon size={13} /> Nueva sesión
          </button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="mb-4 flex flex-wrap gap-3">
        {(Object.entries(TYPE_CONFIG) as [SessionType, typeof TYPE_CONFIG[SessionType]][]).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: cfg.color }} />
            <span className="text-[10px] font-semibold" style={{ color: '#7A9CB8' }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Lista */}
        <div className="flex-1 overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
          {sessions.map((sess, i) => {
            const cfg = TYPE_CONFIG[sess.type];
            const isSelected = selected?.id === sess.id;
            return (
              <motion.div key={sess.id}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.02 }}
                onClick={() => setSelected(isSelected ? null : sess)}
                className="flex gap-4 px-5 py-4 cursor-pointer transition-colors group"
                style={{
                  borderBottom: i < sessions.length - 1 ? '1px solid #1a2e45' : 'none',
                  background: isSelected ? '#182d47' : 'transparent',
                  borderLeft: `3px solid ${cfg.color}`,
                }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'rgba(24,45,71,0.4)')}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
              >
                {/* Hora */}
                <div className="w-20 shrink-0">
                  <p className="text-xs font-bold tabular-nums" style={{ color: '#E1EAF4' }}>{sess.time}</p>
                  <p className="text-[10px]" style={{ color: '#3A5470' }}>{sess.end_time}</p>
                </div>
                {/* Icono */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>
                  <cfg.icon size={14} style={{ color: cfg.color }} />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#E1EAF4' }}>{sess.title}</p>
                  <div className="flex flex-wrap gap-3 mt-0.5">
                    {sess.speaker && <p className="text-[10px]" style={{ color: '#7A9CB8' }}><MicIcon size={9} className="inline mr-0.5" />{sess.speaker}</p>}
                    {sess.room    && <p className="text-[10px]" style={{ color: '#3A5470' }}>{sess.room}</p>}
                  </div>
                </div>
                {/* Badge + acciones */}
                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ color: cfg.color, background: `${cfg.color}15` }}>
                    {cfg.label}
                  </span>
                  <RowActions
                    onEdit={() => openEdit(sess)}
                    onDuplicate={() => handleDuplicate(sess)}
                    onDelete={() => handleDelete(sess.id)}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Panel detalle */}
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
                  <div className="h-2 w-2 rounded-full" style={{ background: TYPE_CONFIG[selected.type].color }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: TYPE_CONFIG[selected.type].color }}>
                    {TYPE_CONFIG[selected.type].label}
                  </span>
                </div>
                <p className="text-sm font-bold mb-4 leading-snug" style={{ color: '#E1EAF4' }}>{selected.title}</p>
                {[
                  { label: 'Horario', value: `${selected.time} – ${selected.end_time}` },
                  ...(selected.speaker ? [{ label: 'Ponente', value: selected.speaker }] : []),
                  ...(selected.room    ? [{ label: 'Sala',    value: selected.room    }] : []),
                ].map((item, i) => (
                  <div key={i} className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: '#3A5470' }}>{item.label}</p>
                    <p className="text-xs" style={{ color: '#7A9CB8' }}>{item.value}</p>
                  </div>
                ))}
                {selected.description && (
                  <div className="mt-3 rounded-xl p-3.5" style={{ background: '#0d1829', border: '1px solid #1e3450' }}>
                    <p className="text-xs leading-relaxed" style={{ color: '#7A9CB8' }}>{selected.description}</p>
                  </div>
                )}
                <div className="mt-5 flex gap-2">
                  <button onClick={() => openEdit(selected)}
                    className="flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-95"
                    style={{ background: 'rgba(0,201,160,.1)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(selected.id)}
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

      {/* ═══ MODAL ══════════════════════════════════════════════════════════ */}
      <NovoModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar sesión' : 'Nueva sesión'}
        subtitle={editing ? `Editando: ${editing.title}` : 'Agregar sesión a la agenda del evento'}
        width={580}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={handleSave} disabled={saving || !form.title}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear sesión'}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-5">
          <FormSection title="Información de la sesión">
            <FormField label="Título de la sesión" required>
              <FormInput value={form.title} onChange={f('title')} placeholder="Nombre de la conferencia, taller o panel" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Tipo">
                <FormSelect value={form.type} onChange={v => setForm(p => ({ ...p, type: v as SessionType }))}
                  options={Object.entries(TYPE_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))} />
              </FormField>
              <FormField label="Sala / Espacio">
                <FormInput value={form.room} onChange={f('room')} placeholder="Auditorio A, Sala B…" />
              </FormField>
              <FormField label="Hora inicio">
                <FormInput type="time" value={form.time} onChange={f('time')} />
              </FormField>
              <FormField label="Hora fin">
                <FormInput type="time" value={form.end_time} onChange={f('end_time')} />
              </FormField>
            </div>
          </FormSection>
          <FormSection title="Ponente y descripción">
            <FormField label="Ponente(s)" hint="Separa múltiples ponentes con ·">
              <FormInput value={form.speaker} onChange={f('speaker')} placeholder="Dra. Valentina Ospina · Dr. Carlos Montoya" />
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
