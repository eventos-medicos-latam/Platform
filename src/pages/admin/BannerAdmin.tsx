import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownIcon, ArrowUpIcon, EyeIcon, ImageOffIcon, MousePointerClickIcon, SmartphoneIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { getCompany, participationsByEdition } from '../../data/companies';
import { getEdition } from '../../data/editions';
import { formatNumber, formatPercent } from '../../utils/format';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { BannerSurface } from '../../types/commerce';
import { EASE_EMPHASIS } from '../../utils/motion';
const tierLabels: Record<string, string> = {
  principal: 'Principal',
  destacado: 'Destacado',
  apoyo: 'Apoyo'
};
const tierSize: Record<string, string> = {
  principal: 'h-7 text-[11px] px-3',
  destacado: 'h-6 text-[10px] px-2.5',
  apoyo: 'h-5 text-[9px] px-2'
};
const surfaces: {
  id: BannerSurface;
  label: string;
}[] = [{
  id: 'evento',
  label: 'Páginas de evento'
}, {
  id: 'corporativo',
  label: 'Home corporativa'
}, {
  id: 'contenido',
  label: 'Contenidos'
}];
export function BannerAdmin() {
  const {
    banner,
    updateBanner,
    updateSlot,
    moveSlot,
    activeEditionId
  } = usePlatform();
  const edition = getEdition(activeEditionId);
  const [preview, setPreview] = useState<'movil' | 'escritorio'>('movil');
  const ordered = [...banner.slots].sort((a, b) => a.order - b.order);
  const activeSlots = ordered.filter((slot) => slot.active);
  const published = new Set(participationsByEdition(activeEditionId).filter((participation) => participation.status === 'publicado').map((participation) => participation.companyId));
  const impressions = ordered.reduce((total, slot) => total + slot.impressions, 0);
  const clicks = ordered.reduce((total, slot) => total + slot.clicks, 0);
  const toggleSurface = (surface: BannerSurface) => {
    const next = banner.surfaces.includes(surface) ? banner.surfaces.filter((item) => item !== surface) : [...banner.surfaces, surface];
    updateBanner({
      surfaces: next
    });
  };
  return <>
      <ModuleHeader eyebrow="Comercial" title="Banner de patrocinadores" description="Controla qué marcas aparecen, con qué peso y en qué superficies. Los logos provienen de los activos que cada empresa carga en su Portal." actions={<label className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink">
            <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={banner.enabled} onChange={(event) => updateBanner({
        enabled: event.target.checked
      })} />
            Banner activo en esta edición
          </label>} />

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <Panel emphasis title="Marcas en la cinta" description="El nivel define tamaño y frecuencia. Reordena con las flechas.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead className="bg-canvas">
                  <tr>
                    <th className={thClass}>Orden</th>
                    <th className={thClass}>Empresa</th>
                    <th className={thClass}>Nivel</th>
                    <th className={thClass}>Logo</th>
                    <th className={thClass}>Impresiones</th>
                    <th className={thClass}>Clics</th>
                    <th className={thClass}>CTR</th>
                    <th className={thClass}>Activo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {ordered.map((slot, index) => {
                  const company = getCompany(slot.companyId);
                  const isPublished = published.has(slot.companyId);
                  return <tr key={slot.id} className="transition-colors duration-150 hover:bg-canvas">
                        <td className={tdClass}>
                          <div className="flex items-center gap-1">
                            <span className="w-4 tabular-nums text-ink-muted">{slot.order}</span>
                            <button type="button" onClick={() => moveSlot(slot.id, -1)} disabled={index === 0} aria-label="Subir" className="rounded p-1 text-ink-muted hover:bg-brand-soft disabled:opacity-30">
                              <ArrowUpIcon size={13} />
                            </button>
                            <button type="button" onClick={() => moveSlot(slot.id, 1)} disabled={index === ordered.length - 1} aria-label="Bajar" className="rounded p-1 text-ink-muted hover:bg-brand-soft disabled:opacity-30">
                              <ArrowDownIcon size={13} />
                            </button>
                          </div>
                        </td>
                        <td className={`${tdClass} font-medium text-brand`}>
                          {company?.tradeName ?? slot.companyId}
                          {!isPublished ? <span className="ml-2 align-middle">
                              <StatusBadge label="No publicada" tone="warning" />
                            </span> : null}
                        </td>
                        <td className={tdClass}>
                          <select value={slot.tier} onChange={(event) => updateSlot(slot.id, {
                        tier: event.target.value as 'principal' | 'destacado' | 'apoyo'
                      })} className="rounded-lg border border-line bg-white px-2 py-1 text-xs text-ink">
                            {Object.entries(tierLabels).map(([value, label]) => <option key={value} value={value}>
                                {label}
                              </option>)}
                          </select>
                        </td>
                        <td className={tdClass}>
                          {slot.logoReady ? <StatusBadge label="SVG listo" tone="success" /> : <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
                              <ImageOffIcon size={13} /> Falta SVG
                            </span>}
                        </td>
                        <td className={tdClass}>{formatNumber(slot.impressions)}</td>
                        <td className={tdClass}>{formatNumber(slot.clicks)}</td>
                        <td className={tdClass}>
                          {slot.impressions > 0 ? formatPercent(slot.clicks / slot.impressions) : '—'}
                        </td>
                        <td className={tdClass}>
                          <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={slot.active} disabled={!slot.logoReady || !isPublished} onChange={(event) => updateSlot(slot.id, {
                        active: event.target.checked
                      })} aria-label={`Activar ${company?.tradeName ?? slot.companyId}`} />
                        </td>
                      </tr>;
                })}
                </tbody>
              </table>
            </div>
            <p className="border-t border-line bg-canvas px-5 py-3 text-xs text-ink-muted">
              Una marca solo puede activarse si su participación está publicada y su logo vectorial está
              aprobado. Cuando falta el SVG, el sistema genera un requerimiento automático hacia la
              empresa.
            </p>
          </Panel>

          <div className="grid gap-5 sm:grid-cols-2">
            <Panel title="Superficies" description="Dónde se muestra la cinta.">
              <ul className="divide-y divide-line">
                {surfaces.map((surface) => <li key={surface.id} className="px-5 py-3">
                    <label className="flex items-center gap-3 text-sm text-ink">
                      <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={banner.surfaces.includes(surface.id)} onChange={() => toggleSurface(surface.id)} />
                      {surface.label}
                    </label>
                  </li>)}
              </ul>
            </Panel>

            <Panel title="Comportamiento" description="Velocidad y opciones por dispositivo.">
              <div className="space-y-4 px-5 py-4">
                <label className="block">
                  <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-muted">
                    Vuelta completa · escritorio
                    <span className="font-semibold text-brand">{banner.desktopSpeedSeconds}s</span>
                  </span>
                  <input type="range" min={20} max={80} value={banner.desktopSpeedSeconds} onChange={(event) => updateBanner({
                  desktopSpeedSeconds: Number(event.target.value)
                })} className="w-full accent-[color:var(--brand)]" />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-muted">
                    Vuelta completa · móvil
                    <span className="font-semibold text-brand">{banner.mobileSpeedSeconds}s</span>
                  </span>
                  <input type="range" min={15} max={60} value={banner.mobileSpeedSeconds} onChange={(event) => updateBanner({
                  mobileSpeedSeconds: Number(event.target.value)
                })} className="w-full accent-[color:var(--brand)]" />
                </label>
                <label className="flex items-center gap-2.5 text-sm text-ink">
                  <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={banner.mobileEnabled} onChange={(event) => updateBanner({
                  mobileEnabled: event.target.checked
                })} />
                  Franja fija en móvil
                </label>
                <label className="flex items-center gap-2.5 text-sm text-ink">
                  <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={banner.collapsible} onChange={(event) => updateBanner({
                  collapsible: event.target.checked
                })} />
                  El usuario puede colapsarla
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                    Etiqueta del encabezado
                  </span>
                  <input value={banner.headingLabel} onChange={(event) => updateBanner({
                  headingLabel: event.target.value
                })} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
                </label>
              </div>
            </Panel>
          </div>
        </div>

        {/* Vista previa en vivo */}
        <div className="space-y-5">
          <Panel title="Vista previa en vivo" description={edition ? `${edition.name} · ${edition.year}` : undefined} actions={<div className="flex rounded-lg border border-line p-0.5">
                {(['movil', 'escritorio'] as const).map((mode) => <button key={mode} type="button" onClick={() => setPreview(mode)} className={`relative rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors duration-150 ease-emphasis ${preview === mode ? 'text-white' : 'text-ink-muted'}`}>
                    {preview === mode ? <motion.span layoutId="banner-preview-tab" className="absolute inset-0 rounded-md bg-brand" transition={{
              duration: 0.2,
              ease: EASE_EMPHASIS
            }} /> : null}
                    <span className="relative">{mode}</span>
                  </button>)}
              </div>}>
            <div className="flex justify-center bg-canvas px-5 py-7">
              {preview === 'movil' ? <div className="w-[248px] overflow-hidden rounded-[26px] border-[6px] border-brand-deep bg-white shadow-lift">
                  <div className="h-5 bg-brand-deep" />
                  <div className="space-y-2 px-3 py-4">
                    <div className="skeleton h-3 w-4/5" />
                    <div className="skeleton h-3 w-3/5" />
                    <div className="skeleton h-20 w-full" />
                    <div className="skeleton h-3 w-2/3" />
                  </div>
                  <div className="bg-brand px-2 py-1.5">
                    <div className="rounded bg-white py-1.5 text-center text-[9px] font-semibold text-brand">
                      Inscribirme
                    </div>
                  </div>
                  {banner.enabled && banner.mobileEnabled ? <div className="overflow-hidden border-t border-line bg-canvas px-2 py-1.5" style={{
                ['--marquee-duration' as string]: `${banner.mobileSpeedSeconds}s`
              }}>
                      <p className="text-[7px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                        {banner.headingLabel}
                      </p>
                      <div className="mt-1 overflow-hidden">
                        <div className="marquee-track flex w-max items-center gap-2">
                          {[...activeSlots, ...activeSlots].map((slot, index) => <span key={`${slot.id}-${index}`} className={`grid shrink-0 place-items-center rounded bg-brand font-semibold text-white ${tierSize[slot.tier]}`}>
                              {getCompany(slot.companyId)?.tradeName ?? '—'}
                            </span>)}
                        </div>
                      </div>
                    </div> : <div className="border-t border-line bg-canvas px-3 py-2 text-center text-[8px] text-ink-muted">
                      Franja móvil desactivada
                    </div>}
                </div> : <div className="w-full max-w-sm overflow-hidden rounded-xl border border-line bg-white">
                  <div className="space-y-2 px-4 py-4">
                    <div className="skeleton h-3 w-1/2" />
                    <div className="skeleton h-16 w-full" />
                  </div>
                  {banner.enabled ? <div className="flex items-center gap-3 border-t border-line bg-canvas px-4 py-3" style={{
                ['--marquee-duration' as string]: `${banner.desktopSpeedSeconds}s`
              }}>
                      <span className="shrink-0 text-[8px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                        {banner.headingLabel}
                      </span>
                      <div className="overflow-hidden">
                        <div className="marquee-track flex w-max items-center gap-2.5">
                          {[...activeSlots, ...activeSlots].map((slot, index) => <span key={`${slot.id}-${index}`} className={`grid shrink-0 place-items-center rounded bg-brand font-semibold text-white ${tierSize[slot.tier]}`}>
                              {getCompany(slot.companyId)?.tradeName ?? '—'}
                            </span>)}
                        </div>
                      </div>
                    </div> : <div className="border-t border-line bg-canvas px-4 py-3 text-center text-[10px] text-ink-muted">
                      Banner desactivado
                    </div>}
                </div>}
            </div>
            <p className="flex items-center gap-2 border-t border-line px-5 py-3 text-xs text-ink-muted">
              <SmartphoneIcon size={14} /> En móvil la franja vive bajo la barra de inscripción y
              desaparece durante el registro y el pago.
            </p>
          </Panel>

          <Panel title="Retorno del banner" description="Evidencia de valor para la renovación.">
            <dl className="divide-y divide-line">
              <div className="flex items-center justify-between gap-4 px-5 py-3">
                <dt className="flex items-center gap-2 text-sm text-ink-muted">
                  <EyeIcon size={15} /> Impresiones acumuladas
                </dt>
                <dd className="text-sm font-semibold text-brand">{formatNumber(impressions)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-3">
                <dt className="flex items-center gap-2 text-sm text-ink-muted">
                  <MousePointerClickIcon size={15} /> Clics acumulados
                </dt>
                <dd className="text-sm font-semibold text-brand">{formatNumber(clicks)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-3">
                <dt className="text-sm text-ink-muted">CTR global</dt>
                <dd className="text-sm font-semibold text-brand">
                  {impressions > 0 ? formatPercent(clicks / impressions) : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-3">
                <dt className="text-sm text-ink-muted">Marcas activas</dt>
                <dd className="text-sm font-semibold text-brand">
                  {activeSlots.length} de {ordered.length}
                </dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </>;
}