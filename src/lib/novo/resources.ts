import { supabase } from '../supabaseClient';
import { getCompanyFileUrl, uploadNovoResource, uploadPublicAsset } from '../storage';

export type DocCategory = 'global' | 'empresa' | 'evento';
export type DocScope = 'Público' | 'Empresa' | 'Interno' | 'Privado';
export type DocType = 'PDF' | 'XLSX' | 'PNG' | 'JPG' | 'ZIP' | 'DOCX' | 'MP4';
export type DocSource = 'resource' | 'company';

export type CatalogDoc = {
  id: string;
  source: DocSource;
  name: string;
  category: DocCategory;
  type: DocType;
  size: string;
  sizeBytes: number | null;
  scope: DocScope;
  updated: string;
  updatedAt: string;
  eventId: string | null;
  event: string | null;
  companyId: string | null;
  company: string | null;
  description: string;
  url: string;
  storagePath: string | null;
};

export type ResourceWrite = {
  name: string;
  description: string;
  category: DocCategory;
  type: DocType;
  scope: DocScope;
  eventId: string | null;
  companyId: string | null;
  url: string;
  storagePath: string | null;
  sizeBytes: number | null;
};

type CompanyEmbed = { trade_name: string } | { trade_name: string }[] | null;
type EventEmbed = { name: string } | { name: string }[] | null;
type EventResourceEmbed = {
  event_id: string;
  visible_to: string;
  events: EventEmbed;
} | {
  event_id: string;
  visible_to: string;
  events: EventEmbed;
}[] | null;

type ResourceRow = {
  id: string;
  name: string;
  resource_type: string | null;
  description: string | null;
  file_url: string | null;
  storage_path: string | null;
  file_type: string | null;
  file_size_bytes: number | null;
  access_level: string;
  company_id: string | null;
  is_public: boolean;
  updated_at: string;
  companies: CompanyEmbed;
  event_resources: EventResourceEmbed;
};

type CompanyDocRow = {
  id: string;
  name: string | null;
  kind: string | null;
  date: string;
  size_label: string | null;
  file_path: string | null;
  company_id: string;
  companies: CompanyEmbed;
};

const ACCESS_TO_SCOPE: Record<string, DocScope> = {
  publico: 'Público',
  empresa: 'Empresa',
  interno: 'Interno',
  privado: 'Privado',
};

const SCOPE_TO_ACCESS: Record<DocScope, string> = {
  Público: 'publico',
  Empresa: 'empresa',
  Interno: 'interno',
  Privado: 'privado',
};

const DOC_TYPES: DocType[] = ['PDF', 'XLSX', 'PNG', 'JPG', 'ZIP', 'DOCX', 'MP4'];

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function asType(value?: string | null): DocType {
  const upper = (value ?? '').toUpperCase();
  if (upper === 'JPEG') return 'JPG';
  if (DOC_TYPES.includes(upper as DocType)) return upper as DocType;
  return 'PDF';
}

export function fileTypeFromName(name: string, mime = ''): DocType {
  const ext = name.split('.').pop()?.toUpperCase() ?? '';
  if (ext === 'JPEG') return 'JPG';
  if (DOC_TYPES.includes(ext as DocType)) return ext as DocType;
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('sheet') || mime.includes('excel')) return 'XLSX';
  if (mime.includes('word')) return 'DOCX';
  if (mime.includes('zip') || mime.includes('compressed')) return 'ZIP';
  if (mime.includes('video')) return 'MP4';
  if (mime.includes('jpeg')) return 'JPG';
  if (mime.includes('image')) return 'PNG';
  return 'PDF';
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

function formatUpdated(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' });
}

