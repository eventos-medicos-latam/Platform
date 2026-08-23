import React from 'react';
import { PENDING_LABEL } from '../../utils/format';
interface PendingProps {
  /** Texto que reemplaza al valor real mientras no está confirmado. */
  note?: string;
  inline?: boolean;
  /** dark: sobre superficies oscuras, donde el borde claro no se lee. */
  surface?: 'light' | 'dark';
}

/**
 * Marca de dato estructuralmente esperado pero sin confirmar.
 * Nunca se usa para datos comercialmente sensibles: esos no salen del Dashboard.
 */
export function Pending({
  note,
  inline = true,
  surface = 'light'
}: PendingProps) {
  if (inline) {
    const tone = surface === 'dark' ? 'border-white/25 bg-white/10 text-white/70' : 'border-line bg-white text-ink-muted';
    return <span className={`inline-flex items-center gap-1.5 rounded border border-dashed px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${tone}`}>
        {PENDING_LABEL}
        {note ? <span className="normal-case tracking-normal opacity-80">· {note}</span> : null}
      </span>;
  }
  return <div className="rounded-lg border border-dashed border-line bg-white px-4 py-3 text-sm text-ink-muted">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{PENDING_LABEL}</span>
      {note ? <p className="mt-1">{note}</p> : null}
    </div>;
}

/** Devuelve el valor o la marca PENDIENTE si viene vacío/marcado. */
export function pendingOr(value: string | null | undefined): React.ReactNode {
  if (!value || value === PENDING_LABEL || value === '—') return <Pending />;
  return value;
}