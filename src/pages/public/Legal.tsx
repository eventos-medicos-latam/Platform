import React, { useState } from 'react';
import { PageTransition } from '../../components/motion/PageTransition';
import { legalDocuments } from '../../data/content';
import { publicationStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { Pending } from '../../components/ui/Pending';
export function Legal() {
  const [activeId, setActiveId] = useState(legalDocuments[0]?.id ?? '');
  const active = legalDocuments.find((doc) => doc.id === activeId) ?? legalDocuments[0];
  return <PageTransition>
      <section className="bg-white">
        <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-support">
            Legal
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-brand sm:text-5xl">
            Tratamiento de datos, términos y compras
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink">
            La plataforma opera en Colombia. Los documentos en revisión se muestran señalizados: nada se
            presenta como definitivo antes de la aprobación legal.
          </p>

          <div className="mt-12 grid gap-8 lg:grid-cols-[280px_1fr]">
            <nav aria-label="Documentos legales">
              <ul className="space-y-1.5">
                {legalDocuments.map((doc) => {
                const meta = publicationStatusMeta[doc.status];
                const isActive = doc.id === active?.id;
                return <li key={doc.id}>
                      <button type="button" onClick={() => setActiveId(doc.id)} className={`w-full rounded-lg border px-4 py-3 text-left transition-colors duration-150 ease-emphasis ${isActive ? 'border-brand bg-canvas' : 'border-line bg-white hover:border-brand/30'}`}>
                        <span className="block text-sm font-semibold text-brand">{doc.title}</span>
                        <span className="mt-2 flex items-center gap-2">
                          <StatusBadge label={meta.label} tone={meta.tone} />
                        </span>
                      </button>
                    </li>;
              })}
              </ul>
            </nav>

            {active ? <article className="rounded-xl border border-line bg-canvas p-7 lg:p-9">
                <h2 className="text-2xl font-bold tracking-tight text-brand">{active.title}</h2>
                <p className="mt-2 text-sm text-ink-muted">{active.summary}</p>
                <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
                  Última actualización: <Pending />
                </p>
                <div className="mt-7 space-y-4 text-base leading-relaxed text-ink">
                  {active.body.map((paragraph) => <p key={paragraph.slice(0, 24)}>{paragraph}</p>)}
                </div>
              </article> : null}
          </div>
        </div>
      </section>
    </PageTransition>;
}