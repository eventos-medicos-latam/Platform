import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE_EMPHASIS } from '../../utils/motion';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/** Confirmación genérica, usada sobre todo para "mover a la papelera". */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  onConfirm,
  onCancel,
  loading = false
}: ConfirmDialogProps) {
  return <AnimatePresence>
      {open ? <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
          <motion.button type="button" aria-label="Cancelar" onClick={onCancel} className="absolute inset-0 bg-brand-deep/45 backdrop-blur-[2px]" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} transition={{
        duration: 0.16,
        ease: EASE_EMPHASIS
      }} />
          <motion.div className="relative w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-lift" initial={{
        opacity: 0,
        y: 12
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: 8
      }} transition={{
        duration: 0.18,
        ease: EASE_EMPHASIS
      }}>
            <h2 className="text-base font-semibold text-brand">{title}</h2>
            {description ? <p className="mt-2 text-sm text-ink-muted">{description}</p> : null}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={onCancel} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand/40">
                Cancelar
              </button>
              <button type="button" disabled={loading} onClick={onConfirm} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-rose-700 disabled:opacity-60">
                {loading ? 'Moviendo…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div> : null}
    </AnimatePresence>;
}
