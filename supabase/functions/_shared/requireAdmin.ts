import { createClient } from 'npm:@supabase/supabase-js@2';
import { supabaseAdmin } from './supabaseAdmin.ts';

export async function requireAdmin(req: Request): Promise<
  { ok: true } | { ok: false; status: number; error: string }
> {
  const auth = req.headers.get('Authorization');
  if (!auth) return { ok: false, status: 401, error: 'No autenticado' };

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { ok: false, status: 401, error: 'No autenticado' };

  const { data: profile } = await supabaseAdmin()
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') return { ok: false, status: 403, error: 'No autorizado' };
  return { ok: true };
}
