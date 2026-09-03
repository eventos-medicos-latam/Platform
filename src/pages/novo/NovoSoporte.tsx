import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeadphonesIcon, MessageCircleIcon, CheckCircleIcon, ClockIcon,
  AlertCircleIcon, SearchIcon, PlusIcon, UserIcon, CalendarIcon,
} from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';

type TicketStatus   = 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';
type TicketPriority = 'alta' | 'media' | 'baja';
type TicketCategory = 'registro' | 'pago' | 'acceso' | 'contenido' | 'tecnico' | 'otro';

interface Ticket {
  id: string;
  subject: string;
  requester: string;
  email: string;
  event?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  created: string;
  messages: number;
  last_reply?: string;
}

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  abierto:     { label: 'Abierto',      color: '#F59E0B', bg: 'rgba(245,158,11,.12)',  icon: AlertCircleIcon  },
  en_progreso: { label: 'En progreso',  color: '#5B8AF0', bg: 'rgba(91,138,240,.12)',  icon: ClockIcon        },
  resuelto:    { label: 'Resuelto',     color: '#00C9A0', bg: 'rgba(0,201,160,.12)',   icon: CheckCircleIcon  },
  cerrado:     { label: 'Cerrado',      color: '#3A5470', bg: 'rgba(58,84,112,.12)',   icon: CheckCircleIcon  },
};

const PRIORITY_COLOR: Record<TicketPriority, string> = {
  alta:  '#F24463',
  media: '#F59E0B',
  baja:  '#3A5470',
};

const CAT_LABELS: Record<TicketCategory, string> = {
  registro:  'Registro',
  pago:      'Pago',
  acceso:    'Acceso',
  contenido: 'Contenido',
  tecnico:   'Técnico',
  otro:      'Otro',
};

const MOCK_TICKETS: Ticket[] = [
  { id: 'tkt001', subject: 'No me llega el QR de acceso',           requester: 'Dra. Laura Gómez',       email: 'lgomez@uni.edu.co',       event: 'La Eterna Primavera', status: 'abierto',     priority: 'alta',  category: 'acceso',    created: '2026-09-02', messages: 2  },
  { id: 'tkt002', subject: 'Quiero cambiar tipo de entrada',        requester: 'Felipe Restrepo',         email: 'frestrepo@roche.com',     event: 'La Eterna Primavera', status: 'en_progreso', priority: 'media', category: 'registro',  created: '2026-09-01', messages: 4  },
  { id: 'tkt003', subject: 'Pago duplicado en tarjeta',             requester: 'Alejandra Morales',       email: 'amorales@gmail.com',      event: 'La Eterna Primavera', status: 'abierto',     priority: 'alta',  category: 'pago',      created: '2026-09-01', messages: 1  },
  { id: 'tkt004', subject: 'No puedo descargar certificado',        requester: 'Dr. Juan E. Vargas',      email: 'jevargas@hospital.com',                                 status: 'resuelto',    priority: 'baja',  category: 'contenido', created: '2026-08-28', messages: 3,  last_reply: '2026-08-30' },
  { id: 'tkt005', subject: 'Error al completar registro online',    requester: 'Ricardo Patiño',          email: 'rpati@uni.edu.co',        event: 'Webinar Microbiota',  status: 'en_progreso', priority: 'media', category: 'tecnico',   created: '2026-08-27', messages: 5  },
  { id: 'tkt006', subject: 'Solicitud de factura electrónica',      requester: 'Sofía Castro',            email: 'scastro@novasc.com',      event: 'La Eterna Primavera', status: 'resuelto',    priority: 'baja',  category: 'pago',      created: '2026-08-25', messages: 2,  last_reply: '2026-08-26' },
  { id: 'tkt007', subject: 'Pregunta sobre patrocinio bronce',      requester: 'Marcos Velásquez',        email: 'mvelasquez@pfizer.com',                                 status: 'cerrado',     priority: 'baja',  category: 'otro',      created: '2026-08-20', messages: 6,  last_reply: '2026-08-22' },
];

const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
const GRADS = ['linear-gradient(135deg,#1a4a7a,#2d6fae)', 'linear-gradient(135deg,#1a6b5a,#00C9A0)', 'linear-gradient(135deg,#5b2d8a,#A78BFA)', 'linear-gradient(135deg,#7a3a1a,#FF7043)'];

const ALL_STATUSES: TicketStatus[] = ['abierto', 'en_progreso', 'resuelto', 'cerrado'];

