import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, SearchIcon, MicIcon, LockIcon, StarIcon, GlobeIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { RowActions } from '../../components/novo/ui/RowActions';
import { listEvents } from '../../lib/novo/events';
import type { NovoEvent } from '../../types/novo';
import {
  createSpeaker, deleteSpeaker, duplicateSpeaker, listSpeakers, updateSpeaker,
  type CatalogSpeaker, type SpeakerStatus,
} from '../../lib/novo/speakers';
import { NovoModal, ModalBtn, FormField, FormInput, FormSelect, FormTextarea, FormSection, ImageField } from '../../components/novo/ui/NovoModal';

const STATUS_CONFIG: Record<SpeakerStatus, { label: string; color: string; bg: string }> = {
  publicado:  { label: 'Publicado',  color: '#00C9A0', bg: 'rgba(0,201,160,.12)'  },
  confirmado: { label: 'Confirmado', color: '#5B8AF0', bg: 'rgba(91,138,240,.12)' },
  invitado:   { label: 'Invitado',   color: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
  pendiente:  { label: 'Pendiente',  color: '#7A9CB8', bg: 'rgba(122,156,184,.12)'},
  declinado:  { label: 'Declinado',  color: '#F24463', bg: 'rgba(242,68,99,.12)'  },
};

const GRADIENTS = [
  'linear-gradient(135deg,#00C9A0,#007AFF)',
  'linear-gradient(135deg,#A78BFA,#5B8AF0)',
  'linear-gradient(135deg,#FF7043,#F59E0B)',
  'linear-gradient(135deg,#5B8AF0,#00C9A0)',
  'linear-gradient(135deg,#F59E0B,#FF7043)',
  'linear-gradient(135deg,#00C9A0,#A78BFA)',
];

const ROLES    = ['Conferencista', 'Panelista', 'Tallerista', 'Moderador', 'Keynote', 'Invitado'];
const STATUSES: SpeakerStatus[] = ['invitado', 'confirmado', 'publicado', 'pendiente', 'declinado'];
type StatusFilter = 'Todos' | SpeakerStatus;
const STATUS_FILTERS: StatusFilter[] = ['Todos', 'publicado', 'confirmado', 'invitado', 'pendiente', 'declinado'];

function initials(name: string) { return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
function gradientFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % GRADIENTS.length;
  return GRADIENTS[hash];
}

const EMPTY_FORM = {
  name: '', specialty: '', role: 'Conferencista', institution: '',
  city: '', country: 'Colombia', talk: '', status: 'invitado' as SpeakerStatus, bio: '',
  foto: '', email: '', linkedin: '', telefono: '',
  event_ids: [] as string[], featured: false,
};

export function NovoSpeakers() {
  const [speakers, setSpeakers]   = useState<CatalogSpeaker[]>([]);
  const [events, setEvents]       = useState<NovoEvent[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState<CatalogSpeaker | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<CatalogSpeaker | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);

  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v as never }));

  useEffect(() => {
    listEvents().then(setEvents).catch(() => setEvents([]));
    listSpeakers()
      .then(setSpeakers)
      .catch((err) => {
        setSpeakers([]);
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los speakers.');
      });
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(null); setModalOpen(true); };
  const openEdit   = (sp: CatalogSpeaker) => {
    setEditing(sp);
    setError(null);
    setForm({
      name: sp.name, specialty: sp.specialty, role: sp.role, institution: sp.institution,
      city: sp.city, country: sp.country, talk: sp.talks[0] ?? '', status: sp.status, bio: sp.bio,
      foto: sp.photo_url, email: sp.email, linkedin: sp.linkedin, telefono: sp.telefono,
      event_ids: sp.events.map(ev => ev.id), featured: sp.featured,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const input = {
      name: form.name,
      specialty: form.specialty,
      role: form.role,
      institution: form.institution,
      city: form.city,
      country: form.country,
      talk: form.talk,
      status: form.status,
      bio: form.bio,
      foto: form.foto,
      email: form.email,
      linkedin: form.linkedin,
      telefono: form.telefono,
      event_ids: form.event_ids,
      featured: form.featured,
    };
    try {
      const saved = editing
        ? await updateSpeaker(editing.id, editing.person_id, input)
        : await createSpeaker(input);
      setSpeakers(prev => editing ? prev.map(s => s.id === editing.id ? saved : s) : [saved, ...prev]);
      if (selected?.id === editing?.id) setSelected(saved);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el speaker.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sp: CatalogSpeaker) => {
    if (!confirm('¿Eliminar este speaker? Esta acción no se puede deshacer.')) return;
    setDeleting(sp.id);
    setError(null);
    try {
      await deleteSpeaker(sp.id, sp.person_id);
      setSpeakers(prev => prev.filter(s => s.id !== sp.id));
      if (selected?.id === sp.id) setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el speaker.');
    } finally {
      setDeleting(null);
    }
  };

  const handleDuplicate = async (sp: CatalogSpeaker) => {
    setError(null);
    try {
      const dup = await duplicateSpeaker(sp);
      setSpeakers(prev => [dup, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo duplicar el speaker.');
    }
  };

  const toggleEvent = (id: string) => {
    setForm(p => ({
      ...p,
      event_ids: p.event_ids.includes(id) ? p.event_ids.filter(item => item !== id) : [...p.event_ids, id],
    }));
  };

  const filtered = speakers.filter(s => {
    const matchStatus = statusFilter === 'Todos' || s.status === statusFilter;
    const q = search.toLowerCase();
    return matchStatus && (!q || s.name.toLowerCase().includes(q) || s.specialty.toLowerCase().includes(q) || s.institution.toLowerCase().includes(q));
  });

  const publicados  = speakers.filter(s => s.status === 'publicado').length;
  const confirmados = speakers.filter(s => s.status === 'confirmado').length;
  const pendientes  = speakers.filter(s => s.status === 'invitado' || s.status === 'pendiente').length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>Catálogo global</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Speakers</h1>
          <p className="mt-0.5 text-sm" style={{ color: '#7A9CB8' }}>Una ficha por persona · se asigna a eventos reales · perfil reutilizable</p>
        </div>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}>
          <PlusIcon size={15} strokeWidth={2.5} /> Nuevo speaker
        </button>
      </div>

      {error && !modalOpen ? (
        <p className="mb-4 rounded-xl px-4 py-2.5 text-xs" style={{ background: 'rgba(242,68,99,.12)', color: '#F24463' }}>{error}</p>
      ) : null}

      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Total speakers"  value={speakers.length.toString()}  sub="en la plataforma"    icon={MicIcon}        delay={0}    />
        <KPICard label="Publicados"      value={publicados.toString()}        sub="visibles en la web"  icon={GlobeIcon}      accent="#00C9A0" delay={0.05} />
        <KPICard label="Confirmados"     value={confirmados.toString()}       sub="listos para publicar" icon={CheckCircleIcon} accent="#5B8AF0" delay={0.1}  />
        <KPICard label="Por confirmar"   value={pendientes.toString()}        sub="invitados o pendientes" icon={XCircleIcon} accent="#F59E0B" delay={0.15} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex items-center" style={{ background: '#112035', border: '1px solid #1e3450', borderRadius: 12 }}>
          <SearchIcon size={14} className="absolute left-3" style={{ color: '#2a4a6b' }} />
          <input type="text" placeholder="Buscar speaker..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent pl-9 pr-4 py-2 text-sm outline-none w-56" style={{ color: '#E1EAF4' }} />
        </div>
        <div className="flex gap-0.5 p-1 rounded-xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
          {STATUS_FILTERS.map(item => (
            <button key={item} type="button" onClick={() => setStatusFilter(item)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all capitalize"
              style={{ background: statusFilter === item ? '#1e3450' : 'transparent', color: statusFilter === item ? '#E1EAF4' : '#2a4a6b' }}>
              {item === 'Todos' ? 'Todos' : STATUS_CONFIG[item].label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid #1e3450', background: '#112035' }}>
        <div className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-3"
          style={{ gridTemplateColumns: '2.5fr 1.5fr 1.5fr 1fr 1fr 1fr auto', color: '#2a4a6b', borderBottom: '1px solid #1a2e45', background: '#182d47' }}>
          <span>Speaker</span><span>Especialidad</span><span>Tema</span><span>Institución</span><span>Eventos</span><span>Estado</span><span className="w-20" />
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: '#2a4a6b' }}>
            <p className="text-sm">{speakers.length === 0 ? 'Aún no hay speakers. Crea la primera ficha.' : 'Sin resultados'}</p>
          </div>
        )}

        {filtered.map((speaker, i) => {
          const st = STATUS_CONFIG[speaker.status];
          const canPublish = speaker.status === 'confirmado' || speaker.status === 'publicado';
          const pending = (v: string) => !v || v === 'PENDIENTE';
          return (
            <motion.div key={speaker.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: deleting === speaker.id ? 0 : 1, x: deleting === speaker.id ? 20 : 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              onClick={() => setSelected(selected?.id === speaker.id ? null : speaker)}
              className="group grid items-center px-5 py-3.5 cursor-pointer transition-colors duration-150"
              style={{ gridTemplateColumns: '2.5fr 1.5fr 1.5fr 1fr 1fr 1fr auto', borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#182d47')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="flex items-center gap-3 min-w-0 pr-4">
                {speaker.photo_url ? (
                  <img src={speaker.photo_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" style={{ border: '1px solid #1e3450' }} />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: gradientFor(speaker.id) }}>{initials(speaker.name)}</div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold" style={{ color: '#E1EAF4' }}>{speaker.name}</p>
                    {speaker.featured && <StarIcon size={11} style={{ color: '#F59E0B', flexShrink: 0 }} />}
                  </div>
                  <p className="text-xs" style={{ color: '#2a4a6b' }}>{speaker.city || '—'}{speaker.country ? `, ${speaker.country}` : ''}</p>
                </div>
              </div>
              <p className="text-sm truncate" style={{ color: '#7A9CB8' }}>{speaker.specialty || '—'}</p>
              <p className="text-sm truncate pr-2" style={{ color: pending(speaker.talks[0]) ? '#2a4a6b' : '#7A9CB8', fontStyle: pending(speaker.talks[0]) ? 'italic' : 'normal' }}>
                {pending(speaker.talks[0]) ? 'Pendiente' : speaker.talks[0]}
              </p>
              <p className="text-xs truncate" style={{ color: pending(speaker.institution) ? '#2a4a6b' : '#7A9CB8' }}>
                {pending(speaker.institution) ? '—' : speaker.institution}
              </p>
              <p className="text-xs tabular-nums" style={{ color: speaker.events.length > 0 ? '#7A9CB8' : '#2a4a6b' }}>
                {speaker.events.length > 0 ? `${speaker.events.length} evento${speaker.events.length > 1 ? 's' : ''}` : '—'}
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ color: st.color, background: st.bg }}>{st.label}</span>
                {!canPublish && <LockIcon size={11} style={{ color: '#2a4a6b' }} />}
              </div>
              <div className="w-20 flex justify-end" onClick={e => e.stopPropagation()}>
                <RowActions
                  onEdit={() => openEdit(speaker)}
                  onDuplicate={() => { void handleDuplicate(speaker); }}
                  onDelete={() => { void handleDelete(speaker); }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-0 right-0 h-screen w-80 overflow-y-auto p-6 z-50"
            style={{ background: '#112035', borderLeft: '1px solid #1e3450' }}
          >
            <button type="button" onClick={() => setSelected(null)}
              className="mb-5 text-xs font-semibold opacity-50 hover:opacity-100 transition-opacity" style={{ color: '#7A9CB8' }}>
              ← Cerrar
            </button>
            <div className="flex flex-col items-center text-center mb-5">
              {selected.photo_url ? (
                <img src={selected.photo_url} alt="" className="h-16 w-16 rounded-full object-cover mb-3" style={{ border: '1px solid #1e3450' }} />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white mb-3"
                  style={{ background: gradientFor(selected.id) }}>{initials(selected.name)}</div>
              )}
              {selected.featured && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#F59E0B' }}>
                  <StarIcon size={10} /> Destacado
                </span>
              )}
              <p className="text-base font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>{selected.name}</p>
              <p className="text-xs mt-1" style={{ color: '#7A9CB8' }}>{selected.role} · {selected.specialty || '—'}</p>
              <p className="text-xs mt-0.5" style={{ color: '#2a4a6b' }}>{selected.institution || '—'}</p>
              <p className="text-xs" style={{ color: '#2a4a6b' }}>{[selected.city, selected.country].filter(Boolean).join(', ') || '—'}</p>
            </div>
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold mb-5"
              style={{ color: STATUS_CONFIG[selected.status].color, background: STATUS_CONFIG[selected.status].bg }}>
              {STATUS_CONFIG[selected.status].label}
            </span>
            {selected.talks[0] && (
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#2a4a6b' }}>Tema</p>
                <p className="text-sm" style={{ color: '#7A9CB8' }}>{selected.talks[0]}</p>
              </div>
            )}
            {selected.bio && (
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#2a4a6b' }}>Bio</p>
                <p className="text-sm leading-relaxed" style={{ color: '#7A9CB8' }}>{selected.bio}</p>
              </div>
            )}
            {(selected.email || selected.telefono || selected.linkedin) && (
              <div className="mb-4 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#2a4a6b' }}>Contacto</p>
                {selected.email ? <p className="text-xs" style={{ color: '#7A9CB8' }}>{selected.email}</p> : null}
                {selected.telefono ? <p className="text-xs" style={{ color: '#7A9CB8' }}>{selected.telefono}</p> : null}
                {selected.linkedin ? <p className="text-xs truncate" style={{ color: '#7A9CB8' }}>{selected.linkedin}</p> : null}
              </div>
            )}
            {selected.events.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#2a4a6b' }}>Eventos</p>
                <div className="space-y-1">
                  {selected.events.map(ev => (
                    <div key={ev.id} className="rounded-lg px-3 py-2 text-xs" style={{ background: '#182d47', color: '#7A9CB8' }}>
                      {ev.name}
                      <span className="ml-2" style={{ color: STATUS_CONFIG[ev.status].color }}>{STATUS_CONFIG[ev.status].label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 space-y-2">
              <button type="button" onClick={() => openEdit(selected)}
                className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{ background: '#00C9A0', color: '#0d1829' }}>Editar ficha</button>
              <button type="button" onClick={() => { void handleDelete(selected); }}
                className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{ background: 'rgba(242,68,99,.08)', color: '#F24463', border: '1px solid rgba(242,68,99,.2)' }}>Eliminar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <NovoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar speaker' : 'Nuevo speaker'}
        subtitle={editing ? `Editando ficha de ${editing.name}` : 'Agrega un ponente al catálogo. Luego asígnalo a uno o más eventos.'}
        width={640}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={() => { void handleSave(); }} disabled={saving || !form.name}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear speaker'}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-6">
          {error ? (
            <p className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(242,68,99,.12)', color: '#F24463' }}>{error}</p>
          ) : null}

          <FormSection title="Perfil">
            <ImageField label="Foto del ponente" value={form.foto} onChange={f('foto')}
              hint="URL pública de la foto (formato cuadrado recomendado)" />
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FormField label="Nombre completo" required>
                  <FormInput value={form.name} onChange={f('name')} placeholder="Dr. / Dra. Nombre Apellido" />
                </FormField>
              </div>
              <FormField label="Especialidad" required>
                <FormInput value={form.specialty} onChange={f('specialty')} placeholder="Endocrinología, Nutrición…" />
              </FormField>
              <FormField label="Rol">
                <FormSelect value={form.role} onChange={f('role')} options={ROLES.map(r => ({ value: r, label: r }))} />
              </FormField>
              <FormField label="Institución">
                <FormInput value={form.institution} onChange={f('institution')} placeholder="Hospital, Universidad…" />
              </FormField>
              <FormField label="Estado" hint="Publicado marca la ficha como pública. En cada evento asignado se guarda este estado.">
                <FormSelect value={form.status} onChange={v => setForm(p => ({ ...p, status: v as SpeakerStatus }))} options={STATUSES.map(s => ({ value: s, label: STATUS_CONFIG[s].label }))} />
              </FormField>
              <FormField label="Ciudad">
                <FormInput value={form.city} onChange={f('city')} placeholder="Medellín, Bogotá…" />
              </FormField>
              <FormField label="País">
                <FormInput value={form.country} onChange={f('country')} placeholder="Colombia" />
              </FormField>
            </div>
            <FormField label="Tema / charla">
              <FormInput value={form.talk} onChange={f('talk')} placeholder="Título de la presentación" />
            </FormField>
            <FormField label="Biografía" hint="Queda en la ficha global del ponente">
              <FormTextarea value={form.bio} onChange={f('bio')} placeholder="Breve descripción del ponente…" rows={3} />
            </FormField>
          </FormSection>

          <FormSection title="Datos de contacto">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Email">
                <FormInput type="email" value={form.email} onChange={f('email')} placeholder="dr.nombre@email.com" />
              </FormField>
              <FormField label="Teléfono / WhatsApp">
                <FormInput value={form.telefono} onChange={f('telefono')} placeholder="+57 310 555 0000" />
              </FormField>
              <div className="col-span-2">
                <FormField label="LinkedIn" hint="URL completa del perfil">
                  <FormInput value={form.linkedin} onChange={f('linkedin')} placeholder="https://linkedin.com/in/nombre" />
                </FormField>
              </div>
            </div>
          </FormSection>

          <FormSection title="Eventos">
            <FormField label="Asignar a eventos" hint={events.length === 0 ? 'Crea un evento en Mis Eventos para poder asignarlo.' : 'El mismo speaker puede estar en varios eventos.'}>
              {events.length === 0 ? (
                <p className="text-xs" style={{ color: '#3A5470' }}>No hay eventos todavía.</p>
              ) : (
                <div className="grid grid-cols-1 gap-1.5">
                  {events.map(ev => {
                    const checked = form.event_ids.includes(ev.id);
                    return (
                      <label key={ev.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer"
                        style={{ background: checked ? 'rgba(0,201,160,.08)' : '#0d1829', border: `1px solid ${checked ? 'rgba(0,201,160,.35)' : '#1e3450'}` }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleEvent(ev.id)} />
                        <span className="text-sm" style={{ color: '#E1EAF4' }}>{ev.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </FormField>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: '#7A9CB8' }}>
              <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} />
              Destacado en los eventos asignados
            </label>
          </FormSection>
        </div>
      </NovoModal>
    </div>
  );
}
