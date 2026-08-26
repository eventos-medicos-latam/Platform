import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon } from 'lucide-react';
import { ModuleHeader, Panel } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import type { BadgeTone } from '../../components/ui/StatusBadge';
import { supabase } from '../../lib/supabaseClient';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';

interface Ticket { id: string; company_id: string; subject: string; status: 'abierto' | 'en-proceso' | 'resuelto' | 'cerrado'; created_at: string; }
interface Message { id: string; ticket_id: string; author: string; is_admin: boolean; message: string; created_at: string; }
interface Company { id: string; trade_name: string; }

const ticketStatusMeta: Record<Ticket['status'], { label: string; tone: BadgeTone }> = {
  abierto: { label: 'Abierto', tone: 'warning' },
  'en-proceso': { label: 'En proceso', tone: 'info' },
  resuelto: { label: 'Resuelto', tone: 'success' },
  cerrado: { label: 'Cerrado', tone: 'neutral' }
};
const statusOptions = Object.keys(ticketStatusMeta) as Ticket['status'][];

export function SupportAdmin() {
  const { session } = usePlatform();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [filter, setFilter] = useState<'todos' | Ticket['status']>('todos');

  const load = async () => {
    const [{ data: ticketRows }, { data: companyRows }] = await Promise.all([
      supabase.from('support_tickets').select('id, company_id, subject, status, created_at').order('created_at', { ascending: false }),
      supabase.from('companies').select('id, trade_name')
    ]);
    setTickets(ticketRows ?? []);
    setCompanies(companyRows ?? []);
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
  }, []);

  const visible = filter === 'todos' ? tickets : tickets.filter((ticket) => ticket.status === filter);

  const updateStatus = async (ticketId: string, status: Ticket['status']) => {
    await supabase.from('support_tickets').update({ status }).eq('id', ticketId);
    load();
  };

  const sendReply = async (ticketId: string) => {
    if (!reply.trim()) return;
    await supabase.from('support_ticket_messages').insert({ ticket_id: ticketId, author: session?.name ?? 'Equipo organizador', is_admin: true, message: reply.trim() });
    await supabase.from('support_tickets').update({ status: 'en-proceso' }).eq('id', ticketId).eq('status', 'abierto');
    setReply('');
    load();
  };

  return <>
      <ModuleHeader eyebrow="Sistema" title="Mesa de ayuda" description="Solicitudes de todas las empresas del Portal." actions={<div className="flex flex-wrap gap-1.5">
            {(['todos', ...statusOptions] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors duration-150 ease-emphasis ${filter === item ? 'bg-brand text-white' : 'border border-line text-ink-muted hover:text-brand'}`}>
                {item === 'todos' ? 'Todos' : ticketStatusMeta[item].label}
              </button>)}
          </div>} />

      <Panel emphasis title={`${visible.length} solicitudes`}>
        <ul className="divide-y divide-line">
          {visible.map((ticket) => {
          const isOpen = openId === ticket.id;
          const thread = messages.filter((message) => message.ticket_id === ticket.id);
          const company = companies.find((item) => item.id === ticket.company_id);
          return <li key={ticket.id}>
                <button type="button" onClick={() => setOpenId(isOpen ? null : ticket.id)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors duration-150 ease-emphasis hover:bg-canvas">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand">{ticket.subject}</p>
                    <p className="text-xs text-ink-muted">{company?.trade_name ?? '—'} · {new Date(ticket.created_at).toLocaleDateString('es-CO')}</p>
                  </div>
                  <select value={ticket.status} onChange={(event) => { event.stopPropagation(); updateStatus(ticket.id, event.target.value as Ticket['status']); }} onClick={(event) => event.stopPropagation()} className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs font-medium text-brand outline-none focus:border-brand">
                    {statusOptions.map((option) => <option key={option} value={option}>{ticketStatusMeta[option].label}</option>)}
                  </select>
                  <ChevronDownIcon size={16} className={`shrink-0 text-ink-muted transition-transform duration-200 ease-emphasis ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: DURATION.panel, ease: EASE_EMPHASIS }} className="overflow-hidden bg-canvas">
                      <div className="space-y-3 px-5 py-5">
                        {thread.map((message) => <div key={message.id} className={message.is_admin ? 'text-right' : ''}>
                            <p className="text-xs font-semibold text-brand">
                              {message.author} <span className="font-normal text-ink-muted">{new Date(message.created_at).toLocaleString('es-CO')}</span>
                            </p>
                            <p className={`mt-0.5 inline-block max-w-[80%] rounded-lg px-3 py-2 text-sm ${message.is_admin ? 'bg-brand-soft text-brand' : 'bg-white text-ink'}`}>{message.message}</p>
                          </div>)}
                        {thread.length === 0 ? <p className="text-sm text-ink-muted">Sin mensajes todavía.</p> : null}
                        <form className="flex gap-2 pt-2" onSubmit={(event) => { event.preventDefault(); sendReply(ticket.id); }}>
                          <input value={openId === ticket.id ? reply : ''} onChange={(event) => setReply(event.target.value)} placeholder="Responder" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand" />
                          <button type="submit" className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
                            Responder
                          </button>
                        </form>
                      </div>
                    </motion.div> : null}
                </AnimatePresence>
              </li>;
        })}
          {visible.length === 0 ? <li className="px-5 py-10 text-center text-sm text-ink-muted">Sin solicitudes con este filtro.</li> : null}
        </ul>
      </Panel>
    </>;
}
