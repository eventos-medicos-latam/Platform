import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PlatformProvider } from './contexts/PlatformContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { EventLayout } from './components/layout/EventLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { PortalLayout } from './components/layout/PortalLayout';
import { ScrollProgress } from './components/motion/SectionTransition';
import { SmoothScroll } from './components/motion/SmoothScroll';
import { ScrollReset } from './components/motion/ScrollReset';
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { Events } from './pages/public/Events';
import { Hormobiota } from './pages/public/Hormobiota';
import { Community } from './pages/public/Community';
import { Allies } from './pages/public/Allies';
import { Content } from './pages/public/Content';
import { Digital } from './pages/public/Digital';
import { Store } from './pages/public/Store';
import { Contact } from './pages/public/Contact';
import { Legal } from './pages/public/Legal';
import { EventHome } from './pages/event/EventHome';
import { EventProgram } from './pages/event/EventProgram';
import { EventFaq } from './pages/event/EventFaq';
import { EventSponsors } from './pages/event/EventSponsors';
import { EventRegistration } from './pages/event/EventRegistration';
import { Login } from './pages/auth/Login';
import { InvitationResponse } from './pages/InvitationResponse';
import { RequireRole } from './components/auth/RequireRole';
import { TrackingScripts } from './components/TrackingScripts';
import { Overview } from './pages/admin/Overview';
import { AgendaAdmin } from './pages/admin/AgendaAdmin';
import { SpeakersAdmin } from './pages/admin/SpeakersAdmin';
import { TicketsAdmin } from './pages/admin/TicketsAdmin';
import { Registrations } from './pages/admin/Registrations';
import { CheckIn } from './pages/admin/CheckIn';
import { Companies } from './pages/admin/Companies';
import { SponsorshipAdmin } from './pages/admin/SponsorshipAdmin';
import { BannerAdmin } from './pages/admin/BannerAdmin';
import { StandsAdmin } from './pages/admin/StandsAdmin';
import { PaymentsAdmin } from './pages/admin/PaymentsAdmin';
import { DocumentsAdmin } from './pages/admin/DocumentsAdmin';
import { Settings } from './pages/admin/Settings';
import { Trash } from './pages/admin/Trash';
import { LiveSessionsAdmin } from './pages/admin/LiveSessionsAdmin';
import { StoreAdmin } from './pages/admin/StoreAdmin';
import { SupportAdmin } from './pages/admin/SupportAdmin';
import { ResourcesAdmin } from './pages/admin/ResourcesAdmin';
import { OrganizationAdmin } from './pages/admin/OrganizationAdmin';
import { PortalHome } from './pages/portal/PortalHome';
import { PortalParticipation } from './pages/portal/PortalParticipation';
import { PortalTeam } from './pages/portal/PortalTeam';
import { PortalDocuments } from './pages/portal/PortalDocuments';
import { PortalPayments } from './pages/portal/PortalPayments';
import { PortalProfile } from './pages/portal/PortalProfile';
import { PortalHelp } from './pages/portal/PortalHelp';
import { PortalResources } from './pages/portal/PortalResources';
function AnimatedRoutes() {
  const location = useLocation();
  return <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Web pública */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/nosotros" element={<About />} />
          <Route path="/hormobiota" element={<Hormobiota />} />
          <Route path="/eventos" element={<Events />} />
          <Route path="/comunidad" element={<Community />} />
          <Route path="/aliados" element={<Allies />} />
          <Route path="/contenido" element={<Content />} />
          <Route path="/digital" element={<Digital />} />
          <Route path="/tienda" element={<Store />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/legal" element={<Legal />} />
        </Route>

        {/* Páginas de evento */}
        <Route path="/eventos/:familySlug/:editionSlug" element={<EventLayout />}>
          <Route index element={<EventHome />} />
          <Route path="agenda" element={<EventProgram />} />
          <Route path="faq" element={<EventFaq />} />
          <Route path="registro" element={<EventSponsors />} />
          {/* Speakers, tickets y ubicación se unificaron en "agenda" (con anclas
              #speakers, #tickets, etc.) — se redirige para no romper enlaces
              guardados. Los stands viven dentro del plan, no como puerta de
              entrada aparte. "programa" y "patrocinadores" son los nombres
              anteriores de estas mismas páginas. */}
          <Route path="programa" element={<Navigate to="../agenda" replace />} />
          <Route path="speakers" element={<Navigate to="../agenda#speakers" replace />} />
          <Route path="tickets" element={<Navigate to="../agenda#tickets" replace />} />
          <Route path="ubicacion" element={<Navigate to="../agenda#ubicacion" replace />} />
          <Route path="patrocinadores" element={<Navigate to="../registro" replace />} />
          <Route path="stands" element={<Navigate to="../registro" replace />} />
          <Route path="inscripcion" element={<EventRegistration />} />
        </Route>

        {/* Acceso */}
        <Route path="/login" element={<Login />} />
        <Route path="/invitacion/:kind/:token" element={<InvitationResponse />} />

        {/* Dashboard administrativo */}
        <Route element={<RequireRole role="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="organizacion" element={<OrganizationAdmin />} />
            <Route path="agenda" element={<AgendaAdmin />} />
            <Route path="speakers" element={<SpeakersAdmin />} />
            <Route path="tickets" element={<TicketsAdmin />} />
            <Route path="registros" element={<Registrations />} />
            <Route path="checkin" element={<CheckIn />} />
            <Route path="formacion-en-vivo" element={<LiveSessionsAdmin />} />
            <Route path="tienda" element={<StoreAdmin />} />
            <Route path="empresas" element={<Companies />} />
            <Route path="patrocinio" element={<SponsorshipAdmin />} />
            <Route path="banner" element={<BannerAdmin />} />
            <Route path="stands" element={<StandsAdmin />} />
            <Route path="pagos" element={<PaymentsAdmin />} />
            <Route path="documentos" element={<DocumentsAdmin />} />
            <Route path="soporte" element={<SupportAdmin />} />
            <Route path="recursos" element={<ResourcesAdmin />} />
            <Route path="papelera" element={<Trash />} />
            <Route path="configuracion" element={<Settings />} />
          </Route>
        </Route>

        {/* Portal de empresas */}
        <Route element={<RequireRole role="empresa" />}>
          <Route path="/portal" element={<PortalLayout />}>
            <Route index element={<PortalHome />} />
            <Route path="participacion" element={<PortalParticipation />} />
            <Route path="equipo" element={<PortalTeam />} />
            <Route path="requerimientos" element={<Navigate to="/portal/perfil#requerimientos" replace />} />
            <Route path="documentos" element={<PortalDocuments />} />
            <Route path="pagos" element={<PortalPayments />} />
            <Route path="ayuda" element={<PortalHelp />} />
            <Route path="recursos" element={<PortalResources />} />
            <Route path="perfil" element={<PortalProfile />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>;
}
export function App() {
  return <PlatformProvider>
      <TrackingScripts />
      <BrowserRouter>
        <SmoothScroll>
          <ScrollReset />
          <ScrollProgress />
          <AnimatedRoutes />
        </SmoothScroll>
      </BrowserRouter>
    </PlatformProvider>;
}