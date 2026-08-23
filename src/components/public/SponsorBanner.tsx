import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon, XIcon } from 'lucide-react';
import { usePlatform } from '../../contexts/PlatformContext';
import { getCompany, participations } from '../../data/companies';
import { standsByEdition } from '../../data/sponsors';
import type { BannerSlot, BannerSurface } from '../../types/commerce';
import { popVariants, DURATION, EASE_EMPHASIS } from '../../utils/motion';
import { Pending } from '../ui/Pending';
interface SponsorBannerProps {
  surface: BannerSurface;
  mode?: 'inline' | 'fixed';
  /** Color exacto de la sección que queda arriba. El degradado termina en él. */
  blendTop?: string;
  /** Color exacto de la sección que queda abajo. */
  blendBottom?: string;
}
/** Los logos llegan en formato 1:1: todas las fichas son cuadradas y del mismo lado. */
const TILE_DESKTOP = 'h-[132px] w-[132px]';
const TILE_MOBILE = 'h-[76px] w-[76px]';
function monogram(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Cinta de patrocinadores. Mismo origen de datos para las dos superficies:
 * solo entran participaciones publicadas y slots activos.
 */
export function SponsorBanner({
  surface,
  mode = 'inline',
  blendTop = '#1a1a3d',
  blendBottom = '#1a1a3d'
}: SponsorBannerProps) {
  const {
    banner,
    updateSlot,
    bannerCollapsed,
    setBannerCollapsed
  } = usePlatform();
  const [paused, setPaused] = useState(false);
  const [openSlotId, setOpenSlotId] = useState<string | null>(null);
  const slots = useMemo(() => banner.slots.filter((slot) => slot.active).filter((slot) => {
    const participation = participations.find((item) => item.companyId === slot.companyId && item.editionId === banner.editionId);
    return participation?.status === 'publicado';
  }).sort((a, b) => a.order - b.order), [banner.slots, banner.editionId]);
  if (!banner.enabled || !banner.surfaces.includes(surface) || slots.length === 0) return null;
  if (mode === 'fixed' && !banner.mobileEnabled) return null;
  const openSlot = slots.find((slot) => slot.id === openSlotId) ?? null;
  const openCompany = openSlot ? getCompany(openSlot.companyId) : null;
  const openParticipation = openSlot ? participations.find((item) => item.companyId === openSlot.companyId && item.editionId === banner.editionId) : null;
  const openStand = openParticipation?.standId ? standsByEdition(banner.editionId).find((stand) => stand.id === openParticipation.standId) : null;
  const duration = mode === 'fixed' ? banner.mobileSpeedSeconds : banner.desktopSpeedSeconds;
  function handleLogoClick(slot: BannerSlot) {
    updateSlot(slot.id, {
      clicks: slot.clicks + 1
    });
    setOpenSlotId(slot.id);
  }
  // Cuatro copias: el desplazamiento del -50% siempre cubre el ancho del viewport,
  // así el bucle nunca deja un vacío ni se ve el salto de reinicio.
  const logos = [...slots, ...slots, ...slots, ...slots].map((slot, index) => {
    const company = getCompany(slot.companyId);
    if (!company) return null;
    const sizing = mode === 'fixed' ? TILE_MOBILE : TILE_DESKTOP;
    const hasLogo = slot.logoReady && Boolean(company.logoUrl);
    return <button key={`${slot.id}-${index}`} type="button" onClick={() => handleLogoClick(slot)} aria-label={`Ver información de ${company.tradeName}`} className={`group grid ${sizing} shrink-0 place-items-center overflow-hidden rounded-2xl border bg-white p-3 transition-[transform,box-shadow,border-color] duration-200 ease-emphasis ${hasLogo ? 'border-line/70 shadow-elev1 hover:scale-[1.09] hover:border-brand/30 hover:shadow-elev4' : 'border-dashed border-line'}`}>
        {hasLogo ? <img src={company.logoUrl} alt={company.tradeName} className="h-full w-full object-contain" draggable={false} loading="lazy" /> : <span className="flex flex-col items-center gap-1.5 px-1 text-center">
            <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-md bg-brand-soft text-[11px] font-bold text-brand">
              {monogram(company.tradeName)}
            </span>
            <span className="truncate text-[10px] font-medium text-ink-muted">
              {company.tradeName}
            </span>
          </span>}
      </button>;
  });
  const track = <div className={`marquee-fade overflow-hidden ${paused ? 'marquee-paused' : ''}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}>
      <div className="marquee-track flex w-max items-center gap-5 py-3" style={{
      ['--marquee-duration' as string]: `${duration}s`
    }}>
        {logos}
      </div>
    </div>;
  const sheet = <AnimatePresence>
      {openSlot && openCompany ? <>
          <motion.div className="fixed inset-0 z-40 bg-brand-deep/40" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} transition={{
        duration: DURATION.dropdown,
        ease: EASE_EMPHASIS
      }} onClick={() => setOpenSlotId(null)} />
          <motion.div role="dialog" aria-label={`Patrocinador ${openCompany.tradeName}`} className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-line bg-white p-5 shadow-lift sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2" variants={popVariants} initial="initial" animate="enter" exit="exit">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
                  {monogram(openCompany.tradeName)}
                </span>
                <div>
                  <p className="text-base font-semibold text-brand">{openCompany.tradeName}</p>
                  <p className="text-xs uppercase tracking-wide text-ink-muted">
                    Nivel {openSlot.tier}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setOpenSlotId(null)} className="rounded p-1 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-canvas hover:text-brand" aria-label="Cerrar">
                <XIcon size={18} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink">{openCompany.description}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-muted">Participación</dt>
                <dd className="text-right font-medium text-brand">
                  {openParticipation?.packageName ?? <Pending />}
                </dd>
              </div>
              {openStand ? <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-muted">Stand</dt>
                  <dd className="text-right font-medium text-brand">
                    {openStand.number} · {openStand.location}
                  </dd>
                </div> : null}
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-muted">Sitio web</dt>
                <dd className="text-right font-medium text-brand">
                  {openCompany.web === 'PENDIENTE' ? <Pending /> : <a className="inline-flex items-center gap-1 underline" href={openCompany.web}>
                      Visitar <ExternalLinkIcon size={13} />
                    </a>}
                </dd>
              </div>
            </dl>
          </motion.div>
        </> : null}
    </AnimatePresence>;
  if (mode === 'fixed') {
    return <>
        {/* Sin borde duro: una sombra suave la separa del contenido y el
           relleno inferior respeta el área segura del teléfono. */}
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30 bg-canvas/95 backdrop-blur md:hidden" style={{
        boxShadow: '0 -12px 32px -20px rgba(10,33,64,0.45)'
      }}>
          <div className="flex items-center justify-between px-4 pt-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              {banner.headingLabel}
            </span>
            {banner.collapsible ? <button type="button" onClick={() => setBannerCollapsed(!bannerCollapsed)} className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted" aria-expanded={!bannerCollapsed}>
                {bannerCollapsed ? 'Mostrar' : 'Ocultar'}
                {bannerCollapsed ? <ChevronUpIcon size={13} /> : <ChevronDownIcon size={13} />}
              </button> : null}
          </div>
          <AnimatePresence initial={false}>
            {!bannerCollapsed ? <motion.div key="strip" initial={{
            height: 0,
            opacity: 0
          }} animate={{
            height: 'auto',
            opacity: 1
          }} exit={{
            height: 0,
            opacity: 0
          }} transition={{
            duration: DURATION.panel,
            ease: EASE_EMPHASIS
          }} className="overflow-hidden">
                <div className="px-3 pb-2 pt-1.5">{track}</div>
              </motion.div> : null}
          </AnimatePresence>
        </div>
        {sheet}
      </>;
  }
  return <>
      {/* Sin bordes: el color arranca en el tono del vecino de arriba, llega al claro
         en el centro donde viven los logos y vuelve al tono del vecino de abajo. */}
      <section aria-label="Patrocinadores" className="relative hidden py-12 md:block" style={{
      // El degradado nace y muere exactamente en el color del vecino, así no hay borde.
      background: `linear-gradient(180deg, ${blendTop} 0%, ${blendTop} 4%, color-mix(in srgb, ${blendTop} 55%, #f7f9fc) 22%, color-mix(in srgb, ${blendTop} 18%, #f7f9fc) 38%, #f7f9fc 50%, color-mix(in srgb, ${blendBottom} 18%, #f7f9fc) 62%, color-mix(in srgb, ${blendBottom} 55%, #f7f9fc) 78%, ${blendBottom} 96%, ${blendBottom} 100%)`
    }}>
        {/* Rótulo y cinta van en la misma línea, dentro de la zona clara del degradado. */}
        <div className="relative mx-auto flex max-w-shell items-center gap-6 px-6">
          <p className="w-24 shrink-0 text-[11px] font-semibold uppercase leading-tight tracking-[0.18em] text-ink-muted">
            {banner.headingLabel}
          </p>
          <div className="min-w-0 flex-1">{track}</div>
        </div>
      </section>
      {sheet}
    </>;
}