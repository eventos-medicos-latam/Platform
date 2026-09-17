import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDaysIcon, LayoutDashboardIcon, MenuIcon, QrCodeIcon, XIcon,
} from 'lucide-react';
import { NOVO_NAV, NovoSidebar } from './NovoSidebar';
import '../ui/tokens.css';

const SIDEBAR_BG = '#0a2140';
const SIDEBAR_BORDER = 'rgba(255,255,255,0.08)';

const DOCK = [
  { to: '/novo', label: 'Inicio', icon: LayoutDashboardIcon, end: true },
  { to: '/novo/eventos', label: 'Eventos', icon: CalendarDaysIcon, end: false },
  { to: '/novo/scanner', label: 'Scanner', icon: QrCodeIcon, end: false },
] as const;

function pageTitle(pathname: string) {
  if (pathname.startsWith('/novo/eventos/') && pathname !== '/novo/eventos') return 'Evento';
  for (const group of NOVO_NAV) {
    for (const item of group.items) {
      if (item.end) {
        if (pathname === item.to) return item.label;
      } else if (pathname === item.to || pathname.startsWith(`${item.to}/`)) {
        return item.label;
      }
    }
  }
  return 'EML';
}

export function NovoShell() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isEventDetail = /^\/novo\/eventos\/[^/]+/.test(location.pathname);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  return (
    <div
      className="flex min-h-dvh w-full"
      style={{ background: '#0d1829', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      <NovoSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 lg:hidden"
          style={{ background: 'rgba(10,33,64,0.97)', borderBottom: `1px solid ${SIDEBAR_BORDER}`, backdropFilter: 'blur(12px)' }}
        >
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#E1EAF4' }}
          >
            <MenuIcon size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#00C9A0' }}>EML Platform</p>
            <p className="truncate text-sm font-bold text-white">{pageTitle(location.pathname)}</p>
          </div>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className={isEventDetail
              ? 'flex-1 p-0 pb-28 lg:pb-0'
              : 'flex-1 px-4 py-5 pb-28 lg:px-8 lg:py-8 lg:pb-8'}
            style={{ maxWidth: '100%' }}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>

        <nav
          aria-label="Accesos rápidos"
          className="pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 lg:hidden"
          style={{ background: 'rgba(10,33,64,0.97)', borderTop: `1px solid ${SIDEBAR_BORDER}`, backdropFilter: 'blur(12px)' }}
        >
          {DOCK.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold"
              style={({ isActive }) => ({ color: isActive ? '#00C9A0' : 'rgba(255,255,255,0.45)' })}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.75} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold"
            style={{ color: menuOpen ? '#00C9A0' : 'rgba(255,255,255,0.45)' }}
          >
            <MenuIcon size={18} />
            Menú
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            key="novo-menu"
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Cerrar menú"
              className="absolute inset-0"
              style={{ background: 'rgba(5,10,20,.72)' }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              data-lenis-prevent
              initial={{ x: -28, opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="relative flex h-full w-[min(86vw,320px)] flex-col overflow-hidden"
              style={{ background: SIDEBAR_BG, borderRight: `1px solid ${SIDEBAR_BORDER}` }}
            >
              <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}>
                <p className="text-sm font-bold text-white">Menú</p>
                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => setMenuOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-white/70"
                >
                  <XIcon size={16} />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col">
                <NovoSidebar mobile onNavigate={() => setMenuOpen(false)} />
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
