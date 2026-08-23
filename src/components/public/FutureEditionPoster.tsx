import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { ArrowRightIcon } from 'lucide-react';
import type { LegacyEvent } from '../../data/legacy';
import { media } from '../../data/media';
import { EASE_EMPHASIS } from '../../utils/motion';
interface FutureEditionPosterProps {
  event: LegacyEvent;
  /** Solo la tarjeta al frente reacciona al cursor y se abre. */
  isActive: boolean;
}

/**
 * Tarjeta de la próxima edición. A diferencia de las realizadas —que son una
 * ventana fotográfica a lo que ocurrió— esta es un afiche: la imagen insignia
 * de la marca al fondo, el campo holográfico encima y el logotipo como sujeto.
 *
 * Dos comportamientos propios:
 *  A. El holograma sigue al cursor, como una lámina que se inclina bajo la luz.
 *  B. Al pasar el cursor el afiche se abre: el logotipo sube y cede el espacio
 *     a la información, que emerge desde abajo. Nada tapa nunca al logotipo.
 */
export function FutureEditionPoster({
  event,
  isActive
}: FutureEditionPosterProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // Posición normalizada del cursor dentro de la tarjeta (-1 a 1).
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, {
    stiffness: 120,
    damping: 22,
    mass: 0.6
  });
  const sy = useSpring(py, {
    stiffness: 120,
    damping: 22,
    mass: 0.6
  });

  // Cada capa del holograma se desplaza a su propia velocidad: eso es lo que
  // produce la sensación de lámina iridiscente y no de fondo plano.
  const layerAx = useTransform(sx, [-1, 1], ['-9%', '9%']);
  const layerAy = useTransform(sy, [-1, 1], ['-7%', '7%']);
  const layerBx = useTransform(sx, [-1, 1], ['6%', '-6%']);
  const layerBy = useTransform(sy, [-1, 1], ['5%', '-5%']);
  const layerCx = useTransform(sx, [-1, 1], ['-14%', '14%']);
  const layerCy = useTransform(sy, [-1, 1], ['10%', '-10%']);
  // Brillo especular que persigue al puntero.
  const sheenX = useTransform(sx, [-1, 1], [15, 85]);
  const sheenY = useTransform(sy, [-1, 1], [15, 85]);
  const sheen = useTransform([sheenX, sheenY], ([x, y]: number[]) => `radial-gradient(38% 46% at ${x}% ${y}%, rgba(255,255,255,0.20) 0%, transparent 70%)`);
  // La fotografía se desplaza en contra del holograma: eso es lo que genera
  // profundidad real entre las dos capas.
  const photoX = useTransform(sx, [-1, 1], ['3.5%', '-3.5%']);
  const photoY = useTransform(sy, [-1, 1], ['3%', '-3%']);
  const interactive = isActive && !reduce;
  const opened = interactive && open;
  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!interactive) return;
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    px.set((e.clientX - box.left) / box.width * 2 - 1);
    py.set((e.clientY - box.top) / box.height * 2 - 1);
  }
  return <div ref={ref} className="relative h-full w-full overflow-hidden rounded-3xl bg-hb-ink" onMouseMove={handleMove} onMouseEnter={() => setOpen(true)} onClick={() => {
    if (isActive && !reduce) setOpen((current) => !current);
  }} onMouseLeave={() => {
    setOpen(false);
    px.set(0);
    py.set(0);
  }}>
      {/* --- Fotografía de marca: vive debajo del holograma --- */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <motion.img src={media.hormobiotaHero} alt="" draggable={false} className="absolute -inset-[6%] h-[112%] w-[112%] object-cover" style={reduce ? undefined : {
        x: photoX,
        y: photoY
      }} animate={reduce ? undefined : {
        scale: opened ? 1.06 : 1
      }} transition={{
        type: 'spring',
        stiffness: 160,
        damping: 26
      }} />
        {/* Velo azul noche: garantiza que el logotipo blanco siempre se lea */}
        <div className="absolute inset-0" style={{
        background: 'linear-gradient(160deg, rgba(26,26,61,0.82) 0%, rgba(26,26,61,0.7) 45%, rgba(26,26,61,0.86) 100%)'
      }} />
      </div>

      {/* --- Campo holográfico: por encima de la fotografía --- */}
      <div className="absolute inset-0 overflow-hidden mix-blend-screen" aria-hidden="true">
        <motion.div className="absolute -inset-[30%]" style={{
        x: layerAx,
        y: layerAy,
        background: 'radial-gradient(45% 55% at 22% 18%, rgba(48,86,176,0.62) 0%, transparent 68%)'
      }} />
        <motion.div className="absolute -inset-[30%]" style={{
        x: layerBx,
        y: layerBy,
        background: 'radial-gradient(48% 58% at 78% 26%, rgba(124,107,192,0.55) 0%, transparent 66%)'
      }} />
        <motion.div className="absolute -inset-[30%]" style={{
        x: layerCx,
        y: layerCy,
        background: 'radial-gradient(52% 60% at 62% 92%, rgba(214,51,132,0.58) 0%, transparent 66%)'
      }} />
        {/* Trama fina, para que el color tenga materia */}
        <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1px)',
        backgroundSize: '9px 9px'
      }} />
        {/* Brillo especular siguiendo al cursor */}
        {interactive ? <motion.div className="absolute inset-0" style={{
        background: sheen
      }} /> : null}
      </div>

      {/* Contorno fucsia: la única tarjeta que lo lleva */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl" style={{
      boxShadow: 'inset 0 0 0 2px rgb(var(--tone-futuro) / 0.75)'
    }} aria-hidden="true" />

      {/* Cintilla del año */}
      <div className="pointer-events-none absolute -right-14 top-8 z-30 w-52 rotate-45 py-2 text-center shadow-elev3" style={{
      backgroundColor: 'rgb(var(--tone-futuro))'
    }} aria-hidden="true">
        <span className="text-sm font-bold tabular-nums tracking-[0.16em] text-white">
          {event.year}
        </span>
      </div>

      {/* --- Contenido del afiche --- */}
      <div className="relative flex h-full flex-col p-5 sm:p-9 lg:p-10">
        {/* Cabecera: distintivo de próxima edición */}
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-elev2" style={{
          backgroundColor: 'rgb(var(--tone-futuro))'
        }}>
            <motion.span className="h-1.5 w-1.5 rounded-full bg-white" animate={reduce ? undefined : {
            opacity: [1, 0.25, 1]
          }} transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'linear'
          }} />
            Próxima edición
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
            Edición {event.order}
          </span>
        </div>

        {/* Logotipo: sujeto de la pieza. Al abrirse sube y cede el espacio. */}
        <motion.div className="flex min-h-0 flex-1 items-center justify-center" animate={reduce ? undefined : {
        scale: opened ? 0.5 : 1,
        y: opened ? -12 : 0
      }} transition={{
        type: 'spring',
        stiffness: 210,
        damping: 26
      }} style={{
        transformOrigin: 'center top'
      }}>
          <img src={media.logoHormobiotaDark} alt="HormoBiota 2.0 — donde se unen las hormonas con la microbiota" className="h-auto max-h-full w-[54%] max-w-[380px] object-contain sm:w-[62%]" draggable={false} />
        </motion.div>

        {/* Pie en reposo: fecha y lugar, más la invitación a explorar */}
        <AnimatePresence initial={false} mode="wait">
          {reduce ? null : !opened ? <motion.div key="resting" initial={{
          opacity: 0,
          y: 8
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -8
        }} transition={{
          duration: 0.2,
          ease: EASE_EMPHASIS
        }} className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium tracking-tight text-white/80">
                {event.claim}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {reduce ? '' : 'Pasa el cursor para conocerla'}
              </p>
            </motion.div> : <motion.div key="open" initial={{
          opacity: 0,
          y: 26
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: 26
        }} transition={{
          duration: 0.28,
          ease: EASE_EMPHASIS
        }} className="min-h-0 shrink-0 overflow-y-auto">
              <p className="line-clamp-3 max-w-xl text-sm leading-relaxed text-white/85 sm:line-clamp-none sm:text-base">
                {event.description}
              </p>
              <ul className="mt-4 hidden flex-wrap gap-2 sm:flex">
                {event.highlights.map((item, index) => <motion.li key={item} initial={{
              opacity: 0,
              y: 12
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.24,
              ease: EASE_EMPHASIS,
              delay: 0.06 + index * 0.045
            }} className="rounded-full border border-white/25 px-3 py-1 text-xs text-white/80">
                    {item}
                  </motion.li>)}
              </ul>
              <Link to={event.href} onClick={(e) => e.stopPropagation()} className="group mt-4 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-elev3 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5 sm:mt-6" style={{
            backgroundColor: 'rgb(var(--tone-futuro))'
          }}>
                Ver HormoBiota 2.0
                <ArrowRightIcon size={16} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-1" />
              </Link>
            </motion.div>}
        </AnimatePresence>

        {/* Movimiento reducido: la información va siempre visible y sin efectos */}
        {reduce ? <div className="mt-5">
            <p className="text-sm leading-relaxed text-white/85">{event.description}</p>
            <Link to={event.href} className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white" style={{
          backgroundColor: 'rgb(var(--tone-futuro))'
        }}>
              Ver HormoBiota 2.0
              <ArrowRightIcon size={16} />
            </Link>
          </div> : null}
      </div>
    </div>;
}