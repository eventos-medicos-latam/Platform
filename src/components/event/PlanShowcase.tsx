import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRightIcon, CheckIcon, SparklesIcon } from 'lucide-react';
import { participationPlans } from '../../data/plans';
import type { PlanId } from '../../types/participation';
import { EASE_EMPHASIS } from '../../utils/motion';
interface PlanShowcaseProps {
  /** Plan abierto. Se controla desde fuera para sincronizar con el configurador. */
  activeId: PlanId | null;
  onSelect: (id: PlanId) => void;
  /** Texto y acción del CTA de cada plan. */
  ctaLabel: string;
  onCta: (id: PlanId) => void;
  /** Subconjunto de planes a exponer. Por defecto, los tres. */
  planIds?: PlanId[];
}

/** Resumen corto que se ve siempre, plegado o desplegado. */
function shortPoints(planId: PlanId): string[] {
  if (planId === 'protagonista') {
    return ['Stand 3 × 2 m', 'Speaker y espacio académico', 'Naming de puente exclusivo'];
  }
  if (planId === 'conexion') {
    return ['Stand 3 × 2 m', 'Ruta 21 días + web + redes', '10 invitados profesionales'];
  }
  return ['Estación con mesa y 2 sillas', '1 pendón roll-up', '2 colaboradores'];
}

/**
 * Los tres planes como acordeón expansible. Al elegir uno, la tarjeta crece,
 * aparece la fotografía de referencia del espacio y el detalle completo.
 */
