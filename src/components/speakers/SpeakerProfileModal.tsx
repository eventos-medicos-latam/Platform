import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon, ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon,
  MapPinIcon, BuildingIcon, CalendarIcon, StarIcon, SendIcon,
  LinkedinIcon, GlobeIcon, InstagramIcon, YoutubeIcon, CheckCircleIcon,
} from 'lucide-react';
import type { SpeakerPublic } from './speakerData';

const ACCENT = '#00C9A0';
const NAVY = '#0a1f35';

interface Props {
  speaker: SpeakerPublic;
  eventContext?: string;
  onClose: () => void;
}

function ExpandSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
      <button type="button" onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
        style={{ background: open ? '#f8fafc' : '#fff' }}>
        <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{title}</p>
        {open ? <ChevronUpIcon size={16} style={{ color: '#94a3b8' }} /> : <ChevronDownIcon size={16} style={{ color: '#94a3b8' }} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
            className="overflow-hidden">
            <div className="px-5 pb-5 pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InterestForm({ speakerName }: { speakerName: string }) {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', mensaje: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const send = () => {
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 800);
  };
  if (sent) return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <CheckCircleIcon size={36} style={{ color: ACCENT }} />
      <p className="font-bold" style={{ color: '#0f172a' }}>¡Interés registrado!</p>
      <p className="text-sm" style={{ color: '#64748b' }}>El equipo EML revisará tu solicitud y la enviará a {speakerName}.</p>
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="rounded-xl px-4 py-3 text-xs leading-relaxed" style={{ background: 'rgba(0,201,160,0.06)', border: '1px solid rgba(0,201,160,0.2)', color: '#475569' }}>
        <strong style={{ color: ACCENT }}>¿Eres una empresa registrada en EML?</strong> Usa el correo con el que estás en la plataforma y te vincularemos automáticamente. Si aún no eres parte de nuestra red, ingresa tus datos y te contactaremos con más información.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Nombre completo *</label>
          <input className="mt-1 w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
            placeholder="Dr. Juan Pérez" value={form.nombre} onChange={e => f('nombre')(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Email *</label>
          <input type="email" className="mt-1 w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
            placeholder="correo@empresa.com" value={form.email} onChange={e => f('email')(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Teléfono</label>
          <input className="mt-1 w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
            placeholder="+57 300 000 0000" value={form.telefono} onChange={e => f('telefono')(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Mensaje (opcional)</label>
          <input className="mt-1 w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
            placeholder="¿Para qué evento?" value={form.mensaje} onChange={e => f('mensaje')(e.target.value)} />
        </div>
      </div>
      <button type="button" onClick={send} disabled={!form.nombre || !form.email || sending}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
        style={{ background: ACCENT, color: NAVY }}>
        <SendIcon size={14} /> {sending ? 'Enviando…' : `Mostrar interés en ${speakerName.split(' ')[1] ?? speakerName}`}
      </button>
    </div>
  );
}

export function SpeakerProfileModal({ speaker, eventContext, onClose }: Props) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const BIO_LIMIT = 220;
  const bioShort = speaker.bio.slice(0, BIO_LIMIT);
  const bioNeedsMore = speaker.bio.length > BIO_LIMIT;

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(10,31,53,0.75)', backdropFilter: 'blur(8px)' }} onClick={onClose} />

      {/* Modal */}
      <motion.div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl"
        style={{ background: '#fff', boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}
        initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}>

        {/* Header con foto */}
        <div className="relative h-40 overflow-hidden rounded-t-3xl"
          style={{ background: `linear-gradient(135deg, ${NAVY}, #1a4a7a)` }}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(rgba(0,201,160,0.4) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <button type="button" onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full transition-all"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            <XIcon size={15} />
          </button>
          {eventContext && (
            <div className="absolute bottom-4 left-[136px] right-4">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white"
                style={{ background: 'rgba(0,201,160,0.25)', border: '1px solid rgba(0,201,160,0.4)' }}>
                ✦ {eventContext}
              </span>
            </div>
          )}
        </div>

        {/* Foto — sobresale del header */}
        <div className="absolute top-16 left-6">
          <div className="h-28 w-28 rounded-2xl overflow-hidden shadow-xl flex items-center justify-center text-3xl font-bold text-white"
            style={{ border: '3px solid #fff', background: 'linear-gradient(135deg,#1a4a7a,#2d6fae)' }}>
            {speaker.foto
              ? <img src={speaker.foto} alt={speaker.nombre} className="h-full w-full object-cover" />
              : speaker.nombre.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
            }
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-5">
          {/* Nombre + info básica */}
          <div className="pl-32">
            <h2 className="text-xl font-bold" style={{ color: '#0f172a', fontFamily: "'Sora', sans-serif" }}>{speaker.nombre}</h2>
            <p className="text-sm font-semibold" style={{ color: ACCENT }}>{speaker.especialidad}</p>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <BuildingIcon size={12} style={{ color: '#94a3b8' }} />
                <span className="text-xs" style={{ color: '#64748b' }}>{speaker.institucion}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPinIcon size={12} style={{ color: '#94a3b8' }} />
                <span className="text-xs" style={{ color: '#64748b' }}>{speaker.pais}</span>
              </div>
            </div>
          </div>

          {/* Habilidades chips — siempre visibles */}
          <div className="flex flex-wrap gap-1.5">
            {speaker.habilidades.slice(0, 4).map(h => (
              <span key={h} className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: 'rgba(0,201,160,0.1)', color: ACCENT }}>{h}</span>
            ))}
            {speaker.habilidades.length > 4 && (
              <span className="rounded-full px-3 py-1 text-xs" style={{ background: '#f1f5f9', color: '#94a3b8' }}>
                +{speaker.habilidades.length - 4} más
              </span>
            )}
          </div>

          {/* Bio */}
          <div className="rounded-2xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>
              {bioExpanded || !bioNeedsMore ? speaker.bio : `${bioShort}…`}
            </p>
            {bioNeedsMore && (
              <button type="button" onClick={() => setBioExpanded(p => !p)}
                className="mt-2 text-xs font-semibold" style={{ color: ACCENT }}>
                {bioExpanded ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>

          {/* Secciones expandibles */}
          <div className="space-y-2">
            <ExpandSection title={`Experiencia (${speaker.experiencias.length})`}>
              <div className="space-y-3">
                {speaker.experiencias.map((exp, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ background: ACCENT }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{exp.cargo}</p>
                      <p className="text-xs" style={{ color: '#64748b' }}>{exp.institucion} · {exp.inicio}{exp.actual ? ' – Presente' : exp.fin ? ` – ${exp.fin}` : ''}</p>
                      {exp.descripcion && <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{exp.descripcion}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </ExpandSection>

            <ExpandSection title={`Habilidades y temas (${speaker.habilidades.length})`}>
              <div className="flex flex-wrap gap-2">
                {speaker.habilidades.map(h => (
                  <span key={h} className="rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{ background: 'rgba(0,201,160,0.1)', color: ACCENT, border: '1px solid rgba(0,201,160,0.2)' }}>{h}</span>
                ))}
              </div>
            </ExpandSection>

            {speaker.eventos_participados.length > 0 && (
              <ExpandSection title={`Eventos (${speaker.eventos_participados.length})`}>
                <div className="space-y-2">
                  {speaker.eventos_participados.map((ev, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CalendarIcon size={13} style={{ color: ACCENT }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{ev.nombre}</p>
                        <p className="text-xs" style={{ color: '#94a3b8' }}>{ev.año} · {ev.rol}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ExpandSection>
            )}

            {speaker.videos && speaker.videos.length > 0 && (
              <ExpandSection title={`Videos y entrevistas (${speaker.videos.length})`}>
                <div className="space-y-2">
                  {speaker.videos.map((v, i) => (
                    <a key={i} href={v.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
                      style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}>
                      <YoutubeIcon size={18} style={{ color: '#FF0000' }} />
                      <p className="flex-1 text-sm font-medium" style={{ color: '#0f172a' }}>{v.titulo}</p>
                      <ExternalLinkIcon size={13} style={{ color: '#94a3b8' }} />
                    </a>
                  ))}
                </div>
              </ExpandSection>
            )}
          </div>

          {/* Links */}
          {Object.values(speaker.links).some(Boolean) && (
            <div className="flex items-center gap-3 flex-wrap">
              {speaker.links.linkedin && (
                <a href={speaker.links.linkedin} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all"
                  style={{ background: '#f1f5f9', color: '#0077B5', border: '1px solid #e2e8f0' }}>
                  <LinkedinIcon size={13} /> LinkedIn
                </a>
              )}
              {speaker.links.web && (
                <a href={speaker.links.web} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all"
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                  <GlobeIcon size={13} /> Sitio web
                </a>
              )}
              {speaker.links.instagram && (
                <a href={speaker.links.instagram} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all"
                  style={{ background: '#f1f5f9', color: '#E1306C', border: '1px solid #e2e8f0' }}>
                  <InstagramIcon size={13} /> Instagram
                </a>
              )}
            </div>
          )}

          {/* CTA interés */}
          <div className="pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
            <button type="button" onClick={() => setShowForm(p => !p)}
              className="w-full rounded-2xl py-3.5 text-sm font-bold transition-all active:scale-95"
              style={{ background: showForm ? '#f1f5f9' : ACCENT, color: showForm ? '#64748b' : NAVY }}>
              {showForm ? 'Cancelar' : `Mostrar interés en ${speaker.nombre.split(' ')[1] ?? speaker.nombre}`}
            </button>
            <AnimatePresence>
              {showForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                  className="overflow-hidden mt-4">
                  <InterestForm speakerName={speaker.nombre} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
