import React from 'react';
import { DownloadIcon, FileTextIcon, UploadCloudIcon } from 'lucide-react';
import { ModuleHeader, Panel } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { companyDocuments, getCompany, portalCompanyId } from '../../data/companies';
import { StatusBadge, type BadgeTone } from '../../components/ui/StatusBadge';
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
export function PortalDocuments() {
  const {
    session,
    activeEditionId
  } = usePlatform();
  const companyId = session?.companyId ?? portalCompanyId;
  const company = getCompany(companyId);
  const documents = companyDocuments.filter((document) => document.companyId === companyId && document.editionId === activeEditionId);
  return <>
      <ModuleHeader eyebrow="Portal" title="Documentos y activos de marca" description="Tu repositorio contractual y los archivos que usamos para publicar tu marca." />

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel emphasis title="Documentos" description="Propuestas, contratos, órdenes y facturas.">
          <ul className="divide-y divide-line">
            {documents.map((document) => <li key={document.id} className="flex items-center gap-3 px-5 py-3.5">
                <FileTextIcon size={17} className="shrink-0 text-ink-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand">{document.name}</p>
                  <p className="text-xs capitalize text-ink-muted">
                    {document.kind} · {document.date} · {document.sizeLabel}
                  </p>
                </div>
                <StatusBadge label={document.status} tone={documentTone[document.status] ?? 'info'} />
                <button type="button" aria-label={`Descargar ${document.name}`} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-canvas hover:text-brand">
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

        <Panel title="Activos de marca" description="De aquí salen los logos del banner de patrocinadores." actions={<button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
              <UploadCloudIcon size={14} /> Cargar archivo
            </button>}>
          <ul className="divide-y divide-line">
            {(company?.brandAssets ?? []).map((asset) => <li key={asset.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand">
                    {assetLabels[asset.kind] ?? asset.kind}
                  </p>
                  <p className="truncate text-xs text-ink-muted">
                    {asset.name} · {asset.updatedAt}
                  </p>
                </div>
                <StatusBadge label={asset.status} tone={assetTone[asset.status] ?? 'info'} />
              </li>)}
          </ul>
          <p className="border-t border-line bg-canvas px-5 py-3 text-xs text-ink-muted">
            Si falta el logo vectorial, tu marca no puede publicarse en la cinta y el sistema crea un
            requerimiento automáticamente.
          </p>
        </Panel>
      </div>
    </>;
}