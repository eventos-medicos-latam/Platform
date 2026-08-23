import React, { useState } from 'react';
import { PageTransition } from '../../components/motion/PageTransition';
import { contentItems } from '../../data/content';
import { contentKindLabels } from '../../components/public/ContentPreview';
import { formatFullDate } from '../../utils/format';
import type { ContentKind } from '../../types/content';
import { PageHero } from '../../components/public/PageHero';
import { media } from '../../data/media';
const filters: {
  id: ContentKind | 'todos';
  label: string;
}[] = [{
  id: 'todos',
  label: 'Todo'
}, {
  id: 'articulo',
  label: 'Artículos'
}, {
  id: 'video',
  label: 'Videos'
}, {
  id: 'entrevista',
  label: 'Entrevistas'
}, {
  id: 'memoria',
  label: 'Memorias'
}, {
  id: 'recurso',
  label: 'Recursos'
}];
export function Content() {
  const [filter, setFilter] = useState<ContentKind | 'todos'>('todos');
  const published = contentItems.filter((item) => item.status === 'publicado' || item.status === 'aprobado');
  const visible = filter === 'todos' ? published : published.filter((item) => item.kind === filter);
  return <PageTransition>
      <PageHero eyebrow="Contenido" title={[{
      text: 'Material académico,',
      tone: 'bold'
    }, {
      text: 'memorias y recursos',
      tone: 'light'
    }]} lead="Artículos, entrevistas y memorias de cada edición. El contenido en borrador vive en el Dashboard hasta que el comité lo aprueba." image={media.microbiotaNetwork} facts={[{
      label: 'Publicaciones',
      value: String(published.length)
    }]} />

      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-shell px-6 py-12">
          <div className="flex flex-wrap gap-1.5">
            {filters.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150 ease-emphasis ${filter === item.id ? 'bg-brand text-white' : 'bg-canvas text-ink-muted hover:text-brand'}`}>
                {item.label}
              </button>)}
          </div>
        </div>
      </section>

      <section className="tint-teal">
        <div className="mx-auto max-w-shell px-6 py-14">
          {visible.length === 0 ? <div className="rounded-xl border border-dashed border-line bg-white px-6 py-14 text-center">
              <p className="text-base font-medium text-brand">Sin contenido publicado en esta categoría</p>
              <p className="mt-1.5 text-sm text-ink-muted">Pronto se sumará nuevo material.</p>
            </div> : <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((item) => <li key={item.id} className="card-lift flex h-full flex-col rounded-2xl border border-line bg-white p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    {contentKindLabels[item.kind]} · {item.readingTime}
                  </p>
                  <h2 className="mt-3 text-lg font-semibold leading-snug text-brand">{item.title}</h2>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink">{item.excerpt}</p>
                  <div className="mt-auto flex items-center justify-between pt-6 text-sm text-ink-muted">
                    <span>{item.author}</span>
                    <span>{formatFullDate(item.date)}</span>
                  </div>
                </li>)}
            </ul>}
        </div>
      </section>
    </PageTransition>;
}