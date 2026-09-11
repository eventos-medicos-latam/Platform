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
