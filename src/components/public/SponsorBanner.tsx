import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon, XIcon } from 'lucide-react';
import { usePlatform } from '../../contexts/PlatformContext';
import { supabase } from '../../lib/supabaseClient';
import { popVariants, DURATION, EASE_EMPHASIS } from '../../utils/motion';
import { Pending } from '../ui/Pending';
import { SponsorLogoTile, monogram } from './SponsorLogoTile';

interface BannerConfig {
  enabled: boolean;
  heading_label: string;
  surfaces: string[];
  desktop_speed_seconds: number;
  mobile_speed_seconds: number;
  mobile_enabled: boolean;
  collapsible: boolean;
}
interface Slot {
  id: string;
  company_id: string | null;
  standalone_name: string | null;
  standalone_logo_url: string | null;
  tier: 'principal' | 'destacado' | 'apoyo';
  order_num: number;
  active: boolean;
  logo_ready: boolean;
}
interface Company {
  id: string;
  trade_name: string;
  description: string | null;
  web: string | null;
  logo_url: string | null;
}
interface Participation {
  company_id: string;
  status: string;
  stand_id: string | null;
  plan_id: string;
}
interface Stand { id: string; number: string; location: string; }

interface SponsorBannerProps {
  surface: 'evento' | 'corporativo' | 'contenido';
  mode?: 'inline' | 'fixed';
  blendTop?: string;
  blendBottom?: string;
}

