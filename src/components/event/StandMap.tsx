import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CoffeeIcon, DoorOpenIcon, PresentationIcon, UsersIcon } from 'lucide-react';
import type { PlanFeature, Stand, StandStatus } from '../../types/commerce';
import { EASE_EMPHASIS } from '../../utils/motion';
interface StandMapProps {
  stands: Stand[];
  features: PlanFeature[];
  selectedId?: string;
  /** Categoría resaltada; el resto del plano baja de intensidad. */
  highlightCategory?: string;
  onSelect: (stand: Stand) => void;
}
const statusStyle: Record<StandStatus, string> = {
  disponible: 'border-accent/70 bg-accent/20 text-white hover:bg-accent/35',
  reservado: 'border-amber-300/50 bg-amber-300/12 text-amber-100',
  vendido: 'border-white/15 bg-white/10 text-white/55',
  bloqueado: 'border-white/10 bg-white/5 text-white/35',
  'no-disponible': 'border-white/10 bg-white/5 text-white/30'
};
export const standStatusLabel: Record<StandStatus, string> = {
  disponible: 'Disponible',
  reservado: 'Reservado',
  vendido: 'Vendido',
  bloqueado: 'Bloqueado',
  'no-disponible': 'No disponible'
};
const featureIcon = {
  acceso: DoorOpenIcon,
  tarima: PresentationIcon,
  servicio: CoffeeIcon,
  circulacion: UsersIcon
} as const;

/**
 * Plano interactivo de la zona comercial. Fondo oscuro con rejilla técnica para
 * que los espacios disponibles destaquen por luz propia; cada módulo se eleva
 * al pasar el cursor y se puede seleccionar con teclado.
 */
export function StandMap({
  stands,
  features,
  selectedId,
  highlightCategory,
  onSelect
}: StandMapProps) {
  const reduce = useReducedMotion();
  return <div className="scene-3d">
      <div className="grid-texture relative overflow-hidden rounded-3xl border border-white/10 bg-brand-deep p-4 shadow-elev4 sm:p-6">
        <div className="grid gap-1.5 sm:gap-2" style={{
        gridTemplateColumns: 'repeat(16, minmax(0, 1fr))',
        // Filas de altura fija: los doce stands miden exactamente lo mismo.
        gridTemplateRows: 'repeat(10, 38px)'
      }}>
          {/* Elementos fijos del recinto */}
          {features.map((feature) => {
          const Icon = featureIcon[feature.kind];
          const isAisle = feature.kind === 'circulacion';
          return <div key={feature.id} className={`flex items-center justify-center gap-2 rounded-xl border border-dashed px-2 text-center ${isAisle ? 'border-white/10' : 'border-white/15'}`} style={{
            gridColumn: `${feature.plan.col} / span ${feature.plan.w}`,
            gridRow: `${feature.plan.row} / span ${feature.plan.h}`,
            // El pasillo se lee como calzada, no como módulo vendible.
            backgroundImage: isAisle ? 'repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 10px, transparent 10px 20px)' : undefined
          }} aria-hidden="true">
                <Icon size={14} className="shrink-0 text-white/40" />
                <span className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  {feature.label}
                </span>
              </div>;
        })}

          {/* Módulos vendibles */}
          {stands.map((stand) => {
          const isSelectable = stand.status === 'disponible';
          const isSelected = stand.id === selectedId;
          const dimmed = Boolean(highlightCategory) && stand.category !== highlightCategory;
          return <motion.button key={stand.id} type="button" disabled={!isSelectable} onClick={() => isSelectable && onSelect(stand)} aria-label={`${stand.category} ${stand.number}, ${standStatusLabel[stand.status]}`} aria-pressed={isSelected} className={`group relative flex flex-col justify-between overflow-hidden rounded-lg border p-1.5 text-left transition-colors duration-200 ease-emphasis sm:p-2 ${statusStyle[stand.status]} ${isSelectable ? 'cursor-pointer' : 'cursor-not-allowed'} ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-brand-deep' : ''} ${dimmed ? 'opacity-25' : 'opacity-100'}`} style={{
            gridColumn: `${stand.plan.col} / span ${stand.plan.w}`,
            gridRow: `${stand.plan.row} / span ${stand.plan.h}`
          }} whileHover={reduce || !isSelectable ? undefined : {
            y: -4,
            scale: 1.02
          }} whileTap={reduce ? undefined : {
            scale: 0.98
          }} transition={{
            duration: 0.2,
            ease: EASE_EMPHASIS
          }}>
                <span className="text-sm font-bold tabular-nums sm:text-base">{stand.number}</span>
                <span className="hidden text-[10px] font-medium uppercase tracking-[0.12em] opacity-70 sm:block">
                  {stand.category}
                </span>
                {isSelectable ? <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" /> : null}
              </motion.button>;
        })}
        </div>
      </div>

      {/* Convenciones del plano */}
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {(Object.keys(standStatusLabel) as StandStatus[]).map((status) => <li key={status} className="flex items-center gap-2 text-xs font-medium text-ink-muted">
            <span className={`h-3 w-3 rounded border ${statusStyle[status].split(' ').slice(0, 2).join(' ')}`} aria-hidden="true" />
            {standStatusLabel[status]}
          </li>)}
      </ul>
    </div>;
}