import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheckIcon, BuildingIcon, CheckIcon, HandshakeIcon, MegaphoneIcon, SendIcon, UsersRoundIcon } from 'lucide-react';
import type { CompanyRole } from '../../types/company';
import { EASE_EMPHASIS } from '../../utils/motion';

/** Modalidades de alianza abiertas a postulación. */
const tiers: {
  role: CompanyRole;
  label: string;
  icon: typeof HandshakeIcon;
  pitch: string;
  gives: string[];
  tone: string;
}[] = [{
  role: 'sociedad-medica',
  label: 'Sociedad médica o científica',
  icon: BadgeCheckIcon,
  pitch: 'Respalda el contenido desde tu comunidad científica y participa en la definición del programa académico.',
  gives: ['Voz en el comité académico', 'Cupos para tus afiliados', 'Presencia como aval del contenido'],
  tone: 'var(--tone-corporativo)'
}, {
  role: 'aliado-academico',
  label: 'Universidad o grupo de investigación',
  icon: UsersRoundIcon,
  pitch: 'Lleva tu producción científica al escenario y conecta a tus docentes e investigadores con la práctica clínica.',
  gives: ['Espacio para presentar investigación', 'Tarifas para estudiantes', 'Coautoría en memorias'],
  tone: 'var(--tone-obesidad)'
}, {
  role: 'marca',
  label: 'Marca o empresa del sector',
  icon: BuildingIcon,
  pitch: 'Acompaña el programa como patrocinador con presencia en el recinto, en el banner digital y en la comunidad.',
  gives: ['Stand en el recinto', 'Logo en el banner de patrocinadores', 'Acceso al portal de empresas'],
  tone: 'var(--tone-hormobiota)'
}, {
  role: 'media-partner',
  label: 'Medio especializado',
  icon: MegaphoneIcon,
  pitch: 'Cubre el congreso, accede a los ponentes y distribuye el contenido a tu audiencia profesional.',
  gives: ['Acreditación de prensa', 'Entrevistas con ponentes', 'Material audiovisual del evento'],
  tone: 'var(--tone-inflamacion)'
}];
const steps = [{
  title: 'Postulación',
  text: 'Envías este formulario con el perfil de tu organización.'
}, {
  title: 'Conversación',
  text: 'Agendamos una llamada para entender el encaje académico y comercial.'
}, {
  title: 'Propuesta',
  text: 'Recibes una propuesta formal con alcance, entregables y valores.'
}, {
  title: 'Publicación',
  text: 'Firmado el acuerdo, tu marca entra al sitio y al portal de empresas.'
}];

/**
 * Información para futuros aliados y su formulario de postulación. Reemplaza el
 * listado por rol: en la web pública interesa más invitar a nuevas marcas que
 * inventariar las existentes, que ya viven en el carrusel de arriba.
 */
