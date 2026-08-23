import React from 'react';
import { ModuleHeader, Panel } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { standsByEdition } from '../../data/sponsors';
import { getCompany } from '../../data/companies';
import { standStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import type { StandStatus } from '../../types/commerce';
const statusStyles: Record<StandStatus, string> = {
  disponible: 'border-emerald-200 bg-emerald-50',
  reservado: 'border-amber-200 bg-amber-50',
  vendido: 'border-brand/30 bg-brand-soft',
  bloqueado: 'border-line bg-canvas',
  'no-disponible': 'border-rose-200 bg-rose-50'
};
export function StandsAdmin() {
  const {
    activeEditionId
  } = usePlatform();
  const stands = standsByEdition(activeEditionId);
  const counts = (Object.keys(statusStyles) as StandStatus[]).map((status) => ({
    status,
    total: stands.filter((stand) => stand.status === status).length
  }));
  return <>
      <ModuleHeader eyebrow="Comercial" title="Mapa de stands" description="Zona comercial de la edición activa. Medidas y precios quedan PENDIENTE hasta que logística cierre el plano." />

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel emphasis title="Plano" description="Cada bloque es un stand con su estado actual.">
          <ul className="grid grid-cols-2 gap-3 px-5 py-5 sm:grid-cols-3 lg:grid-cols-4">
            {stands.map((stand) => {
            const meta = standStatusMeta[stand.status];
            const company = stand.companyId ? getCompany(stand.companyId) : undefined;
            return <li key={stand.id} className={`rounded-xl border p-4 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5 ${statusStyles[stand.status]}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-lg font-bold tabular-nums text-brand">{stand.number}</span>
                    <StatusBadge label={meta.label} tone={meta.tone} />
                  </div>
                  <p className="mt-2 text-xs font-medium text-ink">{stand.category}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{stand.location}</p>
                  <p className="mt-2 truncate text-xs font-semibold text-brand">
                    {company?.tradeName ?? '—'}
                  </p>
                </li>;
          })}
          </ul>
        </Panel>

        <Panel title="Disponibilidad" description="Resumen por estado.">
          <dl className="divide-y divide-line">
            {counts.map((entry) => <div key={entry.status} className="flex items-center justify-between gap-4 px-5 py-3">
                <dt className="flex items-center gap-2 text-sm text-ink-muted">
                  <span className={`h-3 w-3 rounded border ${statusStyles[entry.status]}`} aria-hidden="true" />
                  {standStatusMeta[entry.status].label}
                </dt>
                <dd className="text-sm font-semibold text-brand">{entry.total}</dd>
              </div>)}
            <div className="flex items-center justify-between gap-4 px-5 py-3">
              <dt className="text-sm font-semibold text-brand">Total</dt>
              <dd className="text-sm font-semibold text-brand">{stands.length}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </>;
}