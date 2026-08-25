// Disparada por un trigger AFTER INSERT en registrations/community_members/
// plan_requests (ver trigger_ghl_sync en 016_integrations.sql). El payload
// del trigger NO es confiable más allá del id: siempre se vuelve a leer la
// fila real con service_role antes de sincronizar a GoHighLevel, como
// defensa ante alguien golpeando esta URL directamente.
import { corsHeaders } from '../_shared/cors.ts';
import { getIntegrationSecret, supabaseAdmin } from '../_shared/supabaseAdmin.ts';

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';

interface GhlContact {
  email: string | null;
  name: string | null;
  phone: string | null;
  tags: string[];
}

function mapRegistration(row: Record<string, unknown>): GhlContact {
  return {
    email: (row.email as string) ?? null,
    name: (row.full_name as string) ?? null,
    phone: (row.whatsapp as string) ?? null,
    tags: ['inscripcion', String(row.source ?? '')].filter(Boolean),
  };
}

function mapCommunityMember(row: Record<string, unknown>): GhlContact {
  return {
    email: (row.email as string) ?? null,
    name: (row.full_name as string) ?? null,
    phone: null,
    tags: ['comunidad', 'newsletter', String(row.source ?? '')].filter(Boolean),
  };
}

function mapPlanRequest(row: Record<string, unknown>): GhlContact {
  return {
    email: (row.contact_email as string) ?? null,
    name: (row.contact_name as string) ?? null,
    phone: (row.contact_whatsapp as string) ?? null,
    tags: ['patrocinio', 'oportunidad-comercial', String(row.plan_id ?? '')].filter(Boolean),
  };
}

const TABLE_CONFIG: Record<
  string,
  { mapper: (row: Record<string, unknown>) => GhlContact }
> = {
  registrations: { mapper: mapRegistration },
  community_members: { mapper: mapCommunityMember },
  plan_requests: { mapper: mapPlanRequest },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { table, record } = await req.json();
    const config = TABLE_CONFIG[table];
    if (!config || !record?.id) {
      return new Response('Tabla o registro inválido', { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data: row, error: fetchError } = await admin
      .from(table)
      .select('*')
      .eq('id', record.id)
      .single();

    if (fetchError || !row) {
      console.error('ghl-sync-contact: no se pudo releer la fila', fetchError);
      return new Response('Fila no encontrada', { status: 404 });
    }

    const contact = config.mapper(row);
    if (!contact.email) {
      // Sin correo no hay forma de identificar el contacto en GHL.
      return new Response('ok', { headers: corsHeaders });
    }

    const [token, locationId] = await Promise.all([
      getIntegrationSecret('ghl_private_token'),
      getIntegrationSecret('ghl_location_id'),
    ]);

    if (!token || !locationId) {
      console.error('ghl-sync-contact: GHL no está configurado todavía');
      return new Response('Integración no configurada', { status: 503 });
    }

    const ghlResponse = await fetch(`${GHL_BASE_URL}/contacts/upsert`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Version: GHL_API_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locationId,
        email: contact.email,
        name: contact.name,
        phone: contact.phone,
        tags: contact.tags,
      }),
    });

    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text();
      console.error('ghl-sync-contact: GHL respondió error', ghlResponse.status, errorText);
      return new Response('Error sincronizando con GHL', { status: 502 });
    }

    await admin.from(table).update({ crm_synced: true }).eq('id', record.id);

    return new Response('ok', { headers: corsHeaders });
  } catch (err) {
    console.error('ghl-sync-contact error', err);
    return new Response('Payload inválido', { status: 400 });
  }
});
