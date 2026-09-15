import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { usePlatform } from '../../contexts/PlatformContext';
import { listPublicEventAllyLogos, type EventAllyLogo } from '../../lib/novo/sponsors';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';
import { SponsorLogoTile } from './SponsorLogoTile';

interface NovoEventSponsorBannerProps {
  eventId: string;
  editionId?: string;
  slug: string;
}

/** Cinta de aliados del evento Novo. Va dentro del stack móvil inferior. */
export function NovoEventSponsorBanner({ eventId, editionId, slug }: NovoEventSponsorBannerProps) {
  const { bannerCollapsed, setBannerCollapsed } = usePlatform();
  const [heading, setHeading] = useState('Aliados');
  const [items, setItems] = useState<EventAllyLogo[] | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let active = true;
    setItems(null);
    listPublicEventAllyLogos(eventId, editionId)
      .then((next) => {
        if (!active) return;
        setHeading(next.heading);
        setItems(next.items);
      })
      .catch(() => {
        if (active) setItems([]);
      });
    return () => { active = false; };
  }, [eventId, editionId]);

  if (!items || items.length === 0) return null;

  const copies = items.length >= 6 ? 2 : 4;
  const logos = Array.from({ length: copies }, (_, copy) => items.map((item) => (
    <Link key={`${item.id}-${copy}`} to={`/e/${slug}/aliados`} aria-label={`Ver aliados · ${item.name}`}>
      <SponsorLogoTile name={item.name} logoUrl={item.logoUrl} hasLogo={Boolean(item.logoUrl)} size="mobile" />
    </Link>
  ))).flat();

  return (
    <div className="bg-canvas/95 backdrop-blur" style={{ boxShadow: '0 -12px 32px -20px rgba(10,33,64,0.45)' }}>
      <div className="flex items-center justify-between px-4 pt-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          {heading}
        </span>
        <button
          type="button"
          onClick={() => setBannerCollapsed(!bannerCollapsed)}
          className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted"
          aria-expanded={!bannerCollapsed}
        >
          {bannerCollapsed ? 'Mostrar' : 'Ocultar'}
          {bannerCollapsed ? <ChevronUpIcon size={13} /> : <ChevronDownIcon size={13} />}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {!bannerCollapsed ? (
          <motion.div
            key="strip"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION.panel, ease: EASE_EMPHASIS }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 pt-1.5">
              <div
                className={`marquee-fade overflow-hidden ${paused ? 'marquee-paused' : ''}`}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onTouchStart={() => setPaused(true)}
                onTouchEnd={() => setPaused(false)}
              >
                <div className="marquee-track flex w-max items-center gap-5 py-3" style={{ ['--marquee-duration' as string]: '22s' }}>
                  {logos}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
