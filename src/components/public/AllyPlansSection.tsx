import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeftIcon, ArrowRightIcon, BuildingIcon, CalendarDaysIcon,
  CheckCircle2Icon, Loader2Icon, MapPinIcon, SearchIcon, UserIcon, XIcon,
  LayoutPanelLeftIcon, Maximize2Icon,
} from 'lucide-react';
import { PlanShowcase } from '../event/PlanShowcase';
import { DisplayTitle } from '../ui/DisplayTitle';
import { editions } from '../../data/editions';
import { getEditionPlans } from '../../data/editionPlans';
import { getEventBySlug } from '../../lib/novo/events';
import { getFloorPlanUrl, listEventParticipations, participationToPublicPlan, enumPlanId } from '../../lib/novo/participations';
import { listStandUnits } from '../../lib/novo/stands';
import { submitPublicPlanRequest } from '../../lib/novo/planRequests';
import { supabase } from '../../lib/supabaseClient';
import type { ParticipationPlan } from '../../types/participation';
import { EASE_EMPHASIS, DURATION } from '../../utils/motion';
import { editionMedia, media } from '../../data/media';

/* ── Static data ──────────────────────────────────────────────────────────── */
const upcomingStatuses = ['proximamente', 'prelanzamiento', 'preventa', 'venta-activa'] as const;
const upcomingEditions = editions.filter((e) =>
  upcomingStatuses.includes(e.status as typeof upcomingStatuses[number])
);

const COUNTRIES = [
  'Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'Ecuador',
  'Venezuela', 'Bolivia', 'Paraguay', 'Uruguay', 'Guatemala', 'Honduras',
  'El Salvador', 'Nicaragua', 'Costa Rica', 'Panamá', 'Cuba',
  'República Dominicana', 'España', 'Otro',
];

const SECTORS = [
  'Farmacéutica', 'Nutrición clínica', 'Suplementación',
  'Cosmética y estética médica', 'Dispositivos médicos',
  'Tecnología en salud', 'Educación médica',
  'Laboratorio clínico', 'Biotecnología', 'Otro',
];

const CARGOS = [
  'Gerente General', 'Director(a) Comercial', 'Director(a) de Marketing',
  'Gerente de Marca', 'Director(a) de Asuntos Médicos',
  'Representante médico(a)', 'Coordinador(a) comercial', 'Otro',
];

/* ── Types ────────────────────────────────────────────────────────────────── */
interface CompanyResult {
  id: string; trade_name: string; legal_name: string | null;
  nit: string | null; city: string | null; country: string | null;
  contact_name: string | null; contact_whatsapp: string | null;
}

type FormStep = 'idle' | 'stand' | 'search' | 'email' | 'empresa' | 'contacto' | 'submitting' | 'success';

interface StandOption { id: string; code: string; size: string; zone: string; taken?: boolean; }

