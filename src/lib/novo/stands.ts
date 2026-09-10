import { supabase } from '../supabaseClient';
import { createCompanyPayment, deleteCompanyPayment } from '../companyPayments';

export type StandStatus = 'disponible' | 'reservado' | 'vendido';

export type CatalogStandType = {
  id: string;
  name: string;
  area: string;
  price: number;
  price_min: number | null;
  description: string;
  emoji: string;
};

export type EventStandUnit = {
  id: string;
  code: string;
  type_id: string;
  type_name: string;
  event_id: string;
  event_name: string;
  company_id: string | null;
  company_name: string | null;
  status: StandStatus;
  price: number;
  zone: string;
  notas: string;
  payment_id: string | null;
  payment_status: 'pendiente' | 'pagado' | 'vencido' | null;
};

type TypeRow = {
  id: string;
  name: string;
  dimensions: string | null;
  description: string | null;
  base_price: number;
  custom_fields: { emoji?: string; price_min?: number } | null;
};

type UnitRow = {
  id: string;
  event_id: string;
  stand_type_id: string;
  unit_number: string;
  status: string;
  notes: string | null;
  company_id: string | null;
  payment_id: string | null;
  price: number | null;
  location_hint: string | null;
  stand_types: { id: string; name: string; dimensions: string | null; base_price: number } | { id: string; name: string; dimensions: string | null; base_price: number }[] | null;
  events: { id: string; name: string } | { id: string; name: string }[] | null;
  companies: { id: string; trade_name: string } | { id: string; trade_name: string }[] | null;
  company_payments: { id: string; status: 'pendiente' | 'pagado' | 'vencido'; amount: number } | { id: string; status: 'pendiente' | 'pagado' | 'vencido'; amount: number }[] | null;
};

const TYPE_SELECT = 'id, name, dimensions, description, base_price, custom_fields';
const UNIT_SELECT = 'id, event_id, stand_type_id, unit_number, status, notes, company_id, payment_id, price, location_hint, stand_types:stand_type_id(id, name, dimensions, base_price), events:event_id(id, name), companies:company_id(id, trade_name), company_payments:payment_id(id, status, amount)';

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function asStatus(value: string): StandStatus {
  if (value === 'vendido' || value === 'reservado') return value;
  return 'disponible';
}

function mapType(row: TypeRow): CatalogStandType {
  return {
    id: row.id,
    name: row.name,
    area: row.dimensions ?? '',
    price: Number(row.base_price) || 0,
    price_min: row.custom_fields?.price_min ?? null,
    description: row.description ?? '',
    emoji: row.custom_fields?.emoji || '🏪',
  };
}

function mapUnit(row: UnitRow): EventStandUnit {
  const type = one(row.stand_types);
  const event = one(row.events);
  const company = one(row.companies);
  const payment = one(row.company_payments);
  return {
    id: row.id,
    code: row.unit_number,
    type_id: row.stand_type_id,
    type_name: type?.name ?? 'Stand',
    event_id: row.event_id,
    event_name: event?.name ?? 'Evento',
    company_id: row.company_id,
    company_name: company?.trade_name ?? null,
    status: asStatus(row.status),
    price: Number(row.price ?? type?.base_price) || 0,
    zone: row.location_hint ?? '',
    notas: row.notes ?? '',
    payment_id: row.payment_id,
    payment_status: payment?.status ?? null,
  };
}

export async function listStandTypes(): Promise<CatalogStandType[]> {
  const { data, error } = await supabase
    .from('stand_types')
    .select(TYPE_SELECT)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data as TypeRow[] | null) ?? []).map(mapType);
}

export async function createStandType(input: {
  name: string;
  area: string;
  price: number;
  price_min: number | null;
  description: string;
  emoji: string;
}): Promise<CatalogStandType> {
  const { data, error } = await supabase
    .from('stand_types')
    .insert({
      name: input.name,
      dimensions: input.area || null,
      description: input.description || null,
      base_price: input.price,
      custom_fields: { emoji: input.emoji, price_min: input.price_min ?? undefined },
      is_active: true,
    })
    .select(TYPE_SELECT)
    .single();
  if (error) throw error;
  return mapType(data as TypeRow);
}

export async function updateStandType(id: string, input: {
  name: string;
  area: string;
  price: number;
  price_min: number | null;
  description: string;
  emoji: string;
}): Promise<CatalogStandType> {
  const { data, error } = await supabase
    .from('stand_types')
    .update({
      name: input.name,
      dimensions: input.area || null,
      description: input.description || null,
      base_price: input.price,
      custom_fields: { emoji: input.emoji, price_min: input.price_min ?? undefined },
    })
    .eq('id', id)
    .select(TYPE_SELECT)
    .single();
  if (error) throw error;
  return mapType(data as TypeRow);
}

