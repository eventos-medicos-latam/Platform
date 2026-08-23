import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2Icon } from 'lucide-react';
import { PageTransition } from '../../components/motion/PageTransition';
import type { ContactReason } from '../../types/content';
import { organization } from '../../data/organization';
import { Pending } from '../../components/ui/Pending';
import { DURATION, EASE_EMPHASIS, popVariants } from '../../utils/motion';
import { PageHero } from '../../components/public/PageHero';
import { media } from '../../data/media';
const reasons: {
  id: ContactReason;
  label: string;
  helper: string;
}[] = [{
  id: 'asistir',
  label: 'Quiero asistir',
  helper: 'Información de inscripción y tarifas.'
}, {
  id: 'patrocinar',
  label: 'Quiero ser patrocinador',
  helper: 'Te enviamos la propuesta comercial.'
}, {
  id: 'stand',
  label: 'Quiero un stand',
  helper: 'Disponibilidad de la zona comercial.'
}, {
  id: 'alianza',
  label: 'Quiero hacer una alianza',
  helper: 'Sociedades médicas e instituciones.'
}, {
  id: 'speaker',
  label: 'Quiero proponer un speaker',
  helper: 'Revisión del comité académico.'
}, {
  id: 'comercial',
  label: 'Información comercial',
  helper: 'Otras oportunidades con la marca.'
}, {
  id: 'otro',
  label: 'Otro',
  helper: 'Cuéntanos en el mensaje.'
}];
export function Contact() {
  const [params] = useSearchParams();
  const initialReason = params.get('motivo') as ContactReason ?? 'asistir';
  const [reason, setReason] = useState<ContactReason>(reasons.some((item) => item.id === initialReason) ? initialReason : 'asistir');
  const [form, setForm] = useState({
    name: '',
    email: '',
    whatsapp: '',
    company: '',
    message: ''
  });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!sent) return;
    const timer = window.setTimeout(() => setSent(false), 6000);
    return () => window.clearTimeout(timer);
  }, [sent]);
  const commercial = reason === 'patrocinar' || reason === 'stand' || reason === 'comercial';
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError('Nombre y correo son obligatorios.');
      return;
    }
    setError(null);
    setSent(true);
    setForm({
      name: '',
      email: '',
      whatsapp: '',
      company: '',
      message: ''
    });
  }
  const fieldClass = 'w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis placeholder:text-ink-muted/70 focus:border-brand-support';
  return <PageTransition>
      <PageHero eyebrow="Contacto" title={[{
      text: 'Hablemos',
      tone: 'bold'
    }, {
      text: 'de tu próximo evento',
      tone: 'light'
    }]} lead="Dinos el motivo y la solicitud llega al equipo correcto, con la etiqueta adecuada en el CRM." image={media.stage} />

      <section className="bg-white">
        <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-start">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-support">
                Contacto
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-brand lg:text-4xl">
                Elige el motivo
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-ink">
                Dinos el motivo y la solicitud llega al equipo correcto, con la etiqueta adecuada en el
                CRM.
              </p>

              <dl className="mt-10 space-y-px overflow-hidden rounded-xl border border-line bg-line">
                <div className="bg-white px-5 py-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    Correo
                  </dt>
                  <dd className="mt-1.5 text-sm">
                    <Pending />
                  </dd>
                </div>
                <div className="bg-white px-5 py-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    WhatsApp
                  </dt>
                  <dd className="mt-1.5 text-sm">
                    <Pending />
                  </dd>
                </div>
                <div className="bg-white px-5 py-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    Sede
                  </dt>
                  <dd className="mt-1.5 text-sm font-medium text-brand">
                    {organization.city}, {organization.country}
                  </dd>
                </div>
              </dl>
            </div>

            <form onSubmit={submit} className="rounded-xl border border-line bg-canvas p-6 lg:p-8" noValidate>
              <fieldset>
                <legend className="text-xs font-medium text-ink-muted">Motivo</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {reasons.map((item) => <label key={item.id} className={`cursor-pointer rounded-lg border px-3.5 py-3 transition-colors duration-150 ease-emphasis ${reason === item.id ? 'border-brand bg-white' : 'border-line bg-white/60 hover:border-brand/30'}`}>
                      <span className="flex items-start gap-2.5">
                        <input type="radio" name="reason" className="mt-0.5 h-4 w-4 accent-[color:var(--brand)]" checked={reason === item.id} onChange={() => setReason(item.id)} />
                        <span>
                          <span className="block text-sm font-medium text-brand">{item.label}</span>
                          <span className="mt-0.5 block text-xs text-ink-muted">{item.helper}</span>
                        </span>
                      </span>
                    </label>)}
                </div>
              </fieldset>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-muted">Nombre</span>
                  <input className={fieldClass} value={form.name} onChange={(event) => setForm({
                  ...form,
                  name: event.target.value
                })} autoComplete="name" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-muted">Correo</span>
                  <input className={fieldClass} type="email" value={form.email} onChange={(event) => setForm({
                  ...form,
                  email: event.target.value
                })} autoComplete="email" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-muted">WhatsApp</span>
                  <input className={fieldClass} value={form.whatsapp} onChange={(event) => setForm({
                  ...form,
                  whatsapp: event.target.value
                })} autoComplete="tel" />
                </label>
                {commercial ? <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-ink-muted">Empresa</span>
                    <input className={fieldClass} value={form.company} onChange={(event) => setForm({
                  ...form,
                  company: event.target.value
                })} autoComplete="organization" />
                  </label> : null}
              </div>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">Mensaje</span>
                <textarea className={`${fieldClass} min-h-[110px] resize-y`} value={form.message} onChange={(event) => setForm({
                ...form,
                message: event.target.value
              })} />
              </label>

              {error ? <p role="alert" className="mt-4 text-sm font-medium text-rose-700">
                  {error}
                </p> : null}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <motion.button type="submit" whileTap={{
                scale: 0.985
              }} transition={{
                duration: DURATION.press,
                ease: EASE_EMPHASIS
              }} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
                  Enviar solicitud
                </motion.button>
                <AnimatePresence>
                  {sent ? <motion.p variants={popVariants} initial="initial" animate="enter" exit="exit" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                      <CheckCircle2Icon size={16} /> Solicitud enviada
                    </motion.p> : null}
                </AnimatePresence>
              </div>
            </form>
          </div>
        </div>
      </section>
    </PageTransition>;
}