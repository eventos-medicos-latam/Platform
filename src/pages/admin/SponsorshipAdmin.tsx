import React, { useState } from 'react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { getEdition } from '../../data/editions';
import { getCompany } from '../../data/companies';
import { bridgeSponsorships, getPlan, participationPlans, planRequests } from '../../data/plans';
import type { PlanRequest } from '../../types/participation';
import { formatCop, formatShortDate } from '../../utils/format';
import { StatusBadge } from '../../components/ui/StatusBadge';
const requestMeta: Record<PlanRequest['status'], {
  label: string;
  tone: 'neutral' | 'info' | 'success' | 'warning';
}> = {
  nueva: {
    label: 'Nueva',
    tone: 'info'
  },
  'en-conversacion': {
    label: 'En conversación',
    tone: 'warning'
  },
  aprobada: {
    label: 'Aprobada',
    tone: 'success'
  },
  descartada: {
    label: 'Descartada',
    tone: 'neutral'
  }
};

/**
 * Comercial. Los tres planes gobiernan el inventario: cupos por plan y
 * exclusividad por puente en Protagonista.
 */
export function SponsorshipAdmin() {
  const {
    activeEditionId
  } = usePlatform();
  const edition = getEdition(activeEditionId);
  const requests = planRequests.filter((item) => item.editionId === activeEditionId);
  const [filter, setFilter] = useState<'todas' | PlanRequest['status']>('todas');
  const visible = filter === 'todas' ? requests : requests.filter((r) => r.status === filter);
  return <>
      <ModuleHeader eyebrow="Comercial" title="Planes de participación" description="Todo nace del plan. El espacio, el puente y el speaker se derivan de él. Los precios sí se publican en la web; los cupos se controlan aquí." />

      <div className="space-y-5">
        <Panel emphasis title="Cupos por plan" description="Disponibilidad publicada en el configurador de la web.">
          <div className="grid gap-px bg-line md:grid-cols-3">
            {participationPlans.map((plan) => {
            const left = plan.totalInventory === null ? null : plan.totalInventory - plan.sold;
            const fill = plan.totalInventory && plan.totalInventory > 0 ? plan.sold / plan.totalInventory : 0;
            return <div key={plan.id} className="bg-white p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                    {plan.verb}
                  </p>
                  <p className="mt-1 text-base font-bold text-brand">{plan.name}</p>
                  <p className="mt-3 text-2xl font-bold tabular-nums text-brand">
                    {formatCop(plan.price)}
                  </p>

                  <div className="mt-4 flex items-baseline justify-between text-sm">
                    <span className="text-ink-muted">Vendidos</span>
                    <span className="font-semibold text-brand">
                      {plan.sold} / {plan.totalInventory ?? '—'}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-soft">
                    <div className="grad-futuro h-full rounded-full" style={{
                  width: `${Math.round(fill * 100)}%`
                }} />
                  </div>
                  <p className="mt-3 text-xs text-ink-muted">
                    {left !== null ? `${left} cupos disponibles · ` : ''}
                    {plan.availabilityNote}
                  </p>

                  <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Espacio</dt>
                      <dd className="font-medium text-brand">
                        {plan.space === 'estacion' ? 'Estación Pop Up' : 'Stand de foyer'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Colaboradores</dt>
                      <dd className="font-medium text-brand">{plan.maxStaff}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Invitados</dt>
                      <dd className="font-medium text-brand">
                        {plan.guestPasses > 0 ? plan.guestPasses : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Speaker</dt>
                      <dd className="font-medium text-brand">
                        {plan.includesSpeaker ? 'Incluido' : 'No incluye'}
                      </dd>
                    </div>
                  </dl>
                </div>;
          })}
          </div>
        </Panel>

        <Panel title="Exclusividad por puente" description="Protagonista: una sola marca por puente. Seis espacios en toda la edición.">
          <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {bridgeSponsorships.map((item) => {
            const track = edition?.trackAxis.tracks.find((t) => t.id === item.trackId);
            const company = item.companyId ? getCompany(item.companyId) : null;
            const tone = item.status === 'confirmado' ? 'success' : item.status === 'reservado' ? 'warning' : 'info';
            return <li key={item.trackId} className="bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-brand">
                      {track?.name ?? item.trackId}
                    </p>
                    <StatusBadge label={item.status === 'disponible' ? 'Disponible' : item.status === 'reservado' ? 'Reservado' : 'Confirmado'} tone={tone} />
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">
                    {company ? company.tradeName : 'Sin marca asignada'}
                  </p>
                </li>;
          })}
          </ul>
        </Panel>

        <Panel title="Solicitudes entrantes" description="Cada envío del configurador crea el perfil de la marca y notifica a comercial." actions={<div className="flex flex-wrap gap-1.5">
              {(['todas', 'nueva', 'en-conversacion', 'aprobada'] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors duration-150 ease-emphasis ${filter === item ? 'bg-brand text-white' : 'border border-line text-ink-muted hover:text-brand'}`}>
                  {item === 'todas' ? 'Todas' : requestMeta[item].label}
                </button>)}
            </div>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-canvas">
                <tr>
                  <th className={thClass}>Marca</th>
                  <th className={thClass}>Plan</th>
                  <th className={thClass}>Espacio</th>
                  <th className={thClass}>Puente</th>
                  <th className={thClass}>Speaker</th>
                  <th className={thClass}>Categoría</th>
                  <th className={thClass}>Recibida</th>
                  <th className={thClass}>Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((request) => {
                const plan = getPlan(request.planId);
                const track = edition?.trackAxis.tracks.find((t) => t.id === request.trackId);
                const meta = requestMeta[request.status];
                return <tr key={request.id} className="transition-colors duration-150 hover:bg-canvas">
                      <td className={`${tdClass} font-medium text-brand`}>
                        {request.company}
                        <span className="mt-0.5 block text-xs font-normal text-ink-muted">
                          {request.contactEmail}
                        </span>
                      </td>
                      <td className={tdClass}>{plan?.name ?? request.planId}</td>
                      <td className={tdClass}>{request.spaceId ?? '—'}</td>
                      <td className={tdClass}>{track?.name ?? '—'}</td>
                      <td className={tdClass}>
                        {request.speakerChoice === 'propio' ? 'Propio' : request.speakerChoice === 'propuesta' ? 'Propuesta' : request.speakerChoice === 'acompanamiento' ? 'Acompañamiento' : '—'}
                      </td>
                      <td className={tdClass}>{request.category}</td>
                      <td className={tdClass}>{formatShortDate(request.createdAt)}</td>
                      <td className={tdClass}>
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </td>
                    </tr>;
              })}
              </tbody>
            </table>
          </div>
          {visible.length === 0 ? <p className="border-t border-line px-5 py-8 text-center text-sm text-ink-muted">
              No hay solicitudes con este estado.
            </p> : <p className="border-t border-line bg-canvas px-5 py-3 text-xs text-ink-muted">
              Al aprobar una solicitud se descuenta el cupo del plan y se habilita el acceso al
              Portal de la marca.
            </p>}
        </Panel>
      </div>
    </>;
}