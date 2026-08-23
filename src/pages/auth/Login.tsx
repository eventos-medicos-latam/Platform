import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BuildingIcon, ShieldCheckIcon } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { media } from '../../data/media';
import { usePlatform, type SessionRole } from '../../contexts/PlatformContext';
import { portalCompanyId, getCompany } from '../../data/companies';
import { EASE_EMPHASIS } from '../../utils/motion';
const roles: {
  id: SessionRole;
  label: string;
  description: string;
  icon: typeof ShieldCheckIcon;
}[] = [{
  id: 'admin',
  label: 'Equipo interno',
  description: 'Panel administrativo completo de la organización.',
  icon: ShieldCheckIcon
}, {
  id: 'empresa',
  label: 'Empresa patrocinadora',
  description: 'Portal con tu participación, requerimientos y pagos.',
  icon: BuildingIcon
}];

/**
 * Acceso único: en producción los permisos determinan el destino. Aquí se
 * muestran los dos accesos para poder recorrer el prototipo.
 */
export function Login() {
  const {
    signIn
  } = usePlatform();
  const navigate = useNavigate();
  const [role, setRole] = useState<SessionRole>('admin');
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (role === 'admin') {
      signIn({
        role: 'admin',
        name: 'Equipo interno',
        email: 'admin@eventosmedicoslatam.com'
      });
      navigate('/admin');
    } else {
      const company = getCompany(portalCompanyId);
      signIn({
        role: 'empresa',
        name: company?.tradeName ?? 'Empresa',
        email: 'empresa@eventosmedicoslatam.com',
        companyId: portalCompanyId
      });
      navigate('/portal');
    }
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
            El acceso es único: tus permisos definen lo que ves al entrar.
          </p>

          <form onSubmit={submit} className="mt-8">
            <fieldset>
              <legend className="mb-3 text-xs font-medium text-ink-muted">Tipo de acceso (demo)</legend>
              <div className="space-y-2.5">
                {roles.map((item) => <label key={item.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-3.5 transition-colors duration-150 ease-emphasis ${role === item.id ? 'border-brand' : 'border-line hover:border-brand/40'}`}>
                    <input type="radio" name="role" className="mt-1 h-4 w-4 accent-[color:var(--brand)]" checked={role === item.id} onChange={() => setRole(item.id)} />
                    <item.icon size={18} className="mt-0.5 shrink-0 text-brand-support" />
                    <span>
                      <span className="block text-sm font-semibold text-brand">{item.label}</span>
                      <span className="mt-0.5 block text-xs text-ink-muted">{item.description}</span>
                    </span>
                  </label>)}
              </div>
            </fieldset>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">Correo</span>
                <input type="email" defaultValue="demo@eventosmedicoslatam.com" className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">Contraseña</span>
                <input type="password" defaultValue="demo1234" className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
              </label>
            </div>

            <button type="submit" className="mt-7 w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
              Entrar
            </button>
          </form>

          <Link to="/" className="mt-6 inline-block text-sm font-medium text-brand-support">
            Volver al sitio público
          </Link>
        </motion.div>
      </div>
    </div>;
}