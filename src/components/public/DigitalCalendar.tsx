import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from 'lucide-react';
import type { SecondaryEvent } from '../../types/content';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';
interface Milestone {
  /** Fechas ISO del gran evento presencial. */
  dates: string[];
  label: string;
  href: string;
}
interface DigitalCalendarProps {
  events: SecondaryEvent[];
  selectedId?: string;
  onSelect: (event: SecondaryEvent) => void;
  /** Congreso presencial destacado dentro del calendario. */
  milestone?: Milestone;
  /** Avisa qué mes está a la vista, en formato "YYYY-MM". */
  onMonthChange?: (key: string) => void;
}
const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Calendario mensual de la agenda digital. Los días con sesión se marcan en
 * fucsia; las fechas del congreso presencial reciben un tratamiento propio,
 * más fuerte, porque son el hito del año y no una sesión más.
 */
export function DigitalCalendar({
  events,
  selectedId,
  onSelect,
  milestone,
  onMonthChange
}: DigitalCalendarProps) {
  const first = events[0]?.date ?? new Date().toISOString().slice(0, 10);
  const [cursor, setCursor] = useState(() => {
    const [year, month] = first.split('-').map(Number);
    return {
      year,
      month: month - 1
    };
  });
  const key = monthKey(cursor.year, cursor.month);
  const monthEvents = events.filter((event) => event.date.startsWith(key));
  const monthMilestone = milestone?.dates.filter((date) => date.startsWith(key)) ?? [];
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  // Lunes como primer día de la semana.
  const offset = (new Date(cursor.year, cursor.month, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [...Array.from({
    length: offset
  }, () => null), ...Array.from({
    length: daysInMonth
  }, (_, index) => index + 1)];
  function shift(delta: number) {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      onMonthChange?.(monthKey(next.getFullYear(), next.getMonth()));
      return {
        year: next.getFullYear(),
        month: next.getMonth()
      };
    });
  }
  function isoOf(day: number): string {
    return `${key}-${String(day).padStart(2, '0')}`;
  }
  function jumpToMilestone() {
    const target = milestone?.dates[0];
    if (!target) return;
    const [year, month] = target.split('-').map(Number);
    onMonthChange?.(monthKey(year, month - 1));
    setCursor({
      year,
      month: month - 1
    });
  }
  return <div className="rounded-3xl border border-line bg-white p-5 shadow-elev3 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-bold capitalize tracking-tight text-brand">
          {monthNames[cursor.month]} {cursor.year}
        </p>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => shift(-1)} aria-label="Mes anterior" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-muted transition-colors duration-150 ease-emphasis hover:border-brand/40 hover:text-brand">
            <ChevronLeftIcon size={17} />
          </button>
          <button type="button" onClick={() => shift(1)} aria-label="Mes siguiente" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-muted transition-colors duration-150 ease-emphasis hover:border-brand/40 hover:text-brand">
            <ChevronRightIcon size={17} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1">
        {weekDays.map((day, index) => <span key={`${day}-${index}`} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
            {day}
          </span>)}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={key} initial={{
        opacity: 0,
        y: 8
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -6
      }} transition={{
        duration: DURATION.dropdown,
        ease: EASE_EMPHASIS
      }} className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, index) => {
          if (day === null) {
            return <span key={`empty-${index}`} aria-hidden="true" className="h-11" />;
          }
          const iso = isoOf(day);
          const dayEvents = events.filter((event) => event.date === iso);
          const isMilestone = milestone?.dates.includes(iso) ?? false;

          // Congreso presencial: marca fuerte, fondo pleno y estrella.
          if (isMilestone) {
            return <a key={day} href={milestone?.href} aria-label={`${day} de ${monthNames[cursor.month]}: ${milestone?.label}`} className="grad-futuro relative grid h-11 place-items-center rounded-xl text-sm font-bold text-white transition-transform duration-200 ease-emphasis hover:-translate-y-0.5" style={{
              boxShadow: '0 0 0 2px rgb(var(--tone-futuro) / 0.18), 0 8px 22px rgb(var(--tone-futuro) / 0.28)'
            }}>
                  {day}
                  <StarIcon size={9} className="absolute right-1 top-1 fill-white text-white" aria-hidden="true" />
                </a>;
          }
          if (dayEvents.length === 0) {
            return <span key={day} className="grid h-11 place-items-center rounded-xl text-sm text-ink-muted">
                  {day}
                </span>;
          }
          const isSelected = dayEvents.some((event) => event.id === selectedId);
          return <button key={day} type="button" onClick={() => onSelect(dayEvents[0])} aria-label={`${day} de ${monthNames[cursor.month]}: ${dayEvents[0].title}`} aria-pressed={isSelected} className={`relative grid h-11 place-items-center rounded-xl text-sm font-semibold transition-colors duration-150 ease-emphasis ${isSelected ? 'grad-futuro' : 'grad-futuro-soft'}`} style={isSelected ? {
            color: '#fff',
            boxShadow: '0 6px 18px rgb(var(--tone-futuro) / 0.24)'
          } : {
            color: '#8a44b4'
          }}>
                {day}
                <span className="absolute bottom-1.5 h-1 w-1 rounded-full" style={{
              backgroundColor: isSelected ? '#fff' : '#b8459c'
            }} aria-hidden="true" />
              </button>;
        })}
        </motion.div>
      </AnimatePresence>

      {/* Convenciones */}
      <ul className="mt-5 space-y-2 border-t border-line pt-4 text-xs text-ink-muted">
        <li className="flex items-center gap-2">
          <span className="grad-futuro-soft h-3 w-3 rounded" aria-hidden="true" />
          Sesión digital · clic para ver e inscribirte
        </li>
        {milestone ? <li className="flex items-center gap-2">
            <span className="grad-futuro h-3 w-3 rounded" aria-hidden="true" />
            {milestone.label}
          </li> : null}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-muted">
          {monthEvents.length === 0 ? 'Sin sesiones digitales este mes.' : `${monthEvents.length} ${monthEvents.length === 1 ? 'sesión' : 'sesiones'} este mes.`}
        </p>
        {milestone && monthMilestone.length === 0 ? <button type="button" onClick={jumpToMilestone} className="text-xs font-semibold underline underline-offset-4" style={{
        color: '#a8419e'
      }}>
            Ir al congreso
          </button> : null}
      </div>
    </div>;
}