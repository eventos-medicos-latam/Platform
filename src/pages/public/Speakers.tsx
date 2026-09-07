import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  SearchIcon, MicVocalIcon, ShieldCheckIcon, GlobeIcon,
  UsersIcon, CalendarDaysIcon, ArrowRightIcon,
  MessageCircleIcon, CheckCircleIcon, StarIcon, HeartHandshakeIcon,
} from 'lucide-react';
import { PageTransition } from '../../components/motion/PageTransition';
import { PageHero } from '../../components/public/PageHero';
import { SectionTransition } from '../../components/motion/SectionTransition';
import { SpeakerCarousel } from '../../components/speakers/SpeakerCarousel';
import { MOCK_SPEAKERS } from '../../components/speakers/speakerData';
import { media } from '../../data/media';
import { EASE_EMPHASIS } from '../../utils/motion';

const ESPECIALIDADES = ['Todas', ...Array.from(new Set(MOCK_SPEAKERS.map(s => s.especialidad)))];

/* ── Datos de la propuesta de valor ── */
const OFFERINGS = [
  {
    icon: ShieldCheckIcon,
    title: 'Red verificada',
    body: 'Cada speaker pasa por un proceso de validación de credenciales, trayectoria y publicaciones antes de aparecer en la plataforma.',
  },
  {
    icon: CalendarDaysIcon,
    title: 'Disponibilidad real',
    body: 'Los speakers declaran si participan de forma presencial o virtual por evento. Sin sorpresas de último momento.',
  },
  {
    icon: GlobeIcon,
    title: 'Alcance latinoamericano',
    body: 'Especialistas de Colombia, México, Argentina, Chile, Perú y más países, con experiencia en eventos internacionales.',
  },
  {
    icon: HeartHandshakeIcon,
    title: 'Intermediación EML',
    body: 'Todas las solicitudes pasan primero por nuestro equipo. Coordinamos tiempos, honorarios y logística antes de conectarte.',
  },
  {
    icon: MicVocalIcon,
    title: 'Perfil académico completo',
    body: 'Bio, experiencia clínica, temas de ponencia, publicaciones y videos disponibles. Suficiente para tomar decisiones informadas.',
  },
  {
    icon: StarIcon,
    title: 'Historial EML',
    body: 'Puedes ver en qué ediciones de Hormobiota y otros eventos EML ha participado cada especialista y en qué rol.',
  },
];

/* ── Pasos del proceso de contacto ── */
const STEPS = [
  {
    num: '01',
    title: 'Explora el directorio',
    body: 'Filtra por especialidad o busca por nombre o tema. Cada tarjeta muestra la disponibilidad y el historial del speaker.',
  },
  {
    num: '02',
    title: 'Revisa el perfil completo',
    body: 'Haz clic en "Ver perfil completo" para leer la bio extendida, experiencias, eventos anteriores y videos.',
  },
  {
    num: '03',
    title: 'Envía tu solicitud',
    body: 'Completa el formulario de interés con tu nombre, empresa, evento y mensaje. No pagas nada en este paso.',
  },
  {
    num: '04',
    title: 'EML gestiona la conexión',
    body: 'Nuestro equipo evalúa la solicitud, verifica disponibilidad y te pone en contacto directo con el especialista.',
  },
];

