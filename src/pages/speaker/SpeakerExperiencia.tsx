import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, XIcon, GripVerticalIcon } from 'lucide-react';

const ACCENT = '#00C9A0';
const inputCls = "w-full rounded-xl px-3.5 py-2.5 text-sm outline-none";
const inputStyle = { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' };

interface Experiencia {
  id: string; cargo: string; institucion: string;
  inicio: string; fin: string; actual: boolean; descripcion: string;
}

const HABILIDADES_SUGERIDAS = [
  'Endocrinología clínica', 'Diabetes tipo 2', 'Tiroides', 'Obesidad', 'Síndrome metabólico',
  'Investigación clínica', 'Educación médica', 'Divulgación científica', 'Telemedicina',
  'Liderazgo médico', 'Gestión hospitalaria', 'Medicina basada en evidencia',
];

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

export function SpeakerExperiencia() {
  const [exps, setExps] = useState<Experiencia[]>([
    { id: 'e1', cargo: 'Endocrinólogo tratante', institucion: 'Hospital Universitario San Ignacio', inicio: '2018', fin: '', actual: true, descripcion: 'Atención de pacientes con diabetes, tiroides y enfermedades metabólicas.' },
  ]);
  const [habilidades, setHabilidades] = useState<string[]>(['Diabetes tipo 2', 'Educación médica']);
  const [nuevaHab, setNuevaHab] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const addExp = () => {
    setExps(p => [...p, { id: `e${Date.now()}`, cargo: '', institucion: '', inicio: '', fin: '', actual: false, descripcion: '' }]);
  };

  const updateExp = (id: string, key: keyof Experiencia, value: string | boolean) =>
    setExps(p => p.map(e => e.id === id ? { ...e, [key]: value } : e));

  const removeExp = (id: string) => setExps(p => p.filter(e => e.id !== id));

  const addHab = (h: string) => {
    if (!h.trim() || habilidades.includes(h)) return;
    setHabilidades(p => [...p, h]);
    setNuevaHab('');
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }, 700);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>Mi perfil</p>
        <h1 className="text-xl font-bold" style={{ color: '#0f172a', fontFamily: "'Sora', sans-serif" }}>Experiencia y habilidades</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Tu trayectoria profesional visible en tu perfil público.</p>
      </div>

      {/* Experiencias */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: '#0f172a' }}>Trayectoria profesional</p>
          <button type="button" onClick={addExp}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all active:scale-95"
            style={{ background: ACCENT, color: '#0a1f35' }}>
            <PlusIcon size={13} /> Agregar experiencia
          </button>
        </div>

        <AnimatePresence>
          {exps.map((exp, i) => (
            <motion.div key={exp.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl p-5 space-y-4 relative"
              style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                  Experiencia {i + 1}
                </span>
                {exps.length > 1 && (
                  <button type="button" onClick={() => removeExp(exp.id)}
                    className="rounded-lg p-1.5 transition-colors"
                    style={{ color: '#94a3b8' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#F24463')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                    <TrashIcon size={14} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Cargo / Rol" required>
                  <input className={inputCls} style={inputStyle} placeholder="Endocrinólogo tratante"
                    value={exp.cargo} onChange={e => updateExp(exp.id, 'cargo', e.target.value)} />
                </Field>
                <Field label="Institución" required>
                  <input className={inputCls} style={inputStyle} placeholder="Hospital / Universidad"
                    value={exp.institucion} onChange={e => updateExp(exp.id, 'institucion', e.target.value)} />
                </Field>
                <Field label="Año inicio">
                  <input className={inputCls} style={inputStyle} placeholder="2018" type="number" min="1970" max="2099"
                    value={exp.inicio} onChange={e => updateExp(exp.id, 'inicio', e.target.value)} />
                </Field>
                <Field label={exp.actual ? 'Cargo actual' : 'Año fin'}>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className={`h-5 w-9 rounded-full transition-all relative`}
                        style={{ background: exp.actual ? ACCENT : '#e2e8f0' }}
                        onClick={() => updateExp(exp.id, 'actual', !exp.actual)}>
                        <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                          style={{ left: exp.actual ? '18px' : '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                      </div>
                      <span className="text-xs" style={{ color: '#64748b' }}>Cargo actual</span>
                    </label>
                    {!exp.actual && (
                      <input className={inputCls} style={inputStyle} placeholder="2023" type="number" min="1970" max="2099"
                        value={exp.fin} onChange={e => updateExp(exp.id, 'fin', e.target.value)} />
                    )}
                  </div>
                </Field>
              </div>

              <Field label="Descripción">
                <textarea className={inputCls} style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
                  placeholder="Describe tus responsabilidades y logros…"
                  value={exp.descripcion} onChange={e => updateExp(exp.id, 'descripcion', e.target.value)} />
              </Field>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Habilidades / Temas */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p className="text-sm font-bold" style={{ color: '#0f172a' }}>Habilidades y temas en los que puedo hablar</p>

        <div className="flex flex-wrap gap-2 min-h-[36px]">
          {habilidades.map(h => (
            <span key={h} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: 'rgba(0,201,160,0.1)', color: ACCENT, border: '1px solid rgba(0,201,160,0.3)' }}>
              {h}
              <button type="button" onClick={() => setHabilidades(p => p.filter(x => x !== h))}><XIcon size={10} /></button>
            </span>
          ))}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>Sugeridas</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {HABILIDADES_SUGERIDAS.filter(h => !habilidades.includes(h)).map(h => (
              <button key={h} type="button" onClick={() => addHab(h)}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
                onMouseEnter={ev => { ev.currentTarget.style.background = 'rgba(0,201,160,0.1)'; ev.currentTarget.style.color = ACCENT; }}
                onMouseLeave={ev => { ev.currentTarget.style.background = '#f1f5f9'; ev.currentTarget.style.color = '#475569'; }}>
                + {h}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input className={inputCls + ' flex-1'} style={inputStyle} placeholder="Agregar otro tema…"
              value={nuevaHab} onChange={e => setNuevaHab(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addHab(nuevaHab)} />
            <button type="button" onClick={() => addHab(nuevaHab)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold"
              style={{ background: ACCENT, color: '#0a1f35' }}>
              <PlusIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSave} disabled={saving}
          className="rounded-xl px-6 py-3 text-sm font-bold transition-all active:scale-95 disabled:opacity-60"
          style={{ background: saved ? 'rgba(0,201,160,0.15)' : ACCENT, color: saved ? ACCENT : '#0a1f35', border: saved ? `1px solid ${ACCENT}` : 'none' }}>
          {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar experiencia'}
        </button>
      </div>
    </div>
  );
}
