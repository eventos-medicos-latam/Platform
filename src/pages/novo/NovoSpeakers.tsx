import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, SearchIcon, MicIcon, LockIcon, StarIcon, GlobeIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';

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
  declinado:  { label: 'Declinado', color: '#F24463', bg: 'rgba(242,68,99,.12)'  },
};

const GRADIENTS = [
  'linear-gradient(135deg,#00C9A0,#007AFF)',
  'linear-gradient(135deg,#A78BFA,#5B8AF0)',
  'linear-gradient(135deg,#FF7043,#F59E0B)',
  'linear-gradient(135deg,#5B8AF0,#00C9A0)',
  'linear-gradient(135deg,#F59E0B,#FF7043)',
  'linear-gradient(135deg,#00C9A0,#A78BFA)',
];

const MOCK_SPEAKERS: Speaker[] = [
  { id: 'sp-001', name: 'Dra. Valentina Ospina',   specialty: 'Endocrinología',       role: 'Conferencista',  institution: 'U. de Antioquia',       country: 'Colombia', city: 'Medellín', talks: ['Disruptores endocrinos y microbiota'],         featured: true,  status: 'publicado',  events: ['La Eterna Primavera', 'Hormobiota VI'], avatar_gradient: GRADIENTS[0] },
  { id: 'sp-002', name: 'Dr. Carlos Montoya',       specialty: 'Medicina funcional',   role: 'Panelista',      institution: 'Clínica Montoya',        country: 'Colombia', city: 'Bogotá',   talks: ['Eje intestino-cerebro en 2025'],               featured: true,  status: 'publicado',  events: ['Hormobiota VI'],                         avatar_gradient: GRADIENTS[1] },
  { id: 'sp-003', name: 'Dr. Andrés Morales',       specialty: 'Gastroenterología',    role: 'Conferencista',  institution: 'Hospital Pablo Tobón',   country: 'Colombia', city: 'Medellín', talks: ['Permeabilidad intestinal: evidencia actual'],  featured: false, status: 'confirmado', events: ['La Eterna Primavera'],                   avatar_gradient: GRADIENTS[2] },
  { id: 'sp-004', name: 'Dra. Carolina Mejía',      specialty: 'Nutrición clínica',    role: 'Tallerista',     institution: 'CES Universidad',        country: 'Colombia', city: 'Medellín', talks: ['Dieta y modulación del microbioma'],           featured: false, status: 'confirmado', events: ['La Eterna Primavera'],                   avatar_gradient: GRADIENTS[3] },
  { id: 'sp-005', name: 'Juan Pablo Restrepo',      specialty: 'Psiquiatría',          role: 'Moderador',      institution: 'PENDIENTE',              country: 'Colombia', city: 'Bogotá',   talks: ['PENDIENTE'],                                  featured: false, status: 'invitado',   events: ['Hormobiota VI'],                         avatar_gradient: GRADIENTS[4] },
  { id: 'sp-006', name: 'Dra. María Fernanda Díaz', specialty: 'Medicina integrativa', role: 'Conferencista',  institution: 'Centro Médico Imbanaco', country: 'Colombia', city: 'Cali',     talks: ['Fitoterapia y eje hormonal'],                  featured: true,  status: 'publicado',  events: ['La Eterna Primavera'],                   avatar_gradient: GRADIENTS[5] },
  { id: 'sp-007', name: 'Dr. Roberto Ángel',        specialty: 'Cardiología',          role: 'Conferencista',  institution: 'Cardiodiagnóstico',      country: 'Colombia', city: 'Medellín', talks: ['PENDIENTE'],                                  featured: false, status: 'pendiente',  events: [],                                        avatar_gradient: GRADIENTS[1] },
  { id: 'sp-008', name: 'Dra. Lucía Ramírez',       specialty: 'Dermatología',         role: 'Panelista',      institution: 'PENDIENTE',              country: 'Colombia', city: 'Barranquilla', talks: ['Piel y disbiosis intestinal'],             featured: false, status: 'declinado',  events: [],                                        avatar_gradient: GRADIENTS[2] },
];

