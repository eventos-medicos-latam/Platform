import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  BuildingIcon, CalendarDaysIcon, CheckCircle2Icon, MapPinIcon,
} from 'lucide-react';
import { PlanShowcase } from '../event/PlanShowcase';
import { DisplayTitle } from '../ui/DisplayTitle';
import { editions } from '../../data/editions';
import type { PlanId } from '../../types/participation';
import { EASE_EMPHASIS, DURATION } from '../../utils/motion';
import { editionMedia, media } from '../../data/media';
import { AllyPlanRequestDrawer } from './AllyPlanRequestDrawer';

const upcomingStatuses = ['proximamente', 'prelanzamiento', 'preventa', 'venta-activa'] as const;
const upcomingEditions = editions.filter((e) =>
  upcomingStatuses.includes(e.status as typeof upcomingStatuses[number])
);

export function AllyPlansSection() {
  const reduce = useReducedMotion();
  const [activeEditionId, setActiveEditionId] = useState(upcomingEditions[0]?.id ?? '');
  const activeEdition = upcomingEditions.find((e) => e.id === activeEditionId) ?? upcomingEditions[0];
  const [activePlanId, setActivePlanId] = useState<PlanId | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

  const openForm = (planId?: PlanId) => {
    setSelectedPlan(planId ?? null);
    setFormOpen(true);
  };

  return (
    <section className="tint-aurora py-20 lg:py-28">
      <div className="mx-auto max-w-shell px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: DURATION.panel, ease: EASE_EMPHASIS }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
            Planes de participación
          </p>
          <DisplayTitle size="lg" className="mt-4 max-w-3xl" parts={[
            { text: 'Elige el evento,', tone: 'bold' },
            { text: 'conoce cómo participar', tone: 'light' },
          ]} />
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink">
            Cada evento tiene sus propios planes y cupos. Selecciona el que te interesa y ve directamente a los planes disponibles.
          </p>
        </motion.div>

        <div className="mt-10 flex flex-wrap gap-3">
          {upcomingEditions.map((edition, index) => {
            const isActive = edition.id === activeEditionId;
            return (
              <motion.button
                key={edition.id} type="button"
                onClick={() => { setActiveEditionId(edition.id); setActivePlanId(null); }}
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.26, ease: EASE_EMPHASIS, delay: index * 0.06 }}
                whileHover={reduce ? undefined : { y: -3 }}
                className={`relative isolate flex items-center gap-4 overflow-hidden rounded-2xl border px-5 py-4 text-left transition-shadow duration-200
                  ${isActive ? 'border-transparent bg-brand text-white shadow-elev4' : 'border-white bg-white/85 shadow-elev2 backdrop-blur hover:shadow-elev3'}`}
              >
                {isActive && (
                  <motion.span layoutId="event-selector-pill"
                    className="absolute inset-0 -z-10 rounded-2xl bg-brand"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                  <img src={editionMedia[edition.id] ?? media.heroAuditorium} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                  <span className={`absolute inset-0 ${isActive ? 'bg-white/10' : 'bg-brand/20'}`} />
                </span>
                <span className="min-w-0">
                  <span className={`block text-[10px] font-bold uppercase tracking-[0.18em] ${isActive ? 'text-white/70' : 'text-ink-muted'}`}>
                    {edition.editionLabel}
                  </span>
                  <span className={`mt-0.5 block text-sm font-bold leading-tight ${isActive ? 'text-white' : 'text-brand'}`}>
                    {edition.name}
                  </span>
                  <span className={`mt-1 flex items-center gap-1.5 text-[11px] font-medium ${isActive ? 'text-white/75' : 'text-ink-muted'}`}>
                    <CalendarDaysIcon size={11} />{edition.dateLabel}
                    <MapPinIcon size={11} className="ml-1" />{edition.venue.city}
                  </span>
                </span>
                {isActive && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto shrink-0 text-white/80">
                    <CheckCircle2Icon size={18} />
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeEditionId}
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: EASE_EMPHASIS }} className="mt-10">
            <PlanShowcase
              activeId={activePlanId}
              onSelect={(id) => setActivePlanId(activePlanId === id ? null : id)}
              ctaLabel="Postularme a este plan"
              onCta={(id) => openForm(id)}
            />
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-0">
          <p className="text-sm text-ink-muted">
            Los precios y cupos pueden variar por edición. El equipo comercial confirma disponibilidad.
          </p>
          <motion.button
            type="button"
            onClick={() => openForm()}
            whileHover={reduce ? undefined : { y: -2 }}
            className="flex shrink-0 items-center gap-2 rounded-full border border-brand/30 bg-white px-5 py-2.5 text-sm font-semibold text-brand shadow-elev1 transition-shadow hover:shadow-elev2"
          >
            <BuildingIcon size={15} />
            Registrar mi empresa
          </motion.button>
        </div>
      </div>

      <AllyPlanRequestDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editionId={activeEdition?.id ?? ''}
        editionName={activeEdition?.name ?? ''}
        planId={selectedPlan}
      />
    </section>
  );
}
