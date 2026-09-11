import { corsHeaders } from '../_shared/cors.ts';
import { getIntegrationSecret, supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { requireAdmin } from '../_shared/requireAdmin.ts';
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';
import QRCode from 'npm:qrcode@1.5.3';

type Vars = Record<string, string>;

const PLAN_LABELS: Record<string, string> = {
  protagonista: 'Paquete Protagonista',
  conexion: 'Paquete Conexión',
  'pop-up': 'Pop Up',
  'sociedad-medica': 'Sociedad médica o científica',
  'aliado-academico': 'Universidad o grupo de investigación',
  'media-partner': 'Medio especializado',
};

function asVars(value: unknown): Vars {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Vars = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v == null) continue;
    out[k] = String(v);
  }
  return out;
}

function interpolate(template: string, vars: Vars, escape = false) {
  return template.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, key: string) => {
    const raw = vars[key] ?? '';
    if (!escape) return raw;
    return raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) return '';
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

function formatCop(value: string | number | null | undefined) {
  if (value == null || value === '') return '';
  const raw = String(value).trim();
  if (raw.startsWith('$')) return raw;
  const n = Number(raw.replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(n)) return raw;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

function venueOf(row: { venue_name?: string | null; venue_city?: string | null; venue_address?: string | null } | null) {
  if (!row) return '';
  return [row.venue_name, row.venue_city].filter(Boolean).join(', ');
}

function wrapHtml(inner: string) {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;background:#0d1829;padding:24px;font-family:Inter,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#112035;border:1px solid #1e3450;border-radius:16px;padding:32px;color:#E1EAF4;line-height:1.55">
    <p style="margin:0 0 20px;color:#00C9A0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;font-weight:700">Eventos Médicos LATAM</p>
    <div style="font-size:15px">${inner}</div>
    <p style="margin:28px 0 0;font-size:12px;color:#7A9CB8">Este correo es transaccional. Si no reconoces esta acción, responde y te ayudamos.</p>
  </div>
</body>
</html>`;
}

function bytesToBase64(bytes: Uint8Array) {
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function getSiteUrl(admin: ReturnType<typeof supabaseAdmin>) {
  const { data } = await admin.from('public_settings').select('value').eq('key', 'site_url').maybeSingle();
  const value = String(data?.value ?? '').trim().replace(/\/$/, '');
  return value || 'https://eventosmedicoslatam.com';
}

async function hydrateNovoRegistration(admin: ReturnType<typeof supabaseAdmin>, id: string): Promise<Vars> {
  const { data: reg } = await admin
    .from('event_registrations')
    .select(`
      id, amount_paid, person_id, event_id, ticket_type_id,
      people:person_id(full_name),
      events:event_id(name, start_date, venue_name, venue_city, venue_address),
      ticket_types:ticket_type_id(name)
    `)
    .eq('id', id)
    .maybeSingle();
  if (!reg) return {};

  const person = Array.isArray(reg.people) ? reg.people[0] : reg.people;
  const event = Array.isArray(reg.events) ? reg.events[0] : reg.events;
  const ticket = Array.isArray(reg.ticket_types) ? reg.ticket_types[0] : reg.ticket_types;
  const { data: qr } = await admin.from('person_qr').select('qr_token').eq('person_id', reg.person_id).maybeSingle();

  return {
    nombre: String(person?.full_name ?? ''),
    evento: String(event?.name ?? ''),
    fecha: formatDate(event?.start_date),
    lugar: venueOf(event),
    ticket: String(ticket?.name ?? 'Entrada'),
    monto: formatCop(reg.amount_paid),
    qr: String(qr?.qr_token ?? ''),
  };
}

async function hydrateHormobiotaRegistration(admin: ReturnType<typeof supabaseAdmin>, id: string): Promise<Vars> {
  const { data: reg } = await admin
    .from('registrations')
    .select('full_name, email, amount, qr_code, edition_id, ticket_id')
    .eq('id', id)
    .maybeSingle();
  if (!reg) return {};
  const [{ data: edition }, { data: ticket }] = await Promise.all([
    admin.from('editions').select('name, start_date, venue_name, venue_city').eq('id', reg.edition_id).maybeSingle(),
    reg.ticket_id
      ? admin.from('tickets').select('name').eq('id', reg.ticket_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return {
    nombre: String(reg.full_name ?? ''),
    asistente_email: String(reg.email ?? ''),
    evento: String(edition?.name ?? ''),
    fecha: formatDate(edition?.start_date),
    lugar: venueOf(edition),
    ticket: String(ticket?.name ?? 'Entrada extra'),
    monto: formatCop(reg.amount),
    qr: String(reg.qr_code ?? ''),
  };
}

async function hydrateCompany(admin: ReturnType<typeof supabaseAdmin>, companyId: string): Promise<Vars> {
  const { data } = await admin.from('companies').select('trade_name').eq('id', companyId).maybeSingle();
  return data?.trade_name ? { empresa: data.trade_name } : {};
}

async function hydrateEvent(admin: ReturnType<typeof supabaseAdmin>, eventId: string): Promise<Vars> {
  const { data } = await admin
    .from('events')
    .select('name, start_date, venue_name, venue_city')
    .eq('id', eventId)
    .maybeSingle();
  if (!data) return {};
  return {
    evento: data.name,
    fecha: formatDate(data.start_date),
    lugar: venueOf(data),
  };
}

async function hydrateEdition(admin: ReturnType<typeof supabaseAdmin>, editionId: string): Promise<Vars> {
  const { data } = await admin
    .from('editions')
    .select('name, start_date, venue_name, venue_city')
    .eq('id', editionId)
    .maybeSingle();
  if (!data) return {};
  return {
    evento: data.name,
    fecha: formatDate(data.start_date),
    lugar: venueOf(data),
  };
}

async function hydrateVars(
  admin: ReturnType<typeof supabaseAdmin>,
  row: { variables: unknown; registration_id: string | null },
): Promise<Vars> {
  const vars: Vars = asVars(row.variables);
  const site = await getSiteUrl(admin);

  if (row.registration_id) Object.assign(vars, await hydrateNovoRegistration(admin, row.registration_id));
  else if (vars.hormobiota_registration_id) {
    Object.assign(vars, await hydrateHormobiotaRegistration(admin, vars.hormobiota_registration_id));
  }
  if (vars.empresa_id) Object.assign(vars, await hydrateCompany(admin, vars.empresa_id));
  if (vars.event_id && !vars.evento) Object.assign(vars, await hydrateEvent(admin, vars.event_id));
  if (vars.edition_id && !vars.evento) Object.assign(vars, await hydrateEdition(admin, vars.edition_id));
  if (vars.plan) vars.plan = PLAN_LABELS[vars.plan] ?? vars.plan;
  if (vars.monto) vars.monto = formatCop(vars.monto);

  if (vars.token) vars.enlace = `${site}/invitacion/staff/${vars.token}`;
  else vars.enlace = vars.enlace || `${site}/portal`;
  vars.enlace_pago = vars.enlace_pago || `${site}/portal/pagos`;
  if (!vars.enlace.startsWith('http')) vars.enlace = `${site}${vars.enlace.startsWith('/') ? '' : '/'}${vars.enlace}`;

  return vars;
}

async function buildTicketPdf(vars: Vars) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([420, 595]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.07, 0.13, 0.21);
  const mute = rgb(0.35, 0.45, 0.55);
  const accent = rgb(0, 0.79, 0.63);

  page.drawRectangle({ x: 0, y: 555, width: 420, height: 40, color: rgb(0.04, 0.13, 0.25) });
  page.drawText('EVENTOS MÉDICOS LATAM', {
    x: 28, y: 570, size: 11, font: bold, color: rgb(1, 1, 1),
  });

  page.drawText('Ticket de acceso', { x: 28, y: 520, size: 18, font: bold, color: ink });
  page.drawText(vars.evento || 'Evento', { x: 28, y: 496, size: 12, font, color: mute });

  const lines: [string, string][] = [
    ['Nombre', vars.nombre || '—'],
    ['Entrada', vars.ticket || '—'],
    ['Fecha', vars.fecha || '—'],
    ['Lugar', vars.lugar || '—'],
    ['Valor', vars.monto || 'Cortesía'],
    ['Código', vars.qr || '—'],
  ];
  let y = 460;
  for (const [label, value] of lines) {
    page.drawText(label.toUpperCase(), { x: 28, y, size: 8, font: bold, color: accent });
    page.drawText(value.slice(0, 62), { x: 28, y: y - 16, size: 11, font, color: ink });
    y -= 42;
  }

  if (vars.qr) {
    try {
      const dataUrl = await QRCode.toDataURL(vars.qr, { margin: 1, width: 220, errorCorrectionLevel: 'M' });
      const raw = dataUrl.split(',')[1] ?? '';
      const png = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      const image = await doc.embedPng(png);
      page.drawImage(image, { x: 250, y: 70, width: 140, height: 140 });
    } catch (err) {
      console.error('send-template-email: no se pudo dibujar el QR', err);
    }
  }

  page.drawText('Presenta este PDF o el código QR en acreditación.', {
    x: 28, y: 28, size: 8, font, color: mute,
  });

  const bytes = await doc.save();
  const slug = (vars.evento || 'ticket').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { filename: `ticket-${slug || 'evento'}.pdf`, content: bytesToBase64(bytes) };
}

async function sendOutbox(outboxId: string) {
  const admin = supabaseAdmin();
  const { data: row, error } = await admin
    .from('email_outbox')
    .select('id, template_key, to_email, variables, registration_id, status')
    .eq('id', outboxId)
    .maybeSingle();
  if (error) throw error;
  if (!row) return { ok: false, status: 404, error: 'Outbox no encontrado' };
  if (row.status === 'sent') return { ok: true, skipped: true };

  const { data: template } = await admin
    .from('email_templates')
    .select('key, subject, body_html, attach_ticket_pdf, enabled')
    .eq('key', row.template_key)
    .maybeSingle();
  if (!template?.enabled) {
    await admin.from('email_outbox').update({ status: 'skipped', error: 'Plantilla desactivada' }).eq('id', row.id);
    return { ok: true, skipped: true };
  }

  const vars = await hydrateVars(admin, row);
  const subject = interpolate(template.subject, vars, false).trim() || 'Eventos Médicos LATAM';
  const html = wrapHtml(interpolate(template.body_html, vars, true));

  const apiKey = await getIntegrationSecret('resend_api_key');
  if (!apiKey) {
    await admin.from('email_outbox').update({ status: 'error', error: 'Resend no configurado' }).eq('id', row.id);
    return { ok: false, status: 503, error: 'Resend no está configurado todavía (falta API key).' };
  }

  const { data: settings } = await admin
    .from('public_settings')
    .select('key, value')
    .in('key', ['resend_from_email', 'resend_from_name']);
  const map = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value ?? '']));
  const fromEmail = String(map.resend_from_email ?? '').trim();
  if (!fromEmail) {
    await admin.from('email_outbox').update({ status: 'error', error: 'Falta correo remitente' }).eq('id', row.id);
    return { ok: false, status: 503, error: 'Configura el correo remitente (From) de Resend.' };
  }
  const fromName = String(map.resend_from_name ?? '').trim() || 'Eventos Médicos LATAM';

  const attachments = template.attach_ticket_pdf
    ? [await buildTicketPdf(vars)]
    : undefined;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [row.to_email],
      subject,
      html,
      attachments,
    }),
  });
  const payload = await res.json() as { id?: string; message?: string };
  if (!res.ok) {
    const message = payload.message ?? `Resend ${res.status}`;
    await admin.from('email_outbox').update({ status: 'error', error: message }).eq('id', row.id);
    return { ok: false, status: 502, error: message };
  }

  await admin.from('email_outbox').update({
    status: 'sent',
    error: null,
    sent_at: new Date().toISOString(),
  }).eq('id', row.id);

  return { ok: true, id: payload.id };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json() as { outbox_id?: string; action?: string };
    if (body.action === 'reminders') {
      const gate = await requireAdmin(req);
      if (!gate.ok) {
        return new Response(JSON.stringify({ error: gate.error }), {
          status: gate.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data, error } = await supabaseAdmin().rpc('enqueue_due_reminders');
      if (error) throw error;
      return new Response(JSON.stringify({ queued: data ?? 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const outboxId = String(body.outbox_id ?? '').trim();
    if (!outboxId) {
      return new Response(JSON.stringify({ error: 'outbox_id requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await sendOutbox(outboxId);
    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : result.status ?? 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-template-email error', err);
    return new Response(JSON.stringify({ error: 'Solicitud inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