export async function deleteStandType(id: string): Promise<void> {
  const { error } = await supabase.from('stand_types').delete().eq('id', id);
  if (error) throw error;
}

export async function listStandUnits(eventId?: string): Promise<EventStandUnit[]> {
  let query = supabase.from('stand_units').select(UNIT_SELECT).order('unit_number', { ascending: true });
  if (eventId) query = query.eq('event_id', eventId);
  const { data, error } = await query;
  if (error) throw error;
  return ((data as UnitRow[] | null) ?? []).map(mapUnit);
}

async function ensureInventory(eventId: string, typeId: string, price: number, add = 1): Promise<string> {
  const extra = Math.max(1, add);
  const { data: existing, error: findError } = await supabase
    .from('stand_inventory')
    .select('id, quantity')
    .eq('event_id', eventId)
    .eq('stand_type_id', typeId)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) {
    const { error } = await supabase
      .from('stand_inventory')
      .update({ quantity: (existing.quantity ?? 0) + extra, price })
      .eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }
  const { data: created, error } = await supabase
    .from('stand_inventory')
    .insert({ event_id: eventId, stand_type_id: typeId, quantity: extra, price })
    .select('id')
    .single();
  if (error) throw error;
  return created.id as string;
}

/** A-01 × 5 → A-01 … A-05. Si A-01 ya existe, sigue con A-02. */
export function generateStandCodes(startCode: string, quantity: number, taken: Iterable<string>): string[] {
  const count = Math.min(40, Math.max(0, Math.floor(quantity)));
  if (count === 0) return [];
  const occupied = new Set([...taken].map((code) => code.trim().toLowerCase()));
  const raw = startCode.trim() || 'A-01';
  const match = raw.match(/^(.*?)(\d+)$/);
  const prefix = match ? match[1] : /-$/.test(raw) ? raw : `${raw}-`;
  const start = match ? Number(match[2]) : 1;
  const pad = match ? match[2].length : 2;
  const codes: string[] = [];
  let n = start;
  while (codes.length < count && n < start + count + 200) {
    const next = `${prefix}${String(n).padStart(pad, '0')}`;
    n += 1;
    if (occupied.has(next.toLowerCase())) continue;
    occupied.add(next.toLowerCase());
    codes.push(next);
  }
  return codes;
}

