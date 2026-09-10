import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import { NovoEventSubnav, type NovoEventNavItem } from '../../components/public/NovoEventSubnav';
import { editionStatusMeta, type BadgeTone } from '../../components/ui/StatusBadge';
import { getEditionByNovoSlug, getFamily } from '../../data/editions';
import { eventAccentRgb, getEventBySlug } from '../../lib/novo/events';
import type { Edition, EditionSection } from '../../types/event';
import type { NovoEvent } from '../../types/novo';

export type NovoPublicOutlet = {
  event: NovoEvent;
  edition?: Edition;
};

const AGENDA_SECTIONS: EditionSection[] = ['agenda', 'speakers', 'ubicacion', 'tickets'];
const ALLIES_SECTIONS: EditionSection[] = ['patrocinadores', 'aliados'];
const EDITION_SALES_OPEN = ['preventa', 'venta-activa'];
const NOVO_SALES_OPEN: NovoEvent['operational_status'][] = ['proximo', 'activo'];

function novoStatusMeta(status: NovoEvent['operational_status']): { label: string; tone: BadgeTone } {
  if (status === 'activo') return editionStatusMeta['en-curso'];
  if (status === 'finalizado') return editionStatusMeta.historico;
  if (status === 'cancelado') return { label: 'Cancelado', tone: 'danger' };
  return editionStatusMeta.proximamente;
}

export function NovoPublicEventLayout() {
  const { slug = '' } = useParams<{ slug: string }>();
  const location = useLocation();
  const [event, setEvent] = useState<NovoEvent | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    if (!slug) return;
    setEvent(null);
    setMissing(false);
    getEventBySlug(slug)
      .then((found) => {
        if (!found) {
          setMissing(true);
          return;
        }
        setEvent(found);
      })
      .catch(() => setMissing(true));
  }, [slug]);

  if (missing) {
    return (
      <div className="mx-auto max-w-shell px-6 py-24 text-center">
        <p className="text-lg font-bold text-brand">Evento no disponible</p>
        <p className="mt-2 text-sm text-ink-muted">Puede estar en borrador o el enlace es incorrecto.</p>
        <Link to="/eventos" className="mt-6 inline-block text-sm font-semibold text-brand">Ver todos los eventos</Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-shell px-6 py-24 text-center text-sm text-ink-muted">Cargando evento…</div>
    );
  }

  const edition = getEditionByNovoSlug(event.slug);
  const family = edition ? getFamily(edition.familyId) : undefined;
  const base = `/e/${event.slug}`;
  const year = edition?.year ?? Number(event.start_date.slice(0, 4));
  const status = edition ? editionStatusMeta[edition.status] : novoStatusMeta(event.operational_status);
  const isInscription = location.pathname.endsWith('/inscripcion');
  const hasSection = (section: EditionSection) => Boolean(edition?.sections.includes(section));
  const showTab = (required: EditionSection[]) => {
    if (!edition) return true;
    return required.some((section) => edition.sections.includes(section));
  };

  const items: NovoEventNavItem[] = [
    { to: base, label: 'Inicio', end: true },
    ...(showTab(AGENDA_SECTIONS) ? [{ to: `${base}/agenda`, label: 'Agenda' }] : []),
    ...(showTab(ALLIES_SECTIONS) ? [{ to: `${base}/aliados`, label: 'Aliados' }] : []),
    ...(showTab(['faq']) ? [{ to: `${base}/faq`, label: 'Preguntas y respuestas' }] : []),
  ];

  const showNavCta = edition ? hasSection('tickets') : true;
  const canRegister = edition
    ? EDITION_SALES_OPEN.includes(edition.status)
    : NOVO_SALES_OPEN.includes(event.operational_status);
  const ctaLabel = canRegister ? 'Inscribirme' : 'Recibir información';
  const registerTo = `${base}/inscripcion`;
  const accentRgb = edition?.accentRgb || eventAccentRgb(event);

  return (
    <div style={{ ['--accent-rgb' as string]: accentRgb }}>
      <NovoEventSubnav
        familyName={family?.name}
        familySlug={family?.slug}
        familyLogo={family?.logoLight}
        eventName={event.name}
        year={year}
        statusLabel={status.label}
        statusTone={status.tone}
        items={items}
        ctaLabel={showNavCta ? ctaLabel : undefined}
        ctaTo={showNavCta ? registerTo : undefined}
      />
      <Outlet context={{ event, edition } satisfies NovoPublicOutlet} />
      {showNavCta && !isInscription ? (
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
  );
}
