import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StatusBadge, type BadgeTone } from '../ui/StatusBadge';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';

export type NovoEventNavItem = {
  to: string;
  label: string;
  end?: boolean;
};

export function NovoEventSubnav({
  familyName,
  familySlug,
  familyLogo,
  eventName,
  year,
  statusLabel,
  statusTone,
  items,
  ctaLabel,
  ctaTo,
}: {
  familyName?: string;
  familySlug?: string;
  familyLogo?: string;
  eventName: string;
  year: number;
  statusLabel: string;
  statusTone: BadgeTone;
  items: NovoEventNavItem[];
  ctaLabel?: string;
  ctaTo?: string;
}) {
  return (
    <>
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-shell px-6 py-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {familyLogo ? (
              <Link
                to={familySlug ? `/eventos?familia=${familySlug}` : '/eventos'}
                className="mr-1 shrink-0"
                aria-label={familyName || eventName}
              >
                <img src={familyLogo} alt={familyName || eventName} className="h-12 w-auto" draggable={false} />
              </Link>
            ) : null}
            <Link to="/eventos" className="text-sm text-ink-muted hover:text-brand">
              Eventos
            </Link>
            {familyName ? (
              <>
                <span className="text-ink-muted/50">/</span>
                <span className="text-sm text-ink-muted">{familyName}</span>
              </>
            ) : null}
            <span className="text-ink-muted/50">/</span>
            <span className="text-sm font-semibold text-brand">
              {eventName} · {year}
            </span>
            <StatusBadge label={statusLabel} tone={statusTone} />
          </div>
        </div>
      </div>

      <nav aria-label="Secciones del evento" className="sticky top-[57px] z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-shell px-6">
          <ul className="no-scrollbar flex gap-1 overflow-x-auto">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `relative block whitespace-nowrap px-3.5 py-3 text-sm font-medium transition-colors duration-150 ease-emphasis ${
                      isActive ? 'text-brand' : 'text-ink-muted hover:text-brand'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive ? (
                        <motion.span
                          layoutId="novo-event-nav-underline"
                          className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent"
                          transition={{ duration: DURATION.dropdown, ease: EASE_EMPHASIS }}
                        />
                      ) : null}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
            {ctaTo && ctaLabel ? (
              <li className="ml-auto hidden items-center py-2 md:flex">
                <Link
                  to={ctaTo}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep"
                >
                  {ctaLabel}
                </Link>
              </li>
            ) : null}
          </ul>
        </div>
      </nav>
    </>
  );
}
