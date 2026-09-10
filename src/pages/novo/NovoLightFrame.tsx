import React from 'react';

/** Envuelve módulos del admin Hormobiota (claro) dentro del shell Novo (oscuro). */
export function NovoLightFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-canvas text-ink">
      <div className="px-4 py-5 lg:px-6 lg:py-6">{children}</div>
    </div>
  );
}