type StatusFilter = 'Todos' | Speaker['status'];
const STATUS_FILTERS: StatusFilter[] = ['Todos', 'publicado', 'confirmado', 'invitado', 'pendiente', 'declinado'];

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export function NovoSpeakers() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Speaker | null>(null);

  const filtered = MOCK_SPEAKERS.filter(s => {
    const matchStatus = statusFilter === 'Todos' || s.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      s.name.toLowerCase().includes(q) ||
      s.specialty.toLowerCase().includes(q) ||
      s.institution.toLowerCase().includes(q) ||
      s.talks.some(t => t.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const publicados  = MOCK_SPEAKERS.filter(s => s.status === 'publicado').length;
  const confirmados = MOCK_SPEAKERS.filter(s => s.status === 'confirmado').length;
  const pendientes  = MOCK_SPEAKERS.filter(s => s.status === 'invitado' || s.status === 'pendiente').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>
            Catálogo global
          </p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>
            Speakers
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#7A9CB8' }}>
            Una ficha global por persona · historial de eventos · perfil público
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}
        >
          <PlusIcon size={15} strokeWidth={2.5} /> Nuevo speaker
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Total speakers" value={MOCK_SPEAKERS.length.toString()} sub="en la plataforma" icon={MicIcon} delay={0} />
        <KPICard label="Publicados" value={publicados.toString()} sub="visibles en la web" icon={GlobeIcon} accent="#00C9A0" delay={0.05} />
        <KPICard label="Confirmados" value={confirmados.toString()} sub="listos para publicar" icon={CheckCircleIcon} accent="#5B8AF0" delay={0.1} />
        <KPICard label="Por confirmar" value={pendientes.toString()} sub="invitados o pendientes" icon={XCircleIcon} accent="#F59E0B" delay={0.15} />
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex items-center" style={{ background: '#112035', border: '1px solid #1e3450', borderRadius: 12 }}>
          <SearchIcon size={14} className="absolute left-3" style={{ color: '#2a4a6b' }} />
          <input
            type="text"
            placeholder="Buscar speaker..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent pl-9 pr-4 py-2 text-sm outline-none w-56"
            style={{ color: '#E1EAF4' }}
          />
        </div>
        <div className="flex gap-0.5 p-1 rounded-xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
          {STATUS_FILTERS.map(f => (
            <button key={f} type="button" onClick={() => setStatusFilter(f)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 capitalize"
              style={{ background: statusFilter === f ? '#1e3450' : 'transparent', color: statusFilter === f ? '#E1EAF4' : '#2a4a6b' }}>
              {f === 'Todos' ? 'Todos' : STATUS_CONFIG[f as Speaker['status']].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid #1e3450', background: '#112035' }}>
        <div className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-3"
          style={{ gridTemplateColumns: '2.5fr 1.5fr 1.5fr 1fr 1fr 1fr', color: '#2a4a6b', borderBottom: '1px solid #1a2e45', background: '#182d47' }}>
          <span>Speaker</span><span>Especialidad</span><span>Tema</span><span>Institución</span><span>Eventos</span><span>Estado</span>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: '#2a4a6b' }}>
            <p className="text-sm">Sin resultados</p>
          </div>
        )}

        {filtered.map((speaker, i) => {
          const st = STATUS_CONFIG[speaker.status];
          const canPublish = speaker.status === 'confirmado' || speaker.status === 'publicado';
          const pending = (v: string) => v === 'PENDIENTE' || !v;
          return (
            <motion.div
              key={speaker.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1], delay: i * 0.04 }}
              className="group grid items-center px-5 py-3.5 cursor-pointer transition-colors duration-150"
              style={{ gridTemplateColumns: '2.5fr 1.5fr 1.5fr 1fr 1fr 1fr', borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#182d47')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => setSelected(selected?.id === speaker.id ? null : speaker)}
            >
              {/* Nombre */}
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: speaker.avatar_gradient }}>
                  {initials(speaker.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold" style={{ color: '#E1EAF4' }}>{speaker.name}</p>
                    {speaker.featured && <StarIcon size={11} style={{ color: '#F59E0B', flexShrink: 0 }} />}
                  </div>
                  <p className="text-xs" style={{ color: '#2a4a6b' }}>{speaker.city}, {speaker.country}</p>
                </div>
              </div>

              {/* Especialidad */}
              <p className="text-sm truncate" style={{ color: '#7A9CB8' }}>{speaker.specialty}</p>

              {/* Tema */}
              <p className="text-sm truncate pr-2" style={{ color: pending(speaker.talks[0]) ? '#2a4a6b' : '#7A9CB8', fontStyle: pending(speaker.talks[0]) ? 'italic' : 'normal' }}>
                {pending(speaker.talks[0]) ? 'Pendiente' : speaker.talks[0]}
              </p>

              {/* Institución */}
              <p className="text-xs truncate" style={{ color: pending(speaker.institution) ? '#2a4a6b' : '#7A9CB8', fontStyle: pending(speaker.institution) ? 'italic' : 'normal' }}>
                {pending(speaker.institution) ? '—' : speaker.institution}
              </p>

              {/* Eventos */}
              <p className="text-xs tabular-nums" style={{ color: speaker.events.length > 0 ? '#7A9CB8' : '#2a4a6b' }}>
                {speaker.events.length > 0 ? `${speaker.events.length} evento${speaker.events.length > 1 ? 's' : ''}` : '—'}
              </p>

              {/* Estado */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ color: st.color, background: st.bg }}>
                  {st.label}
                </span>
                {!canPublish && <LockIcon size={11} style={{ color: '#2a4a6b' }} />}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Panel lateral de detalle */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-0 right-0 h-screen w-80 overflow-y-auto p-6 z-50"
            style={{ background: '#112035', borderLeft: '1px solid #1e3450' }}
          >
            <button type="button" onClick={() => setSelected(null)}
              className="mb-5 text-xs font-semibold opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: '#7A9CB8' }}>
              ← Cerrar
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white mb-3"
                style={{ background: selected.avatar_gradient }}>
                {initials(selected.name)}
              </div>
              {selected.featured && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#F59E0B' }}>
                  <StarIcon size={10} /> Destacado
                </span>
              )}
              <p className="text-base font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>{selected.name}</p>
              <p className="text-xs mt-1" style={{ color: '#7A9CB8' }}>{selected.role} · {selected.specialty}</p>
              <p className="text-xs mt-0.5" style={{ color: '#2a4a6b' }}>{selected.institution !== 'PENDIENTE' ? selected.institution : '—'}</p>
              <p className="text-xs" style={{ color: '#2a4a6b' }}>{selected.city}, {selected.country}</p>
            </div>

            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold mb-5"
              style={{ color: STATUS_CONFIG[selected.status].color, background: STATUS_CONFIG[selected.status].bg }}>
              {STATUS_CONFIG[selected.status].label}
            </span>

            {selected.talks[0] && selected.talks[0] !== 'PENDIENTE' && (
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
                    <div key={ev} className="rounded-lg px-3 py-2 text-xs" style={{ background: '#182d47', color: '#7A9CB8' }}>
                      {ev}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 space-y-2">
              <button type="button" className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{ background: '#00C9A0', color: '#0d1829' }}>
                Editar ficha
              </button>
              <button type="button" className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{ background: '#182d47', color: '#7A9CB8', border: '1px solid #1e3450' }}>
                Ver perfil público
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
