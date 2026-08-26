import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardListIcon, FileTextIcon, FolderIcon, HelpCircleIcon, LayoutDashboardIcon, LogOutIcon, PackageIcon, UserRoundIcon, UsersIcon, WalletIcon } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { getEdition } from '../../data/editions';
import { usePlatform } from '../../contexts/PlatformContext';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';
import { supabase } from '../../lib/supabaseClient';
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
  label: 'Pagos y facturación',
  icon: WalletIcon
}, {
  to: '/portal/recursos',
  label: 'Recursos',
  icon: FolderIcon
}, {
  to: '/portal/ayuda',
  label: 'Ayuda',
  icon: HelpCircleIcon
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
  const companyId = session?.companyId;
  const edition = getEdition(activeEditionId);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [pending, setPending] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (!companyId) { setCompanyName(null); setPending(0); return; }
    supabase.from('companies').select('trade_name').eq('id', companyId).single().then(({ data }) => setCompanyName(data?.trade_name ?? null));
    supabase.from('requirements').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('edition_id', activeEditionId).in('status', ['pendiente', 'en-proceso', 'en-revision', 'requiere-cambios']).then(({ count }) => setPending(count ?? 0));
  }, [companyId, activeEditionId]);

  const initials = (companyName ?? 'EM').split(' ').filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();

  return <div className="flex min-h-screen w-full bg-canvas">
      {/* Menú lateral */}
      <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col bg-brand-deep lg:flex">
        <div className="grad-futuro relative overflow-hidden border-b border-white/10 px-5 py-5">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[length:22px_22px]" aria-hidden="true" />
          <div className="relative">
            <Link to="/" aria-label="Ir al sitio público">
              <Logo compact />
            </Link>
            <p className="mt-4 text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/45">
              Portal de empresas
            </p>
            <p className="mt-0.5 truncate text-[15px] font-bold text-white">
              {companyName ?? (companyId ? '…' : 'Sin empresa vinculada')}
            </p>
          </div>
        </div>

        <nav aria-label="Secciones del portal" className="flex-1 space-y-0.5 overflow-y-auto px-3.5 py-4">
          {items.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({
          isActive
        }) => `group relative flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold transition-colors duration-150 ease-emphasis ${isActive ? 'text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
              {({
            isActive
          }) => <>
                  {isActive ? <motion.span layoutId="portal-nav-active" className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-support/60 to-[#7c6bc0]/45 ring-1 ring-inset ring-white/10" transition={{
              duration: DURATION.dropdown,
              ease: EASE_EMPHASIS
            }} /> : null}
                  {isActive ? <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-[#ffd166]" aria-hidden="true" /> : null}
                  <item.icon size={16} className="relative shrink-0" />
                  <span className="relative truncate">{item.label}</span>
                  {item.to === '/portal/requerimientos' && pending > 0 ? <span className="relative ml-auto rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-brand-deep">
                      {pending}
                    </span> : null}
                </>}
            </NavLink>)}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="truncate text-[13px] font-bold text-white">{session?.name ?? 'Empresa'}</p>
          <p className="truncate text-[11.5px] text-white/40">{session?.email ?? ''}</p>
          <Link to="/" onClick={signOut} className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-white/55 transition-colors duration-150 ease-emphasis hover:text-white">
            <LogOutIcon size={13} /> Cerrar sesión
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Encabezado móvil / superior */}
        <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur lg:border-line">
          <div className="flex items-center gap-4 px-5 py-3 lg:hidden">
            <Link to="/" aria-label="Ir al sitio público">
              <Logo surface="onLight" compact />
            </Link>
            <p className="truncate text-sm font-semibold text-brand">{companyName ?? 'Portal'}</p>
            <Link to="/" onClick={signOut} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 ease-emphasis hover:border-brand/40">
              <LogOutIcon size={13} /> Salir
            </Link>
          </div>

          <div className="hidden items-center gap-3 px-6 py-3 lg:flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#d6338c]" aria-hidden="true" />
              <span className="text-xs font-bold text-brand">
                {edition ? `${edition.name} · ${edition.year}` : 'Portal'}
              </span>
            </span>
            <span className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-xs font-extrabold text-brand">
              {initials}
            </span>
          </div>

          {/* Navegación horizontal en móvil/tablet */}
          <nav aria-label="Secciones del portal" className="no-scrollbar flex gap-1 overflow-x-auto border-t border-line px-4 py-2 lg:hidden">
            {items.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({
            isActive
          }) => `relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ease-emphasis ${isActive ? 'bg-brand text-white' : 'text-ink-muted hover:text-brand'}`}>
                <item.icon size={13} />
                {item.label}
                {item.to === '/portal/requerimientos' && pending > 0 ? <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-brand-deep">
                    {pending}
                  </span> : null}
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
      }} className="mx-auto w-full max-w-shell flex-1 px-5 py-7 lg:px-8 lg:py-9">
          <Outlet />
        </motion.main>
      </div>
    </div>;
}
