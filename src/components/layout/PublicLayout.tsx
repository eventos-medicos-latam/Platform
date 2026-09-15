import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { SponsorBanner } from '../public/SponsorBanner';
import { ChatWidget } from '../public/ChatWidget';
import { SiteHead, SiteSettingsProvider } from '../../contexts/SiteSettingsContext';

/**
 * Capa pública corporativa. La franja móvil de patrocinadores desaparece
 * en los flujos de registro y pago para no interferir con la conversión.
 * En `/e/:slug` el evento pinta sus propias aliadas; aquí no se reusa Hormobiota.
 */
export function PublicLayout() {
  const location = useLocation();
  const isConversionFlow = location.pathname.includes('/inscripcion');
  const isNovoEvent = /^\/e\//.test(location.pathname);
  return <SiteSettingsProvider>
      <SiteHead />
      <div className="flex min-h-screen w-full flex-col bg-canvas">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      {!isConversionFlow && !isNovoEvent ? <SponsorBanner surface="corporativo" mode="fixed" /> : null}
      {!isConversionFlow && !isNovoEvent ? <div className="h-16 md:hidden" aria-hidden="true" /> : null}
      <ChatWidget />
    </div>
    </SiteSettingsProvider>;
}
