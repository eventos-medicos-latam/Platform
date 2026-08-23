import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRightIcon, HandshakeIcon, MailIcon } from 'lucide-react';
import { editions, featuredEditionId, getFamily } from '../../data/editions';
import { editionMedia } from '../../data/media';
import { editionStatusMeta, StatusBadge } from '../ui/StatusBadge';
import { TrackIcon } from '../ui/TrackIcon';
import { EASE_EMPHASIS } from '../../utils/motion';

/** Presentación del próximo evento con imagen a sangre y ejes en movimiento. */
export function NextEventPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const {
    scrollYProgress
  } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const edition = editions.find((item) => item.id === featuredEditionId);
  if (!edition) return null;
  const family = getFamily(edition.familyId);
  if (!family) return null;
  const base = `/eventos/${family.slug}/${edition.slug}`;
  const status = editionStatusMeta[edition.status];
  return <section ref={ref} className="relative overflow-hidden bg-brand-deep text-white" style={{
    ['--accent-rgb' as string]: edition.accentRgb
  }}>
      <div className="grid lg:grid-cols-[1.05fr_1fr]">
        {/* Texto */}
        <div className="order-2 px-6 py-16 lg:order-1 lg:py-24 lg:pl-[max(1.5rem,calc((100vw-1240px)/2))] lg:pr-14">
          <motion.div initial={{
          opacity: 0,
          y: 16
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true,
          margin: '-80px'
        }} transition={{
          duration: 0.3,
          ease: EASE_EMPHASIS
        }}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                {family.name} · {edition.editionLabel}
              </span>
              <StatusBadge label={status.label} tone="accent" dot />
            </div>

            <h2 className="mt-5 text-[clamp(2rem,4.4vw,3.4rem)] font-bold leading-[1.03] tracking-tight">
              {edition.claim}
            </h2>
            <p className="mt-6 max-w-xl text-lg font-medium leading-snug text-accent">
              {edition.conceptLead}
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">
              {edition.concept[0]}
            </p>

            <ul className="mt-9 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {edition.trackAxis.tracks.map((track, index) => <motion.li key={track.id} initial={{
              opacity: 0,
              x: -12
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true,
              margin: '-40px'
            }} transition={{
              duration: 0.26,
              ease: EASE_EMPHASIS,
              delay: index * 0.04
            }} className="group flex items-center gap-3 border-b border-white/10 pb-2.5">
                  <TrackIcon icon={track.icon} size={22} className="shrink-0 text-white/70" />
                  <span className="text-sm font-medium text-white/85">{track.name}</span>
                  <span className="ml-auto text-[11px] font-semibold text-white/35">
                    {String(track.order).padStart(2, '0')}
                  </span>
                </motion.li>)}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link to={base} className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-deep transition-colors duration-200 ease-emphasis hover:bg-white/90">
                Ver evento
                <ArrowUpRightIcon size={15} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link to={`${base}/inscripcion`} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:border-white">
                <MailIcon size={15} /> Recibir información
              </Link>
              <Link to="/contacto?motivo=patrocinar" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:border-white">
                <HandshakeIcon size={15} /> Quiero patrocinar
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Imagen */}
        <div className="relative order-1 min-h-[320px] overflow-hidden lg:order-2 lg:min-h-full">
          <motion.img src={editionMedia[edition.id]} alt={`Identidad visual de ${edition.name}`} className="absolute inset-0 h-[116%] w-full object-cover" style={reduce ? undefined : {
          y: imageY
        }} />
          <div className="absolute inset-0" aria-hidden="true" style={{
          background: 'linear-gradient(90deg, rgba(6,17,33,0.9) 0%, rgba(6,17,33,0.25) 45%, rgba(6,17,33,0.55) 100%)'
        }} />
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
            <p className="max-w-xs text-sm leading-snug text-white/80">
              {edition.preExperience ? `${edition.preExperience.name}: ${edition.preExperience.durationLabel}` : edition.dateLabel}
            </p>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur">
              {edition.venue.city}
            </span>
          </div>
        </div>
      </div>
    </section>;
}