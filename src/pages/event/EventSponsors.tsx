import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { PageTransition } from '../../components/motion/PageTransition';
import { AllyPlansSection } from '../../components/public/AllyPlansSection';
import type { Edition } from '../../types/event';
import type { NovoEvent } from '../../types/novo';

export function EventSponsors() {
  const { edition, event } = useOutletContext<{ edition: Edition; event?: NovoEvent }>();
  return (
    <PageTransition>
      <AllyPlansSection fixedEditionId={edition.id} novoEventId={event?.id} />
    </PageTransition>
  );
}
