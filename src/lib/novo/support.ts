import { supabase } from '../supabaseClient';

export type TicketStatus = 'abierto' | 'en-proceso' | 'resuelto' | 'cerrado';
export type TicketPriority = 'alta' | 'media' | 'baja';
export type TicketCategory = 'registro' | 'pago' | 'acceso' | 'contenido' | 'tecnico' | 'otro';

export type SupportMessage = {
  id: string;
  ticketId: string;
  author: string;
  text: string;
  time: string;
  createdAt: string;
  isAdmin: boolean;
};

export type SupportTicket = {
  id: string;
  subject: string;
  requester: string;
  email: string;
  companyId: string | null;
  eventId: string | null;
  event: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  created: string;
  createdAt: string;
  messages: SupportMessage[];
};

export type SupportTicketWrite = {
  subject: string;
  requester: string;
  email: string;
  eventId: string | null;
  priority: TicketPriority;
  category: TicketCategory;
  message: string;
};

type CompanyEmbed = { trade_name: string } | { trade_name: string }[] | null;
type EventEmbed = { name: string } | { name: string }[] | null;

type TicketRow = {
  id: string;
  company_id: string | null;
  event_id: string | null;
  subject: string;
  status: TicketStatus;
  created_at: string;
  requester_name: string | null;
  requester_email: string | null;
  priority: string | null;
  category: string | null;
  companies: CompanyEmbed;
  events: EventEmbed;
};

type MessageRow = {
  id: string;
  ticket_id: string;
  author: string | null;
  is_admin: boolean;
  message: string;
  created_at: string;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function throwIf(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function asPriority(value?: string | null): TicketPriority {
  if (value === 'alta' || value === 'media' || value === 'baja') return value;
  return 'media';
}

function asCategory(value?: string | null): TicketCategory {
  if (value === 'registro' || value === 'pago' || value === 'acceso' || value === 'contenido' || value === 'tecnico' || value === 'otro') {
    return value;
  }
  return 'otro';
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function mapMessage(row: MessageRow): SupportMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    author: row.author || (row.is_admin ? 'Soporte EML' : 'Solicitante'),
    text: row.message,
    time: formatWhen(row.created_at),
    createdAt: row.created_at,
    isAdmin: row.is_admin,
  };
}

function mapTicket(row: TicketRow, messages: SupportMessage[]): SupportTicket {
  const company = one(row.companies);
  const event = one(row.events);
  return {
    id: row.id,
    subject: row.subject,
    requester: row.requester_name?.trim() || company?.trade_name || 'Empresa',
    email: row.requester_email?.trim() || '',
    companyId: row.company_id,
    eventId: row.event_id,
    event: event?.name ?? null,
    status: row.status,
    priority: asPriority(row.priority),
    category: asCategory(row.category),
    created: row.created_at.slice(0, 10),
    createdAt: row.created_at,
    messages: messages.filter((msg) => msg.ticketId === row.id),
  };
}

const TICKET_SELECT = `
  id, company_id, event_id, subject, status, created_at,
  requester_name, requester_email, priority, category,
  companies:company_id(trade_name),
  events:event_id(name)
`.replace(/\s+/g, ' ').trim();

export async function listSupportTickets(): Promise<SupportTicket[]> {
  const { data: ticketRows, error: ticketError } = await supabase
    .from('support_tickets')
    .select(TICKET_SELECT)
    .order('created_at', { ascending: false });
  throwIf(ticketError);
  const tickets = (ticketRows as TicketRow[] | null) ?? [];
  const ids = tickets.map((row) => row.id);
  if (!ids.length) return [];
  const { data: messageRows, error: messageError } = await supabase
    .from('support_ticket_messages')
    .select('id, ticket_id, author, is_admin, message, created_at')
    .in('ticket_id', ids)
    .order('created_at');
  throwIf(messageError);
  const messages = (messageRows as MessageRow[] | null)?.map(mapMessage) ?? [];
  return tickets.map((row) => mapTicket(row, messages));
}

export async function createSupportTicket(input: SupportTicketWrite): Promise<void> {
  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      subject: input.subject.trim(),
      requester_name: input.requester.trim() || null,
      requester_email: input.email.trim() || null,
      event_id: input.eventId,
      priority: input.priority,
      category: input.category,
      status: 'abierto',
    })
    .select('id')
    .single();
  throwIf(error);
  if (input.message.trim() && data?.id) {
    const { error: msgError } = await supabase.from('support_ticket_messages').insert({
      ticket_id: data.id,
      author: input.requester.trim() || 'Solicitante',
      is_admin: false,
      message: input.message.trim(),
    });
    throwIf(msgError);
  }
}

export async function replySupportTicket(ticketId: string, author: string, message: string): Promise<void> {
  const { error } = await supabase.from('support_ticket_messages').insert({
    ticket_id: ticketId,
    author: author.trim() || 'Soporte EML',
    is_admin: true,
    message: message.trim(),
  });
  throwIf(error);
  await supabase.from('support_tickets').update({ status: 'en-proceso' }).eq('id', ticketId).eq('status', 'abierto');
}

export async function updateSupportTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
  const { error } = await supabase.from('support_tickets').update({ status }).eq('id', ticketId);
  throwIf(error);
}

export async function deleteSupportTicket(ticketId: string): Promise<void> {
  const { error } = await supabase.from('support_tickets').delete().eq('id', ticketId);
  throwIf(error);
}
