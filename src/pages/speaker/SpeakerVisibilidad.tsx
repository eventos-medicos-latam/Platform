import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EyeIcon, EyeOffIcon, GlobeIcon, LinkIcon, CheckCircleIcon, UserRoundIcon, BriefcaseIcon, PresentationIcon, StarIcon } from 'lucide-react';

const ACCENT = '#00C9A0';

export function SpeakerVisibilidad() {
  const [isPublico, setIsPublico]   = useState(false);
  const [slug, setSlug]             = useState('dr-juan-perez');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const publicUrl = `eventosmedicoslatam.com/speakers/${slug}`;

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }, 700);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>Mi perfil</p>
        <h1 className="text-xl font-bold" style={{ color: '#0f172a', fontFamily: "'Sora', sans-serif" }}>Visibilidad del perfil</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Controla si tu perfil aparece en el directorio público de EML.</p>
      </div>

      {/* Toggle principal */}
      <div className="rounded-2xl p-6 space-y-5" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: isPublico ? 'rgba(0,201,160,0.1)' : '#f1f5f9' }}>
            {isPublico
              ? <EyeIcon size={22} style={{ color: ACCENT }} />
              : <EyeOffIcon size={22} style={{ color: '#94a3b8' }} />}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-bold" style={{ color: '#0f172a' }}>
                  Perfil {isPublico ? 'público' : 'privado'}
                </p>
                <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
                  {isPublico
                    ? 'Tu perfil es visible en el directorio. Cualquier persona puede encontrarte y enviarte solicitudes.'
                    : 'Tu perfil está oculto. Solo el equipo EML puede verte internamente.'}
                </p>
              </div>
              <button type="button" onClick={() => setIsPublico(p => !p)}
                className="shrink-0 h-7 w-14 rounded-full transition-all relative"
                style={{ background: isPublico ? ACCENT : '#e2e8f0' }}>
                <motion.span className="absolute top-0.5 h-6 w-6 rounded-full bg-white"
                  animate={{ left: isPublico ? '30px' : '2px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Lo que incluye el perfil público */}
        <div className="rounded-xl p-4 space-y-2" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>
            Qué se muestra en el perfil público
          </p>
          {[
            { icon: UserRoundIcon,    text: 'Foto, nombre, institución, país, bio' },
            { icon: BriefcaseIcon,    text: 'Experiencia profesional y habilidades' },
            { icon: PresentationIcon, text: 'Ponencias aprobadas por EML' },
            { icon: StarIcon,         text: 'Logos de eventos donde has participado' },
            { icon: GlobeIcon,        text: 'Links: LinkedIn, web, redes sociales' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircleIcon size={14} style={{ color: ACCENT, flexShrink: 0 }} />
              <Icon size={13} style={{ color: '#64748b', flexShrink: 0 }} />
              <p className="text-xs" style={{ color: '#475569' }}>{text}</p>
            </div>
          ))}
        </div>

        {/* NO se muestra */}
        <div className="rounded-xl p-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#ef4444' }}>Nunca se muestra</p>
          <p className="text-xs" style={{ color: '#7f1d1d' }}>Tu correo, teléfono, datos privados y eventos no aprobados por EML.</p>
        </div>
      </div>

      {/* URL pública */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p className="text-sm font-bold" style={{ color: '#0f172a' }}>URL de tu perfil público</p>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Slug (identificador único)</label>
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            <div className="flex items-center px-3.5 py-2.5 text-sm shrink-0" style={{ background: '#f1f5f9', color: '#94a3b8', borderRight: '1px solid #e2e8f0' }}>
              eventosmedicoslatam.com/speakers/
            </div>
            <input className="flex-1 px-3.5 py-2.5 text-sm outline-none"
              style={{ background: '#f8fafc', color: '#0f172a' }}
              value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{ background: isPublico ? 'rgba(0,201,160,0.06)' : '#f8fafc', border: `1px solid ${isPublico ? 'rgba(0,201,160,0.3)' : '#e2e8f0'}` }}>
          <LinkIcon size={14} style={{ color: isPublico ? ACCENT : '#94a3b8' }} />
          <p className="text-sm font-medium" style={{ color: isPublico ? '#0f172a' : '#94a3b8' }}>{publicUrl}</p>
          {isPublico && (
            <span className="ml-auto text-xs font-bold" style={{ color: ACCENT }}>Activo</span>
          )}
        </div>
        {!isPublico && (
          <p className="text-xs" style={{ color: '#94a3b8' }}>Activa el perfil público para que esta URL sea accesible.</p>
        )}
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSave} disabled={saving}
          className="rounded-xl px-6 py-3 text-sm font-bold transition-all active:scale-95 disabled:opacity-60"
          style={{ background: saved ? 'rgba(0,201,160,0.15)' : ACCENT, color: saved ? ACCENT : '#0a1f35', border: saved ? `1px solid ${ACCENT}` : 'none' }}>
          {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  );
}
