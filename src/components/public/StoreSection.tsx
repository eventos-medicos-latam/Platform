import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon, DownloadIcon, FileTextIcon, PlayCircleIcon, SparklesIcon } from 'lucide-react';
import type { InfoProduct } from '../../types/product';
import { publicInfoProducts } from '../../data/products';
import { formatCop, withVat } from '../../utils/format';
import { Pending } from '../ui/Pending';
import { EASE_EMPHASIS } from '../../utils/motion';
const formatIcon = {
  video: PlayCircleIcon,
  pdf: FileTextIcon,
  mixto: DownloadIcon,
  acceso: SparklesIcon
} as const;
const kindLabels: Record<InfoProduct['kind'], string> = {
  curso: 'Curso',
  memorias: 'Memorias',
  guia: 'Guía',
  plantilla: 'Formatos',
  membresia: 'Membresía'
};

/**
 * Tienda de productos digitales en la Home. La jerarquía es explícita: los dos
 * destacados ocupan el doble de superficie, el resto acompaña en fila.
 */
export function StoreSection() {
  const products = publicInfoProducts();
  const featured = products.filter((product) => product.featured);
  const rest = products.filter((product) => !product.featured);
  if (products.length === 0) return null;
  return <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-shell px-6">
        <motion.div initial={{
        opacity: 0,
        y: 16
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true,
        margin: '-80px'
      }} transition={{
        duration: 0.3,
        ease: EASE_EMPHASIS
      }} className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-support">
              Tienda digital
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(1.9rem,4vw,3.2rem)] font-bold leading-[1.05] tracking-tight text-brand">
              Formación que te llevas
              <span className="block font-normal text-ink-muted">y consultas cuando quieras</span>
            </h2>
          </div>
          <Link to="/tienda" className="group inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-elev2 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
            Ver la tienda
            <ArrowRightIcon size={16} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Destacados */}
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {featured.map((product, index) => {
          const Icon = formatIcon[product.format];
          return <motion.article key={product.id} initial={{
            opacity: 0,
            y: 24
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true,
            margin: '-60px'
          }} transition={{
            duration: 0.3,
            ease: EASE_EMPHASIS,
            delay: index * 0.06
          }} className="card-lift flex flex-col rounded-3xl border border-line bg-canvas p-7 lg:p-8">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand text-white shadow-elev2">
                    <Icon size={22} />
                  </span>
                  <span className="rounded-full bg-brand-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand">
                    {kindLabels[product.kind]}
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-bold leading-snug tracking-tight text-brand">
                  {product.name}
                </h3>
                <p className="mt-2 text-base text-ink-muted">{product.claim}</p>
                <p className="mt-4 text-sm leading-relaxed text-ink">{product.description}</p>

                <ul className="mt-5 grid gap-1.5 sm:grid-cols-2">
                  {product.includes.map((item) => <li key={item} className="flex gap-2 text-sm text-ink">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      {item}
                    </li>)}
                </ul>

                <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-line pt-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                      {product.volumeLabel}
                    </p>
                    {product.price === null ? <div className="mt-1">
                        <Pending note="precio en aprobación" />
                      </div> : <p className="mt-1 text-2xl font-bold text-brand">
                        {formatCop(withVat(product.price, product.vatRate))}
                      </p>}
                  </div>
                  <Link to="/tienda" className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                    {product.price === null ? 'Avísame' : 'Comprar'}
                  </Link>
                </div>
              </motion.article>;
        })}
        </div>

        {/* Resto del catálogo */}
        <ul className="mt-5 grid gap-5 md:grid-cols-3">
          {rest.map((product, index) => {
          const Icon = formatIcon[product.format];
          return <motion.li key={product.id} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true,
            margin: '-60px'
          }} transition={{
            duration: 0.28,
            ease: EASE_EMPHASIS,
            delay: index * 0.05
          }}>
                <Link to="/tienda" className="card-lift flex h-full flex-col rounded-2xl border border-line bg-white p-6">
                  <Icon size={22} className="text-accent" />
                  <span className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    {kindLabels[product.kind]} · {product.volumeLabel}
                  </span>
                  <span className="mt-2 block text-lg font-semibold leading-snug text-brand">
                    {product.name}
                  </span>
                  <span className="mt-2 block text-sm text-ink-muted">{product.claim}</span>
                  <span className="mt-auto pt-5 text-base font-bold text-brand">
                    {product.price === null ? <Pending note="precio en aprobación" /> : formatCop(withVat(product.price, product.vatRate))}
                  </span>
                </Link>
              </motion.li>;
        })}
        </ul>
      </div>
    </section>;
}