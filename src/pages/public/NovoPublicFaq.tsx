import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusIcon } from 'lucide-react';
import { EventPageHeader } from '../../components/event/EventPageHeader';
import { PageTransition } from '../../components/motion/PageTransition';
import { DisplayTitle } from '../../components/ui/DisplayTitle';
import { media } from '../../data/media';
import { getPublicEventWeb } from '../../lib/novo/events';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';
import { EventFaq } from '../event/EventFaq';
import type { NovoPublicOutlet } from './NovoPublicEventLayout';

export function NovoPublicFaq() {
  const { edition } = useOutletContext<NovoPublicOutlet>();
  if (edition) return <EventFaq />;
  return <NovoFaqFallback />;
}

function NovoFaqFallback() {
  const { event } = useOutletContext<NovoPublicOutlet>();
  const [items, setItems] = useState<{ q: string; a: string }[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    getPublicEventWeb(event.id).then((web) => {
      const next = (web?.content.faq_items ?? []).filter((item) => item.q.trim());
      setItems(next);
      setOpenId(next[0] ? '0' : null);
    });
  }, [event.id]);

  return (
    <PageTransition>
      <EventPageHeader
        eyebrow="Preguntas y respuestas"
        image={event.cover_image_url || media.networking}
        parts={[{ text: 'Todo lo que', tone: 'bold' }, { text: 'suelen preguntar', tone: 'light' }]}
        lead="Inscripción, certificación, sede y facturación. Si falta algo, escríbenos."
      />
      <section className="tint-aurora">
        <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">FAQ</p>
          <DisplayTitle as="h2" size="md" className="mt-3" parts={[{ text: 'Preguntas frecuentes', tone: 'bold' }]} />
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink">
            Todo lo que suelen preguntar sobre inscripción, certificación, sede y facturación. Si falta algo, escríbenos.
          </p>
          {items.length > 0 ? (
            <ul className="mt-9 space-y-3">
              {items.map((item, index) => {
                const id = String(index);
                const isOpen = openId === id;
                return (
                  <motion.li
                    key={id}
                    className={`overflow-hidden rounded-2xl border border-white bg-white/90 backdrop-blur transition-shadow duration-200 ease-emphasis ${
                      isOpen ? 'shadow-elev3' : 'shadow-elev1 hover:shadow-elev2'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-4 px-6 py-5 text-left"
                    >
                      <span className={`h-6 w-1 shrink-0 rounded-full transition-colors duration-200 ${isOpen ? 'grad-futuro' : 'bg-line'}`} aria-hidden="true" />
                      <span className="flex-1 text-base font-semibold text-brand">{item.q}</span>
                      <PlusIcon size={18} className={`shrink-0 text-accent transition-transform duration-200 ease-emphasis ${isOpen ? 'rotate-45' : ''}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: DURATION.panel, ease: EASE_EMPHASIS }}
                          className="overflow-hidden"
                        >
                          <p className="max-w-3xl px-6 pb-6 pl-11 text-base leading-relaxed text-ink whitespace-pre-line">{item.a}</p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </section>
    </PageTransition>
  );
}
