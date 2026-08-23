import React from 'react';
import { Link } from 'react-router-dom';
import { PageTransition } from '../../components/motion/PageTransition';
import { organization } from '../../data/organization';
import { eventFamilies, editions } from '../../data/editions';
import { Reveal, RevealItem } from '../../components/motion/Reveal';
import { Pending } from '../../components/ui/Pending';
import { PageHero } from '../../components/public/PageHero';
import { media } from '../../data/media';
export function About() {
  return <PageTransition>
      <PageHero eyebrow="Nosotros" title={[{
      text: 'Educación médica continua',
      tone: 'bold'
    }, {
      text: 'como proyecto de largo plazo',
      tone: 'light'
    }]} lead={organization.valueProposition} image={media.networking} imageAlt="Equipo médico durante un congreso" facts={[{
      label: 'Sede',
      value: `${organization.city}, ${organization.country}`
    }, {
      label: 'Familias de eventos',
      value: String(eventFamilies.length)
    }, {
      label: 'Ediciones',
      value: String(editions.length)
    }]} />

      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-4 text-base leading-relaxed text-ink">
              {organization.description.map((paragraph) => <p key={paragraph.slice(0, 20)}>{paragraph}</p>)}
              <p>
                La organización nace y opera desde {organization.city}, {organization.country}, con
                proyección nacional e internacional en speakers, aliados y asistentes.
              </p>
            </div>
            <dl className="space-y-px overflow-hidden rounded-xl border border-line bg-line">
              <div className="bg-white px-5 py-4">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Razón social
                </dt>
                <dd className="mt-1.5 text-sm">
                  <Pending />
                </dd>
              </div>
              <div className="bg-white px-5 py-4">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Sede
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-brand">
                  {organization.city}, {organization.country}
                </dd>
              </div>
              <div className="bg-white px-5 py-4">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Identidad visual oficial
                </dt>
                <dd className="mt-1.5 text-sm">
                  <Pending note="logo, paleta y tipografía en entrega" />
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="tint-blue border-b border-line">
        <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
          <Reveal>
            <RevealItem>
              <h2 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">
                Enfoque académico
              </h2>
            </RevealItem>
            <RevealItem>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {organization.focus.map((item, index) => <li key={item} className="card-lift rounded-2xl border border-line bg-white px-6 py-6">
                    <p className="text-2xl font-bold tabular-nums text-accent">
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <p className="mt-3 text-base font-medium leading-snug text-brand">{item}</p>
                  </li>)}
              </ul>
            </RevealItem>
          </Reveal>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
          <h2 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">
            Familias de eventos
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink">
            Cada familia agrupa las ediciones de un mismo evento. Así el histórico se conserva y la
            próxima edición hereda comunidad, contenido y aprendizajes.
          </p>
          <div className="mt-8 space-y-5">
            {eventFamilies.map((family) => {
            const familyEditions = editions.filter((edition) => edition.familyId === family.id);
            return <article key={family.id} className="card-lift rounded-2xl border border-line bg-canvas p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="text-xl font-semibold text-brand">{family.name}</h3>
                    <p className="text-sm text-ink-muted">Desde {family.since}</p>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink">
                    {family.description}
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {familyEditions.map((edition) => <li key={edition.id}>
                        <Link to={`/eventos/${family.slug}/${edition.slug}`} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-brand transition-colors duration-150 ease-emphasis hover:border-brand/40">
                          {edition.name} · {edition.year}
                        </Link>
                      </li>)}
                  </ul>
                </article>;
          })}
          </div>
        </div>
      </section>
    </PageTransition>;
}