import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpenIcon, CalendarDaysIcon, HandshakeIcon, HomeIcon, MailIcon, MenuIcon, ShoppingBagIcon, SparklesIcon, UserRoundIcon, UsersIcon, VideoIcon, XIcon, BoxIcon } from "lucide-react";
import { Logo } from "../ui/Logo";
import { editions, featuredEditionId, getFamily } from "../../data/editions";
import { DURATION, EASE_EMPHASIS } from "../../utils/motion";
interface NavItem {
  to: string;
  label: string;
  icon: BoxIcon;
}
const navItems: NavItem[] = [{
  to: '/',
  label: 'Inicio',
  icon: HomeIcon
}, {
  to: '/hormobiota',
  label: 'Hormobiota',
  icon: SparklesIcon
}, {
  to: '/eventos',
  label: 'Eventos',
  icon: CalendarDaysIcon
}, {
  to: '/digital',
  label: 'En línea',
  icon: VideoIcon
}, {
  to: '/tienda',
  label: 'Tienda',
  icon: ShoppingBagIcon
}, {
  to: '/comunidad',
  label: 'Comunidad',
  icon: UsersIcon
}, {
  to: '/contenido',
  label: 'Contenido',
  icon: BookOpenIcon
}, {
  to: '/aliados',
  label: 'Aliados',
  icon: HandshakeIcon
}, {
  to: '/nosotros',
  label: 'Nosotros',
  icon: UserRoundIcon
}, {
  to: '/contacto',
  label: 'Contacto',
  icon: MailIcon
}];
const salesOpen = ['preventa', 'venta-activa'];

/**
 * Encabezado oscuro permanente: es la única superficie donde el logo blanco
 * puede vivir sin placa. La navegación es iconográfica y el nombre de cada
 * sección aparece al acercar el cursor.
 */
export function PublicHeader() {
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const location = useLocation();
  useEffect(() => {
    function onScroll() {
      setCompact(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);
  const featured = editions.find((edition) => edition.id === featuredEditionId);
  const family = featured ? getFamily(featured.familyId) : undefined;
  const eventPath = featured && family ? `/eventos/${family.slug}/${featured.slug}` : '/eventos';
  const ctaLabel = featured && salesOpen.includes(featured.status) ? 'Inscripciones abiertas' : 'Próximo evento';
  return <>
      <header className={`sticky top-0 z-40 border-b border-white/10 glass-dark transition-[padding,box-shadow] duration-200 ease-emphasis ${compact ? 'py-2 shadow-elev3' : 'py-3.5'}`}>
        <div className="mx-auto flex max-w-shell items-center gap-6 px-5 sm:px-6">
          <Link to="/" className="shrink-0" aria-label="Eventos Médicos LATAM · Inicio">
            <Logo compact={compact} />
          </Link>

          {/* Navegación iconográfica de escritorio */}
          <nav aria-label="Navegación principal" className="hidden flex-1 lg:block">
            <ul className="flex items-center justify-center gap-1">
              {navItems.map((item) => <li key={item.to} className="relative" onMouseEnter={() => setHovered(item.to)} onMouseLeave={() => setHovered(null)}>
                  <NavLink to={item.to} end={item.to === '/'} aria-label={item.label} className={({
                isActive
              }) => `relative grid h-11 w-11 place-items-center rounded-xl transition-colors duration-150 ease-emphasis ${isActive ? 'text-white' : 'text-white/55 hover:bg-white/10 hover:text-white'}`}>
                    {({
                  isActive
                }) => <>
                        {isActive ? <motion.span layoutId="public-nav-pill" className="absolute inset-0 rounded-xl bg-white/12 ring-1 ring-inset ring-white/20" transition={{
                    duration: DURATION.dropdown,
                    ease: EASE_EMPHASIS
                  }} /> : null}
                        <item.icon size={19} className="relative" strokeWidth={1.9} />
                        {isActive ? <motion.span layoutId="public-nav-dot" className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-accent" transition={{
                    duration: DURATION.dropdown,
                    ease: EASE_EMPHASIS
                  }} /> : null}
                      </>}
                  </NavLink>

                  {/* Etiqueta al acercar el cursor */}
                  <AnimatePresence>
                    {hovered === item.to ? <motion.span initial={{
                  opacity: 0,
                  y: -4
                }} animate={{
                  opacity: 1,
                  y: 0
                }} exit={{
                  opacity: 0,
                  y: -4
                }} transition={{
                  duration: DURATION.tooltip,
                  ease: EASE_EMPHASIS
                }} className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-brand shadow-elev3" role="tooltip">
                        {item.label}
                      </motion.span> : null}
                  </AnimatePresence>
                </li>)}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link to="/login" className="hidden rounded-xl px-3 py-2 text-sm font-medium text-white/60 transition-colors duration-150 ease-emphasis hover:text-white sm:block">
              Acceder
            </Link>
            <Link to={eventPath} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-deep shadow-elev2 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
              {ctaLabel}
            </Link>
            <button type="button" onClick={() => setMenuOpen(true)} className="grid h-11 w-11 place-items-center rounded-xl text-white transition-colors duration-150 ease-emphasis hover:bg-white/10 lg:hidden" aria-label="Abrir menú" aria-expanded={menuOpen}>
              <MenuIcon size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Menú móvil: hoja completa con objetivos táctiles grandes */}
      <AnimatePresence>
        {menuOpen ? <motion.div className="fixed inset-0 z-50 bg-brand-deep lg:hidden" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} transition={{
        duration: DURATION.dropdown,
        ease: EASE_EMPHASIS
      }}>
            <div className="grid-texture flex h-full flex-col">
              <div className="flex items-center justify-between px-5 py-4">
                <Logo compact />
                <button type="button" onClick={() => setMenuOpen(false)} className="grid h-11 w-11 place-items-center rounded-xl text-white hover:bg-white/10" aria-label="Cerrar menú">
                  <XIcon size={22} />
                </button>
              </div>

              <nav aria-label="Navegación móvil" className="flex-1 overflow-y-auto px-4 pb-6">
                <ul className="grid grid-cols-2 gap-3">
                  {navItems.map((item, index) => <motion.li key={item.to} initial={{
                opacity: 0,
                y: 12
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                duration: 0.24,
                ease: EASE_EMPHASIS,
                delay: 0.03 + index * 0.03
              }}>
                      <NavLink to={item.to} end={item.to === '/'} className={({
                  isActive
                }) => `flex h-[92px] flex-col justify-between rounded-2xl p-4 transition-colors duration-150 ease-emphasis ${isActive ? 'bg-white text-brand-deep' : 'glass-panel text-white'}`}>
                        {({
                    isActive
                  }) => <>
                            <item.icon size={22} strokeWidth={1.9} className={isActive ? 'text-accent' : 'text-white/70'} />
                            <span className="text-base font-semibold">{item.label}</span>
                          </>}
                      </NavLink>
                    </motion.li>)}
                </ul>

                <div className="mt-4 space-y-3">
                  <Link to={eventPath} className="block rounded-2xl bg-accent px-5 py-4 text-center text-base font-semibold text-white shadow-elev3">
                    {ctaLabel}
                  </Link>
                  <Link to="/login" className="block rounded-2xl border border-white/20 px-5 py-4 text-center text-base font-semibold text-white">
                    Acceder a mi cuenta
                  </Link>
                </div>
              </nav>
            </div>
          </motion.div> : null}
      </AnimatePresence>
    </>;
}