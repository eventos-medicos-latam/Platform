import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusIcon } from 'lucide-react';
import type { Edition } from '../../types/event';
import { PageTransition } from '../../components/motion/PageTransition';
import { EventPageHeader } from '../../components/event/EventPageHeader';
import { DisplayTitle } from '../../components/ui/DisplayTitle';
import { editionMedia } from '../../data/media';
import { faqsByEdition } from '../../data/faq';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';

function SectionHeader({
  eyebrow,
  title,
  lead
}: {eyebrow: string;title: string;lead?: string;}) {
  return <div className="max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">{eyebrow}</p>
      <DisplayTitle as="h2" size="md" className="mt-3" parts={[{
      text: title,
      tone: 'bold'
    }]} />
      {lead ? <p className="mt-3 text-base leading-relaxed text-ink">{lead}</p> : null}
    </div>;
}

export function EventFaq() {
  const {
    edition
  } = useOutletContext<{edition: Edition;}>();

  const faqItems = faqsByEdition(edition.id);
  const [openFaqId, setOpenFaqId] = useState<string | null>(faqItems[0]?.id ?? null);

  return <PageTransition>
      <EventPageHeader eyebrow="Preguntas y respuestas" image={editionMedia[edition.id]} parts={[{
      text: 'Todo lo que',
      tone: 'bold'
    }, {
      text: 'suelen preguntar',
      tone: 'light'
    }]} lead="Inscripción, certificación, sede y facturación. Si falta algo, escríbenos." />

      {edition.sections.includes('faq') ? <section className="tint-aurora">
          <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
            <SectionHeader eyebrow="FAQ" title="Preguntas frecuentes" lead="Todo lo que suelen preguntar sobre inscripción, certificación, sede y facturación. Si falta algo, escríbenos." />

            <ul className="mt-9 space-y-3">
              {faqItems.map((item, index) => {
              const isOpen = openFaqId === item.id;
              return <motion.li key={item.id} initial={{
                opacity: 0,
                y: 16
              }} whileInView={{
                opacity: 1,
                y: 0
              }} viewport={{
                once: true,
                margin: '-50px'
              }} transition={{
                duration: 0.24,
                ease: EASE_EMPHASIS,
                delay: Math.min(index, 6) * 0.04
              }} className={`overflow-hidden rounded-2xl border border-white bg-white/90 backdrop-blur transition-shadow duration-200 ease-emphasis ${isOpen ? 'shadow-elev3' : 'shadow-elev1 hover:shadow-elev2'}`}>
                    <button type="button" onClick={() => setOpenFaqId(isOpen ? null : item.id)} aria-expanded={isOpen} className="flex w-full items-center gap-4 px-6 py-5 text-left">
                      <span className={`h-6 w-1 shrink-0 rounded-full transition-colors duration-200 ${isOpen ? 'grad-futuro' : 'bg-line'}`} aria-hidden="true" />
                      <span className="flex-1 text-base font-semibold text-brand">{item.question}</span>
                      <PlusIcon size={18} className={`shrink-0 text-accent transition-transform duration-200 ease-emphasis ${isOpen ? 'rotate-45' : ''}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen ? <motion.div initial={{
                    height: 0,
                    opacity: 0
                  }} animate={{
                    height: 'auto',
                    opacity: 1
                  }} exit={{
                    height: 0,
                    opacity: 0
                  }} transition={{
                    duration: DURATION.panel,
                    ease: EASE_EMPHASIS
                  }} className="overflow-hidden">
                          <p className="max-w-3xl px-6 pb-6 pl-11 text-base leading-relaxed text-ink">
                            {item.answer}
                          </p>
                        </motion.div> : null}
                    </AnimatePresence>
                  </motion.li>;
            })}
            </ul>
          </div>
        </section> : null}
    </PageTransition>;
}
