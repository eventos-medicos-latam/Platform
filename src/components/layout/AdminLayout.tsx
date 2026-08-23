import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3Icon, BuildingIcon, CalendarRangeIcon, ChevronDownIcon, FileTextIcon, GalleryHorizontalIcon, LayoutDashboardIcon, LayoutPanelLeftIcon, LogOutIcon, MicIcon, QrCodeIcon, RadioIcon, SettingsIcon, ShoppingBagIcon, TicketIcon, UsersIcon, WalletIcon } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { editions } from '../../data/editions';
import { usePlatform } from '../../contexts/PlatformContext';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';
const groups = [{
  label: 'Operación',
  items: [{
    to: '/admin',
    label: 'Resumen',
    icon: LayoutDashboardIcon,
    end: true
  }, {
    to: '/admin/agenda',
    label: 'Agenda',
    icon: CalendarRangeIcon
  }, {
    to: '/admin/speakers',
    label: 'Speakers',
    icon: MicIcon
  }, {
    to: '/admin/tickets',
    label: 'Tickets',
    icon: TicketIcon
  }, {
    to: '/admin/registros',
    label: 'Registros',
    icon: UsersIcon
  }, {
    to: '/admin/checkin',
    label: 'Check-in',
    icon: QrCodeIcon
  }]
}, {
  label: 'Contenido',
  items: [{
    to: '/admin/formacion-en-vivo',
    label: 'Formación en vivo',
    icon: RadioIcon
  }, {
    to: '/admin/tienda',
    label: 'Tienda digital',
    icon: ShoppingBagIcon
  }]
}, {
  label: 'Comercial',
  items: [{
    to: '/admin/empresas',
    label: 'Empresas',
    icon: BuildingIcon
  }, {
    to: '/admin/patrocinio',
    label: 'Patrocinio',
    icon: BarChart3Icon
  }, {
    to: '/admin/banner',
    label: 'Banner de patrocinadores',
    icon: GalleryHorizontalIcon
  }, {
    to: '/admin/stands',
    label: 'Stands',
    icon: LayoutPanelLeftIcon
  }, {
    to: '/admin/pagos',
    label: 'Pagos',
    icon: WalletIcon
  }, {
    to: '/admin/documentos',
    label: 'Documentos',
    icon: FileTextIcon
  }]
}, {
  label: 'Sistema',
  items: [{
    to: '/admin/configuracion',
    label: 'Configuración',
    icon: SettingsIcon
  }]
}];
export function AdminLayout() {
  const {
    activeEditionId,
    setActiveEditionId,
    session,
    signOut
  } = usePlatform();
  const [editionOpen, setEditionOpen] = useState(false);
  const location = useLocation();
  const active = editions.find((edition) => edition.id === activeEditionId) ?? editions[0];
  return <div className="flex min-h-screen w-full bg-canvas" style={{
    ['--accent-rgb' as string]: active?.accentRgb ?? '28 95 140'
  }}>
      {/* Barra lateral */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line bg-brand-deep lg:flex">
        <div className="border-b border-white/10 px-5 py-4">
          <Link to="/" aria-label="Ir al sitio público">
            <Logo compact />
          </Link>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Panel administrativo
          </p>
        </div>

        <nav aria-label="Módulos" className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((group) => <div key={group.label} className="mb-5">
              <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => <li key={item.to}>
                    <NavLink to={item.to} end={item.end} className={({
                isActive
              }) => `relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150 ease-emphasis ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                      {({
                  isActive
                }) => <>
                          {isActive ? <motion.span layoutId="admin-nav-marker" className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" transition={{
                    duration: DURATION.dropdown,
                    ease: EASE_EMPHASIS
                  }} /> : null}
                          <item.icon size={16} className="shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </>}
                    </NavLink>
                  </li>)}
              </ul>
            </div>)}
        </nav>

        <div className="border-t border-white/10 px-4 py-3">
          <p className="text-sm font-medium text-white">{session?.name ?? 'Equipo interno'}</p>
          <p className="text-xs text-white/45">{session?.email ?? 'admin@eventosmedicoslatam.com'}</p>
          <Link to="/" onClick={signOut} className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white">
            <LogOutIcon size={13} /> Cerrar sesión
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Encabezado con selector de edición activa */}
        <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
          <div className="flex items-center gap-4 px-5 py-3">
            <div className="relative">
              <button type="button" onClick={() => setEditionOpen((open) => !open)} aria-expanded={editionOpen} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand/40">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                {active ? `${active.name} · ${active.year}` : 'Edición'}
                <ChevronDownIcon size={15} className="text-ink-muted" />
              </button>
              {editionOpen ? <motion.ul initial={{
              opacity: 0,
              y: -4
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: DURATION.dropdown,
              ease: EASE_EMPHASIS
            }} className="absolute left-0 top-full z-30 mt-1.5 w-64 overflow-hidden rounded-lg border border-line bg-white shadow-panel">
                  {editions.map((edition) => <li key={edition.id}>
                      <button type="button" onClick={() => {
                  setActiveEditionId(edition.id);
                  setEditionOpen(false);
                }} className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition-colors duration-150 ease-emphasis hover:bg-canvas ${edition.id === activeEditionId ? 'font-semibold text-brand' : 'text-ink'}`}>
                        <span>
                          {edition.name} · {edition.year}
                        </span>
                        {edition.id === activeEditionId ? <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" /> : null}
                      </button>
                    </li>)}
                </motion.ul> : null}
            </div>

            <p className="hidden text-xs text-ink-muted md:block">
              Todos los módulos filtran por esta edición
            </p>

            <div className="ml-auto flex items-center gap-2">
              <Link to="/" className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition-colors duration-150 ease-emphasis hover:border-brand/40">
                Ver sitio público
              </Link>
              <Link to="/portal" className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
                Portal de empresas
              </Link>
            </div>
          </div>

          {/* Navegación móvil del panel */}
          <nav aria-label="Módulos" className="no-scrollbar flex gap-1 overflow-x-auto border-t border-line px-4 py-2 lg:hidden">
            {groups.flatMap((group) => group.items).map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({
            isActive
          }) => `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${isActive ? 'bg-brand text-white' : 'text-ink-muted'}`}>
                {item.label}
              </NavLink>)}
          </nav>
        </header>

        <motion.main key={location.pathname} initial={{
        opacity: 0,
        y: 6
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: DURATION.page,
        ease: EASE_EMPHASIS
      }} className="flex-1 px-5 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </motion.main>
      </div>
    </div>;
}