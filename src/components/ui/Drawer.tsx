import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Panel lateral de detalle. Movimiento funcional: entra desde el borde en
 * 280 ms, sin rebote. Se usa en el Dashboard y en el Portal.
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children
}: DrawerProps) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return <AnimatePresence>
      {open ? <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
          <motion.button type="button" aria-label="Cerrar panel" onClick={onClose} className="absolute inset-0 bg-brand-deep/45 backdrop-blur-[2px]" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} transition={{
        duration: 0.18,
        ease: EASE_EMPHASIS
      }} />
          <motion.aside className="relative flex h-full w-full max-w-xl flex-col border-l border-line bg-white shadow-lift" initial={{
        x: '100%'
      }} animate={{
        x: 0
      }} exit={{
        x: '100%'
      }} transition={{
        duration: DURATION.panel,
        ease: EASE_EMPHASIS
      }}>
            <header className="flex items-start gap-4 border-b border-line px-6 py-5">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-brand">{title}</h2>
                {subtitle ? <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p> : null}
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-canvas hover:text-brand" aria-label="Cerrar">
                <XIcon size={18} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer ? <footer className="border-t border-line px-6 py-4">{footer}</footer> : null}
          </motion.aside>
        </div> : null}
    </AnimatePresence>;
}