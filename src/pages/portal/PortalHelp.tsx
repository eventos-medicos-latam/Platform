import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, CreditCardIcon, FileTextIcon, HelpCircleIcon, PlusIcon, SendIcon, UsersIcon, XIcon } from 'lucide-react';
import { ModuleHeader } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { StatusBadge, type BadgeTone } from '../../components/ui/StatusBadge';
import { supabase } from '../../lib/supabaseClient';
import { EASE_EMPHASIS } from '../../utils/motion';

interface Ticket { id: string; subject: string; status: 'abierto' | 'en-proceso' | 'resuelto' | 'cerrado'; created_at: string; }
interface Message { id: string; ticket_id: string; author: string; is_admin: boolean; message: string; created_at: string; }

const ticketStatusMeta: Record<Ticket['status'], { label: string; tone: BadgeTone }> = {
  abierto: { label: 'Abierto', tone: 'warning' },
  'en-proceso': { label: 'En proceso', tone: 'info' },
  resuelto: { label: 'Resuelto', tone: 'success' },
  cerrado: { label: 'Cerrado', tone: 'neutral' }
};

const quickCategories = [{
  label: 'Pagos y facturación',
  prefix: 'Pagos y facturación: ',
  icon: CreditCardIcon,
  bg: 'bg-[#e8eef6]',
  fg: 'text-[#1c5f8c]'
}, {
  label: 'Documentos y contratos',
  prefix: 'Documentos y contratos: ',
  icon: FileTextIcon,
  bg: 'bg-[#f1eafb]',
  fg: 'text-[#7c6bc0]'
}, {
  label: 'Equipo e invitados',
  prefix: 'Equipo e invitados: ',
  icon: UsersIcon,
  bg: 'bg-[#e9f7f0]',
  fg: 'text-[#159a63]'
}, {
  label: 'Otro',
  prefix: '',
  icon: HelpCircleIcon,
  bg: 'bg-[#fdeef4]',
  fg: 'text-[#d6338c]'
}];

const faqs = [{
  q: '¿Cuándo recibo el boleto de mi equipo?',
  a: 'Por seguridad, el QR se activa 2 semanas antes del evento, cuando cada colaborador o invitado reconfirma su asistencia desde el enlace que le compartes.'
}, {
  q: '¿Cómo invito a un profesional?',
  a: 'Desde "Equipo e invitados", agrégalo con su nombre y correo — se genera un enlace único para que acepte o rechace la invitación.'
}, {
  q: '¿Puedo comprar tiquetes adicionales?',
  a: 'Sí, desde "Pagos y facturación" puedes comprar tiquetes extra a los que ya incluye tu plan, pagando con Wompi.'
}];

