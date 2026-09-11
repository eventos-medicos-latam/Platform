import { corsHeaders } from '../_shared/cors.ts';
import { getIntegrationSecret, supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { requireAdmin } from '../_shared/requireAdmin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const gate = await requireAdmin(req);
  if (!gate.ok) {
    return new Response(JSON.stringify({ error: gate.error }), {
      status: gate.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json() as {
      to?: string | string[];
      subject?: string;
      html?: string;
      text?: string;
    };

    const to = Array.isArray(body.to) ? body.to.filter(Boolean) : body.to ? [body.to] : [];
    const subject = String(body.subject ?? '').trim();
    const html = typeof body.html === 'string' ? body.html : undefined;
    const text = typeof body.text === 'string' ? body.text : undefined;

    if (!to.length || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({ error: 'to, subject y html o text son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const apiKey = await getIntegrationSecret('resend_api_key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Resend no está configurado todavía (falta API key).' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const admin = supabaseAdmin();
    const { data: settings } = await admin
      .from('public_settings')
      .select('key, value')
      .in('key', ['resend_from_email', 'resend_from_name']);
    const map = Object.fromEntries((settings ?? []).map((row) => [row.key, row.value ?? '']));
    const fromEmail = String(map.resend_from_email ?? '').trim();
    if (!fromEmail) {
      return new Response(
        JSON.stringify({ error: 'Configura el correo remitente (From) de Resend.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const fromName = String(map.resend_from_name ?? '').trim() || 'Eventos Médicos LATAM';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to,
        subject,
        html,
        text,
      }),
    });

    const payload = await res.json() as { id?: string; message?: string };
    if (!res.ok) {
      console.error('send-email: Resend rechazó el envío', payload.message ?? res.status);
      return new Response(
        JSON.stringify({ error: payload.message ?? 'Resend rechazó el envío' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ id: payload.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-email error', err);
    return new Response(JSON.stringify({ error: 'Solicitud inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
