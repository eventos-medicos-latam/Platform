import { supabase } from '../supabaseClient';
import type { NovoEventModality } from '../../types/novo';

export type TicketAccessLevel = 'general' | 'vip' | 'workshop' | 'staff';

export type TicketPriceStageRow = {
  id: string;
  ticket_type_id: string;
  stage_name: string;
  price: number;
  valid_until: string | null;
  quantity_limit: number | null;
  sort_order: number;
};

export type EventTicketRow = {
  id: string;
  event_id: string;
  name: string;
  description: string;
  modality: NovoEventModality | null;
  access_level: TicketAccessLevel;
  base_price: number;
  tax_pct: number;
  capacity: number | null;
  benefits: string[];
  sale_start: string | null;
  sale_end: string | null;
  is_visible: boolean;
  has_qr: boolean;
  sort_order: number;
  sold: number;
  current_price: number;
  stages: TicketPriceStageRow[];
};

export type TicketWrite = {
  event_id: string;
  name: string;
  description: string;
  modality: NovoEventModality | '';
  access_level: TicketAccessLevel;
  base_price: number;
  tax_pct: number;
  capacity: number | null;
  benefits: string[];
  sale_start: string | null;
  sale_end: string | null;
  is_visible: boolean;
  has_qr: boolean;
};

type TypeRow = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  modality: string | null;
  access_level: string;
  base_price: number;
  tax_pct: number;
  capacity: number | null;
  benefits: string[] | null;
  sale_start: string | null;
  sale_end: string | null;
  is_visible: boolean;
  has_qr: boolean;
  sort_order: number;
};

const TYPE_SELECT = `
  id, event_id, name, description, modality, access_level, base_price, tax_pct,
  capacity, benefits, sale_start, sale_end, is_visible, has_qr, sort_order
`.replace(/\s+/g, ' ').trim();

function throwIf(error: { message: string } | null) {
  if (error) throw error;
}

function asAccess(value: string): TicketAccessLevel {
  if (value === 'vip' || value === 'workshop' || value === 'staff') return value;
  return 'general';
}

function withTax(price: number, taxPct: number) {
  return Math.round(price * (1 + (taxPct || 0) / 100) * 100) / 100;
}

export function currentTicketPrice(row: Pick<EventTicketRow, 'base_price' | 'tax_pct' | 'sold' | 'stages'>): number {
  const today = new Date().toISOString().slice(0, 10);
  const stage = [...row.stages]
    .sort((a, b) => a.sort_order - b.sort_order)
    .find((item) => {
      if (item.valid_until) return item.valid_until >= today;
      if (item.quantity_limit != null) return row.sold < item.quantity_limit;
      return false;
    });
  return withTax(stage?.price ?? row.base_price, row.tax_pct);
}

function mapType(row: TypeRow, sold: number, stages: TicketPriceStageRow[]): EventTicketRow {
  const mapped: EventTicketRow = {
    id: row.id,
    event_id: row.event_id,
    name: row.name,
    description: row.description ?? '',
    modality: (row.modality as NovoEventModality | null) ?? null,
    access_level: asAccess(row.access_level),
    base_price: Number(row.base_price) || 0,
    tax_pct: Number(row.tax_pct) || 0,
    capacity: row.capacity,
    benefits: row.benefits ?? [],
    sale_start: row.sale_start,
    sale_end: row.sale_end,
    is_visible: row.is_visible,
    has_qr: row.has_qr,
    sort_order: row.sort_order,
    sold,
    stages,
    current_price: 0,
  };
  mapped.current_price = currentTicketPrice(mapped);
  return mapped;
}

async function soldMap(typeIds: string[]): Promise<Record<string, number>> {
  if (typeIds.length === 0) return {};
  const { data, error } = await supabase
    .from('ticket_entitlements')
    .select('ticket_type_id')
    .in('ticket_type_id', typeIds)
    .eq('status', 'activo');
  if (error) return {};
  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.ticket_type_id as string;
    map[id] = (map[id] ?? 0) + 1;
  }
  return map;
}

