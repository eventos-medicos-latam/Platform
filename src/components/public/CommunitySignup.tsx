import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2Icon } from 'lucide-react';
import { editions, featuredEditionId } from '../../data/editions';
import { DURATION, EASE_EMPHASIS, popVariants } from '../../utils/motion';
const specialties = ['Medicina general', 'Endocrinología', 'Gastroenterología', 'Nutrición clínica', 'Dermatología', 'Ginecología', 'Medicina funcional', 'Medicina deportiva', 'Residente o estudiante', 'Industria', 'Otra'];
interface CommunitySignupProps {
  compact?: boolean;
}

/** Formulario de comunidad. La carga útil viaja a GoHighLevel. */
export function CommunitySignup({
  compact = false
}: CommunitySignupProps) {
  const edition = editions.find((item) => item.id === featuredEditionId);
  const tracks = edition?.trackAxis.tracks ?? [];
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    city: '',
    specialty: specialties[0],
    interest: tracks[0]?.id ?? '',
    consentData: false,
    consentCommercial: false
  });
  useEffect(() => {
    if (!sent) return;
    const timer = window.setTimeout(() => setSent(false), 6000);
    return () => window.clearTimeout(timer);
  }, [sent]);
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Nombre y correo son obligatorios.');
      return;
    }
    if (!form.consentData) {
      setError('Necesitamos tu autorización de tratamiento de datos para registrarte.');
      return;
    }
    setError(null);
    setSent(true);
    setForm((current) => ({
      ...current,
      fullName: '',
      email: '',
      whatsapp: '',
      city: ''
    }));
  }
  const fieldClass = 'w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis placeholder:text-ink-muted/70 focus:border-brand-support';
  return <form onSubmit={submit} className="space-y-4" noValidate>
      <div className={`grid gap-4 ${compact ? '' : 'sm:grid-cols-2'}`}>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">Nombre completo</span>
          <input className={fieldClass} value={form.fullName} onChange={(event) => setForm({
          ...form,
          fullName: event.target.value
        })} placeholder="Nombre y apellido" autoComplete="name" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">Correo</span>
          <input className={fieldClass} type="email" value={form.email} onChange={(event) => setForm({
          ...form,
          email: event.target.value
        })} placeholder="correo@dominio.com" autoComplete="email" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">WhatsApp</span>
          <input className={fieldClass} value={form.whatsapp} onChange={(event) => setForm({
          ...form,
          whatsapp: event.target.value
        })} placeholder="+57" autoComplete="tel" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">Ciudad</span>
          <input className={fieldClass} value={form.city} onChange={(event) => setForm({
          ...form,
          city: event.target.value
        })} placeholder="Ciudad" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">Especialidad</span>
          <select className={fieldClass} value={form.specialty} onChange={(event) => setForm({
          ...form,
          specialty: event.target.value
        })}>
            {specialties.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        {tracks.length > 0 ? <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">
              {edition?.trackAxis.interestQuestion}
            </span>
            <select className={fieldClass} value={form.interest} onChange={(event) => setForm({
          ...form,
          interest: event.target.value
        })}>
              {tracks.map((track) => <option key={track.id} value={track.id}>
                  {track.name}
                </option>)}
            </select>
          </label> : null}
      </div>

      <div className="space-y-2.5 rounded-lg bg-canvas px-4 py-3.5">
        <label className="flex gap-3 text-xs leading-relaxed text-ink">
          <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-[color:var(--brand)]" checked={form.consentData} onChange={(event) => setForm({
          ...form,
          consentData: event.target.checked
        })} />
          <span>
            Autorizo el tratamiento de mis datos personales conforme a la política de Habeas Data de
            Eventos Médicos LATAM.
          </span>
        </label>
        <label className="flex gap-3 text-xs leading-relaxed text-ink">
          <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-[color:var(--brand)]" checked={form.consentCommercial} onChange={(event) => setForm({
          ...form,
          consentCommercial: event.target.checked
        })} />
          <span>Quiero recibir información comercial y de patrocinadores (autorización separada).</span>
        </label>
      </div>

      {error ? <p role="alert" className="text-sm font-medium text-rose-700">
          {error}
        </p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <motion.button type="submit" whileTap={{
        scale: 0.985
      }} transition={{
        duration: DURATION.press,
        ease: EASE_EMPHASIS
      }} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
          Unirme a la comunidad
        </motion.button>
        <AnimatePresence>
          {sent ? <motion.p variants={popVariants} initial="initial" animate="enter" exit="exit" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2Icon size={16} /> Registro enviado a GoHighLevel
            </motion.p> : null}
        </AnimatePresence>
      </div>
    </form>;
}