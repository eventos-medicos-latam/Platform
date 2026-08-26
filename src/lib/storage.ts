import { supabase } from './supabaseClient';

const BUCKET = 'company-files';

export async function uploadCompanyFile(
  companyId: string,
  folder: 'documents' | 'brand-assets',
  file: File
): Promise<{ path: string | null; error: string | null }> {
  const path = `${companyId}/${folder}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) return { path: null, error: error.message };
  return { path, error: null };
}

export async function getCompanyFileUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}

/** Recursos administrados por el equipo organizador, visibles para cualquier empresa. */
export async function uploadSharedResource(
  editionId: string,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  const path = `_shared/${editionId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) return { path: null, error: error.message };
  return { path, error: null };
}
