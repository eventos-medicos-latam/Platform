import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDaysIcon, ChevronDownIcon, HandshakeIcon, HomeIcon,
  MailIcon, MenuIcon, MicVocalIcon, SparklesIcon, UtensilsCrossedIcon, XIcon, type LucideIcon,
} from "lucide-react";
import { Logo } from "../ui/Logo";
import { getFeaturedPublicEvent, publicEventPath } from "../../lib/novo/events";
import { homeForRole, usePlatform } from "../../contexts/PlatformContext";
import { DURATION, EASE_EMPHASIS } from "../../utils/motion";

interface NavChild { to: string; label: string }
interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { to: '/', label: 'Inicio', icon: HomeIcon },
  { to: '/hormobiota', label: 'Hormobiota', icon: SparklesIcon },
  {
    to: '/eventos', label: 'Eventos', icon: CalendarDaysIcon,
    children: [
      { to: '/eventos', label: 'Próximos eventos' },
      { to: '/digital', label: 'Formación en línea' },
      { to: '/eventos?tab=anteriores', label: 'Ediciones anteriores' },
    ],
  },
  { to: '/speakers', label: 'Speakers', icon: MicVocalIcon },
  { to: '/aliados', label: 'Aliados', icon: HandshakeIcon },
  { to: '/habitos-al-plato', label: 'Hábitos al Plato', icon: UtensilsCrossedIcon },
  { to: '/contacto', label: 'Contacto', icon: MailIcon },
];

const salesOpen = ['proximo', 'activo'];

