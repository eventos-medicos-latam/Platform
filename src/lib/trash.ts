import { supabase } from './supabaseClient';

export async function moveToTrash(table: string, id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('move_to_trash', { p_table: table, p_id: id });
  return { error: error?.message ?? null };
}

export async function restoreFromTrash(trashId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('restore_from_trash', { p_trash_id: trashId });
  return { error: error?.message ?? null };
}
