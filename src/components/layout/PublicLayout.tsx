import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { SponsorBanner } from '../public/SponsorBanner';

/**
 * Capa pública corporativa. La franja móvil de patrocinadores desaparece
 * en los flujos de registro y pago para no interferir con la conversión.
 */
export function PublicLayout() {
  const location = useLocation();
  const isConversionFlow = location.pathname.includes('/inscripcion');
  return <div className="flex min-h-screen w-full flex-col bg-canvas">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      {!isConversionFlow ? <SponsorBanner surface="corporativo" mode="fixed" /> : null}
      {!isConversionFlow ? <div className="h-16 md:hidden" aria-hidden="true" /> : null}
    </div>;
}