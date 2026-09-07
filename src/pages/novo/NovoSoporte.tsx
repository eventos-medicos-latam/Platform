import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeadphonesIcon, MessageCircleIcon, CheckCircleIcon, ClockIcon,
  AlertCircleIcon, SearchIcon, PlusIcon, UserIcon, CalendarIcon,
  SendIcon, XIcon, ChevronDownIcon,
} from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { RowActions } from '../../components/novo/ui/RowActions';
import {
  NovoModal, ModalBtn, FormField, FormInput, FormSelect, FormTextarea, FormSection,
} from '../../components/novo/ui/NovoModal';

/* ── Tipos ─────────────────────────────────────────────────── */
type TicketStatus   = 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';
type TicketPriority = 'alta' | 'media' | 'baja';
type TicketCategory = 'registro' | 'pago' | 'acceso' | 'contenido' | 'tecnico' | 'otro';

interface TicketMessage { author: string; text: string; time: string; isAdmin: boolean; }
interface Ticket {
  id: string; subject: string; requester: string; email: string;
  event?: string; status: TicketStatus; priority: TicketPriority;
  category: TicketCategory; created: string; messages: TicketMessage[];
}

/* ── Config ────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  abierto:     { label: 'Abierto',     color: '#F59E0B', bg: 'rgba(245,158,11,.12)',  icon: AlertCircleIcon  },
  en_progreso: { label: 'En progreso', color: '#5B8AF0', bg: 'rgba(91,138,240,.12)',  icon: ClockIcon        },
  resuelto:    { label: 'Resuelto',    color: '#00C9A0', bg: 'rgba(0,201,160,.12)',   icon: CheckCircleIcon  },
  cerrado:     { label: 'Cerrado',     color: '#3A5470', bg: 'rgba(58,84,112,.12)',   icon: CheckCircleIcon  },
};
const PRIORITY_COLOR: Record<TicketPriority, string> = { alta: '#F24463', media: '#F59E0B', baja: '#3A5470' };
const CAT_LABELS: Record<TicketCategory, string> = {
  registro:'Registro', pago:'Pago', acceso:'Acceso',
  contenido:'Contenido', tecnico:'Técnico', otro:'Otro',
};
const BG = '#112035'; const BORDER = '#1e3450';
const TEXT_HI = '#E1EAF4'; const TEXT_LO = '#7A9CB8'; const TEXT_DIM = '#3A5470';
const GRADS = ['linear-gradient(135deg,#1a4a7a,#2d6fae)', 'linear-gradient(135deg,#1a6b5a,#00C9A0)', 'linear-gradient(135deg,#5b2d8a,#A78BFA)', 'linear-gradient(135deg,#7a3a1a,#FF7043)'];
const ALL_STATUSES: TicketStatus[] = ['abierto', 'en_progreso', 'resuelto', 'cerrado'];
const EVENTS = ['La Eterna Primavera', 'Hormobiota VI', 'Webinar Vitamina D'];

/* ── Datos mock ────────────────────────────────────────────── */
const INIT_TICKETS: Ticket[] = [
  { id:'tkt001', subject:'No me llega el QR de acceso',        requester:'Dra. Laura Gómez',   email:'lgomez@uni.edu.co',     event:'La Eterna Primavera', status:'abierto',     priority:'alta',  category:'acceso',   created:'2026-09-02',
    messages:[{ author:'Dra. Laura Gómez', text:'Hola, compré mi entrada hace 3 días y aún no recibo el QR de acceso. ¿Pueden ayudarme?', time:'02 sep 10:23', isAdmin:false }, { author:'Soporte EML', text:'Buenos días, ya revisamos su registro. El QR fue enviado al correo lgomez@uni.edu.co. Por favor verifique la bandeja de spam.', time:'02 sep 11:45', isAdmin:true }] },
  { id:'tkt002', subject:'Quiero cambiar tipo de entrada',     requester:'Felipe Restrepo',     email:'frestrepo@roche.com',   event:'La Eterna Primavera', status:'en_progreso', priority:'media', category:'registro', created:'2026-09-01',
    messages:[{ author:'Felipe Restrepo', text:'Quisiera cambiar mi entrada General a VIP. ¿Es posible?', time:'01 sep 09:00', isAdmin:false }] },
  { id:'tkt003', subject:'Pago duplicado en tarjeta',          requester:'Alejandra Morales',   email:'amorales@gmail.com',    event:'La Eterna Primavera', status:'abierto',     priority:'alta',  category:'pago',     created:'2026-09-01',
    messages:[{ author:'Alejandra Morales', text:'Realizé el pago y me cobró dos veces. Adjunto el extracto bancario.', time:'01 sep 14:10', isAdmin:false }] },
  { id:'tkt004', subject:'No puedo descargar certificado',     requester:'Dr. Juan E. Vargas',  email:'jevargas@hospital.com',                               status:'resuelto',    priority:'baja',  category:'contenido',created:'2026-08-28',
    messages:[{ author:'Dr. Juan E. Vargas', text:'El link de descarga del certificado no funciona.', time:'28 ago 16:00', isAdmin:false }, { author:'Soporte EML', text:'Hemos regenerado su certificado. Puede descargarlo aquí: [link]. Disculpe las molestias.', time:'30 ago 09:00', isAdmin:true }] },
  { id:'tkt005', subject:'Error al completar registro online', requester:'Ricardo Patiño',      email:'rpati@uni.edu.co',      event:'Webinar Vitamina D',  status:'en_progreso', priority:'media', category:'tecnico',  created:'2026-08-27',
    messages:[{ author:'Ricardo Patiño', text:'Al hacer clic en "Confirmar inscripción" aparece un error 500.', time:'27 ago 18:30', isAdmin:false }] },
];

