// Consulta una transacción de Wompi al volver del checkout (query `id`)
// y, si es un ticket Novo aprobado, confirma la inscripción aunque el webhook
// aún no haya llegado.
import { corsHeaders } from '../_shared/cors.ts';
import { getIntegrationSecret, supabaseAdmin } from '../_shared/supabaseAdmin.ts';

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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transaction_id, env } = await req.json();
    if (!transaction_id || typeof transaction_id !== 'string') {
      return json({ error: 'transaction_id requerido' }, 400);
    }

    const sandbox = env !== 'prod' && env !== 'production';
    const base = sandbox ? 'https://sandbox.wompi.co/v1' : 'https://production.wompi.co/v1';

    const admin = supabaseAdmin();
    let auth = await getIntegrationSecret('wompi_private_key');
    if (!auth) {
      const { data } = await admin.from('public_settings').select('value').eq('key', 'wompi_public_key').maybeSingle();
      auth = data?.value ?? null;
    }
    if (!auth) {
      return json({ error: 'Wompi no está configurado' }, 503);
    }

    const wompiRes = await fetch(`${base}/transactions/${encodeURIComponent(transaction_id)}`, {
      headers: { Authorization: `Bearer ${auth}` },
    });
    const payload = await wompiRes.json();
    const tx = payload?.data;
    if (!wompiRes.ok || !tx) {
      return json({ error: 'No se encontró la transacción en Wompi' }, 404);
    }

    const status = String(tx.status ?? '');
    const reference = String(tx.reference ?? '');
    const amountInCents = Number(tx.amount_in_cents ?? 0);
    const methodType = String(tx.payment_method_type ?? tx.payment_method?.type ?? '');
    const receipt: Record<string, unknown> = {
      wompi_id: tx.id,
      status,
      status_label: STATUS_LABEL[status] ?? status,
      approved: status === 'APPROVED',
      amount: amountInCents / 100,
      currency: tx.currency ?? 'COP',
      reference,
      email: tx.customer_email ?? null,
      payment_method: methodType || null,
      payment_method_label: METHOD_LABEL[methodType] ?? (methodType || null),
      card_last_four: tx.payment_method?.extra?.last_four ?? null,
      ticket_name: null,
      person_name: null,
      qr_token: null,
      event_name: null,
    };

    if (reference.startsWith('NV-TKT-')) {
      const amount = amountInCents > 0 ? amountInCents / 100 : 0;
      if (status === 'APPROVED') {
        await admin.rpc('novo_confirm_ticket_payment', {
          p_reference: reference,
          p_amount: amount,
          p_transaction_id: String(tx.id ?? ''),
        });
      }

      const { data: registration } = await admin
        .from('event_registrations')
        .select('id, person_id, event_id, ticket_type_id, status')
        .eq('wompi_reference', reference)
        .maybeSingle();

      if (registration) {
        const [{ data: person }, { data: ticket }, { data: event }, { data: qr }] = await Promise.all([
          admin.from('people').select('full_name').eq('id', registration.person_id).maybeSingle(),
          registration.ticket_type_id
            ? admin.from('ticket_types').select('name').eq('id', registration.ticket_type_id).maybeSingle()
            : Promise.resolve({ data: null }),
          admin.from('events').select('name').eq('id', registration.event_id).maybeSingle(),
          admin.from('person_qr').select('qr_token').eq('person_id', registration.person_id).maybeSingle(),
        ]);
        receipt.person_name = person?.full_name ?? null;
        receipt.ticket_name = ticket?.name ?? null;
        receipt.event_name = event?.name ?? null;
        receipt.qr_token = qr?.qr_token ?? null;
      }
    }

    return json(receipt);
  } catch (err) {
    console.error('wompi-transaction-status error', err);
    return json({ error: 'Solicitud inválida' }, 400);
  }
});
