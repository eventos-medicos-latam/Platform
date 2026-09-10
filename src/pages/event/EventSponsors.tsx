import React from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Edition } from '../../types/event';
import { PageTransition } from '../../components/motion/PageTransition';
import { AllyPlansSection } from '../../components/public/AllyPlansSection';

export function EventSponsors() {
  const { edition } = useOutletContext<{ edition: Edition }>();
  return (
    <PageTransition>
      <AllyPlansSection fixedEditionId={edition.id} />
    </PageTransition>
  );
}
