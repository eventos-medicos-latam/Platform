import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon, MapPinIcon, BuildingIcon, GlobeIcon,
  LinkedinIcon, InstagramIcon, YoutubeIcon, ChevronDownIcon,
  CheckCircleIcon, SendIcon,
} from 'lucide-react';
import { MOCK_SPEAKERS } from '../../components/speakers/speakerData';

const ACCENT = '#00C9A0';
const NAVY   = '#0a1f35';

const GRAD_PALETTE = [
  'linear-gradient(135deg,#1a4a7a,#2d6fae)',
  'linear-gradient(135deg,#00C9A0,#1a6b5a)',
  'linear-gradient(135deg,#5b2d8a,#A78BFA)',
  'linear-gradient(135deg,#7a3a1a,#FF7043)',
  'linear-gradient(135deg,#1a5a3a,#34D399)',
  'linear-gradient(135deg,#4a1a7a,#818CF8)',
];

function Section({ title, children, count }: { title: string; children: React.ReactNode; count?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ background: '#fff' }}>
        <span className="font-semibold text-sm" style={{ color: NAVY }}>
          {title}{count !== undefined ? <span className="ml-2 text-xs font-normal" style={{ color: '#94a3b8' }}>({count})</span> : null}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDownIcon size={16} style={{ color: '#94a3b8' }} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <div className="px-5 py-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InterestForm({ nombre }: { nombre: string }) {
  const [form, setForm] = useState({ name: '', email: '', empresa: '', mensaje: '' });
  const [sent, setSent] = useState(false);

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) return (
    <div className="flex flex-col items-center gap-3 py-10">
      <CheckCircleIcon size={40} style={{ color: ACCENT }} />
      <p className="font-bold text-lg" style={{ color: NAVY }}>¡Solicitud enviada!</p>
      <p className="text-sm text-center" style={{ color: '#64748b' }}>El equipo EML revisará tu solicitud y te contactará en breve.</p>
    </div>
  );

  const inputCls = "w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border transition-colors";
  const inputStyle = { borderColor: '#e2e8f0', background: '#fff', color: '#0f172a' };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm" style={{ color: '#64748b' }}>
        Tu solicitud pasará por revisión del equipo EML antes de ser enviada a {nombre.split(' ')[0]}.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>Tu nombre *</label>
          <input required className={inputCls} style={inputStyle} value={form.name} onChange={f('name')} placeholder="Juan Pérez" />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>Correo electrónico *</label>
          <input required type="email" className={inputCls} style={inputStyle} value={form.email} onChange={f('email')} placeholder="juan@empresa.com" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>Empresa / Organización</label>
        <input className={inputCls} style={inputStyle} value={form.empresa} onChange={f('empresa')} placeholder="Nombre de tu empresa" />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>Mensaje *</label>
        <textarea required rows={4} className={inputCls + " resize-none"} style={inputStyle}
          value={form.mensaje} onChange={f('mensaje')} placeholder={`Cuéntale a ${nombre.split(' ')[0]} qué tipo de participación tienes en mente…`} />
      </div>
      <div className="rounded-xl px-4 py-3 text-xs" style={{ background: 'rgba(0,201,160,0.08)', color: '#0d7a62', border: '1px solid rgba(0,201,160,0.2)' }}>
        Si tu empresa está registrada en la plataforma EML, el equipo usará tu correo corporativo verificado para gestionar la solicitud.
      </div>
      <button type="submit"
        className="flex items-center gap-2 w-full justify-center rounded-xl py-3 font-bold text-sm transition-all active:scale-95"
        style={{ background: ACCENT, color: NAVY }}>
        <SendIcon size={14} /> Enviar solicitud
      </button>
    </form>
  );
}

