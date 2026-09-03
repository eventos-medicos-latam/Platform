import React, { useEffect, useState } from 'react';
import { EventsTable } from '../../components/novo/events/EventsTable';
import { listEvents } from '../../lib/novo/events';
import type { NovoEvent } from '../../types/novo';

export function NovoEvents() {
  const [events, setEvents] = useState<NovoEvent[]>([]);

  useEffect(() => {
    listEvents().then(setEvents);
  }, []);

  return <EventsTable events={events} onCreateEvent={() => alert('Modal de creación — próximo sprint')} />;
}
