import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageTransition } from '../../components/motion/PageTransition';
import { ScrollScene, ParallaxLayer } from '../../components/motion/ScrollScene';
import { BrandIntro } from '../../components/public/BrandIntro';
import { HomeHero } from '../../components/public/HomeHero';
import { KineticBand } from '../../components/public/KineticBand';
import { PinnedBridges } from '../../components/public/PinnedBridges';
import { OrganizationSection } from '../../components/public/OrganizationSection';
import { HomeDigitalAgenda } from '../../components/public/HomeDigitalAgenda';
import { HormobiotaBand } from '../../components/public/HormobiotaBand';
import { LegacyOrbit } from '../../components/public/LegacyOrbit';
import { CommunitySignup } from '../../components/public/CommunitySignup';
import { AlliesCarousel } from '../../components/public/AlliesCarousel';
import { PlansSection } from '../../components/public/PlansSection';
import { StoreSection } from '../../components/public/StoreSection';
import { UpcomingProductSection } from '../../components/public/UpcomingProductSection';
import { ContentPreview } from '../../components/public/ContentPreview';
import { SponsorBanner } from '../../components/public/SponsorBanner';
import { media } from '../../data/media';
import { EASE_EMPHASIS } from '../../utils/motion';
export function Home() {
  return <PageTransition>
      <BrandIntro />
      <HomeHero />

      {/* Marcas que acompañan: cinta justo debajo del hero */}
      <SponsorBanner surface="corporativo" />

      {/* Momento protagonista: el recorrido anclado por los seis puentes */}
      <PinnedBridges />

      {/* Cinta cinética: costura entre el recorrido y la casa que lo organiza */}
      <KineticBand />

      <ScrollScene depth="medium">
        <OrganizationSection />
      </ScrollScene>

      {/* La trayectoria desemboca en el afiche de 2027; la banda de marca
         recoge ese relevo y lleva a la inscripción. */}
      <LegacyOrbit />

      <HormobiotaBand />

      <PlansSection />

      <AlliesCarousel />

      {/* Comunidad médica */}
      <section className="surface-deep relative isolate overflow-hidden py-20 text-white lg:py-28">
        <ParallaxLayer speed={10} className="absolute inset-0 -z-10 h-[130%] -top-[15%]">
          <img src={media.stage} alt="" className="h-full w-full object-cover" aria-hidden="true" />
        </ParallaxLayer>
        <div className="absolute inset-0 -z-10" aria-hidden="true" style={{
        background: 'linear-gradient(100deg, rgba(26,26,61,0.97) 0%, rgba(26,26,61,0.9) 45%, rgba(26,26,61,0.62) 100%)'
      }} />
        <div className="mx-auto max-w-shell px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-start">
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                Comunidad médica
              </p>
              <h2 className="mt-5 text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.05] tracking-tight">
                Recibe la agenda académica
                <span className="block font-normal text-white/55">antes que nadie</span>
              </h2>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-white/75">
                Newsletter, webinars, conversatorios y apertura de inscripciones. Un solo registro, con
                consentimiento explícito y revocable cuando quieras.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-white/70">
                {['Avisos de apertura de inscripciones y preventas', 'Contenido académico por área de interés', 'Invitaciones a webinars y masterclass'].map((item, index) => <motion.li key={item} initial={{
                opacity: 0,
                x: -12
              }} whileInView={{
                opacity: 1,
                x: 0
              }} viewport={{
                once: true,
                margin: '-60px'
              }} transition={{
                duration: 0.26,
                ease: EASE_EMPHASIS,
                delay: index * 0.05
              }} className="flex items-center gap-3 border-b border-white/10 pb-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                    {item}
                  </motion.li>)}
              </ul>
              <Link to="/legal" className="mt-7 inline-block text-sm font-semibold text-white underline decoration-white/30 underline-offset-4 transition-colors duration-150 ease-emphasis hover:decoration-white">
                Cómo tratamos tus datos
              </Link>
            </motion.div>

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
          }} className="rounded-3xl bg-white p-6 shadow-elev4 lg:p-8">
              <CommunitySignup />
            </motion.div>
          </div>
        </div>
      </section>

      <HomeDigitalAgenda />

      {/* CTA comercial */}
      <section className="relative isolate overflow-hidden bg-brand py-20 text-white">
        <ParallaxLayer speed={8} className="absolute inset-0 -z-10 h-[130%] -top-[15%]">
          <img src={media.networking} alt="" className="h-full w-full object-cover" aria-hidden="true" />
        </ParallaxLayer>
        <div className="absolute inset-0 -z-10" aria-hidden="true" style={{
        background: 'linear-gradient(90deg, rgba(10,33,64,0.97) 0%, rgba(10,33,64,0.86) 55%, rgba(10,33,64,0.55) 100%)'
      }} />
        <div className="mx-auto flex max-w-shell flex-col gap-8 px-6 md:flex-row md:items-center md:justify-between">
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
            <h2 className="text-[clamp(1.7rem,3.2vw,2.8rem)] font-bold leading-tight tracking-tight">
              ¿Quieres llevar tu marca
              <span className="block font-normal text-white/55">a nuestros eventos?</span>
            </h2>
            <p className="mt-4 max-w-xl text-white/75">
              Patrocinio, stands, activaciones y espacios académicos. Te enviamos la propuesta con
              disponibilidad real por edición.
            </p>
          </motion.div>
          <div className="flex flex-wrap gap-3">
            <Link to="/contacto?motivo=patrocinar" className="rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-brand-deep shadow-elev3 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
              Solicitar propuesta
            </Link>
            <Link to="/contacto" className="rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:border-white">
              Hablar con el equipo
            </Link>
          </div>
        </div>
      </section>

      <ScrollScene depth="soft">
        <ContentPreview />
      </ScrollScene>

      <StoreSection />

      <UpcomingProductSection />
    </PageTransition>;
}