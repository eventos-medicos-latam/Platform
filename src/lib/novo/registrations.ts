import { supabase } from '../supabaseClient';
import type { NovoRegistrationOrigin, NovoRegistrationType } from '../../types/novo';
import { ensurePersonQr, findOrCreatePerson, syncIdentifier, upsertProfessionalProfile } from './people';

export type RegistrationStatus = 'confirmado' | 'asistio' | 'espera' | 'cancelado';

export type EventRegistrationRow = {
  id: string;
  person_id: string;
  event_id: string;
  event_name: string;
  full_name: string;
  email: string;
  phone: string;
  specialty: string;
  company_id: string | null;
  company: string;
  registration_type: NovoRegistrationType;
  origin: NovoRegistrationOrigin;
  amount_paid: number;
  status: RegistrationStatus;
  attended: boolean;
  notes: string;
  created_at: string;
  qr_token: string;
};

export type RegistrationWrite = {
  full_name: string;
  email: string;
  phone: string;
  specialty: string;
  company: string;
  company_id: string | null;
  event_id: string;
  registration_type: NovoRegistrationType;
  origin: NovoRegistrationOrigin;
  amount_paid: number;
  status: RegistrationStatus;
  notes: string;
};

type IdentifierRow = { identifier_type: string; raw_value: string | null };
type ProfRow = { specialty: string | null; institution: string | null };
type PersonEmbed = {
  id: string;
  full_name: string;
  person_identifiers?: IdentifierRow[] | null;
  professional_profiles?: ProfRow | ProfRow[] | null;
};
type QueryRow = {
  id: string;
  person_id: string;
  event_id: string;
  registration_type: NovoRegistrationType;
  origin: NovoRegistrationOrigin;
  company_id: string | null;
  amount_paid: number;
  attended: boolean;
  notes: string | null;
  status: string | null;
  created_at: string;
  people: PersonEmbed | PersonEmbed[] | null;
  events: { id: string; name: string } | { id: string; name: string }[] | null;
  companies: { id: string; trade_name: string } | { id: string; trade_name: string }[] | null;
};

const SELECT = `
  id, person_id, event_id, registration_type, origin, company_id, amount_paid, attended, notes, status, created_at,
  people:person_id(id, full_name, person_identifiers(identifier_type, raw_value), professional_profiles(specialty, institution)),
  events:event_id(id, name),
  companies:company_id(id, trade_name)
`.replace(/\s+/g, ' ').trim();

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function asStatus(value: string | null | undefined, attended: boolean): RegistrationStatus {
  if (value === 'asistio' || value === 'espera' || value === 'cancelado' || value === 'confirmado') return value;
  return attended ? 'asistio' : 'confirmado';
}

function ident(person: PersonEmbed | null, type: string) {
  return person?.person_identifiers?.find((row) => row.identifier_type === type)?.raw_value ?? '';
}

function mapRow(row: QueryRow, qrByPerson: Record<string, string>): EventRegistrationRow {
  const person = one(row.people);
  const event = one(row.events);
  const company = one(row.companies);
  const prof = one(person?.professional_profiles ?? null);
  const status = asStatus(row.status, row.attended);
  return {
    id: row.id,
    person_id: row.person_id,
    event_id: row.event_id,
    event_name: event?.name ?? 'Evento',
    full_name: person?.full_name ?? 'Persona',
    email: ident(person, 'email'),
    phone: ident(person, 'telefono'),
    specialty: prof?.specialty ?? '',
    company_id: row.company_id,
    company: company?.trade_name || prof?.institution || '',
    registration_type: row.registration_type,
    origin: row.origin,
    amount_paid: Number(row.amount_paid) || 0,
    status,
    attended: status === 'asistio',
    notes: row.notes ?? '',
    created_at: row.created_at,
    qr_token: qrByPerson[row.person_id] ?? '',
  };
}

function throwIf(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === '23505') throw new Error('Ese registro ya existe. Revisa correo o referencia de pago.');
  throw error;
}

async function loadQrMap(personIds: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(personIds.filter(Boolean))];
  if (unique.length === 0) return {};
  const { data, error } = await supabase.from('person_qr').select('person_id, qr_token').in('person_id', unique);
  throwIf(error);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.person_id] = row.qr_token;
  return map;
}

async function mapRows(data: QueryRow[] | null): Promise<EventRegistrationRow[]> {
  const rows = data ?? [];
  const qr = await loadQrMap(rows.map((row) => row.person_id));
  return rows.map((row) => mapRow(row, qr));
}

export async function listRegistrations(eventId?: string): Promise<EventRegistrationRow[]> {
  let query = supabase.from('event_registrations').select(SELECT).order('created_at', { ascending: false });
  if (eventId) query = query.eq('event_id', eventId);
  const { data, error } = await query;
  throwIf(error);
  return mapRows(data as QueryRow[] | null);
}

function payloadFrom(input: RegistrationWrite, personId: string) {
  return {
    person_id: personId,
    event_id: input.event_id,
    registration_type: input.registration_type,
    origin: input.origin,
    company_id: input.company_id || null,
    amount_paid: input.amount_paid,
    attended: input.status === 'asistio',
    status: input.status,
    notes: input.notes.trim() || null,
  };
}

export async function createRegistration(input: RegistrationWrite): Promise<EventRegistrationRow> {
  const personId = await findOrCreatePerson({
    name: input.full_name,
    email: input.email,
    phone: input.phone,
    specialty: input.specialty,
    institution: input.company_id ? '' : input.company,
  });
  await ensurePersonQr(personId);
  const { data, error } = await supabase
    .from('event_registrations')
    .insert(payloadFrom(input, personId))
    .select(SELECT)
    .single();
  throwIf(error);
  const [mapped] = await mapRows([data as QueryRow]);
  return mapped;
}

export async function updateRegistration(id: string, personId: string, input: RegistrationWrite): Promise<EventRegistrationRow> {
  const { error: personError } = await supabase.from('people').update({
    full_name: input.full_name.trim(),
  }).eq('id', personId);
  throwIf(personError);
  await syncIdentifier(personId, 'email', input.email);
  await syncIdentifier(personId, 'telefono', input.phone);
  await upsertProfessionalProfile(personId, input.specialty, input.company_id ? '' : input.company);
  await ensurePersonQr(personId);

  const { data, error } = await supabase
    .from('event_registrations')
    .update(payloadFrom(input, personId))
    .eq('id', id)
    .select(SELECT)
    .single();
  throwIf(error);
  const [mapped] = await mapRows([data as QueryRow]);
  return mapped;
}

export async function setRegistrationStatus(id: string, status: RegistrationStatus): Promise<void> {
  const { error } = await supabase.from('event_registrations').update({
    status,
    attended: status === 'asistio',
  }).eq('id', id);
  throwIf(error);
}

export async function deleteRegistration(id: string): Promise<void> {
  const { error } = await supabase.from('event_registrations').delete().eq('id', id);
  throwIf(error);
}
