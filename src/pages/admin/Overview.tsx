import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangleIcon, ArrowUpRightIcon, CreditCardIcon, TicketIcon, UsersIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { getEdition } from '../../data/editions';
import { ticketsByEdition, ticketAvailability } from '../../data/tickets';
import { registrationsByEdition, registrationsByTrack } from '../../data/registrations';
import { participationsByEdition, requirements, activityLog, getCompany } from '../../data/companies';
import { packagesByEdition, standsByEdition } from '../../data/sponsors';
import { formatCompactCop, formatNumber } from '../../utils/format';
import { paymentStatusMeta, requirementStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { TrackIcon } from '../../components/ui/TrackIcon';
import { EASE_EMPHASIS } from '../../utils/motion';
export function Overview() {
  const {
    activeEditionId
  } = usePlatform();
  const edition = getEdition(activeEditionId);
  if (!edition) return null;
  const tickets = ticketsByEdition(edition.id);
  const registrations = registrationsByEdition(edition.id);
  const quota = tickets.reduce((total, ticket) => total + ticket.quota, 0);
  const sold = tickets.reduce((total, ticket) => total + ticket.sold, 0);
  const approved = registrations.filter((item) => item.paymentStatus === 'approved').length;
  const participations = participationsByEdition(edition.id);
  const committed = participations.reduce((total, item) => total + (item.agreedAmount ?? 0), 0);
  const collected = participations.reduce((total, item) => total + item.paidAmount, 0);
  const packages = packagesByEdition(edition.id);
  const inventoryAvailable = packages.reduce((total, pkg) => total + (pkg.totalInventory - pkg.reserved - pkg.sold), 0);
  const standsFree = standsByEdition(edition.id).filter((stand) => stand.status === 'disponible').length;
  const openRequirements = requirements.filter((item) => item.editionId === edition.id && item.status !== 'completado' && item.status !== 'aprobado');
  const byTrack = registrationsByTrack(edition.id);
  const maxTrack = Math.max(...byTrack.map((item) => item.total), 1);
  const progress = quota > 0 ? Math.round(registrations.length / quota * 100) : 0;
  return <>
      <ModuleHeader eyebrow="Resumen" title={`${edition.name} · ${edition.year}`} description="Estado comercial y de audiencia de la edición activa." actions={<Link to="/admin/banner" className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
            Banner de patrocinadores <ArrowUpRightIcon size={13} />
          </Link>} />

      {/* Fila de estadísticas con color */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[{
        label: 'Registros',
        value: `${formatNumber(registrations.length)} de ${formatNumber(quota)}`,
        icon: UsersIcon,
        bg: 'bg-[#e8eef6]',
        fg: 'text-[#1c5f8c]'
      }, {
        label: 'Pagos aprobados',
        value: formatNumber(approved),
        icon: CreditCardIcon,
        bg: 'bg-[#e9f7f0]',
        fg: 'text-[#159a63]'
      }, {
        label: 'Tickets vendidos',
        value: formatNumber(sold),
        icon: TicketIcon,
        bg: 'bg-[#fdeef4]',
        fg: 'text-[#d6338c]'
      }].map((stat) => <div key={stat.label} className="card-lift rounded-2xl border border-line bg-white p-5">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${stat.bg} ${stat.fg}`}>
              <stat.icon size={19} />
            </span>
            <p className="mt-3.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">{stat.label}</p>
            <p className="mt-0.5 text-xl font-extrabold text-brand">{stat.value}</p>
          </div>)}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        {/* Panel principal */}
        <Panel emphasis title="Audiencia frente a cupo" description="Registros acumulados sobre el cupo total configurado en tickets.">
          <div className="px-5 py-6">
            <div className="h-2.5 overflow-hidden rounded-full bg-brand-soft">
              <motion.div className="h-full rounded-full bg-accent" initial={{
              scaleX: 0
            }} animate={{
              scaleX: Math.min(progress, 100) / 100
            }} style={{
              transformOrigin: 'left'
            }} transition={{
              duration: 0.3,
              ease: EASE_EMPHASIS
            }} />
            </div>
            <p className="mt-2 text-xs text-ink-muted">{progress}% del cupo configurado</p>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-brand">Interés por {edition.trackAxis.label}</h3>
              <ul className="mt-4 space-y-2.5">
                {byTrack.map((entry) => {
                const track = edition.trackAxis.tracks.find((item) => item.id === entry.trackId);
                return <li key={entry.trackId} className="flex items-center gap-3">
                      {track ? <TrackIcon icon={track.icon} size={18} className="shrink-0 text-brand" /> : <span className="h-4 w-4 shrink-0 rounded bg-line" aria-hidden="true" />}
                      <span className="w-44 shrink-0 truncate text-sm text-ink">
                        {track?.name ?? 'Sin definir'}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                        <motion.span className="block h-full rounded-full bg-brand-support" initial={{
                      scaleX: 0
                    }} animate={{
                      scaleX: entry.total / maxTrack
                    }} style={{
                      transformOrigin: 'left'
                    }} transition={{
                      duration: 0.28,
                      ease: EASE_EMPHASIS
                    }} />
                      </span>
                      <span className="w-8 text-right text-sm font-semibold tabular-nums text-brand">
                        {entry.total}
                      </span>
                    </li>;
              })}
              </ul>
            </div>
          </div>
        </Panel>

        {/* Columna secundaria */}
        <div className="space-y-5">
          <Panel title="Comercial" description="Valores en borrador: no se publican.">
            <dl className="divide-y divide-line">
              {[{
              label: 'Comprometido',
              value: formatCompactCop(committed)
            }, {
              label: 'Recaudado',
              value: formatCompactCop(collected)
            }, {
              label: 'Por cobrar',
              value: formatCompactCop(committed - collected)
            }, {
              label: 'Cupos de patrocinio libres',
              value: String(inventoryAvailable)
            }, {
              label: 'Stands disponibles',
              value: String(standsFree)
            }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-3">
                  <dt className="text-sm text-ink-muted">{row.label}</dt>
                  <dd className="text-sm font-semibold text-brand">{row.value}</dd>
                </div>)}
            </dl>
          </Panel>

          <Panel title="Pendientes" description={`${openRequirements.length} requerimientos abiertos`} actions={<Link to="/admin/empresas" className="text-xs font-semibold text-brand-support">
                Ver todos
              </Link>}>
            <ul className="divide-y divide-line">
              {openRequirements.slice(0, 4).map((item) => {
              const meta = requirementStatusMeta[item.status];
              return <li key={item.id} className="flex items-start gap-3 px-5 py-3">
                    {item.autoGenerated ? <AlertTriangleIcon size={15} className="mt-0.5 shrink-0 text-amber-600" /> : <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-line" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-brand">{item.title}</p>
                      <p className="text-xs text-ink-muted">{item.owner}</p>
                    </div>
                    <StatusBadge label={meta.label} tone={meta.tone} />
                  </li>;
            })}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Tickets" description="Cupo, vendidos y disponibilidad.">
          <table className="w-full">
            <thead className="bg-canvas">
              <tr>
                <th className={thClass}>Ticket</th>
                <th className={thClass}>Cupo</th>
                <th className={thClass}>Vendidos</th>
                <th className={thClass}>Disponibles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tickets.map((ticket) => <tr key={ticket.id}>
                  <td className={`${tdClass} font-medium text-brand`}>{ticket.name}</td>
                  <td className={tdClass}>{ticket.quota}</td>
                  <td className={tdClass}>{ticket.sold}</td>
                  <td className={tdClass}>{ticketAvailability(ticket)}</td>
                </tr>)}
            </tbody>
          </table>
        </Panel>

        <Panel title="Actividad reciente">
          <ul className="divide-y divide-line">
            {activityLog.slice(0, 6).map((entry) => <li key={entry.id} className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-x-2 text-sm">
                  <span className="font-medium text-brand">{entry.action}</span>
                  <span className="text-ink-muted">·</span>
                  <span className="text-ink-muted">
                    {getCompany(entry.companyId)?.tradeName ?? entry.companyId}
                  </span>
                  <span className="ml-auto text-xs text-ink-muted">{entry.date}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">{entry.comment}</p>
              </li>)}
          </ul>
        </Panel>
      </div>

      <div className="mt-5">
        <Panel title="Registros recientes" description="Estado de pago y sincronización con el CRM.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-canvas">
                <tr>
                  <th className={thClass}>Asistente</th>
                  <th className={thClass}>Ciudad</th>
                  <th className={thClass}>Especialidad</th>
                  <th className={thClass}>Pago</th>
                  <th className={thClass}>QR</th>
                  <th className={thClass}>CRM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {registrations.slice(0, 6).map((registration) => {
                const meta = paymentStatusMeta[registration.paymentStatus];
                return <tr key={registration.id} className="transition-colors duration-150 hover:bg-canvas">
                      <td className={`${tdClass} font-medium text-brand`}>{registration.fullName}</td>
                      <td className={tdClass}>{registration.city}</td>
                      <td className={tdClass}>{registration.specialty}</td>
                      <td className={tdClass}>
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </td>
                      <td className={`${tdClass} font-mono text-xs`}>{registration.qrCode}</td>
                      <td className={tdClass}>
                        {registration.crmSynced ? 'Sincronizado' : 'Pendiente'}
                      </td>
                    </tr>;
              })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>;
}