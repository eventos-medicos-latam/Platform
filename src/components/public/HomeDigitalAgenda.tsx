import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRightIcon, CalendarPlusIcon, ClockIcon, InfoIcon, MessagesSquareIcon, MonitorPlayIcon, UsersIcon, UsersRoundIcon } from 'lucide-react';
import { fetchSecondaryEvents } from '../../lib/publicData';
import type { SecondaryEvent } from '../../types/content';
import { formatFullDate } from '../../utils/format';
import { DigitalCalendar } from './DigitalCalendar';
import { media } from '../../data/media';
import { EASE_EMPHASIS } from '../../utils/motion';

/** Tipo de sesión → icono, etiqueta y tono propio. */
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
  },
  lanzamiento: {
    icon: MonitorPlayIcon,
    label: 'Lanzamiento',
    tone: 'var(--tone-futuro)'
  }
};
function metaOf(kind: string) {
  return kindMeta[kind.toLowerCase()] ?? kindMeta.webinar;
}
function daysUntil(date: string): number {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return `${monthNames[month - 1]} de ${year}`;
}

/**
 * Agenda de eventos digitales en la Home. El calendario manda: el mes que
 * estás viendo decide qué sesiones aparecen al lado. Al tocar una tarjeta se
 * despliega con todo el detalle y dos salidas — registro o más información —
 * que llevan a `/digital` con esa sesión ya abierta, no a la página en frío.
 */
