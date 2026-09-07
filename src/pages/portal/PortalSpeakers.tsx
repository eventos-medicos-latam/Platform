import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon, MapPinIcon, BuildingIcon, LinkedinIcon, GlobeIcon, SendIcon, CheckCircleIcon, XIcon } from 'lucide-react';
import { MOCK_SPEAKERS } from '../../components/speakers/speakerData';
import type { SpeakerPublic } from '../../components/speakers/speakerData';

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

const ESPECIALIDADES = ['Todas', ...Array.from(new Set(MOCK_SPEAKERS.map(s => s.especialidad)))];

function ContactModal({ speaker, idx, onClose }: { speaker: SpeakerPublic; idx: number; onClose: () => void }) {
  const [form, setForm] = useState({ evento: '', mensaje: '' });
  const [sent, setSent] = useState(false);
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.22 }}
        className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}>
        <div className="h-24 relative" style={{ background: GRAD_PALETTE[idx % GRAD_PALETTE.length] }}>
          <button type="button" onClick={onClose} className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full" style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}>
            <XIcon size={15} />
          </button>
        </div>
        <div className="px-6 pb-6 -mt-8">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white mb-3"
            style={{ background: GRAD_PALETTE[idx % GRAD_PALETTE.length], border: '3px solid #fff' }}>
            {speaker.nombre.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()}
          </div>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircleIcon size={40} style={{ color: ACCENT }} />
              <p className="font-bold text-lg" style={{ color: NAVY }}>Solicitud enviada</p>
              <p className="text-sm text-center" style={{ color: '#64748b' }}>El equipo EML revisará tu solicitud y la enviará a {speaker.nombre.split(' ')[0]}.</p>
              <button onClick={onClose} className="mt-2 text-sm font-semibold" style={{ color: ACCENT }}>Cerrar</button>
            </div>
          ) : (
            <>
              <p className="font-bold text-lg" style={{ color: NAVY }}>{speaker.nombre}</p>
              <p className="text-sm mb-4" style={{ color: ACCENT }}>{speaker.especialidad}</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>Evento de interés</label>
                  <input className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" value={form.evento} onChange={f('evento')}
                    placeholder="Ej: Hormobiota VI 2025"
                    style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748b' }}>Mensaje</label>
                  <textarea rows={4} className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none"
                    value={form.mensaje} onChange={f('mensaje')}
                    placeholder={`Cuéntale a ${speaker.nombre.split(' ')[0]} sobre tu evento y propuesta…`}
                    style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }} />
                </div>
                <div className="rounded-xl px-4 py-3 text-xs" style={{ background: 'rgba(0,201,160,0.08)', color: '#0d7a62', border: '1px solid rgba(0,201,160,0.2)' }}>
                  La solicitud será revisada por EML antes de llegar al speaker. Usaremos tu correo corporativo registrado.
                </div>
                <button type="button" onClick={() => setSent(true)}
                  className="flex items-center gap-2 w-full justify-center rounded-xl py-3 font-bold text-sm"
                  style={{ background: ACCENT, color: NAVY }}>
                  <SendIcon size={14} /> Enviar solicitud
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function PortalSpeakers() {
  const [search, setSearch] = useState('');
  const [filtroEsp, setFiltro] = useState('Todas');
  const [contact, setContact] = useState<{ speaker: SpeakerPublic; idx: number } | null>(null);

  const filtered = MOCK_SPEAKERS.filter(s => {
    const matchE = filtroEsp === 'Todas' || s.especialidad === filtroEsp;
    const q = search.toLowerCase();
    const matchQ = !q || s.nombre.toLowerCase().includes(q) || s.especialidad.toLowerCase().includes(q) || s.habilidades.some(h => h.toLowerCase().includes(q));
    return matchE && matchQ;
  });

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>Directorio</p>
        <h1 className="text-2xl font-bold" style={{ color: NAVY, fontFamily: "'Sora', sans-serif" }}>Speakers EML</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>Conecta con los especialistas de la red Eventos Médicos LATAM para tus eventos.</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 rounded-2xl px-4 py-2.5"
          style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
          <SearchIcon size={14} style={{ color: '#94a3b8' }} />
          <input className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#0f172a' }}
            placeholder="Buscar speaker…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {ESPECIALIDADES.map(e => (
            <button key={e} type="button" onClick={() => setFiltro(e)}
              className="rounded-xl px-3 py-2 text-xs font-semibold transition-all"
              style={{
                background: filtroEsp === e ? ACCENT : '#fff',
                color: filtroEsp === e ? NAVY : '#64748b',
                border: `1px solid ${filtroEsp === e ? ACCENT : '#e2e8f0'}`,
              }}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de tarjetas */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg font-bold" style={{ color: '#94a3b8' }}>Sin resultados</p>
          <button type="button" onClick={() => { setSearch(''); setFiltro('Todas'); }}
            className="mt-2 text-sm font-semibold" style={{ color: ACCENT }}>Limpiar filtros</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s, i) => {
            const idx = MOCK_SPEAKERS.indexOf(s);
            const initials = s.nombre.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="h-24 flex items-center justify-center" style={{ background: GRAD_PALETTE[idx % GRAD_PALETTE.length] }}>
                  <span className="text-3xl font-bold text-white">{initials}</span>
                </div>
                <div className="p-4">
                  <p className="font-bold text-sm" style={{ color: NAVY }}>{s.nombre}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: ACCENT }}>{s.especialidad}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <BuildingIcon size={10} style={{ color: '#94a3b8' }} />
                    <p className="text-[10px] truncate" style={{ color: '#94a3b8' }}>{s.institucion}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPinIcon size={10} style={{ color: '#94a3b8' }} />
                    <p className="text-[10px]" style={{ color: '#94a3b8' }}>{s.pais}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {s.habilidades.slice(0, 3).map(h => (
                      <span key={h} className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                        style={{ background: 'rgba(0,201,160,0.1)', color: ACCENT }}>{h}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    {s.links.linkedin && (
                      <a href={s.links.linkedin} target="_blank" rel="noreferrer"
                        className="flex items-center justify-center h-7 w-7 rounded-lg"
                        style={{ background: '#f1f5f9', color: '#64748b' }}>
                        <LinkedinIcon size={12} />
                      </a>
                    )}
                    {s.links.web && (
                      <a href={s.links.web} target="_blank" rel="noreferrer"
                        className="flex items-center justify-center h-7 w-7 rounded-lg"
                        style={{ background: '#f1f5f9', color: '#64748b' }}>
                        <GlobeIcon size={12} />
                      </a>
                    )}
                    <button type="button" onClick={() => setContact({ speaker: s, idx })}
                      className="ml-auto rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95"
                      style={{ background: ACCENT, color: NAVY }}>
                      Contactar
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {contact && <ContactModal speaker={contact.speaker} idx={contact.idx} onClose={() => setContact(null)} />}
      </AnimatePresence>
    </div>
  );
}