export function NovoSoporte() {
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'todos'>('todos');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Ticket | null>(null);

  const filtered = MOCK_TICKETS.filter(t => {
    const matchS = statusFilter === 'todos' || t.status === statusFilter;
    const q = query.toLowerCase();
    const matchQ = !q || t.subject.toLowerCase().includes(q) || t.requester.toLowerCase().includes(q);
    return matchS && matchQ;
  });

  const counts = {
    abierto:     MOCK_TICKETS.filter(t => t.status === 'abierto').length,
    en_progreso: MOCK_TICKETS.filter(t => t.status === 'en_progreso').length,
    resuelto:    MOCK_TICKETS.filter(t => t.status === 'resuelto').length,
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>Ecosistema</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Soporte</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>Tickets · conversaciones · atención al participante</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{ background: 'rgba(0,201,160,.12)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
          <PlusIcon size={13} /> Nuevo ticket
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Abiertos"     value={counts.abierto.toString()}     icon={AlertCircleIcon} accent="#F59E0B" delay={0}    />
        <KPICard label="En progreso"  value={counts.en_progreso.toString()} icon={ClockIcon}       accent="#5B8AF0" delay={0.05} />
        <KPICard label="Resueltos"    value={counts.resuelto.toString()}    icon={CheckCircleIcon} accent="#00C9A0" delay={0.1}  />
        <KPICard label="Total"        value={MOCK_TICKETS.length.toString()} icon={HeadphonesIcon} accent="#7A9CB8" delay={0.15} />
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] rounded-xl px-3.5 py-2.5"
          style={{ background: '#112035', border: '1px solid #1e3450' }}>
          <SearchIcon size={14} style={{ color: '#2a4a6b' }} />
          <input className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#E1EAF4' }}
            placeholder="Buscar ticket o solicitante…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #1e3450' }}>
          {(['todos', ...ALL_STATUSES] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3.5 py-2 text-xs font-semibold transition-colors"
              style={{
                background: statusFilter === s ? '#182d47' : '#112035',
                color: statusFilter === s ? '#E1EAF4' : '#2a4a6b',
                borderRight: '1px solid #1e3450',
              }}>
              {s === 'todos' ? 'Todos' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-5">
        {/* Lista */}
        <div className="flex-1 overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
          {filtered.map((ticket, i) => {
            const st  = STATUS_CONFIG[ticket.status];
            const isSelected = selected?.id === ticket.id;
            return (
              <motion.div key={ticket.id}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.03 }}
                onClick={() => setSelected(isSelected ? null : ticket)}
                className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
                style={{
                  borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none',
                  background: isSelected ? '#182d47' : 'transparent',
                }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#182d4740')}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
              >
                {/* Prioridad */}
                <div className="h-10 w-1 rounded-full shrink-0"
                  style={{ background: PRIORITY_COLOR[ticket.priority] }} />
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: GRADS[i % GRADS.length] }}>
                  {initials(ticket.requester)}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#E1EAF4' }}>{ticket.subject}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px]" style={{ color: '#7A9CB8' }}>{ticket.requester}</span>
                    {ticket.event && <span className="text-[10px]" style={{ color: '#3A5470' }}>{ticket.event}</span>}
                    <span className="text-[10px]" style={{ color: '#3A5470' }}>{CAT_LABELS[ticket.category]}</span>
                  </div>
                </div>
                {/* Meta */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1" style={{ color: '#3A5470' }}>
                    <MessageCircleIcon size={11} />
                    <span className="text-[10px] tabular-nums">{ticket.messages}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: '#3A5470' }}>
                    {new Date(ticket.created).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ color: st.color, background: st.bg }}>
                    <st.icon size={9} /> {st.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm" style={{ color: '#2a4a6b' }}>Sin tickets</p>
            </div>
          )}
        </div>

        {/* Panel detalle */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 280 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden shrink-0 rounded-2xl"
              style={{ background: '#112035', border: '1px solid #1e3450' }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <p className="text-sm font-bold leading-snug" style={{ color: '#E1EAF4' }}>{selected.subject}</p>
                  <span className="shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ color: STATUS_CONFIG[selected.status].color, background: STATUS_CONFIG[selected.status].bg }}>
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                </div>

                {[
                  { icon: UserIcon,     label: 'Solicitante', value: selected.requester },
                  { icon: MessageCircleIcon, label: 'Categoría', value: CAT_LABELS[selected.category] },
                  { icon: CalendarIcon, label: 'Creado',      value: new Date(selected.created).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) },
                  ...(selected.event ? [{ icon: CalendarIcon, label: 'Evento', value: selected.event }] : []),
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 mb-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: '#182d47' }}>
                      <item.icon size={12} style={{ color: '#7A9CB8' }} />
                    </div>
                    <div>
                      <p className="text-[10px]" style={{ color: '#3A5470' }}>{item.label}</p>
                      <p className="text-xs font-semibold" style={{ color: '#E1EAF4' }}>{item.value}</p>
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-2 mt-1 mb-4">
                  <div className="h-2 w-2 rounded-full" style={{ background: PRIORITY_COLOR[selected.priority] }} />
                  <p className="text-[10px] font-semibold capitalize" style={{ color: '#7A9CB8' }}>
                    Prioridad {selected.priority}
                  </p>
                </div>

                <div className="rounded-xl p-3.5 mb-4" style={{ background: '#0d1829', border: '1px solid #1e3450' }}>
                  <div className="flex items-center gap-2">
                    <MessageCircleIcon size={12} style={{ color: '#3A5470' }} />
                    <p className="text-[10px]" style={{ color: '#3A5470' }}>{selected.messages} mensajes en el hilo</p>
                  </div>
                  {selected.last_reply && (
                    <p className="text-[10px] mt-1" style={{ color: '#2a4a6b' }}>
                      Última respuesta: {new Date(selected.last_reply).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button className="rounded-xl py-2 text-xs font-semibold"
                    style={{ background: 'rgba(0,201,160,.1)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
                    Responder
                  </button>
                  <button className="rounded-xl py-2 text-xs font-semibold"
                    style={{ background: '#182d47', color: '#7A9CB8', border: '1px solid #1e3450' }}>
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