export function Speakers() {
  const [search, setSearch]   = useState('');
  const [filtroEsp, setFiltro] = useState('Todas');

  const filtered = MOCK_SPEAKERS.filter(s => {
    const matchE = filtroEsp === 'Todas' || s.especialidad === filtroEsp;
    const q = search.toLowerCase();
    const matchQ = !q || s.nombre.toLowerCase().includes(q)
      || s.especialidad.toLowerCase().includes(q)
      || s.habilidades.some(h => h.toLowerCase().includes(q));
    return matchE && matchQ;
  });

  return (
    <PageTransition>
      {/* ── Hero ── */}
      <PageHero
        eyebrow="Red de Expertos · EML"
        title={[
          { text: 'Especialistas que', tone: 'bold' },
          { text: 'mueven la ciencia médica', tone: 'light' },
        ]}
        lead="Los mejores clínicos e investigadores de Latinoamérica, disponibles para congresos, simposios y eventos de formación médica. Verificados, con historial y con perfil público."
        image={media.stage}
        facts={[
          { label: 'Especialidades', value: '12+' },
          { label: 'Países', value: '6' },
          { label: 'Ediciones EML', value: '8+' },
          { label: 'Ponencias entregadas', value: '120+' },
        ]}
      />

      {/* ── Directorio con filtros + carousel ── */}
      <SectionTransition className="bg-canvas py-20">
        <div className="mx-auto max-w-shell px-6">

          {/* Buscador y filtros */}
          <div className="flex flex-wrap items-center gap-3 mb-10">
            <div className="flex-1 min-w-[220px] flex items-center gap-2 rounded-2xl px-4 py-3 bg-white border border-line shadow-sm">
              <SearchIcon size={15} className="text-ink-muted shrink-0" />
              <input
                className="flex-1 bg-transparent text-sm outline-none text-ink placeholder:text-ink-muted"
                placeholder="Buscar por nombre, especialidad o tema…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {ESPECIALIDADES.map(e => (
                <button key={e} type="button" onClick={() => setFiltro(e)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold border transition-all duration-150 ease-emphasis ${
                    filtroEsp === e
                      ? 'bg-accent text-brand-deep border-accent'
                      : 'bg-white text-ink-muted border-line hover:border-brand/30 hover:text-brand'
                  }`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Carousel */}
          {filtered.length > 0 ? (
            <SpeakerCarousel
              speakers={filtered}
              title="Nuestros speakers"
              subtitle={`${filtered.length} especialistas con perfil público`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <UsersIcon size={40} className="text-ink-muted/40" />
              <p className="text-lg font-bold text-ink-muted">Sin resultados</p>
              <button type="button" onClick={() => { setSearch(''); setFiltro('Todas'); }}
                className="text-sm font-semibold text-accent">
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </SectionTransition>

      {/* ── Propuesta de valor ── */}
      <SectionTransition variant="settle" className="bg-brand-deep py-24 overflow-hidden">
        <div className="mx-auto max-w-shell px-6">
          <motion.p
            initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.26, ease: EASE_EMPHASIS }}
            className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
            <span className="h-px w-9 bg-accent" aria-hidden="true" />
            Por qué EML Speakers
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.28, ease: EASE_EMPHASIS, delay: 0.08 }}
            className="mt-5 max-w-2xl text-3xl font-bold leading-tight text-white lg:text-4xl"
            style={{ fontFamily: "'Sora', sans-serif" }}>
            Una red de expertos con{' '}
            <span style={{ color: 'var(--color-accent)' }}>respaldo clínico real</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.28, ease: EASE_EMPHASIS, delay: 0.14 }}
            className="mt-4 max-w-xl text-base leading-relaxed text-white/60">
            No somos una agencia de conferencistas. Somos el operador de los eventos médicos más importantes de Latinoamérica — y este directorio es la consecuencia de años curatores de talento académico.
          </motion.p>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {OFFERINGS.map((item, i) => (
              <motion.div key={item.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.28, ease: EASE_EMPHASIS, delay: 0.06 * i }}
                className="rounded-2xl p-5 border border-white/8"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(0,201,160,0.15)' }}>
                  <item.icon size={18} className="text-accent" />
                </div>
                <p className="font-semibold text-white text-sm mb-2">{item.title}</p>
                <p className="text-xs leading-relaxed text-white/55">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionTransition>

      {/* ── Proceso de contacto ── */}
      <SectionTransition className="bg-canvas py-24">
        <div className="mx-auto max-w-shell px-6">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 items-start">

            {/* Texto izquierdo */}
            <div>
              <motion.p
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.26, ease: EASE_EMPHASIS }}
                className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-ink-muted/70">
                <span className="h-px w-9 bg-accent" aria-hidden="true" />
                Cómo funciona
              </motion.p>

              <motion.h2
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.28, ease: EASE_EMPHASIS, delay: 0.08 }}
                className="mt-5 text-3xl font-bold leading-tight text-brand lg:text-4xl"
                style={{ fontFamily: "'Sora', sans-serif" }}>
                Conectar con un speaker{' '}
                <span className="text-accent">en 4 pasos</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.28, ease: EASE_EMPHASIS, delay: 0.14 }}
                className="mt-4 text-base leading-relaxed text-ink-muted max-w-lg">
                El proceso está diseñado para proteger tanto al organizador como al especialista. EML actúa como intermediario, garantizando que cada solicitud sea seria y que la respuesta sea oportuna.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.28, ease: EASE_EMPHASIS, delay: 0.22 }}
                className="mt-8 space-y-4">
                {[
                  { icon: CheckCircleIcon, text: 'Sin costos por consultar la disponibilidad' },
                  { icon: CheckCircleIcon, text: 'Respuesta del equipo EML en menos de 48 horas' },
                  { icon: CheckCircleIcon, text: 'Empresas registradas en la plataforma tienen prioridad' },
                  { icon: CheckCircleIcon, text: 'Historial de interacciones disponible en tu portal' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <Icon size={16} className="text-accent mt-0.5 shrink-0" />
                    <p className="text-sm text-ink-muted">{text}</p>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.28, ease: EASE_EMPHASIS, delay: 0.28 }}
                className="mt-10 flex flex-wrap gap-3">
                <Link to="/contacto?motivo=speaker"
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-brand-deep shadow-elev2 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                  <MessageCircleIcon size={15} /> Contactar al equipo EML
                </Link>
                <a href="#directorio"
                  className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-brand transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                  Ver directorio <ArrowRightIcon size={14} />
                </a>
              </motion.div>
            </div>

            {/* Pasos derecha */}
            <div className="space-y-4">
              {STEPS.map((step, i) => (
                <motion.div key={step.num}
                  initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.28, ease: EASE_EMPHASIS, delay: 0.1 + i * 0.07 }}
                  className="flex gap-4 rounded-2xl border border-line bg-white p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white"
                    style={{ background: 'var(--color-brand-deep)' }}>
                    {step.num}
                  </div>
                  <div>
                    <p className="font-semibold text-brand text-sm mb-1">{step.title}</p>
                    <p className="text-xs leading-relaxed text-ink-muted">{step.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </SectionTransition>

      {/* ── CTA final ── */}
      <SectionTransition variant="sink" className="py-20"
        style={{ background: 'linear-gradient(135deg, #061121 0%, #0a1f35 100%)' } as React.CSSProperties}>
        <div className="mx-auto max-w-shell px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.3, ease: EASE_EMPHASIS }}
            className="text-3xl font-bold text-white lg:text-4xl"
            style={{ fontFamily: "'Sora', sans-serif" }}>
            ¿Eres especialista médico?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.28, ease: EASE_EMPHASIS, delay: 0.1 }}
            className="mt-4 text-base text-white/60 max-w-lg mx-auto">
            Crea tu perfil en la plataforma, define tu disponibilidad y conecta con los organizadores de los mejores eventos médicos de Latinoamérica.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.28, ease: EASE_EMPHASIS, delay: 0.18 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/speaker/registro"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-brand-deep shadow-elev2 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
              <MicVocalIcon size={15} /> Crear mi perfil de speaker
            </Link>
            <Link to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 ease-emphasis hover:bg-white/8">
              Ya tengo cuenta → Acceder
            </Link>
          </motion.div>
        </div>
      </SectionTransition>
    </PageTransition>
  );
}
