import React, { useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { registrationsByEdition } from '../../data/registrations';
import { ticketsByEdition } from '../../data/tickets';
import { paymentStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { getEdition } from '../../data/editions';
const paymentFilters = ['todos', 'approved', 'pending', 'declined', 'expired', 'refunded'] as const;
export function Registrations() {
  const {
    activeEditionId,
    registrations: liveRegistrations
  } = usePlatform();
  const edition = getEdition(activeEditionId);
  const tickets = ticketsByEdition(activeEditionId);
  const [query, setQuery] = useState('');
  const [payment, setPayment] = useState<(typeof paymentFilters)[number]>('todos');
  const base = useMemo(() => liveRegistrations.filter((registration) => registration.editionId === activeEditionId).length > 0 ? liveRegistrations.filter((registration) => registration.editionId === activeEditionId) : registrationsByEdition(activeEditionId), [liveRegistrations, activeEditionId]);
  const filtered = base.filter((registration) => {
    const matchesQuery = query.trim() === '' || `${registration.fullName} ${registration.city} ${registration.specialty} ${registration.qrCode}`.toLowerCase().includes(query.toLowerCase());
    const matchesPayment = payment === 'todos' || registration.paymentStatus === payment;
    return matchesQuery && matchesPayment;
  });
  return <>
      <ModuleHeader eyebrow="Operación" title="Registros" description="Datos personales en PENDIENTE hasta que existan inscripciones reales. El consentimiento comercial se registra por asistente." />

      <Panel emphasis title={`${filtered.length} registros`} description="Filtra por estado de pago o busca por nombre, ciudad, especialidad o código QR." actions={<>
            <label className="relative">
              <SearchIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" className="w-52 rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
            </label>
            <select value={payment} onChange={(event) => setPayment(event.target.value as typeof payment)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink" aria-label="Filtrar por estado de pago">
              {paymentFilters.map((filter) => <option key={filter} value={filter}>
                  {filter === 'todos' ? 'Todos los pagos' : paymentStatusMeta[filter].label}
                </option>)}
            </select>
          </>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px]">
            <thead className="bg-canvas">
              <tr>
                <th className={thClass}>Asistente</th>
                <th className={thClass}>Ticket</th>
                <th className={thClass}>Ciudad</th>
                <th className={thClass}>Especialidad</th>
                <th className={thClass}>Interés</th>
                <th className={thClass}>Pago</th>
                <th className={thClass}>QR</th>
                <th className={thClass}>Fuente</th>
                <th className={thClass}>CRM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((registration) => {
              const ticket = tickets.find((item) => item.id === registration.ticketId);
              const track = edition?.trackAxis.tracks.find((item) => item.id === registration.trackInterestId);
              const meta = paymentStatusMeta[registration.paymentStatus];
              return <tr key={registration.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-medium text-brand`}>{registration.fullName}</td>
                    <td className={tdClass}>{ticket?.name ?? '—'}</td>
                    <td className={tdClass}>{registration.city}</td>
                    <td className={tdClass}>{registration.specialty}</td>
                    <td className={tdClass}>{track?.name ?? '—'}</td>
                    <td className={tdClass}>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </td>
                    <td className={`${tdClass} font-mono text-xs`}>
                      {registration.qrCode}
                      <span className="ml-2 text-[10px] uppercase text-ink-muted">
                        {registration.qrStatus}
                      </span>
                    </td>
                    <td className={`${tdClass} text-xs`}>{registration.source}</td>
                    <td className={tdClass}>{registration.crmSynced ? 'Sí' : 'Pendiente'}</td>
                  </tr>;
            })}
            </tbody>
          </table>
          {filtered.length === 0 ? <p className="px-5 py-10 text-center text-sm text-ink-muted">
              Ningún registro coincide con los filtros aplicados.
            </p> : null}
        </div>
      </Panel>
    </>;
}