import React from 'react';
import { PageTransition } from '../../components/motion/PageTransition';
import { AlliesCarousel } from '../../components/public/AlliesCarousel';
import { AllyApplication } from '../../components/public/AllyApplication';
import { PageHero } from '../../components/public/PageHero';
import { PlansSection } from '../../components/public/PlansSection';
import { media } from '../../data/media';
export function Allies() {
  return <PageTransition>
      <PageHero eyebrow="Aliados" title={[{
      text: 'No todos los logos',
      tone: 'bold'
    }, {
      text: 'significan lo mismo',
      tone: 'light'
    }]} lead="Diferenciamos el rol de cada institución: organizador, certificador, sociedad médica, aliado académico o institucional, media partner y patrocinador comercial. Nada se publica mientras el acuerdo esté en negociación." image={media.networking} />

      <AlliesCarousel onlyPublished={false} showLink={false} />

      <PlansSection planIds={['protagonista', 'conexion']} eyebrow="Marcas y empresas del sector" titleLight="Dos formas de acompañar" titleBold="la conversación científica" description="Las marcas que buscan stand, presencia digital y posicionamiento académico entran por el Paquete Protagonista o el Paquete Conexión. Toca un plan para ver todo lo que incluye y pasa al registro." />

      <AllyApplication />
    </PageTransition>;
}