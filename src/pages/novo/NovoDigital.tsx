import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  VideoIcon, UsersIcon, CalendarDaysIcon, PlayCircleIcon,
  PlusIcon, ExternalLinkIcon, ClockIcon, MicIcon, XIcon,
  PencilIcon, TrashIcon, CopyIcon,
} from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { RowActions } from '../../components/novo/ui/RowActions';
import {
  NovoModal, ModalBtn, FormField, FormInput, FormSelect, FormTextarea, FormSection,
} from '../../components/novo/ui/NovoModal';

/* ── Tipos ─────────────────────────────────────────────────── */
type SessionType   = 'webinar' | 'masterclass' | 'conversatorio';
type SessionStatus = 'publicado' | 'proximo' | 'en_vivo' | 'finalizado';

interface DigitalSession {
  id: string; title: string; type: SessionType; status: SessionStatus;
  date: string; time: string; speaker: string; registrados: number;
  asistieron?: number; platform: string; description?: string;
}

/* ── Config ────────────────────────────────────────────────── */
const TYPE_CONFIG: Record<SessionType, { label: string; color: string }> = {
  webinar:       { label: 'Webinar',       color: '#5B8AF0' },
  masterclass:   { label: 'Masterclass',   color: '#A78BFA' },
  conversatorio: { label: 'Conversatorio', color: '#00C9A0' },
};
const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; bg: string }> = {
  publicado:  { label: 'Publicado',  color: '#00C9A0', bg: 'rgba(0,201,160,.12)'   },
  proximo:    { label: 'Próximo',    color: '#5B8AF0', bg: 'rgba(91,138,240,.12)'  },
  en_vivo:    { label: '● En vivo', color: '#F24463', bg: 'rgba(242,68,99,.12)'   },
  finalizado: { label: 'Finalizado', color: '#3A5470', bg: 'rgba(58,84,112,.12)'  },
};
const BG = '#112035'; const BORDER = '#1e3450';
const TEXT_HI = '#E1EAF4'; const TEXT_LO = '#7A9CB8'; const TEXT_DIM = '#3A5470';
const GRADS = ['linear-gradient(135deg,#1a4a7a,#2d6fae)', 'linear-gradient(135deg,#1a6b5a,#00C9A0)', 'linear-gradient(135deg,#5b2d8a,#A78BFA)'];
const PLATFORMS = ['Zoom', 'Google Meet', 'YouTube Live', 'Teams', 'Vimeo'];

/* ── Datos mock ────────────────────────────────────────────── */
const INIT_SESSIONS: DigitalSession[] = [
  { id: 'd1', title: 'Microbiota intestinal: claves para la consulta',        type: 'webinar',       status: 'finalizado', date: '2026-08-05', time: '19:00', speaker: 'Dra. Valentina Ospina',  registrados: 312, asistieron: 241, platform: 'Zoom', description: 'Revisión actualizada del papel de la microbiota en la práctica clínica diaria.' },
  { id: 'd2', title: 'Nutrición funcional en ginecología: evidencia 2026',   type: 'masterclass',   status: 'finalizado', date: '2026-08-19', time: '18:30', speaker: 'Dr. Andrés Mejía',       registrados: 198, asistieron: 167, platform: 'Zoom' },
  { id: 'd3', title: 'Panel: Disruptores endocrinos en la práctica diaria',  type: 'conversatorio', status: 'proximo',    date: '2026-09-15', time: '19:00', speaker: 'Panel EML',              registrados: 89,               platform: 'Zoom', description: 'Mesa redonda con 4 especialistas en endocrinología y medicina funcional.' },
  { id: 'd4', title: 'Probióticos de última generación: ¿qué funciona?',     type: 'webinar',       status: 'proximo',    date: '2026-09-22', time: '19:00', speaker: 'Dra. Camila Ríos',       registrados: 54,               platform: 'Zoom' },
  { id: 'd5', title: 'Masterclass: Certificación hormobiota avanzada',       type: 'masterclass',   status: 'publicado',  date: '2026-10-10', time: '09:00', speaker: 'Equipo EML',             registrados: 23,               platform: 'Zoom' },
];

const EMPTY_FORM = {
  title: '', type: 'webinar' as SessionType, status: 'proximo' as SessionStatus,
  date: '', time: '19:00', speaker: '', platform: 'Zoom',
  registrados: '0', description: '',
};

const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

