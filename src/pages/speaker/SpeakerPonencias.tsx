import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, UploadCloudIcon, FileIcon, TrashIcon, CheckCircleIcon, ClockIcon } from 'lucide-react';

const ACCENT = '#00C9A0';
const inputCls = "w-full rounded-xl px-3.5 py-2.5 text-sm outline-none";
const inputStyle = { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' };

interface Ponencia {
  id: string; evento: string; titulo: string; abstract: string;
  archivo?: string; disponibilidad: 'presencial' | 'virtual' | '';
  status: 'borrador' | 'enviada' | 'aprobada';
}

const STATUS_CFG = {
  borrador: { label: 'Borrador', color: '#94a3b8', bg: '#f1f5f9' },
  enviada:  { label: 'Enviada',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  aprobada: { label: 'Aprobada', color: ACCENT,    bg: 'rgba(0,201,160,0.1)' },
};

const EVENTOS_MOCK = ['La Eterna Primavera 2026', 'Hormobiota VI', 'Webinar Vitamina D'];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
        {label}{required && <span style={{ color: '#F24463' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

export function SpeakerPonencias() {
  const [ponencias, setPonencias] = useState<Ponencia[]>([
    { id: 'p1', evento: 'La Eterna Primavera 2026', titulo: 'Nuevos horizontes en el manejo de la diabetes tipo 2', abstract: 'Una revisión de los últimos avances en terapias GLP-1 y su impacto en la práctica clínica diaria.', disponibilidad: 'presencial', status: 'enviada' },
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const addPonencia = () => {
    setPonencias(p => [...p, { id: `p${Date.now()}`, evento: '', titulo: '', abstract: '', disponibilidad: '', status: 'borrador' }]);
  };

  const update = (id: string, key: keyof Ponencia, val: string) =>
    setPonencias(p => p.map(x => x.id === id ? { ...x, [key]: val } : x));

  const remove = (id: string) => setPonencias(p => p.filter(x => x.id !== id));

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }, 700);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>Mi perfil</p>
          <h1 className="text-xl font-bold" style={{ color: '#0f172a', fontFamily: "'Sora', sans-serif" }}>Ponencias</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Una ponencia por evento. Incluye título, abstract y disponibilidad.</p>
        </div>
        <button type="button" onClick={addPonencia}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold shrink-0 transition-all active:scale-95"
          style={{ background: ACCENT, color: '#0a1f35' }}>
          <PlusIcon size={14} /> Nueva ponencia
        </button>
      </div>

      <AnimatePresence>
        {ponencias.map((p, i) => {
          const st = STATUS_CFG[p.status];
          return (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl p-5 space-y-4"
              style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Ponencia {i + 1}</span>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ background: st.bg, color: st.color }}>{st.label}</span>
                </div>
                {ponencias.length > 1 && (
                  <button type="button" onClick={() => remove(p.id)} style={{ color: '#94a3b8' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#F24463')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                    <TrashIcon size={14} />
                  </button>
                )}
              </div>

              <Field label="Evento" required>
                <select className={inputCls} style={inputStyle} value={p.evento} onChange={e => update(p.id, 'evento', e.target.value)}>
                  <option value="">Seleccionar evento…</option>
                  {EVENTOS_MOCK.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                </select>
              </Field>

              <Field label="Título de la ponencia" required>
                <input className={inputCls} style={inputStyle}
                  placeholder="Ej. Avances en el tratamiento de la diabetes tipo 2"
                  value={p.titulo} onChange={e => update(p.id, 'titulo', e.target.value)} />
              </Field>

              <Field label="Abstract">
                <textarea className={inputCls} style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                  placeholder="Resumen de tu ponencia (máx. 500 palabras)…"
                  value={p.abstract} onChange={e => update(p.id, 'abstract', e.target.value)} />
                <p className="text-right text-xs tabular-nums" style={{ color: '#94a3b8' }}>{p.abstract.split(/\s+/).filter(Boolean).length} palabras</p>
              </Field>

              {/* Disponibilidad */}
              <Field label="Disponibilidad para este evento" required>
                <div className="flex gap-3">
                  {[
                    { val: 'presencial', label: '🏛️ Presencial', desc: 'Asisto en persona al evento' },
                    { val: 'virtual',    label: '💻 Virtual',    desc: 'Participo por videoconferencia' },
                  ].map(opt => (
                    <button key={opt.val} type="button" onClick={() => update(p.id, 'disponibilidad', opt.val)}
                      className="flex-1 rounded-xl px-4 py-3 text-left transition-all"
                      style={{
                        border: `2px solid ${p.disponibilidad === opt.val ? ACCENT : '#e2e8f0'}`,
                        background: p.disponibilidad === opt.val ? 'rgba(0,201,160,0.06)' : '#f8fafc',
                      }}>
                      <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{opt.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </Field>

              {/* Upload */}
              <Field label="Archivo de presentación (PDF o PPTX)">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition-all"
                  style={{ border: '2px dashed #e2e8f0', background: '#f8fafc' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}>
                  {p.archivo
                    ? <><FileIcon size={18} style={{ color: ACCENT }} />
                       <span className="text-sm font-medium" style={{ color: ACCENT }}>{p.archivo}</span></>
                    : <><UploadCloudIcon size={18} style={{ color: '#94a3b8' }} />
                       <span className="text-sm" style={{ color: '#64748b' }}>Haz clic para subir · PDF o PPTX · máx. 50 MB</span></>}
                  <input type="file" accept=".pdf,.ppt,.pptx" className="hidden"
                    onChange={e => update(p.id, 'archivo', e.target.files?.[0]?.name ?? '')} />
                </label>
              </Field>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {ponencias.length === 0 && (
        <div className="rounded-2xl flex flex-col items-center justify-center py-16 gap-3"
          style={{ background: '#fff', border: '2px dashed #e2e8f0' }}>
          <p className="text-sm" style={{ color: '#94a3b8' }}>No tienes ponencias aún</p>
          <button type="button" onClick={addPonencia}
            className="rounded-xl px-4 py-2 text-sm font-semibold"
            style={{ background: ACCENT, color: '#0a1f35' }}>+ Agregar primera ponencia</button>
        </div>
      )}

      {ponencias.length > 0 && (
        <div className="flex justify-end">
          <button type="button" onClick={handleSave} disabled={saving}
            className="rounded-xl px-6 py-3 text-sm font-bold transition-all active:scale-95 disabled:opacity-60"
            style={{ background: saved ? 'rgba(0,201,160,0.15)' : ACCENT, color: saved ? ACCENT : '#0a1f35', border: saved ? `1px solid ${ACCENT}` : 'none' }}>
            {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar ponencias'}
          </button>
        </div>
      )}
    </div>
  );
}
