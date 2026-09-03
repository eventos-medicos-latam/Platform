import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, SearchIcon, MicIcon, LockIcon, StarIcon, GlobeIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { RowActions } from '../../components/novo/ui/RowActions';
import { NovoModal, ModalBtn, FormField, FormInput, FormSelect, FormTextarea, FormSection, ImageField } from '../../components/novo/ui/NovoModal';

interface Speaker {
  id: string;
  name: string;
  specialty: string;
  role: string;
  institution: string;
  country: string;
  city: string;
  talks: string[];
  featured: boolean;
  status: 'invitado' | 'confirmado' | 'publicado' | 'declinado' | 'pendiente';
  events: string[];
  avatar_gradient: string;
}

const STATUS_CONFIG: Record<Speaker['status'], { label: string; color: string; bg: string }> = {
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

const INIT_SPEAKERS: Speaker[] = [
  { id: 'sp-001', name: 'Dra. Valentina Ospina',   specialty: 'Endocrinología',       role: 'Conferencista',  institution: 'U. de Antioquia',       country: 'Colombia', city: 'Medellín',    talks: ['Disruptores endocrinos y microbiota'],        featured: true,  status: 'publicado',  events: ['La Eterna Primavera', 'Hormobiota VI'], avatar_gradient: GRADIENTS[0] },
  { id: 'sp-002', name: 'Dr. Carlos Montoya',       specialty: 'Medicina funcional',   role: 'Panelista',      institution: 'Clínica Montoya',        country: 'Colombia', city: 'Bogotá',      talks: ['Eje intestino-cerebro en 2025'],              featured: true,  status: 'publicado',  events: ['Hormobiota VI'],                         avatar_gradient: GRADIENTS[1] },
  { id: 'sp-003', name: 'Dr. Andrés Morales',       specialty: 'Gastroenterología',    role: 'Conferencista',  institution: 'Hospital Pablo Tobón',   country: 'Colombia', city: 'Medellín',    talks: ['Permeabilidad intestinal: evidencia actual'], featured: false, status: 'confirmado', events: ['La Eterna Primavera'],                   avatar_gradient: GRADIENTS[2] },
  { id: 'sp-004', name: 'Dra. Carolina Mejía',      specialty: 'Nutrición clínica',    role: 'Tallerista',     institution: 'CES Universidad',        country: 'Colombia', city: 'Medellín',    talks: ['Dieta y modulación del microbioma'],          featured: false, status: 'confirmado', events: ['La Eterna Primavera'],                   avatar_gradient: GRADIENTS[3] },
  { id: 'sp-005', name: 'Juan Pablo Restrepo',      specialty: 'Psiquiatría',          role: 'Moderador',      institution: '',                       country: 'Colombia', city: 'Bogotá',      talks: [''],                                          featured: false, status: 'invitado',   events: ['Hormobiota VI'],                         avatar_gradient: GRADIENTS[4] },
  { id: 'sp-006', name: 'Dra. María Fernanda Díaz', specialty: 'Medicina integrativa', role: 'Conferencista',  institution: 'Centro Médico Imbanaco', country: 'Colombia', city: 'Cali',        talks: ['Fitoterapia y eje hormonal'],                 featured: true,  status: 'publicado',  events: ['La Eterna Primavera'],                   avatar_gradient: GRADIENTS[5] },
  { id: 'sp-007', name: 'Dr. Roberto Ángel',        specialty: 'Cardiología',          role: 'Conferencista',  institution: 'Cardiodiagnóstico',      country: 'Colombia', city: 'Medellín',    talks: [''],                                          featured: false, status: 'pendiente',  events: [],                                        avatar_gradient: GRADIENTS[1] },
  { id: 'sp-008', name: 'Dra. Lucía Ramírez',       specialty: 'Dermatología',         role: 'Panelista',      institution: '',                       country: 'Colombia', city: 'Barranquilla',talks: ['Piel y disbiosis intestinal'],                featured: false, status: 'declinado',  events: [],                                        avatar_gradient: GRADIENTS[2] },
];

const ROLES    = ['Conferencista', 'Panelista', 'Tallerista', 'Moderador', 'Keynote', 'Invitado'];
const STATUSES = ['invitado', 'confirmado', 'publicado', 'pendiente', 'declinado'];
type StatusFilter = 'Todos' | Speaker['status'];
const STATUS_FILTERS: StatusFilter[] = ['Todos', 'publicado', 'confirmado', 'invitado', 'pendiente', 'declinado'];

function initials(name: string) { return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(); }

const EMPTY_FORM = {
  name: '', specialty: '', role: 'Conferencista', institution: '',
  city: '', country: 'Colombia', talk: '', status: 'invitado', bio: '',
  foto: '', email: '', linkedin: '', telefono: '',
};

export function NovoSpeakers() {
  const [speakers, setSpeakers]   = useState<Speaker[]>(INIT_SPEAKERS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState<Speaker | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Speaker | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);

  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit   = (sp: Speaker) => {
    setEditing(sp);
    setForm({
      name: sp.name, specialty: sp.specialty, role: sp.role, institution: sp.institution,
      city: sp.city, country: sp.country, talk: sp.talks[0] ?? '', status: sp.status, bio: '',
      foto: (sp as any).foto ?? '', email: (sp as any).email ?? '',
      linkedin: (sp as any).linkedin ?? '', telefono: (sp as any).telefono ?? '',
    });
    setModalOpen(true);
  };
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      if (editing) {
        setSpeakers(prev => prev.map(s => s.id !== editing.id ? s : {
          ...s, name: form.name, specialty: form.specialty, role: form.role,
          institution: form.institution, city: form.city, country: form.country,
          talks: [form.talk], status: form.status as Speaker['status'],
        }));
        if (selected?.id === editing.id) setSelected(s => s ? { ...s, name: form.name, specialty: form.specialty, role: form.role, institution: form.institution, city: form.city, country: form.country, talks: [form.talk], status: form.status as Speaker['status'] } : null);
      } else {
        const newSp: Speaker = {
          id: `sp-${Date.now()}`, name: form.name, specialty: form.specialty,
          role: form.role, institution: form.institution, city: form.city, country: form.country,
          talks: [form.talk], featured: false, status: form.status as Speaker['status'],
          events: [], avatar_gradient: GRADIENTS[speakers.length % GRADIENTS.length],
        };
        setSpeakers(prev => [newSp, ...prev]);
      }
      setModalOpen(false);
    }, 700);
  };
  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este speaker? Esta acción no se puede deshacer.')) return;
    setDeleting(id);
    setTimeout(() => {
      setSpeakers(prev => prev.filter(s => s.id !== id));
      if (selected?.id === id) setSelected(null);
      setDeleting(null);
    }, 400);
  };
  const handleDuplicate = (sp: Speaker) => {
    const dup: Speaker = { ...sp, id: `sp-${Date.now()}`, name: `${sp.name} (copia)`, status: 'invitado', events: [], featured: false };
    setSpeakers(prev => [dup, ...prev]);
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
          <p className="mt-0.5 text-sm" style={{ color: '#7A9CB8' }}>Una ficha global por persona · historial de eventos · perfil público</p>
        </div>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}>
          <PlusIcon size={15} strokeWidth={2.5} /> Nuevo speaker
        </button>
      </div>

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
          {STATUS_FILTERS.map(f => (
            <button key={f} type="button" onClick={() => setStatusFilter(f)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all capitalize"
              style={{ background: statusFilter === f ? '#1e3450' : 'transparent', color: statusFilter === f ? '#E1EAF4' : '#2a4a6b' }}>
              {f === 'Todos' ? 'Todos' : STATUS_CONFIG[f as Speaker['status']].label}
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
          <div className="py-16 text-center" style={{ color: '#2a4a6b' }}><p className="text-sm">Sin resultados</p></div>
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
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: speaker.avatar_gradient }}>{initials(speaker.name)}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold" style={{ color: '#E1EAF4' }}>{speaker.name}</p>
                    {speaker.featured && <StarIcon size={11} style={{ color: '#F59E0B', flexShrink: 0 }} />}
                  </div>
                  <p className="text-xs" style={{ color: '#2a4a6b' }}>{speaker.city}, {speaker.country}</p>
                </div>
              </div>
              <p className="text-sm truncate" style={{ color: '#7A9CB8' }}>{speaker.specialty}</p>
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
              <div className="w-20 flex justify-end">
                <RowActions
                  onEdit={() => openEdit(speaker)}
                  onDuplicate={() => handleDuplicate(speaker)}
                  onDelete={() => handleDelete(speaker.id)}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Panel lateral de detalle */}
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
              <div className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white mb-3"
                style={{ background: selected.avatar_gradient }}>{initials(selected.name)}</div>
              {selected.featured && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#F59E0B' }}>
                  <StarIcon size={10} /> Destacado
                </span>
              )}
              <p className="text-base font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>{selected.name}</p>
              <p className="text-xs mt-1" style={{ color: '#7A9CB8' }}>{selected.role} · {selected.specialty}</p>
              <p className="text-xs mt-0.5" style={{ color: '#2a4a6b' }}>{selected.institution || '—'}</p>
              <p className="text-xs" style={{ color: '#2a4a6b' }}>{selected.city}, {selected.country}</p>
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
            {selected.events.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#2a4a6b' }}>Eventos</p>
                <div className="space-y-1">
                  {selected.events.map(ev => (
                    <div key={ev} className="rounded-lg px-3 py-2 text-xs" style={{ background: '#182d47', color: '#7A9CB8' }}>{ev}</div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 space-y-2">
              <button type="button" onClick={() => openEdit(selected)}
                className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{ background: '#00C9A0', color: '#0d1829' }}>Editar ficha</button>
              <button type="button"
                className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{ background: '#182d47', color: '#7A9CB8', border: '1px solid #1e3450' }}>Ver perfil público</button>
              <button type="button" onClick={() => handleDelete(selected.id)}
                className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{ background: 'rgba(242,68,99,.08)', color: '#F24463', border: '1px solid rgba(242,68,99,.2)' }}>Eliminar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal crear / editar */}
      <NovoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar speaker' : 'Nuevo speaker'}
        subtitle={editing ? `Editando ficha de ${editing.name}` : 'Agrega un nuevo ponente al catálogo global'}
        width={640}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={handleSave} disabled={saving || !form.name}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear speaker'}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-6">

          {/* Perfil */}
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
              <FormField label="Rol en el evento">
                <FormSelect value={form.role} onChange={f('role')} options={ROLES.map(r => ({ value: r, label: r }))} />
              </FormField>
              <FormField label="Institución">
                <FormInput value={form.institution} onChange={f('institution')} placeholder="Hospital, Universidad…" />
              </FormField>
              <FormField label="Estado">
                <FormSelect value={form.status} onChange={f('status')} options={STATUSES.map(s => ({ value: s, label: STATUS_CONFIG[s as Speaker['status']].label }))} />
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
            <FormField label="Biografía" hint="Aparecerá en el perfil público del evento">
              <FormTextarea value={form.bio} onChange={f('bio')} placeholder="Breve descripción del ponente…" rows={3} />
            </FormField>
          </FormSection>

          {/* Contacto */}
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

        </div>
      </NovoModal>
    </div>
  );
}
