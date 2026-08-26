import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon, BadgeCheckIcon, CheckIcon, MegaphoneIcon, UsersRoundIcon } from 'lucide-react';
import type { AllyRole } from '../event/SponsorRegistrationSection';
import { EASE_EMPHASIS } from '../../utils/motion';

const target = '/eventos/hormobiota/hormobiota-2-2027/registro';

/** Modalidades de alianza institucional abiertas a postulación. Los planes
 * comerciales (Pop Up/Conexión/Protagonista) ya cubren "quiero patrocinar
 * como marca" — estas son las que no son un paquete comercial. */
const tiers = [{
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
  role: 'media-partner',
  label: 'Medio especializado',
  icon: MegaphoneIcon,
  pitch: 'Cubre el congreso, accede a los ponentes y distribuye el contenido a tu audiencia profesional.',
  gives: ['Acreditación de prensa', 'Entrevistas con ponentes', 'Material audiovisual del evento'],
  tone: 'var(--tone-inflamacion)'
}] as const;

const steps = [{
  title: 'Postulación',
  text: 'Envías un formulario corto con el perfil de tu organización.'
}, {
  title: 'Conversación',
  text: 'Agendamos una llamada para entender el encaje académico y comercial.'
}, {
  title: 'Propuesta',
  text: 'Recibes una propuesta formal con alcance, entregables y valores.'
}, {
  title: 'Publicación',
  text: 'Firmado el acuerdo, tu marca entra al sitio y a tu Portal de empresas.'
}];

/**
 * Información para futuros aliados institucionales. El CTA abre el mismo
 * popup de registro que los planes comerciales, ya con este tipo de alianza
 * preseleccionado — no hay un formulario aparte aquí.
 */
export function AllyApplication() {
  const [role, setRole] = useState<AllyRole>('sociedad-medica');
  const navigate = useNavigate();
  const selected = tiers.find((tier) => tier.role === role) ?? tiers[0];
  return <section className="tint-blue" aria-labelledby="ser-aliado">
      <div className="mx-auto max-w-shell px-6 py-16 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            Ser aliado
          </p>
          <h2 id="ser-aliado" className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.05] tracking-tight text-brand">
            Sumar tu institución al proyecto
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
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
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
                    {isActive ? 'Seleccionado' : 'Ver este rol'}
                  </span>
                </button>
              </motion.li>;
        })}
        </ul>

        {/* Qué recibe + cómo avanza */}
        <div className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]" style={{
        ['--accent-rgb' as string]: selected.tone
      }}>
          <div>
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
          </div>

          <div className="rounded-3xl border border-line bg-white p-7 shadow-elev3 lg:p-9">
            <h3 className="text-xl font-bold tracking-tight text-brand">Cómo avanza</h3>
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

            <button type="button" onClick={() => navigate(`${target}?tipo=${role}#registro`)} className="group mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-elev2 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
              Postularme como {selected.label.toLowerCase()}
              <ArrowRightIcon size={15} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </section>;
}
