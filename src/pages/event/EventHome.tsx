import React, { useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { AwardIcon, BuildingIcon, CalendarDaysIcon, CheckIcon, ImageIcon, MapPinIcon, MicIcon, NavigationIcon, PhoneIcon, RouteIcon, StarIcon, UsersIcon } from 'lucide-react';
import { speakers as allSpeakers } from '../../data/speakers';
import { sponsorPackages } from '../../data/sponsors';
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

      {/* ── SPEAKERS preview ────────────────────────────────────────── */}
      {edition.sections.includes('speakers') ? (() => {
        const edSpeakers = allSpeakers.filter(s => s.editionId === edition.id && (s.status === 'confirmado' || s.status === 'publicado'));
        const showSection = edSpeakers.length > 0;
        return showSection ? (
          <section className="tint-aurora py-20 lg:py-24" id="speakers">
            <div className="mx-auto max-w-shell px-6">
              <Reveal>
                <RevealItem>
                  <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent mb-3">
                        Ponentes
                      </p>
                      <DisplayTitle size="lg" parts={[{ text: 'Quiénes', tone: 'bold' }, { text: 'comparten', tone: 'light' }]} />
                    </div>
                    <Link to="agenda" className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand/40 hover:text-brand">
                      Ver programa completo →
                    </Link>
                  </div>
                </RevealItem>
                <RevealItem>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {edSpeakers.slice(0, 8).map((sp, i) => (
                      <motion.div key={sp.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1], delay: Math.min(i, 4) * 0.06 }}
                        whileHover={{ y: -4 }}
                        className="group rounded-2xl border border-white bg-white/85 p-6 shadow-elev2 backdrop-blur transition-shadow duration-200 hover:shadow-elev4"
                      >
                        {/* Avatar */}
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white text-lg font-bold"
                          style={{ background: `linear-gradient(135deg, var(--color-accent), #007AFF)` }}>
                          <MicIcon size={22} />
                        </div>
                        <p className="font-bold text-brand leading-tight">
                          {sp.name === 'PENDIENTE' ? <span className="italic text-ink-muted text-sm">Por confirmar</span> : sp.name}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">{sp.specialty}</p>
                        {sp.talks[0] && (
                          <p className="mt-3 text-xs leading-relaxed text-ink border-t border-line pt-3">
                            {sp.talks[0]}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
                            <StarIcon size={9} />
                            {sp.slotLabel.split('·')[0].trim()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </RevealItem>
              </Reveal>
            </div>
          </section>
        ) : null;
      })() : null}

      {/* ── PATROCINADORES / SPONSORS ────────────────────────────────── */}
      {edition.sections.includes('patrocinadores') ? (() => {
        const edPackages = sponsorPackages.filter(p => p.editionId === edition.id);
        const pubPackages = edPackages.filter(p => p.status === 'publicado' || p.status === 'aprobado');
        return (
          <section className="surface-deep py-16 lg:py-20 text-white" id="patrocinadores">
            <div className="mx-auto max-w-shell px-6">
              <Reveal>
                <RevealItem>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-hb-violet mb-3">Patrocinadores</p>
                  <DisplayTitle size="md" surface="dark" parts={[{ text: 'Empresas que hacen', tone: 'light' }, { text: 'posible este evento', tone: 'bold' }]} />
                </RevealItem>
                {pubPackages.length > 0 ? (
                  <RevealItem>
                    <div className="mt-8 flex flex-wrap gap-4 items-center">
                      {pubPackages.map(pkg => (
                        <motion.div key={pkg.id}
                          whileHover={{ scale: 1.04 }}
                          className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/08 px-5 py-4 backdrop-blur"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                            <BuildingIcon size={20} className="text-white/70" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{pkg.name}</p>
                            <p className="text-[10px] text-white/50 capitalize">{pkg.tier}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </RevealItem>
                ) : (
                  <RevealItem>
                    <div className="mt-8 rounded-2xl border border-white/10 bg-white/05 p-8 text-center backdrop-blur">
                      <BuildingIcon size={32} className="mx-auto mb-3 text-white/30" />
                      <p className="text-sm font-semibold text-white/60 mb-1">Patrocinadores por confirmar</p>
                      <p className="text-xs text-white/40 mb-5">Está construyendo el portafolio de patrocinios de este evento.</p>
                      <Link to="/contacto?motivo=patrocinar"
                        className="inline-flex items-center gap-2 rounded-full border border-hb-violet/40 px-5 py-2.5 text-sm font-semibold text-hb-violet transition-colors hover:bg-hb-violet/10">
                        Quiero patrocinar este evento
                      </Link>
                    </div>
                  </RevealItem>
                )}
              </Reveal>
            </div>
          </section>
        );
      })() : null}

      {/* ── UBICACIÓN ────────────────────────────────────────────────── */}
      {edition.sections.includes('ubicacion') ? (
        <section className="tint-aurora py-20 lg:py-24" id="ubicacion">
          <div className="mx-auto max-w-shell px-6">
            <Reveal>
              <RevealItem>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent mb-3">Cómo llegar</p>
                <DisplayTitle size="lg" parts={[{ text: 'Sede del', tone: 'light' }, { text: 'evento', tone: 'bold' }]} />
              </RevealItem>
              <RevealItem>
                <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                  {/* Info sede */}
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }} transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                      className="rounded-2xl border border-white bg-white/85 p-6 shadow-elev3 backdrop-blur"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                          <MapPinIcon size={18} className="text-brand" />
                        </div>
                        <div>
                          <p className="font-bold text-brand text-base">{edition.venue.name}</p>
                          <p className="text-sm text-ink mt-0.5">{edition.venue.address}</p>
                          <p className="text-sm text-ink-muted">{edition.venue.city}, {edition.venue.country}</p>
                        </div>
                      </div>
                      {edition.venue.notes && (
                        <p className="text-sm text-ink leading-relaxed border-t border-line pt-4">{edition.venue.notes}</p>
                      )}
                    </motion.div>

                    {/* Opciones de transporte */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: NavigationIcon, label: 'Por GPS', hint: edition.venue.address },
                        { icon: PhoneIcon,      label: 'Contacto', hint: '+57 1 000 0000' },
                      ].map(({ icon: Icon, label, hint }) => (
                        <motion.div key={label}
                          initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }} transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
                          className="rounded-xl border border-white bg-white/75 p-4 shadow-elev1 backdrop-blur"
                        >
                          <Icon size={16} className="text-accent mb-2" />
                          <p className="text-xs font-semibold text-brand">{label}</p>
                          <p className="text-[11px] text-ink-muted mt-0.5 truncate">{hint}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Mapa placeholder */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="relative overflow-hidden rounded-2xl border border-white shadow-elev3 min-h-[280px] bg-brand-soft flex items-center justify-center"
                  >
                    {/* Google Maps embed — reemplazar con URL real */}
                    <div className="text-center p-8">
                      <MapPinIcon size={32} className="mx-auto mb-3 text-brand/40" />
                      <p className="text-sm font-semibold text-brand/60">{edition.venue.name}</p>
                      <p className="text-xs text-ink-muted mt-1">{edition.venue.city}</p>
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(edition.venue.address + ', ' + edition.venue.city)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-deep">
                        Abrir en Google Maps
                      </a>
                    </div>
                  </motion.div>
                </div>
              </RevealItem>
            </Reveal>
          </div>
        </section>
      ) : null}

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