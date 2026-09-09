import React from 'react';
import { PageTransition } from '../../components/motion/PageTransition';
import { AlliesCarousel } from '../../components/public/AlliesCarousel';
import { AllyApplication } from '../../components/public/AllyApplication';
import { AllyPlansSection } from '../../components/public/AllyPlansSection';
import { PageHero } from '../../components/public/PageHero';
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

      <AllyPlansSection />

      <AllyApplication />
    </PageTransition>;
}