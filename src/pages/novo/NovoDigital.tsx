import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  VideoIcon, UsersIcon, CalendarDaysIcon, PlayCircleIcon,
  PlusIcon, ExternalLinkIcon, ClockIcon, MicIcon, XIcon,
} from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { RowActions } from '../../components/novo/ui/RowActions';
import {
  NovoModal, ModalBtn, FormField, FormInput, FormSelect, FormTextarea, FormSection,
} from '../../components/novo/ui/NovoModal';
import {
  createDigitalSession, duplicateDigitalSession, listDigitalSessions, trashDigitalSession,
  updateDigitalSession, type DigitalKind, type DigitalSession, type DigitalStatus,
} from '../../lib/novo/digital';

const TYPE_CONFIG: Record<DigitalKind, { label: string; color: string }> = {
  webinar:       { label: 'Webinar',       color: '#5B8AF0' },
  masterclass:   { label: 'Masterclass',   color: '#A78BFA' },
  conversatorio: { label: 'Conversatorio', color: '#00C9A0' },
  curso:         { label: 'Curso',         color: '#FF7043' },
  lanzamiento:   { label: 'Lanzamiento',   color: '#F59E0B' },
};
const STATUS_CONFIG: Record<DigitalStatus, { label: string; color: string; bg: string }> = {
  publicado: { label: 'Publicado', color: '#00C9A0', bg: 'rgba(0,201,160,.12)' },
  aprobado:  { label: 'Aprobado',  color: '#5B8AF0', bg: 'rgba(91,138,240,.12)' },
  borrador:  { label: 'Borrador',  color: '#3A5470', bg: 'rgba(58,84,112,.12)' },
};
const BG = '#112035'; const BORDER = '#1e3450';
const TEXT_HI = '#E1EAF4'; const TEXT_LO = '#7A9CB8'; const TEXT_DIM = '#3A5470';
const GRADS = ['linear-gradient(135deg,#1a4a7a,#2d6fae)', 'linear-gradient(135deg,#1a6b5a,#00C9A0)', 'linear-gradient(135deg,#5b2d8a,#A78BFA)'];
const PLATFORMS = ['Zoom', 'Google Meet', 'YouTube Live', 'Teams', 'Vimeo'];

const EMPTY_FORM = {
  title: '', kind: 'webinar' as DigitalKind, status: 'borrador' as DigitalStatus,
  date: '', time: '19:00', speaker: '', platform: 'Zoom', description: '',
};

const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'S';

