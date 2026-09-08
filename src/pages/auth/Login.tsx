import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '../../components/ui/Logo';
import { media } from '../../data/media';
import { usePlatform } from '../../contexts/PlatformContext';
import { supabase } from '../../lib/supabaseClient';
import { EASE_EMPHASIS } from '../../utils/motion';

export function Login() {
  const {
    signIn
  } = usePlatform();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setSubmitting(false);
      setError('Correo o contraseña incorrectos.');
      return;
    }
    const { data } = await supabase.auth.getUser();
    const { data: profile } = data.user ? await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single() : { data: null };
    setSubmitting(false);
    const role = profile?.role;
    navigate(role === 'admin' ? '/admin' : role === 'speaker' ? '/speaker' : '/portal');
  };
  return <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-deep lg:block">
        <img src={media.stage} alt="" className="h-full w-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0" aria-hidden="true" style={{
        background: 'linear-gradient(180deg, rgba(6,17,33,0.7) 0%, rgba(6,17,33,0.85) 60%, rgba(6,17,33,0.97) 100%)'
      }} />
        <div className="absolute inset-x-10 bottom-12">
          <Logo />
          <p className="mt-6 max-w-sm text-2xl font-bold leading-tight tracking-tight text-white">
            Una sola plataforma para operar todos los eventos de la organización.
          </p>
          <p className="mt-3 max-w-sm text-sm text-white/65">
            Agenda, tickets, patrocinio, stands, banner de marcas y portal de empresas.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-canvas px-6 py-16">
        <motion.div initial={{
        opacity: 0,
        y: 14
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.28,
        ease: EASE_EMPHASIS
      }} className="w-full max-w-md">
          <div className="lg:hidden">
            <Logo surface="onLight" compact />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-brand lg:mt-0">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Acceso para administradores, empresas aliadas y speakers.
          </p>

          <div className="mt-5 flex gap-2">
            {[
              { label: 'Administrador', color: 'bg-brand-soft text-brand' },
              { label: 'Empresa aliada', color: 'bg-accent/10 text-accent' },
              { label: 'Speaker', color: 'bg-purple-50 text-purple-700' },
            ].map(({ label, color }) => (
              <span key={label} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${color}`}>
                {label}
              </span>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">Correo</span>
                <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">Contraseña</span>
                <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
              </label>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={submitting} className="mt-7 w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
              {submitting ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2">
            <p className="text-sm text-ink-muted">
              ¿Eres speaker y aún no tienes cuenta?{' '}
              <Link to="/speaker/registro" className="font-semibold text-accent">Crear perfil de speaker</Link>
            </p>
            <p className="text-sm text-ink-muted">
              ¿Eres empresa aliada o necesitas acceso?{' '}
              <Link to="/contacto?motivo=acceso-portal" className="font-semibold text-accent">Solicitar acceso</Link>
            </p>
            <Link to="/" className="text-sm font-medium text-brand-support">
              Volver al sitio público
            </Link>
          </div>
        </motion.div>
      </div>
    </div>;
}