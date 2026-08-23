import React from 'react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { ticketAvailability, ticketsByEdition } from '../../data/tickets';
import { formatCop, withVat } from '../../utils/format';
import { publicationStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { Pending } from '../../components/ui/Pending';
export function TicketsAdmin() {
  const {
    activeEditionId
  } = usePlatform();
  const tickets = ticketsByEdition(activeEditionId);
  return <>
      <ModuleHeader eyebrow="Operación" title="Tickets" description="Precio, IVA, cupo, ventanas de venta y visibilidad. Un ticket sin precio aprobado no puede publicarse con valor." />

      <Panel emphasis title={`${tickets.length} tipos de ticket`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-canvas">
              <tr>
                <th className={thClass}>Ticket</th>
                <th className={thClass}>Modalidad</th>
                <th className={thClass}>Precio</th>
                <th className={thClass}>IVA</th>
                <th className={thClass}>Precio final</th>
                <th className={thClass}>Cupo</th>
                <th className={thClass}>Vendidos</th>
                <th className={thClass}>Disponibles</th>
                <th className={thClass}>Ventana</th>
                <th className={thClass}>Estado</th>
                <th className={thClass}>Visible</th>
                <th className={thClass}>Wompi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tickets.map((ticket) => {
              const meta = publicationStatusMeta[ticket.status];
              return <tr key={ticket.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-medium text-brand`}>{ticket.name}</td>
                    <td className={`${tdClass} capitalize`}>{ticket.modality}</td>
                    <td className={tdClass}>
                      {ticket.price === null ? <Pending /> : formatCop(ticket.price)}
                    </td>
                    <td className={tdClass}>{Math.round(ticket.vatRate * 100)}%</td>
                    <td className={`${tdClass} font-semibold`}>
                      {ticket.price === null ? '—' : formatCop(withVat(ticket.price, ticket.vatRate))}
                    </td>
                    <td className={tdClass}>{ticket.quota}</td>
                    <td className={tdClass}>{ticket.sold}</td>
                    <td className={tdClass}>{ticketAvailability(ticket)}</td>
                    <td className={`${tdClass} text-xs`}>
                      {ticket.startDate} → {ticket.endDate}
                    </td>
                    <td className={tdClass}>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </td>
                    <td className={tdClass}>{ticket.visible ? 'Sí' : 'No'}</td>
                    <td className={tdClass}>{ticket.wompiEnabled ? 'Activo' : '—'}</td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line bg-canvas px-5 py-3 text-xs text-ink-muted">
          El flujo de pago crea la orden, envía a Wompi y actualiza el registro al confirmarse. Estados
          soportados: Pending, Approved, Declined, Failed, Expired, Cancelled, Refunded.
        </p>
      </Panel>
    </>;
}