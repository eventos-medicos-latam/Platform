import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboardIcon, CalendarDaysIcon, UsersIcon, MicIcon,
  BuildingIcon, ShoppingBagIcon, LayoutPanelLeftIcon, WalletIcon,
  TvIcon, GlobeIcon, FolderIcon, HeadphonesIcon,
  SettingsIcon, LogOutIcon, ChevronRightIcon,
} from 'lucide-react';
import { usePlatform } from '../../../contexts/PlatformContext';

const GROUP_ICON_COLOR: Record<string, string> = {
  'Operación':  '#7fb3d9',
  'Comercial':  '#8fe0bc',
  'Ecosistema': '#c4b3ef',
  'Sistema':    'rgba(255,255,255,0.35)',
};

const NAV = [
  {
    group: 'Operación',
    items: [
      { to: '/novo',           label: 'Resumen',            icon: LayoutDashboardIcon, end: true },
      { to: '/novo/eventos',   label: 'Mis Eventos',        icon: CalendarDaysIcon },
      { to: '/novo/registros', label: 'Registros',          icon: UsersIcon },
      { to: '/novo/speakers',  label: 'Speakers',           icon: MicIcon },
    ],
  },
  {
    group: 'Comercial',
    items: [
      { to: '/novo/empresas',  label: 'Empresas',           icon: BuildingIcon },
      { to: '/novo/productos', label: 'Productos',          icon: ShoppingBagIcon },
      { to: '/novo/stands',    label: 'Stands',             icon: LayoutPanelLeftIcon },
      { to: '/novo/pagos',     label: 'Facturación y Pagos',icon: WalletIcon },
    ],
  },
  {
    group: 'Ecosistema',
    items: [
      { to: '/novo/digital',    label: 'Agenda Digital',        icon: TvIcon },
      { to: '/novo/sitio',      label: 'Sitio Web EML',         icon: GlobeIcon },
      { to: '/novo/documentos', label: 'Documentos',            icon: FolderIcon },
      { to: '/novo/soporte',    label: 'Soporte',               icon: HeadphonesIcon },
    ],
  },
  {
    group: 'Sistema',
    items: [
      { to: '/novo/configuracion', label: 'Configuración', icon: SettingsIcon },
    ],
  },
];

const SIDEBAR_BG    = '#0a2140';
const SIDEBAR_BORDER = 'rgba(255,255,255,0.08)';

export function NovoSidebar() {
  const { session, signOut } = usePlatform();

  return (
    <aside
      className="hidden lg:flex sticky top-0 h-screen w-[248px] shrink-0 flex-col"
      style={{ background: SIDEBAR_BG, borderRight: `1px solid ${SIDEBAR_BORDER}` }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}>
        <Link to="/novo" className="flex items-center gap-2.5 group">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-transform duration-200 group-hover:scale-110"
            style={{ background: 'linear-gradient(135deg, #00C9A0, #007AFF)', color: '#fff' }}
          >
            EML
          </div>
          <div>
            <p className="text-sm font-bold leading-none text-white">EML Platform</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Panel administrativo
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map((group) => {
          const iconColor = GROUP_ICON_COLOR[group.group];
          return (
            <div key={group.group}>
              <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: 'rgba(255,255,255,0.25)' }}>
                {group.group}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className="group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
                      style={({ isActive }) => ({
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                        background: isActive ? 'rgba(0,201,160,0.12)' : 'transparent',
                        boxShadow: isActive ? '0 0 0 1px rgba(0,201,160,0.2) inset' : 'none',
                      })}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        if (!el.getAttribute('aria-current')) {
                          el.style.background = 'rgba(255,255,255,0.06)';
                          el.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.06) inset, 0 2px 8px rgba(0,0,0,.2)';
                          el.style.color = 'rgba(255,255,255,0.9)';
                        }
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        if (!el.getAttribute('aria-current')) {
                          el.style.background = 'transparent';
                          el.style.boxShadow = 'none';
                          el.style.color = 'rgba(255,255,255,0.55)';
                        }
                      }}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="novo-nav-marker"
                              className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
                              style={{ background: '#00C9A0', boxShadow: '0 0 8px rgba(0,201,160,.6)' }}
                              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                            />
                          )}
                          <item.icon
                            size={16}
                            strokeWidth={isActive ? 2 : 1.75}
                            style={{ color: isActive ? '#00C9A0' : iconColor, flexShrink: 0 }}
                          />
                          <span className="truncate flex-1">{item.label}</span>
                          {isActive && (
                            <ChevronRightIcon size={11} strokeWidth={2.5} style={{ color: '#00C9A0', opacity: 0.6 }} />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4" style={{ borderTop: `1px solid ${SIDEBAR_BORDER}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
            style={{ background: 'rgba(0,201,160,.15)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
            {(session?.name ?? 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{session?.name ?? 'Super Admin'}</p>
            <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {session?.email ?? 'admin@eventosmedicoslatam.com'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-1.5 text-xs font-medium transition-all opacity-40 hover:opacity-80 text-white rounded-lg px-2 py-1.5 w-full hover:bg-white/5"
        >
          <LogOutIcon size={12} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