export function PlanShowcase({
  activeId,
  onSelect,
  ctaLabel,
  onCta,
  planIds
}: PlanShowcaseProps) {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<PlanId | null>(null);
  // En móvil las tarjetas se apilan: repartir el espacio con flex-basis 0
  // colapsaría su altura a cero. El acordeón horizontal solo existe en ancho.
  const [isWide, setIsWide] = useState(true);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsWide(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  const plans = planIds ? participationPlans.filter((plan) => planIds.includes(plan.id)) : participationPlans;
  return <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
      {plans.map((plan) => {
      const isActive = plan.id === activeId;
      const isHero = plan.id === 'protagonista';
      const left = plan.totalInventory === null ? null : plan.totalInventory - plan.sold;
      return <motion.article key={plan.id} layout onMouseEnter={() => setHovered(plan.id)} onMouseLeave={() => setHovered(null)} transition={reduce ? {
        duration: 0
      } : {
        layout: {
          type: 'spring',
          stiffness: 260,
          damping: 30
        }
      }} style={isWide ? {
        flexGrow: isActive ? 2.6 : 1,
        flexBasis: 0
      } : undefined} className={`relative isolate flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] ${isHero ? 'surface-deep text-white shadow-elev4' : 'border border-white bg-white/90 shadow-elev2 backdrop-blur'}`}>
            {/* Sombra interactiva de marca */}
            <motion.span aria-hidden="true" className="pointer-events-none absolute -inset-16 -z-10" animate={{
          opacity: isActive ? 0.55 : hovered === plan.id ? 0.35 : 0.14
        }} transition={{
          duration: 0.25,
          ease: EASE_EMPHASIS
        }} style={{
          background: 'radial-gradient(60% 55% at 50% 0%, rgb(var(--tone-futuro) / 0.5), transparent 70%)'
        }} />
            <span className="grad-futuro absolute inset-x-0 top-0 h-1.5" aria-hidden="true" />

            <button type="button" onClick={() => onSelect(plan.id)} aria-expanded={isActive} className="flex flex-1 flex-col px-7 pb-2 pt-7 text-left">
              {isHero ? <span className="grad-futuro mb-4 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                  <SparklesIcon size={12} /> Plan principal
                </span> : null}

              <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${isHero ? 'text-hb-violet' : 'text-accent'}`}>
                {plan.verb}
              </p>
              <h3 className={`mt-2 text-2xl font-bold leading-tight tracking-tight ${isHero ? 'text-white' : 'text-brand'}`}>
                {plan.name}
              </h3>
              <p className={`mt-2 text-sm leading-relaxed ${isHero ? 'text-white/85' : 'text-ink-muted'}`}>
                {plan.tagline}
              </p>

              <p className={`mt-6 text-3xl font-bold tabular-nums ${isHero ? 'text-white' : 'text-brand'}`}>
                COP ${plan.price.toLocaleString('es-CO')}
              </p>
              <p className={`mt-1 text-xs ${isHero ? 'text-white/70' : 'text-ink-muted'}`}>
                {left !== null ? `${left} cupos disponibles` : plan.availabilityNote}
              </p>

              <ul className="mt-6 space-y-2 border-t pt-5 text-sm" style={{
            borderColor: isHero ? 'rgba(255,255,255,0.16)' : undefined
          }}>
                {shortPoints(plan.id).map((item) => <li key={item} className="flex items-start gap-2.5">
                    <CheckIcon size={16} className={`mt-0.5 shrink-0 ${isHero ? 'text-hb-violet' : 'text-accent'}`} />
                    <span className={isHero ? 'text-white/90' : 'text-ink'}>{item}</span>
                  </li>)}
              </ul>

              {/* Detalle desplegado */}
              <AnimatePresence initial={false}>
                {isActive ? <motion.div initial={reduce ? undefined : {
              opacity: 0,
              height: 0
            }} animate={{
              opacity: 1,
              height: 'auto'
            }} exit={reduce ? undefined : {
              opacity: 0,
              height: 0
            }} transition={{
              duration: 0.28,
              ease: EASE_EMPHASIS
            }} className="overflow-hidden">
                    <motion.figure initial={reduce ? undefined : {
                opacity: 0,
                scale: 0.96
              }} animate={{
                opacity: 1,
                scale: 1
              }} transition={{
                duration: 0.3,
                ease: EASE_EMPHASIS,
                delay: 0.06
              }} className="mt-6 overflow-hidden rounded-2xl shadow-elev3">
                      <img src={plan.mockup} alt={`Referencia del espacio del ${plan.name}`} className="h-52 w-full object-cover sm:h-64" draggable={false} />
                      <figcaption className={`px-4 py-2.5 text-[11px] ${isHero ? 'bg-white/10 text-white/70' : 'bg-canvas text-ink-muted'}`}>
                        Imagen de referencia del montaje. El diseño final lo define cada marca.
                      </figcaption>
                    </motion.figure>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      {plan.benefitGroups.map((group, index) => <motion.div key={group.title} initial={reduce ? undefined : {
                  opacity: 0,
                  y: 14
                }} animate={{
                  opacity: 1,
                  y: 0
                }} transition={{
                  duration: 0.26,
                  ease: EASE_EMPHASIS,
                  delay: 0.1 + Math.min(index, 5) * 0.045
                }}>
                          <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${isHero ? 'text-hb-violet' : 'text-accent'}`}>
                            {group.title}
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {group.items.map((item) => <li key={item} className="flex items-start gap-2">
                                <CheckIcon size={14} className={`mt-0.5 shrink-0 ${isHero ? 'text-white/45' : 'text-ink-muted'}`} />
                                <span className={`text-sm leading-relaxed ${isHero ? 'text-white/85' : 'text-ink'}`}>
                                  {item}
                                </span>
                              </li>)}
                          </ul>
                        </motion.div>)}
                    </div>

                    <p className={`mt-6 text-sm italic leading-relaxed ${isHero ? 'text-white/75' : 'text-ink-muted'}`}>
                      {plan.closing}
                    </p>
                  </motion.div> : null}
              </AnimatePresence>

            </button>

            <div className="mt-auto px-7 pb-7">
              <button type="button" onClick={() => isActive ? onCta(plan.id) : onSelect(plan.id)} className={`group flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition-transform duration-200 ease-emphasis hover:-translate-y-0.5 ${isHero || isActive ? 'grad-futuro text-white shadow-elev3' : 'bg-brand text-white shadow-elev2'}`}>
                {isActive ? ctaLabel : `Ver ${plan.name}`}
                <ArrowRightIcon size={16} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-1" />
              </button>
            </div>
          </motion.article>;
    })}
    </div>;
}