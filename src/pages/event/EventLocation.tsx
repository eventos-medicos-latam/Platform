import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { MapPinIcon, PlaneIcon, BedDoubleIcon, CarIcon } from 'lucide-react';
import type { Edition } from '../../types/event';
import { PageTransition } from '../../components/motion/PageTransition';
import { Reveal, RevealItem } from '../../components/motion/Reveal';
import { Pending } from '../../components/ui/Pending';
import { EventPageHeader } from '../../components/event/EventPageHeader';
import { media } from '../../data/media';
export function EventLocation() {
  const {
    edition
  } = useOutletContext<{
    edition: Edition;
  }>();
  return <PageTransition>
      <EventPageHeader eyebrow="Ubicación" image={media.archiveHall} parts={[{
      text: 'Cómo llegar',
      tone: 'bold'
    }, {
      text: 'y dónde quedarte',
      tone: 'light'
    }]} lead={`${edition.venue.name} · ${edition.venue.city}, ${edition.venue.country}. Sede, accesos, transporte y hoteles con tarifa preferencial.`} facts={[{
      label: 'Sede',
      value: edition.venue.name
    }, {
      label: 'Ciudad',
      value: edition.venue.city
    }]} />

      <section className="tint-aurora">
        <div className="mx-auto max-w-shell px-6 py-14 lg:py-20">
          <Reveal className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
            <RevealItem>
              <div className="card-lift h-full rounded-3xl border border-white bg-white/90 p-8 shadow-elev2 backdrop-blur">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  <MapPinIcon size={15} className="text-accent" /> Sede
                </span>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-brand">
                  {edition.venue.name}
                </h2>
                <p className="mt-2 text-base text-ink">
                  {edition.venue.city}, {edition.venue.country}
                </p>
                <dl className="mt-6 divide-y divide-line border-t border-line">
                  {[{
                  label: 'Dirección',
                  value: edition.venue.address ?? 'PENDIENTE'
                }, {
                  label: 'Capacidad',
                  value: 'PENDIENTE'
                }, {
                  label: 'Parqueadero',
                  value: 'PENDIENTE'
                }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-sm text-ink-muted">{row.label}</dt>
                      <dd className="text-sm font-medium text-brand">
                        {row.value === 'PENDIENTE' ? <Pending /> : row.value}
                      </dd>
                    </div>)}
                </dl>
              </div>
            </RevealItem>

            <RevealItem>
              <ul className="grid h-full gap-4">
                {[{
                icon: PlaneIcon,
                title: 'Llegada aérea',
                text: 'Aeropuerto José María Córdova (MDE). Traslados: PENDIENTE.'
              }, {
                icon: CarIcon,
                title: 'Transporte urbano',
                text: 'Rutas y recomendaciones de movilidad: PENDIENTE.'
              }, {
                icon: BedDoubleIcon,
                title: 'Hoteles aliados',
                text: 'Convenios y tarifas preferenciales: PENDIENTE.'
              }].map((item) => <li key={item.title} className="card-lift relative overflow-hidden rounded-2xl border border-white bg-white/90 p-6 shadow-elev1 backdrop-blur">
                    <span className="grad-futuro absolute inset-y-0 left-0 w-1" aria-hidden="true" />
                    <item.icon size={20} className="text-accent" />
                    <h3 className="mt-3 text-base font-bold text-brand">{item.title}</h3>
                    <p className="mt-1.5 text-sm text-ink-muted">{item.text}</p>
                  </li>)}
              </ul>
            </RevealItem>
          </Reveal>
        </div>
      </section>
    </PageTransition>;
}