export function NovoDigital() {
  const [sessions, setSessions] = useState<DigitalSession[]>([]);
  const [selected, setSelected] = useState<DigitalSession | null>(null);
  const [typeFilter, setTypeFilter] = useState<DigitalKind | 'todos'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DigitalSession | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => listDigitalSessions()
    .then((rows) => {
      setSessions(rows);
      setSelected((prev) => prev ? rows.find((row) => row.id === prev.id) ?? null : null);
    })
    .catch(() => setSessions([]))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const totalReg = sessions.reduce((sum, item) => sum + item.registered, 0);
  const publicadas = sessions.filter((item) => item.status === 'publicado').length;
  const proximas = sessions.filter((item) => item.status === 'publicado' || item.status === 'aprobado').length;
  const filtered = typeFilter === 'todos' ? sessions : sessions.filter((item) => item.kind === typeFilter);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  };
  const openEdit = (session: DigitalSession) => {
    setEditing(session);
    setForm({
      title: session.title,
      kind: session.kind,
      status: session.status,
      date: session.date,
      time: session.time || '19:00',
      speaker: session.speaker,
      platform: session.platform || 'Zoom',
      description: session.description,
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        kind: form.kind,
        status: form.status,
        date: form.date || null,
        time: form.time,
        speaker: form.speaker,
        platform: form.platform,
        description: form.description,
      };
      if (editing) await updateDigitalSession(editing.id, payload);
      else await createDigitalSession(payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la sesión.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await trashDigitalSession(id);
      if (selected?.id === id) setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    }
  };

  const handleDuplicate = async (session: DigitalSession) => {
    try {
      await duplicateDigitalSession(session);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo duplicar.');
    }
  };

  const f = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>Ecosistema</p>
          <h1 className="text-xl font-bold" style={{ color: TEXT_HI, fontFamily: "'Sora', sans-serif" }}>Agenda Digital</h1>
          <p className="text-sm mt-0.5" style={{ color: TEXT_LO }}>Webinars · Masterclasses · Conversatorios — misma fuente que /digital</p>
        </div>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}>
          <PlusIcon size={15} strokeWidth={2.5} /> Nueva sesión
        </button>
      </div>

      {error && !modalOpen ? (
        <p className="mb-4 text-sm" style={{ color: '#F24463' }}>{error}</p>
      ) : null}

      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Total sesiones" value={sessions.length.toString()} icon={VideoIcon} accent="#5B8AF0" delay={0} />
        <KPICard label="Registrados" value={totalReg.toString()} icon={UsersIcon} accent="#00C9A0" delay={0.05} />
        <KPICard label="Publicadas" value={publicadas.toString()} icon={PlayCircleIcon} accent="#A78BFA" delay={0.1} />
        <KPICard label="Visibles en /digital" value={proximas.toString()} icon={CalendarDaysIcon} accent="#FF7043" delay={0.15} />
      </div>

      <div className="mb-4 flex rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}`, width: 'fit-content' }}>
        {(['todos', 'webinar', 'masterclass', 'conversatorio', 'curso', 'lanzamiento'] as const).map((kind) => (
          <button key={kind} type="button" onClick={() => setTypeFilter(kind)}
            className="px-3.5 py-2 text-xs font-semibold transition-colors"
            style={{
              background: typeFilter === kind ? '#182d47' : BG,
              color: typeFilter === kind ? TEXT_HI : TEXT_DIM,
              borderRight: `1px solid ${BORDER}`,
            }}>
            {kind === 'todos' ? 'Todos' : TYPE_CONFIG[kind].label}
          </button>
        ))}
      </div>

      <div className="flex gap-5">
        <div className="flex-1 overflow-hidden rounded-2xl" style={{ background: BG, border: `1px solid ${BORDER}` }}>
          {loading && filtered.length === 0 ? (
            <div className="py-16 text-center" style={{ color: TEXT_DIM }}>Cargando sesiones…</div>
          ) : null}
          {!loading && filtered.length === 0 ? (
            <div className="py-16 text-center" style={{ color: TEXT_DIM }}>Sin sesiones. Crea la primera para que aparezca en /digital.</div>
          ) : null}
          {filtered.map((sess, i) => {
            const tp = TYPE_CONFIG[sess.kind];
            const st = STATUS_CONFIG[sess.status];
            const isSelected = selected?.id === sess.id;
            return (
              <motion.div key={sess.id}
                initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.04 }}
                onClick={() => setSelected(isSelected ? null : sess)}
                className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
                style={{
                  borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none',
                  background: isSelected ? '#182d47' : 'transparent',
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#182d4740'; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
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
                      {sess.date ? new Date(`${sess.date}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : 'Sin fecha'}
                      {sess.time ? ` · ${sess.time}` : ''}
                    </span>
                    {sess.speaker ? (
                      <span className="text-[10px]" style={{ color: TEXT_DIM }}>
                        <MicIcon size={9} className="inline mr-0.5" />{sess.speaker}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-center">
                    <p className="text-sm font-bold tabular-nums" style={{ color: TEXT_HI }}>{sess.registered}</p>
                    <p className="text-[9px]" style={{ color: TEXT_DIM }}>registrados</p>
                  </div>
                  <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ color: st.color, background: st.bg }}>{st.label}</span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      onEdit={() => openEdit(sess)}
                      onDuplicate={() => { void handleDuplicate(sess); }}
                      onDelete={() => { void handleDelete(sess.id); }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

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
                  style={{ color: TYPE_CONFIG[selected.kind].color }}>
                  {TYPE_CONFIG[selected.kind].label}
                </span>
                <button type="button" onClick={() => setSelected(null)}
                  className="rounded-lg p-1 hover:bg-white/5" style={{ color: TEXT_DIM }}>
                  <XIcon size={14} />
                </button>
              </div>
              <div className="p-5">
                <p className="text-sm font-bold mb-4 leading-snug" style={{ color: TEXT_HI }}>{selected.title}</p>
                {selected.description ? (
                  <p className="text-xs leading-relaxed mb-4" style={{ color: TEXT_LO }}>{selected.description}</p>
                ) : null}
                {selected.speaker ? (
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: GRADS[0] }}>{initials(selected.speaker)}</div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: TEXT_HI }}>{selected.speaker}</p>
                      <p className="text-[10px]" style={{ color: TEXT_DIM }}>Ponente</p>
                    </div>
                  </div>
                ) : null}
                {[
                  { icon: CalendarDaysIcon, label: 'Fecha', value: selected.date ? new Date(`${selected.date}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Sin fecha' },
                  { icon: ClockIcon, label: 'Hora', value: selected.time || '—' },
                  { icon: VideoIcon, label: 'Plataforma', value: selected.platform || '—' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 mb-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: '#182d47' }}>
                      <item.icon size={12} style={{ color: TEXT_LO }} />
                    </div>
                    <div>
                      <p className="text-[10px]" style={{ color: TEXT_DIM }}>{item.label}</p>
                      <p className="text-xs font-semibold capitalize" style={{ color: TEXT_HI }}>{item.value}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => openEdit(selected)}
                    className="rounded-xl py-2 text-xs font-semibold" style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}>
                    Editar
                  </button>
                  <Link to={`/digital?sesion=${selected.id}`}
                    className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold"
                    style={{ background: 'rgba(91,138,240,.1)', color: '#5B8AF0', border: '1px solid rgba(91,138,240,.2)' }}>
                    <ExternalLinkIcon size={11} /> Ver
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NovoModal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar sesión digital' : 'Nueva sesión digital'}
        subtitle={editing ? 'Modifica los datos de la sesión' : 'Visible en /digital si está aprobada o publicada'}
        width={580}
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</ModalBtn>
          <ModalBtn variant="primary" onClick={() => { void handleSave(); }} disabled={saving || !form.title}>
            {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear sesión'}
          </ModalBtn>
        </>}
      >
        <FormSection title="Información de la sesión">
          {error ? <p className="text-xs" style={{ color: '#F24463' }}>{error}</p> : null}
          <FormField label="Título" required>
            <FormInput placeholder="Ej. Microbiota intestinal: claves para la consulta" value={form.title} onChange={f('title')} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tipo">
              <FormSelect value={form.kind} onChange={f('kind')}
                options={Object.entries(TYPE_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }))} />
            </FormField>
            <FormField label="Estado">
              <FormSelect value={form.status} onChange={f('status')}
                options={Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }))} />
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
                options={PLATFORMS.map((platform) => ({ value: platform, label: platform }))} />
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
