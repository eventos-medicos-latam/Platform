import React from 'react';
import { ModuleHeader, Panel } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { getCompany, portalCompanyId } from '../../data/companies';
import { Pending } from '../../components/ui/Pending';
const fields = [{
  key: 'tradeName',
  label: 'Nombre comercial'
}, {
  key: 'legalName',
  label: 'Razón social'
}, {
  key: 'nit',
  label: 'NIT'
}, {
  key: 'address',
  label: 'Dirección'
}, {
  key: 'city',
  label: 'Ciudad'
}, {
  key: 'country',
  label: 'País'
}, {
  key: 'web',
  label: 'Sitio web'
}, {
  key: 'instagram',
  label: 'Instagram'
}, {
  key: 'contactName',
  label: 'Contacto principal'
}, {
  key: 'contactEmail',
  label: 'Correo'
}, {
  key: 'contactWhatsapp',
  label: 'WhatsApp'
}] as const;
export function PortalProfile() {
  const {
    session
  } = usePlatform();
  const company = getCompany(session?.companyId ?? portalCompanyId);
  if (!company) return null;
  return <>
      <ModuleHeader eyebrow="Portal" title="Perfil de la empresa" description="Estos datos alimentan contratos, facturación y la ficha pública de tu marca." />

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Panel emphasis title="Datos de la empresa" actions={<button type="button" className="rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
              Guardar cambios
            </button>}>
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            {fields.map((field) => {
            const value = company[field.key];
            return <label key={field.key} className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-muted">{field.label}</span>
                  <input defaultValue={value === 'PENDIENTE' ? '' : String(value)} placeholder={value === 'PENDIENTE' ? 'PENDIENTE' : undefined} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis placeholder:text-amber-700/70 focus:border-brand" />
                </label>;
          })}
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                Descripción comercial
              </span>
              <textarea defaultValue={company.description} className="min-h-[96px] w-full resize-y rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
            </label>
          </div>
        </Panel>

        <Panel title="Estado del perfil">
          <ul className="divide-y divide-line">
            {fields.map((field) => <li key={field.key} className="flex items-center justify-between gap-4 px-5 py-2.5">
                <span className="text-sm text-ink-muted">{field.label}</span>
                {company[field.key] === 'PENDIENTE' ? <Pending /> : <span className="text-sm font-medium text-brand">Completo</span>}
              </li>)}
          </ul>
          <p className="border-t border-line bg-canvas px-5 py-3 text-xs text-ink-muted">
            Los campos marcados como PENDIENTE bloquean la emisión de contratos y facturas.
          </p>
        </Panel>
      </div>
    </>;
}