function throwIf(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function visibleTo(scope: DocScope): 'publico' | 'empresa' | 'staff' {
  if (scope === 'Público') return 'publico';
  if (scope === 'Interno') return 'staff';
  return 'empresa';
}

function mapResource(row: ResourceRow): CatalogDoc {
  const eventLink = one(row.event_resources);
  const event = one(eventLink?.events);
  const company = one(row.companies);
  const category: DocCategory = row.company_id ? 'empresa' : eventLink ? 'evento' : 'global';
  return {
    id: row.id,
    source: 'resource',
    name: row.name,
    category,
    type: asType(row.file_type || row.name),
    size: formatFileSize(row.file_size_bytes),
    sizeBytes: row.file_size_bytes,
    scope: ACCESS_TO_SCOPE[row.access_level] ?? (row.is_public ? 'Público' : 'Interno'),
    updated: formatUpdated(row.updated_at),
    updatedAt: row.updated_at,
    eventId: eventLink?.event_id ?? null,
    event: event?.name ?? null,
    companyId: row.company_id,
    company: company?.trade_name ?? null,
    description: row.description ?? '',
    url: row.file_url ?? '',
    storagePath: row.storage_path,
  };
}

function mapCompanyDoc(row: CompanyDocRow): CatalogDoc {
  const company = one(row.companies);
  return {
    id: row.id,
    source: 'company',
    name: row.name || 'Documento de empresa',
    category: 'empresa',
    type: asType(row.name),
    size: row.size_label || '—',
    sizeBytes: null,
    scope: 'Privado',
    updated: formatUpdated(row.date),
    updatedAt: row.date,
    eventId: null,
    event: null,
    companyId: row.company_id,
    company: company?.trade_name ?? null,
    description: row.kind ? `Documento de empresa · ${row.kind}` : 'Documento de empresa',
    url: '',
    storagePath: row.file_path,
  };
}

const RESOURCE_SELECT = `
  id, name, resource_type, description, file_url, storage_path, file_type, file_size_bytes,
  access_level, company_id, is_public, updated_at,
  companies:company_id(trade_name),
  event_resources(event_id, visible_to, events:event_id(name))
`.replace(/\s+/g, ' ').trim();

export async function listCatalogDocuments(): Promise<CatalogDoc[]> {
  const [{ data: resourceRows, error: resourceError }, { data: companyRows, error: companyError }] = await Promise.all([
    supabase.from('resources').select(RESOURCE_SELECT).eq('is_active', true).order('updated_at', { ascending: false }),
    supabase
      .from('company_documents')
      .select('id, name, kind, date, size_label, file_path, company_id, companies:company_id(trade_name)')
      .order('date', { ascending: false }),
  ]);
  throwIf(resourceError);
  throwIf(companyError);
  const resources = (resourceRows as ResourceRow[] | null)?.map(mapResource) ?? [];
  const companyDocs = (companyRows as CompanyDocRow[] | null)?.map(mapCompanyDoc) ?? [];
  return [...resources, ...companyDocs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function syncEventLink(resourceId: string, eventId: string | null, scope: DocScope) {
  const { error: delError } = await supabase.from('event_resources').delete().eq('resource_id', resourceId);
  throwIf(delError);
  if (!eventId) return;
  const { error } = await supabase.from('event_resources').insert({
    event_id: eventId,
    resource_id: resourceId,
    visible_to: visibleTo(scope),
  });
  throwIf(error);
}

function payloadFrom(input: ResourceWrite) {
  return {
    name: input.name.trim(),
    resource_type: 'recurso',
    description: input.description.trim() || null,
    file_url: input.url.trim() || null,
    storage_path: input.storagePath,
    file_type: input.type,
    file_size_bytes: input.sizeBytes,
    access_level: SCOPE_TO_ACCESS[input.scope],
    company_id: input.category === 'empresa' ? input.companyId : null,
    is_public: input.scope === 'Público',
    is_active: true,
  };
}

export async function createCatalogResource(input: ResourceWrite): Promise<void> {
  const { data, error } = await supabase.from('resources').insert(payloadFrom(input)).select('id').single();
  throwIf(error);
  const eventId = input.category === 'global' ? null : input.eventId;
  await syncEventLink(data!.id, eventId, input.scope);
}

export async function updateCatalogResource(id: string, input: ResourceWrite): Promise<void> {
  const { error } = await supabase.from('resources').update(payloadFrom(input)).eq('id', id);
  throwIf(error);
  const eventId = input.category === 'global' ? null : input.eventId;
  await syncEventLink(id, eventId, input.scope);
}

export async function duplicateCatalogResource(doc: CatalogDoc): Promise<void> {
  if (doc.source !== 'resource') throw new Error('Solo se pueden duplicar recursos del catálogo.');
  await createCatalogResource({
    name: `${doc.name} (copia)`,
    description: doc.description,
    category: doc.category,
    type: doc.type,
    scope: doc.scope,
    eventId: doc.eventId,
    companyId: doc.companyId,
    url: doc.url,
    storagePath: doc.storagePath,
    sizeBytes: doc.sizeBytes,
  });
}

export async function deleteCatalogDocument(doc: CatalogDoc): Promise<void> {
  if (doc.source === 'company') {
    const { error } = await supabase.from('company_documents').delete().eq('id', doc.id);
    throwIf(error);
    return;
  }
  const { error } = await supabase.from('resources').delete().eq('id', doc.id);
  throwIf(error);
}

export async function uploadCatalogFile(file: File, scope: DocScope): Promise<{
  url: string;
  storagePath: string | null;
  type: DocType;
  sizeBytes: number;
}> {
  const type = fileTypeFromName(file.name, file.type);
  if (scope === 'Público') {
    const { url, error } = await uploadPublicAsset(file);
    if (error || !url) throw new Error(error ?? 'No se pudo subir el archivo.');
    return { url, storagePath: null, type, sizeBytes: file.size };
  }
  const { path, error } = await uploadNovoResource(file);
  if (error || !path) throw new Error(error ?? 'No se pudo subir el archivo.');
  return { url: '', storagePath: path, type, sizeBytes: file.size };
}

export async function openCatalogDocument(doc: CatalogDoc): Promise<void> {
  if (doc.url) {
    window.open(doc.url, '_blank', 'noopener');
    return;
  }
  if (!doc.storagePath) throw new Error('Este documento no tiene archivo.');
  const signed = await getCompanyFileUrl(doc.storagePath);
  if (!signed) throw new Error('No se pudo generar el enlace de descarga.');
  window.open(signed, '_blank', 'noopener');
}
