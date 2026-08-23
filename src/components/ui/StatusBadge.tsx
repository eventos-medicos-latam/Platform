import React from 'react';
export type BadgeTone = 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger' | 'draft';
const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-brand-soft text-brand',
  info: 'bg-brand-support/10 text-brand-support',
  accent: 'bg-accent/10 text-accent',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-rose-50 text-rose-700',
  draft: 'bg-white text-ink-muted ring-1 ring-line'
};
interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
}
export function StatusBadge({
  label,
  tone = 'neutral',
  dot = false
}: StatusBadgeProps) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {label}
    </span>;
}

/* ---------- Diccionarios de estado del dominio ---------- */

export const editionStatusMeta: Record<string, {
  label: string;
  tone: BadgeTone;
}> = {
  borrador: {
    label: 'Borrador',
    tone: 'draft'
  },
  proximamente: {
    label: 'Próximamente',
    tone: 'info'
  },
  prelanzamiento: {
    label: 'Prelanzamiento',
    tone: 'info'
  },
  preventa: {
    label: 'Preventa',
    tone: 'accent'
  },
  'venta-activa': {
    label: 'Inscripciones abiertas',
    tone: 'success'
  },
  agotado: {
    label: 'Agotado',
    tone: 'warning'
  },
  'en-curso': {
    label: 'En curso',
    tone: 'success'
  },
  cerrado: {
    label: 'Cerrado',
    tone: 'neutral'
  },
  'post-evento': {
    label: 'Post-evento',
    tone: 'neutral'
  },
  historico: {
    label: 'Evento realizado',
    tone: 'neutral'
  }
};
export const publicationStatusMeta: Record<string, {
  label: string;
  tone: BadgeTone;
}> = {
  borrador: {
    label: 'Borrador',
    tone: 'draft'
  },
  'en-revision': {
    label: 'En revisión',
    tone: 'warning'
  },
  aprobado: {
    label: 'Aprobado',
    tone: 'info'
  },
  publicado: {
    label: 'Publicado',
    tone: 'success'
  },
  cerrado: {
    label: 'Cerrado',
    tone: 'neutral'
  }
};
export const speakerStatusMeta: Record<string, {
  label: string;
  tone: BadgeTone;
}> = {
  invitado: {
    label: 'Invitado',
    tone: 'draft'
  },
  'en-negociacion': {
    label: 'En negociación',
    tone: 'warning'
  },
  confirmado: {
    label: 'Confirmado',
    tone: 'info'
  },
  cancelado: {
    label: 'Cancelado',
    tone: 'danger'
  },
  publicado: {
    label: 'Publicado',
    tone: 'success'
  }
};
export const paymentStatusMeta: Record<string, {
  label: string;
  tone: BadgeTone;
}> = {
  pending: {
    label: 'Pending',
    tone: 'warning'
  },
  approved: {
    label: 'Approved',
    tone: 'success'
  },
  declined: {
    label: 'Declined',
    tone: 'danger'
  },
  failed: {
    label: 'Failed',
    tone: 'danger'
  },
  expired: {
    label: 'Expired',
    tone: 'neutral'
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'neutral'
  },
  refunded: {
    label: 'Refunded',
    tone: 'info'
  }
};
export const requirementStatusMeta: Record<string, {
  label: string;
  tone: BadgeTone;
}> = {
  pendiente: {
    label: 'Pendiente',
    tone: 'warning'
  },
  'en-proceso': {
    label: 'En proceso',
    tone: 'info'
  },
  'en-revision': {
    label: 'En revisión',
    tone: 'info'
  },
  'requiere-cambios': {
    label: 'Requiere cambios',
    tone: 'danger'
  },
  aprobado: {
    label: 'Aprobado',
    tone: 'success'
  },
  completado: {
    label: 'Completado',
    tone: 'success'
  }
};
export const standStatusMeta: Record<string, {
  label: string;
  tone: BadgeTone;
}> = {
  disponible: {
    label: 'Disponible',
    tone: 'success'
  },
  reservado: {
    label: 'Reservado',
    tone: 'warning'
  },
  vendido: {
    label: 'Vendido',
    tone: 'info'
  },
  bloqueado: {
    label: 'Bloqueado',
    tone: 'draft'
  },
  'no-disponible': {
    label: 'No disponible',
    tone: 'danger'
  }
};
export const participationStatusMeta: Record<string, {
  label: string;
  tone: BadgeTone;
}> = {
  'en-negociacion': {
    label: 'En negociación',
    tone: 'warning'
  },
  aprobado: {
    label: 'Aprobado',
    tone: 'info'
  },
  publicado: {
    label: 'Publicado',
    tone: 'success'
  },
  cerrado: {
    label: 'Cerrado',
    tone: 'neutral'
  },
  cancelado: {
    label: 'Cancelado',
    tone: 'danger'
  }
};