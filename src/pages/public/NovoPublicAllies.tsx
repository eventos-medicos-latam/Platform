import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { EventPageHeader } from '../../components/event/EventPageHeader';
import { PageTransition } from '../../components/motion/PageTransition';
import { DisplayTitle } from '../../components/ui/DisplayTitle';
import { media } from '../../data/media';
import { getPublicEventWeb } from '../../lib/novo/events';
import { listPublicSponsors, type EventSponsorRow } from '../../lib/novo/sponsors';
import { EventSponsors } from '../event/EventSponsors';
import type { NovoPublicOutlet } from './NovoPublicEventLayout';

export function NovoPublicAllies() {
  const { edition } = useOutletContext<NovoPublicOutlet>();
  if (edition) return <EventSponsors />;
  return <NovoAlliesFallback />;
}

function NovoAlliesFallback() {
  const { event } = useOutletContext<NovoPublicOutlet>();
  const [sponsors, setSponsors] = useState<EventSponsorRow[]>([]);
  const [allies, setAllies] = useState<{ name: string; logo_url?: string }[]>([]);

  useEffect(() => {
    Promise.all([
      listPublicSponsors(event.id).catch(() => []),
      getPublicEventWeb(event.id),
    ]).then(([nextSponsors, web]) => {
      setSponsors(nextSponsors);
      setAllies((web?.content.aliados_items ?? []).filter((item) => item.name.trim() || (item.logo_url ?? '').trim()));
    });
  }, [event.id]);

  const hasLogos = allies.length > 0 || sponsors.length > 0;

  return (
    <PageTransition>
      <EventPageHeader
        eyebrow="Aliados"
        image={event.cover_image_url || media.networking}
        parts={[{ text: 'Quiénes', tone: 'bold' }, { text: 'acompañan el evento', tone: 'light' }]}
        lead="Marcas y organizaciones que hacen posible esta edición."
      />
      <section className="tint-aurora">
        <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
          <DisplayTitle as="h2" size="md" parts={[{ text: 'Aliados y patrocinadores', tone: 'bold' }]} />
          {hasLogos ? (
            <div className="mt-10 flex flex-wrap items-center gap-8">
              {allies.map((ally) => (
                <div key={ally.name || ally.logo_url} className="flex items-center gap-3">
                  {ally.logo_url ? <img src={ally.logo_url} alt={ally.name} className="h-12 w-auto object-contain" /> : null}
                  {ally.name ? <p className="text-sm font-semibold text-brand">{ally.name}</p> : null}
                </div>
              ))}
              {sponsors.map((sponsor) => (
                <div key={sponsor.id} className="flex items-center gap-3">
                  {sponsor.logo ? <img src={sponsor.logo} alt={sponsor.company_name} className="h-12 w-auto object-contain" /> : null}
                  <p className="text-sm font-semibold text-brand">{sponsor.company_name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink">
              Los aliados y patrocinadores de esta edición se publicarán aquí.
            </p>
          )}
          <Link to="/contacto?motivo=patrocinar" className="mt-8 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white">
            Quiero ser patrocinador
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
