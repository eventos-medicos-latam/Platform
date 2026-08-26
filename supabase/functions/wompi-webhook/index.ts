// Receptor del webhook de eventos de Wompi. Se despliega con verify_jwt=false
// (Wompi no manda un JWT de Supabase). La autenticación real es la verificación
// de firma que hace esta función con el "Event Secret" (distinto del integrity
// secret usado en wompi-create-signature).
//
// Contrato de firma (Wompi Colombia): el payload trae signature.properties,
// una lista de rutas dentro de `data` que VARÍA según el tipo de evento — no
// se debe asumir un conjunto fijo de campos. Se resuelven esas rutas, se
// concatenan los valores en ese orden + timestamp + events_secret, SHA256,
// y se compara contra signature.checksum.
import { corsHeaders } from '../_shared/cors.ts';
import { getIntegrationSecret, supabaseAdmin } from '../_shared/supabaseAdmin.ts';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function resolvePath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

const WOMPI_STATUS_MAP: Record<string, string> = {
  APPROVED: 'approved',
  DECLINED: 'declined',
  VOIDED: 'cancelled',
  ERROR: 'failed',
  PENDING: 'pending',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { data, signature, timestamp } = payload ?? {};

    if (!data || !signature?.properties || !signature?.checksum) {
      return new Response('Payload inválido', { status: 400 });
    }

    const eventsSecret = await getIntegrationSecret('wompi_events_secret');
    if (!eventsSecret) {
      console.error('wompi-webhook: wompi_events_secret no configurado');
      return new Response('Integración no configurada', { status: 503 });
    }

    const concatenated =
      (signature.properties as string[]).map((path) => String(resolvePath(data, path) ?? '')).join('') +
      String(timestamp ?? '') +
      eventsSecret;

    const expectedChecksum = await sha256Hex(concatenated);

    if (expectedChecksum !== signature.checksum) {
      console.error('wompi-webhook: checksum inválido');
      return new Response('Firma inválida', { status: 401 });
    }

    const transaction = data.transaction;
    if (!transaction?.reference || !transaction?.status) {
      return new Response('ok', { headers: corsHeaders });
    }

    const mappedStatus = WOMPI_STATUS_MAP[transaction.status];
    if (!mappedStatus) {
      // Estado desconocido/no mapeado: se ignora sin error para no romper el webhook.
      return new Response('ok', { headers: corsHeaders });
    }

    const admin = supabaseAdmin();
    const reference: string = transaction.reference;

    // Esquema de referencia: HB-REG-<registration.id> para tickets,
    // HB-PAY-<company_payment.id> para cobros de patrocinio (Portal),
    // HB-SPONSOR-<plan_request.id> para quien paga de una vez al
    // registrarse como patrocinador desde el sitio público.
    if (reference.startsWith('HB-PAY-')) {
      if (mappedStatus !== 'approved') {
        // company_payments no tiene un estado "rechazado" equivalente;
        // solo se actualiza cuando Wompi aprueba el pago.
        return new Response('ok', { headers: corsHeaders });
      }
      const paymentId = reference.slice('HB-PAY-'.length);
      const { error } = await admin
        .from('company_payments')
        .update({
          status: 'pagado',
          payment_method: 'wompi',
          paid_at: new Date().toISOString(),
          wompi_reference: reference,
          wompi_transaction_id: transaction.id ?? null,
        })
        .eq('id', paymentId);

      if (error) {
        console.error('wompi-webhook: error actualizando company_payment', error);
        return new Response('Error interno', { status: 500 });
      }
      return new Response('ok', { headers: corsHeaders });
    }

    if (reference.startsWith('HB-SPONSOR-')) {
      if (mappedStatus !== 'approved') {
        // plan_requests tampoco tiene un estado "rechazado" por Wompi
        // distinto de 'descartada' (que es una decisión comercial, no de
        // pago); solo se actualiza cuando Wompi aprueba.
        return new Response('ok', { headers: corsHeaders });
      }
      const requestId = reference.slice('HB-SPONSOR-'.length);
      const { error } = await admin
        .from('plan_requests')
        .update({
          status: 'aprobada',
          paid_at: new Date().toISOString(),
          wompi_transaction_id: transaction.id ?? null,
        })
        .eq('id', requestId);

      if (error) {
        console.error('wompi-webhook: error actualizando plan_request', error);
        return new Response('Error interno', { status: 500 });
      }
      return new Response('ok', { headers: corsHeaders });
    }

    const { error } = await admin
      .from('registrations')
      .update({
        payment_status: mappedStatus,
        wompi_transaction_id: transaction.id ?? null,
      })
      .eq('wompi_reference', reference);

    if (error) {
      console.error('wompi-webhook: error actualizando registration', error);
      return new Response('Error interno', { status: 500 });
    }

    return new Response('ok', { headers: corsHeaders });
  } catch (err) {
    console.error('wompi-webhook error', err);
    return new Response('Payload inválido', { status: 400 });
  }
});