/** Cinta de patrocinadores: lee sponsor_banner_configs + banner_slots reales de la edición activa. */
export function SponsorBanner({
  surface,
  mode = 'inline',
  blendTop = '#1a1a3d',
  blendBottom = '#1a1a3d'
}: SponsorBannerProps) {
  const { activeEditionId, bannerCollapsed, setBannerCollapsed } = usePlatform();
  const [config, setConfig] = useState<BannerConfig | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [companies, setCompanies] = useState<Record<string, Company>>({});
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [stands, setStands] = useState<Stand[]>([]);
  const [paused, setPaused] = useState(false);
  const [openSlotId, setOpenSlotId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: configRow }, { data: slotRows }, { data: participationRows }, { data: standRows }] = await Promise.all([
        supabase.from('sponsor_banner_configs').select('*').eq('edition_id', activeEditionId).maybeSingle(),
        supabase.from('banner_slots').select('id, company_id, standalone_name, standalone_logo_url, tier, order_num, active, logo_ready').eq('edition_id', activeEditionId).eq('active', true),
        supabase.from('participations').select('company_id, status, stand_id, plan_id').eq('edition_id', activeEditionId),
        supabase.from('stands').select('id, number, location').eq('edition_id', activeEditionId)
      ]);
      if (!active) return;
      setConfig(configRow ?? null);
      setSlots(slotRows ?? []);
      setParticipations(participationRows ?? []);
      setStands(standRows ?? []);
      const companyIds = [...new Set((slotRows ?? []).map((slot) => slot.company_id).filter((id): id is string => Boolean(id)))];
      if (companyIds.length > 0) {
        const { data: companyRows } = await supabase.from('companies').select('id, trade_name, description, web, logo_url').in('id', companyIds);
        if (active) setCompanies(Object.fromEntries((companyRows ?? []).map((row) => [row.id, row])));
      }
    })();
    return () => {
      active = false;
    };
  }, [activeEditionId]);

  const slotsToShow = useMemo(() => {
    const publishedCompanyIds = new Set(participations.filter((p) => p.status === 'publicado').map((p) => p.company_id));
    return slots.filter((slot) => slot.company_id === null || publishedCompanyIds.has(slot.company_id)).sort((a, b) => a.order_num - b.order_num);
  }, [slots, participations]);

  if (!config || !config.enabled || !config.surfaces.includes(surface) || slotsToShow.length === 0) return null;
  if (mode === 'fixed' && !config.mobile_enabled) return null;

  function slotDisplay(slot: Slot) {
    if (slot.company_id) {
      const company = companies[slot.company_id];
      return company ? { name: company.trade_name, logoUrl: company.logo_url, hasLogo: slot.logo_ready && Boolean(company.logo_url) } : null;
    }
    return { name: slot.standalone_name ?? '', logoUrl: slot.standalone_logo_url, hasLogo: Boolean(slot.standalone_logo_url) };
  }

  const openSlot = slotsToShow.find((slot) => slot.id === openSlotId) ?? null;
  const openCompany = openSlot?.company_id ? companies[openSlot.company_id] : null;
  const openParticipation = openSlot?.company_id ? participations.find((item) => item.company_id === openSlot.company_id) : null;
  const openStand = openParticipation?.stand_id ? stands.find((stand) => stand.id === openParticipation.stand_id) : null;
  const duration = mode === 'fixed' ? config.mobile_speed_seconds : config.desktop_speed_seconds;

  function handleLogoClick(slot: Slot) {
    setOpenSlotId(slot.id);
    supabase.rpc('increment_banner_click', { slot_id: slot.id });
  }

  const logos = [...slotsToShow, ...slotsToShow, ...slotsToShow, ...slotsToShow].map((slot, index) => {
    const display = slotDisplay(slot);
    if (!display) return null;
    return <SponsorLogoTile key={`${slot.id}-${index}`} name={display.name} logoUrl={display.logoUrl} hasLogo={display.hasLogo} size={mode === 'fixed' ? 'mobile' : 'desktop'} onClick={() => handleLogoClick(slot)} />;
  });
  const track = <div className={`marquee-fade overflow-hidden ${paused ? 'marquee-paused' : ''}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}>
      <div className="marquee-track flex w-max items-center gap-5 py-3" style={{
      ['--marquee-duration' as string]: `${duration}s`
    }}>
        {logos}
      </div>
    </div>;
  const openDisplay = openSlot ? slotDisplay(openSlot) : null;
  const sheet = <AnimatePresence>
      {openSlot && openDisplay ? <>
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
          <motion.div role="dialog" aria-label={`Patrocinador ${openDisplay.name}`} className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-line bg-white p-5 shadow-lift sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2" variants={popVariants} initial="initial" animate="enter" exit="exit">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
                  {monogram(openDisplay.name)}
                </span>
                <div>
                  <p className="text-base font-semibold text-brand">{openDisplay.name}</p>
                  <p className="text-xs uppercase tracking-wide text-ink-muted">
                    Nivel {openSlot.tier}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setOpenSlotId(null)} className="rounded p-1 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-canvas hover:text-brand" aria-label="Cerrar">
                <XIcon size={18} />
              </button>
            </div>
            {openCompany ? <>
                <p className="mt-4 text-sm leading-relaxed text-ink">{openCompany.description}</p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink-muted">Plan</dt>
                    <dd className="text-right font-medium text-brand capitalize">
                      {openParticipation?.plan_id ?? <Pending />}
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
                      {!openCompany.web ? <Pending /> : <a className="inline-flex items-center gap-1 underline" href={openCompany.web}>
                          Visitar <ExternalLinkIcon size={13} />
                        </a>}
                    </dd>
                  </div>
                </dl>
              </> : null}
          </motion.div>
        </> : null}
    </AnimatePresence>;
  if (mode === 'fixed') {
    return <>
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30 bg-canvas/95 backdrop-blur md:hidden" style={{
        boxShadow: '0 -12px 32px -20px rgba(10,33,64,0.45)'
      }}>
          <div className="flex items-center justify-between px-4 pt-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              {config.heading_label}
            </span>
            {config.collapsible ? <button type="button" onClick={() => setBannerCollapsed(!bannerCollapsed)} className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted" aria-expanded={!bannerCollapsed}>
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
      <section aria-label="Patrocinadores" className="relative hidden py-12 md:block" style={{
      background: `linear-gradient(180deg, ${blendTop} 0%, ${blendTop} 4%, color-mix(in srgb, ${blendTop} 55%, #f7f9fc) 22%, color-mix(in srgb, ${blendTop} 18%, #f7f9fc) 38%, #f7f9fc 50%, color-mix(in srgb, ${blendBottom} 18%, #f7f9fc) 62%, color-mix(in srgb, ${blendBottom} 55%, #f7f9fc) 78%, ${blendBottom} 96%, ${blendBottom} 100%)`
    }}>
        <div className="relative mx-auto flex max-w-shell items-center gap-6 px-6">
          <p className="w-24 shrink-0 text-[11px] font-semibold uppercase leading-tight tracking-[0.18em] text-ink-muted">
            {config.heading_label}
          </p>
          <div className="min-w-0 flex-1">{track}</div>
        </div>
      </section>
      {sheet}
    </>;
}
