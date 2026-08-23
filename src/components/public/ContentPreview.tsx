import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon } from 'lucide-react';
import { contentItems } from '../../data/content';
import type { ContentKind } from '../../types/content';
import { formatFullDate } from '../../utils/format';
import { OrbitCarousel, type OrbitItem } from '../ui/OrbitCarousel';
export const contentKindLabels: Record<ContentKind, string> = {
  articulo: 'Artículo',
  noticia: 'Noticia',
  video: 'Video',
  entrevista: 'Entrevista',
  memoria: 'Memorias',
  recurso: 'Recurso',
  resumen: 'Resumen'
};
export function ContentPreview() {
  const published = contentItems.filter((item) => item.status === 'publicado');
  if (published.length === 0) return null;
  const items: OrbitItem[] = published.map((item) => ({
    id: item.id,
    label: item.title,
    content: <>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          {contentKindLabels[item.kind]} · {item.readingTime}
        </span>
        <span className="mt-4 block text-xl font-bold leading-snug tracking-tight text-brand">
          {item.title}
        </span>
        <span className="mt-3 block text-sm leading-relaxed text-ink-muted">{item.excerpt}</span>
        <span className="mt-auto flex items-center justify-between border-t border-line pt-5 text-sm">
          <span className="text-ink-muted">{formatFullDate(item.date)}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand">
            Leer <ArrowUpRightIcon size={14} />
          </span>
        </span>
      </>
  }));
  return <section className="tint-teal border-b border-line">
      <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-support">
              Contenido
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(1.9rem,4vw,3.2rem)] font-bold leading-[1.05] tracking-tight text-brand">
              Material académico
              <span className="block font-normal text-ink-muted">entre un evento y el siguiente</span>
            </h2>
          </div>
          <Link to="/contenido" className="text-sm font-semibold text-brand underline decoration-brand/30 underline-offset-4 transition-colors duration-150 ease-emphasis hover:decoration-brand">
            Ver todo el contenido
          </Link>
        </div>

        <OrbitCarousel items={items} surface="light" className="mt-14" />
      </div>
    </section>;
}