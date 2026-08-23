import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from 'lucide-react';
import { media } from '../../data/media';
import { editions, featuredEditionId } from '../../data/editions';
import { EASE_EMPHASIS } from '../../utils/motion';

/**
 * Banda de producto en la Home: presenta Hormobiota como la marca principal que
 * hoy impulsa la organización, con su propia identidad lavanda, y enlaza a su
 * sección completa. Eventos Médicos LATAM queda como el aval institucional.
 */
export function HormobiotaBand() {
  const edition = editions.find((item) => item.id === featuredEditionId);
  return <section className="relative isolate overflow-hidden bg-hb-ink py-20 text-white lg:py-24" style={{
    ['--accent-rgb' as string]: 'var(--tone-hormobiota)'
  }} aria-label="Hormobiota">
      <div className="absolute inset-0 -z-10">
        <img src={media.hormobiotaHero} alt="" aria-hidden="true" className="h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0" style={{
        background: 'linear-gradient(100deg, rgba(26,26,61,0.97) 0%, rgba(26,26,61,0.86) 52%, rgba(26,26,61,0.55) 100%)'
      }} />
      </div>

      <div className="mx-auto max-w-shell px-6">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.div initial={{
          opacity: 0,
          y: 22
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-hb-violet">
              Nuestro proyecto principal
            </p>
            <h2 className="mt-5 text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1.03] tracking-tight">
              Hormobiota
              <span className="block font-normal text-white/55">
                donde se unen las hormonas con la microbiota
              </span>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
              La línea académica que conecta microbiota, sistema endocrino y longevidad en una sola
              tesis clínica. Nació en 2026 y hoy es el programa que define nuestra agenda.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/hormobiota" className="group inline-flex items-center gap-2 rounded-full bg-hb-violet px-6 py-3.5 text-sm font-semibold text-hb-ink shadow-elev3 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                Conocer Hormobiota
                <ArrowRightIcon size={16} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-1" />
              </Link>
              {edition ? <Link to="/eventos/hormobiota/hormobiota-2-2027" className="inline-flex items-center rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:border-white">
                  Hormobiota 2 · {edition.year}
                </Link> : null}
            </div>
          </motion.div>

          {/* Placa de marca: el logotipo vive sobre superficie clara */}
          <motion.div initial={{
          opacity: 0,
          scale: 0.96
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} viewport={{
          once: true,
          margin: '-80px'
        }} transition={{
          duration: 0.3,
          ease: EASE_EMPHASIS,
          delay: 0.08
        }} className="mx-auto w-full max-w-md rounded-3xl bg-white p-9 shadow-elev4 lg:p-11">
            <img src={media.logoHormobiota} alt="HormoBiota 2.0 — donde se unen las hormonas con la microbiota" className="mx-auto h-auto w-full max-w-[300px]" draggable={false} />
            <p className="mt-8 border-t border-line pt-5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              Un proyecto de Eventos Médicos LATAM
            </p>
          </motion.div>
        </div>
      </div>
    </section>;
}