import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboardIcon, CalendarDaysIcon, UsersIcon,
  BuildingIcon, ShoppingBagIcon, LayoutPanelLeftIcon,
  CreditCardIcon, FolderIcon, SettingsIcon, LogOutIcon,
  MicIcon, GlobeIcon, HeadphonesIcon, TvIcon, ChevronRightIcon,
} from 'lucide-react';
import { usePlatform } from '../../../contexts/PlatformContext';

const NAV = [
  {
    group: 'Operación',
    items: [
      { to: '/novo',           label: 'Resumen',       icon: LayoutDashboardIcon, end: true },
      { to: '/novo/eventos',   label: 'Mis Eventos',   icon: CalendarDaysIcon },
      { to: '/novo/registros', label: 'Registros',     icon: UsersIcon },
      { to: '/novo/speakers',  label: 'Speakers',      icon: MicIcon },
    ],
  },
  {
    group: 'Comercial',
    items: [
      { to: '/novo/empresas',  label: 'Empresas',           icon: BuildingIcon },
      { to: '/novo/productos', label: 'Productos',           icon: ShoppingBagIcon },
      { to: '/novo/stands',    label: 'Stands',              icon: LayoutPanelLeftIcon },
      { to: '/novo/pagos',     label: 'Facturación y Pagos', icon: CreditCardIcon },
    ],
  },
  {
    group: 'Ecosistema',
    items: [
      { to: '/novo/digital',    label: 'Agenda Digital',        icon: TvIcon },
      { to: '/novo/sitio',      label: 'Sitio Web EML',         icon: GlobeIcon },
      { to: '/novo/documentos', label: 'Documentos y Recursos', icon: FolderIcon },
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

export function NovoSidebar() {
  const { session, signOut } = usePlatform();

  return (
    <aside
      className="hidden lg:flex sticky top-0 h-screen w-[220px] shrink-0 flex-col"
      style={{ background: '#080C14', borderRight: '1px solid #1E2D45' }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid #1E2D45' }}>
        <Link to="/novo" className="flex items-center gap-2.5 group">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #00C9A0, #007AFF)', color: '#fff' }}
          >
            EML
          </div>
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: '#E1EAF4' }}>
              EML Platform
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: '#3A5470' }}>
              v2 · NOVO
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map((group) => (
          <div key={group.group}>
            <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3A5470' }}>
              {group.group}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-all duration-150 ${
                        isActive ? 'font-semibold' : 'font-medium hover:opacity-100 opacity-60'
                      }`
                    }
                    style={({ isActive }) => ({
                      color: isActive ? '#00C9A0' : '#7A9CB8',
                      background: isActive ? 'rgba(0,201,160,0.08)' : 'transparent',
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="novo-nav-marker"
                            className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
                            style={{ background: '#00C9A0' }}
                            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                          />
                        )}
                        <item.icon size={15} strokeWidth={isActive ? 2 : 1.75} />
                        <span className="truncate flex-1">{item.label}</span>
                        {isActive && (
                          <ChevronRightIcon size={12} strokeWidth={2} style={{ opacity: 0.5 }} />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid #1E2D45' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #5B8AF0, #00C9A0)', color: '#fff' }}
          >
            {(session?.name ?? 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold" style={{ color: '#E1EAF4' }}>
              {session?.name ?? 'Super Admin'}
            </p>
            <p className="truncate text-[10px]" style={{ color: '#3A5470' }}>
              {session?.email ?? 'admin@eml.co'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-1.5 text-xs transition-opacity duration-150 opacity-40 hover:opacity-80"
          style={{ color: '#7A9CB8' }}
        >
          <LogOutIcon size={12} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
