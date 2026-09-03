// =========================================================
// NOVO ARCHITECTURE — Servicio de eventos
// Mock-ready: swap supabase calls cuando las migraciones estén aplicadas.
// =========================================================

import type { NovoEvent, DashboardStats, EventKpis } from '../../types/novo';
import {
  MOCK_EVENTS, MOCK_STATS, MOCK_KPIS,
  MOCK_RECENT_REGISTRATIONS, MOCK_AGREEMENTS, MOCK_ALERTS,
} from './mock';

const USE_MOCK = true; // → false cuando Supabase tenga las migraciones aplicadas

export async function listEvents(): Promise<NovoEvent[]> {
  if (USE_MOCK) return MOCK_EVENTS;
  // const { data } = await supabase.from('events').select('*').order('start_date');
  // return data ?? [];
  return [];
}

export async function getEvent(id: string): Promise<NovoEvent | null> {
  if (USE_MOCK) return MOCK_EVENTS.find((e) => e.id === id) ?? null;
  return null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (USE_MOCK) return MOCK_STATS;
  return { total_events: 0, active_events: 0, upcoming_events: 0, total_registrations: 0, total_revenue: 0, total_companies: 0 };
}

export async function getEventKpis(eventId: string): Promise<EventKpis | null> {
  if (USE_MOCK) return MOCK_KPIS;
  return null;
}

export async function getRecentRegistrations() {
  if (USE_MOCK) return MOCK_RECENT_REGISTRATIONS;
  return [];
}

export async function getAgreements() {
  if (USE_MOCK) return MOCK_AGREEMENTS;
  return [];
}

export async function getAlerts() {
  if (USE_MOCK) return MOCK_ALERTS;
  return [];
}

export function formatCurrency(value: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(iso));
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric', month: 'short',
  }).format(new Date(iso));
}
