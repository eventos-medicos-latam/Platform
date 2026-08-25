import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DownloadIcon, ExternalLinkIcon, FileTextIcon, PlayCircleIcon, SparklesIcon } from 'lucide-react';
import type { InfoProductKind } from '../../types/product';
import { PageTransition } from '../../components/motion/PageTransition';
import { PageHero } from '../../components/public/PageHero';
import { UpcomingProductSection } from '../../components/public/UpcomingProductSection';
import { supabase } from '../../lib/supabaseClient';
import { formatCop, withVat } from '../../utils/format';
import { Pending } from '../../components/ui/Pending';
import { media } from '../../data/media';
import { EASE_EMPHASIS } from '../../utils/motion';

interface StoreProduct {
  id: string;
  name: string;
  kind: InfoProductKind;
  format: 'video' | 'pdf' | 'mixto' | 'acceso';
  claim: string;
  description: string;
  price: number | null;
  vatRate: number;
  volumeLabel: string;
  includes: string[];
  hotmartCheckoutUrl: string | null;
}
const formatIcon = {
  video: PlayCircleIcon,
  pdf: FileTextIcon,
  mixto: DownloadIcon,
  acceso: SparklesIcon
} as const;
const kindLabels: Record<InfoProductKind, string> = {
  curso: 'Cursos',
  memorias: 'Memorias',
  guia: 'Guías',
  plantilla: 'Formatos',
  membresia: 'Membresías'
};
const filters: ('todos' | InfoProductKind)[] = ['todos', 'curso', 'memorias', 'guia', 'plantilla', 'membresia'];
export function Store() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [filter, setFilter] = useState<'todos' | InfoProductKind>('todos');
  useEffect(() => {
    supabase
      .from('info_products')
      .select('id, name, kind, format, claim, description, price, vat_rate, volume_label, includes, hotmart_checkout_url')
      .then(({ data }) => {
        setProducts((data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          kind: row.kind,
          format: row.format,
          claim: row.claim,
          description: row.description,
          price: row.price,
          vatRate: row.vat_rate,
          volumeLabel: row.volume_label,
          includes: row.includes ?? [],
          hotmartCheckoutUrl: row.hotmart_checkout_url
        })));
      });
  }, []);
  const visible = useMemo(() => filter === 'todos' ? products : products.filter((item) => item.kind === filter), [filter, products]);
  return <PageTransition>
      <PageHero eyebrow="Tienda digital" title={[{
      text: 'Productos digitales',
      tone: 'bold'
    }, {
      text: 'de formación médica',
      tone: 'light'
    }]} lead="Cursos, memorias de congresos, guías de consulta y formatos listos para usar. Acceso inmediato tras el pago." image={media.archiveHall} facts={[{
      label: 'Productos',
      value: String(products.length)
    }, {
      label: 'Acceso',
      value: 'Inmediato'
    }]} />

      <section className="tint-sand py-12">
        <div className="mx-auto max-w-shell px-6">
          <div className="flex flex-wrap items-center gap-1.5">
            {filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-150 ease-emphasis ${filter === item ? 'bg-brand text-white shadow-elev2' : 'bg-white text-ink-muted shadow-elev1 hover:text-brand'}`}>
                {item === 'todos' ? 'Todo el catálogo' : kindLabels[item]}
              </button>)}
          </div>

          <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((product, index) => {
            const Icon = formatIcon[product.format];
            return <motion.li key={product.id} initial={{
              opacity: 0,
              y: 22
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true,
              margin: '-60px'
            }} transition={{
              duration: 0.28,
              ease: EASE_EMPHASIS,
              delay: Math.min(index, 5) * 0.05
            }} className="h-full">
                  <article className="card-lift flex h-full flex-col rounded-2xl border border-line bg-white p-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                        <Icon size={21} />
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                        {product.volumeLabel}
                      </span>
                    </div>

                    <h2 className="mt-5 text-lg font-semibold leading-snug text-brand">
                      {product.name}
                    </h2>
                    <p className="mt-1.5 text-sm text-ink-muted">{product.claim}</p>
                    <p className="mt-3 text-sm leading-relaxed text-ink">{product.description}</p>

                    <ul className="mt-4 space-y-1.5">
                      {product.includes.map((item) => <li key={item} className="flex gap-2 text-sm text-ink">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                          {item}
                        </li>)}
                    </ul>

                    <div className="mt-auto pt-6">
                      {product.price === null ? <div className="mb-3">
                          <Pending note="precio en aprobación" />
                        </div> : <p className="mb-3 text-xl font-bold text-brand">
                          {formatCop(withVat(product.price, product.vatRate))}
                        </p>}
                      {product.hotmartCheckoutUrl ? <a href={product.hotmartCheckoutUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
                          Comprar en Hotmart
                          <ExternalLinkIcon size={14} />
                        </a> : <button type="button" disabled className="w-full cursor-not-allowed rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-muted">
                          {product.price === null ? 'Próximamente' : 'Compra no disponible todavía'}
                        </button>}
                    </div>
                  </article>
                </motion.li>;
          })}
          </ul>
        </div>
      </section>

      <UpcomingProductSection />
    </PageTransition>;
}