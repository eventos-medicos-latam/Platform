import React, { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { CheckIcon, MinusIcon } from 'lucide-react';
import type { Edition } from '../../types/event';
import type { PlanId } from '../../types/participation';
import { PageTransition } from '../../components/motion/PageTransition';
import { DisplayTitle } from '../../components/ui/DisplayTitle';
import { EventPageHeader } from '../../components/event/EventPageHeader';
import { PlanShowcase } from '../../components/event/PlanShowcase';
import { SponsorRegistrationSection, type SponsorType } from '../../components/event/SponsorRegistrationSection';
import { SponsorBanner } from '../../components/public/SponsorBanner';
import { Reveal, RevealItem } from '../../components/motion/Reveal';
import { media } from '../../data/media';
import { supabase } from '../../lib/supabaseClient';
import { comparisonFootnote, planComparison, participationPlans } from '../../data/plans';

interface PublishedParticipation {
  id: string;
  plan_id: string;
  company: { trade_name: string; description: string | null };
}

/**
 * Registro de patrocinio. Todo nace del plan: el espacio, el puente y el
 * speaker se derivan de él, nunca al revés. El tipo elegido vive en la URL
 * (`?tipo=`), no en estado local, para que sobreviva el viaje de ida y
 * vuelta al checkout de Wompi.
 */
export function EventSponsors() {
  const {
    edition
  } = useOutletContext<{
    edition: Edition;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tipo = searchParams.get('tipo') as SponsorType | null;
  const activePlanId = (searchParams.get('ver') as PlanId | null) ?? null;
  const [published, setPublished] = useState<PublishedParticipation[]>([]);
  useEffect(() => {
    supabase
      .from('participations')
      .select('id, plan_id, companies!inner(trade_name, description)')
      .eq('edition_id', edition.id)
      .eq('status', 'publicado')
      .then(({ data }) => setPublished((data ?? []).map((row: unknown) => {
        const r = row as { id: string; plan_id: string; companies: { trade_name: string; description: string | null } };
        return { id: r.id, plan_id: r.plan_id, company: r.companies };
      })));
  }, [edition.id]);

  const [bridgesLeft, setBridgesLeft] = useState(0);
  useEffect(() => {
    supabase
      .from('participation_plan_editions')
      .select('total_inventory, sold')
      .eq('edition_id', edition.id)
      .eq('plan_id', 'protagonista')
      .maybeSingle()
      .then(({ data }) => setBridgesLeft(data ? Math.max(0, (data.total_inventory ?? 0) - data.sold) : 0));
  }, [edition.id]);

  const setVer = (id: PlanId | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('ver', id); else next.delete('ver');
    setSearchParams(next, { replace: true });
  };
  const chooseType = (id: SponsorType) => {
    const next = new URLSearchParams(searchParams);
    next.set('tipo', id);
    setSearchParams(next);
  };

  return <PageTransition>
      <EventPageHeader eyebrow="Registro" image={media.networking} parts={[{
      text: 'Tres formas',
      tone: 'bold'
    }, {
      text: 'de patrocinar',
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
            Toca un plan para ver todo lo que incluye. Cuando decidas, el registro se abre debajo —
            un formulario y listo.
          </p>

          <div className="mt-10">
            <PlanShowcase activeId={activePlanId} onSelect={(id) => setVer(activePlanId === id ? null : id)} ctaLabel="Ir al registro" onCta={(id) => chooseType(id)} />
          </div>
        </div>
      </section>

      <SponsorRegistrationSection editionId={edition.id} type={tipo} />

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
              const plan = participationPlans.find((item) => item.id === participation.plan_id);
              return <RevealItem key={participation.id} className="h-full">
                      <div className="card-lift flex h-full flex-col rounded-2xl border border-white bg-white/90 p-6 shadow-elev2 backdrop-blur">
                        <p className="text-base font-bold text-brand">{participation.company.trade_name}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                          {plan?.name ?? participation.plan_id}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                          {participation.company.description}
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
