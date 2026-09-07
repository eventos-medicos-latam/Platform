import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboardIcon, UserRoundIcon, BriefcaseIcon,
  PresentationIcon, EyeIcon, InboxIcon, LogOutIcon, MicIcon,
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { usePlatform } from '../../contexts/PlatformContext';

const NAV = [
  { to: '/speaker',             label: 'Inicio',        icon: LayoutDashboardIcon, end: true  },
  { to: '/speaker/perfil',      label: 'Mi perfil',     icon: UserRoundIcon                   },
  { to: '/speaker/experiencia', label: 'Experiencia',   icon: BriefcaseIcon                   },
  { to: '/speaker/ponencias',   label: 'Ponencias',     icon: PresentationIcon                },
  { to: '/speaker/visibilidad', label: 'Visibilidad',   icon: EyeIcon                         },
  { to: '/speaker/solicitudes', label: 'Solicitudes',   icon: InboxIcon                       },
];

const BG   = '#0a1f35';
const ACCENT = '#00C9A0';

export function SpeakerLayout() {
  const { session, signOut } = usePlatform();
  const name = session?.user?.user_metadata?.full_name ?? session?.user?.email ?? 'Speaker';
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

  return (
    <div className="flex min-h-screen w-full" style={{ background: '#f0f4f8' }}>
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col lg:flex"
        style={{ background: BG }}>
        {/* Header */}
        <div className="relative overflow-hidden px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(rgba(0,201,160,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative">
            <Link to="/" aria-label="Sitio público"><Logo compact /></Link>
            <p className="mt-4 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Portal del Speaker
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#00C9A0,#1a6b5a)' }}>
                {initials}
              </div>
              <p className="truncate text-sm font-bold text-white">{name}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${isActive ? 'font-semibold' : ''}`
              }
              style={({ isActive }) => ({
                background: isActive ? 'rgba(0,201,160,0.12)' : 'transparent',
                color: isActive ? ACCENT : 'rgba(255,255,255,0.55)',
              })}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={16} style={{ color: isActive ? ACCENT : 'rgba(255,255,255,0.35)' }} />
                  {item.label}
                  {item.label === 'Solicitudes' && (
                    <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
                      style={{ background: ACCENT, color: '#0a1f35' }}>2</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
          <button type="button" onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
            <LogOutIcon size={15} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
