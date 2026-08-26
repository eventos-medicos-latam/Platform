export const PENDING_LABEL = 'PENDIENTE';

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

/** Precios sin aprobar nunca se inventan: se muestran como PENDIENTE. */
export function formatCop(value: number | null | undefined): string {
  if (value === null || value === undefined) return PENDING_LABEL;
  return copFormatter.format(value);
}

export function formatCompactCop(value: number | null | undefined): string {
  if (value === null || value === undefined) return PENDING_LABEL;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
}

export function withVat(value: number | null, vatRate: number): number | null {
  if (value === null) return null;
  return Math.round(value * (1 + vatRate));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CO').format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

const dayMonth = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long' });
const fullDate = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: '2-digit' });

/** Fechas puras ("2027-04-23") necesitan mediodía fijo para no saltar de
 * día por la zona horaria; un timestamptz ("...T14:32:10+00:00") ya trae
 * su propia hora, así que agregarle otro "T12:00:00" encima lo vuelve un
 * string inválido. */
function toDate(iso: string): Date {
  return new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
}

export function formatDayMonth(iso: string): string {
  return dayMonth.format(toDate(iso));
}

export function formatFullDate(iso: string): string {
  return fullDate.format(toDate(iso));
}

export function formatShortDate(iso: string): string {
  return shortDate.format(toDate(iso));
}

export function daysUntil(iso: string): number {
  const target = new Date(`${iso}T09:00:00`).getTime();
  return Math.max(0, Math.ceil((target - Date.now()) / 86_400_000));
}

export function slugify(value: string): string {
  return value.
  toLowerCase().
  normalize('NFD').
  replace(/[\u0300-\u036f]/g, '').
  replace(/[^a-z0-9]+/g, '-').
  replace(/(^-|-$)/g, '');
}

/** Horarios sin confirmar se marcan, no se inventan. */
export function formatTimeRange(start: string, end: string): string {
  if (start === PENDING_LABEL || end === PENDING_LABEL) return PENDING_LABEL;
  return `${start} – ${end}`;
}