const EMPTY_FORM = {
  subject: '', requester: '', email: '', event: '',
  priority: 'media' as TicketPriority, category: 'otro' as TicketCategory,
  message: '',
};

const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

/* ══════════════════════════════════════════════════════════ */
export function NovoSoporte() {
  const [tickets, setTickets]     = useState<Ticket[]>(INIT_TICKETS);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'todos'>('todos');
  const [query, setQuery]         = useState('');
  const [selected, setSelected]   = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying]   = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  /* ── Stats ─────────────────────────────────────────────── */
  const counts = {
    abierto:     tickets.filter(t => t.status === 'abierto').length,
    en_progreso: tickets.filter(t => t.status === 'en_progreso').length,
    resuelto:    tickets.filter(t => t.status === 'resuelto').length,
  };

  const filtered = tickets.filter(t => {
    const matchS = statusFilter === 'todos' || t.status === statusFilter;
    const q = query.toLowerCase();
    const matchQ = !q || t.subject.toLowerCase().includes(q) || t.requester.toLowerCase().includes(q);
    return matchS && matchQ;
  });

  /* ── CRUD ───────────────────────────────────────────────── */
  const openCreate = () => { setForm(EMPTY_FORM); setModalOpen(true); };
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      const newT: Ticket = {
        id: `tkt${Date.now()}`,
        subject: form.subject, requester: form.requester, email: form.email,
        event: form.event || undefined, status: 'abierto',
        priority: form.priority, category: form.category, created: new Date().toISOString().split('T')[0],
        messages: form.message ? [{ author: form.requester, text: form.message, time: 'Ahora', isAdmin: false }] : [],
      };
      setTickets(prev => [newT, ...prev]);
      setSaving(false); setModalOpen(false);
    }, 650);
  };

  const handleDeleteTicket = (id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const handleReply = () => {
    if (!replyText.trim() || !selected) return;
    setReplying(true);
    setTimeout(() => {
      const msg: TicketMessage = { author: 'Soporte EML', text: replyText, time: 'Ahora', isAdmin: true };
      const updated = { ...selected, messages: [...selected.messages, msg], status: 'en_progreso' as TicketStatus };
      setTickets(prev => prev.map(t => t.id === selected.id ? updated : t));
      setSelected(updated);
      setReplyText('');
      setReplying(false);
    }, 500);
  };

  const handleClose = (id: string) => {
    const updated = tickets.map(t => t.id === id ? { ...t, status: 'resuelto' as TicketStatus } : t);
    setTickets(updated);
    if (selected?.id === id) setSelected({ ...selected, status: 'resuelto' });
  };

  const f = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  /* ─────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>Ecosistema</p>
          <h1 className="text-xl font-bold" style={{ color: TEXT_HI, fontFamily: "'Sora', sans-serif" }}>Soporte</h1>
          <p className="text-sm mt-0.5" style={{ color: TEXT_LO }}>Tickets · conversaciones · atención al participante</p>
        </div>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}>
          <PlusIcon size={15} strokeWidth={2.5} /> Nuevo ticket
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Abiertos"    value={counts.abierto.toString()}     icon={AlertCircleIcon} accent="#F59E0B" delay={0}    />
        <KPICard label="En progreso" value={counts.en_progreso.toString()} icon={ClockIcon}       accent="#5B8AF0" delay={0.05} />
        <KPICard label="Resueltos"   value={counts.resuelto.toString()}    icon={CheckCircleIcon} accent="#00C9A0" delay={0.1}  />
        <KPICard label="Total"       value={tickets.length.toString()}     icon={HeadphonesIcon}  accent="#7A9CB8" delay={0.15} />
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] rounded-xl px-3.5 py-2.5"
          style={{ background: BG, border: `1px solid ${BORDER}` }}>
          <SearchIcon size={14} style={{ color: TEXT_DIM }} />
          <input className="flex-1 bg-transparent text-sm outline-none" style={{ color: TEXT_HI }}
            placeholder="Buscar ticket o solicitante…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          {(['todos', ...ALL_STATUSES] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3.5 py-2 text-xs font-semibold transition-colors"
              style={{ background: statusFilter === s ? '#182d47' : BG, color: statusFilter === s ? TEXT_HI : TEXT_DIM, borderRight: `1px solid ${BORDER}` }}>
              {s === 'todos' ? 'Todos' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-5">
        {/* Lista */}
        <div className="flex-1 overflow-hidden rounded-2xl" style={{ background: BG, border: `1px solid ${BORDER}` }}>
          {filtered.map((ticket, i) => {
            const st = STATUS_CONFIG[ticket.status];
            const isSelected = selected?.id === ticket.id;
            return (
              <motion.div key={ticket.id}
                initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.03 }}
                onClick={() => setSelected(isSelected ? null : ticket)}
                className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none',
                  background: isSelected ? '#182d47' : 'transparent' }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#182d4740')}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
              >
                <div className="h-10 w-1 rounded-full shrink-0" style={{ background: PRIORITY_COLOR[ticket.priority] }} />
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: GRADS[i % GRADS.length] }}>
                  {initials(ticket.requester)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: TEXT_HI }}>{ticket.subject}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px]" style={{ color: TEXT_LO }}>{ticket.requester}</span>
                    {ticket.event && <span className="text-[10px]" style={{ color: TEXT_DIM }}>{ticket.event}</span>}
                    <span className="text-[10px]" style={{ color: TEXT_DIM }}>{CAT_LABELS[ticket.category]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1" style={{ color: TEXT_DIM }}>
                    <MessageCircleIcon size={11} />
                    <span className="text-[10px] tabular-nums">{ticket.messages.length}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: TEXT_DIM }}>
                    {new Date(ticket.created).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ color: st.color, background: st.bg }}>
                    <st.icon size={9} /> {st.label}
                  </span>
                  <div onClick={e => e.stopPropagation()}>
                    <RowActions onDelete={() => handleDeleteTicket(ticket.id)} />
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm" style={{ color: TEXT_DIM }}>Sin tickets</p>
            </div>
          )}
        </div>

        {/* Panel conversación */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 320 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden shrink-0 rounded-2xl flex flex-col"
              style={{ background: BG, border: `1px solid ${BORDER}`, maxHeight: 600 }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 px-5 py-4"
                style={{ borderBottom: `1px solid ${BORDER}`, background: '#182d47' }}>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-snug truncate" style={{ color: TEXT_HI }}>{selected.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ color: STATUS_CONFIG[selected.status].color, background: STATUS_CONFIG[selected.status].bg }}>
                      {selected.status === 'abierto' && <AlertCircleIcon size={9} />}
                      {STATUS_CONFIG[selected.status].label}
                    </span>
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: PRIORITY_COLOR[selected.priority] }} />
                    <span className="text-[10px] capitalize" style={{ color: TEXT_DIM }}>Prioridad {selected.priority}</span>
                  </div>
                </div>
                <button type="button" onClick={() => setSelected(null)}
                  className="rounded-lg p-1 hover:bg-white/5 shrink-0" style={{ color: TEXT_DIM }}>
                  <XIcon size={14} />
                </button>
              </div>

              {/* Info */}
              <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: GRADS[0] }}>{initials(selected.requester)}</div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: TEXT_HI }}>{selected.requester}</p>
                  <p className="text-[10px] truncate" style={{ color: TEXT_DIM }}>{selected.email}</p>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {selected.messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col gap-1 ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
                    <p className="text-[10px]" style={{ color: TEXT_DIM }}>{msg.author} · {msg.time}</p>
                    <div className="max-w-[90%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed"
                      style={{
                        background: msg.isAdmin ? 'rgba(0,201,160,.12)' : '#182d47',
                        color: msg.isAdmin ? '#E1EAF4' : TEXT_LO,
                        border: msg.isAdmin ? '1px solid rgba(0,201,160,.2)' : `1px solid ${BORDER}`,
                      }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {selected.messages.length === 0 && (
                  <p className="text-center text-xs py-4" style={{ color: TEXT_DIM }}>Sin mensajes aún</p>
                )}
              </div>

              {/* Reply box */}
              {selected.status !== 'resuelto' && selected.status !== 'cerrado' ? (
                <div className="px-5 py-4 space-y-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <textarea
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs outline-none resize-none"
                    style={{ background: '#0d1829', border: `1px solid ${BORDER}`, color: TEXT_HI, minHeight: 64 }}
                    placeholder="Escribe tu respuesta…"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={handleReply} disabled={!replyText.trim() || replying}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                      style={{ background: '#00C9A0', color: '#0d1829' }}>
                      <SendIcon size={11} /> {replying ? 'Enviando…' : 'Responder'}
                    </button>
                    <button type="button" onClick={() => handleClose(selected.id)}
                      className="rounded-xl px-3 py-2 text-xs font-semibold"
                      style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}>
                      Resolver
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-3 flex items-center gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <CheckCircleIcon size={14} style={{ color: '#00C9A0' }} />
                  <p className="text-xs" style={{ color: TEXT_LO }}>Ticket resuelto</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal nuevo ticket */}
      <NovoModal open={modalOpen} onClose={() => setModalOpen(false)}
        title="Nuevo ticket de soporte"
        subtitle="Registra una consulta o problema de un participante"
        width={560}
        footer={<>
          <ModalBtn variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</ModalBtn>
          <ModalBtn variant="primary" onClick={handleSave} disabled={saving || !form.subject || !form.requester}>
            {saving ? 'Creando…' : 'Crear ticket'}
          </ModalBtn>
        </>}
      >
        <FormSection title="Solicitante">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombre completo" required>
              <FormInput placeholder="Dra. Laura Gómez" value={form.requester} onChange={f('requester')} />
            </FormField>
            <FormField label="Email">
              <FormInput type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={f('email')} />
            </FormField>
          </div>
        </FormSection>
        <FormSection title="Ticket">
          <FormField label="Asunto" required>
            <FormInput placeholder="Describe brevemente el problema…" value={form.subject} onChange={f('subject')} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Categoría">
              <FormSelect value={form.category} onChange={f('category')}
                options={Object.entries(CAT_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            </FormField>
            <FormField label="Prioridad">
              <FormSelect value={form.priority} onChange={f('priority')}
                options={[{ value:'alta', label:'Alta' }, { value:'media', label:'Media' }, { value:'baja', label:'Baja' }]} />
            </FormField>
            <FormField label="Evento relacionado" className="col-span-2">
              <FormSelect value={form.event} onChange={f('event')}
                options={[{ value:'', label:'Sin evento específico' }, ...EVENTS.map(e => ({ value: e, label: e }))]} />
            </FormField>
          </div>
          <FormField label="Mensaje inicial">
            <FormTextarea placeholder="Descripción detallada del problema…" value={form.message} onChange={f('message')} rows={4} />
          </FormField>
        </FormSection>
      </NovoModal>
    </div>
  );
}
