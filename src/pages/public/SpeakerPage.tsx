import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon, MapPinIcon, BuildingIcon, GlobeIcon,
  LinkedinIcon, InstagramIcon, YoutubeIcon, ChevronDownIcon,
  CheckCircleIcon, SendIcon, BriefcaseIcon, CalendarDaysIcon,
  TagIcon, PlayCircleIcon, UserRoundIcon, StarIcon,
} from 'lucide-react';
import { MOCK_SPEAKERS } from '../../components/speakers/speakerData';
import { EASE_EMPHASIS } from '../../utils/motion';

const ACCENT = '#00C9A0';
const NAVY   = '#0a1f35';

const GRAD_PALETTE = [
  'linear-gradient(135deg,#1a4a7a,#2d6fae)',
  'linear-gradient(135deg,#00714d,#1a6b5a)',
  'linear-gradient(135deg,#5b2d8a,#7c3aed)',
  'linear-gradient(135deg,#7a3a1a,#c2410c)',
  'linear-gradient(135deg,#1a5a3a,#047857)',
  'linear-gradient(135deg,#4a1a7a,#6d28d9)',
];

/* ── Sección expandible ── */
function Section({
  icon: Icon, title, count, children, defaultOpen = false,
}: {
  icon: React.ElementType; title: string; count?: number;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden border border-line bg-white">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'rgba(0,201,160,0.1)' }}>
          <Icon size={15} className="text-accent" />
        </div>
        <span className="flex-1 font-semibold text-sm text-brand">
          {title}
          {count !== undefined && (
            <span className="ml-2 text-xs font-normal text-ink-muted">({count})</span>
          )}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDownIcon size={16} className="text-ink-muted" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="body"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: EASE_EMPHASIS }}
            style={{ overflow: 'hidden' }}>
            <div className="px-5 pb-5 pt-1 border-t border-line bg-gray-50/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Formulario de interés ── */
function InterestForm({ nombre }: { nombre: string }) {
  const [form, setForm] = useState({ name: '', email: '', empresa: '', evento: '', mensaje: '' });
  const [sent, setSent] = useState(false);
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  if (sent) return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <CheckCircleIcon size={40} style={{ color: ACCENT }} />
      <p className="font-bold text-lg" style={{ color: NAVY }}>¡Solicitud enviada!</p>
      <p className="text-sm" style={{ color: '#64748b' }}>
        El equipo EML revisará tu solicitud y te contactará en breve sobre {nombre.split(' ')[0]}.
      </p>
    </div>
  );

  return (
    <form onSubmit={e => { e.preventDefault(); setSent(true); }} className="space-y-4">
      <div className="rounded-xl px-4 py-3 text-xs leading-relaxed"
        style={{ background: 'rgba(0,201,160,0.08)', border: '1px solid rgba(0,201,160,0.2)', color: '#0d7a62' }}>
        Si tu empresa está registrada en la plataforma EML, usa tu correo corporativo y te vincularemos automáticamente.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>Tu nombre *</label>
          <input required className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            value={form.name} onChange={f('name')} placeholder="Dr. Juan Pérez" />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>Correo electrónico *</label>
          <input required type="email" className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            value={form.email} onChange={f('email')} placeholder="juan@empresa.com" />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>Empresa / Organización</label>
          <input className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            value={form.empresa} onChange={f('empresa')} placeholder="Nombre de la organización" />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>Nombre del evento</label>
          <input className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            value={form.evento} onChange={f('evento')} placeholder="Simposio de Endocrinología 2026" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>Mensaje *</label>
        <textarea required rows={4}
          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors resize-none"
          value={form.mensaje} onChange={f('mensaje')}
          placeholder={`¿En qué tipo de participación estás pensando para ${nombre.split(' ')[0]}?`} />
      </div>
      <button type="submit"
        className="flex items-center gap-2 w-full justify-center rounded-xl py-3 font-bold text-sm transition-all active:scale-95"
        style={{ background: ACCENT, color: NAVY }}>
        <SendIcon size={14} /> Enviar solicitud de contacto
      </button>
    </form>
  );
}