export function AllyApplication() {
  const [role, setRole] = useState<CompanyRole>('marca');
  const [sent, setSent] = useState(false);
  const selected = tiers.find((tier) => tier.role === role) ?? tiers[2];
  return <section className="tint-blue" aria-labelledby="ser-aliado">
      <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            Ser aliado
          </p>
          <h2 id="ser-aliado" className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.05] tracking-tight text-brand">
            Sumar tu marca al proyecto
            <span className="block font-normal text-ink-muted">no es comprar un espacio</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink">
            Cada organización que acompaña Hormobiota entra por una razón distinta: unas aportan aval
            científico, otras producción académica, otras acceso a la comunidad profesional. Definimos
            juntos el rol antes de hablar de cifras, y nada se publica mientras el acuerdo esté en
            negociación.
          </p>
        </div>

        {/* Modalidades */}
        <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier, index) => {
          const Icon = tier.icon;
          const isActive = tier.role === role;
          return <motion.li key={tier.role} initial={{
            opacity: 0,
            y: 18
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true,
            margin: '-60px'
          }} transition={{
            duration: 0.26,
            ease: EASE_EMPHASIS,
            delay: index * 0.05
          }} style={{
            ['--accent-rgb' as string]: tier.tone
          }}>
                <button type="button" onClick={() => setRole(tier.role)} aria-pressed={isActive} className={`flex h-full w-full flex-col rounded-2xl border bg-white p-6 text-left transition-transform duration-200 ease-emphasis hover:-translate-y-1 ${isActive ? 'border-accent shadow-elev3' : 'border-line shadow-elev1'}`}>
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-accent">
                    <Icon size={22} />
                  </span>
                  <span className="mt-5 block text-base font-bold leading-snug text-brand">
                    {tier.label}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-ink-muted">
                    {tier.pitch}
                  </span>
                  <span className="mt-auto flex items-center gap-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                    {isActive ? 'Seleccionado' : 'Postularme así'}
                  </span>
                </button>
              </motion.li>;
        })}
        </ul>

        {/* Qué recibe + formulario */}
        <div className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div style={{
          ['--accent-rgb' as string]: selected.tone
        }}>
            <h3 className="text-xl font-bold tracking-tight text-brand">
              Como {selected.label.toLowerCase()} recibes
            </h3>
            <ul className="mt-5 space-y-3">
              {selected.gives.map((item) => <li key={item} className="flex items-start gap-3 text-base text-ink">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-white">
                    <CheckIcon size={12} strokeWidth={3} />
                  </span>
                  {item}
                </li>)}
            </ul>

            <h3 className="mt-10 text-xl font-bold tracking-tight text-brand">Cómo avanza</h3>
            <ol className="mt-5 space-y-4">
              {steps.map((step, index) => <li key={step.title} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-brand">{step.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{step.text}</p>
                  </div>
                </li>)}
            </ol>
          </div>

          {/* Formulario */}
          <div className="rounded-3xl border border-line bg-white p-7 shadow-elev3 lg:p-9">
            {sent ? <div className="flex h-full flex-col items-start justify-center py-10">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white">
                  <CheckIcon size={28} strokeWidth={2.5} />
                </span>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-brand">
                  Postulación recibida
                </h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">
                  Nuestro equipo comercial revisa el perfil de tu organización y te contacta en los
                  próximos días hábiles para agendar la conversación.
                </p>
                <button type="button" onClick={() => setSent(false)} className="mt-7 text-sm font-semibold text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand">
                  Enviar otra postulación
                </button>
              </div> : <form onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }} className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-brand">
                    Postula tu organización
                  </h3>
                  <p className="mt-1.5 text-sm text-ink-muted">
                    Cuéntanos quién eres y qué te gustaría aportar. Sin compromiso.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Nombre de la organización" name="organizacion" required />
                  <Field label="Sitio web" name="web" type="url" placeholder="https://" />
                  <Field label="Persona de contacto" name="contacto" required />
                  <Field label="Cargo" name="cargo" />
                  <Field label="Correo corporativo" name="correo" type="email" required />
                  <Field label="Teléfono" name="telefono" type="tel" />
                </div>

                <div>
                  <label htmlFor="ally-role" className="block text-sm font-semibold text-brand">
                    Tipo de alianza
                  </label>
                  <select id="ally-role" value={role} onChange={(event) => setRole(event.target.value as CompanyRole)} className="mt-2 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand">
                    {tiers.map((tier) => <option key={tier.role} value={tier.role}>
                        {tier.label}
                      </option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="ally-message" className="block text-sm font-semibold text-brand">
                    Qué te gustaría aportar
                  </label>
                  <textarea id="ally-message" name="mensaje" rows={4} required placeholder="Cuéntanos brevemente el perfil de tu organización y qué buscas con la alianza." className="mt-2 w-full resize-y rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
                </div>

                <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-muted">
                  <input type="checkbox" required className="mt-1 h-4 w-4 rounded border-line text-brand focus:ring-brand" />
                  Autorizo el tratamiento de mis datos para ser contactado sobre esta postulación.
                </label>

                <button type="submit" className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-elev2 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                  Enviar postulación
                  <SendIcon size={15} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-0.5" />
                </button>
              </form>}
          </div>
        </div>
      </div>
    </section>;
}
interface FieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}
function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder
}: FieldProps) {
  return <div>
      <label htmlFor={`ally-${name}`} className="block text-sm font-semibold text-brand">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </label>
      <input id={`ally-${name}`} name={name} type={type} required={required} placeholder={placeholder} className="mt-2 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
    </div>;
}