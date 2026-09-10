import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { NovoShell } from './components/novo/layout/NovoShell';
import { NovoOverview } from './pages/novo/NovoOverview';
import { NovoEvents } from './pages/novo/NovoEvents';
import { NovoRegistros } from './pages/novo/NovoRegistros';
import { NovoEmpresas } from './pages/novo/NovoEmpresas';
import { NovoProductos } from './pages/novo/NovoProductos';
import { NovoStands } from './pages/novo/NovoStands';
import { NovoPagos } from './pages/novo/NovoPagos';
import { NovoScanner } from './pages/novo/NovoScanner';
import { NovoAnalitica } from './pages/novo/NovoAnalitica';
import { NovoDocumentos } from './pages/novo/NovoDocumentos';
import { NovoConfiguracion } from './pages/novo/NovoConfiguracion';
import { NovoPapelera } from './pages/novo/NovoPapelera';
import { NovoEventShell } from './components/novo/layout/NovoEventShell';
import { NovoEventResumen } from './pages/novo/event/NovoEventResumen';
import { NovoSpeakers } from './pages/novo/NovoSpeakers';
import { NovoSitio } from './pages/novo/NovoSitio';
import { NovoDigital } from './pages/novo/NovoDigital';
import { NovoSoporte } from './pages/novo/NovoSoporte';
import { NovoEventInscripciones } from './pages/novo/event/NovoEventInscripciones';
import { NovoEventAgenda } from './pages/novo/event/NovoEventAgenda';
import { NovoEventPatrocinadores } from './pages/novo/event/NovoEventPatrocinadores';
import { NovoEventStands } from './pages/novo/event/NovoEventStands';
import { NovoEventInformacion } from './pages/novo/event/NovoEventInformacion';
import { NovoEventComunicaciones } from './pages/novo/event/NovoEventComunicaciones';
import { NovoEventWeb } from './pages/novo/event/NovoEventWeb';
import { NovoEventConfiguracion } from './pages/novo/event/NovoEventConfiguracion';
import { NovoEventProductos } from './pages/novo/event/NovoEventProductos';
import { NovoEventTickets } from './pages/novo/event/NovoEventTickets';
import { NovoEventParticipaciones } from './pages/novo/event/NovoEventParticipaciones';
import { NovoPublicEvent } from './pages/public/NovoPublicEvent';
import { NovoPublicEventLayout } from './pages/public/NovoPublicEventLayout';
import { NovoPublicAgenda } from './pages/public/NovoPublicAgenda';
import { NovoPublicAllies } from './pages/public/NovoPublicAllies';
import { NovoPublicFaq } from './pages/public/NovoPublicFaq';
import { NovoPublicRegister } from './pages/public/NovoPublicRegister';
import { PlatformProvider } from './contexts/PlatformContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { EventLayout } from './components/layout/EventLayout';
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
import { Speakers } from './pages/public/Speakers';
import { SpeakerPage } from './pages/public/SpeakerPage';
import { HabitosAlPlato } from './pages/public/HabitosAlPlato';
import { PortalSpeakers } from './pages/portal/PortalSpeakers';
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
import { PortalHome } from './pages/portal/PortalHome';
import { PortalParticipation } from './pages/portal/PortalParticipation';
import { PortalTeam } from './pages/portal/PortalTeam';
import { PortalDocuments } from './pages/portal/PortalDocuments';
import { PortalPayments } from './pages/portal/PortalPayments';
import { PortalProfile } from './pages/portal/PortalProfile';
import { PortalHelp } from './pages/portal/PortalHelp';
import { PortalResources } from './pages/portal/PortalResources';
import { SpeakerLayout } from './components/layout/SpeakerLayout';
import { SpeakerHome } from './pages/speaker/SpeakerHome';
import { SpeakerRegister } from './pages/speaker/SpeakerRegister';
import { SpeakerPerfil } from './pages/speaker/SpeakerPerfil';
import { SpeakerExperiencia } from './pages/speaker/SpeakerExperiencia';
import { SpeakerPonencias } from './pages/speaker/SpeakerPonencias';
import { SpeakerVisibilidad } from './pages/speaker/SpeakerVisibilidad';
import { SpeakerSolicitudes } from './pages/speaker/SpeakerSolicitudes';
function AnimatedRoutes() {
  return <Routes>
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
          <Route path="/speakers" element={<Speakers />} />
          <Route path="/speakers/:slug" element={<SpeakerPage />} />
          <Route path="/habitos-al-plato" element={<HabitosAlPlato />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/e/:slug" element={<NovoPublicEventLayout />}>
            <Route index element={<NovoPublicEvent />} />
            <Route path="agenda" element={<NovoPublicAgenda />} />
            <Route path="aliados" element={<NovoPublicAllies />} />
            <Route path="registro" element={<Navigate to="../aliados" replace />} />
            <Route path="faq" element={<NovoPublicFaq />} />
            <Route path="inscripcion" element={<NovoPublicRegister />} />
          </Route>
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

        {/* Admin Hormobiota (legacy) → operación Novo */}
        <Route path="/admin" element={<Navigate to="/novo" replace />} />
        <Route path="/admin/*" element={<Navigate to="/novo" replace />} />

        {/* Registro de speakers — fuera del layout autenticado */}
        <Route path="/speaker/registro" element={<SpeakerRegister />} />

        {/* Portal de speakers */}
        <Route path="/speaker" element={<SpeakerLayout />}>
          <Route index element={<SpeakerHome />} />
          <Route path="perfil"      element={<SpeakerPerfil />} />
          <Route path="experiencia" element={<SpeakerExperiencia />} />
          <Route path="ponencias"   element={<SpeakerPonencias />} />
          <Route path="visibilidad" element={<SpeakerVisibilidad />} />
          <Route path="solicitudes" element={<SpeakerSolicitudes />} />
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
            <Route path="speakers" element={<PortalSpeakers />} />
            <Route path="recursos" element={<PortalResources />} />
            <Route path="perfil" element={<PortalProfile />} />
          </Route>
        </Route>

        {/* Operación: panel Novo (reemplaza /admin) */}
        <Route element={<RequireRole role="admin" />}>
          <Route path="/novo" element={<NovoShell />}>
            <Route index element={<NovoOverview />} />
            <Route path="eventos" element={<NovoEvents />} />
            <Route path="eventos/:id" element={<NovoEventShell />}>
              <Route index                   element={<NovoEventResumen />} />
              <Route path="informacion"      element={<NovoEventInformacion />} />
              <Route path="agenda"           element={<NovoEventAgenda />} />
              <Route path="tickets"          element={<NovoEventTickets />} />
              <Route path="inscripciones"    element={<NovoEventInscripciones />} />
              <Route path="participaciones"  element={<NovoEventParticipaciones />} />
              <Route path="productos"        element={<NovoEventProductos />} />
              <Route path="patrocinadores"   element={<NovoEventPatrocinadores />} />
              <Route path="stands"           element={<NovoEventStands />} />
              <Route path="comunicaciones"   element={<NovoEventComunicaciones />} />
              <Route path="web"              element={<NovoEventWeb />} />
              <Route path="configuracion"    element={<NovoEventConfiguracion />} />
            </Route>
            <Route path="registros"     element={<NovoRegistros />} />
            <Route path="speakers"      element={<NovoSpeakers />} />
            <Route path="empresas"      element={<NovoEmpresas />} />
            <Route path="productos"     element={<NovoProductos />} />
            <Route path="stands"        element={<NovoStands />} />
            <Route path="pagos"         element={<NovoPagos />} />
            <Route path="digital"       element={<NovoDigital />} />
            <Route path="sitio"         element={<NovoSitio />} />
            <Route path="documentos"    element={<NovoDocumentos />} />
            <Route path="soporte"       element={<NovoSoporte />} />
            <Route path="papelera"      element={<NovoPapelera />} />
            <Route path="configuracion" element={<NovoConfiguracion />} />
            <Route path="scanner"       element={<NovoScanner />} />
            <Route path="analitica"     element={<NovoAnalitica />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>;
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