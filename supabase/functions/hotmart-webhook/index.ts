// Receptor del postback/webhook de Hotmart. Se despliega con verify_jwt=false.
//
// TODO: confirmar contra un evento de prueba real de Hotmart antes de producción.
// La documentación pública de Hotmart es inconsistente entre el "Postback"
// clásico (el Hottok viaja como campo dentro del body, ej. `data.hottok` o
// `hottok`) y el "Webhook" más nuevo vía HotConnect (firma HMAC-SHA256 en el
// header `x-hotmart-signature`). Este código valida contra AMBOS mecanismos
// como defensa, pero hay que verificar empíricamente cuál aplica a la cuenta
// real (Hotmart permite "Enviar prueba" desde su dashboard) y simplificar
// esta función a uno solo de los dos caminos una vez confirmado.
import { corsHeaders } from '../_shared/cors.ts';
import { getIntegrationSecret, supabaseAdmin } from '../_shared/supabaseAdmin.ts';

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    const hottok = await getIntegrationSecret('hotmart_hottok');
    const clientSecret = await getIntegrationSecret('hotmart_client_secret');

    const bodyHottok = payload?.hottok ?? payload?.data?.hottok ?? null;
    const headerSignature = req.headers.get('x-hotmart-signature');

    let verified = false;
    if (hottok && bodyHottok && bodyHottok === hottok) {
      verified = true;
    } else if (clientSecret && headerSignature) {
      const expected = await hmacSha256Hex(clientSecret, rawBody);
      verified = expected === headerSignature;
    }

    if (!verified) {
      console.error('hotmart-webhook: no se pudo verificar el origen del webhook');
      return new Response('No autorizado', { status: 401 });
    }

    const data = payload?.data ?? payload;
    const purchase = data?.purchase ?? data;
    const buyer = data?.buyer ?? {};
    const product = data?.product ?? {};

    const admin = supabaseAdmin();
    const { error } = await admin.from('hotmart_sales').insert({
      hotmart_transaction_id: String(purchase?.transaction ?? purchase?.order_id ?? crypto.randomUUID()),
      hotmart_product_id: product?.id ? String(product.id) : null,
      buyer_email: buyer?.email ?? null,
      buyer_name: buyer?.name ?? null,
      amount: purchase?.price?.value ?? purchase?.full_price?.value ?? null,
      status: String(purchase?.status ?? payload?.event ?? 'desconocido'),
      raw_payload: payload,
    });

    if (error && error.code !== '23505') {
      // 23505 = unique_violation (evento duplicado, se ignora sin fallar el webhook)
      console.error('hotmart-webhook: error insertando venta', error);
      return new Response('Error interno', { status: 500 });
    }

    return new Response('ok', { headers: corsHeaders });
  } catch (err) {
    console.error('hotmart-webhook error', err);
    return new Response('Payload inválido', { status: 400 });
  }
});