export function PortalHelp() {
  const { session, activeEditionId } = usePlatform();
  const companyId = session?.companyId;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [openFaq, setOpenFaq] = useState(0);

  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async (selectAfter?: string) => {
    if (!companyId) return;
    const { data: ticketRows } = await supabase.from('support_tickets').select('id, subject, status, created_at').eq('company_id', companyId).order('created_at', { ascending: false });
    setTickets(ticketRows ?? []);
    if (selectAfter) setSelectedId(selectAfter);
    else if (!selectedId && ticketRows && ticketRows.length > 0) setSelectedId(ticketRows[0].id);
    const ids = (ticketRows ?? []).map((row) => row.id);
    if (ids.length) {
      const { data: messageRows } = await supabase.from('support_ticket_messages').select('id, ticket_id, author, is_admin, message, created_at').in('ticket_id', ids).order('created_at');
      setMessages(messageRows ?? []);
    } else {
      setMessages([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const openNewTicket = (prefix = '') => {
    setSubject(prefix);
    setFirstMessage('');
    setNewTicketOpen(true);
  };

  const createTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyId || !subject.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from('support_tickets').insert({ company_id: companyId, edition_id: activeEditionId, subject }).select('id').single();
    if (!error && data && firstMessage.trim()) {
      await supabase.from('support_ticket_messages').insert({ ticket_id: data.id, author: session?.name ?? 'Empresa', is_admin: false, message: firstMessage });
    }
    setSaving(false);
    setNewTicketOpen(false);
    load(data?.id);
  };

  const sendReply = async (ticketId: string) => {
    if (!reply.trim()) return;
    await supabase.from('support_ticket_messages').insert({ ticket_id: ticketId, author: session?.name ?? 'Empresa', is_admin: false, message: reply.trim() });
    setReply('');
    load(ticketId);
  };

  if (!companyId) {
    return <ModuleHeader eyebrow="Portal" title="Ayuda" description="Tu usuario todavía no está vinculado a una empresa. Contacta al equipo organizador." />;
  }

  const selected = tickets.find((ticket) => ticket.id === selectedId);
  const thread = messages.filter((message) => message.ticket_id === selectedId);

  return <>
      <ModuleHeader eyebrow="Portal" title="Ayuda" description="Escríbenos, elige una categoría o revisa las preguntas frecuentes antes de abrir una solicitud." actions={<button type="button" onClick={() => openNewTicket()} className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-xs font-bold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
            <PlusIcon size={14} /> Nueva solicitud
          </button>} />

      {/* Categorías rápidas */}
      <div className="mb-5 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {quickCategories.map((category) => <button key={category.label} type="button" onClick={() => openNewTicket(category.prefix)} className="card-lift flex flex-col items-start gap-2.5 rounded-2xl border border-line bg-white p-4 text-left">
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${category.bg} ${category.fg}`}>
              <category.icon size={17} />
            </span>
            <p className="text-[13.5px] font-extrabold text-brand">{category.label}</p>
          </button>)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-4">
          {/* FAQ */}
          <div className="rounded-2xl border border-line bg-white px-5">
            <h3 className="pt-4 text-sm font-extrabold text-brand">Preguntas frecuentes</h3>
            <div className="divide-y divide-line">
              {faqs.map((faq, index) => <div key={faq.q}>
                  <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between gap-3 py-3.5 text-left text-[13px] font-bold text-brand">
                    {faq.q}
                    <ChevronDownIcon size={15} className={`shrink-0 text-ink-muted transition-transform duration-200 ease-emphasis ${openFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === index ? <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18, ease: EASE_EMPHASIS }} className="overflow-hidden">
                        <p className="pb-4 text-[12.5px] leading-relaxed text-ink-muted">{faq.a}</p>
                      </motion.div> : null}
                  </AnimatePresence>
                </div>)}
            </div>
          </div>

          {/* Lista de solicitudes */}
          <div>
            <p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-ink-muted">
              Tus solicitudes
            </p>
            <div className="flex flex-col gap-2.5">
              {tickets.map((ticket) => {
              const ticketThread = messages.filter((message) => message.ticket_id === ticket.id);
              const last = ticketThread[ticketThread.length - 1];
              return <button key={ticket.id} type="button" onClick={() => setSelectedId(ticket.id)} className={`rounded-2xl border p-3.5 text-left transition-colors duration-150 ease-emphasis ${selectedId === ticket.id ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand-support/50'}`}>
                    <p className="text-[13px] font-extrabold text-brand">{ticket.subject}</p>
                    {last ? <p className="mt-1 truncate text-xs text-ink-muted">{last.message}</p> : null}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <StatusBadge label={ticketStatusMeta[ticket.status].label} tone={ticketStatusMeta[ticket.status].tone} />
                      <span className="text-[11px] text-ink-muted">{new Date(ticket.created_at).toLocaleDateString('es-CO')}</span>
                    </div>
                  </button>;
            })}
              {tickets.length === 0 ? <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">
                  Sin solicitudes todavía.
                </p> : null}
            </div>
          </div>
        </div>

        {/* Hilo del ticket seleccionado */}
        <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-line bg-white">
          {selected ? <>
              <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
                <div>
                  <h3 className="text-[15px] font-extrabold text-brand">{selected.subject}</h3>
                  <p className="mt-0.5 text-xs text-ink-muted">Abierta el {new Date(selected.created_at).toLocaleDateString('es-CO')}</p>
                </div>
                <StatusBadge label={ticketStatusMeta[selected.status].label} tone={ticketStatusMeta[selected.status].tone} />
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                {thread.map((message) => <div key={message.id} className={`flex items-start gap-2.5 ${message.is_admin ? '' : 'flex-row-reverse'}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${message.is_admin ? 'bg-brand-soft text-brand' : 'bg-brand text-white'}`}>
                      {message.author.split(' ').filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase()}
                    </span>
                    <div className={`flex max-w-[78%] flex-col ${message.is_admin ? 'items-start' : 'items-end'}`}>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${message.is_admin ? 'rounded-tl-sm border border-line bg-white text-ink' : 'rounded-tr-sm bg-brand text-white'}`}>
                        {message.message}
                      </div>
                      <p className="mt-1 text-[11px] text-ink-muted">
                        {message.author} · {new Date(message.created_at).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>)}
                {thread.length === 0 ? <p className="text-sm text-ink-muted">Sin mensajes todavía.</p> : null}
              </div>

              {selected.status !== 'cerrado' ? <form className="flex gap-2.5 border-t border-line px-5 py-4" onSubmit={(event) => { event.preventDefault(); sendReply(selected.id); }}>
                  <input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Escribe un mensaje…" className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
                  <button type="submit" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
                    <SendIcon size={16} />
                  </button>
                </form> : null}
            </> : <div className="flex flex-1 items-center justify-center p-10 text-center text-sm text-ink-muted">
              Selecciona una solicitud para ver la conversación, o crea una nueva.
            </div>}
        </div>
      </div>

      <AnimatePresence>
        {newTicketOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-deep/55 p-4 backdrop-blur-[2px]" onClick={() => setNewTicketOpen(false)}>
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.18, ease: EASE_EMPHASIS }} className="w-full max-w-md rounded-2xl bg-white p-7 shadow-lift" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-extrabold text-brand">Nueva solicitud</h3>
                <button type="button" onClick={() => setNewTicketOpen(false)} className="rounded-lg p-1.5 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-canvas hover:text-brand">
                  <XIcon size={18} />
                </button>
              </div>
              <form className="mt-5 space-y-3.5" onSubmit={createTicket}>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-ink-muted">Asunto</span>
                  <input required value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Ej. Necesito la factura de..." className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-ink-muted">Cuéntanos qué necesitas</span>
                  <textarea rows={3} value={firstMessage} onChange={(event) => setFirstMessage(event.target.value)} placeholder="Describe tu solicitud con el mayor detalle posible…" className="w-full resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
                </label>
                <button type="submit" disabled={saving} className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
                  {saving ? 'Enviando…' : 'Enviar solicitud'}
                </button>
              </form>
            </motion.div>
          </div> : null}
      </AnimatePresence>
    </>;
}
