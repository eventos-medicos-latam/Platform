import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EASE_EMPHASIS } from '../../utils/motion';
interface FlipCountdownProps {
  targetDate: string;
  /** dark: sobre superficie oscura. light: sobre superficie clara. */
  surface?: 'dark' | 'light';
  size?: 'md' | 'lg';
  className?: string;
}
interface Unit {
  key: string;
  label: string;
  value: number;
}
function units(target: string): Unit[] {
  const delta = Math.max(0, new Date(`${target}T08:00:00`).getTime() - Date.now());
  return [{
    key: 'd',
    label: 'Días',
    value: Math.floor(delta / 86_400_000)
  }, {
    key: 'h',
    label: 'Horas',
    value: Math.floor(delta / 3_600_000 % 24)
  }, {
    key: 'm',
    label: 'Min',
    value: Math.floor(delta / 60_000 % 60)
  }, {
    key: 's',
    label: 'Seg',
    value: Math.floor(delta / 1000 % 60)
  }];
}
interface DigitProps {
  value: string;
  surface: 'dark' | 'light';
  size: 'md' | 'lg';
}

/** Dígito en tarjeta: el número saliente cae y el nuevo entra desde arriba. */
function Digit({
  value,
  surface,
  size
}: DigitProps) {
  const reduce = useReducedMotion();
  const box = size === 'lg' ? 'h-[76px] w-[54px] text-[2.6rem] sm:h-[92px] sm:w-[66px] sm:text-[3.4rem]' : 'h-[54px] w-[38px] text-[1.8rem]';
  return <span className={`relative flex items-center justify-center overflow-hidden rounded-xl font-bold tabular-nums ${box} ${surface === 'dark' ? 'glass-panel text-white' : 'border border-line bg-white text-brand shadow-elev2'}`}>
      {/* Línea de charnela que da el efecto de tarjeta física */}
      <span aria-hidden="true" className={`absolute left-0 right-0 top-1/2 z-10 h-px ${surface === 'dark' ? 'bg-black/25' : 'bg-line'}`} />
      {reduce ? <span>{value}</span> : <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={value} initial={{
        y: '-100%',
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} exit={{
        y: '100%',
        opacity: 0
      }} transition={{
        duration: 0.26,
        ease: EASE_EMPHASIS
      }} className="block leading-none">
            {value}
          </motion.span>
        </AnimatePresence>}
    </span>;
}

/**
 * Cuenta regresiva en tarjetas: cada dígito cae al cambiar, como un tablero
 * físico. Los días llevan el peso visual; el resto acompaña.
 */
export function FlipCountdown({
  targetDate,
  surface = 'dark',
  size = 'lg',
  className = ''
}: FlipCountdownProps) {
  const [parts, setParts] = useState<Unit[]>(() => units(targetDate));
  useEffect(() => {
    const timer = window.setInterval(() => setParts(units(targetDate)), 1000);
    return () => window.clearInterval(timer);
  }, [targetDate]);
  return <div className={`flex items-end gap-2.5 sm:gap-3.5 ${className}`} role="timer" aria-label="Tiempo restante para el evento">
      {parts.map((unit, index) => {
      const digits = String(unit.value).padStart(2, '0').split('');
      return <React.Fragment key={unit.key}>
            {index > 0 ? <span aria-hidden="true" className={`mb-7 h-1 w-1 rounded-full ${surface === 'dark' ? 'bg-white/30' : 'bg-line'}`} /> : null}
            <div className="flex flex-col items-center gap-2">
              <span className="flex gap-1.5">
                {digits.map((digit, digitIndex) => <Digit key={`${unit.key}-${digitIndex}`} value={digit} surface={surface} size={index === 0 ? size : 'md'} />)}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${surface === 'dark' ? 'text-white/50' : 'text-ink-muted'}`}>
                {unit.label}
              </span>
            </div>
          </React.Fragment>;
    })}
    </div>;
}