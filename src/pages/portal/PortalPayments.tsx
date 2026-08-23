import React from 'react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { activityLog, companyPayments, participationsByCompany, portalCompanyId } from '../../data/companies';
import { formatCop } from '../../utils/format';
import { StatusBadge } from '../../components/ui/StatusBadge';
export function PortalPayments() {
  const {
    session,
    activeEditionId
  } = usePlatform();
  const companyId = session?.companyId ?? portalCompanyId;
  const payments = companyPayments.filter((payment) => payment.companyId === companyId);
  const activity = activityLog.filter((entry) => entry.companyId === companyId);
  const participation = participationsByCompany(companyId).find((item) => item.editionId === activeEditionId);
  const next = payments.find((payment) => payment.status !== 'pagado');
  return <>
      <ModuleHeader eyebrow="Portal" title="Pagos y actividad" description="Consulta el estado de tus pagos y el historial completo de tu participación." />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Panel emphasis title="Estado de cuenta">
            <dl className="grid gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-3">
              {[{
              label: 'Valor acordado',
              value: formatCop(participation?.agreedAmount ?? null)
            }, {
              label: 'Pagado',
              value: formatCop(participation?.paidAmount ?? 0)
            }, {
              label: 'Pendiente',
              value: formatCop((participation?.agreedAmount ?? 0) - (participation?.paidAmount ?? 0))
            }].map((row) => <div key={row.label}>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    {row.label}
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-brand">{row.value}</dd>
                </div>)}
            </dl>
            {next ? <p className="border-t border-line bg-canvas px-5 py-3 text-sm text-ink">
                Próximo vencimiento: <strong>{next.concept}</strong> por {formatCop(next.amount)} el{' '}
                {next.dueDate}.
              </p> : null}
          </Panel>

          <Panel title="Historial de pagos" description="Modo consulta: los pagos se registran por el equipo.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead className="bg-canvas">
                  <tr>
                    <th className={thClass}>Concepto</th>
                    <th className={thClass}>Valor</th>
                    <th className={thClass}>Vence</th>
                    <th className={thClass}>Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {payments.map((payment) => <tr key={payment.id}>
                      <td className={`${tdClass} font-medium text-brand`}>{payment.concept}</td>
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
        </div>

        <Panel title="Actividad" description="Fecha, responsable, acción y comentario.">
          <ul className="divide-y divide-line">
            {activity.map((entry) => <li key={entry.id} className="px-5 py-3.5">
                <p className="text-sm font-semibold text-brand">{entry.action}</p>
                <p className="text-xs text-ink-muted">
                  {entry.date} · {entry.actor}
                </p>
                <p className="mt-1 text-sm text-ink">{entry.comment}</p>
              </li>)}
          </ul>
        </Panel>
      </div>
    </>;
}