/* ══════════════════════════════════════════════════════════ */
export function NovoDigital() {
  const [sessions, setSessions]   = useState<DigitalSession[]>(INIT_SESSIONS);
  const [selected, setSelected]   = useState<DigitalSession | null>(null);
  const [typeFilter, setTypeFilter] = useState<SessionType | 'todos'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<DigitalSession | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  /* ── Stats ─────────────────────────────────────────────── */
  const totalReg   = sessions.reduce((s, d) => s + d.registrados, 0);
  const totalAsist = sessions.reduce((s, d) => s + (d.asistieron ?? 0), 0);
  const avgRate    = sessions.filter(d => d.asistieron).length > 0
    ? Math.round((totalAsist / sessions.filter(d => d.asistieron).reduce((s, d) => s + d.registrados, 0)) * 100) : 0;
  const proximas   = sessions.filter(s => s.status === 'proximo' || s.status === 'publicado').length;

  const filtered = typeFilter === 'todos' ? sessions : sessions.filter(s => s.type === typeFilter);

  /* ── CRUD ───────────────────────────────────────────────── */
  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (s: DigitalSession) => {
    setEditing(s);
    setForm({ title: s.title, type: s.type, status: s.status, date: s.date, time: s.time,
      speaker: s.speaker, platform: s.platform, registrados: String(s.registrados), description: s.description ?? '' });
    setModalOpen(true);
  };
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      const newS: DigitalSession = {
        id: editing?.id ?? `d-${Date.now()}`,
        title: form.title, type: form.type, status: form.status,
        date: form.date, time: form.time, speaker: form.speaker, platform: form.platform,
        registrados: Number(form.registrados) || 0,
        asistieron: editing?.asistieron,
        description: form.description || undefined,
      };
      setSessions(prev => editing ? prev.map(s => s.id === editing.id ? newS : s) : [...prev, newS]);
      if (selected?.id === editing?.id) setSelected(newS);
      setSaving(false); setModalOpen(false);
    }, 650);
  };
  const handleDelete = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (selected?.id === id) setSelected(null);
  };
  const handleDuplicate = (s: DigitalSession) => {
    setSessions(prev => [...prev, { ...s, id: `d-${Date.now()}`, status: 'publicado', registrados: 0, asistieron: undefined }]);
  };
  const f = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  /* ─────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>Ecosistema</p>
          <h1 className="text-xl font-bold" style={{ color: TEXT_HI, fontFamily: "'Sora', sans-serif" }}>Agenda Digital</h1>
          <p className="text-sm mt-0.5" style={{ color: TEXT_LO }}>Webinars · Masterclasses · Conversatorios</p>
        </div>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}>
          <PlusIcon size={15} strokeWidth={2.5} /> Nueva sesión
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Total sesiones"   value={sessions.length.toString()} icon={VideoIcon}       accent="#5B8AF0" delay={0}    />
        <KPICard label="Registrados"       value={totalReg.toString()}        icon={UsersIcon}       accent="#00C9A0" delay={0.05} />
        <KPICard label="Asistencia media"  value={`${avgRate}%`}              icon={PlayCircleIcon}  accent="#A78BFA" progress={avgRate} delay={0.1}  />
        <KPICard label="Próximas sesiones" value={proximas.toString()}        icon={CalendarDaysIcon} accent="#FF7043" delay={0.15} />
      </div>

      {/* Filtro */}
      <div className="mb-4 flex rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}`, width: 'fit-content' }}>
        {(['todos', 'webinar', 'masterclass', 'conversatorio'] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className="px-3.5 py-2 text-xs font-semibold transition-colors"
            style={{
              background: typeFilter === t ? '#182d47' : BG,
              color: typeFilter === t ? TEXT_HI : TEXT_DIM,
              borderRight: `1px solid ${BORDER}`,
            }}>
            {t === 'todos' ? 'Todos' : TYPE_CONFIG[t].label}
          </button>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Lista */}
        <div className="flex-1 overflow-hidden rounded-2xl" style={{ background: BG, border: `1px solid ${BORDER}` }}>
          {filtered.length === 0 && (
            <div className="py-16 text-center" style={{ color: TEXT_DIM }}>Sin sesiones</div>
          )}
          {filtered.map((sess, i) => {
            const tp = TYPE_CONFIG[sess.type];
            const st = STATUS_CONFIG[sess.status];
            const isSelected = selected?.id === sess.id;
            const rate = sess.asistieron && sess.registrados
              ? Math.round((sess.asistieron / sess.registrados) * 100) : null;
            return (
              <motion.div key={sess.id}
                initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.04 }}
                onClick={() => setSelected(isSelected ? null : sess)}
                className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none',
                  background: isSelected ? '#182d47' : 'transparent' }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#182d4740')}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${tp.color}15`, border: `1px solid ${tp.color}30` }}>
                  <VideoIcon size={16} style={{ color: tp.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: TEXT_HI }}>{sess.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] font-bold" style={{ color: tp.color }}>{tp.label}</span>
                    <span className="text-[10px]" style={{ color: TEXT_DIM }}>
                      <CalendarDaysIcon size={9} className="inline mr-0.5" />
                      {new Date(sess.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · {sess.time}
                    </span>
                    <span className="text-[10px]" style={{ color: TEXT_DIM }}>
                      <MicIcon size={9} className="inline mr-0.5" />{sess.speaker}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-center">
                    <p className="text-sm font-bold tabular-nums" style={{ color: TEXT_HI }}>{sess.registrados}</p>
                    <p className="text-[9px]" style={{ color: TEXT_DIM }}>registrados</p>
                  </div>
                  {rate !== null && (
                    <div className="text-center">
                      <p className="text-sm font-bold tabular-nums" style={{ color: '#00C9A0' }}>{rate}%</p>
                      <p className="text-[9px]" style={{ color: TEXT_DIM }}>asistencia</p>
                    </div>
                  )}
                  <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ color: st.color, background: st.bg }}>{st.label}</span>
                  <div onClick={e => e.stopPropagation()}>
                    <RowActions
                      onEdit={() => openEdit(sess)}
                      onDuplicate={() => handleDuplicate(sess)}
                      onDelete={() => handleDelete(sess.id)}
                    />
                  </div>
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
              animate={{ opacity: 1, x: 0, width: 260 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden shrink-0 rounded-2xl"
              style={{ background: BG, border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: `1px solid ${BORDER}`, background: '#182d47' }}>
                <span className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: TYPE_CONFIG[selected.type].color }}>
                  {TYPE_CONFIG[selected.type].label}
                </span>
                <button type="button" onClick={() => setSelected(null)}
                  className="rounded-lg p-1 hover:bg-white/5" style={{ color: TEXT_DIM }}>
                  <XIcon size={14} />
                </button>
              </div>
              <div className="p-5">
                <p className="text-sm font-bold mb-4 leading-snug" style={{ color: TEXT_HI }}>{selected.title}</p>
                {selected.description && (
                  <p className="text-xs leading-relaxed mb-4" style={{ color: TEXT_LO }}>{selected.description}</p>
                )}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: GRADS[0] }}>{initials(selected.speaker)}</div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: TEXT_HI }}>{selected.speaker}</p>
                    <p className="text-[10px]" style={{ color: TEXT_DIM }}>Ponente</p>
                  </div>
                </div>
                {[
                  { icon: CalendarDaysIcon, label: 'Fecha', value: new Date(selected.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) },
                  { icon: ClockIcon,        label: 'Hora',  value: selected.time },
                  { icon: VideoIcon,        label: 'Plataforma', value: selected.platform },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 mb-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: '#182d47' }}>
                      <item.icon size={12} style={{ color: TEXT_LO }} />
                    </div>
                    <div>
                      <p className="text-[10px]" style={{ color: TEXT_DIM }}>{item.label}</p>
                      <p className="text-xs font-semibold capitalize" style={{ color: TEXT_HI }}>{item.value}</p>
                    </div>
                  </div>
                ))}
                {selected.asistieron && (
                  <div className="mt-3 rounded-xl p-3.5" style={{ background: '#0d1829', border: `1px solid ${BORDER}` }}>
                    <div className="flex justify-between mb-2">
                      <p className="text-[10px]" style={{ color: TEXT_DIM }}>Asistencia</p>
                      <p className="text-xs font-bold" style={{ color: '#00C9A0' }}>
                        {Math.round((selected.asistieron / selected.registrados) * 100)}%
                      </p>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: BORDER }}>
                      <div className="h-full rounded-full" style={{
                        width: `${Math.round((selected.asistieron / selected.registrados) * 100)}%`,
                        background: '#00C9A0'
                      }} />
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: TEXT_DIM }}>
                      {selected.asistieron} de {selected.registrados} registrados
                    </p>
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => openEdit(selected)}
                    className="rounded-xl py-2 text-xs font-semibold" style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}>
                    Editar
                  </button>
                  <button className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold"
                    style={{ background: 'rgba(91,138,240,.1)', color: '#5B8AF0', border: '1px solid rgba(91,138,240,.2)' }}>
                    <ExternalLinkIcon size={11} /> Ver
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal CRUD */}
      <NovoModal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar sesión digital' : 'Nueva sesión digital'}
        subtitle={editing ? 'Modifica los datos de la sesión' : 'Webinar, masterclass o conversatorio'}
        width={580}
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</ModalBtn>
          <ModalBtn variant="primary" onClick={handleSave} disabled={saving || !form.title}>
            {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear sesión'}
          </ModalBtn>
        </>}
      >
        <FormSection title="Información de la sesión">
          <FormField label="Título" required>
            <FormInput placeholder="Ej. Microbiota intestinal: claves para la consulta" value={form.title} onChange={f('title')} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tipo">
              <FormSelect value={form.type} onChange={f('type')}
                options={Object.entries(TYPE_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))} />
            </FormField>
            <FormField label="Estado">
              <FormSelect value={form.status} onChange={f('status')}
                options={Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))} />
            </FormField>
            <FormField label="Fecha">
              <FormInput type="date" value={form.date} onChange={f('date')} />
            </FormField>
            <FormField label="Hora">
              <FormInput type="time" value={form.time} onChange={f('time')} />
            </FormField>
            <FormField label="Ponente / Speaker">
              <FormInput placeholder="Dra. Valentina Ospina" value={form.speaker} onChange={f('speaker')} />
            </FormField>
            <FormField label="Plataforma">
              <FormSelect value={form.platform} onChange={f('platform')}
                options={PLATFORMS.map(p => ({ value: p, label: p }))} />
            </FormField>
            <FormField label="Registrados actuales">
              <FormInput type="number" value={form.registrados} onChange={f('registrados')} />
            </FormField>
          </div>
          <FormField label="Descripción">
            <FormTextarea placeholder="Resumen breve de la sesión…" value={form.description} onChange={f('description')} rows={3} />
          </FormField>
        </FormSection>
      </NovoModal>
    </div>
  );
}
