import React, { useEffect, useState } from 'react';
import { DownloadIcon, FileTextIcon, UploadCloudIcon } from 'lucide-react';
import { ModuleHeader, Panel } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { StatusBadge, type BadgeTone } from '../../components/ui/StatusBadge';
import { supabase } from '../../lib/supabaseClient';
import { getCompanyFileUrl, uploadCompanyFile } from '../../lib/storage';
import { AdminModal, modalFieldClass, ModalField } from '../../components/admin/AdminModal';

const documentTone: Record<string, BadgeTone> = {
  pendiente: 'warning',
  enviado: 'info',
  'firma-solicitada': 'warning',
  firmado: 'success',
  aprobado: 'success'
};
const assetTone: Record<string, BadgeTone> = {
  pendiente: 'warning',
  cargado: 'info',
  aprobado: 'success',
  'requiere-cambios': 'danger'
};
const assetLabels: Record<string, string> = {
  'logo-png': 'Logo PNG',
  'logo-svg': 'Logo SVG',
  manual: 'Manual de marca',
  fotografia: 'Fotografías',
  video: 'Videos',
  producto: 'Productos',
  publicidad: 'Material publicitario'
};
const documentKinds = ['propuesta', 'contrato', 'orden', 'certificado', 'factura', 'fiscal', 'manual', 'acuerdo', 'otro'];
const assetKinds = Object.keys(assetLabels);