async function stagesMap(typeIds: string[]): Promise<Record<string, TicketPriceStageRow[]>> {
  if (typeIds.length === 0) return {};
  const { data, error } = await supabase
    .from('ticket_price_stages')
    .select('id, ticket_type_id, stage_name, price, valid_until, quantity_limit, sort_order')
    .in('ticket_type_id', typeIds)
    .order('sort_order', { ascending: true });
  throwIf(error);
  const map: Record<string, TicketPriceStageRow[]> = {};
  for (const row of data ?? []) {
    const id = row.ticket_type_id as string;
    if (!map[id]) map[id] = [];
    map[id].push({
      id: row.id,
      ticket_type_id: id,
      stage_name: row.stage_name,
      price: Number(row.price) || 0,
      valid_until: row.valid_until,
      quantity_limit: row.quantity_limit,
      sort_order: row.sort_order,
    });
  }
  return map;
}

async function hydrate(rows: TypeRow[] | null): Promise<EventTicketRow[]> {
  const list = rows ?? [];
  const ids = list.map((row) => row.id);
  const [sold, stages] = await Promise.all([soldMap(ids), stagesMap(ids)]);
  return list
    .map((row) => mapType(row, sold[row.id] ?? 0, stages[row.id] ?? []))
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

export async function listTickets(eventId: string): Promise<EventTicketRow[]> {
  const { data, error } = await supabase
    .from('ticket_types')
    .select(TYPE_SELECT)
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });
  throwIf(error);
  return hydrate(data as TypeRow[] | null);
}

export async function listPublicTickets(eventId: string): Promise<EventTicketRow[]> {
  const { data, error } = await supabase
    .from('ticket_types')
    .select(TYPE_SELECT)
    .eq('event_id', eventId)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });
  throwIf(error);
  const now = Date.now();
  return (await hydrate(data as TypeRow[] | null)).filter((ticket) => {
    if (ticket.sale_start && new Date(ticket.sale_start).getTime() > now) return false;
    if (ticket.sale_end && new Date(ticket.sale_end).getTime() < now) return false;
    return true;
  });
}

function payloadFrom(input: TicketWrite, sortOrder: number) {
  return {
    event_id: input.event_id,
    name: input.name.trim(),
    description: input.description.trim() || null,
    modality: input.modality || null,
    access_level: input.access_level,
    base_price: input.base_price,
    tax_pct: input.tax_pct,
    capacity: input.capacity,
    benefits: input.benefits.map((item) => item.trim()).filter(Boolean),
    sale_start: input.sale_start || null,
    sale_end: input.sale_end || null,
    is_visible: input.is_visible,
    has_qr: input.has_qr,
    sort_order: sortOrder,
  };
}

export async function createTicket(input: TicketWrite): Promise<EventTicketRow> {
  const existing = await listTickets(input.event_id);
  const { data, error } = await supabase
    .from('ticket_types')
    .insert(payloadFrom(input, existing.length))
    .select(TYPE_SELECT)
    .single();
  throwIf(error);
  const [mapped] = await hydrate([data as TypeRow]);
  return mapped;
}

export async function updateTicket(id: string, input: TicketWrite, sortOrder: number): Promise<EventTicketRow> {
  const { data, error } = await supabase
    .from('ticket_types')
    .update(payloadFrom(input, sortOrder))
    .eq('id', id)
    .select(TYPE_SELECT)
    .single();
  throwIf(error);
  const [mapped] = await hydrate([data as TypeRow]);
  return mapped;
}

export async function deleteTicket(id: string): Promise<void> {
  const { error } = await supabase.from('ticket_types').delete().eq('id', id);
  throwIf(error);
}

export type NovoRegisterResult = {
  registration_id: string;
  person_id: string;
  qr_token: string;
  amount: number;
  needs_payment: boolean;
  wompi_reference: string | null;
  ticket_name: string;
};

