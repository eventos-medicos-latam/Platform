import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { NovoEventSubnav, type NovoEventNavItem } from '../../components/public/NovoEventSubnav';
import { editionStatusMeta, type BadgeTone } from '../../components/ui/StatusBadge';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  AwardIcon, CalendarDaysIcon, CheckIcon, MapPinIcon, MicIcon, RouteIcon, TicketIcon, UsersIcon,
} from 'lucide-react';
import { PageTransition } from '../../components/motion/PageTransition';
import { Reveal, RevealItem } from '../../components/motion/Reveal';
import { BridgesJourney } from '../../components/event/BridgesJourney';
import { FlipCountdown } from '../../components/event/FlipCountdown';
import { DisplayTitle } from '../../components/ui/DisplayTitle';
import { getEditionByNovoSlug, getFamily } from '../../data/editions';
import { faqsByEdition } from '../../data/faq';
import { editionMedia, media } from '../../data/media';
import {
  eventAccentRgb, formatCurrency, getEventBySlug, getPublicEventWeb, publicDateLabel,
  publicVenueLabel, webExtraOn, webSectionOn, type PublicEventWeb,
} from '../../lib/novo/events';
import { listAgenda, type AgendaItemRow } from '../../lib/novo/agenda';
import { listPublicTickets, type EventTicketRow } from '../../lib/novo/tickets';
import { listPublicEventSpeakers, type PublicEventSpeaker } from '../../lib/novo/speakers';
import { listPublicSponsors, type EventSponsorRow } from '../../lib/novo/sponsors';
import { axisFromContent, pickList, pickText } from '../../lib/novo/webContent';
import { cascadeChild, cascadeParent, EASE_EMPHASIS } from '../../utils/motion';
import type { NovoEvent } from '../../types/novo';
import type { EditionSection } from '../../types/event';

const MODALITY: Record<NovoEvent['modality'], string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
  hibrido: 'Híbrido',
};

const EDITION_SALES_OPEN = ['preventa', 'venta-activa'];
const NOVO_SALES_OPEN: NovoEvent['operational_status'][] = ['proximo', 'activo'];

function novoStatusMeta(status: NovoEvent['operational_status']): { label: string; tone: BadgeTone } {
  if (status === 'activo') return editionStatusMeta['en-curso'];
  if (status === 'finalizado') return editionStatusMeta.historico;
  if (status === 'cancelado') return { label: 'Cancelado', tone: 'danger' };
  return editionStatusMeta.proximamente;
}

export function NovoPublicEvent() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<NovoEvent | null>(null);
  const [web, setWeb] = useState<PublicEventWeb | null>(null);
  const [missing, setMissing] = useState(false);
  const [agenda, setAgenda] = useState<AgendaItemRow[]>([]);
  const [tickets, setTickets] = useState<EventTicketRow[]>([]);
  const [speakers, setSpeakers] = useState<PublicEventSpeaker[]>([]);
  const [sponsors, setSponsors] = useState<EventSponsorRow[]>([]);

  useEffect(() => {
    if (!slug) return;
    getEventBySlug(slug)
      .then((found) => {
        if (!found) {
          setMissing(true);
          return;
        }
        setEvent(found);
        Promise.all([
          listAgenda(found.id).catch(() => []),
          listPublicTickets(found.id).catch(() => []),
          listPublicEventSpeakers(found.id).catch(() => []),
          listPublicSponsors(found.id).catch(() => []),
          getPublicEventWeb(found.id),
        ]).then(([nextAgenda, nextTickets, nextSpeakers, nextSponsors, nextWeb]) => {
          setAgenda(nextAgenda);
          setTickets(nextTickets);
          setSpeakers(nextSpeakers);
          setSponsors(nextSponsors);
          setWeb(nextWeb);
        });
      })
      .catch(() => setMissing(true));
  }, [slug]);

  if (missing) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-shell px-6 py-24 text-center">
          <p className="text-lg font-bold text-brand">Evento no disponible</p>
          <p className="mt-2 text-sm text-ink-muted">Puede estar en borrador o el enlace es incorrecto.</p>
          <Link to="/eventos" className="mt-6 inline-block text-sm font-semibold text-brand">Ver todos los eventos</Link>
        </div>
      </PageTransition>
    );
  }

  if (!event) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-shell px-6 py-24 text-center text-sm text-ink-muted">Cargando evento…</div>
      </PageTransition>
    );
  }

  return (
    <NovoEventHome
      event={event}
      web={web}
      agenda={agenda}
      tickets={tickets}
      speakers={speakers}
      sponsors={sponsors}
    />
  );
}