export function SpeakerPage() {
  const { slug } = useParams<{ slug: string }>();
  const speaker = MOCK_SPEAKERS.find(s => s.slug === slug);
  const idx = MOCK_SPEAKERS.findIndex(s => s.slug === slug);
  const gradient = GRAD_PALETTE[idx >= 0 ? idx % GRAD_PALETTE.length : 0];
  const [showForm, setShowForm] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  if (!speaker) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#f8fafc' }}>
        <p className="text-2xl font-bold" style={{ color: NAVY }}>Speaker no encontrado</p>
        <Link to="/speakers" className="text-sm font-semibold" style={{ color: ACCENT }}>← Volver al directorio</Link>
      </div>
    );
  }

  const initials = speaker.nombre.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const bioShort = speaker.bio.length > 300;

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Hero */}
      <div className="relative h-52" style={{ background: gradient }}>
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)' }} />
        <div className="relative max-w-4xl mx-auto px-6 h-full flex items-end pb-4">
          <Link to="/speakers" className="flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white mb-2 absolute top-5">
            <ArrowLeftIcon size={14} /> Todos los speakers
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-16 pb-20">
        {/* Avatar + info principal */}
        <div className="rounded-3xl p-6 mb-6" style={{ background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="h-28 w-28 shrink-0 rounded-2xl flex items-center justify-center text-white text-3xl font-bold"
              style={{ background: gradient }}>
              {speaker.foto ? <img src={speaker.foto} alt={speaker.nombre} className="h-full w-full object-cover rounded-2xl" /> : initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-tight" style={{ color: NAVY, fontFamily: "'Sora', sans-serif" }}>{speaker.nombre}</h1>
              <p className="font-semibold mt-1" style={{ color: ACCENT }}>{speaker.especialidad}</p>
              <div className="flex flex-wrap gap-3 mt-2">
                <div className="flex items-center gap-1 text-sm" style={{ color: '#64748b' }}>
                  <BuildingIcon size={13} /> {speaker.institucion}
                </div>
                <div className="flex items-center gap-1 text-sm" style={{ color: '#64748b' }}>
                  <MapPinIcon size={13} /> {speaker.pais}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {speaker.habilidades.map(h => (
                  <span key={h} className="rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ background: 'rgba(0,201,160,0.1)', color: ACCENT }}>{h}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid #f1f5f9' }}>
            <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>
              {bioShort && !bioExpanded ? speaker.bio.slice(0, 300) + '…' : speaker.bio}
            </p>
            {bioShort && (
              <button type="button" onClick={() => setBioExpanded(o => !o)}
                className="text-xs font-semibold mt-2" style={{ color: ACCENT }}>
                {bioExpanded ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>

          {/* Links */}
          {(speaker.links.linkedin || speaker.links.web || speaker.links.instagram || speaker.links.youtube) && (
            <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
              {speaker.links.linkedin && (
                <a href={speaker.links.linkedin} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold"
                  style={{ background: '#f1f5f9', color: '#0f172a' }}>
                  <LinkedinIcon size={13} /> LinkedIn
                </a>
              )}
              {speaker.links.web && (
                <a href={speaker.links.web} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold"
                  style={{ background: '#f1f5f9', color: '#0f172a' }}>
                  <GlobeIcon size={13} /> Sitio web
                </a>
              )}
              {speaker.links.instagram && (
                <a href={speaker.links.instagram} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold"
                  style={{ background: '#f1f5f9', color: '#0f172a' }}>
                  <InstagramIcon size={13} /> Instagram
                </a>
              )}
              {speaker.links.youtube && (
                <a href={speaker.links.youtube} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold"
                  style={{ background: '#f1f5f9', color: '#0f172a' }}>
                  <YoutubeIcon size={13} /> YouTube
                </a>
              )}
            </div>
          )}
        </div>

        {/* Secciones expandibles */}
        <div className="space-y-3 mb-6">
          {speaker.experiencias.length > 0 && (
            <Section title="Experiencia profesional" count={speaker.experiencias.length}>
              <div className="space-y-4">
                {speaker.experiencias.map((exp, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ background: ACCENT }} />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: NAVY }}>{exp.cargo}</p>
                      <p className="text-xs" style={{ color: '#64748b' }}>{exp.institucion}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                        {exp.inicio} – {exp.actual ? 'Actualidad' : exp.fin}
                      </p>
                      {exp.descripcion && <p className="text-xs mt-1" style={{ color: '#64748b' }}>{exp.descripcion}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {speaker.eventos_participados.length > 0 && (
            <Section title="Eventos EML" count={speaker.eventos_participados.length}>
              <div className="space-y-2">
                {speaker.eventos_participados.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < speaker.eventos_participados.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: NAVY }}>{ev.nombre}</p>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>{ev.año}</p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'rgba(0,201,160,0.1)', color: ACCENT }}>
                      {ev.rol}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {speaker.videos && speaker.videos.length > 0 && (
            <Section title="Videos y entrevistas" count={speaker.videos.length}>
              <div className="space-y-2">
                {speaker.videos.map((v, i) => (
                  <a key={i} href={v.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:opacity-80"
                    style={{ background: '#f1f5f9' }}>
                    <YoutubeIcon size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <p className="text-sm font-medium" style={{ color: NAVY }}>{v.titulo}</p>
                  </a>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* CTA interés */}
        <div className="rounded-3xl p-6" style={{ background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
          {!showForm ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-lg" style={{ color: NAVY }}>¿Quieres a {speaker.nombre.split(' ')[0]} en tu evento?</p>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Envía una solicitud de contacto a través del equipo EML.</p>
              </div>
              <button type="button" onClick={() => setShowForm(true)}
                className="shrink-0 rounded-xl px-6 py-3 font-bold text-sm transition-all active:scale-95"
                style={{ background: ACCENT, color: NAVY }}>
                Mostrar interés
              </button>
            </div>
          ) : (
            <>
              <p className="font-bold text-lg mb-4" style={{ color: NAVY }}>Solicitud de contacto</p>
              <InterestForm nombre={speaker.nombre} />
              <button type="button" onClick={() => setShowForm(false)}
                className="mt-3 text-xs font-semibold" style={{ color: '#94a3b8' }}>
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
