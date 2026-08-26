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

const PUBLIC_BUCKET = 'site-assets';

/** Activos del sitio público (logo, banner) — bucket público, URL estable. */
export async function uploadPublicAsset(
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const path = `${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from(PUBLIC_BUCKET).upload(path, file);
  if (error) return { url: null, error: error.message };
  const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

/**
 * Sube un logo directo al bucket público y lo deja como el logo oficial de
 * la empresa (companies.logo_url/logo_ready). Es el camino que usa el admin
 * para corregir un logo subido mal, sin pasar por company-files.
 */
export async function setCompanyLogo(
  companyId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const path = `logos/${companyId}-${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from(PUBLIC_BUCKET).upload(path, file);
  if (uploadError) return { url: null, error: uploadError.message };
  const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
  const { error: updateError } = await supabase.from('companies').update({ logo_url: data.publicUrl, logo_ready: true }).eq('id', companyId);
  if (updateError) return { url: null, error: updateError.message };
  return { url: data.publicUrl, error: null };
}

/**
 * Publica un archivo ya aprobado en brand_assets (privado, en company-files)
 * como el logo público de la empresa — el eslabón que faltaba entre "admin
 * aprueba el logo" y que ese logo real aparezca en el banner público.
 */
export async function publishCompanyLogoFromAsset(
  companyId: string,
  filePath: string
): Promise<{ url: string | null; error: string | null }> {
  const { data: fileBlob, error: downloadError } = await supabase.storage.from(BUCKET).download(filePath);
  if (downloadError || !fileBlob) return { url: null, error: downloadError?.message ?? 'No se pudo leer el archivo' };
  const extension = filePath.split('.').pop() ?? 'png';
  const path = `logos/${companyId}-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(PUBLIC_BUCKET).upload(path, fileBlob);
  if (uploadError) return { url: null, error: uploadError.message };
  const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
  const { error: updateError } = await supabase.from('companies').update({ logo_url: data.publicUrl, logo_ready: true }).eq('id', companyId);
  if (updateError) return { url: null, error: updateError.message };
  return { url: data.publicUrl, error: null };
}