export async function registerPublicTicket(input: {
  event_id: string;
  ticket_type_id: string;
  full_name: string;
  email: string;
  phone?: string;
  specialty?: string;
}): Promise<NovoRegisterResult> {
  const { data, error } = await supabase.rpc('novo_register_ticket', {
    p_event_id: input.event_id,
    p_ticket_type_id: input.ticket_type_id,
    p_full_name: input.full_name,
    p_email: input.email,
    p_phone: input.phone || null,
    p_specialty: input.specialty || null,
  });
  if (error) throw new Error(error.message);
  return data as NovoRegisterResult;
}

export type WompiTicketReceipt = {
  wompi_id: string;
  status: string;
  status_label: string;
  approved: boolean;
  amount: number;
  currency: string;
  reference: string;
  email: string | null;
  payment_method_label: string | null;
  card_last_four: string | null;
  ticket_name: string | null;
  person_name: string | null;
  qr_token: string | null;
  event_name: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  APPROVED: 'Pago aprobado',
  PENDING: 'Pago en proceso',
  DECLINED: 'Pago rechazado',
  VOIDED: 'Pago anulado',
  ERROR: 'Error en el pago',
};

const METHOD_LABEL: Record<string, string> = {
  CARD: 'Tarjeta',
  NEQUI: 'Nequi',
  PSE: 'PSE',
  BANCOLOMBIA_TRANSFER: 'Transferencia Bancolombia',
  BANCOLOMBIA_COLLECT: 'Corresponsal Bancolombia',
  PCOL: 'Punto de pago',
  DAVIVIENDA: 'Davivienda',
};

function receiptFromWompiTx(tx: Record<string, unknown>): WompiTicketReceipt {
  const method = tx.payment_method as { type?: string; extra?: { last_four?: string } } | undefined;
  const methodType = String(tx.payment_method_type ?? method?.type ?? '');
  const status = String(tx.status ?? '');
  const amountInCents = Number(tx.amount_in_cents ?? 0);
  return {
    wompi_id: String(tx.id ?? ''),
    status,
    status_label: STATUS_LABEL[status] ?? (status || 'Pago recibido'),
    approved: status === 'APPROVED',
    amount: amountInCents / 100,
    currency: String(tx.currency ?? 'COP'),
    reference: String(tx.reference ?? ''),
    email: tx.customer_email ? String(tx.customer_email) : null,
    payment_method_label: METHOD_LABEL[methodType] ?? (methodType || null),
    card_last_four: method?.extra?.last_four ?? null,
    ticket_name: null,
    person_name: null,
    qr_token: null,
    event_name: null,
  };
}

export async function fetchWompiTicketReceipt(
  transactionId: string,
  env?: string | null,
): Promise<WompiTicketReceipt> {
  const { data: fnData, error: fnError } = await supabase.functions.invoke('wompi-transaction-status', {
    body: { transaction_id: transactionId, env: env ?? undefined },
  });
  if (!fnError && fnData && !fnData.error && fnData.wompi_id) {
    return fnData as WompiTicketReceipt;
  }

  const { data: settings } = await supabase.from('public_settings').select('value').eq('key', 'wompi_public_key').maybeSingle();
  const publicKey = settings?.value;
  if (!publicKey) throw new Error('Wompi no está configurado');

  const bases = env === 'prod' || env === 'production'
    ? ['https://production.wompi.co/v1', 'https://sandbox.wompi.co/v1']
    : ['https://sandbox.wompi.co/v1', 'https://production.wompi.co/v1'];

  for (const base of bases) {
    const res = await fetch(`${base}/transactions/${encodeURIComponent(transactionId)}`, {
      headers: { Authorization: `Bearer ${publicKey}` },
    });
    if (!res.ok) continue;
    const payload = await res.json();
    if (payload?.data) return receiptFromWompiTx(payload.data as Record<string, unknown>);
  }

  throw new Error('No se encontró la transacción en Wompi');
}
