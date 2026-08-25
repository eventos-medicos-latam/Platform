import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => void;
  submitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  children: React.ReactNode;
}

/** Shell genérico de modal para los formularios de editar/crear/duplicar del dashboard. */
export function AdminModal({
  open,
  onClose,
  title,
  onSubmit,
  submitting = false,
  error,
  submitLabel = 'Guardar',
  children
}: AdminModalProps) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return <AnimatePresence>
      {open ? <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
          <motion.button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-brand-deep/45 backdrop-blur-[2px]" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} transition={{
        duration: 0.18,
        ease: EASE_EMPHASIS
      }} />
          <motion.div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-lift" initial={{
        opacity: 0,
        y: 16
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: 10
      }} transition={{
        duration: DURATION.panel,
        ease: EASE_EMPHASIS
      }}>
            <header className="flex items-start gap-4 border-b border-line px-6 py-4">
              <h2 className="min-w-0 flex-1 truncate text-lg font-semibold text-brand">{title}</h2>
              <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-canvas hover:text-brand" aria-label="Cerrar">
                <XIcon size={18} />
              </button>
            </header>
            <form onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
              {error ? <p role="alert" className="mx-6 mb-2 text-sm font-medium text-rose-700">
                  {error}
                </p> : null}
              <footer className="flex justify-end gap-3 border-t border-line px-6 py-4">
                <button type="button" onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand/40">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
                  {submitting ? 'Guardando…' : submitLabel}
                </button>
              </footer>
            </form>
          </motion.div>
        </div> : null}
    </AnimatePresence>;
}

export const modalFieldClass = 'w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand';

export function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>;
}