export function HomeDigitalAgenda() {
  const reduce = useReducedMotion();
  const [allEvents, setAllEvents] = useState<SecondaryEvent[]>([]);
  useEffect(() => {
    fetchSecondaryEvents().then(setAllEvents);
  }, []);
  const published = useMemo(() => allEvents.filter((event) => event.status === 'aprobado' || event.status === 'publicado').sort((a, b) => a.date.localeCompare(b.date)), [allEvents]);
  const firstMonth = published[0]?.date.slice(0, 7) ?? new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(firstMonth);
  const [openId, setOpenId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (published.length > 0 && !openId) {
      setMonth(published[0].date.slice(0, 7));
      setOpenId(published[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [published]);
  const monthEvents = useMemo(() => published.filter((event) => event.date.startsWith(month)), [published, month]);
  const hidden = allEvents.length - published.length;
  if (published.length === 0) return null;
  return <section className="tint-aurora relative isolate overflow-hidden py-20 lg:py-28" aria-labelledby="agenda-digital-home">
      {/* Fondo: una médica dictando una charla virtual a varios colegas.
         Muy tenue, para que la sección respire sin perder la claridad. */}
      <img src={media.webinarHost} alt="" aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 hidden h-full w-[46%] object-cover lg:block" />
      {/* Velo: sólido donde va el texto, se disuelve por completo sobre la
         imagen para que la escena se distinga. */}
      <div className="absolute inset-0 -z-10" aria-hidden="true" style={{
      background: 'linear-gradient(90deg, rgba(246,244,251,1) 0%, rgba(246,244,251,1) 52%, rgba(246,244,251,0.72) 64%, rgba(246,244,251,0.12) 82%, rgba(246,244,251,0) 100%)'
    }} />

      <div className="relative mx-auto max-w-shell px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
              Formación digital · todo el año
            </p>
            <h2 id="agenda-digital-home" className="mt-4 text-[clamp(1.9rem,3.8vw,3rem)] font-bold leading-[1.06] tracking-tight text-brand">
              Agenda de eventos
              <span className="block font-normal text-ink-muted">digitales</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink">
              Webinars, conversatorios y masterclass en vivo, entre un congreso y el siguiente.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
              Cada sesión reúne a un ponente con la comunidad médica alrededor de uno de los seis
              puentes. Son gratuitas, tienen cupo limitado, y tras el registro recibes el enlace de
              la sala, los recordatorios y el certificado de asistencia.
            </p>
          </div>
          <Link to="/digital" className="group inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-elev3 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
            Ver calendario completo
            <ArrowRightIcon size={16} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start">
          <DigitalCalendar events={published} selectedId={openId} onSelect={(event) => {
          setMonth(event.date.slice(0, 7));
          setOpenId(event.id);
        }} onMonthChange={setMonth} milestone={{
          dates: ['2027-04-23', '2027-04-24'],
          label: 'HormoBiota 2.0 · congreso presencial',
          href: '/eventos/hormobiota/hormobiota-2-2027'
        }} />

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
              <h3 className="text-base font-semibold capitalize tracking-tight text-brand">
                {monthLabel(month)}
              </h3>
              <p className="text-sm text-ink-muted">
                {monthEvents.length === 0 ? 'Sin sesiones este mes' : `${monthEvents.length} ${monthEvents.length === 1 ? 'sesión' : 'sesiones'}`}
              </p>
            </div>

            {/* El cambio de mes reemplaza el bloque completo: las tarjetas del
               mes que sale se van y las del nuevo entran en cascada. */}
            <AnimatePresence mode="wait">
              <motion.ul key={month} initial={reduce ? undefined : {
              opacity: 0,
              x: 28
            }} animate={reduce ? undefined : {
              opacity: 1,
              x: 0
            }} exit={reduce ? undefined : {
              opacity: 0,
              x: -28
            }} transition={{
              duration: 0.26,
              ease: EASE_EMPHASIS
            }} className="mt-4 space-y-3">
                {monthEvents.length === 0 ? <li className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-ink-muted">
                    No hay sesiones digitales programadas en {monthLabel(month)}. Usa las flechas del
                    calendario para explorar otros meses.
                  </li> : monthEvents.map((event, index) => <SessionCard key={event.id} event={event} index={index} isOpen={event.id === openId} onToggle={() => setOpenId(event.id === openId ? undefined : event.id)} />)}
              </motion.ul>
            </AnimatePresence>

            {hidden > 0 ? <p className="mt-5 text-sm text-ink-muted">
                {hidden} sesiones más en preparación. Se publican cuando el ponente y la fecha quedan
                confirmados.
              </p> : null}
          </div>
        </div>
      </div>
    </section>;
}
function SessionCard({
  event,
  index,
  isOpen,
  onToggle





}: {event: SecondaryEvent;index: number;isOpen: boolean;onToggle: () => void;}) {
  const meta = metaOf(event.kind);
  const Icon = meta.icon;
  const days = daysUntil(event.date);
  const soon = days >= 0 && days <= 14;
  const seatsLeft = event.seats !== null ? event.seats - event.registered : null;
  const target = `/digital?sesion=${event.id}`;
  return <motion.li layout initial={{
    opacity: 0,
    y: 18
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.26,
    ease: EASE_EMPHASIS,
    delay: Math.min(index, 5) * 0.06
  }} style={{
    ['--accent-rgb' as string]: meta.tone
  }} className={`overflow-hidden rounded-2xl bg-white ${isOpen ? 'shadow-elev4' : 'shadow-elev2'}`}>
      <button type="button" onClick={onToggle} aria-expanded={isOpen} className="group relative flex w-full items-start gap-4 p-5 text-left">
        <span className="absolute inset-y-0 left-0 w-1 bg-accent" aria-hidden="true" />

        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
          <Icon size={21} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              {meta.label}
            </span>
            <span className="text-[11px] text-ink-muted">{event.modality}</span>
            {soon ? <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                <motion.span className="h-1 w-1 rounded-full bg-white" animate={{
              opacity: [1, 0.3, 1]
            }} transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'linear'
            }} />
                {days === 0 ? 'Hoy' : `En ${days} día${days === 1 ? '' : 's'}`}
              </span> : null}
          </span>

          <span className="mt-1.5 block text-base font-bold leading-snug tracking-tight text-brand">
            {event.title}
          </span>
          <span className="mt-1 block text-sm capitalize text-ink-muted">
            {formatFullDate(event.date)}
            {event.time === 'PENDIENTE' ? null : ` · ${event.time} h`}
          </span>
        </span>

        <motion.span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-ink-muted" animate={{
        rotate: isOpen ? 90 : 0
      }} transition={{
        duration: 0.2,
        ease: EASE_EMPHASIS
      }} aria-hidden="true">
          <ArrowRightIcon size={15} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? <motion.div initial={{
        height: 0,
        opacity: 0
      }} animate={{
        height: 'auto',
        opacity: 1
      }} exit={{
        height: 0,
        opacity: 0
      }} transition={{
        duration: 0.28,
        ease: EASE_EMPHASIS
      }} className="overflow-hidden">
            <div className="border-t border-line px-5 pb-5 pt-4">
              {event.description ? <p className="text-sm leading-relaxed text-ink">{event.description}</p> : null}

              <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                <Detail icon={<ClockIcon size={14} />} label="Duración" value={event.durationMinutes ? `${event.durationMinutes} minutos` : 'Por confirmar'} />
                <Detail icon={<MonitorPlayIcon size={14} />} label="Modalidad" value={event.modality} />
                <Detail icon={<UsersRoundIcon size={14} />} label="Ponente" value={event.speakerLabel} />
                <Detail icon={<UsersIcon size={14} />} label="Cupos" value={seatsLeft === null ? 'Por confirmar' : `${seatsLeft} disponibles`} />
              </dl>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link to={target} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-elev2 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                  <CalendarPlusIcon size={15} />
                  Registrarme al evento
                </Link>
                <Link to={target} className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-brand transition-colors duration-200 ease-emphasis hover:border-brand/40">
                  <InfoIcon size={15} />
                  Tener más info
                </Link>
              </div>
            </div>
          </motion.div> : null}
      </AnimatePresence>
    </motion.li>;
}
function Detail({
  icon,
  label,
  value




}: {icon: React.ReactNode;label: string;value: string;}) {
  return <div className="flex items-center justify-between gap-3 border-b border-line py-1.5">
      <dt className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
        {icon}
        {label}
      </dt>
      <dd className="text-right text-sm font-semibold capitalize text-brand">{value}</dd>
    </div>;
}