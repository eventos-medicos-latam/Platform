import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon, MapPinIcon, BuildingIcon, GlobeIcon,
  LinkedinIcon, InstagramIcon, YoutubeIcon, ChevronDownIcon,
  CheckCircleIcon, SendIcon, BriefcaseIcon, CalendarDaysIcon,
  TagIcon, PlayCircleIcon, UserRoundIcon, StarIcon,
} from 'lucide-react';
import type { SpeakerPublic } from '../../components/speakers/speakerData';
import { getPublicSpeakerBySlug, toPublicSpeaker } from '../../lib/novo/speakers';
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
  const [speaker, setSpeaker] = useState<SpeakerPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!slug) {
      setSpeaker(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    getPublicSpeakerBySlug(slug)
      .then((row) => { if (alive) setSpeaker(row ? toPublicSpeaker(row) : null); })
      .catch(() => { if (alive) setSpeaker(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug]);

  const gradient = GRAD_PALETTE[(speaker?.nombre.length ?? 0) % GRAD_PALETTE.length];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-canvas">
        <p className="text-sm text-ink-muted">Cargando perfil…</p>
      </div>
    );
  }

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

      {/* ── HERO: banner split — info izquierda / foto derecha ── */}
      <div className="relative overflow-hidden" style={{ background: NAVY, minHeight: '72vh' }}>

        {/* Patrón de puntos sutil en el fondo navy */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(rgba(0,201,160,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* Gradiente lateral que sale desde la foto hacia la izquierda */}
        <div className="absolute inset-y-0 right-0 w-3/5 pointer-events-none"
          style={{ background: 'linear-gradient(to left, transparent 40%, rgba(10,31,53,0.85) 80%, rgba(10,31,53,1) 100%)' }} />

        {/* Gradiente inferior — transición al contenido */}
        <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(248,250,252,1) 100%)' }} />

        <div className="relative mx-auto max-w-6xl px-6 flex items-stretch" style={{ minHeight: '72vh' }}>

          {/* ── IZQUIERDA: info ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: EASE_EMPHASIS }}
            className="flex flex-col justify-center py-28 pr-8 flex-1 max-w-xl z-10">

            <Link to="/speakers"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/55 hover:text-white transition-colors mb-8 w-fit">
              <ArrowLeftIcon size={13} /> Todos los speakers
            </Link>

            <p className="text-[11px] font-bold uppercase tracking-[0.25em] mb-3"
              style={{ color: ACCENT }}>
              {speaker.especialidad}
            </p>

            <h1 className="text-4xl font-bold text-white leading-tight lg:text-5xl"
              style={{ fontFamily: "'Sora', sans-serif" }}>
              {speaker.nombre}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
              <div className="flex items-center gap-1.5 text-sm text-white/65">
                <BuildingIcon size={13} /> {speaker.institucion}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-white/65">
                <MapPinIcon size={13} /> {speaker.pais}
              </div>
              {speaker.eventos_participados.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: ACCENT }}>
                  <StarIcon size={13} /> {speaker.eventos_participados.length} evento{speaker.eventos_participados.length !== 1 ? 's' : ''} EML
                </div>
              )}
            </div>

            {/* Chips habilidades */}
            <div className="flex flex-wrap gap-2 mt-5">
              {speaker.habilidades.map(h => (
                <span key={h} className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: 'rgba(0,201,160,0.15)', color: '#fff', border: '1px solid rgba(0,201,160,0.35)' }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Links redes */}
            {Object.values(speaker.links).some(Boolean) && (
              <div className="flex flex-wrap gap-2 mt-5">
                {speaker.links.linkedin && (
                  <a href={speaker.links.linkedin} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:bg-white/20"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <LinkedinIcon size={12} /> LinkedIn
                  </a>
                )}
                {speaker.links.web && (
                  <a href={speaker.links.web} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:bg-white/20"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <GlobeIcon size={12} /> Sitio web
                  </a>
                )}
                {speaker.links.instagram && (
                  <a href={speaker.links.instagram} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:bg-white/20"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <InstagramIcon size={12} /> Instagram
                  </a>
                )}
                {speaker.links.youtube && (
                  <a href={speaker.links.youtube} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:bg-white/20"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <YoutubeIcon size={12} /> YouTube
                  </a>
                )}
              </div>
            )}
          </motion.div>

          {/* ── DERECHA: foto protagonista ── */}
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: EASE_EMPHASIS }}
            className="hidden lg:flex absolute inset-y-0 right-0 items-end"
            style={{ width: '52%' }}>
            {speaker.foto ? (
              <img
                src={speaker.foto}
                alt={speaker.nombre}
                className="h-full w-full object-cover object-top"
                style={{ objectPosition: 'center top' }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-6xl font-bold text-white/30"
                style={{ background: gradient }}>
                {initials}
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
