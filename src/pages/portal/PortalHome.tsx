import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon, EyeIcon, MousePointerClickIcon } from 'lucide-react';
import { ModuleHeader, Panel } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { activityLog, companyDocuments, companyPayments, getCompany, openRequirements, participationsByCompany, portalCompanyId } from '../../data/companies';
import { getEdition } from '../../data/editions';
import { formatCop, formatNumber } from '../../utils/format';
import { participationStatusMeta, requirementStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { EASE_EMPHASIS } from '../../utils/motion';
export function PortalHome() {
  const {
    session,
    activeEditionId,
    banner
  } = usePlatform();
  const companyId = session?.companyId ?? portalCompanyId;
  const company = getCompany(companyId);
  const edition = getEdition(activeEditionId);
  const participation = participationsByCompany(companyId).find((item) => item.editionId === activeEditionId);
  const pending = openRequirements(companyId);
  const payments = companyPayments.filter((payment) => payment.companyId === companyId && payment.status !== 'pagado');
  const documents = companyDocuments.filter((document) => document.companyId === companyId && document.status !== 'aprobado');
  const slot = banner.slots.find((item) => item.companyId === companyId);
  const activity = activityLog.filter((entry) => entry.companyId === companyId).slice(0, 5);
  if (!company || !participation) {
    return <Panel title="Sin participación activa">
        <p className="px-5 py-10 text-center text-sm text-ink-muted">
          Esta empresa no tiene participación registrada en la edición seleccionada.
        </p>
      </Panel>;
  }
  const balance = (participation.agreedAmount ?? 0) - participation.paidAmount;
  const meta = participationStatusMeta[participation.status];
  return <>
      <ModuleHeader eyebrow={edition ? `${edition.name} · ${edition.year}` : 'Portal'} title={company.tradeName} description="Qué tienes, qué debes, qué falta, qué debes enviar y qué viene ahora." actions={<StatusBadge label={meta.label} tone={meta.tone} dot />} />

      {/* Panel principal */}
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel emphasis title="Tu participación" description={participation.packageName}>
          <div className="px-5 py-5">
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-3">
              {[{
              label: 'Stand asignado',
              value: participation.standId ? participation.standId.replace('st-', 'N.º ') : '—'
            }, {
              label: 'Entradas incluidas',
              value: String(participation.includedTickets)
            }, {
              label: 'Nivel en el banner',
              value: participation.bannerTier ?? '—'
            }].map((row) => <div key={row.label}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    {row.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold capitalize text-brand">{row.value}</p>
                </div>)}
            </div>

            <div className="mt-7 border-t border-line pt-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    Saldo pendiente
                  </p>
                  <p className="mt-1 text-3xl font-bold text-brand">{formatCop(balance)}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    Pagado {formatCop(participation.paidAmount)} de{' '}
                    {formatCop(participation.agreedAmount)}
                  </p>
                </div>
                <Link to="/portal/pagos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  Ver pagos <ArrowRightIcon size={15} />
                </Link>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-brand-soft">
                <motion.div className="h-full rounded-full bg-accent" initial={{
                scaleX: 0
              }} animate={{
                scaleX: participation.agreedAmount ? participation.paidAmount / participation.agreedAmount : 0
              }} style={{
                transformOrigin: 'left'
              }} transition={{
                duration: 0.3,
                ease: EASE_EMPHASIS
              }} />
              </div>
            </div>

            {participation.activations.length > 0 ? <ul className="mt-6 flex flex-wrap gap-2">
                {participation.activations.map((activation) => <li key={activation} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink">
                    {activation}
                  </li>)}
              </ul> : null}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Lo que falta de tu lado" description={`${pending.length} requerimientos abiertos`} actions={<Link to="/portal/requerimientos" className="text-xs font-semibold text-brand-support">
                Resolver
              </Link>}>
            <ul className="divide-y divide-line">
              {pending.length === 0 ? <li className="px-5 py-5 text-sm text-ink-muted">Todo al día. Nada pendiente.</li> : pending.map((item) => <li key={item.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand">{item.title}</p>
                      <p className="text-xs text-ink-muted">Vence {item.dueDate}</p>
                    </div>
                    <StatusBadge label={requirementStatusMeta[item.status].label} tone={requirementStatusMeta[item.status].tone} />
                  </li>)}
            </ul>
          </Panel>

          {slot ? <Panel title="Tu marca en el banner" description="Exposición acumulada de tu logo.">
              <dl className="divide-y divide-line">
                <div className="flex items-center justify-between gap-4 px-5 py-3">
                  <dt className="flex items-center gap-2 text-sm text-ink-muted">
                    <EyeIcon size={15} /> Impresiones
                  </dt>
                  <dd className="text-sm font-semibold text-brand">
                    {formatNumber(slot.impressions)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-5 py-3">
                  <dt className="flex items-center gap-2 text-sm text-ink-muted">
                    <MousePointerClickIcon size={15} /> Clics
                  </dt>
                  <dd className="text-sm font-semibold text-brand">{formatNumber(slot.clicks)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-5 py-3">
                  <dt className="text-sm text-ink-muted">Estado</dt>
                  <dd>
                    <StatusBadge label={slot.active ? 'Visible' : 'No visible'} tone={slot.active ? 'success' : 'warning'} />
                  </dd>
                </div>
              </dl>
            </Panel> : null}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Panel title="Próximos vencimientos">
          <ul className="divide-y divide-line">
            {payments.length === 0 ? <li className="px-5 py-4 text-sm text-ink-muted">Sin pagos pendientes.</li> : payments.map((payment) => <li key={payment.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand">{payment.concept}</p>
                    <p className="text-xs text-ink-muted">Vence {payment.dueDate}</p>
                  </div>
                  <span className="text-sm font-semibold text-brand">
                    {formatCop(payment.amount)}
                  </span>
                </li>)}
          </ul>
        </Panel>

        <Panel title="Documentos por resolver">
          <ul className="divide-y divide-line">
            {documents.length === 0 ? <li className="px-5 py-4 text-sm text-ink-muted">Todos los documentos están aprobados.</li> : documents.map((document) => <li key={document.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-brand">
                    {document.name}
                  </span>
                  <StatusBadge label={document.status} tone="warning" />
                </li>)}
          </ul>
        </Panel>

        <Panel title="Últimas actividades">
          <ul className="divide-y divide-line">
            {activity.map((entry) => <li key={entry.id} className="px-5 py-3">
                <p className="text-sm font-medium text-brand">{entry.action}</p>
                <p className="text-xs text-ink-muted">
                  {entry.date} · {entry.actor}
                </p>
              </li>)}
          </ul>
        </Panel>
      </div>
    </>;
}