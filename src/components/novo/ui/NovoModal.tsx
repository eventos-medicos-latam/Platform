import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from 'lucide-react';

interface NovoModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

type LenisCtl = { stop: () => void; start: () => void };

function getLenis() {
  return (window as unknown as { lenis?: LenisCtl }).lenis;
}

export function NovoModal({ open, onClose, title, subtitle, width = 560, children, footer }: NovoModalProps) {
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    getLenis()?.stop();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      getLenis()?.start();
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Lenis captura el wheel en window y anula el scroll nativo de contenedores.
  useEffect(() => {
    if (!open) return;
    const onWheel = (e: WheelEvent) => {
      const panel = panelRef.current;
      const el = bodyRef.current;
      if (!panel || !el) return;
      if (!(e.target instanceof Node) || !panel.contains(e.target)) return;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;
      e.preventDefault();
      e.stopPropagation();
      el.scrollTop = Math.min(max, Math.max(0, el.scrollTop + e.deltaY));
    };
    window.addEventListener('wheel', onWheel, { capture: true, passive: false });
    return () => window.removeEventListener('wheel', onWheel, { capture: true });
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          data-lenis-prevent
          className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden p-4 py-6"
          style={{ background: 'rgba(5,10,20,.80)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="novo-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="relative my-auto flex w-full flex-col overflow-hidden rounded-2xl"
            style={{
              maxWidth: width,
              maxHeight: 'calc(100dvh - 3rem)',
              background: '#112035',
              border: '1px solid #1e3450',
              boxShadow: '0 24px 64px rgba(0,0,0,.7)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1e3450', background: '#0d1829' }}>
              <div className="min-w-0 pr-3">
                <h2 id="novo-modal-title" className="text-base font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>
                  {title}
                </h2>
                {subtitle && <p className="text-xs mt-0.5" style={{ color: '#7A9CB8' }}>{subtitle}</p>}
              </div>
              <button type="button" onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors"
                style={{ background: '#182d47', border: '1px solid #1e3450', color: '#7A9CB8' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#E1EAF4'; e.currentTarget.style.background = '#1e3450'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#7A9CB8'; e.currentTarget.style.background = '#182d47'; }}
              >
                <XIcon size={14} />
              </button>
            </div>

            <div
              ref={bodyRef}
              className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
              data-lenis-prevent
              style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', scrollbarWidth: 'thin', scrollbarColor: '#2a4a6b transparent' }}
            >
              {children}
            </div>

            {footer && (
              <div className="flex shrink-0 items-center justify-end gap-3 px-6 py-4"
                style={{ borderTop: '1px solid #1e3450', background: '#0d1829' }}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ─── Botones estándar del footer ─────────────────────────────────────────── */
export function ModalBtn({
  children, onClick, variant = 'secondary', disabled, type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const styles = {
    primary:   { background: 'rgba(0,201,160,.15)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.35)' },
    secondary: { background: '#182d47',             color: '#7A9CB8', border: '1px solid #1e3450'             },
    danger:    { background: 'rgba(242,68,99,.1)',  color: '#F24463', border: '1px solid rgba(242,68,99,.3)'  },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      style={styles[variant]}>
      {children}
    </button>
  );
}

/* ─── Primitivas de formulario ────────────────────────────────────────────── */
export function FormField({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#2a4a6b' }}>
        {label}{required && <span style={{ color: '#F24463' }}> *</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] mt-1" style={{ color: '#3A5470' }}>{hint}</p>}
    </div>
  );
}

export function FormInput({
  value, onChange, placeholder, type = 'text', disabled, prefix,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; disabled?: boolean; prefix?: string;
}) {
  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3.5 text-sm select-none pointer-events-none" style={{ color: '#3A5470' }}>{prefix}</span>
      )}
      <input type={type}
        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors disabled:opacity-50"
        style={{ background: '#0d1829', border: '1px solid #1e3450', color: '#E1EAF4', paddingLeft: prefix ? '2.25rem' : undefined }}
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,201,160,.4)')}
        onBlur={e  => (e.currentTarget.style.borderColor = '#1e3450')}
      />
    </div>
  );
}

export function FormSelect({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none cursor-pointer"
      style={{ background: '#0d1829', border: '1px solid #1e3450', color: '#E1EAF4' }}
      value={value} onChange={e => onChange(e.target.value)}
      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,201,160,.4)')}
      onBlur={e  => (e.currentTarget.style.borderColor = '#1e3450')}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function FormTextarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea rows={rows}
      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none"
      style={{ background: '#0d1829', border: '1px solid #1e3450', color: '#E1EAF4' }}
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,201,160,.4)')}
      onBlur={e  => (e.currentTarget.style.borderColor = '#1e3450')}
    />
  );
}

/* Separador de sección dentro del formulario */
export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold mb-3 pb-2" style={{ color: '#E1EAF4', borderBottom: '1px solid #1e3450' }}>
        {title}
      </p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/* Vista previa de imagen / logo */
export function ImageField({ label, value, onChange, hint }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string;
}) {
  return (
    <FormField label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
          style={{ background: '#182d47', border: '1px solid #1e3450' }}>
          {value
            ? <img src={value} alt="" className="h-full w-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
            : <span className="text-xl">🖼️</span>
          }
        </div>
        <FormInput value={value} onChange={onChange} placeholder="https://…/logo.png" />
      </div>
    </FormField>
  );
}
