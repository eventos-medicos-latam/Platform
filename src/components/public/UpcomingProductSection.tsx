import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2Icon, FlaskConicalIcon } from 'lucide-react';
import { launchStageLabels, launchStages, upcomingProduct } from '../../data/products';
import { TrackIcon } from '../ui/TrackIcon';
import { Pending } from '../ui/Pending';
import { ParallaxLayer } from '../motion/ScrollScene';
import { media } from '../../data/media';
import { EASE_EMPHASIS } from '../../utils/motion';

/**
 * Producto en desarrollo. Se comunica como próximamente con etapa visible y
 * lista de pioneros: nada de composición ni claim clínico mientras el respaldo
 * y el registro sanitario no estén cerrados.
 */
export function UpcomingProductSection() {
  const product = upcomingProduct;
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    profile: 'profesional'
  });
  const stageIndex = launchStages.indexOf(product.stage);
  const fieldClass = 'w-full rounded-xl border border-white/15 bg-white/8 px-3.5 py-2.5 text-sm text-white placeholder:text-white/45 outline-none transition-colors duration-150 ease-emphasis focus:border-accent';
  return <section id="hormobiota-formula" className="surface-deep relative isolate overflow-hidden py-20 text-white lg:py-28">
      <ParallaxLayer speed={9} className="absolute inset-0 -z-10 -top-[15%] h-[130%]">
        <img src={media.microbiotaNetwork} alt="" aria-hidden="true" className="h-full w-full object-cover opacity-45" />
      </ParallaxLayer>
      <div className="absolute inset-0 -z-10" aria-hidden="true" style={{
      background: 'linear-gradient(120deg, rgba(6,17,33,0.97) 0%, rgba(6,17,33,0.9) 48%, rgba(6,17,33,0.7) 100%)'
    }} />
      <div className="grid-texture absolute inset-0 -z-10" aria-hidden="true" />

      <div className="relative mx-auto max-w-shell px-6">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true,
          margin: '-80px'
        }} transition={{
          duration: 0.3,
          ease: EASE_EMPHASIS
        }}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-elev2">
                <FlaskConicalIcon size={13} /> Próximamente
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
                {product.category}
              </span>
            </div>

            <h2 className="mt-6 max-w-2xl text-[clamp(2rem,4.4vw,3.4rem)] font-bold leading-[1.03] tracking-tight">
              {product.name}
              <span className="block font-normal text-white/55">{product.claim}</span>
            </h2>

            <div className="mt-6 max-w-xl space-y-4 text-base leading-relaxed text-white/70">
              {product.description.map((paragraph) => <p key={paragraph.slice(0, 20)}>{paragraph}</p>)}
            </div>

            {/* Pilares */}
            <ul className="mt-9 grid gap-4 sm:grid-cols-3">
              {product.pillars.map((pillar, index) => <motion.li key={pillar.id} initial={{
              opacity: 0,
              y: 16
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true,
              margin: '-60px'
            }} transition={{
              duration: 0.28,
              ease: EASE_EMPHASIS,
              delay: index * 0.06
            }} className="glass-panel rounded-2xl p-5">
                  <TrackIcon icon={pillar.icon} size={26} className="text-accent" />
                  <p className="mt-4 text-sm font-semibold text-white">{pillar.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                    {pillar.description}
                  </p>
                </motion.li>)}
            </ul>

            {/* Etapa de desarrollo */}
            <div className="mt-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                Etapa de desarrollo
              </p>
              <ol className="mt-4 grid gap-2 sm:grid-cols-4">
                {launchStages.map((stage, index) => {
                const done = index <= stageIndex;
                return <li key={stage}>
                      <div className={`h-1 rounded-full ${done ? 'bg-accent' : 'bg-white/15'}`} aria-hidden="true" />
                      <p className={`mt-2 text-xs font-medium ${index === stageIndex ? 'text-accent' : done ? 'text-white/70' : 'text-white/40'}`}>
                        {launchStageLabels[stage]}
                      </p>
                    </li>;
              })}
              </ol>
              <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/60">
                Lanzamiento estimado:{' '}
                {product.launchWindow === 'PENDIENTE' ? <Pending surface="dark" /> : <span className="font-semibold text-white">{product.launchWindow}</span>}
              </p>
            </div>
          </motion.div>

          {/* Ficha de pioneros */}
          <motion.div initial={{
          opacity: 0,
          y: 24
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true,
          margin: '-80px'
        }} transition={{
          duration: 0.3,
          ease: EASE_EMPHASIS,
          delay: 0.06
        }} className="glass-panel rounded-3xl p-7 lg:sticky lg:top-28 lg:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              Lista de pioneros
            </p>
            <h3 className="mt-3 text-2xl font-bold leading-snug tracking-tight">
              Sé el primero en conocerlo
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Te avisamos antes que a nadie cuando la formulación esté cerrada, con acceso prioritario a
              la primera producción y al material científico que la respalda.
            </p>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-white">{product.pioneers}</span>
              <span className="text-sm text-white/55">profesionales ya en la lista</span>
            </div>

            {sent ? <div className="mt-6 rounded-2xl bg-white/10 p-5">
                <CheckCircle2Icon size={24} className="text-accent" />
                <p className="mt-3 text-sm font-semibold text-white">Estás en la lista</p>
                <p className="mt-1 text-sm text-white/60">
                  Te escribimos en cuanto haya novedades del desarrollo.
                </p>
              </div> : <form className="mt-6" onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}>
                <div className="grid gap-3">
                  <input required className={fieldClass} placeholder="Nombre completo" value={form.name} onChange={(event) => setForm({
                ...form,
                name: event.target.value
              })} />
                  <input required type="email" className={fieldClass} placeholder="Correo" value={form.email} onChange={(event) => setForm({
                ...form,
                email: event.target.value
              })} />
                  <select className={`${fieldClass} [&>option]:text-ink`} value={form.profile} onChange={(event) => setForm({
                ...form,
                profile: event.target.value
              })} aria-label="Perfil">
                    <option value="profesional">Soy profesional de la salud</option>
                    <option value="paciente">Interés personal</option>
                    <option value="distribuidor">Interés comercial o distribución</option>
                  </select>
                </div>
                <button type="submit" className="mt-4 w-full rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-elev3 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                  Quiero ser pionero
                </button>
                <p className="mt-3 text-xs text-white/45">
                  Registro informativo. No constituye preventa ni compromiso de compra.
                </p>
              </form>}
          </motion.div>
        </div>
      </div>
    </section>;
}