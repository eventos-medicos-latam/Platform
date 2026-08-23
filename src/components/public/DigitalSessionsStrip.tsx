import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRightIcon, CalendarPlusIcon, MessagesSquareIcon, MonitorPlayIcon, UsersRoundIcon } from 'lucide-react';
import { secondaryEvents } from '../../data/content';
import type { SecondaryEvent } from '../../types/content';
import { formatFullDate } from '../../utils/format';
import { Pending } from '../ui/Pending';
import { EASE_EMPHASIS } from '../../utils/motion';

/** Tipo de sesión → icono, etiqueta y tono. */
const kindMeta: Record<string, {
  icon: typeof MonitorPlayIcon;
  label: string;
  tone: string;
}> = {
  webinar: {
    icon: MonitorPlayIcon,
    label: 'Webinar',
    tone: 'var(--tone-corporativo)'
  },
  conversatorio: {
    icon: MessagesSquareIcon,
    label: 'Conversatorio',
    tone: 'var(--tone-obesidad)'
  },
  masterclass: {
    icon: UsersRoundIcon,
    label: 'Masterclass',
    tone: 'var(--tone-hormobiota)'
  },
  taller: {
    icon: UsersRoundIcon,
    label: 'Taller',
    tone: 'var(--tone-longevidad)'
  }
};
function metaOf(kind: string) {
  return kindMeta[kind.toLowerCase()] ?? kindMeta.webinar;
}

/** Días que faltan para la sesión. */
function daysUntil(date: string): number {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Formación digital publicada. Lee la misma fuente que la agenda digital
 * (`/digital`), así que lo que se ve aquí es exactamente lo que está aprobado
 * y abierto a registro — no una lista suelta.
 */
export function DigitalSessionsStrip() {
  const [filter, setFilter] = useState('todos');
  const published = useMemo(() => secondaryEvents.filter((event) => event.status === 'aprobado' || event.status === 'publicado').sort((a, b) => a.date.localeCompare(b.date)), []);
  const kinds = useMemo(() => {
    const set = new Set(published.map((event) => event.kind.toLowerCase()));
    return ['todos', ...set];
  }, [published]);
  const list = filter === 'todos' ? published : published.filter((e) => e.kind.toLowerCase() === filter);
  const hidden = secondaryEvents.length - published.length;
  return <section className="surface-deep relative isolate overflow-hidden py-20 text-white lg:py-24">
      <div className="grid-texture absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-shell px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
              Formación digital · todo el año
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(1.9rem,4vw,3.2rem)] font-bold leading-[1.05] tracking-tight">
              El programa no se detiene
              <span className="block font-normal text-white/50">entre un congreso y el siguiente</span>
            </h2>
          </div>
          <Link to="/digital" className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-deep shadow-elev3 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
            Ver calendario completo
            <ArrowRightIcon size={16} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Filtros por tipo */}
        <div className="mt-10 flex flex-wrap gap-2">
          {kinds.map((kind) => <button key={kind} type="button" onClick={() => setFilter(kind)} aria-pressed={filter === kind} className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 ease-emphasis ${filter === kind ? 'border-white bg-white text-brand-deep' : 'border-white/20 text-white/70 hover:border-white/50 hover:text-white'}`}>
              {kind === 'todos' ? 'Todas las sesiones' : metaOf(kind).label}
            </button>)}
        </div>

        {/* Sesiones */}
        {list.length === 0 ? <p className="mt-12 rounded-2xl border border-dashed border-white/20 px-6 py-12 text-center text-white/60">
            No hay sesiones publicadas de este tipo por ahora.
          </p> : <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {list.map((event, index) => <SessionCard key={event.id} event={event} index={index} />)}
            </AnimatePresence>
          </ul>}

        {hidden > 0 ? <p className="mt-8 text-sm text-white/45">
            {hidden} sesiones más en preparación. Se publican cuando el ponente y la fecha quedan
            confirmados.
          </p> : null}
      </div>
    </section>;
}
function SessionCard({
  event,
  index



}: {event: SecondaryEvent;index: number;}) {
  const meta = metaOf(event.kind);
  const Icon = meta.icon;
  const days = daysUntil(event.date);
  const soon = days >= 0 && days <= 14;
  return <motion.li layout initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} exit={{
    opacity: 0,
    y: -12
  }} transition={{
    duration: 0.26,
    ease: EASE_EMPHASIS,
    delay: Math.min(index, 5) * 0.05
  }} style={{
    ['--accent-rgb' as string]: meta.tone
  }}>
      <Link to="/digital" className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white p-6 shadow-elev2 transition-transform duration-200 ease-emphasis hover:-translate-y-1.5 hover:shadow-elev4">
        {/* Barra de tono por tipo de sesión */}
        <span className="absolute inset-x-0 top-0 h-1 bg-accent" aria-hidden="true" />

        <div className="flex items-start justify-between gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-accent">
            <Icon size={22} />
          </span>
          {soon ? <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white">
              <motion.span className="h-1.5 w-1.5 rounded-full bg-white" animate={{
            opacity: [1, 0.3, 1]
          }} transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'linear'
          }} />
              {days === 0 ? 'Hoy' : `En ${days} día${days === 1 ? '' : 's'}`}
            </span> : null}
        </div>

        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          {meta.label} · {event.modality}
        </p>
        <h3 className="mt-2 text-lg font-bold leading-snug tracking-tight text-brand">
          {event.title}
        </h3>

        <dl className="mt-4 space-y-1.5 text-sm text-ink-muted">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Fecha</dt>
            <dd>{formatFullDate(event.date)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Hora</dt>
            <dd>{event.time === 'PENDIENTE' ? <Pending /> : `${event.time} h`}</dd>
          </div>
        </dl>

        <span className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-5 text-sm font-semibold text-brand">
          Reservar mi cupo
          <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-white transition-transform duration-200 ease-emphasis group-hover:translate-x-1">
            <CalendarPlusIcon size={15} />
          </span>
        </span>
      </Link>
    </motion.li>;
}