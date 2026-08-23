import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardListIcon, FileTextIcon, LayoutDashboardIcon, LogOutIcon, PackageIcon, UserRoundIcon, UsersIcon, WalletIcon } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { getCompany, openRequirements, portalCompanyId } from '../../data/companies';
import { getEdition } from '../../data/editions';
import { usePlatform } from '../../contexts/PlatformContext';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';
const items = [{
  to: '/portal',
  label: 'Inicio',
  icon: LayoutDashboardIcon,
  end: true
}, {
  to: '/portal/participacion',
  label: 'Mi participación',
  icon: PackageIcon
}, {
  to: '/portal/equipo',
  label: 'Equipo e invitados',
  icon: UsersIcon
}, {
  to: '/portal/requerimientos',
  label: 'Requerimientos',
  icon: ClipboardListIcon
}, {
  to: '/portal/documentos',
  label: 'Documentos y marca',
  icon: FileTextIcon
}, {
  to: '/portal/pagos',
  label: 'Pagos y actividad',
  icon: WalletIcon
}, {
  to: '/portal/perfil',
  label: 'Perfil',
  icon: UserRoundIcon
}];
export function PortalLayout() {
  const {
    session,
    signOut,
    activeEditionId
  } = usePlatform();
  const companyId = session?.companyId ?? portalCompanyId;
  const company = getCompany(companyId);
  const edition = getEdition(activeEditionId);
  const pending = openRequirements(companyId).length;
  const location = useLocation();
  return <div className="flex min-h-screen w-full flex-col bg-canvas">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-brand-deep">
        <div className="mx-auto flex max-w-shell items-center gap-5 px-5 py-3">
          <Link to="/" aria-label="Ir al sitio público">
            <Logo compact />
          </Link>
          <div className="hidden border-l border-white/15 pl-5 sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              Portal de empresas
            </p>
            <p className="text-sm font-semibold text-white">{company?.tradeName}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-white/55 md:block">
              {edition ? `${edition.name} · ${edition.year}` : ''}
            </span>
            <Link to="/" onClick={signOut} className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/75 transition-colors duration-150 ease-emphasis hover:border-white/60 hover:text-white">
              <LogOutIcon size={13} /> Salir
            </Link>
          </div>
        </div>

        <nav aria-label="Secciones del portal" className="border-t border-white/10">
          <ul className="no-scrollbar mx-auto flex max-w-shell gap-1 overflow-x-auto px-5">
            {items.map((item) => <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={({
              isActive
            }) => `relative flex items-center gap-2 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors duration-150 ease-emphasis ${isActive ? 'text-white' : 'text-white/55 hover:text-white'}`}>
                  {({
                isActive
              }) => <>
                      <item.icon size={15} />
                      {item.label}
                      {item.to === '/portal/requerimientos' && pending > 0 ? <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-brand-deep">
                          {pending}
                        </span> : null}
                      {isActive ? <motion.span layoutId="portal-nav-underline" className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-white" transition={{
                  duration: DURATION.dropdown,
                  ease: EASE_EMPHASIS
                }} /> : null}
                    </>}
                </NavLink>
              </li>)}
          </ul>
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
    }} className="mx-auto w-full max-w-shell flex-1 px-5 py-7 lg:py-9">
        <Outlet />
      </motion.main>
    </div>;
}