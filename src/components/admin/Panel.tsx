import React from 'react';
interface PanelProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** primary eleva el panel principal del módulo sobre los secundarios. */
  emphasis?: boolean;
}

/** Contenedor estándar de los módulos del panel. Denso, sin decoración. */
export function Panel({
  title,
  description,
  actions,
  children,
  className = '',
  emphasis = false
}: PanelProps) {
  return <section className={`overflow-hidden rounded-xl border bg-white ${emphasis ? 'border-brand/25 shadow-panel' : 'border-line'} ${className}`}>
      <header className="flex flex-wrap items-start gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className={`font-semibold text-brand ${emphasis ? 'text-lg' : 'text-base'}`}>{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>;
}

/** Encabezado de módulo: título grande + acciones. */
export function ModuleHeader({
  eyebrow,
  title,
  description,
  actions





}: {eyebrow: string;title: string;description?: string;actions?: React.ReactNode;}) {
  return <header className="mb-6 flex flex-wrap items-end gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-brand">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>;
}
export const thClass = 'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted';
export const tdClass = 'px-4 py-3 text-sm text-ink align-middle';