async function upsertReservation(unitId: string, companyId: string, eventId: string, status: 'pendiente' | 'confirmado') {
  const { data: open } = await supabase
    .from('stand_reservations')
    .select('id')
    .eq('stand_unit_id', unitId)
    .in('status', ['pendiente', 'confirmado'])
    .limit(1)
    .maybeSingle();
  const now = new Date().toISOString();
  if (open?.id) {
    const { error } = await supabase.from('stand_reservations').update({
      company_id: companyId,
      event_id: eventId,
      status,
      confirmed_at: status === 'confirmado' ? now : null,
    }).eq('id', open.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('stand_reservations').insert({
    stand_unit_id: unitId,
    company_id: companyId,
    event_id: eventId,
    status,
    confirmed_at: status === 'confirmado' ? now : null,
  });
  if (error) throw error;
}

async function cancelOpenReservations(unitId: string) {
  await supabase
    .from('stand_reservations')
    .update({ status: 'cancelado', cancelled_at: new Date().toISOString() })
    .eq('stand_unit_id', unitId)
    .in('status', ['pendiente', 'confirmado']);
}

async function syncSale(unit: {
  id: string;
  code: string;
  event_id: string;
  company_id: string | null;
  status: StandStatus;
  price: number;
  payment_id: string | null;
}): Promise<string | null> {
  if ((unit.status === 'vendido' || unit.status === 'reservado') && !unit.company_id) {
    throw new Error('Asigna una empresa del CRM para reservar o vender el stand.');
  }

  let paymentId = unit.payment_id;

  if (unit.status === 'disponible') {
    let keepPayment: string | null = null;
    if (paymentId) {
      const { data: payment } = await supabase
        .from('company_payments')
        .select('status')
        .eq('id', paymentId)
        .maybeSingle();
      if (payment && payment.status !== 'pagado') {
        await deleteCompanyPayment(paymentId);
      } else if (payment?.status === 'pagado') {
        keepPayment = paymentId;
      }
    }
    await cancelOpenReservations(unit.id);
    return keepPayment;
  }

  if (unit.status === 'reservado' && unit.company_id) {
    await upsertReservation(unit.id, unit.company_id, unit.event_id, 'pendiente');
    return paymentId;
  }

  if (unit.status === 'vendido' && unit.company_id) {
    if (paymentId) {
      await supabase
        .from('company_payments')
        .update({
          company_id: unit.company_id,
          event_id: unit.event_id,
          concept: `Stand ${unit.code}`,
          amount: unit.price,
        })
        .eq('id', paymentId)
        .neq('status', 'pagado');
    } else {
      const payment = await createCompanyPayment({
        company_id: unit.company_id,
        event_id: unit.event_id,
        concept: `Stand ${unit.code}`,
        amount: unit.price,
        due_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
        status: 'pendiente',
        paid_reference: `STAND-${unit.id}`,
      });
      paymentId = payment.id;
    }
    await upsertReservation(unit.id, unit.company_id, unit.event_id, 'confirmado');
  }

  return paymentId;
}

export type StandUnitWrite = {
  code: string;
  type_id: string;
  event_id: string;
  company_id: string | null;
  status: StandStatus;
  price: number;
  zone: string;
  notas: string;
};

export async function createStandUnit(input: StandUnitWrite): Promise<EventStandUnit> {
  if ((input.status === 'vendido' || input.status === 'reservado') && !input.company_id) {
    throw new Error('Asigna una empresa del CRM para reservar o vender el stand.');
  }
  const inventoryId = await ensureInventory(input.event_id, input.type_id, input.price);
  const { data, error } = await supabase
    .from('stand_units')
    .insert({
      inventory_id: inventoryId,
      event_id: input.event_id,
      stand_type_id: input.type_id,
      unit_number: input.code.trim(),
      status: input.status,
      company_id: input.company_id,
      price: input.price,
      location_hint: input.zone || null,
      notes: input.notas || null,
    })
    .select(UNIT_SELECT)
    .single();
  if (error) throw error;
  const created = mapUnit(data as UnitRow);
  const paymentId = await syncSale({
    id: created.id,
    code: created.code,
    event_id: created.event_id,
    company_id: created.company_id,
    status: created.status,
    price: created.price,
    payment_id: null,
  });
  if (paymentId) {
    const { data: linked, error: linkError } = await supabase
      .from('stand_units')
      .update({ payment_id: paymentId })
      .eq('id', created.id)
      .select(UNIT_SELECT)
      .single();
    if (linkError) throw linkError;
    return mapUnit(linked as UnitRow);
  }
  return created;
}

export async function createStandUnitsBulk(input: {
  codes: string[];
  type_id: string;
  event_id: string;
  price: number;
  zone: string;
  notas: string;
}): Promise<EventStandUnit[]> {
  const codes = [...new Set(input.codes.map((code) => code.trim()).filter(Boolean))];
  if (codes.length === 0) throw new Error('Indica un código inicial y una cantidad.');
  const inventoryId = await ensureInventory(input.event_id, input.type_id, input.price, codes.length);
  const { data, error } = await supabase
    .from('stand_units')
    .insert(codes.map((code) => ({
      inventory_id: inventoryId,
      event_id: input.event_id,
      stand_type_id: input.type_id,
      unit_number: code,
      status: 'disponible',
      company_id: null,
      price: input.price,
      location_hint: input.zone || null,
      notes: input.notas || null,
    })))
    .select(UNIT_SELECT);
  if (error) {
    if (error.code === '23505') throw new Error('Uno de esos códigos ya existe en este evento.');
    throw error;
  }
  return ((data as UnitRow[] | null) ?? []).map(mapUnit);
}

export async function updateStandUnit(id: string, input: StandUnitWrite, currentPaymentId: string | null): Promise<EventStandUnit> {
  const paymentId = await syncSale({
    id,
    code: input.code.trim(),
    event_id: input.event_id,
    company_id: input.company_id,
    status: input.status,
    price: input.price,
    payment_id: currentPaymentId,
  });
  const { data, error } = await supabase
    .from('stand_units')
    .update({
      event_id: input.event_id,
      stand_type_id: input.type_id,
      unit_number: input.code.trim(),
      status: input.status,
      company_id: input.status === 'disponible' ? null : input.company_id,
      payment_id: paymentId,
      price: input.price,
      location_hint: input.zone || null,
      notes: input.notas || null,
    })
    .eq('id', id)
    .select(UNIT_SELECT)
    .single();
  if (error) throw error;
  return mapUnit(data as UnitRow);
}

export async function deleteStandUnit(id: string, paymentId: string | null): Promise<void> {
  await cancelOpenReservations(id);
  if (paymentId) {
    const { data: payment } = await supabase
      .from('company_payments')
      .select('status')
      .eq('id', paymentId)
      .maybeSingle();
    if (payment && payment.status !== 'pagado') {
      await deleteCompanyPayment(paymentId);
    }
  }
  const { error } = await supabase.from('stand_units').delete().eq('id', id);
  if (error) throw error;
}
