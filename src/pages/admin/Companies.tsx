import React, { useState } from 'react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { Drawer } from '../../components/ui/Drawer';
import { usePlatform } from '../../contexts/PlatformContext';
import { activityLog, companyDocuments, companyPayments, getCompany, participationsByEdition, requirementsByCompany } from '../../data/companies';
import { participationStatusMeta, requirementStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { formatCompactCop, formatCop } from '../../utils/format';
import { Pending } from '../../components/ui/Pending';
export function Companies() {
  const {
    activeEditionId
  } = usePlatform();
  const participations = participationsByEdition(activeEditionId);
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = participations.find((item) => item.id === openId);
  const company = selected ? getCompany(selected.companyId) : undefined;
  return <>
      <ModuleHeader eyebrow="Comercial" title="Empresas y participaciones" description="Una empresa, muchas participaciones. Los valores acordados no se publican en la web." />

      <Panel emphasis title={`${participations.length} participaciones en esta edición`} description="Selecciona una fila para ver el detalle completo.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-canvas">
              <tr>
                <th className={thClass}>Empresa</th>
                <th className={thClass}>Paquete</th>
                <th className={thClass}>Rol</th>
                <th className={thClass}>Stand</th>
                <th className={thClass}>Acordado</th>
                <th className={thClass}>Pagado</th>
                <th className={thClass}>Estado</th>
                <th className={thClass}>Banner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {participations.map((participation) => {
              const item = getCompany(participation.companyId);
              const meta = participationStatusMeta[participation.status];
              return <tr key={participation.id} onClick={() => setOpenId(participation.id)} className="cursor-pointer transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-medium text-brand`}>{item?.tradeName}</td>
                    <td className={tdClass}>{participation.packageName}</td>
                    <td className={`${tdClass} capitalize`}>{participation.roles[0]}</td>
                    <td className={tdClass}>
                      {participation.standId ? participation.standId.replace('st-', '') : '—'}
                    </td>
                    <td className={tdClass}>{formatCompactCop(participation.agreedAmount)}</td>
                    <td className={tdClass}>{formatCompactCop(participation.paidAmount)}</td>
                    <td className={tdClass}>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </td>
                    <td className={tdClass}>
                      {participation.bannerTier ? <span className="capitalize">{participation.bannerTier}</span> : '—'}
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Drawer open={Boolean(selected)} onClose={() => setOpenId(null)} title={company?.tradeName ?? ''} subtitle={selected?.packageName}>
        {selected && company ? <div className="space-y-7">
            <section>
              <h3 className="text-sm font-semibold text-brand">Participación</h3>
              <dl className="mt-3 divide-y divide-line rounded-lg border border-line">
                {[{
              label: 'Estado',
              value: participationStatusMeta[selected.status].label
            }, {
              label: 'Valor acordado',
              value: formatCop(selected.agreedAmount)
            }, {
              label: 'Pagado',
              value: formatCop(selected.paidAmount)
            }, {
              label: 'Saldo',
              value: formatCop((selected.agreedAmount ?? 0) - selected.paidAmount)
            }, {
              label: 'Entradas incluidas',
              value: String(selected.includedTickets)
            }, {
              label: 'Nivel en banner',
              value: selected.bannerTier ?? '—'
            }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <dt className="text-sm text-ink-muted">{row.label}</dt>
                    <dd className="text-sm font-medium capitalize text-brand">{row.value}</dd>
                  </div>)}
              </dl>
              {selected.activations.length > 0 ? <ul className="mt-3 flex flex-wrap gap-2">
                  {selected.activations.map((activation) => <li key={activation} className="rounded-full border border-line px-3 py-1 text-xs text-ink">
                      {activation}
                    </li>)}
                </ul> : null}
            </section>

            <section>
              <h3 className="text-sm font-semibold text-brand">Requerimientos</h3>
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
                {requirementsByCompany(company.id).map((requirement) => <li key={requirement.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand">{requirement.title}</p>
                      <p className="text-xs text-ink-muted">Vence: {requirement.dueDate}</p>
                    </div>
                    <StatusBadge label={requirementStatusMeta[requirement.status].label} tone={requirementStatusMeta[requirement.status].tone} />
                  </li>)}
                {requirementsByCompany(company.id).length === 0 ? <li className="px-4 py-3 text-sm text-ink-muted">Sin requerimientos abiertos.</li> : null}
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-brand">Pagos</h3>
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
                {companyPayments.filter((payment) => payment.companyId === company.id).map((payment) => <li key={payment.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-brand">{payment.concept}</p>
                        <p className="text-xs text-ink-muted">Vence: {payment.dueDate}</p>
                      </div>
                      <span className="text-sm font-semibold text-brand">
                        {formatCop(payment.amount)}
                      </span>
                      <StatusBadge label={payment.status} tone={payment.status === 'pagado' ? 'success' : payment.status === 'vencido' ? 'danger' : 'warning'} />
                    </li>)}
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-brand">Documentos</h3>
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
                {companyDocuments.filter((document) => document.companyId === company.id).map((document) => <li key={document.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-brand">{document.name}</p>
                        <p className="text-xs capitalize text-ink-muted">
                          {document.kind} · {document.date} · {document.sizeLabel}
                        </p>
                      </div>
                      <StatusBadge label={document.status} tone="info" />
                    </li>)}
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-brand">Perfil</h3>
              <dl className="mt-3 divide-y divide-line rounded-lg border border-line">
                {[{
              label: 'Razón social',
              value: company.legalName
            }, {
              label: 'NIT',
              value: company.nit
            }, {
              label: 'Ciudad',
              value: `${company.city}, ${company.country}`
            }, {
              label: 'Contacto',
              value: company.contactName
            }, {
              label: 'Correo',
              value: company.contactEmail
            }, {
              label: 'WhatsApp',
              value: company.contactWhatsapp
            }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <dt className="text-sm text-ink-muted">{row.label}</dt>
                    <dd className="text-sm font-medium text-brand">
                      {row.value === 'PENDIENTE' ? <Pending /> : row.value}
                    </dd>
                  </div>)}
              </dl>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-brand">Actividad</h3>
              <ul className="mt-3 space-y-3">
                {activityLog.filter((entry) => entry.companyId === company.id).map((entry) => <li key={entry.id} className="border-l-2 border-line pl-3">
                      <p className="text-sm font-medium text-brand">{entry.action}</p>
                      <p className="text-xs text-ink-muted">
                        {entry.date} · {entry.actor}
                      </p>
                      <p className="mt-0.5 text-sm text-ink">{entry.comment}</p>
                    </li>)}
              </ul>
            </section>
          </div> : null}
      </Drawer>
    </>;
}