import { createClient } from 'npm:@supabase/supabase-js@2';

// service_role: corre server-side dentro de la Edge Function, bypassa RLS.
// Nunca se importa este archivo desde código de cliente/navegador.
export function supabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

export async function getIntegrationSecret(key: string): Promise<string | null> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc('get_integration_secret', { p_key: key });
  if (error) {
    console.error(`get_integration_secret(${key}) failed`, error);
    return null;
  }
  return data as string | null;
}
