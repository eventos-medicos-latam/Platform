import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckIcon, MinusIcon } from 'lucide-react';
import type { Edition } from '../../types/event';
import type { PlanId } from '../../types/participation';
import { PageTransition } from '../../components/motion/PageTransition';
import { DisplayTitle } from '../../components/ui/DisplayTitle';
import { EventPageHeader } from '../../components/event/EventPageHeader';
import { PlanConfigurator } from '../../components/event/PlanConfigurator';
import { PlanShowcase } from '../../components/event/PlanShowcase';
import { SponsorBanner } from '../../components/public/SponsorBanner';
import { Reveal, RevealItem } from '../../components/motion/Reveal';
import { media } from '../../data/media';
import { comparisonFootnote, getPlan, planComparison, participationPlans } from '../../data/plans';
import { getCompany, participationsByEdition } from '../../data/companies';
import { formatCop } from '../../utils/format';
import { EASE_EMPHASIS } from '../../utils/motion';

/**
 * Participación de marca. Todo nace del plan: el espacio, el puente y el
 * speaker se derivan de él, nunca al revés.
 */
export function EventSponsors() {
  const {
    edition
  } = useOutletContext<{
    edition: Edition;
  }>();
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const detail = planId ? getPlan(planId) : undefined;
  const published = participationsByEdition(edition.id).filter((item) => item.status === 'publicado');
  const protagonista = participationPlans.find((plan) => plan.id === 'protagonista');
  const bridgesLeft = protagonista ? protagonista.totalInventory! - protagonista.sold : 0;
  return <PageTransition>
      <EventPageHeader eyebrow="Participación de marca" image={media.networking} parts={[{
      text: 'Tres formas',
      tone: 'bold'
    }, {
      text: 'de participar',
      tone: 'light'
    }]} lead="Hormobiota conecta marcas con profesionales de la salud a través de un ecosistema que integra educación científica, presencia digital, comunidad, relacionamiento y experiencias presenciales. Todo empieza por el plan." facts={[{
      label: 'Planes',
      value: '3'
    }, {
      label: 'Puentes libres',
      value: String(bridgesLeft)
    }, {
      label: 'Marcas publicadas',
      value: String(published.length)
    }]} />

      {/* Marcas que ya acompañan la edición */}
      <SponsorBanner surface="evento" mode="inline" />

      {/* Elegir cómo participar */}
      <section className="tint-aurora">
        <div className="mx-auto max-w-shell px-6 py-16 lg:py-24">
          <DisplayTitle size="lg" className="max-w-3xl" parts={[{
          text: 'Elige cómo quieres',
          tone: 'light'
        }, {
          text: 'participar',
          tone: 'bold'
        }]} />
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink">
            Tres niveles, tres objetivos: estar presente, construir relaciones o posicionarte dentro
            de la conversación científica.
          </p>

          <div className="mt-10">
            <PlanShowcase activeId={planId} onSelect={(id) => setPlanId(planId === id ? null : id)} ctaLabel="Ir al registro" onCta={(id) => {
            setPlanId(id);
            document.getElementById('configurador')?.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }} />
          </div>
        </div>
      </section>

      {/* Detalle del plan elegido */}
      {detail ? <section className="surface-deep relative isolate overflow-hidden text-white">
          <div className="mx-auto max-w-shell px-6 py-16 lg:py-24">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-hb-violet">
              {detail.verb}
            </p>
            <DisplayTitle size="lg" surface="dark" className="mt-4 max-w-3xl" parts={[{
          text: detail.name,
          tone: 'bold'
        }, {
          text: detail.tagline,
          tone: 'light'
        }]} />
            <div className="mt-6 max-w-3xl space-y-3 text-base leading-relaxed text-white/85">
              {detail.intro.map((paragraph) => <p key={paragraph.slice(0, 24)}>{paragraph}</p>)}
            </div>

            <div className="mt-10 grid gap-4 rounded-3xl border border-white/15 bg-white/[0.07] p-7 backdrop-blur lg:grid-cols-[1fr_1.2fr]">
              <div>
                <h3 className="text-base font-bold text-white">Ideal para marcas que buscan</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/75">{detail.closing}</p>
              </div>
              <ul className="grid gap-2 text-sm text-white/85 sm:grid-cols-2">
                {detail.idealFor.map((item) => <li key={item} className="flex items-start gap-2.5">
                    <CheckIcon size={15} className="mt-0.5 shrink-0 text-hb-violet" />
                    {item}
                  </li>)}
              </ul>
            </div>
          </div>
        </section> : null}

      {/* Configurador */}
      <section id="configurador" className="tint-aurora">
        <div className="mx-auto max-w-shell px-6 py-16 lg:py-24">
          <DisplayTitle size="lg" className="max-w-3xl" parts={[{
          text: 'Arma tu participación',
          tone: 'bold'
        }, {
          text: 'paso a paso',
          tone: 'light'
        }]} />
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink">
            El plan define todo lo demás: qué espacio puedes ocupar, si tienes puente propio y si
            llevas speaker. No hay pago en línea.
          </p>

          <Reveal>
            <ol className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[{
              title: 'Elige tu plan',
              text: 'Protagonista, Conexión o Pop Up. El plan habilita los pasos siguientes.'
            }, {
              title: 'Reserva tu espacio',
              text: 'Escoges tu stand 3 × 2 m o tu estación Pop Up directamente en el plano. Si vas con Protagonista, también tu puente y tu speaker.'
            }, {
              title: 'Crea el perfil de tu marca',
              text: 'Dejas los datos de la empresa. El equipo comercial recibe la solicitud, confirma disponibilidad y emite la propuesta formal.'
            }, {
              title: 'Entras a tu Portal',
              text: 'Al cerrar el acuerdo recibes acceso a tu Portal de marca: allí administras documentos, pagos, activos de marca, colaboradores e invitados, y sigues todo tu evento en un solo lugar.'
            }].map((step, index) => <RevealItem key={step.title} className="h-full">
                  <li className="card-lift relative flex h-full flex-col overflow-hidden rounded-2xl border border-white bg-white/90 p-6 shadow-elev2 backdrop-blur">
                    <span className="grad-futuro absolute inset-x-0 top-0 h-1" aria-hidden="true" />
                    <span className="grad-futuro grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="mt-4 text-base font-bold leading-snug text-brand">{step.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.text}</p>
                  </li>
                </RevealItem>)}
            </ol>
          </Reveal>

          <div className="mt-10">
            <PlanConfigurator edition={edition} planId={planId} onPlanChange={setPlanId} />
          </div>
        </div>
      </section>

      {/* Comparativo */}
      <section className="surface-deep relative isolate overflow-hidden text-white">
        <div className="mx-auto max-w-shell px-6 py-16 lg:py-24">
          <DisplayTitle size="lg" surface="dark" className="max-w-3xl" parts={[{
          text: 'Comparativo',
          tone: 'bold'
        }, {
          text: 'de los tres planes',
          tone: 'light'
        }]} />

          <div className="no-scrollbar mt-9 overflow-x-auto rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-transparent p-5 text-left text-xs font-bold uppercase tracking-[0.14em] text-white/60">
                    Beneficio
                  </th>
                  {participationPlans.map((plan) => <th key={plan.id} className="p-5 text-left">
                      <span className="block text-base font-bold text-white">{plan.name}</span>
                      <span className="mt-0.5 block text-xs font-medium text-hb-violet">
                        {plan.verb}
                      </span>
                    </th>)}
                </tr>
              </thead>
              <tbody>
                {planComparison.map((row) => <tr key={row.label} className="border-t border-white/10">
                    <th scope="row" className="p-5 text-left align-top text-sm font-medium text-white/75">
                      {row.label}
                      {row.footnote ? <span className="text-hb-violet">*</span> : null}
                    </th>
                    {participationPlans.map((plan) => {
                  const value = row.values[plan.id];
                  return <td key={plan.id} className="p-5 align-top">
                          {value === '✓' ? <CheckIcon size={18} className="text-hb-violet" /> : value === '—' ? <MinusIcon size={16} className="text-white/25" /> : <span className="font-semibold text-white">{value}</span>}
                        </td>;
                })}
                  </tr>)}
              </tbody>
            </table>
          </div>

          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-white/60">
            *{comparisonFootnote}
          </p>
        </div>
      </section>

      {/* Marcas ya confirmadas */}
      {published.length > 0 ? <section className="tint-aurora">
          <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
            <DisplayTitle size="md" parts={[{
          text: 'Marcas',
          tone: 'bold'
        }, {
          text: 'que ya confirmaron',
          tone: 'light'
        }]} />
            <Reveal>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {published.map((participation) => {
              const company = getCompany(participation.companyId);
              if (!company) return null;
              return <RevealItem key={participation.id} className="h-full">
                      <div className="card-lift flex h-full flex-col rounded-2xl border border-white bg-white/90 p-6 shadow-elev2 backdrop-blur">
                        <p className="text-base font-bold text-brand">{company.tradeName}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                          {participation.packageName}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                          {company.description}
                        </p>
                      </div>
                    </RevealItem>;
            })}
              </ul>
            </Reveal>
          </div>
        </section> : null}
    </PageTransition>;
}