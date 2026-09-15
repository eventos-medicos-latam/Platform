import { supabase } from '../supabaseClient';

export type EmailAudience = 'cliente' | 'empresa';

export type EmailTemplate = {
  key: string;
  audience: EmailAudience;
  name: string;
  description: string;
  subject: string;
  body_html: string;
  attach_ticket_pdf: boolean;
  enabled: boolean;
  sort_order: number;
  updated_at: string;
};

export type EmailOutboxRow = {
  id: string;
  template_key: string;
  to_email: string;
  status: 'pending' | 'sent' | 'error' | 'skipped';
  error: string | null;
  created_at: string;
  sent_at: string | null;
};

export const EMAIL_SAMPLE_VARS: Record<string, string> = {
  nombre: 'Ana Gómez',
  evento: 'La Eterna Primavera 2026',
  fecha: '7 de noviembre de 2026',
  lugar: 'Medellín, Colombia',
  ticket: 'Profesional presencial',
  monto: '$250.000',
  qr: 'EML-QR-DEMO',
  enlace: 'https://eventosmedicoslatam.com/portal',
  enlace_pago: 'https://eventosmedicoslatam.com/portal/pagos',
  empresa: 'Clínica Ejemplo',
  plan: 'Paquete Conexión',
  stand: 'A-12',
  concepto: 'Stand Conexión · anticipo 50%',
  asistente_email: 'ana@clinica.com',
};

export const EMAIL_VAR_HINTS = [
  '{{nombre}}', '{{evento}}', '{{fecha}}', '{{lugar}}', '{{ticket}}',
  '{{monto}}', '{{qr}}', '{{enlace}}', '{{enlace_pago}}', '{{empresa}}',
  '{{plan}}', '{{stand}}', '{{concepto}}', '{{asistente_email}}',
];

export function interpolateEmail(template: string, vars: Record<string, string> = EMAIL_SAMPLE_VARS) {
  return template.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, key: string) => vars[key] ?? '');
}

export async function listEmailTemplates(): Promise<EmailTemplate[]> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('key, audience, name, description, subject, body_html, attach_ticket_pdf, enabled, sort_order, updated_at')
    .order('sort_order');
  if (error) throw error;
  return (data ?? []) as EmailTemplate[];
}

export async function updateEmailTemplate(
  key: string,
  patch: Partial<Pick<EmailTemplate, 'subject' | 'body_html' | 'enabled'>>,
): Promise<void> {
  const { error } = await supabase
    .from('email_templates')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('key', key);
  if (error) throw error;
}

export async function enqueueEmail(key: string, to: string, vars: Record<string, string> = EMAIL_SAMPLE_VARS) {
  const { data, error } = await supabase.rpc('enqueue_email', {
    p_key: key,
    p_to: to,
    p_vars: vars,
    p_registration_id: null,
  });
  if (error) throw error;
  return data as string | null;
}

export async function enqueueDueReminders(): Promise<number> {
  const { data, error } = await supabase.rpc('enqueue_due_reminders');
  if (error) throw error;
  return Number(data ?? 0);
}

export async function listEmailOutbox(limit = 25): Promise<EmailOutboxRow[]> {
  const { data, error } = await supabase
    .from('email_outbox')
    .select('id, template_key, to_email, status, error, created_at, sent_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as EmailOutboxRow[];
}

export const EVENT_ATTENDEE_EMAILS: {
  key: string;
  trigger: string;
  when: string;
}[] = [
  { key: 'attendee_pending_payment', trigger: 'Inscripción en espera de pago', when: 'Se envía al crear un ticket de pago.' },
  { key: 'attendee_confirmed', trigger: 'Inscripción confirmada', when: 'Se envía al confirmar el cupo. Adjunta PDF con QR.' },
  { key: 'attendee_cancelled', trigger: 'Inscripción cancelada', when: 'Se envía si el equipo cancela el registro.' },
  { key: 'attendee_reminder_7d', trigger: '7 días antes del evento', when: 'Se encola el día en que faltan 7 días (desde Correos).' },
  { key: 'attendee_reminder_1d', trigger: '1 día antes del evento', when: 'Se encola el día anterior (desde Correos).' },
];

export type EventEmailVarsInput = {
  name: string;
  start_date: string;
  venue_name?: string | null;
  venue_city?: string | null;
  venue_address?: string | null;
};

export function eventEmailVars(event: EventEmailVarsInput, extra: Record<string, string> = {}): Record<string, string> {
  const fecha = event.start_date
    ? new Date(`${event.start_date}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const lugar = [event.venue_name, event.venue_city].filter(Boolean).join(' · ') || event.venue_address || '';
  return {
    ...EMAIL_SAMPLE_VARS,
    evento: event.name,
    fecha,
    lugar,
    ...extra,
  };
}

export async function listEventEmailOutbox(eventId: string, limit = 40): Promise<EmailOutboxRow[]> {
  const { data: regs, error: regError } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('event_id', eventId);
  if (regError) throw regError;
  const ids = (regs ?? []).map((row) => row.id).filter(Boolean);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('email_outbox')
    .select('id, template_key, to_email, status, error, created_at, sent_at')
    .in('registration_id', ids)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as EmailOutboxRow[];
}
