import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CameraIcon, PlusIcon, XIcon, GlobeIcon, InstagramIcon, YoutubeIcon } from 'lucide-react';

const ACCENT = '#00C9A0';
const ESPECIALIDADES = [
  'Endocrinología', 'Cardiología', 'Neurología', 'Oncología', 'Medicina Interna',
  'Pediatría', 'Ginecología', 'Dermatología', 'Psiquiatría', 'Cirugía General',
  'Ortopedia', 'Gastroenterología', 'Reumatología', 'Neumología', 'Nefrología',
];
const PAISES = ['Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'Venezuela', 'Ecuador', 'Brasil', 'España', 'Estados Unidos', 'Otro'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 space-y-5" style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{title}</p>
      {children}
    </div>
  );
}

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

const inputCls = "w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors";
const inputStyle = { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' };

export function SpeakerPerfil() {
  const [foto, setFoto] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: '', apellido: '', bio: '',
    especialidades: [] as string[], otraEsp: '',
    institucion: '', ciudad: '', pais: '',
    linkedin: '', web: '', instagram: '', youtube: '',
  });
  const [newEsp, setNewEsp] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const addEsp = (esp: string) => {
    if (!esp.trim() || form.especialidades.includes(esp)) return;
    setForm(p => ({ ...p, especialidades: [...p.especialidades, esp] }));
    setNewEsp('');
  };

  const removeEsp = (esp: string) => setForm(p => ({ ...p, especialidades: p.especialidades.filter(e => e !== esp) }));

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }, 700);
  };

  const esColombia = form.pais === 'Colombia';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>Mi perfil</p>
        <h1 className="text-xl font-bold" style={{ color: '#0f172a', fontFamily: "'Sora', sans-serif" }}>Información personal</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Esta información aparecerá en tu perfil público cuando lo actives.</p>
      </div>

      {/* Foto */}
      <Section title="Foto de perfil">
        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 rounded-full overflow-hidden shrink-0"
            style={{ background: '#e2e8f0', border: '2px solid #e2e8f0' }}>
            {foto
              ? <img src={foto} alt="perfil" className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center">
                  <CameraIcon size={24} style={{ color: '#94a3b8' }} />
                </div>
            }
          </div>
          <div>
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
              style={{ background: ACCENT, color: '#0a1f35' }}>
              <CameraIcon size={14} />
              {foto ? 'Cambiar foto' : 'Subir foto'}
              <input type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) setFoto(URL.createObjectURL(f)); }} />
            </label>
            <p className="mt-1.5 text-xs" style={{ color: '#94a3b8' }}>JPG o PNG · máx. 5 MB · mínimo 400×400 px</p>
          </div>
        </div>
      </Section>

      {/* Datos personales */}
      <Section title="Datos personales">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre" required>
            <input className={inputCls} style={inputStyle} placeholder="Juan" value={form.nombre} onChange={e => f('nombre')(e.target.value)} />
          </Field>
          <Field label="Apellido" required>
            <input className={inputCls} style={inputStyle} placeholder="Pérez" value={form.apellido} onChange={e => f('apellido')(e.target.value)} />
          </Field>
        </div>
        <Field label="Institución / Hospital / Universidad">
          <input className={inputCls} style={inputStyle} placeholder="Ej. Hospital Universitario San Ignacio" value={form.institucion} onChange={e => f('institucion')(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="País" required>
            <select className={inputCls} style={inputStyle} value={form.pais} onChange={e => f('pais')(e.target.value)}>
              <option value="">Seleccionar…</option>
              {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Ciudad">
            <input className={inputCls} style={inputStyle} placeholder="Medellín" value={form.ciudad} onChange={e => f('ciudad')(e.target.value)} />
          </Field>
        </div>
        {form.pais && !esColombia && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(0,201,160,0.08)', border: '1px solid rgba(0,201,160,0.2)', color: '#0f172a' }}>
            <span className="mt-0.5 text-lg">✈️</span>
            <p><strong>Estás fuera de Colombia.</strong> Cuando te soliciten para un evento presencial se consultará tu disponibilidad incluyendo traslado internacional.</p>
          </motion.div>
        )}
      </Section>

      {/* Bio */}
      <Section title="Biografía profesional">
        <Field label="Bio" required>
          <textarea className={inputCls} style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
            placeholder="Escribe una presentación profesional que se mostrará en tu perfil público…"
            value={form.bio} onChange={e => f('bio')(e.target.value)} />
        </Field>
        <p className="text-xs text-right tabular-nums" style={{ color: '#94a3b8' }}>{form.bio.length} caracteres</p>
      </Section>

      {/* Especialidades */}
      <Section title="Especialidades">
        <div className="flex flex-wrap gap-2 min-h-[36px]">
          {form.especialidades.map(esp => (
            <span key={esp} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: 'rgba(0,201,160,0.1)', color: ACCENT, border: '1px solid rgba(0,201,160,0.3)' }}>
              {esp}
              <button type="button" onClick={() => removeEsp(esp)}><XIcon size={11} /></button>
            </span>
          ))}
          {form.especialidades.length === 0 && <p className="text-xs" style={{ color: '#94a3b8' }}>Sin especialidades aún</p>}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>Agregar especialidad</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {ESPECIALIDADES.filter(e => !form.especialidades.includes(e)).map(e => (
              <button key={e} type="button" onClick={() => addEsp(e)}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
                onMouseEnter={ev => { ev.currentTarget.style.background = 'rgba(0,201,160,0.1)'; ev.currentTarget.style.color = ACCENT; }}
                onMouseLeave={ev => { ev.currentTarget.style.background = '#f1f5f9'; ev.currentTarget.style.color = '#475569'; }}>
                + {e}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input className={inputCls + ' flex-1'} style={inputStyle} placeholder="Otra especialidad…"
              value={newEsp} onChange={e => setNewEsp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEsp(newEsp)} />
            <button type="button" onClick={() => addEsp(newEsp)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold"
              style={{ background: ACCENT, color: '#0a1f35' }}>
              <PlusIcon size={16} />
            </button>
          </div>
        </div>
      </Section>

      {/* Links */}
      <Section title="Links y redes sociales">
        {[
          { key: 'linkedin',  label: 'LinkedIn',  icon: '🔗', placeholder: 'https://linkedin.com/in/tu-perfil' },
          { key: 'web',       label: 'Sitio web', icon: '🌐', placeholder: 'https://tuweb.com' },
          { key: 'instagram', label: 'Instagram', icon: '📸', placeholder: 'https://instagram.com/tu-usuario' },
          { key: 'youtube',   label: 'YouTube',   icon: '▶️', placeholder: 'https://youtube.com/@tu-canal' },
        ].map(({ key, label, icon, placeholder }) => (
          <Field key={key} label={`${icon} ${label}`}>
            <input className={inputCls} style={inputStyle} placeholder={placeholder}
              value={(form as any)[key]} onChange={e => f(key as any)(e.target.value)} />
          </Field>
        ))}
      </Section>

      {/* Guardar */}
      <div className="flex justify-end">
        <button type="button" onClick={handleSave} disabled={saving}
          className="rounded-xl px-6 py-3 text-sm font-bold transition-all active:scale-95 disabled:opacity-60"
          style={{ background: saved ? 'rgba(0,201,160,0.15)' : ACCENT, color: saved ? ACCENT : '#0a1f35',
            border: saved ? `1px solid ${ACCENT}` : 'none' }}>
          {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar perfil'}
        </button>
      </div>
    </div>
  );
}
