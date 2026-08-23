import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { CheckIcon } from 'lucide-react';
import type { Edition } from '../../types/event';
import { PageTransition } from '../../components/motion/PageTransition';
import { EventPageHeader } from '../../components/event/EventPageHeader';
import { media } from '../../data/media';
import { publicTickets, ticketAvailability } from '../../data/tickets';
import { formatCop, withVat } from '../../utils/format';
import { Pending } from '../../components/ui/Pending';
import { Reveal, RevealItem } from '../../components/motion/Reveal';
import { StatusBadge } from '../../components/ui/StatusBadge';
export function EventTickets() {
  const {
    edition
  } = useOutletContext<{
    edition: Edition;
  }>();
  const list = publicTickets(edition.id);
  return <PageTransition>
      <EventPageHeader eyebrow="Tickets" image={media.networking} parts={[{
      text: 'Modalidades',
      tone: 'bold'
    }, {
      text: 'de inscripción',
      tone: 'light'
    }]} lead="Las tarifas están en revisión. Puedes reservar tu lugar en la lista de preventa y te avisamos en el momento en que se publiquen, antes de la apertura general." facts={[{
      label: 'Modalidades',
      value: String(list.length)
    }, {
      label: 'Cupos totales',
      value: String(list.reduce((total, ticket) => total + ticket.quota, 0))
    }]} />

      <section className="tint-aurora">
        <div className="mx-auto max-w-shell px-6 py-14 lg:py-20">
          <Reveal>
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {list.map((ticket) => {
              const available = ticketAvailability(ticket);
              const finalPrice = withVat(ticket.price, ticket.vatRate);
              const soldOut = available === 0;
              return <RevealItem key={ticket.id} className="h-full">
                    <div className="card-lift relative flex h-full flex-col overflow-hidden rounded-3xl border border-white bg-white/90 p-7 shadow-elev2 backdrop-blur">
                      <span className="grad-futuro absolute inset-x-0 top-0 h-1" aria-hidden="true" />
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold leading-snug text-brand">
                            {ticket.name}
                          </h2>
                          <p className="mt-1 text-xs uppercase tracking-wide text-ink-muted">
                            {ticket.modality}
                          </p>
                        </div>
                        {soldOut ? <StatusBadge label="Agotado" tone="warning" /> : null}
                      </div>

                      <div className="mt-5">
                        {ticket.price === null ? <Pending note="tarifa en revisión" /> : <>
                            <p className="text-2xl font-bold text-brand">{formatCop(finalPrice)}</p>
                            <p className="mt-1 text-xs text-ink-muted">
                              {formatCop(ticket.price)} + IVA
                            </p>
                          </>}
                      </div>

                      <ul className="mt-5 space-y-2">
                        {ticket.benefits.map((benefit) => <li key={benefit} className="flex gap-2.5 text-sm text-ink">
                            <CheckIcon size={16} className="mt-0.5 shrink-0 text-accent" />
                            {benefit}
                          </li>)}
                      </ul>

                      <div className="mt-auto pt-6">
                        <p className="mb-3 text-xs text-ink-muted">
                          Cupo: {ticket.quota} · Disponibles: {available}
                        </p>
                        <Link to={`../inscripcion?ticket=${ticket.id}`} className={`block rounded-full px-4 py-3 text-center text-sm font-semibold transition-transform duration-200 ease-emphasis ${soldOut ? 'border border-line text-ink-muted' : 'grad-futuro text-white shadow-elev2 hover:-translate-y-0.5'}`}>
                          {soldOut ? 'Unirme a la lista de espera' : ticket.price === null ? 'Reservar mi lugar' : 'Inscribirme'}
                        </Link>
                      </div>
                    </div>
                  </RevealItem>;
            })}
            </ul>
          </Reveal>

          <div className="mt-8 rounded-3xl border border-white bg-white/80 p-7 shadow-elev1 backdrop-blur">
            <h2 className="text-base font-bold tracking-tight text-brand">Pagos y facturación</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink">
              Los pagos se procesan con Wompi. Al aprobarse la transacción, el registro se confirma y se
              emite el código QR de acceso. Política de reembolsos: PENDIENTE de aprobación.
            </p>
          </div>
        </div>
      </section>
    </PageTransition>;
}