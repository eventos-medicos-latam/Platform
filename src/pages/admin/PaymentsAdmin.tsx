import React from 'react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { companyPayments, getCompany } from '../../data/companies';
import { registrationsByEdition } from '../../data/registrations';
import { formatCompactCop, formatCop } from '../../utils/format';
import { paymentStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
export function PaymentsAdmin() {
  const {
    activeEditionId
  } = usePlatform();
  const payments = companyPayments.filter((payment) => payment.editionId === activeEditionId);
  const registrations = registrationsByEdition(activeEditionId);
  const paid = payments.filter((p) => p.status === 'pagado').reduce((t, p) => t + p.amount, 0);
  const pending = payments.filter((p) => p.status === 'pendiente').reduce((t, p) => t + p.amount, 0);
  const overdue = payments.filter((p) => p.status === 'vencido').reduce((t, p) => t + p.amount, 0);
  return <>
      <ModuleHeader eyebrow="Comercial" title="Pagos" description="Cobros de patrocinio y estado de las transacciones de tickets en Wompi." />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel emphasis title="Cobros de patrocinio">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-canvas">
                <tr>
                  <th className={thClass}>Empresa</th>
                  <th className={thClass}>Concepto</th>
                  <th className={thClass}>Valor</th>
                  <th className={thClass}>Vence</th>
                  <th className={thClass}>Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map((payment) => <tr key={payment.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-medium text-brand`}>
                      {getCompany(payment.companyId)?.tradeName ?? payment.companyId}
                    </td>
                    <td className={tdClass}>{payment.concept}</td>
                    <td className={tdClass}>{formatCop(payment.amount)}</td>
                    <td className={tdClass}>{payment.dueDate}</td>
                    <td className={tdClass}>
                      <StatusBadge label={payment.status} tone={payment.status === 'pagado' ? 'success' : payment.status === 'vencido' ? 'danger' : 'warning'} />
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Estado de cartera">
            <dl className="divide-y divide-line">
              {[{
              label: 'Recaudado',
              value: formatCompactCop(paid)
            }, {
              label: 'Por cobrar',
              value: formatCompactCop(pending)
            }, {
              label: 'Vencido',
              value: formatCompactCop(overdue)
            }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-3">
                  <dt className="text-sm text-ink-muted">{row.label}</dt>
                  <dd className="text-sm font-semibold text-brand">{row.value}</dd>
                </div>)}
            </dl>
          </Panel>

          <Panel title="Transacciones de tickets" description="Estados devueltos por Wompi.">
            <dl className="divide-y divide-line">
              {Object.entries(paymentStatusMeta).map(([status, meta]) => <div key={status} className="flex items-center justify-between gap-4 px-5 py-2.5">
                  <dt>
                    <StatusBadge label={meta.label} tone={meta.tone} />
                  </dt>
                  <dd className="text-sm font-semibold text-brand">
                    {registrations.filter((item) => item.paymentStatus === status).length}
                  </dd>
                </div>)}
            </dl>
          </Panel>
        </div>
      </div>
    </>;
}