interface CompanyDocument { id: string; kind: string; name: string; status: string; date: string; size_label: string | null; file_path: string | null; }
interface BrandAsset { id: string; kind: string; name: string; status: string; updated_at: string; file_path: string | null; }

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PortalDocuments() {
  const { session, activeEditionId } = usePlatform();
  const companyId = session?.companyId;
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [assets, setAssets] = useState<BrandAsset[]>([]);

  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docKind, setDocKind] = useState('propuesta');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetKind, setAssetKind] = useState('logo-svg');
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!companyId) return;
    const [{ data: docRows }, { data: assetRows }] = await Promise.all([
      supabase.from('company_documents').select('id, kind, name, status, date, size_label, file_path').eq('company_id', companyId).eq('edition_id', activeEditionId).order('date', { ascending: false }),
      supabase.from('brand_assets').select('id, kind, name, status, updated_at, file_path').eq('company_id', companyId).order('updated_at', { ascending: false })
    ]);
    setDocuments(docRows ?? []);
    setAssets(assetRows ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, activeEditionId]);

  const download = async (path: string | null) => {
    if (!path) return;
    const url = await getCompanyFileUrl(path);
    if (url) window.open(url, '_blank', 'noopener');
  };

  const submitDoc = async () => {
    if (!companyId || !docFile) { setError('Selecciona un archivo.'); return; }
    setSaving(true);
    setError(null);
    const { path, error: uploadError } = await uploadCompanyFile(companyId, 'documents', docFile);
    if (uploadError || !path) { setSaving(false); setError(uploadError ?? 'No se pudo subir el archivo.'); return; }
    const { error: insertError } = await supabase.from('company_documents').insert({
      company_id: companyId, edition_id: activeEditionId, kind: docKind, name: docFile.name,
      status: 'enviado', date: new Date().toISOString(), size_label: formatSize(docFile.size), file_path: path
    });
    setSaving(false);
    if (insertError) { setError(insertError.message); return; }
    setDocModalOpen(false);
    setDocFile(null);
    load();
  };

  const submitAsset = async () => {
    if (!companyId || !assetFile) { setError('Selecciona un archivo.'); return; }
    setSaving(true);
    setError(null);
    const { path, error: uploadError } = await uploadCompanyFile(companyId, 'brand-assets', assetFile);
    if (uploadError || !path) { setSaving(false); setError(uploadError ?? 'No se pudo subir el archivo.'); return; }
    const { error: insertError } = await supabase.from('brand_assets').insert({
      company_id: companyId, kind: assetKind, name: assetFile.name, status: 'cargado', file_path: path
    });
    setSaving(false);
    if (insertError) { setError(insertError.message); return; }
    setAssetModalOpen(false);
    setAssetFile(null);
    load();
  };

  if (!companyId) {
    return <ModuleHeader eyebrow="Portal" title="Documentos y activos de marca" description="Tu usuario todavía no está vinculado a una empresa. Contacta al equipo organizador." />;
  }

  return <>
      <ModuleHeader eyebrow="Portal" title="Documentos y activos de marca" description="Tu repositorio contractual y los archivos que usamos para publicar tu marca." />

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel emphasis title="Documentos" description="Propuestas, contratos, órdenes y facturas." actions={<button type="button" onClick={() => { setError(null); setDocModalOpen(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
              <UploadCloudIcon size={14} /> Subir documento
            </button>}>
          <ul className="divide-y divide-line">
            {documents.map((document) => <li key={document.id} className="flex items-center gap-3 px-5 py-3.5">
                <FileTextIcon size={17} className="shrink-0 text-ink-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand">{document.name}</p>
                  <p className="text-xs capitalize text-ink-muted">
                    {document.kind} · {new Date(document.date).toLocaleDateString('es-CO')} · {document.size_label}
                  </p>
                </div>
                <StatusBadge label={document.status} tone={documentTone[document.status] ?? 'info'} />
                <button type="button" disabled={!document.file_path} aria-label={`Descargar ${document.name}`} onClick={() => download(document.file_path)} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-canvas hover:text-brand disabled:cursor-not-allowed disabled:opacity-30">
                  <DownloadIcon size={16} />
                </button>
              </li>)}
            {documents.length === 0 ? <li className="px-5 py-8 text-center text-sm text-ink-muted">
                Aún no hay documentos cargados para esta edición.
              </li> : null}
          </ul>
          <p className="border-t border-line bg-canvas px-5 py-3 text-xs text-ink-muted">
            La firma electrónica queda en estado <strong>solicitada</strong>: la tecnología de firma se
            define más adelante.
          </p>
        </Panel>

        <Panel title="Activos de marca" description="De aquí salen los logos del banner de patrocinadores." actions={<button type="button" onClick={() => { setError(null); setAssetModalOpen(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
              <UploadCloudIcon size={14} /> Cargar archivo
            </button>}>
          <ul className="divide-y divide-line">
            {assets.map((asset) => <li key={asset.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand">
                    {assetLabels[asset.kind] ?? asset.kind}
                  </p>
                  <p className="truncate text-xs text-ink-muted">
                    {asset.name} · {new Date(asset.updated_at).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <StatusBadge label={asset.status} tone={assetTone[asset.status] ?? 'info'} />
                <button type="button" disabled={!asset.file_path} aria-label={`Descargar ${asset.name}`} onClick={() => download(asset.file_path)} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-canvas hover:text-brand disabled:cursor-not-allowed disabled:opacity-30">
                  <DownloadIcon size={16} />
                </button>
              </li>)}
            {assets.length === 0 ? <li className="px-5 py-8 text-center text-sm text-ink-muted">Aún no hay activos de marca cargados.</li> : null}
          </ul>
          <p className="border-t border-line bg-canvas px-5 py-3 text-xs text-ink-muted">
            Si falta el logo vectorial, tu marca no puede publicarse en la cinta y el sistema crea un
            requerimiento automáticamente.
          </p>
        </Panel>
      </div>

      <AdminModal open={docModalOpen} onClose={() => setDocModalOpen(false)} title="Subir documento" onSubmit={submitDoc} submitting={saving} error={error} submitLabel="Subir">
        <div className="space-y-4">
          <ModalField label="Tipo de documento">
            <select className={modalFieldClass} value={docKind} onChange={(event) => setDocKind(event.target.value)}>
              {documentKinds.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </ModalField>
          <ModalField label="Archivo">
            <input type="file" className={modalFieldClass} onChange={(event) => setDocFile(event.target.files?.[0] ?? null)} />
          </ModalField>
        </div>
      </AdminModal>

      <AdminModal open={assetModalOpen} onClose={() => setAssetModalOpen(false)} title="Cargar activo de marca" onSubmit={submitAsset} submitting={saving} error={error} submitLabel="Subir">
        <div className="space-y-4">
          <ModalField label="Tipo de activo">
            <select className={modalFieldClass} value={assetKind} onChange={(event) => setAssetKind(event.target.value)}>
              {assetKinds.map((option) => <option key={option} value={option}>{assetLabels[option]}</option>)}
            </select>
          </ModalField>
          <ModalField label="Archivo">
            <input type="file" className={modalFieldClass} onChange={(event) => setAssetFile(event.target.files?.[0] ?? null)} />
          </ModalField>
        </div>
      </AdminModal>
    </>;
}