export function PublicHeader() {
  const { session } = usePlatform();
  const accessTo = session ? homeForRole(session.role) : '/login';
  const accessLabel = session ? 'Mi cuenta' : 'Acceder';
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [eventPath, setEventPath] = useState('/eventos');
  const [ctaLabel, setCtaLabel] = useState('Próximo evento');
  const eventsRef = useRef<HTMLLIElement>(null);
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    getFeaturedPublicEvent()
      .then((event) => {
        if (!alive || !event) return;
        setEventPath(publicEventPath(event));
        setCtaLabel(salesOpen.includes(event.operational_status) ? 'Inscripciones abiertas' : 'Próximo evento');
      })
      .catch(() => { /* deja el fallback a /eventos */ });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    function onScroll() { setCompact(window.scrollY > 24); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setEventsOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    const lenis = (window as unknown as { lenis?: { stop: () => void; start: () => void } }).lenis;
    if (menuOpen) lenis?.stop();
    else lenis?.start();
    return () => {
      document.body.style.overflow = '';
      lenis?.start();
    };
  }, [menuOpen]);

  /* Cerrar dropdown Eventos al hacer clic fuera */
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (eventsRef.current && !eventsRef.current.contains(e.target as Node)) {
        setEventsOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return <>
    <header className={`sticky top-0 z-40 border-b border-white/10 glass-dark transition-[padding,box-shadow] duration-200 ease-emphasis ${compact ? 'py-2 shadow-elev3' : 'py-3.5'}`}>
      <div className="mx-auto flex max-w-shell items-center gap-6 px-5 sm:px-6">
        <Link to="/" className="shrink-0" aria-label="Eventos Médicos LATAM · Inicio">
          <Logo compact={compact} />
        </Link>

        {/* Navegación iconográfica de escritorio */}
        <nav aria-label="Navegación principal" className="hidden flex-1 lg:block">
          <ul className="flex items-center justify-center gap-1">
            {navItems.map((item) => {
              const hasChildren = !!item.children?.length;

              if (hasChildren) {
                return (
                  <li key={item.to} className="relative" ref={eventsRef}>
                    <button
                      type="button"
                      onClick={() => setEventsOpen(v => !v)}
                      onMouseEnter={() => setHovered(item.to)}
                      onMouseLeave={() => setHovered(null)}
                      className={`relative grid h-11 w-11 place-items-center rounded-xl transition-colors duration-150 ease-emphasis text-white/55 hover:bg-white/10 hover:text-white`}
                      aria-haspopup="true" aria-expanded={eventsOpen}>
                      <item.icon size={19} className="relative" strokeWidth={1.9} />
                      <ChevronDownIcon size={10} className={`absolute bottom-1 right-1 transition-transform duration-150 ${eventsOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Tooltip */}
                    <AnimatePresence>
                      {hovered === item.to && !eventsOpen ? (
                        <motion.span
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: DURATION.tooltip, ease: EASE_EMPHASIS }}
                          className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-brand shadow-elev3"
                          role="tooltip">
                          {item.label}
                        </motion.span>
                      ) : null}
                    </AnimatePresence>

                    {/* Dropdown */}
                    <AnimatePresence>
                      {eventsOpen ? (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.97 }}
                          transition={{ duration: DURATION.dropdown, ease: EASE_EMPHASIS }}
                          className="absolute left-1/2 top-full z-50 mt-3 w-52 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-brand-deep shadow-elev3">
                          {item.children!.map((child, ci) => (
                            <NavLink key={child.to} to={child.to} end
                              className={({ isActive }) =>
                                `flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors duration-100 ease-emphasis ${ci > 0 ? 'border-t border-white/8' : ''} ${isActive ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/8 hover:text-white'}`
                              }>
                              {child.label}
                            </NavLink>
                          ))}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </li>
                );
              }

              return (
                <li key={item.to} className="relative" onMouseEnter={() => setHovered(item.to)} onMouseLeave={() => setHovered(null)}>
                  <NavLink to={item.to} end={item.to === '/'}
                    aria-label={item.label}
                    className={({ isActive }) =>
                      `relative grid h-11 w-11 place-items-center rounded-xl transition-colors duration-150 ease-emphasis ${isActive ? 'text-white' : 'text-white/55 hover:bg-white/10 hover:text-white'}`
                    }>
                    {({ isActive }) => <>
                      {isActive ? <motion.span layoutId="public-nav-pill"
                        className="absolute inset-0 rounded-xl bg-white/12 ring-1 ring-inset ring-white/20"
                        transition={{ duration: DURATION.dropdown, ease: EASE_EMPHASIS }} /> : null}
                      <item.icon size={19} className="relative" strokeWidth={1.9} />
                      {isActive ? <motion.span layoutId="public-nav-dot"
                        className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-accent"
                        transition={{ duration: DURATION.dropdown, ease: EASE_EMPHASIS }} /> : null}
                    </>}
                  </NavLink>

                  <AnimatePresence>
                    {hovered === item.to ? (
                      <motion.span
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: DURATION.tooltip, ease: EASE_EMPHASIS }}
                        className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-brand shadow-elev3"
                        role="tooltip">
                        {item.label}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link to={accessTo} className="hidden rounded-xl px-3 py-2 text-sm font-medium text-white/60 transition-colors duration-150 ease-emphasis hover:text-white sm:block">
            {accessLabel}
          </Link>
          <Link to={eventPath} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-deep shadow-elev2 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
            {ctaLabel}
          </Link>
          <button type="button" onClick={() => setMenuOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-xl text-white transition-colors duration-150 ease-emphasis hover:bg-white/10 lg:hidden"
            aria-label="Abrir menú" aria-expanded={menuOpen}>
            <MenuIcon size={22} />
          </button>
        </div>
      </div>
    </header>

    {/* Menú móvil */}
    <AnimatePresence>
      {menuOpen ? (
        <motion.div data-lenis-prevent className="fixed inset-0 z-50 h-dvh overflow-hidden bg-brand-deep lg:hidden"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: DURATION.dropdown, ease: EASE_EMPHASIS }}>
          <div className="grid-texture flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between px-5 py-4">
              <Logo compact />
              <button type="button" onClick={() => setMenuOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-xl text-white hover:bg-white/10" aria-label="Cerrar menú">
                <XIcon size={22} />
              </button>
            </div>

            <nav aria-label="Navegación móvil" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
              <ul className="grid grid-cols-2 gap-3">
                {navItems.flatMap((item, index) => {
                  const cards = [
                    <motion.li key={item.to}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.24, ease: EASE_EMPHASIS, delay: 0.03 + index * 0.03 }}>
                      <NavLink to={item.to} end={item.to === '/'}
                        className={({ isActive }) =>
                          `flex h-[92px] flex-col justify-between rounded-2xl p-4 transition-colors duration-150 ease-emphasis ${isActive ? 'bg-white text-brand-deep' : 'glass-panel text-white'}`
                        }>
                        {({ isActive }) => <>
                          <item.icon size={22} strokeWidth={1.9} className={isActive ? 'text-accent' : 'text-white/70'} />
                          <span className="text-base font-semibold">{item.label}</span>
                        </>}
                      </NavLink>
                    </motion.li>,
                  ];
                  /* Submenu de Eventos: expandir como cards adicionales */
                  if (item.children) {
                    item.children.forEach((child, ci) => {
                      cards.push(
                        <motion.li key={child.to}
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.24, ease: EASE_EMPHASIS, delay: 0.06 + (index + ci) * 0.03 }}>
                          <NavLink to={child.to} end
                            className={({ isActive }) =>
                              `flex h-[92px] flex-col justify-between rounded-2xl p-4 transition-colors duration-150 ease-emphasis ${isActive ? 'bg-white text-brand-deep' : 'glass-panel text-white/70'}`
                            }>
                            <CalendarDaysIcon size={18} strokeWidth={1.9} className="text-accent/60" />
                            <span className="text-sm font-medium leading-tight">{child.label}</span>
                          </NavLink>
                        </motion.li>
                      );
                    });
                  }
                  return cards;
                })}
              </ul>

              <div className="mt-4 space-y-3">
                <Link to={eventPath} className="block rounded-2xl bg-accent px-5 py-4 text-center text-base font-semibold text-white shadow-elev3">
                  {ctaLabel}
                </Link>
                <Link to={accessTo} className="block rounded-2xl border border-white/20 px-5 py-4 text-center text-base font-semibold text-white">
                  {session ? 'Ir a mi cuenta' : 'Acceder a mi cuenta'}
                </Link>
              </div>
            </nav>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  </>;
}
