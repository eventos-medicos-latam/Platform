import React from 'react';
import { CheckIcon } from 'lucide-react';
import { ModuleHeader, Panel } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { getCompany, participationsByCompany, portalCompanyId } from '../../data/companies';
import { getEdition } from '../../data/editions';
import { standsByEdition } from '../../data/sponsors';
import { planFromTier } from '../../data/plans';
import { StatusBadge, participationStatusMeta } from '../../components/ui/StatusBadge';
import { Pending } from '../../components/ui/Pending';
import { TrackIcon } from '../../components/ui/TrackIcon';
export function PortalParticipation() {
  const {
    session,
    activeEditionId,
    banner
  } = usePlatform();
  const companyId = session?.companyId ?? portalCompanyId;
  const company = getCompany(companyId);
  const edition = getEdition(activeEditionId);
  const participation = participationsByCompany(companyId).find((item) => item.editionId === activeEditionId);
  if (!company || !participation || !edition) {
    return <Panel title="Sin participación">
        <p className="px-5 py-10 text-center text-sm text-ink-muted">
          No hay participación registrada en esta edición.
        </p>
      </Panel>;
  }
  const stand = participation.standId ? standsByEdition(edition.id).find((item) => item.id === participation.standId) : undefined;
  const plan = planFromTier(participation.packageTier);
  const track = edition.trackAxis.tracks.find((item) => item.id === participation.trackId);
  const speakerTrack = edition.trackAxis.tracks.find((item) => item.id === participation.sponsoredSpeakerTrackId);
  const slot = banner.slots.find((item) => item.companyId === companyId);
  const meta = participationStatusMeta[participation.status];
  return <>
      <ModuleHeader eyebrow={`${edition.name} · ${edition.year}`} title="Mi participación" description="Todo lo que incluye tu paquete y cómo se está mostrando tu marca." actions={<StatusBadge label={meta.label} tone={meta.tone} dot />} />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel emphasis title={plan.name} description={plan.tagline}>
          <div className="px-5 py-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[{
              label: 'Espacio',
              value: plan.space === 'estacion' ? 'Estación Pop Up' : 'Stand de foyer'
            }, {
              label: 'Colaboradores',
              value: String(plan.maxStaff)
            }, {
              label: 'Invitados',
              value: plan.guestPasses > 0 ? String(plan.guestPasses) : '—'
            }].map((item) => <div key={item.label} className="rounded-lg bg-canvas px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    {item.label}
                  </p>
                  <p className="mt-1 text-base font-bold text-brand">{item.value}</p>
                </div>)}
            </div>

            <h3 className="mt-6 text-sm font-semibold text-brand">Beneficios incluidos</h3>
            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              {plan.benefitGroups.map((group) => <div key={group.title}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
                    {group.title}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {group.items.map((benefit) => <li key={benefit} className="flex gap-2.5 text-sm text-ink">
                        <CheckIcon size={15} className="mt-0.5 shrink-0 text-accent" />
                        {benefit}
                      </li>)}
                  </ul>
                </div>)}
            </div>

            <div className="mt-7 grid gap-x-8 gap-y-5 border-t border-line pt-5 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Entradas incluidas
                </p>
                <p className="mt-1 text-lg font-semibold text-brand">
                  {participation.includedTickets > 0 ? participation.includedTickets : <Pending />}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Área temática
                </p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-brand">
                  {track ? <>
                      <TrackIcon icon={track.icon} size={20} className="text-accent" />
                      {track.name}
                    </> : '—'}
                </p>
              </div>
              {speakerTrack ? <div className="sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    Speaker patrocinado
                  </p>
                  <p className="mt-1 text-lg font-semibold text-brand">
                    Espacio en {speakerTrack.name}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    Nombre del speaker y horario: <Pending />
                  </p>
                </div> : null}
            </div>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Tu stand">
            {stand ? <dl className="divide-y divide-line">
                {[{
              label: 'Número',
              value: stand.number
            }, {
              label: 'Categoría',
              value: stand.category
            }, {
              label: 'Ubicación',
              value: stand.location
            }, {
              label: 'Medidas',
              value: stand.size
            }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-3">
                    <dt className="text-sm text-ink-muted">{row.label}</dt>
                    <dd className="text-sm font-medium text-brand">
                      {row.value === 'PENDIENTE' ? <Pending /> : row.value}
                    </dd>
                  </div>)}
              </dl> : <p className="px-5 py-6 text-sm text-ink-muted">
                Tu paquete no incluye stand en esta edición.
              </p>}
          </Panel>

          <Panel title="Tu logo en el banner" description="Cómo y dónde se está mostrando.">
            {slot ? <dl className="divide-y divide-line">
                {[{
              label: 'Nivel',
              value: slot.tier
            }, {
              label: 'Posición en la cinta',
              value: String(slot.order)
            }, {
              label: 'Superficies',
              value: banner.surfaces.join(', ')
            }, {
              label: 'Logo vectorial',
              value: slot.logoReady ? 'Aprobado' : 'Falta cargar'
            }, {
              label: 'Visible ahora',
              value: slot.active ? 'Sí' : 'No'
            }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-3">
                    <dt className="text-sm text-ink-muted">{row.label}</dt>
                    <dd className="text-sm font-medium capitalize text-brand">{row.value}</dd>
                  </div>)}
              </dl> : <p className="px-5 py-6 text-sm text-ink-muted">
                Tu marca aún no tiene espacio asignado en el banner.
              </p>}
          </Panel>
        </div>
      </div>
    </>;
}