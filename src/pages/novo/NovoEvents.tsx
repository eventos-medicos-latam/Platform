import React, { useEffect, useState } from 'react';
import { EventsTable } from '../../components/novo/events/EventsTable';
import { listEvents } from '../../lib/novo/events';
import type { NovoEvent } from '../../types/novo';

export function NovoEvents() {
  const [events, setEvents] = useState<NovoEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listEvents()
      .then(setEvents)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los eventos.'));
  }, []);

  return (
    <div>
      {error && <p className="mb-4 text-sm" style={{ color: '#F24463' }}>{error}</p>}
      <EventsTable events={events} />
    </div>
  );
}
