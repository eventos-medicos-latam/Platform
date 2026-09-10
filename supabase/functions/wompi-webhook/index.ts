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

function jsonOk() {
  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return jsonOk();
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
      return jsonOk();
    }

    const mappedStatus = WOMPI_STATUS_MAP[transaction.status];
    if (!mappedStatus) {
      // Estado desconocido/no mapeado: se ignora sin error para no romper el webhook.
      return jsonOk();
    }

    const admin = supabaseAdmin();
    const reference: string = transaction.reference;

    // Esquema de referencia: HB-REG-<registration.id> para tickets Hormobiota,
    // NV-TKT-<uuid> para tickets Novo (event_registrations.wompi_reference),
    // HB-PAY-<company_payment.id> para una cuota, HB-BAL-<participation.id>
    // para liquidar el saldo restante de una edición, HB-EALL-<company_payment.id>
    // para liquidar todas las cuotas pendientes del mismo evento Novo,
    // HB-SPONSOR-<plan_request.id> para quien paga de una vez al registrarse
    // como patrocinador.
    if (reference.startsWith('HB-PAY-')) {
      if (mappedStatus !== 'approved') {
        // company_payments no tiene un estado "rechazado" equivalente;
        // solo se actualiza cuando Wompi aprueba el pago.
        return jsonOk();
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
      return jsonOk();
    }

    // Pago de todas las cuotas pendientes del mismo evento (Novo) o edición.
    // HB-EALL-<company_payment.id> usa esa fila como semilla de company_id + event_id/edition_id.
    if (reference.startsWith('HB-EALL-')) {
      if (mappedStatus !== 'approved') {
        return jsonOk();
      }
      const paymentId = reference.slice('HB-EALL-'.length);
      const { data: seed, error: seedError } = await admin
        .from('company_payments')
        .select('id, company_id, event_id, edition_id')
        .eq('id', paymentId)
        .single();

      if (seedError || !seed) {
        console.error('wompi-webhook: cuota semilla no encontrada para HB-EALL', seedError);
        return new Response('Error interno', { status: 500 });
      }

      const paidAt = new Date().toISOString();
      let markQuery = admin
        .from('company_payments')
        .update({
          status: 'pagado',
          payment_method: 'wompi',
          paid_at: paidAt,
          wompi_transaction_id: transaction.id ?? null,
          paid_reference: reference,
        })
        .eq('company_id', seed.company_id)
        .neq('status', 'pagado');

      if (seed.event_id) {
        markQuery = markQuery.eq('event_id', seed.event_id);
      } else if (seed.edition_id) {
        markQuery = markQuery.eq('edition_id', seed.edition_id);
      } else {
        markQuery = markQuery.eq('id', paymentId);
      }

      const { error: markError } = await markQuery;
      if (markError) {
        console.error('wompi-webhook: error marcando cuotas HB-EALL', markError);
        return new Response('Error interno', { status: 500 });
      }

      const { error: refError } = await admin
        .from('company_payments')
        .update({ wompi_reference: reference })
        .eq('id', paymentId);

      if (refError) {
        console.error('wompi-webhook: error guardando referencia HB-EALL', refError);
      }

      return jsonOk();
    }

    // Compra de ticket Novo (persona). NV-TKT-<uuid> queda en event_registrations.wompi_reference.
    if (reference.startsWith('NV-TKT-')) {
      if (mappedStatus !== 'approved') {
        return jsonOk();
      }
      const amountInCents = Number(transaction.amount_in_cents ?? 0);
      const amount = amountInCents > 0 ? amountInCents / 100 : 0;
      const { data: confirmed, error: confirmError } = await admin.rpc('novo_confirm_ticket_payment', {
        p_reference: reference,
        p_amount: amount,
        p_transaction_id: transaction.id ? String(transaction.id) : null,
      });
      if (confirmError || confirmed !== true) {
        const { data: registration, error: findError } = await admin
          .from('event_registrations')
          .select('id, person_id, event_id, ticket_type_id')
          .eq('wompi_reference', reference)
          .maybeSingle();
        if (findError || !registration) {
          console.error('wompi-webhook: no se confirmó el ticket Novo', confirmError, findError);
          return new Response('Error interno', { status: 500 });
        }
        const { error: updateError } = await admin
          .from('event_registrations')
          .update({ status: 'confirmado', amount_paid: amount })
          .eq('id', registration.id);
        if (updateError) {
          console.error('wompi-webhook: error confirmando inscripción Novo', updateError);
          return new Response('Error interno', { status: 500 });
        }
        if (registration.ticket_type_id) {
          await admin.from('ticket_entitlements').insert({
            registration_id: registration.id,
            ticket_type_id: registration.ticket_type_id,
            person_id: registration.person_id,
            event_id: registration.event_id,
            price_paid: amount,
            status: 'activo',
          });
        }
      }
      return jsonOk();
    }

    // Pago del saldo restante del contrato (todas las cuotas pendientes).
    // HB-BAL-<participation_id>
    if (reference.startsWith('HB-BAL-')) {
      if (mappedStatus !== 'approved') {
        return jsonOk();
      }
      const participationId = reference.slice('HB-BAL-'.length);
      const { data: participation, error: partError } = await admin
        .from('participations')
        .select('id, company_id, edition_id, agreed_amount, paid_amount')
        .eq('id', participationId)
        .single();

      if (partError || !participation) {
        console.error('wompi-webhook: participación no encontrada para HB-BAL', partError);
        return new Response('Error interno', { status: 500 });
      }

      const paidAt = new Date().toISOString();
      const { data: pendingRows, error: pendingError } = await admin
        .from('company_payments')
        .select('id')
        .eq('company_id', participation.company_id)
        .eq('edition_id', participation.edition_id)
        .neq('status', 'pagado');

      if (pendingError) {
        console.error('wompi-webhook: error listando cuotas pendientes', pendingError);
        return new Response('Error interno', { status: 500 });
      }

      if (pendingRows && pendingRows.length > 0) {
        const { error: markError } = await admin
          .from('company_payments')
          .update({
            status: 'pagado',
            payment_method: 'wompi',
            paid_at: paidAt,
            wompi_transaction_id: transaction.id ?? null,
            paid_reference: reference,
          })
          .eq('company_id', participation.company_id)
          .eq('edition_id', participation.edition_id)
          .neq('status', 'pagado');

        if (markError) {
          console.error('wompi-webhook: error marcando cuotas del saldo', markError);
          return new Response('Error interno', { status: 500 });
        }

        const { error: refError } = await admin
          .from('company_payments')
          .update({ wompi_reference: reference })
          .eq('id', pendingRows[0].id);

        if (refError) {
          console.error('wompi-webhook: error guardando referencia HB-BAL', refError);
        }
      } else {
        const amountInCents = Number(transaction.amount_in_cents ?? 0);
        const amount = amountInCents > 0
          ? amountInCents / 100
          : Math.max((participation.agreed_amount ?? 0) - (participation.paid_amount ?? 0), 0);
        if (amount > 0) {
          const { error: insertError } = await admin.from('company_payments').insert({
            company_id: participation.company_id,
            edition_id: participation.edition_id,
            concept: 'Pago de saldo',
            amount,
            status: 'pagado',
            payment_method: 'wompi',
            paid_at: paidAt,
            wompi_reference: reference,
            wompi_transaction_id: transaction.id ?? null,
          });
          if (insertError) {
            console.error('wompi-webhook: error insertando pago de saldo', insertError);
            return new Response('Error interno', { status: 500 });
          }
        }
      }
      return jsonOk();
    }

    if (reference.startsWith('HB-SPONSOR-')) {
      if (mappedStatus !== 'approved') {
        // plan_requests tampoco tiene un estado "rechazado" por Wompi
        // distinto de 'descartada' (que es una decisión comercial, no de
        // pago); solo se actualiza cuando Wompi aprueba.
        return jsonOk();
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
      return jsonOk();
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

    return jsonOk();
  } catch (err) {
    console.error('wompi-webhook error', err);
    return new Response('Payload inválido', { status: 400 });
  }
});
