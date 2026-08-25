// Genera la "signature:integrity" que exige el Web Checkout de Wompi antes
// de abrir el widget/redirect de pago. Contrato oficial (Wompi Colombia):
//   SHA256(reference + amount_in_cents + currency + [expiration_time] + integrity_secret)
// concatenado sin separadores, hex digest. expiration_time se omite si no se usa.
import { corsHeaders } from '../_shared/cors.ts';
import { getIntegrationSecret } from '../_shared/supabaseAdmin.ts';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { reference, amount_in_cents, currency, expiration_time } = await req.json();

    if (!reference || !amount_in_cents || !currency) {
      return new Response(
        JSON.stringify({ error: 'reference, amount_in_cents y currency son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const integritySecret = await getIntegrationSecret('wompi_integrity_secret');
    if (!integritySecret) {
      return new Response(
        JSON.stringify({ error: 'Wompi no está configurado todavía (integrity secret ausente).' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const concat = expiration_time
      ? `${reference}${amount_in_cents}${currency}${expiration_time}${integritySecret}`
      : `${reference}${amount_in_cents}${currency}${integritySecret}`;

    const signature = await sha256Hex(concat);

    return new Response(JSON.stringify({ signature }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('wompi-create-signature error', err);
    return new Response(JSON.stringify({ error: 'Solicitud inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