function NovoEventHome({
  event, web, agenda, tickets, speakers, sponsors,
}: {
  event: NovoEvent;
  web: PublicEventWeb | null;
  agenda: AgendaItemRow[];
  tickets: EventTicketRow[];
  speakers: PublicEventSpeaker[];
  sponsors: EventSponsorRow[];
}) {
  const edition = getEditionByNovoSlug(event.slug);
  const family = edition ? getFamily(edition.familyId) : undefined;
  const copy = web?.content ?? {};
  const registerTo = `/e/${event.slug}/inscripcion`;
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const conceptRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroImageY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const heroImageScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.16]);
  const heroContentY = useTransform(scrollYProgress, [0, 1], ['0%', '-12%']);
  const heroFade = useTransform(scrollYProgress, [0, 0.9], [1, 0]);
  const { scrollYProgress: conceptProgress } = useScroll({
    target: conceptRef,
    offset: ['start end', 'center center'],
  });
  const conceptRotate = useTransform(conceptProgress, [0, 1], [7, 0]);
  const conceptY = useTransform(conceptProgress, [0, 1], [52, 0]);

  const heroImage = pickText(copy.hero_image, event.cover_image_url, edition ? editionMedia[edition.id] : undefined);
  const heroTitle = pickText(copy.hero_title, event.name);
  const heroSubtitle = pickText(copy.hero_subtitle, edition?.claim, event.tagline);
  const heroKicker = pickText(copy.hero_kicker, edition?.heroKicker, event.event_type);
  const heroLogo = pickText(copy.hero_logo, family?.logoDark, event.logo_url);
  const dateLabel = publicDateLabel(event.start_date, event.end_date);
  const venueLabel = publicVenueLabel(event);
  const accentRgb = edition?.accentRgb || eventAccentRgb(event);
  const conceptKicker = pickText(copy.concepto_title, `De qué se trata ${event.name}`);
  const conceptLead = pickText(copy.concepto_lead, edition?.conceptLead, 'De qué se trata');
  const conceptParas = pickText(copy.concepto_body)
    ? copy.concepto_body!.split('\n').map((p) => p.trim()).filter(Boolean)
    : edition?.concept ?? (event.description ? [event.description] : []);
  const conceptImage = pickText(copy.concepto_image, edition?.conceptImage) || media.doctorPortrait;
  const conceptCaption = pickText(copy.concepto_caption, edition?.conceptImageCaption);
  const audienceTitle = pickText(copy.publico_title, '¿Para quién es?');
  const audience = pickList(copy.publico_items, edition?.audience);
  const benefitsTitle = pickText(copy.beneficios_title, 'Qué incluye');
  const benefits = pickList(copy.beneficios_items, edition?.benefits);
  const faqItems = (copy.faq_items ?? []).filter((item) => {
    const q = item.q.trim();
    if (!q) return false;
    return !( /aforo/i.test(q) && /consultar|asistentes/i.test(item.a) );
  });
  const faqs = faqItems.length
    ? faqItems
    : (edition ? faqsByEdition(edition.id).map((item) => ({ q: item.question, a: item.answer })) : []);
  const axis = axisFromContent(copy, edition?.trackAxis);
  const tracks = axis?.tracks ?? [];
  const experienceName = pickText(copy.experiencia_name, edition?.preExperience?.name);
  const experienceDuration = pickText(copy.experiencia_duration, edition?.preExperience?.durationLabel);
  const experienceBody = pickText(copy.experiencia_body, edition?.preExperience?.description);
  const experienceChannels = pickList(copy.experiencia_channels, edition?.preExperience?.channels);
  const certBody = pickText(copy.certificacion_body, edition?.certification);
  const gallery = (copy.galeria_images ?? []).map((url) => url.trim()).filter(Boolean);
  const allies = (copy.aliados_items ?? []).filter((item) => item.name.trim() || (item.logo_url ?? '').trim());
  const stats = (copy.resultados_items ?? []).filter((item) => item.label.trim() || item.value.trim());
  const legacyWeb = !('publico_items' in copy);
  const extraOn = (id: string, fallback: boolean) => {
    if (legacyWeb && web?.extra[id] === false) return fallback;
    return webExtraOn(web, id, fallback);
  };
  const showHero = webSectionOn(web, 'hero');
  const showAbout = webSectionOn(web, 'info') && conceptParas.length > 0;
  const showEjes = extraOn('ejes', tracks.length > 0) && tracks.length > 0;
  const showPublico = extraOn('publico', audience.length > 0) && audience.length > 0;
  const showBeneficios = extraOn('beneficios', benefits.length > 0) && benefits.length > 0;
  const showExperience = extraOn('experiencia', Boolean(experienceName)) && Boolean(experienceName);
  const showTickets = webSectionOn(web, 'tickets') && tickets.length > 0;
  const showAgenda = webSectionOn(web, 'agenda') && agenda.length > 0;
  const showSpeakers = webSectionOn(web, 'speakers') && speakers.length > 0;
  const showAllies = extraOn('aliados', allies.length > 0) && allies.length > 0;
  const showSponsors = webSectionOn(web, 'sponsors') && sponsors.length > 0;
  const standsTitle = pickText(copy.stands_title);
  const standsBody = pickText(copy.stands_body);
  const showStands = webSectionOn(web, 'stands') && Boolean(standsTitle || standsBody);
  const showLocation = webSectionOn(web, 'location') && Boolean(venueLabel);
  const showFaq = (webSectionOn(web, 'faq') || (legacyWeb && faqs.length > 0)) && faqs.length > 0;
  const showGallery = webSectionOn(web, 'gallery') && gallery.length > 0;
  const showCertificate = extraOn('certificacion', Boolean(certBody) || event.has_certificate)
    && (Boolean(certBody) || event.has_certificate);
  const showResults = extraOn('resultados', stats.length > 0) && stats.length > 0;
  const showCta = webSectionOn(web, 'cta');
  const heroCtaLabel = pickText(copy.hero_cta_label, 'Quiero inscribirme');
  const heroCtaUrl = pickText(copy.hero_cta_url) || (tickets.length > 0 ? registerTo : '');
  const ctaTitle = pickText(copy.cta_title, `Nos vemos en ${event.venue_city || 'Medellín'}`);
  const ctaBody = pickText(copy.cta_body, dateLabel);
  const ctaLabel = pickText(copy.cta_label, 'Inscribirme');
  const ctaUrl = pickText(copy.cta_url) || registerTo;
  const year = edition?.year ?? Number(event.start_date.slice(0, 4));
  const status = edition ? editionStatusMeta[edition.status] : novoStatusMeta(event.operational_status);
  const canRegister = edition
    ? EDITION_SALES_OPEN.includes(edition.status) && tickets.length > 0
    : NOVO_SALES_OPEN.includes(event.operational_status) && tickets.length > 0;
  const editionHas = (section: EditionSection) => Boolean(edition?.sections.includes(section));
  const navAgenda = showAgenda || showSpeakers || showTickets || showLocation
    || editionHas('agenda') || editionHas('speakers') || editionHas('tickets') || editionHas('ubicacion');
  const navAllies = showAllies || showSponsors || editionHas('aliados') || editionHas('patrocinadores');
  const navFaq = showFaq || editionHas('faq');
  const showNavCta = webSectionOn(web, 'tickets') || tickets.length > 0 || editionHas('tickets');
  const navCtaLabel = canRegister ? 'Inscribirme' : 'Recibir información';
  const agendaHref = showAgenda ? '#agenda' : showSpeakers ? '#speakers' : showTickets ? '#entradas' : showLocation ? '#ubicacion' : '#inicio';
  const alliesHref = showAllies ? '#aliados' : showSponsors ? '#patrocinadores' : '#aliados';
  const subNav: NovoEventNavItem[] = [
    { href: '#inicio', label: 'Inicio' },
    ...(navAgenda ? [{ href: agendaHref, label: 'Agenda' }] : []),
    ...(navAllies ? [{ href: alliesHref, label: 'Aliados' }] : []),
    ...(navFaq ? [{ href: '#faq', label: 'Preguntas y respuestas' }] : []),
  ];

  return (
    <PageTransition>
      <div style={{ ['--accent-rgb' as string]: accentRgb }}>
        <NovoEventSubnav
          familyName={family?.name}
          familySlug={family?.slug}
          familyLogo={family?.logoLight}
          eventName={event.name}
          year={year}
          statusLabel={status.label}
          statusTone={status.tone}
          items={subNav}
          ctaLabel={showNavCta ? navCtaLabel : undefined}
          ctaTo={showNavCta ? registerTo : undefined}
        />
        {showHero ? (
          <section id="inicio" ref={heroRef} className="surface-deep relative isolate overflow-hidden text-white scroll-mt-28">
            <motion.div className="absolute inset-0 -z-10" style={reduce ? undefined : { y: heroImageY, scale: heroImageScale }}>
              {heroImage ? (
                <img src={heroImage} alt="" aria-hidden="true" className="h-full w-full object-cover opacity-50" />
              ) : null}
            </motion.div>
            <div className="absolute inset-0 -z-10" aria-hidden="true" style={{
              background: 'linear-gradient(180deg, rgba(26,26,61,0.9) 0%, rgba(26,26,61,0.7) 45%, rgba(26,26,61,0.98) 100%)',
            }} />

            <motion.div
              className="mx-auto flex max-w-shell flex-col gap-14 px-6 py-20 lg:flex-row lg:items-center lg:gap-16 lg:py-28"
              style={reduce ? undefined : { y: heroContentY, opacity: heroFade }}
            >
              <motion.div className="min-w-0 flex-1" variants={cascadeParent()} initial="initial" animate="enter">
                {heroLogo ? (
                  <motion.img variants={cascadeChild} src={heroLogo} alt={family?.name || event.name} className="h-28 w-auto sm:h-40" draggable={false} />
                ) : null}

                <motion.p variants={cascadeChild} className="mt-8 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-hb-violet">
                  <span className="h-px w-9 bg-hb-violet" aria-hidden="true" />
                  {heroKicker}
                </motion.p>

                <DisplayTitle as="h1" size="xl" surface="dark" animate={false} className="mt-5 max-w-4xl" parts={[{ text: heroTitle, tone: 'bold' }]} />

                {heroSubtitle ? (
                  <motion.p variants={cascadeChild} className="mt-5 max-w-2xl text-xl font-medium leading-snug text-white/80 lg:text-2xl">
                    {heroSubtitle}
                  </motion.p>
                ) : null}

                <motion.dl variants={cascadeChild} className="mt-10 grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: CalendarDaysIcon, label: 'Fecha', value: dateLabel },
                    { icon: MapPinIcon, label: 'Lugar', value: venueLabel },
                    { icon: UsersIcon, label: 'Modalidad', value: MODALITY[event.modality] },
                  ].map((fact) => (
                    <motion.div key={fact.label} whileHover={reduce ? undefined : { y: -4 }}
                      transition={{ duration: 0.2, ease: EASE_EMPHASIS }}
                      className="glass-panel rounded-2xl p-4">
                      <fact.icon size={17} className="text-hb-violet" />
                      <dt className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">{fact.label}</dt>
                      <dd className="mt-1 text-sm font-medium capitalize">{fact.value}</dd>
                    </motion.div>
                  ))}
                </motion.dl>

                <motion.div variants={cascadeChild} className="mt-10 flex flex-wrap items-center gap-4">
                  {heroCtaUrl ? (
                    heroCtaUrl.startsWith('/') ? (
                      <Link to={heroCtaUrl} className="grad-futuro rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-elev3 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                        {heroCtaLabel}
                      </Link>
                    ) : (
                      <a href={heroCtaUrl} className="grad-futuro rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-elev3">
                        {heroCtaLabel}
                      </a>
                    )
                  ) : null}
                  {showAgenda ? (
                    <a href="#agenda" className="rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:border-white">
                      Ver la agenda
                    </a>
                  ) : showTickets ? (
                    <a href="#entradas" className="rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:border-white">
                      Ver entradas
                    </a>
                  ) : null}
                </motion.div>
              </motion.div>

              <motion.div className="flex shrink-0 justify-center lg:justify-end"
                initial={{ opacity: 0, scale: 0.96, rotateY: -10 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 0.3, ease: EASE_EMPHASIS, delay: 0.18 }}
                style={{ perspective: 1200 }}>
                <div className="glass-panel rounded-3xl p-6 shadow-elev4 sm:p-7">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-hb-violet">Cuenta regresiva</p>
                  <FlipCountdown targetDate={event.start_date.slice(0, 10)} size="lg" className="mt-5" />
                  <div className="mt-6 border-t border-white/12 pt-4">
                    <p className="text-sm font-semibold text-white">{dateLabel}</p>
                    <p className="mt-0.5 text-xs text-white/75">{venueLabel}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </section>
        ) : null}

        {showAbout ? (
          <section className="tint-aurora py-20 lg:py-28">
            <div ref={conceptRef} className="mx-auto max-w-shell px-6 [perspective:1400px]">
              <motion.div style={reduce ? undefined : { rotateX: conceptRotate, y: conceptY }}
                className="overflow-hidden rounded-[2rem] border border-white bg-white/90 shadow-elev4 backdrop-blur">
                <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
                  <div className="relative isolate min-h-[280px] overflow-hidden lg:min-h-full">
                    <img src={conceptImage} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-top" />
                    <div className="absolute inset-0" aria-hidden="true" style={{
                      background: 'linear-gradient(160deg, rgba(26,26,61,0.72) 0%, rgba(26,26,61,0.25) 45%, rgba(214,51,132,0.28) 100%)',
                    }} />
                    <div className="relative flex h-full flex-col justify-between p-8">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white">Concepto</p>
                      {conceptCaption ? (
                        <p className="max-w-xs text-lg font-semibold leading-snug text-white drop-shadow">{conceptCaption}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="p-8 sm:p-12">
                    <div className="flex items-center gap-3">
                      <span className="grad-futuro h-5 w-1 rounded-full" aria-hidden="true" />
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
                        {conceptKicker}
                      </p>
                    </div>
                    <DisplayTitle as="h2" size="lg" className="mt-4" parts={[{ text: conceptLead, tone: 'bold' }]} />
                    <div className="mt-6 space-y-4 text-base leading-relaxed text-ink lg:text-lg">
                      {conceptParas.map((paragraph) => <p key={paragraph.slice(0, 40)}>{paragraph}</p>)}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        ) : null}

        {showEjes && axis ? (
          <section className="surface-deep relative isolate overflow-hidden py-20 text-white lg:py-28">
            <div className="relative mx-auto max-w-shell px-6">
              <Reveal>
                <RevealItem>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-hb-violet">
                    {pickText(copy.ejes_kicker, 'Programa académico')}
                  </p>
                  <DisplayTitle size="lg" surface="dark" className="mt-4 max-w-2xl" parts={[
                    { text: axis.pluralLabel, tone: 'bold' },
                    { text: pickText(copy.ejes_subtitle, 'un recorrido, no una lista'), tone: 'light' },
                  ]} />
                </RevealItem>
                <RevealItem>
                  <div className="mt-10">
                    <BridgesJourney axis={axis} />
                  </div>
                </RevealItem>
              </Reveal>
            </div>
          </section>
        ) : null}

        {showPublico || showBeneficios ? (
          <section className="tint-aurora py-20 lg:py-28">
            <div className="mx-auto max-w-shell px-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {showPublico ? (
                  <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-70px' }} transition={{ duration: 0.3, ease: EASE_EMPHASIS }}
                    className="rounded-3xl border border-white bg-white/85 p-8 shadow-elev3 backdrop-blur sm:p-10">
                    <DisplayTitle size="md" parts={[{ text: audienceTitle, tone: 'bold' }]} />
                    <ul className="mt-7 space-y-3">
                      {audience.map((item, index) => (
                        <motion.li key={item} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.24, ease: EASE_EMPHASIS, delay: Math.min(index, 6) * 0.05 }}
                          className="flex gap-3 rounded-xl px-3 py-2 text-base text-ink">
                          <CheckIcon size={18} className="mt-0.5 shrink-0 text-accent" />
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                ) : null}
                {showBeneficios ? (
                  <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-70px' }}
                    transition={{ duration: 0.3, ease: EASE_EMPHASIS, delay: 0.06 }}
                    className="rounded-3xl border border-white bg-white/85 p-8 shadow-elev3 backdrop-blur sm:p-10">
                    <DisplayTitle size="md" parts={[{ text: benefitsTitle, tone: 'bold' }]} />
                    <ul className="mt-7 grid gap-2.5">
                      {benefits.map((item, index) => (
                        <motion.li key={item} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.24, ease: EASE_EMPHASIS, delay: Math.min(index, 6) * 0.05 }}
                          className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 text-sm font-medium text-brand shadow-elev1">
                          <span className="grad-futuro h-8 w-1 shrink-0 rounded-full" aria-hidden="true" />
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {showExperience ? (
          <section className="tint-aurora border-t border-white/60 py-20 lg:py-24">
            <div className="mx-auto max-w-shell px-6">
              <div className="surface-deep relative isolate overflow-hidden rounded-3xl p-8 text-white shadow-elev4 lg:p-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-hb-violet">
                  <RouteIcon size={14} /> Experiencia previa
                </span>
                <h2 className="mt-5 text-2xl font-bold tracking-tight lg:text-3xl">{experienceName}</h2>
                {experienceDuration ? <p className="mt-1.5 text-sm font-medium text-white/75">{experienceDuration}</p> : null}
                {experienceBody ? <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90">{experienceBody}</p> : null}
                {experienceChannels.length > 0 ? (
                  <ul className="mt-7 flex flex-wrap gap-2">
                    {experienceChannels.map((channel) => (
                      <li key={channel} className="rounded-full border border-white/25 px-3 py-1 text-xs font-medium text-white/80">{channel}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {showTickets ? (
          <section id="entradas" className="tint-aurora border-t border-white/60 py-20 lg:py-24 scroll-mt-28">
            <div className="mx-auto max-w-shell px-6">
              <Reveal>
                <RevealItem>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent mb-3">Inscripción</p>
                  <DisplayTitle size="lg" parts={[{ text: 'Elige', tone: 'bold' }, { text: 'tu entrada', tone: 'light' }]} />
                </RevealItem>
                <RevealItem>
                  <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {tickets.map((ticket) => {
                      const soldOut = ticket.capacity != null && ticket.sold >= ticket.capacity;
                      return (
                        <article key={ticket.id} className="rounded-3xl border border-white bg-white/90 p-6 shadow-elev3 backdrop-blur">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-bold text-brand">{ticket.name}</p>
                              <p className="mt-1 text-sm text-ink-muted">{ticket.description || 'Acceso al evento'}</p>
                            </div>
                            <TicketIcon size={18} className="text-accent" />
                          </div>
                          <p className="mt-5 text-2xl font-bold tabular-nums text-brand">
                            {ticket.current_price > 0 ? formatCurrency(ticket.current_price) : 'Gratis'}
                          </p>
                          {ticket.benefits.length > 0 ? (
                            <ul className="mt-4 space-y-2 text-sm text-ink">
                              {ticket.benefits.map((item) => (
                                <li key={item} className="flex gap-2">
                                  <CheckIcon size={16} className="mt-0.5 shrink-0 text-accent" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          <Link
                            to={soldOut ? '#' : `${registerTo}?ticket=${ticket.id}`}
                            className={`mt-6 inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-semibold ${soldOut ? 'pointer-events-none bg-line text-ink-muted' : 'grad-futuro text-white shadow-elev3'}`}
                          >
                            {soldOut ? 'Agotado' : 'Inscribirme'}
                          </Link>
                        </article>
                      );
                    })}
                  </div>
                </RevealItem>
              </Reveal>
            </div>
          </section>
        ) : null}

        {showAgenda ? (
          <section id="agenda" className="surface-deep py-20 text-white lg:py-24 scroll-mt-28">
            <div className="mx-auto max-w-shell px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-hb-violet mb-3">Programa</p>
              <DisplayTitle size="lg" surface="dark" parts={[{ text: 'Agenda', tone: 'bold' }]} />
              <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                {agenda.map((item, i) => (
                  <div key={item.id} className="flex gap-4 px-5 py-4"
                    style={{ borderBottom: i < agenda.length - 1 ? '1px solid rgba(255,255,255,.08)' : 'none' }}>
                    <div className="w-16 shrink-0">
                      <p className="text-xs font-bold tabular-nums text-hb-violet">{item.start_time}</p>
                      <p className="text-[10px] text-white/45">{item.end_time}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-white/55">
                        {item.speaker_names.join(' · ')}
                        {item.space_name ? ` · ${item.space_name}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {showSpeakers ? (
          <section id="speakers" className="tint-aurora py-20 lg:py-24 scroll-mt-28">
            <div className="mx-auto max-w-shell px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent mb-3">Ponentes</p>
              <DisplayTitle size="lg" parts={[{ text: 'Quiénes', tone: 'bold' }, { text: 'comparten', tone: 'light' }]} />
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {speakers.map((speaker) => (
                  <article key={speaker.id} className="rounded-2xl border border-white bg-white/85 p-6 shadow-elev2 backdrop-blur">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft text-brand">
                      {speaker.photo_url
                        ? <img src={speaker.photo_url} alt="" className="h-full w-full object-cover" />
                        : <MicIcon size={22} />}
                    </div>
                    <p className="font-bold text-brand leading-tight">{speaker.name}</p>
                    <p className="mt-1 text-xs text-ink-muted">{speaker.specialty || speaker.title}</p>
                    {speaker.bio ? <p className="mt-3 text-xs leading-relaxed text-ink border-t border-line pt-3">{speaker.bio}</p> : null}
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {showAllies ? (
          <section id="aliados" className="tint-aurora py-16 scroll-mt-28">
            <div className="mx-auto max-w-shell px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent mb-3">
                {pickText(copy.aliados_title, 'Nos apoyan')}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-6">
                {allies.map((ally) => (
                  <div key={ally.name || ally.logo_url} className="flex items-center gap-3">
                    {ally.logo_url ? <img src={ally.logo_url} alt={ally.name} className="h-10 w-auto object-contain" /> : null}
                    {ally.name ? <p className="text-sm font-semibold text-brand">{ally.name}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {showSponsors ? (
          <section id="patrocinadores" className="tint-aurora py-16 scroll-mt-28">
            <div className="mx-auto max-w-shell px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent mb-3">
                {pickText(copy.patrocinadores_title, 'Patrocinadores')}
              </p>
              {copy.patrocinadores_body ? (
                <p className="max-w-2xl text-sm leading-relaxed text-ink">{copy.patrocinadores_body}</p>
              ) : null}
              <div className="mt-6 flex flex-wrap items-center gap-6">
                {sponsors.map((sponsor) => (
                  <div key={sponsor.id} className="flex items-center gap-3">
                    {sponsor.logo ? (
                      <img src={sponsor.logo} alt={sponsor.company_name} className="h-10 w-auto object-contain" />
                    ) : null}
                    <p className="text-sm font-semibold text-brand">{sponsor.company_name}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {navAllies && !showAllies && !showSponsors ? (
          <section id="aliados" className="tint-aurora py-16 scroll-mt-28">
            <div className="mx-auto max-w-shell px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent mb-3">
                {pickText(copy.aliados_title, copy.patrocinadores_title, 'Aliados')}
              </p>
              <p className="max-w-2xl text-sm leading-relaxed text-ink">
                {pickText(copy.patrocinadores_body, 'Los aliados y patrocinadores de esta edición se publicarán aquí.')}
              </p>
            </div>
          </section>
        ) : null}

        {showStands ? (
          <section className="tint-aurora py-16">
            <div className="mx-auto max-w-shell px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent mb-3">Exposición</p>
              <DisplayTitle size="lg" parts={[{ text: standsTitle || 'Área de stands', tone: 'bold' }]} />
              {standsBody ? <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink">{standsBody}</p> : null}
            </div>
          </section>
        ) : null}

        {showLocation ? (
          <section id="ubicacion" className="tint-aurora py-20 lg:py-24 scroll-mt-28">
            <div className="mx-auto max-w-shell px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent mb-3">Cómo llegar</p>
              <DisplayTitle size="lg" parts={[{ text: 'Sede del', tone: 'light' }, { text: 'evento', tone: 'bold' }]} />
              <div className="mt-8 max-w-xl rounded-2xl border border-white bg-white/85 p-6 shadow-elev3 backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                    <MapPinIcon size={18} className="text-brand" />
                  </div>
                  <div>
                    <p className="font-bold text-brand">{copy.ubicacion_venue || event.venue_name || venueLabel}</p>
                    {copy.ubicacion_address || event.venue_address ? (
                      <p className="mt-0.5 text-sm text-ink">{copy.ubicacion_address || event.venue_address}</p>
                    ) : null}
                    <p className="text-sm text-ink-muted">{[copy.ubicacion_city || event.venue_city, event.venue_country].filter(Boolean).join(', ')}</p>
                    {copy.ubicacion_transport ? <p className="mt-3 text-sm text-ink whitespace-pre-line">{copy.ubicacion_transport}</p> : null}
                    {copy.ubicacion_maps ? (
                      <a href={copy.ubicacion_maps} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-brand">Ver en el mapa</a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {showCertificate ? (
          <section className="tint-aurora py-16">
            <div className="mx-auto max-w-shell px-6">
              <div className="max-w-xl rounded-3xl border border-white bg-white/85 p-8 shadow-elev3 backdrop-blur">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  <AwardIcon size={15} className="text-accent" /> Certificación
                </span>
                <p className="mt-4 text-base leading-relaxed text-ink">
                  {certBody && certBody !== 'PENDIENTE'
                    ? certBody
                    : 'Este evento otorga certificado de asistencia.'}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {showGallery ? (
          <section className="tint-aurora py-20 lg:py-24">
            <div className="mx-auto max-w-shell px-6">
              <DisplayTitle size="lg" parts={[{ text: 'Galería', tone: 'bold' }]} />
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gallery.map((url) => (
                  <img key={url} src={url} alt="" className="h-56 w-full rounded-2xl object-cover shadow-elev2" />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {showResults ? (
          <section className="tint-aurora py-16">
            <div className="mx-auto max-w-shell px-6">
              <DisplayTitle size="lg" parts={[{ text: pickText(copy.resultados_title, 'Resultados'), tone: 'bold' }]} />
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                  <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-white bg-white/85 p-6 shadow-elev2 backdrop-blur">
                    <p className="text-2xl font-bold text-brand">{item.value}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {showFaq ? (
          <section id="faq" className="tint-aurora py-20 lg:py-24 scroll-mt-28">
            <div className="mx-auto max-w-shell px-6">
              <DisplayTitle size="lg" parts={[{ text: 'Preguntas', tone: 'bold' }, { text: 'frecuentes', tone: 'light' }]} />
              <div className="mt-8 space-y-3">
                {faqs.map((item) => (
                  <details key={item.q} className="rounded-2xl border border-white bg-white/85 px-5 py-4 shadow-elev1 backdrop-blur">
                    <summary className="cursor-pointer text-sm font-semibold text-brand">{item.q}</summary>
                    <p className="mt-2 text-sm leading-relaxed text-ink whitespace-pre-line">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {navFaq && !showFaq ? (
          <section id="faq" className="tint-aurora py-20 lg:py-24 scroll-mt-28">
            <div className="mx-auto max-w-shell px-6">
              <DisplayTitle size="lg" parts={[{ text: 'Preguntas', tone: 'bold' }, { text: 'frecuentes', tone: 'light' }]} />
              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink">Pronto publicaremos las preguntas frecuentes de este evento.</p>
            </div>
          </section>
        ) : null}

        {showCta ? (
          <section className="surface-deep relative isolate overflow-hidden text-white">
            <div className="relative mx-auto flex max-w-shell flex-col gap-6 px-6 py-20 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-[clamp(1.7rem,3.2vw,2.7rem)] font-bold leading-tight tracking-tight">
                  {ctaTitle}
                </h2>
                {ctaBody ? <p className="mt-3 max-w-xl text-white/70">{ctaBody}</p> : null}
              </div>
              <div className="flex flex-wrap gap-3">
                {ctaUrl ? (
                  ctaUrl.startsWith('/') ? (
                    <Link to={ctaUrl} className="grad-futuro rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-elev3 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                      {ctaLabel}
                    </Link>
                  ) : (
                    <a href={ctaUrl} className="grad-futuro rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-elev3">
                      {ctaLabel}
                    </a>
                  )
                ) : null}
                <Link to="/contacto?motivo=patrocinar" className="rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:border-white">
                  Quiero ser patrocinador
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {showNavCta ? (
          <>
            <div className="h-14 md:hidden" aria-hidden="true" />
            <div className="fixed inset-x-0 bottom-[52px] z-30 border-t border-line bg-brand px-4 py-2.5 md:hidden">
              <Link to={registerTo} className="block rounded-lg bg-white py-2.5 text-center text-sm font-semibold text-brand">
                {canRegister ? 'Inscribirme a ' : 'Recibir información de '}
                {event.name}
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </PageTransition>
  );
}
