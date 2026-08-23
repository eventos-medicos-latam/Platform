import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon } from 'lucide-react';
import type { InfoProduct } from '../../types/product';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { infoProducts, launchStageLabels, launchStages, upcomingProduct } from '../../data/products';
import { formatCop, withVat } from '../../utils/format';
import { publicationStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { Pending } from '../../components/ui/Pending';
import { EASE_EMPHASIS } from '../../utils/motion';
const kindLabels: Record<InfoProduct['kind'], string> = {
  curso: 'Curso',
  memorias: 'Memorias',
  guia: 'Guía',
  plantilla: 'Formatos',
  membresia: 'Membresía'
};

/** Catálogo digital y producto en desarrollo, en un solo módulo. */
export function StoreAdmin() {
  const [products, setProducts] = useState<InfoProduct[]>(infoProducts);
  const stageIndex = launchStages.indexOf(upcomingProduct.stage);
  function toggleFeatured(id: string) {
    setProducts((current) => current.map((item) => item.id === id ? {
      ...item,
      featured: !item.featured
    } : item));
  }
  return <>
      <ModuleHeader eyebrow="Contenido" title="Tienda digital" description="Catálogo de productos digitales y estado del producto en desarrollo. Un producto sin precio aprobado no se publica con valor." actions={<button type="button" className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
            <PlusIcon size={15} /> Nuevo producto
          </button>} />

      <Panel emphasis title={`${products.length} productos en catálogo`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="bg-canvas">
              <tr>
                <th className={thClass}>Producto</th>
                <th className={thClass}>Tipo</th>
                <th className={thClass}>Formato</th>
                <th className={thClass}>Volumen</th>
                <th className={thClass}>Precio</th>
                <th className={thClass}>Precio final</th>
                <th className={thClass}>Estado</th>
                <th className={thClass}>Destacado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((product) => {
              const meta = publicationStatusMeta[product.status];
              return <tr key={product.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-medium text-brand`}>{product.name}</td>
                    <td className={tdClass}>{kindLabels[product.kind]}</td>
                    <td className={`${tdClass} capitalize`}>{product.format}</td>
                    <td className={`${tdClass} text-xs text-ink-muted`}>{product.volumeLabel}</td>
                    <td className={tdClass}>
                      {product.price === null ? <Pending /> : formatCop(product.price)}
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      {product.price === null ? '—' : formatCop(withVat(product.price, product.vatRate))}
                    </td>
                    <td className={tdClass}>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </td>
                    <td className={tdClass}>
                      <button type="button" onClick={() => toggleFeatured(product.id)} aria-pressed={Boolean(product.featured)} className={`h-6 w-11 rounded-full p-0.5 transition-colors duration-200 ease-emphasis ${product.featured ? 'bg-accent' : 'bg-line'}`}>
                        <motion.span className="block h-5 w-5 rounded-full bg-white shadow-elev1" animate={{
                      x: product.featured ? 20 : 0
                    }} transition={{
                      duration: 0.2,
                      ease: EASE_EMPHASIS
                    }} />
                      </button>
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Producto en desarrollo */}
      <div className="mt-6">
        <Panel title={upcomingProduct.name} description={`${upcomingProduct.category} · comunicado como próximamente`}>
          <div className="grid gap-6 p-5 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                Etapa de desarrollo
              </p>
              <ol className="mt-3 grid gap-2 sm:grid-cols-4">
                {launchStages.map((stage, index) => {
                const done = index <= stageIndex;
                return <li key={stage}>
                      <div className={`h-1.5 rounded-full ${done ? 'bg-accent' : 'bg-line'}`} aria-hidden="true" />
                      <p className={`mt-2 text-xs font-medium ${index === stageIndex ? 'text-accent' : done ? 'text-ink' : 'text-ink-muted'}`}>
                        {launchStageLabels[stage]}
                      </p>
                    </li>;
              })}
              </ol>

              <dl className="mt-6 divide-y divide-line border-y border-line">
                {[{
                label: 'Lanzamiento estimado',
                value: upcomingProduct.launchWindow
              }, {
                label: 'Pioneros registrados',
                value: String(upcomingProduct.pioneers)
              }, {
                label: 'Estado de publicación',
                value: publicationStatusMeta[upcomingProduct.status].label
              }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-sm text-ink-muted">{row.label}</dt>
                    <dd className="text-sm font-semibold text-brand">
                      {row.value === 'PENDIENTE' ? <Pending /> : row.value}
                    </dd>
                  </div>)}
              </dl>
            </div>

            <div className="rounded-xl border border-line bg-canvas p-4">
              <h3 className="text-sm font-semibold text-brand">Restricciones de comunicación</h3>
              <ul className="mt-3 space-y-2 text-sm text-ink">
                <li>No se publica composición hasta cerrar formulación.</li>
                <li>No se publica claim clínico sin respaldo documentado.</li>
                <li>No se abre preventa sin registro sanitario en trámite.</li>
                <li>El registro de pioneros es informativo, no es una compra.</li>
              </ul>
            </div>
          </div>
        </Panel>
      </div>
    </>;
}