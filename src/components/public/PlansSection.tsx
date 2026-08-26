import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DisplayTitle } from '../ui/DisplayTitle';
import { PlanShowcase } from '../event/PlanShowcase';
import type { PlanId } from '../../types/participation';
const target = '/eventos/hormobiota/hormobiota-2-2027/registro';
interface PlansSectionProps {
  /** Subconjunto de planes a exponer. Por defecto, los tres. */
  planIds?: PlanId[];
  eyebrow?: string;
  titleLight?: string;
  titleBold?: string;
  description?: string;
}

/**
 * Los planes de participación de marca en el sitio corporativo.
 * El CTA lleva siempre a la página de Registro, ya con el plan elegido.
 */
export function PlansSection({
  planIds,
  eyebrow = 'Registro de marca',
  titleLight = 'Tres formas de estar',
  titleBold = 'dentro del ecosistema',
  description = 'Estar presente, construir relaciones o posicionarte dentro de la conversación científica. Toca un plan para ver todo lo que incluye.'
}: PlansSectionProps) {
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const navigate = useNavigate();
  return <section className="tint-aurora">
      <div className="mx-auto max-w-shell px-6 py-20 lg:py-28">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
          {eyebrow}
        </p>
        <DisplayTitle size="lg" className="mt-4 max-w-3xl" parts={[{
        text: titleLight,
        tone: 'light'
      }, {
        text: titleBold,
        tone: 'bold'
      }]} />
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink">{description}</p>

        <div className="mt-10">
          <PlanShowcase planIds={planIds} activeId={planId} onSelect={(id) => setPlanId(planId === id ? null : id)} ctaLabel="Ir al registro" onCta={(id) => navigate(`${target}?tipo=${id}#registro`)} />
        </div>
      </div>
    </section>;
}