function sameZone(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function inPlanZone(stand: Pick<StandOption, 'zone'>, zone: string) {
  if (!zone.trim()) return true;
  return sameZone(stand.zone, zone);
}

/* Stands mock por edición — se usa si el evento aún no tiene inventario en Stands */
const MOCK_STANDS: StandOption[] = [
  { id: 'st04', code: 'A-04', size: '3×3 m', zone: 'Zona A' },
  { id: 'st05', code: 'A-05', size: '3×3 m', zone: 'Zona A' },
  { id: 'st08', code: 'B-03', size: '3×3 m', zone: 'Zona B' },
  { id: 'st09', code: 'B-04', size: '3×3 m', zone: 'Zona B' },
  { id: 'st11', code: 'C-01', size: '3×3 m', zone: 'Zona C' },
  { id: 'st12', code: 'C-02', size: '3×3 m', zone: 'Zona C' },
  { id: 'pu-01', code: 'PU-01', size: '1×2 m', zone: 'Estaciones Pop Up' },
  { id: 'pu-02', code: 'PU-02', size: '1×2 m', zone: 'Estaciones Pop Up' },
  { id: 'pu-03', code: 'PU-03', size: '1×2 m', zone: 'Estaciones Pop Up' },
  { id: 'pu-04', code: 'PU-04', size: '1×2 m', zone: 'Estaciones Pop Up' },
];

const STEP_TITLE: Record<FormStep, string> = {
  idle: '', stand: 'Elige tu stand', search: 'Busca tu empresa', email: 'Correo de contacto',
  empresa: 'Datos de la empresa', contacto: 'Persona de contacto',
  submitting: 'Registrando…', success: 'Solicitud enviada',
};

const STEP_PROGRESS: Record<FormStep, string> = {
  idle: '0%', stand: '15%', search: '30%', email: '50%',
  empresa: '70%', contacto: '87%', submitting: '95%', success: '100%',
};

/* ── Shared input styles ──────────────────────────────────────────────────── */
const inp = 'w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand';
const sel = `${inp} cursor-pointer appearance-none`;

function Lbl({ text, req }: { text: string; req?: boolean }) {
  return (
    <span className="mb-1 block text-xs font-semibold text-ink-muted">
      {text}{req && <span className="ml-0.5 text-accent">*</span>}
    </span>
  );
}

/* ── Company context bar shown across steps 2-4 ──────────────────────────── */
function CompanyBar({
  name, email, onChangeName, onChangeEmail,
}: { name: string; email?: string; onChangeName?: () => void; onChangeEmail?: () => void }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-canvas px-4 py-3">
      <div className="flex items-center gap-2">
        <BuildingIcon size={13} className="shrink-0 text-brand" />
        <span className="flex-1 truncate text-sm font-semibold text-brand">{name || '—'}</span>
        {onChangeName && (
          <button type="button" onClick={onChangeName}
            className="shrink-0 text-[11px] font-medium text-ink-muted underline underline-offset-2 hover:text-brand">
            Cambiar
          </button>
        )}
      </div>
      {email && (
        <div className="flex items-center gap-2 border-t border-line pt-1.5">
          <UserIcon size={12} className="shrink-0 text-ink-muted" />
          <span className="flex-1 truncate text-xs text-ink-muted">{email}</span>
          {onChangeEmail && (
            <button type="button" onClick={onChangeEmail}
              className="shrink-0 text-[11px] font-medium text-ink-muted underline underline-offset-2 hover:text-brand">
              Cambiar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export function AllyPlansSection({ fixedEditionId, novoEventId }: { fixedEditionId?: string; novoEventId?: string }) {
  const reduce = useReducedMotion();

  /* event selector */
  const [activeEditionId, setActiveEditionId] = useState(fixedEditionId ?? upcomingEditions[0]?.id ?? '');
  const activeEdition = upcomingEditions.find((e) => e.id === activeEditionId) ?? upcomingEditions[0];
  const catalogPlans = getEditionPlans(activeEdition?.id ?? '');
  const [novoPlans, setNovoPlans] = useState<ParticipationPlan[] | null>(null);
  const [floorPlanUrl, setFloorPlanUrl] = useState('');
  const [eventStands, setEventStands] = useState<StandOption[]>([]);
  const [mapExpanded, setMapExpanded] = useState(false);
  const editionPlans = (novoPlans && novoPlans.length > 0) ? novoPlans : catalogPlans;
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  /* form */
  const [formOpen, setFormOpen] = useState(false);
  const [step, setStep] = useState<FormStep>('idle');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedStand, setSelectedStand] = useState<StandOption | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* search */
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyResult | null>(null);

  /* email */
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'found' | 'new'>('idle');

  /* empresa fields */
  const [empresa, setEmpresa] = useState({
    trade_name: '',
    legal_name: '',
    nit: '',
    sector: '',
    country: 'Colombia',
    city: '',
  });

  /* contacto fields */
  const [contacto, setContacto] = useState({
    name: '',
    cargo: '',
    whatsapp: '',
    notes: '',
  });

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const slug = activeEdition?.slug;
    if (!novoEventId && !slug) {
      setNovoPlans(null);
      setFloorPlanUrl('');
      setEventStands([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const eventId = novoEventId ?? (slug ? (await getEventBySlug(slug))?.id : undefined);
        if (!eventId || cancelled) {
          if (!cancelled) {
            setNovoPlans(null);
            setFloorPlanUrl('');
            setEventStands([]);
          }
          return;
        }
        const [rows, mapUrl, units] = await Promise.all([
          listEventParticipations(eventId),
          getFloorPlanUrl(eventId),
          listStandUnits(eventId).catch(() => []),
        ]);
        if (cancelled) return;
        const active = rows.filter((row) => row.is_active);
        setNovoPlans(active.length ? active.map(participationToPublicPlan) : []);
        setFloorPlanUrl(mapUrl);
        setEventStands(units.map((unit) => ({
          id: unit.id,
          code: unit.code,
          size: unit.type_name || '',
          zone: unit.zone || 'Sin zona',
          taken: unit.status !== 'disponible',
        })));
      } catch {
        if (!cancelled) {
          setNovoPlans([]);
          setFloorPlanUrl('');
          setEventStands([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [novoEventId, activeEdition?.slug]);

  useEffect(() => {
    if (!mapExpanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setMapExpanded(false);
    };
    window.addEventListener('keydown', onKey, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prev;
    };
  }, [mapExpanded]);

  /* company search */
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await supabase
          .from('companies')
          .select('id, trade_name, legal_name, nit, city, country, contact_name, contact_whatsapp')
          .ilike('trade_name', `%${query}%`)
          .limit(6);
        setResults(data ?? []);
      } catch { setResults([]); }
      setSearching(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  const checkEmail = async () => {
    if (!email) return;
    if (!selectedCompany) { setEmailStatus('new'); return; }
    setEmailStatus('checking');
    try {
      const { data } = await supabase
        .from('profiles').select('id')
        .eq('company_id', selectedCompany.id)
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      setEmailStatus(data ? 'found' : 'new');
    } catch { setEmailStatus('new'); }
  };

  const openForm = (planId?: string) => {
    const plan = editionPlans.find((p) => p.id === planId);
    const hasMap = plan?.has_map ?? false;
    setSelectedPlan(planId ?? null);
    setSelectedStand(null);
    setSubmitError(null);
    setStep(hasMap ? 'stand' : 'search');
    setFormOpen(true);
    setQuery(''); setResults([]); setSelectedCompany(null);
    setEmail(''); setEmailStatus('idle');
    setEmpresa({ trade_name: '', legal_name: '', nit: '', sector: '', country: 'Colombia', city: '' });
    setContacto({ name: '', cargo: '', whatsapp: '', notes: '' });
    if (!hasMap) setTimeout(() => searchRef.current?.focus(), 120);
  };

  const closeForm = () => {
    setMapExpanded(false);
    setFormOpen(false);
    setTimeout(() => setStep('idle'), 300);
  };

  const selectCompany = (company: CompanyResult) => {
    setSelectedCompany(company);
    setQuery(company.trade_name);
    setResults([]);
    setEmpresa((prev) => ({
      ...prev,
      trade_name: company.trade_name,
      legal_name: company.legal_name ?? '',
      nit: company.nit ?? '',
      city: company.city ?? '',
      country: company.country ?? 'Colombia',
    }));
    setContacto((prev) => ({
      ...prev,
      name: company.contact_name ?? '',
      whatsapp: company.contact_whatsapp ?? '',
    }));
    setStep('email');
  };

  const submitRequest = async () => {
    if (!activeEdition) return;
    setStep('submitting');
    setSubmitError(null);
    const plan = editionPlans.find((item) => item.id === selectedPlan);
    try {
      await submitPublicPlanRequest({
        editionId: activeEdition.id,
        planId: enumPlanId(selectedPlan),
        company: empresa.trade_name || query,
        nit: empresa.nit || null,
        contactName: contacto.cargo ? `${contacto.name} (${contacto.cargo})` : contacto.name,
        contactEmail: email.toLowerCase().trim(),
        contactWhatsapp: contacto.whatsapp || null,
        category: empresa.sector || null,
        country: empresa.country || null,
        city: empresa.city || null,
        notes: [
          plan ? `Plan: ${plan.name}` : '',
          selectedStand ? `Stand: ${selectedStand.code}${selectedStand.zone ? ` · ${selectedStand.zone}` : ''}` : '',
          contacto.cargo ? `Cargo: ${contacto.cargo}` : '',
          empresa.legal_name ? `Razón social: ${empresa.legal_name}` : '',
          contacto.notes,
        ].filter(Boolean).join('\n') || null,
      });
      setStep('success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No pudimos enviar tu solicitud. Intenta de nuevo en un momento.');
      setStep('contacto');
    }
  };

  const canProceedEmail = email.includes('@') && email.includes('.') && emailStatus !== 'checking';
  const canSubmitEmpresa = empresa.trade_name.trim().length > 1 && empresa.city.trim().length > 0;
  const canSubmitContacto = contacto.name.trim().length > 1 && contacto.whatsapp.trim().length > 5;

  const companyDisplayName = empresa.trade_name || query;

  /* step dots */
  const selectedPlanData = editionPlans.find((p) => p.id === selectedPlan);
  const planHasMap = selectedPlanData?.has_map ?? false;
  const planZone = selectedPlanData?.stand_zone?.trim() ?? '';
  const standSource = eventStands.length ? eventStands : MOCK_STANDS;
  const planStands = standSource.filter((stand) => inPlanZone(stand, planZone));
  const showStandChips = Boolean(floorPlanUrl || eventStands.length || planZone);
  const svgInteractive = !floorPlanUrl && eventStands.length === 0;
  const stepDots: FormStep[] = planHasMap
    ? ['stand', 'search', 'email', 'empresa', 'contacto']
    : ['search', 'email', 'empresa', 'contacto'];
  const currentDotIdx = stepDots.indexOf(step);

  return (
    <section className="tint-aurora py-20 lg:py-28">
      <div className="mx-auto max-w-shell px-6">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: DURATION.panel, ease: EASE_EMPHASIS }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
            Planes de participación
          </p>
          <DisplayTitle size="lg" className="mt-4 max-w-3xl" parts={[
            { text: 'Elige el evento,', tone: 'bold' },
            { text: 'conoce cómo participar', tone: 'light' },
          ]} />
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink">
            Cada evento tiene sus propios planes y cupos. Selecciona el que te interesa y ve directamente a los planes disponibles.
          </p>
        </motion.div>

        {/* Event chips — ocultos si la edición está fija */}
        {!fixedEditionId && <div className="mt-10 flex flex-wrap gap-3">
          {upcomingEditions.map((edition, index) => {
            const isActive = edition.id === activeEditionId;
            return (
              <motion.button
                key={edition.id} type="button"
                onClick={() => { setActiveEditionId(edition.id); setActivePlanId(null); }}
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.26, ease: EASE_EMPHASIS, delay: index * 0.06 }}
                whileHover={reduce ? undefined : { y: -3 }}
                className={`relative isolate flex items-center gap-4 overflow-hidden rounded-2xl border px-5 py-4 text-left transition-shadow duration-200
                  ${isActive ? 'border-transparent bg-brand text-white shadow-elev4' : 'border-white bg-white/85 shadow-elev2 backdrop-blur hover:shadow-elev3'}`}
              >
                {isActive && (
                  <motion.span layoutId="event-selector-pill"
                    className="absolute inset-0 -z-10 rounded-2xl bg-brand"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                  <img src={editionMedia[edition.id] ?? media.heroAuditorium} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                  <span className={`absolute inset-0 ${isActive ? 'bg-white/10' : 'bg-brand/20'}`} />
                </span>
                <span className="min-w-0">
                  <span className={`block text-[10px] font-bold uppercase tracking-[0.18em] ${isActive ? 'text-white/70' : 'text-ink-muted'}`}>
                    {edition.editionLabel}
                  </span>
                  <span className={`mt-0.5 block text-sm font-bold leading-tight ${isActive ? 'text-white' : 'text-brand'}`}>
                    {edition.name}
                  </span>
                  <span className={`mt-1 flex items-center gap-1.5 text-[11px] font-medium ${isActive ? 'text-white/75' : 'text-ink-muted'}`}>
                    <CalendarDaysIcon size={11} />{edition.dateLabel}
                    <MapPinIcon size={11} className="ml-1" />{edition.venue.city}
                  </span>
                </span>
                {isActive && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto shrink-0 text-white/80">
                    <CheckCircle2Icon size={18} />
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>}

        {/* Plans */}
        <AnimatePresence mode="wait">
          <motion.div key={activeEditionId}
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: EASE_EMPHASIS }} className="mt-10">
            {editionPlans.length > 0 ? (
              <PlanShowcase
                plans={editionPlans}
                activeId={activePlanId}
                onSelect={(id) => setActivePlanId(activePlanId === id ? null : id)}
                ctaLabel="Postularme a este plan"
                onCta={(id) => openForm(id)}
              />
            ) : (
              <p className="py-12 text-center text-sm text-ink-muted">
                Los planes de participación para este evento se publicarán pronto.
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-0">
          <p className="text-sm text-ink-muted">
            Los precios y cupos pueden variar por edición. El equipo comercial confirma disponibilidad.
          </p>
          <motion.button
            type="button"
            onClick={() => openForm()}
            whileHover={reduce ? undefined : { y: -2 }}
            className="flex shrink-0 items-center gap-2 rounded-full border border-brand/30 bg-white px-5 py-2.5 text-sm font-semibold text-brand shadow-elev1 transition-shadow hover:shadow-elev2"
          >
            <BuildingIcon size={15} />
            Registrar mi empresa
          </motion.button>
        </div>
      </div>

      {/* ── Slide-over panel ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {formOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-brand-deep/60 backdrop-blur-sm"
              onClick={closeForm}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[28rem] flex-col bg-white shadow-elev4"
            >
              {/* Panel header */}
              <div className="shrink-0 border-b border-line">
                <div className="flex items-start justify-between px-6 py-4">
                  <div className="min-w-0 pr-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
                      {selectedPlan ? `${activeEdition?.name} · Plan ${selectedPlan}` : 'Registro de empresa aliada'}
                    </p>
                    <p className="mt-1 text-base font-bold text-brand">{STEP_TITLE[step]}</p>
                  </div>
                  <button type="button" onClick={closeForm} aria-label="Cerrar"
                    className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line text-ink-muted transition-colors hover:border-brand/30 hover:text-brand">
                    <XIcon size={17} />
                  </button>
                </div>

                {/* Progress bar */}
                {step !== 'idle' && (
                  <div className="h-[3px] w-full bg-line">
                    <motion.div className="grad-futuro h-full" animate={{ width: STEP_PROGRESS[step] }}
                      transition={{ duration: 0.4, ease: EASE_EMPHASIS }} />
                  </div>
                )}

                {/* Step dots */}
                {currentDotIdx >= 0 && (
                  <div className="flex items-center gap-1.5 px-6 py-3">
                    {stepDots.map((s, i) => (
                      <span key={s} className={`h-1.5 rounded-full transition-all duration-300
                        ${s === step ? 'w-8 bg-brand' : i < currentDotIdx ? 'w-2 bg-accent/60' : 'w-2 bg-line'}`} />
                    ))}
                    <span className="ml-auto text-[10px] font-bold text-ink-muted">
                      {currentDotIdx + 1} / {stepDots.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col overflow-y-auto">
                <AnimatePresence mode="wait">

                  {/* ── 0. STAND MAP ────────────────────────────────── */}
                  {step === 'stand' && (
                    <motion.div key="stand"
                      initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
                      transition={{ duration: 0.22, ease: EASE_EMPHASIS }}
                      className="flex flex-col gap-4 px-6 py-5"
                    >
                      <p className="text-sm leading-relaxed text-ink">
                        {planZone
                          ? `Este plan solo habilita stands de ${planZone}. Elige uno disponible; el equipo comercial confirmará el espacio.`
                          : floorPlanUrl
                            ? 'Revisa el plano y elige un stand disponible. El equipo comercial confirmará disponibilidad.'
                            : 'Haz clic en el stand de tu preferencia en el plano. El equipo comercial confirmará disponibilidad.'}
                      </p>

                      {/* Floor plan */}
                      <div className="overflow-hidden rounded-2xl border border-line bg-[#f0f4f8]">
                        <div className="border-b border-line bg-white px-4 py-2 flex items-center gap-2">
                          <LayoutPanelLeftIcon size={14} className="text-brand" />
                          <span className="text-xs font-semibold text-brand">Plano del evento</span>
                          {floorPlanUrl ? (
                            <button
                              type="button"
                              onClick={() => setMapExpanded(true)}
                              className="ml-auto inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[10px] font-bold text-brand hover:border-brand/40"
                            >
                              <Maximize2Icon size={11} /> Ampliar
                            </button>
                          ) : null}
                          {selectedStand && (
                            <span className={`inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold text-brand ${floorPlanUrl ? '' : 'ml-auto'}`}>
                              <CheckCircle2Icon size={11} /> Stand {selectedStand.code} seleccionado
                            </span>
                          )}
                        </div>
                        {floorPlanUrl ? (
                          <button
                            type="button"
                            onClick={() => setMapExpanded(true)}
                            className="block w-full cursor-zoom-in text-left"
                            aria-label="Ampliar plano del evento"
                          >
                            <img
                              src={floorPlanUrl}
                              alt="Plano de stands del evento"
                              className="w-full max-h-[420px] object-contain bg-[#f0f4f8]"
                            />
                          </button>
                        ) : (
                        <div className="p-3 overflow-x-auto">
                          <svg viewBox="0 0 340 260" xmlns="http://www.w3.org/2000/svg"
                            className="w-full min-w-[280px]" style={{ fontFamily: 'inherit' }}>

                            {/* Stage / escenario */}
                            <rect x="110" y="10" width="120" height="30" rx="6" fill="#112035" />
                            <text x="170" y="30" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">ESCENARIO</text>

                            {/* Aisles labels */}
                            <text x="55" y="60" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600">ZONA A</text>
                            <text x="170" y="60" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600">ZONA B</text>
                            <text x="285" y="60" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600">ZONA C</text>

                            {/* Aisle lines */}
                            <line x1="108" y1="55" x2="108" y2="245" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 3" />
                            <line x1="232" y1="55" x2="232" y2="245" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 3" />

                            {/* ZONA A stands (A-01..A-06) */}
                            {[
                              { id: 'st-a01', code: 'A-01', x: 10, y: 65, taken: true },
                              { id: 'st-a02', code: 'A-02', x: 10, y: 110, taken: true },
                              { id: 'st-a03', code: 'A-03', x: 10, y: 155, taken: true },
                              { id: 'st04', code: 'A-04', x: 55, y: 65, taken: false },
                              { id: 'st05', code: 'A-05', x: 55, y: 110, taken: false },
                              { id: 'st-a06', code: 'A-06', x: 55, y: 155, taken: true },
                            ].map((s) => {
                              const zone = 'Zona A';
                              const offPlan = !inPlanZone({ zone }, planZone);
                              const locked = s.taken || offPlan || !svgInteractive;
                              const isSelected = selectedStand?.id === s.id;
                              const fill = s.taken || offPlan ? '#e2e8f0' : isSelected ? '#112035' : '#ffffff';
                              const stroke = s.taken || offPlan ? '#cbd5e1' : isSelected ? '#112035' : '#94a3b8';
                              const textFill = s.taken || offPlan ? '#94a3b8' : isSelected ? '#ffffff' : '#112035';
                              return (
                                <g key={s.id} style={{ cursor: locked ? 'default' : 'pointer' }}
                                  onClick={() => !locked && setSelectedStand(isSelected ? null : { id: s.id, code: s.code, size: '3×3 m', zone })}>
                                  <rect x={s.x} y={s.y} width="40" height="38" rx="5"
                                    fill={fill} stroke={stroke} strokeWidth={isSelected ? 2 : 1.2}
                                    style={{ transition: 'fill 0.18s, stroke 0.18s' }} />
                                  <text x={s.x + 20} y={s.y + 16} textAnchor="middle" fill={textFill} fontSize="8" fontWeight="700">{s.code}</text>
                                  <text x={s.x + 20} y={s.y + 28} textAnchor="middle" fill={s.taken ? '#cbd5e1' : offPlan ? '#94a3b8' : isSelected ? '#00C9A0' : '#64748b'} fontSize="7">
                                    {s.taken ? 'Ocupado' : offPlan ? 'Otro plan' : '3×3 m'}
                                  </text>
                                </g>
                              );
                            })}

                            {/* ZONA B stands (B-01..B-06) */}
                            {[
                              { id: 'st-b01', code: 'B-01', x: 116, y: 65, taken: true },
                              { id: 'st-b02', code: 'B-02', x: 116, y: 110, taken: true },
                              { id: 'st08', code: 'B-03', x: 116, y: 155, taken: false },
                              { id: 'st09', code: 'B-04', x: 170, y: 65, taken: false },
                              { id: 'st-b05', code: 'B-05', x: 170, y: 110, taken: true },
                              { id: 'st-b06', code: 'B-06', x: 170, y: 155, taken: true },
                            ].map((s) => {
                              const zone = 'Zona B';
                              const offPlan = !inPlanZone({ zone }, planZone);
                              const locked = s.taken || offPlan || !svgInteractive;
                              const isSelected = selectedStand?.id === s.id;
                              const fill = s.taken || offPlan ? '#e2e8f0' : isSelected ? '#112035' : '#ffffff';
                              const stroke = s.taken || offPlan ? '#cbd5e1' : isSelected ? '#112035' : '#94a3b8';
                              const textFill = s.taken || offPlan ? '#94a3b8' : isSelected ? '#ffffff' : '#112035';
                              return (
                                <g key={s.id} style={{ cursor: locked ? 'default' : 'pointer' }}
                                  onClick={() => !locked && setSelectedStand(isSelected ? null : { id: s.id, code: s.code, size: '3×3 m', zone })}>
                                  <rect x={s.x} y={s.y} width="40" height="38" rx="5"
                                    fill={fill} stroke={stroke} strokeWidth={isSelected ? 2 : 1.2}
                                    style={{ transition: 'fill 0.18s, stroke 0.18s' }} />
                                  <text x={s.x + 20} y={s.y + 16} textAnchor="middle" fill={textFill} fontSize="8" fontWeight="700">{s.code}</text>
                                  <text x={s.x + 20} y={s.y + 28} textAnchor="middle" fill={s.taken ? '#cbd5e1' : offPlan ? '#94a3b8' : isSelected ? '#00C9A0' : '#64748b'} fontSize="7">
                                    {s.taken ? 'Ocupado' : offPlan ? 'Otro plan' : '3×3 m'}
                                  </text>
                                </g>
                              );
                            })}

                            {/* ZONA C stands (C-01..C-04) */}
                            {[
                              { id: 'st11', code: 'C-01', x: 240, y: 65, taken: false },
                              { id: 'st12', code: 'C-02', x: 240, y: 110, taken: false },
                              { id: 'st-c03', code: 'C-03', x: 290, y: 65, taken: true },
                              { id: 'st-c04', code: 'C-04', x: 290, y: 110, taken: true },
                            ].map((s) => {
                              const zone = 'Zona C';
                              const offPlan = !inPlanZone({ zone }, planZone);
                              const locked = s.taken || offPlan || !svgInteractive;
                              const isSelected = selectedStand?.id === s.id;
                              const fill = s.taken || offPlan ? '#e2e8f0' : isSelected ? '#112035' : '#ffffff';
                              const stroke = s.taken || offPlan ? '#cbd5e1' : isSelected ? '#112035' : '#94a3b8';
                              const textFill = s.taken || offPlan ? '#94a3b8' : isSelected ? '#ffffff' : '#112035';
                              return (
                                <g key={s.id} style={{ cursor: locked ? 'default' : 'pointer' }}
                                  onClick={() => !locked && setSelectedStand(isSelected ? null : { id: s.id, code: s.code, size: '3×3 m', zone })}>
                                  <rect x={s.x} y={s.y} width="40" height="38" rx="5"
                                    fill={fill} stroke={stroke} strokeWidth={isSelected ? 2 : 1.2}
                                    style={{ transition: 'fill 0.18s, stroke 0.18s' }} />
                                  <text x={s.x + 20} y={s.y + 16} textAnchor="middle" fill={textFill} fontSize="8" fontWeight="700">{s.code}</text>
                                  <text x={s.x + 20} y={s.y + 28} textAnchor="middle" fill={s.taken ? '#cbd5e1' : offPlan ? '#94a3b8' : isSelected ? '#00C9A0' : '#64748b'} fontSize="7">
                                    {s.taken ? 'Ocupado' : offPlan ? 'Otro plan' : '3×3 m'}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Pop-up estaciones (fila inferior) */}
                            <text x="170" y="215" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600">ESTACIONES POP UP</text>
                            {[
                              { id: 'pu-01', code: 'PU-01', x: 50 },
                              { id: 'pu-02', code: 'PU-02', x: 115 },
                              { id: 'pu-03', code: 'PU-03', x: 180 },
                              { id: 'pu-04', code: 'PU-04', x: 245 },
                            ].map((s) => {
                              const zone = 'Estaciones Pop Up';
                              const offPlan = !inPlanZone({ zone }, planZone);
                              const locked = offPlan || !svgInteractive;
                              const isSelected = selectedStand?.id === s.id;
                              const fill = offPlan ? '#e2e8f0' : isSelected ? '#112035' : '#ffffff';
                              const stroke = offPlan ? '#cbd5e1' : isSelected ? '#112035' : '#94a3b8';
                              const textFill = offPlan ? '#94a3b8' : isSelected ? '#ffffff' : '#112035';
                              return (
                                <g key={s.id} style={{ cursor: locked ? 'default' : 'pointer' }}
                                  onClick={() => !locked && setSelectedStand(isSelected ? null : { id: s.id, code: s.code, size: '1×2 m', zone })}>
                                  <rect x={s.x} y={220} width="42" height="28" rx="4"
                                    fill={fill} stroke={stroke} strokeWidth={isSelected ? 2 : 1} />
                                  <text x={s.x + 21} y={232} textAnchor="middle" fill={textFill} fontSize="7" fontWeight="600">{s.code}</text>
                                  <text x={s.x + 21} y={242} textAnchor="middle" fill={offPlan ? '#cbd5e1' : isSelected ? '#00C9A0' : '#64748b'} fontSize="6">
                                    {offPlan ? 'Otro plan' : '1×2 m'}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Legend */}
                            <rect x="10" y="205" width="10" height="10" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
                            <text x="24" y="214" fill="#64748b" fontSize="7">Disponible</text>
                            <rect x="75" y="205" width="10" height="10" rx="2" fill="#112035" stroke="#112035" strokeWidth="1" />
                            <text x="89" y="214" fill="#64748b" fontSize="7">Seleccionado</text>
                            <rect x="160" y="205" width="10" height="10" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                            <text x="174" y="214" fill="#94a3b8" fontSize="7">Ocupado</text>
                          </svg>
                        </div>
                        )}
                      </div>

                      {showStandChips ? (
                        <div className="flex flex-col gap-2">
                          {planStands.length === 0 ? (
                            <p className="text-xs text-ink-muted">
                              Aún no hay stands cargados{planZone ? ` en ${planZone}` : ''}. Puedes continuar y el equipo comercial te asignará uno.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {planStands.map((s) => {
                                const on = selectedStand?.id === s.id;
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    disabled={s.taken}
                                    onClick={() => setSelectedStand(on ? null : s)}
                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                      on
                                        ? 'border-brand bg-brand text-white'
                                        : 'border-line bg-white text-ink hover:border-brand/50'
                                    }`}
                                  >
                                    {s.code}{s.size ? ` · ${s.size}` : ''}{s.taken ? ' · Ocupado' : ''}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : null}

                      <p className="text-xs text-ink-muted">
                        ¿No ves el que quieres? El equipo comercial te mostrará todas las opciones disponibles durante la reunión de cierre.
                      </p>
                      <button type="button"
                        onClick={() => setStep('search')}
                        className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-elev2 transition-transform hover:-translate-y-0.5">
                        {selectedStand ? `Continuar con Stand ${selectedStand.code}` : 'Continuar sin elegir stand'}
                        <ArrowRightIcon size={15} />
                      </button>
                    </motion.div>
                  )}

                  {/* ── 1. SEARCH ──────────────────────────────────────── */}
                  {step === 'search' && (
                    <motion.div key="search"
                      initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
                      transition={{ duration: 0.22, ease: EASE_EMPHASIS }}
                      className="flex flex-col gap-4 px-6 py-5"
                    >
                      <p className="text-sm leading-relaxed text-ink">
                        Escribe el nombre comercial de tu empresa. Si ya está en el sistema, precargaremos sus datos.
                      </p>

                      <div className="relative">
                        <SearchIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input ref={searchRef} type="text"
                          placeholder="Nombre comercial de tu empresa"
                          value={query} onChange={(e) => setQuery(e.target.value)}
                          className="w-full rounded-xl border border-line bg-canvas py-3 pl-10 pr-10 text-sm text-ink outline-none transition-colors focus:border-brand" />
                        {searching && <Loader2Icon size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-ink-muted" />}
                      </div>

                      <AnimatePresence>
                        {results.length > 0 && (
                          <motion.ul initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="overflow-hidden rounded-xl border border-line bg-white shadow-elev3">
                            {results.map((c) => (
                              <li key={c.id}>
                                <button type="button" onClick={() => selectCompany(c)}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-soft">
                                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft">
                                    <BuildingIcon size={15} className="text-brand" />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-bold text-brand">{c.trade_name}</span>
                                    <span className="block text-xs text-ink-muted">
                                      {[c.nit && `NIT ${c.nit}`, c.city, c.country].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
                                    </span>
                                  </span>
                                  <ArrowRightIcon size={13} className="shrink-0 text-ink-muted" />
                                </button>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>

                      {query.length >= 2 && !searching && results.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="rounded-xl border border-dashed border-line bg-canvas p-5 text-center">
                          <BuildingIcon size={24} className="mx-auto text-ink-muted/40" />
                          <p className="mt-2 text-sm font-bold text-brand">"{query}" no está registrada</p>
                          <p className="mt-1 text-xs text-ink-muted">La registraremos en los pasos siguientes.</p>
                          <button type="button"
                            onClick={() => { setEmpresa((p) => ({ ...p, trade_name: query })); setSelectedCompany(null); setStep('email'); }}
                            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-white">
                            Registrar empresa nueva <ArrowRightIcon size={12} />
                          </button>
                        </motion.div>
                      )}

                      {query.length < 2 && (
                        <p className="rounded-xl border border-line bg-canvas px-4 py-3 text-xs text-ink-muted">
                          Escribe al menos 2 caracteres. Si tu empresa es nueva, la registramos durante el proceso.
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* ── 2. EMAIL ───────────────────────────────────────── */}
                  {step === 'email' && (
                    <motion.div key="email"
                      initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
                      transition={{ duration: 0.22, ease: EASE_EMPHASIS }}
                      className="flex flex-col gap-4 px-6 py-5"
                    >
                      <CompanyBar
                        name={companyDisplayName}
                        onChangeName={() => { setStep('search'); setEmailStatus('idle'); }}
                      />

                      <p className="text-sm leading-relaxed text-ink">
                        Ingresa el correo corporativo con el que te identificarás en el portal de empresas.
                      </p>

                      <div>
                        <Lbl text="Correo corporativo" req />
                        <div className="flex gap-2">
                          <input type="email" placeholder="correo@empresa.com"
                            value={email} onChange={(e) => { setEmail(e.target.value); setEmailStatus('idle'); }}
                            className={`${inp} flex-1`} />
                          <button type="button" onClick={checkEmail} disabled={!email.includes('@')}
                            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-40 hover:bg-brand-deep">
                            {emailStatus === 'checking' ? <Loader2Icon size={15} className="animate-spin" /> : 'Verificar'}
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {emailStatus === 'found' && (
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <CheckCircle2Icon size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                            <div>
                              <p className="text-sm font-bold text-emerald-800">Empresa verificada en el sistema</p>
                              <p className="text-xs text-emerald-700">Puedes enviar la postulación directamente.</p>
                            </div>
                          </motion.div>
                        )}
                        {emailStatus === 'new' && (
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-sm font-bold text-amber-800">Correo no registrado aún</p>
                            <p className="mt-0.5 text-xs text-amber-700">Completa los datos de tu empresa y contacto en los siguientes pasos.</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {emailStatus === 'found' && (
                        <button type="button" onClick={submitRequest}
                          className="group flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-elev2 transition-transform hover:-translate-y-0.5">
                          Enviar postulación <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
                        </button>
                      )}
                      {emailStatus === 'new' && (
                        <button type="button" onClick={() => setStep('empresa')}
                          className="group flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-elev2 transition-transform hover:-translate-y-0.5">
                          Completar registro <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
                        </button>
                      )}
                      {canProceedEmail && emailStatus === 'idle' && (
                        <button type="button" onClick={() => setStep('empresa')}
                          className="w-full rounded-full border border-line py-3.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand">
                          Continuar
                        </button>
                      )}
                    </motion.div>
                  )}

                  {/* ── 3. EMPRESA ─────────────────────────────────────── */}
                  {step === 'empresa' && (
                    <motion.div key="empresa"
                      initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
                      transition={{ duration: 0.22, ease: EASE_EMPHASIS }}
                      className="flex flex-col gap-4 px-6 py-5"
                    >
                      <CompanyBar
                        name={companyDisplayName} email={email}
                        onChangeName={() => setStep('search')}
                        onChangeEmail={() => setStep('email')}
                      />

                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                        Información de la empresa
                      </p>

                      {/* Nombre comercial */}
                      <label className="block">
                        <Lbl text="Nombre comercial" req />
                        <input type="text" placeholder="Como aparece en el mercado"
                          value={empresa.trade_name}
                          onChange={(e) => setEmpresa({ ...empresa, trade_name: e.target.value })}
                          className={inp} />
                      </label>

                      {/* Razón social */}
                      <label className="block">
                        <Lbl text="Razón social / Nombre legal" />
                        <input type="text" placeholder="Nombre jurídico registrado"
                          value={empresa.legal_name}
                          onChange={(e) => setEmpresa({ ...empresa, legal_name: e.target.value })}
                          className={inp} />
                      </label>

                      {/* NIT */}
                      <label className="block">
                        <Lbl text="NIT o número tributario" />
                        <input type="text" placeholder="Ej. 900.123.456-7"
                          value={empresa.nit}
                          onChange={(e) => setEmpresa({ ...empresa, nit: e.target.value })}
                          className={inp} />
                      </label>

                      {/* Sector */}
                      <label className="block">
                        <Lbl text="Sector / Categoría" req />
                        <div className="relative">
                          <select value={empresa.sector} onChange={(e) => setEmpresa({ ...empresa, sector: e.target.value })} className={sel}>
                            <option value="">Selecciona un sector…</option>
                            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-xs">▾</span>
                        </div>
                      </label>

                      {/* País + Ciudad en fila */}
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <Lbl text="País" req />
                          <div className="relative">
                            <select value={empresa.country} onChange={(e) => setEmpresa({ ...empresa, country: e.target.value })} className={sel}>
                              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted text-xs">▾</span>
                          </div>
                        </label>
                        <label className="block">
                          <Lbl text="Ciudad" req />
                          <input type="text" placeholder="Ciudad"
                            value={empresa.city}
                            onChange={(e) => setEmpresa({ ...empresa, city: e.target.value })}
                            className={inp} />
                        </label>
                      </div>

                      <div className="mt-2 flex flex-col gap-2">
                        <button type="button" disabled={!canSubmitEmpresa}
                          onClick={() => setStep('contacto')}
                          className="group flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-elev2 transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                          Continuar <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
                        </button>
                        <button type="button" onClick={() => setStep('email')}
                          className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-ink-muted hover:text-brand">
                          <ArrowLeftIcon size={12} /> Volver
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ── 4. CONTACTO ────────────────────────────────────── */}
                  {step === 'contacto' && (
                    <motion.div key="contacto"
                      initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
                      transition={{ duration: 0.22, ease: EASE_EMPHASIS }}
                      className="flex flex-col gap-4 px-6 py-5"
                    >
                      <CompanyBar name={companyDisplayName} email={email} />

                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                        Persona que gestiona este proceso
                      </p>

                      {/* Nombre */}
                      <label className="block">
                        <Lbl text="Nombre completo" req />
                        <input type="text" placeholder="Tu nombre completo"
                          value={contacto.name}
                          onChange={(e) => setContacto({ ...contacto, name: e.target.value })}
                          className={inp} />
                      </label>

                      {/* Cargo */}
                      <label className="block">
                        <Lbl text="Cargo" />
                        <div className="relative">
                          <select value={contacto.cargo} onChange={(e) => setContacto({ ...contacto, cargo: e.target.value })} className={sel}>
                            <option value="">Selecciona tu cargo…</option>
                            {CARGOS.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-xs">▾</span>
                        </div>
                      </label>

                      {/* WhatsApp */}
                      <label className="block">
                        <Lbl text="WhatsApp" req />
                        <input type="tel" placeholder="+57 300 000 0000"
                          value={contacto.whatsapp}
                          onChange={(e) => setContacto({ ...contacto, whatsapp: e.target.value })}
                          className={inp} />
                        <span className="mt-1 block text-[11px] text-ink-muted">
                          El equipo comercial se comunicará principalmente por WhatsApp.
                        </span>
                      </label>

                      {/* Notas */}
                      <label className="block">
                        <Lbl text="Notas adicionales" />
                        <textarea rows={2} placeholder="¿Algo relevante antes de que te contactemos?"
                          value={contacto.notes}
                          onChange={(e) => setContacto({ ...contacto, notes: e.target.value })}
                          className={inp} />
                      </label>

                      {submitError ? (
                        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
                      ) : null}

                      <div className="mt-2 flex flex-col gap-2">
                        <button type="button" disabled={!canSubmitContacto}
                          onClick={submitRequest}
                          className="group flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-elev2 transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                          Enviar postulación <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
                        </button>
                        <button type="button" onClick={() => setStep('empresa')}
                          className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-ink-muted hover:text-brand">
                          <ArrowLeftIcon size={12} /> Volver
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ── SUBMITTING ──────────────────────────────────────── */}
                  {step === 'submitting' && (
                    <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
                      <Loader2Icon size={36} className="animate-spin text-accent" />
                      <p className="text-sm font-medium text-ink-muted">Registrando tu postulación…</p>
                    </motion.div>
                  )}

                  {/* ── SUCCESS ─────────────────────────────────────────── */}
                  {step === 'success' && (
                    <motion.div key="success"
                      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, ease: EASE_EMPHASIS }}
                      className="flex flex-1 flex-col items-center gap-5 px-6 py-8"
                    >
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
                        className="mt-4 grid h-20 w-20 place-items-center rounded-full bg-emerald-50"
                      >
                        <CheckCircle2Icon size={40} className="text-emerald-500" />
                      </motion.span>

                      <div className="text-center">
                        <h3 className="text-xl font-bold text-brand">Postulación enviada</h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                          El equipo comercial revisará tu solicitud y se comunicará contigo pronto por WhatsApp o correo.
                        </p>
                      </div>

                      {/* Resumen */}
                      <div className="w-full rounded-2xl border border-line bg-canvas">
                        <div className="border-b border-line px-5 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">Resumen de postulación</p>
                        </div>
                        <div className="space-y-2.5 px-5 py-4">
                          <div className="flex justify-between gap-3 text-sm">
                            <span className="text-ink-muted">Evento</span>
                            <span className="text-right font-semibold text-brand">{activeEdition?.name}</span>
                          </div>
                          {selectedPlan && (
                            <div className="flex justify-between gap-3 text-sm">
                              <span className="text-ink-muted">Plan</span>
                              <span className="font-semibold text-brand capitalize">{selectedPlan}</span>
                            </div>
                          )}
                          <div className="flex justify-between gap-3 text-sm">
                            <span className="text-ink-muted">Empresa</span>
                            <span className="text-right font-semibold text-brand">{empresa.trade_name || query}</span>
                          </div>
                          {empresa.legal_name && (
                            <div className="flex justify-between gap-3 text-sm">
                              <span className="text-ink-muted">Razón social</span>
                              <span className="text-right font-semibold text-ink">{empresa.legal_name}</span>
                            </div>
                          )}
                          {empresa.nit && (
                            <div className="flex justify-between gap-3 text-sm">
                              <span className="text-ink-muted">NIT</span>
                              <span className="font-semibold text-ink">{empresa.nit}</span>
                            </div>
                          )}
                          {empresa.sector && (
                            <div className="flex justify-between gap-3 text-sm">
                              <span className="text-ink-muted">Sector</span>
                              <span className="font-semibold text-ink">{empresa.sector}</span>
                            </div>
                          )}
                          <div className="flex justify-between gap-3 text-sm">
                            <span className="text-ink-muted">Ciudad</span>
                            <span className="font-semibold text-ink">{empresa.city}, {empresa.country}</span>
                          </div>
                          <div className="border-t border-line pt-2.5">
                            <div className="flex justify-between gap-3 text-sm">
                              <span className="text-ink-muted">Contacto</span>
                              <span className="text-right font-semibold text-ink">{contacto.name}{contacto.cargo ? ` · ${contacto.cargo}` : ''}</span>
                            </div>
                            <div className="flex justify-between gap-3 text-sm">
                              <span className="text-ink-muted">Correo</span>
                              <span className="text-right text-xs text-ink">{email}</span>
                            </div>
                            {contacto.whatsapp && (
                              <div className="flex justify-between gap-3 text-sm">
                                <span className="text-ink-muted">WhatsApp</span>
                                <span className="font-semibold text-ink">{contacto.whatsapp}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <button type="button" onClick={closeForm}
                        className="w-full rounded-full border border-line py-3 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand">
                        Cerrar
                      </button>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Footer */}
              {step !== 'success' && step !== 'submitting' && step !== 'idle' && (
                <div className="shrink-0 border-t border-line px-6 py-3">
                  <p className="text-[11px] text-ink-muted">
                    La postulación no implica compromiso de pago. El equipo comercial confirma disponibilidad y condiciones antes de cualquier cobro.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {mapExpanded && floorPlanUrl && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
          style={{ background: 'rgba(10, 33, 64, 0.88)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Plano del evento ampliado"
          onClick={() => setMapExpanded(false)}
        >
          <button
            type="button"
            onClick={() => setMapExpanded(false)}
            className="absolute right-4 top-4 z-[10000] inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold shadow-lg"
            style={{ background: '#fff', color: '#0a2140' }}
          >
            <XIcon size={14} /> Cerrar
          </button>
          <img
            src={floorPlanUrl}
            alt="Plano de stands del evento"
            className="max-h-[80vh] max-w-[min(900px,92vw)] object-contain drop-shadow-lg"
          />
        </div>,
        document.body,
      )}
    </section>
  );
}
