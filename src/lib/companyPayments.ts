import { supabase } from './supabaseClient';
import { getEdition } from '../data/editions';

export type LedgerStatus = 'pendiente' | 'pagado' | 'vencido';

export type CompanyPaymentRow = {
  id: string;
  company_id: string;
  edition_id: string | null;
  event_id: string | null;
  concept: string;
  amount: number;
  due_date: string | null;
  status: LedgerStatus;
  payment_method: string | null;
  paid_at: string | null;
  wompi_reference: string | null;
  paid_reference: string | null;
  event_name: string;
  group_key: string;
};

type PaymentQueryRow = {
  id: string;
  company_id: string;
  edition_id: string | null;
  event_id: string | null;
  concept: string | null;
  amount: number;
  due_date: string | null;
  status: LedgerStatus;
  payment_method: string | null;
  paid_at: string | null;
  wompi_reference: string | null;
  paid_reference: string | null;
  events: { id: string; name: string } | { id: string; name: string }[] | null;
};

const SELECT = 'id, company_id, edition_id, event_id, concept, amount, due_date, status, payment_method, paid_at, wompi_reference, paid_reference, events:event_id(id, name)';

function eventNameFrom(row: PaymentQueryRow): string {
  const joined = Array.isArray(row.events) ? row.events[0] : row.events;
  if (joined?.name) return joined.name;
  if (row.edition_id) return getEdition(row.edition_id)?.name ?? row.edition_id;
  return 'Evento';
}

function groupKeyOf(row: PaymentQueryRow): string {
  if (row.event_id) return `event:${row.event_id}`;
  if (row.edition_id) return `edition:${row.edition_id}`;
  return `row:${row.id}`;
}

function mapRow(row: PaymentQueryRow): CompanyPaymentRow {
  return {
    id: row.id,
    company_id: row.company_id,
    edition_id: row.edition_id,
    event_id: row.event_id,
    concept: row.concept ?? '',
    amount: Number(row.amount) || 0,
    due_date: row.due_date,
    status: row.status,
    payment_method: row.payment_method,
    paid_at: row.paid_at,
    wompi_reference: row.wompi_reference,
    paid_reference: row.paid_reference,
    event_name: eventNameFrom(row),
    group_key: groupKeyOf(row),
  };
}

export function toLedgerStatus(novo: 'pagado' | 'proximo' | 'vencido'): LedgerStatus {
  if (novo === 'pagado') return 'pagado';
  if (novo === 'vencido') return 'vencido';
  return 'pendiente';
}

export function toNovoStatus(status: LedgerStatus, dueDate: string | null): 'pagado' | 'proximo' | 'vencido' {
  if (status === 'pagado') return 'pagado';
  if (status === 'vencido') return 'vencido';
  if (dueDate && dueDate < new Date().toISOString().slice(0, 10)) return 'vencido';
  return 'proximo';
}

function mapRows(data: unknown): CompanyPaymentRow[] {
  return ((data as PaymentQueryRow[] | null) ?? []).map(mapRow);
}

export async function listCompanyPayments(): Promise<CompanyPaymentRow[]> {
  const { data, error } = await supabase
    .from('company_payments')
    .select(SELECT)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return mapRows(data);
}

export async function listCompanyPaymentsForCompany(companyId: string): Promise<CompanyPaymentRow[]> {
  const { data, error } = await supabase
    .from('company_payments')
    .select(SELECT)
    .eq('company_id', companyId)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return mapRows(data);
}

export type CompanyPaymentWrite = {
  company_id: string;
  event_id?: string | null;
  edition_id?: string | null;
  concept: string;
  amount: number;
  due_date: string | null;
  status: LedgerStatus;
  payment_method?: string | null;
  paid_at?: string | null;
  paid_reference?: string | null;
};

function writePayload(input: CompanyPaymentWrite) {
  const payload: Record<string, unknown> = {
    company_id: input.company_id,
    event_id: input.event_id || null,
    edition_id: input.edition_id || null,
    concept: input.concept,
    amount: input.amount,
    due_date: input.due_date,
    status: input.status,
    payment_method: input.payment_method || null,
    paid_at: input.paid_at || null,
  };
  if (input.paid_reference !== undefined) {
    payload.paid_reference = input.paid_reference || null;
  }
  return payload;
}

export async function createCompanyPayment(input: CompanyPaymentWrite): Promise<CompanyPaymentRow> {
  const { data, error } = await supabase
    .from('company_payments')
    .insert(writePayload(input))
    .select(SELECT)
    .single();
  if (error) throw error;
  return mapRow(data as PaymentQueryRow);
}

export async function updateCompanyPayment(id: string, input: CompanyPaymentWrite): Promise<CompanyPaymentRow> {
  const { data, error } = await supabase
    .from('company_payments')
    .update(writePayload(input))
    .eq('id', id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return mapRow(data as PaymentQueryRow);
}

export async function markCompanyPaymentPaid(id: string, method?: string | null): Promise<void> {
  const { error } = await supabase.from('company_payments').update({
    status: 'pagado',
    paid_at: new Date().toISOString(),
    payment_method: method || 'manual',
  }).eq('id', id);
  if (error) throw error;
}

export async function deleteCompanyPayment(id: string): Promise<void> {
  const { error } = await supabase.from('company_payments').delete().eq('id', id);
  if (error) throw error;
}
