// Reenvía un evento (Purchase, Lead, CompleteRegistration...) a la Conversions
// API de Meta desde el servidor, como complemento del Pixel del navegador
// (mejora la atribución cuando bloqueadores de anuncios interfieren con el
// Pixel client-side). Llamada opcional desde el cliente en momentos clave.
import { corsHeaders } from '../_shared/cors.ts';
import { getIntegrationSecret } from '../_shared/supabaseAdmin.ts';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.trim().toLowerCase());
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
    const { event_name, event_id, pixel_id, user_data, custom_data, event_source_url } =
      await req.json();

    if (!event_name) {
      return new Response(JSON.stringify({ error: 'event_name es requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = await getIntegrationSecret('meta_capi_access_token');
    if (!accessToken || !pixel_id) {
      return new Response(
        JSON.stringify({ success: false, reason: 'Meta CAPI no está configurado todavía' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hashedUserData: Record<string, string> = {};
    if (user_data?.email) hashedUserData.em = await sha256Hex(user_data.email);
    if (user_data?.phone) hashedUserData.ph = await sha256Hex(user_data.phone);

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${pixel_id}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [
            {
              event_name,
              event_time: Math.floor(Date.now() / 1000),
              event_id,
              event_source_url,
              action_source: 'website',
              user_data: hashedUserData,
              custom_data: custom_data ?? {},
            },
          ],
        }),
      }
    );

    const success = response.ok;
    if (!success) {
      console.error('meta-capi: Meta respondió error', await response.text());
    }

    return new Response(JSON.stringify({ success }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('meta-capi error', err);
    return new Response(JSON.stringify({ success: false }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
