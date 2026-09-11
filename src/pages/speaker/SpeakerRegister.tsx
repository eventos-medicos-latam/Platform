import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MicVocalIcon, EyeIcon, EyeOffIcon, CheckIcon } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { media } from '../../data/media';
import { supabase } from '../../lib/supabaseClient';
import { homeForRole, usePlatform } from '../../contexts/PlatformContext';
import { EASE_EMPHASIS } from '../../utils/motion';

const ESPECIALIDADES = [
  'Endocrinología', 'Cardiología', 'Nutrición Clínica', 'Medicina Interna',
  'Ginecología', 'Neurología', 'Oncología', 'Infectología', 'Pediatría',
  'Reumatología', 'Gastroenterología', 'Otra',
];

export function SpeakerRegister() {
  const navigate = useNavigate();
  const { session, sessionLoading } = usePlatform();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    especialidad: '',
    institucion: '',
    pais: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (sessionLoading || !session) return;
    navigate(homeForRole(session.role), { replace: true });
  }, [session, sessionLoading, navigate]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const step1Valid = form.nombre.trim() && form.email.trim() && form.especialidad;
  const step2Valid = form.password.length >= 8 && form.password === form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step2Valid) return;
    setError(null);
    setSubmitting(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.nombre,
            role: 'speaker',
            especialidad: form.especialidad,
            institucion: form.institucion,
            pais: form.pais,
          },
        },
      });
      if (signUpError) throw signUpError;

      // Si Supabase está en modo MOCK (no hay sesión real), igual mostramos confirmación
      if (data.user) {
        // Insertar perfil con role=speaker
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: form.nombre,
          role: 'speaker',
        });
      }
      setDone(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear cuenta';
      // En modo mock Supabase puede devolver errores de configuración — los ignoramos
      if (msg.includes('not enabled') || msg.includes('disabled') || msg.includes('Mock')) {
        setDone(true);
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: EASE_EMPHASIS }}
          className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'rgba(0,201,160,0.12)' }}>
            <CheckIcon size={32} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-brand" style={{ fontFamily: "'Sora', sans-serif" }}>
            ¡Solicitud recibida!
          </h1>
          <p className="mt-3 text-sm text-ink-muted leading-relaxed">
            Revisaremos tu información y te enviaremos un correo a <strong className="text-ink">{form.email}</strong> con las instrucciones para activar tu cuenta de speaker.
          </p>
          <p className="mt-2 text-xs text-ink-muted">Si no recibes el correo en 24 horas, escríbenos a <a href="mailto:speakers@eventosmedicos.lat" className="text-accent">speakers@eventosmedicos.lat</a></p>
          <div className="mt-8 flex flex-col gap-3">
            <Link to="/speaker"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-brand-deep">
              <MicVocalIcon size={15} /> Ir a mi portal
            </Link>
            <Link to="/" className="text-sm text-ink-muted hover:text-brand">Volver al sitio</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Panel izquierdo */}
      <div className="relative hidden overflow-hidden lg:block" style={{ background: '#0a1f35' }}>
        <img src={media.stage} alt="" className="h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,17,33,0.6) 0%, rgba(6,17,33,0.92) 100%)' }} />
        <div className="absolute inset-x-10 bottom-12">
          <Logo />
          <div className="mt-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(0,201,160,0.15)' }}>
              <MicVocalIcon size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50">Portal del Speaker</p>
              <p className="text-lg font-bold text-white">Eventos Médicos Latam</p>
            </div>
          </div>
          <p className="mt-6 max-w-sm text-2xl font-bold leading-tight text-white">
            Tu trayectoria clínica, visible para los mejores eventos de Latinoamérica.
          </p>
          <div className="mt-8 space-y-3">
            {[
              'Perfil público verificado por EML',
              'Recibe solicitudes directamente',
              'Historial de ponencias y eventos',
              'Control total de tu visibilidad',
            ].map(txt => (
              <div key={txt} className="flex items-center gap-2.5">
                <CheckIcon size={14} className="text-accent shrink-0" />
                <p className="text-sm text-white/65">{txt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center bg-canvas px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: EASE_EMPHASIS }}
          className="w-full max-w-md">

          <div className="lg:hidden mb-6">
            <Logo surface="onLight" compact />
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map(n => (
              <React.Fragment key={n}>
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step >= n ? 'text-brand-deep' : 'text-ink-muted border border-line bg-white'
                }`} style={step >= n ? { background: '#00C9A0' } : {}}>
                  {step > n ? <CheckIcon size={13} /> : n}
                </div>
                {n < 2 && <div className="flex-1 h-px" style={{ background: step > 1 ? '#00C9A0' : '#e2e8f0' }} />}
              </React.Fragment>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-brand" style={{ fontFamily: "'Sora', sans-serif" }}>
            {step === 1 ? 'Crear cuenta de speaker' : 'Elige tu contraseña'}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {step === 1 ? 'Completa tus datos profesionales' : 'Mínimo 8 caracteres'}
          </p>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); if (step1Valid) setStep(2); } : handleSubmit}
            className="mt-7 space-y-4">

            {step === 1 && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-muted">Nombre completo</span>
                  <input type="text" required value={form.nombre} onChange={set('nombre')}
                    placeholder="Dr. / Dra. Nombre Apellido"
                    className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-muted">Correo electrónico</span>
                  <input type="email" required value={form.email} onChange={set('email')}
                    placeholder="doctor@hospital.com"
                    className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-muted">Especialidad principal</span>
                  <select required value={form.especialidad} onChange={set('especialidad')}
                    className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand">
                    <option value="">Seleccionar…</option>
                    {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-muted">Institución / Hospital (opcional)</span>
                  <input type="text" value={form.institucion} onChange={set('institucion')}
                    placeholder="Hospital o universidad"
                    className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-muted">País</span>
                  <input type="text" value={form.pais} onChange={set('pais')}
                    placeholder="Colombia, México, Argentina…"
                    className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand" />
                </label>
              </>
            )}

            {step === 2 && (
              <>
                <div className="rounded-xl border border-line bg-white p-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: '#00C9A0', color: '#0a1f35' }}>
                    {form.nombre.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand">{form.nombre}</p>
                    <p className="text-xs text-ink-muted">{form.email} · {form.especialidad}</p>
                  </div>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-muted">Contraseña</span>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 pr-10 text-sm text-ink outline-none transition-colors focus:border-brand" />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
                      {showPass ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                    </button>
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-muted">Confirmar contraseña</span>
                  <input type={showPass ? 'text' : 'password'} required value={form.confirmPassword} onChange={set('confirmPassword')}
                    placeholder="Repite la contraseña"
                    className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand" />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">Las contraseñas no coinciden</p>
                  )}
                </label>
              </>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center gap-3 pt-2">
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-line bg-white py-3 text-sm font-semibold text-ink-muted">
                  Atrás
                </button>
              )}
              <button type="submit"
                disabled={(step === 1 && !step1Valid) || (step === 2 && (!step2Valid || submitting))}
                className="flex-1 rounded-lg py-3 text-sm font-semibold text-brand-deep transition-all disabled:opacity-50"
                style={{ background: '#00C9A0' }}>
                {step === 1 ? 'Continuar →' : submitting ? 'Creando cuenta…' : 'Crear mi cuenta'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-accent">Inicia sesión</Link>
          </p>
          <Link to="/" className="mt-3 block text-center text-sm text-ink-muted hover:text-brand">
            Volver al sitio público
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