/* ── Página principal ── */
export function SpeakerPage() {
  const { slug } = useParams<{ slug: string }>();
  const speaker   = MOCK_SPEAKERS.find(s => s.slug === slug);
  const idx       = MOCK_SPEAKERS.findIndex(s => s.slug === slug);
  const gradient  = GRAD_PALETTE[idx >= 0 ? idx % GRAD_PALETTE.length : 0];
  const [showForm, setShowForm] = useState(false);

  if (!speaker) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-canvas">
        <p className="text-2xl font-bold text-brand">Speaker no encontrado</p>
        <Link to="/speakers" className="text-sm font-semibold text-accent">← Volver al directorio</Link>
      </div>
    );
  }

  const initials = speaker.nombre.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-canvas">

      {/* ── HERO con foto grande ── */}
      <div className="relative overflow-hidden" style={{ minHeight: '72vh' }}>
        {/* Foto de fondo a pantalla completa */}
        {speaker.foto ? (
          <img src={speaker.foto} alt={speaker.nombre}
            className="absolute inset-0 h-full w-full object-cover object-top" />
        ) : (
          <div className="absolute inset-0" style={{ background: gradient }} />
        )}

        {/* Overlay gradiente: más oscuro abajo para la transición al contenido */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(10,31,53,0.55) 0%, rgba(10,31,53,0.30) 30%, rgba(10,31,53,0.70) 65%, rgba(248,250,252,1) 100%)' }} />

        {/* Color de la especialidad sutil */}
        <div className="absolute inset-0 opacity-30" style={{ background: gradient }} />

        {/* Contenido superpuesto */}
        <div className="relative flex flex-col justify-between h-full" style={{ minHeight: '72vh' }}>
          {/* Back link — top */}
          <div className="pt-24 px-6 max-w-4xl mx-auto w-full">
            <Link to="/speakers"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors">
              <ArrowLeftIcon size={14} /> Todos los speakers
            </Link>
          </div>

          {/* Info del speaker — bottom del hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_EMPHASIS, delay: 0.1 }}
            className="px-6 pb-16 max-w-4xl mx-auto w-full">

            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: ACCENT, letterSpacing: '0.2em' }}>
              {speaker.especialidad}
            </p>
            <h1 className="text-4xl font-bold text-white leading-tight lg:text-5xl"
              style={{ fontFamily: "'Sora', sans-serif", textShadow: '0 2px 24px rgba(0,0,0,0.4)' }}>
              {speaker.nombre}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-white/75">
                <BuildingIcon size={13} /> {speaker.institucion}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-white/75">
                <MapPinIcon size={13} /> {speaker.pais}
              </div>
              {speaker.eventos_participados.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-white/75">
                  <StarIcon size={13} /> {speaker.eventos_participados.length} evento{speaker.eventos_participados.length !== 1 ? 's' : ''} EML
                </div>
              )}
            </div>

            {/* Chips de habilidades */}
            <div className="flex flex-wrap gap-2 mt-4">
              {speaker.habilidades.map(h => (
                <span key={h}
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: 'rgba(0,201,160,0.2)', color: '#fff', border: '1px solid rgba(0,201,160,0.4)' }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Links redes sociales */}
            {Object.values(speaker.links).some(Boolean) && (
              <div className="flex gap-2 mt-4">
                {speaker.links.linkedin && (
                  <a href={speaker.links.linkedin} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <LinkedinIcon size={12} /> LinkedIn
                  </a>
                )}
                {speaker.links.web && (
                  <a href={speaker.links.web} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <GlobeIcon size={12} /> Sitio web
                  </a>
                )}
                {speaker.links.instagram && (
                  <a href={speaker.links.instagram} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <InstagramIcon size={12} /> Instagram
                  </a>
                )}
                {speaker.links.youtube && (
                  <a href={speaker.links.youtube} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <YoutubeIcon size={12} /> YouTube
                  </a>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── CONTENIDO — secciones expandibles ── */}
      <div className="max-w-4xl mx-auto px-6 -mt-6 pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_EMPHASIS, delay: 0.2 }}
          className="space-y-3">

          {/* Bio — siempre visible */}
          <Section icon={UserRoundIcon} title="Acerca de" defaultOpen>
            <p className="text-sm leading-relaxed text-ink-muted pt-2">{speaker.bio}</p>
          </Section>

          {/* Habilidades */}
          {speaker.habilidades.length > 0 && (
            <Section icon={TagIcon} title="Especialidades y temas de ponencia" count={speaker.habilidades.length} defaultOpen>
              <div className="flex flex-wrap gap-2 pt-2">
                {speaker.habilidades.map(h => (
                  <span key={h} className="rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{ background: 'rgba(0,201,160,0.1)', color: ACCENT, border: '1px solid rgba(0,201,160,0.2)' }}>
                    {h}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Experiencia profesional */}
          {speaker.experiencias.length > 0 && (
            <Section icon={BriefcaseIcon} title="Experiencia profesional" count={speaker.experiencias.length}>
              <div className="space-y-4 pt-2">
                {speaker.experiencias.map((exp, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-2 h-2 w-2 rounded-full shrink-0" style={{ background: ACCENT }} />
                    <div>
                      <p className="font-semibold text-sm text-brand">{exp.cargo}</p>
                      <p className="text-xs text-ink-muted">{exp.institucion}</p>
                      <p className="text-xs text-ink-muted/70 mt-0.5">
                        {exp.inicio} – {exp.actual ? 'Actualidad' : exp.fin ?? ''}
                      </p>
                      {exp.descripcion && (
                        <p className="text-xs text-ink-muted mt-1 leading-relaxed">{exp.descripcion}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Eventos EML */}
          {speaker.eventos_participados.length > 0 && (
            <Section icon={CalendarDaysIcon} title="Participaciones en eventos EML" count={speaker.eventos_participados.length}>
              <div className="space-y-0 pt-2 divide-y divide-line">
                {speaker.eventos_participados.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-semibold text-brand">{ev.nombre}</p>
                      <p className="text-xs text-ink-muted">{ev.año}</p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: 'rgba(0,201,160,0.1)', color: ACCENT }}>
                      {ev.rol}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Videos y entrevistas */}
          {speaker.videos && speaker.videos.length > 0 && (
            <Section icon={PlayCircleIcon} title="Videos y entrevistas" count={speaker.videos.length}>
              <div className="space-y-2 pt-2">
                {speaker.videos.map((v, i) => (
                  <a key={i} href={v.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all hover:-translate-y-0.5"
                    style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                    <YoutubeIcon size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <p className="flex-1 text-sm font-medium text-brand">{v.titulo}</p>
                  </a>
                ))}
              </div>
            </Section>
          )}

          {/* CTA — contacto */}
          <div className="rounded-2xl overflow-hidden mt-6"
            style={{ background: NAVY, boxShadow: '0 8px 40px rgba(10,31,53,0.2)' }}>
            <div className="p-6">
              {!showForm ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-lg text-white">
                      ¿Quieres a {speaker.nombre.split(' ').slice(-1)[0]} en tu evento?
                    </p>
                    <p className="text-sm mt-1 text-white/60">
                      Envía tu solicitud — el equipo EML la gestiona directamente con el especialista.
                    </p>
                  </div>
                  <button type="button" onClick={() => setShowForm(true)}
                    className="shrink-0 rounded-xl px-6 py-3 font-bold text-sm transition-all active:scale-95 hover:-translate-y-0.5"
                    style={{ background: ACCENT, color: NAVY }}>
                    Mostrar interés
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <p className="font-bold text-lg text-white">Solicitud de contacto</p>
                    <button type="button" onClick={() => setShowForm(false)}
                      className="text-xs font-semibold text-white/50 hover:text-white">Cancelar</button>
                  </div>
                  <div className="rounded-xl p-4 bg-white">
                    <InterestForm nombre={speaker.nombre} />
                  </div>
                </div>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
