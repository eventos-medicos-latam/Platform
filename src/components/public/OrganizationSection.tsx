import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRightIcon } from 'lucide-react';
import { organization } from '../../data/organization';
import { media } from '../../data/media';
import { EASE_EMPHASIS } from '../../utils/motion';

/** Bloque institucional con imagen a sangre y enfoque en tipografía grande. */
export function OrganizationSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const {
    scrollYProgress
  } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);
  const publicMetrics = organization.metrics.filter((metric) => metric.status !== 'borrador');
  return <section ref={ref} className="bg-white">
      <div className="mx-auto max-w-shell px-6 py-20 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <motion.div initial={{
          opacity: 0,
          y: 16
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-support">
              Sobre {organization.name}
            </p>
            <h2 className="mt-5 max-w-xl text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.05] tracking-tight text-brand">
              Una organización, muchos eventos que vuelven cada año
            </h2>
            <div className="mt-7 space-y-4 text-lg leading-relaxed text-ink">
              <p>{organization.description[0]}</p>
              <p>{organization.description[2]}</p>
            </div>

            <ul className="mt-9 space-y-px overflow-hidden rounded-2xl bg-line">
              {organization.focus.map((item, index) => <motion.li key={item} initial={{
              opacity: 0,
              x: -10
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true,
              margin: '-40px'
            }} transition={{
              duration: 0.24,
              ease: EASE_EMPHASIS,
              delay: index * 0.04
            }} className="flex items-baseline gap-4 bg-white px-5 py-4">
                  <span className="text-[11px] font-bold tabular-nums text-brand-support">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-base font-medium leading-snug text-brand">{item}</span>
                </motion.li>)}
            </ul>

            <Link to="/nosotros" className="group mt-9 inline-flex items-center gap-2 text-sm font-semibold text-brand">
              Conocer la organización
              <ArrowRightIcon size={16} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <div className="relative overflow-hidden rounded-2xl bg-brand-deep">
            <div className="relative h-[420px] overflow-hidden lg:h-[560px]">
              <motion.img src={media.networking} alt="Profesionales de la salud durante un congreso" className="absolute inset-0 h-[120%] w-full object-cover" style={reduce ? undefined : {
              y: imageY
            }} />
              <div className="absolute inset-0" aria-hidden="true" style={{
              background: 'linear-gradient(180deg, rgba(6,17,33,0.15) 0%, rgba(6,17,33,0.55) 55%, rgba(6,17,33,0.95) 100%)'
            }} />
              <dl className="absolute inset-x-6 bottom-6 grid grid-cols-2 gap-x-6 gap-y-5">
                {publicMetrics.slice(0, 4).map((metric) => <div key={metric.id}>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
                      {metric.label}
                    </dt>
                    <dd className="mt-1 text-lg font-semibold leading-tight text-white">
                      {metric.value}
                    </dd>
                  </div>)}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>;
}