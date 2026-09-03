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

export function NovoModal({ open, onClose, title, subtitle, width = 560, children, footer }: NovoModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(5,10,20,.75)', backdropFilter: 'blur(4px)' }}
          />
          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="fixed z-50 overflow-hidden rounded-2xl"
            style={{
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width, maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 48px)',
              background: '#112035',
              border: '1px solid #1e3450',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom: '1px solid #1e3450' }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>
                  {title}
                </h2>
                {subtitle && <p className="text-xs mt-0.5" style={{ color: '#7A9CB8' }}>{subtitle}</p>}
              </div>
              <button onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
                style={{ background: '#182d47', border: '1px solid #1e3450', color: '#7A9CB8' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#E1EAF4')}
                onMouseLeave={e => (e.currentTarget.style.color = '#7A9CB8')}
              >
                <XIcon size={14} />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {/* Footer */}
            {footer && (
              <div className="shrink-0 px-6 py-4 flex items-center justify-end gap-3"
                style={{ borderTop: '1px solid #1e3450', background: '#0d1829' }}>
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* Botones estándar del footer del modal */
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
    primary:   { background: 'rgba(0,201,160,.15)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.3)'  },
    secondary: { background: '#182d47',             color: '#7A9CB8', border: '1px solid #1e3450'             },
    danger:    { background: 'rgba(242,68,99,.1)',  color: '#F24463', border: '1px solid rgba(242,68,99,.25)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
      style={styles[variant]}>
      {children}
    </button>
  );
}

/* Campo de formulario reutilizable */
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

/* Input estándar */
export function FormInput({
  value, onChange, placeholder, type = 'text', disabled,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input type={type}
      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors disabled:opacity-50"
      style={{ background: '#0d1829', border: '1px solid #1e3450', color: '#E1EAF4' }}
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,201,160,.4)')}
      onBlur={e  => (e.currentTarget.style.borderColor = '#1e3450')}
    />
  );
}

/* Select estándar */
export function FormSelect({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
      style={{ background: '#0d1829', border: '1px solid #1e3450', color: '#E1EAF4' }}
      value={value} onChange={e => onChange(e.target.value)}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* Textarea estándar */
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
