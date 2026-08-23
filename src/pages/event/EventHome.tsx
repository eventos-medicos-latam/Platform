import React, { useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { AwardIcon, CalendarDaysIcon, CheckIcon, ImageIcon, MapPinIcon, RouteIcon, UsersIcon } from 'lucide-react';
import type { Edition } from '../../types/event';
import { PageTransition } from '../../components/motion/PageTransition';
import { Reveal, RevealItem } from '../../components/motion/Reveal';
import { BridgesJourney } from '../../components/event/BridgesJourney';
import { FlipCountdown } from '../../components/event/FlipCountdown';
import { SponsorBanner } from '../../components/public/SponsorBanner';
import { DisplayTitle } from '../../components/ui/DisplayTitle';
import { Pending } from '../../components/ui/Pending';
import { cascadeChild, cascadeParent, EASE_EMPHASIS } from '../../utils/motion';
import { getEdition } from '../../data/editions';
import { editionMedia, media } from '../../data/media';
export function EventHome() {
  const {
    edition
  } = useOutletContext<{
    edition: Edition;
  }>();
  const isHistoric = edition.status === 'historico';
  const next = edition.nextEditionId ? getEdition(edition.nextEditionId) : undefined;
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const conceptRef = useRef<HTMLDivElement>(null);
  const {
    scrollYProgress
  } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const heroImageScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.16]);
  const heroContentY = useTransform(scrollYProgress, [0, 1], ['0%', '-12%']);
  const heroFade = useTransform(scrollYProgress, [0, 0.9], [1, 0]);

  // El panel de concepto llega inclinado y se endereza al subir por pantalla.
  const {
    scrollYProgress: conceptProgress
  } = useScroll({
    target: conceptRef,
    offset: ['start end', 'center center']
  });
  const conceptRotate = useTransform(conceptProgress, [0, 1], [7, 0]);
  const conceptY = useTransform(conceptProgress, [0, 1], [52, 0]);
  return <PageTransition>
      {/* Hero */}
      <section ref={heroRef} className="surface-deep relative isolate overflow-hidden text-white">
        <motion.div className="absolute inset-0 -z-10" style={reduce ? undefined : {
        y: heroImageY,
        scale: heroImageScale
      }}>
          <img src={editionMedia[edition.id]} alt="" aria-hidden="true" className="h-full w-full object-cover opacity-50" />
        </motion.div>
        <div className="absolute inset-0 -z-10" aria-hidden="true" style={{
        background: 'linear-gradient(180deg, rgba(26,26,61,0.9) 0%, rgba(26,26,61,0.7) 45%, rgba(26,26,61,0.98) 100%)'
      }} />

        <motion.div className="mx-auto flex max-w-shell flex-col gap-14 px-6 py-20 lg:flex-row lg:items-center lg:gap-16 lg:py-28" style={reduce ? undefined : {
        y: heroContentY,
        opacity: heroFade
      }}>
          <motion.div className="min-w-0 flex-1" variants={cascadeParent()} initial="initial" animate="enter">
            <motion.img variants={cascadeChild} src={media.logoHormobiotaDark} alt="HormoBiota 2.0 — donde se unen las hormonas con la microbiota" className="h-28 w-auto sm:h-40" draggable={false} />

            <motion.p variants={cascadeChild} className="mt-8 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-hb-violet">
              <span className="h-px w-9 bg-hb-violet" aria-hidden="true" />
              {edition.heroKicker}
            </motion.p>

            <DisplayTitle as="h1" size="xl" surface="dark" animate={false} className="mt-5 max-w-4xl" parts={[{
            text: edition.name,
            tone: 'bold'
          }]} />

            <motion.p variants={cascadeChild} className="mt-5 max-w-2xl text-xl font-medium leading-snug text-white/80 lg:text-2xl">
              {edition.claim}
            </motion.p>

            <motion.dl variants={cascadeChild} className="mt-10 grid gap-3 sm:grid-cols-3">
              {[{
              icon: CalendarDaysIcon,
              label: 'Fecha',
              value: edition.dateLabel
            }, {
              icon: MapPinIcon,
              label: 'Lugar',
              value: `${edition.venue.name} · ${edition.venue.city}`
            }, {
              icon: UsersIcon,
              label: 'Modalidad',
              value: edition.modality
            }].map((fact) => <motion.div key={fact.label} whileHover={reduce ? undefined : {
              y: -4
            }} transition={{
              duration: 0.2,
              ease: EASE_EMPHASIS
            }} className="glass-panel rounded-2xl p-4">
                  <fact.icon size={17} className="text-hb-violet" />
                  <dt className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                    {fact.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium capitalize">{fact.value}</dd>
                </motion.div>)}
            </motion.dl>

            {!isHistoric ? <motion.div variants={cascadeChild} className="mt-10 flex flex-wrap items-center gap-4">
                <Link to="inscripcion" className="grad-futuro rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-elev3 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                  Quiero inscribirme
                </Link>
                <Link to="agenda" className="rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:border-white">
                  Ver la agenda
                </Link>
              </motion.div> : <motion.div variants={cascadeChild} className="mt-10 flex flex-wrap gap-4">
                {next ? <Link to={`/eventos/hormobiota/${next.slug}`} className="grad-futuro rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-elev3 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                    Ver la próxima edición: {next.name}
                  </Link> : null}
                <Link to="agenda" className="rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white hover:border-white">
                  Programa realizado
                </Link>
              </motion.div>}
          </motion.div>

          {/* Reloj de cuenta regresiva */}
          {!isHistoric ? <motion.div className="flex shrink-0 justify-center lg:justify-end" initial={{
          opacity: 0,
          scale: 0.96,
          rotateY: -10
        }} animate={{
          opacity: 1,
          scale: 1,
          rotateY: 0
        }} transition={{
          duration: 0.3,
          ease: EASE_EMPHASIS,
          delay: 0.18
        }} style={{
          perspective: 1200
        }}>
              <div className="glass-panel rounded-3xl p-6 shadow-elev4 sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-hb-violet">
                  Cuenta regresiva
                </p>
                <FlipCountdown targetDate={edition.startDate} size="lg" className="mt-5" />
                <div className="mt-6 border-t border-white/12 pt-4">
                  <p className="text-sm font-semibold text-white">{edition.dateLabel}</p>
                  <p className="mt-0.5 text-xs text-white/75">
                    {edition.venue.name} · {edition.venue.city}
                  </p>
                </div>
              </div>
            </motion.div> : null}
        </motion.div>
      </section>

      {/* Concepto: panel flotante que se endereza con el scroll */}
      <section className="tint-aurora py-20 lg:py-28">
        <div ref={conceptRef} className="mx-auto max-w-shell px-6 [perspective:1400px]">
          <motion.div style={reduce ? undefined : {
          rotateX: conceptRotate,
          y: conceptY
        }} className="overflow-hidden rounded-[2rem] border border-white bg-white/90 shadow-elev4 backdrop-blur">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
              {/* Retrato: la sección deja de ser solo texto */}
              <div className="relative isolate min-h-[280px] overflow-hidden lg:min-h-full">
                <img src={media.doctorPortrait} alt="Profesional de la salud en consulta" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0" aria-hidden="true" style={{
                background: 'linear-gradient(160deg, rgba(26,26,61,0.72) 0%, rgba(26,26,61,0.25) 45%, rgba(214,51,132,0.28) 100%)'
              }} />
                <div className="relative flex h-full flex-col justify-between p-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white">
                    Concepto
                  </p>
                  <p className="max-w-xs text-lg font-semibold leading-snug text-white drop-shadow">
                    Para el profesional que atiende pacientes reales, no para el archivo.
                  </p>
                </div>
              </div>

              <div className="p-8 sm:p-12">
                <div className="flex items-center gap-3">
                  <span className="grad-futuro h-5 w-1 rounded-full" aria-hidden="true" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                    De qué se trata {edition.name}
                  </p>
                </div>
                <DisplayTitle as="h2" size="lg" className="mt-4" parts={[{
                text: edition.conceptLead,
                tone: 'bold'
              }]} />
                <div className="mt-6 space-y-4 text-base leading-relaxed text-ink lg:text-lg">
                  {edition.concept.map((paragraph) => <p key={paragraph.slice(0, 24)}>{paragraph}</p>)}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ejes temáticos */}
      {edition.sections.includes('ejes') && edition.trackAxis.tracks.length > 0 ? <section className="surface-deep relative isolate overflow-hidden py-20 text-white lg:py-28">
          <div className="relative mx-auto max-w-shell px-6">
            <Reveal>
              <RevealItem>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-hb-violet">
                  Programa académico
                </p>
                <DisplayTitle size="lg" surface="dark" className="mt-4 max-w-2xl" parts={[{
              text: edition.trackAxis.pluralLabel,
              tone: 'bold'
            }, {
              text: 'un recorrido, no una lista',
              tone: 'light'
            }]} />
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85">
                  Cada puente es una conexión entre sistemas. Recórrelos para ver cómo se enlazan y
                  qué contenido trae cada uno.
                </p>
              </RevealItem>
              <RevealItem>
                <div className="mt-10">
                  <BridgesJourney axis={edition.trackAxis} />
                </div>
              </RevealItem>
            </Reveal>
          </div>
        </section> : null}

      {/* Público y beneficios */}
      {edition.sections.includes('publico') || edition.sections.includes('beneficios') ? <section className="tint-aurora py-20 lg:py-28">
          <div className="mx-auto max-w-shell px-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {edition.sections.includes('publico') ? <motion.div initial={{
            opacity: 0,
            y: 26,
            rotateY: 6
          }} whileInView={{
            opacity: 1,
            y: 0,
            rotateY: 0
          }} viewport={{
            once: true,
            margin: '-70px'
          }} transition={{
            duration: 0.3,
            ease: EASE_EMPHASIS
          }} className="rounded-3xl border border-white bg-white/85 p-8 shadow-elev3 backdrop-blur [perspective:1000px] sm:p-10">
                  <DisplayTitle size="md" parts={[{
              text: '¿Para quién',
              tone: 'bold'
            }, {
              text: 'es?',
              tone: 'light'
            }]} />
                  <ul className="mt-7 space-y-3">
                    {edition.audience.map((item, index) => <motion.li key={item} initial={{
                opacity: 0,
                x: -12
              }} whileInView={{
                opacity: 1,
                x: 0
              }} viewport={{
                once: true
              }} transition={{
                duration: 0.24,
                ease: EASE_EMPHASIS,
                delay: Math.min(index, 6) * 0.05
              }} className="flex gap-3 rounded-xl px-3 py-2 text-base text-ink transition-colors duration-150 ease-emphasis hover:bg-brand-soft">
                        <CheckIcon size={18} className="mt-0.5 shrink-0 text-accent" />
                        {item}
                      </motion.li>)}
                  </ul>
                </motion.div> : null}

              {edition.sections.includes('beneficios') && edition.benefits.length > 0 ? <motion.div initial={{
            opacity: 0,
            y: 26,
            rotateY: -6
          }} whileInView={{
            opacity: 1,
            y: 0,
            rotateY: 0
          }} viewport={{
            once: true,
            margin: '-70px'
          }} transition={{
            duration: 0.3,
            ease: EASE_EMPHASIS,
            delay: 0.06
          }} className="rounded-3xl border border-white bg-white/85 p-8 shadow-elev3 backdrop-blur sm:p-10">
                  <DisplayTitle size="md" parts={[{
              text: 'Qué',
              tone: 'bold'
            }, {
              text: 'incluye',
              tone: 'light'
            }]} />
                  <ul className="mt-7 grid gap-2.5">
                    {edition.benefits.map((item, index) => <motion.li key={item} initial={{
                opacity: 0,
                y: 12
              }} whileInView={{
                opacity: 1,
                y: 0
              }} viewport={{
                once: true
              }} transition={{
                duration: 0.24,
                ease: EASE_EMPHASIS,
                delay: Math.min(index, 6) * 0.05
              }} whileHover={reduce ? undefined : {
                x: 4
              }} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 text-sm font-medium text-brand shadow-elev1">
                        <span className="grad-futuro h-8 w-1 shrink-0 rounded-full" aria-hidden="true" />
                        {item}
                      </motion.li>)}
                  </ul>
                </motion.div> : null}
            </div>
          </div>
        </section> : null}

      {/* Ruta previa + certificación */}
      <section className="tint-aurora border-t border-white/60 py-20 lg:py-24">
        <div className="mx-auto max-w-shell px-6">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            {edition.preExperience ? <motion.div initial={{
            opacity: 0,
            y: 26
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true,
            margin: '-70px'
          }} transition={{
            duration: 0.3,
            ease: EASE_EMPHASIS
          }} whileHover={reduce ? undefined : {
            y: -6
          }} className="surface-deep relative isolate h-full overflow-hidden rounded-3xl p-8 text-white shadow-elev4 lg:p-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-hb-violet">
                  <RouteIcon size={14} /> Experiencia previa
                </span>
                <h2 className="mt-5 text-2xl font-bold tracking-tight lg:text-3xl">
                  {edition.preExperience.name}
                </h2>
                <p className="mt-1.5 text-sm font-medium text-white/75">
                  {edition.preExperience.durationLabel}
                </p>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90">
                  {edition.preExperience.description}
                </p>
                <ul className="mt-7 flex flex-wrap gap-2">
                  {edition.preExperience.channels.map((channel) => <li key={channel} className="rounded-full border border-white/25 px-3 py-1 text-xs font-medium text-white/80">
                      {channel}
                    </li>)}
                </ul>
              </motion.div> : null}

            {edition.sections.includes('certificacion') ? <motion.div initial={{
            opacity: 0,
            y: 26
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true,
            margin: '-70px'
          }} transition={{
            duration: 0.3,
            ease: EASE_EMPHASIS,
            delay: 0.06
          }} whileHover={reduce ? undefined : {
            y: -6
          }} className="h-full rounded-3xl border border-white bg-white/85 p-8 shadow-elev3 backdrop-blur">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  <AwardIcon size={15} className="text-accent" /> Certificación
                </span>
                <p className="mt-4 text-base leading-relaxed text-ink">{edition.certification}</p>
                <div className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-ink-muted">Horas académicas</span>
                    <Pending />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-ink-muted">Capacidad del auditorio</span>
                    <Pending />
                  </div>
                </div>
              </motion.div> : null}
          </div>
        </div>
      </section>

      {/* Archivo histórico */}
      {isHistoric ? <section className="tint-aurora py-20 lg:py-24">
          <div className="mx-auto max-w-shell px-6">
            <Reveal>
              <RevealItem>
                <DisplayTitle size="lg" parts={[{
              text: 'Resultados',
              tone: 'bold'
            }, {
              text: 'y memorias',
              tone: 'light'
            }]} />
              </RevealItem>

              {edition.results ? <RevealItem>
                  <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {edition.results.map((result) => <motion.div key={result.label} whileHover={reduce ? undefined : {
                y: -5
              }} transition={{
                duration: 0.2,
                ease: EASE_EMPHASIS
              }} className="rounded-2xl border border-white bg-white/85 px-5 py-6 shadow-elev2 backdrop-blur">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                          {result.label}
                        </dt>
                        <dd className="mt-2 text-lg font-semibold text-brand">
                          {result.value === 'PENDIENTE' ? <Pending /> : result.value}
                        </dd>
                      </motion.div>)}
                  </dl>
                </RevealItem> : null}

              <RevealItem>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {[1, 2, 3].map((slot) => <figure key={slot} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white/60 text-ink-muted backdrop-blur">
                      <ImageIcon size={22} />
                      <figcaption className="text-xs font-medium uppercase tracking-wide">
                        Galería PENDIENTE
                      </figcaption>
                    </figure>)}
                </div>
              </RevealItem>
            </Reveal>
          </div>
        </section> : null}

      <SponsorBanner surface="evento" />

      {/* CTA final */}
      <section className="surface-deep relative isolate overflow-hidden text-white">
        <div className="relative mx-auto flex max-w-shell flex-col gap-6 px-6 py-20 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[clamp(1.7rem,3.2vw,2.7rem)] font-bold leading-tight tracking-tight">
              {isHistoric ? 'La conversación continúa en la próxima edición' : `Nos vemos en ${edition.venue.city}`}
            </h2>
            <p className="mt-3 max-w-xl text-white/70">
              {isHistoric ? 'Hormobiota vuelve con seis puentes que conectan el intestino con la longevidad.' : edition.dateLabel}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {isHistoric && next ? <Link to={`/eventos/hormobiota/${next.slug}`} className="grad-futuro rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-elev3 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                Ver {next.name}
              </Link> : <Link to="inscripcion" className="grad-futuro rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-elev3 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                Inscribirme
              </Link>}
            <Link to="/contacto?motivo=patrocinar" className="rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:border-white">
              Quiero ser patrocinador
            </Link>
          </div>
        </div>
      </section>
    </PageTransition>;
}