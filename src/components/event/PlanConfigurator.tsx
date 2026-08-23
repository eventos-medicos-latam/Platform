import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRightIcon, CheckCircle2Icon, CheckIcon, LockIcon, MapPinIcon, MicIcon } from 'lucide-react';
import type { Edition } from '../../types/event';
import type { PlanId, SpeakerChoice } from '../../types/participation';
import { bridgeStatus, categoriesForPlan, getPlan, participationPlans } from '../../data/plans';
import { getCompany } from '../../data/companies';
import { planFeatures, standsByEdition } from '../../data/sponsors';
import { StandMap } from './StandMap';
import { TrackIcon } from '../ui/TrackIcon';
import { formatCop } from '../../utils/format';
import { EASE_EMPHASIS } from '../../utils/motion';
interface PlanConfiguratorProps {
  edition: Edition;
  /** Plan preseleccionado desde las tarjetas superiores. */
  planId: PlanId | null;
  onPlanChange: (planId: PlanId) => void;
}
const field = 'w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis placeholder:text-ink-muted/70 focus:border-brand';
const speakerOptions: {
  id: SpeakerChoice;
  label: string;
  description: string;
}[] = [{
  id: 'propio',
  label: 'Tenemos nuestro speaker',
  description: 'La marca ya cuenta con el profesional que dictará el espacio.'
}, {
  id: 'propuesta',
  label: 'Proponemos un profesional',
  description: 'Presentamos un perfil de nuestra área de especialidad para revisión.'
}, {
  id: 'acompanamiento',
  label: 'Queremos acompañamiento',
  description: 'Hormobiota nos ayuda a identificar el profesional adecuado.'
}];

/**
 * Configurador de participación. El plan gobierna los pasos: el espacio se
 * filtra según lo que el plan habilita, y el puente y el speaker solo aparecen
 * cuando el plan los incluye.
 */
export function PlanConfigurator({
  edition,
  planId,
  onPlanChange
}: PlanConfiguratorProps) {
  const reduce = useReducedMotion();
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [speakerChoice, setSpeakerChoice] = useState<SpeakerChoice | null>(null);
  const [sent, setSent] = useState(false);
  const plan = planId ? getPlan(planId) : undefined;
  const allStands = standsByEdition(edition.id);

  // Solo se ofrecen los espacios que el plan permite.
  const eligible = useMemo(() => {
    if (!plan) return [];
    const allowed = categoriesForPlan(plan.id);
    return allStands.map((stand) => allowed.includes(stand.category) ? stand : {
      ...stand,
      status: 'no-disponible' as const
    });
  }, [allStands, plan]);
  const selectedSpace = eligible.find((stand) => stand.id === spaceId) ?? null;
  const availableCount = eligible.filter((stand) => stand.status === 'disponible').length;
  const steps = plan ? [{
    id: 'plan',
    label: 'Plan',
    done: true
  }, {
    id: 'espacio',
    label: plan.space === 'estacion' ? 'Estación' : 'Stand',
    done: !!spaceId
  }, ...(plan.includesBridge ? [{
    id: 'puente',
    label: 'Puente',
    done: !!trackId
  }] : []), ...(plan.includesSpeaker ? [{
    id: 'speaker',
    label: 'Speaker',
    done: !!speakerChoice
  }] : []), {
    id: 'datos',
    label: 'Tus datos',
    done: sent
  }] : [{
    id: 'plan',
    label: 'Plan',
    done: false
  }];
  function choosePlan(id: PlanId) {
    onPlanChange(id);
    setSpaceId(null);
    setTrackId(null);
    setSpeakerChoice(null);
    setSent(false);
  }
  const ready = !!plan && !!spaceId && (!plan.includesBridge || !!trackId) && (!plan.includesSpeaker || !!speakerChoice);
  return <div className="rounded-[2rem] border border-white bg-white/90 p-6 shadow-elev4 backdrop-blur sm:p-9">
      {/* Recorrido */}
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {steps.map((step, index) => <li key={step.id} className="flex items-center gap-2.5">
            <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-colors duration-200 ease-emphasis ${step.done ? 'grad-futuro text-white' : 'bg-brand-soft text-ink-muted'}`}>
              {step.done ? <CheckIcon size={15} /> : index + 1}
            </span>
            <span className={`text-sm ${step.done ? 'font-semibold text-brand' : 'text-ink-muted'}`}>
              {step.label}
            </span>
            {index < steps.length - 1 ? <span className="ml-1 hidden h-px w-6 bg-line sm:block" aria-hidden="true" /> : null}
          </li>)}
      </ol>

      {/* Paso 1 — Plan */}
      <div className="mt-8">
        <h3 className="text-lg font-bold tracking-tight text-brand">1 · Elige tu plan</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {participationPlans.map((item) => {
          const isActive = item.id === planId;
          const left = item.totalInventory === null ? null : item.totalInventory - item.sold;
          return <button key={item.id} type="button" onClick={() => choosePlan(item.id)} aria-pressed={isActive} className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-shadow duration-200 ease-emphasis ${isActive ? 'border-transparent shadow-elev3' : 'border-line bg-white shadow-elev1 hover:shadow-elev2'}`}>
                {isActive ? <span className="grad-futuro absolute inset-0" aria-hidden="true" /> : null}
                <span className="relative block">
                  <span className={`text-[11px] font-bold uppercase tracking-[0.16em] ${isActive ? 'text-white/80' : 'text-accent'}`}>
                    {item.verb}
                  </span>
                  <span className={`mt-1.5 block text-lg font-bold ${isActive ? 'text-white' : 'text-brand'}`}>
                    {item.name}
                  </span>
                  <span className={`mt-2 block text-xl font-bold tabular-nums ${isActive ? 'text-white' : 'text-brand'}`}>
                    {formatCop(item.price)}
                  </span>
                  <span className={`mt-2 block text-xs ${isActive ? 'text-white/75' : 'text-ink-muted'}`}>
                    {left !== null ? `${left} cupos disponibles` : item.availabilityNote}
                  </span>
                </span>
              </button>;
        })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {plan ? <motion.div key={plan.id} initial={reduce ? undefined : {
        opacity: 0,
        y: 16
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={reduce ? undefined : {
        opacity: 0,
        y: -10
      }} transition={{
        duration: 0.26,
        ease: EASE_EMPHASIS
      }}>
            {/* Paso 2 — Espacio */}
            <div className="mt-10 border-t border-line pt-8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-lg font-bold tracking-tight text-brand">
                  2 · Elige tu {plan.space === 'estacion' ? 'estación' : 'stand'}
                </h3>
                <p className="text-sm text-ink-muted">
                  <span className="font-semibold text-brand">{availableCount}</span> disponibles
                  para {plan.name}
                </p>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                {plan.space === 'estacion' ? 'El plan Pop Up ocupa estaciones compactas en la zona de exhibición. Los stands de foyer no aplican a este plan.' : 'Este plan da derecho a un stand en el foyer. Las estaciones compactas del Pop Up no aplican.'}
              </p>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                <StandMap stands={eligible} features={planFeatures} highlightCategory={plan.space === 'estacion' ? 'Pop Up' : 'Stand'} selectedId={spaceId ?? undefined} onSelect={(stand) => setSpaceId(stand.id)} />

                <div className="rounded-2xl border border-line bg-canvas p-5">
                  {selectedSpace ? <>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                        {selectedSpace.category}
                      </p>
                      <p className="mt-1.5 text-xl font-bold text-brand">
                        {plan.space === 'estacion' ? 'Estación' : 'Stand'} {selectedSpace.number}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                        <MapPinIcon size={14} /> {selectedSpace.location}
                      </p>
                      <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm text-ink">
                        {selectedSpace.benefits.map((benefit) => <li key={benefit} className="flex items-start gap-2">
                            <CheckIcon size={15} className="mt-0.5 shrink-0 text-accent" />
                            {benefit}
                          </li>)}
                      </ul>
                      {selectedSpace.companyId ? <p className="mt-4 text-xs text-ink-muted">
                          Ocupado por {getCompany(selectedSpace.companyId)?.tradeName}
                        </p> : null}
                    </> : <p className="text-sm leading-relaxed text-ink-muted">
                      Toca un módulo iluminado del plano para reservar su ubicación. Los módulos
                      apagados no corresponden a este plan o ya están tomados.
                    </p>}
                </div>
              </div>
            </div>

            {/* Paso 3 — Puente */}
            {plan.includesBridge ? <div className="mt-10 border-t border-line pt-8">
                <h3 className="text-lg font-bold tracking-tight text-brand">
                  3 · Elige tu puente temático
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                  El Protagonista asocia el nombre de la marca a un puente —«El puente al sistema
                  GI, presentado por tu marca»— con exclusividad de una sola marca. La asignación
                  final queda sujeta a validación del Comité Científico según la categoría del
                  producto.
                </p>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {edition.trackAxis.tracks.map((track) => {
              const status = bridgeStatus(track.id);
              const taken = status.status !== 'disponible';
              const isActive = track.id === trackId;
              return <li key={track.id}>
                        <button type="button" disabled={taken} onClick={() => setTrackId(track.id)} aria-pressed={isActive} className={`relative flex h-full w-full items-start gap-3 overflow-hidden rounded-2xl border p-4 text-left transition-shadow duration-200 ease-emphasis ${taken ? 'cursor-not-allowed border-line bg-canvas opacity-60' : isActive ? 'border-transparent shadow-elev3' : 'border-line bg-white shadow-elev1 hover:shadow-elev2'}`}>
                          {isActive && !taken ? <span className="grad-futuro absolute inset-0" aria-hidden="true" /> : null}
                          <span className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl ${isActive && !taken ? 'bg-white/20 text-white' : 'bg-accent/10 text-accent'}`}>
                            {taken ? <LockIcon size={19} /> : <TrackIcon icon={track.icon} size={22} />}
                          </span>
                          <span className="relative">
                            <span className={`block text-sm font-bold leading-snug ${isActive && !taken ? 'text-white' : 'text-brand'}`}>
                              {track.name}
                            </span>
                            <span className={`mt-1 block text-xs ${isActive && !taken ? 'text-white/80' : 'text-ink-muted'}`}>
                              {taken ? status.status === 'confirmado' ? 'Puente tomado' : 'Reservado, en negociación' : 'Disponible'}
                            </span>
                          </span>
                        </button>
                      </li>;
            })}
                </ul>
              </div> : null}

            {/* Paso 4 — Speaker */}
            {plan.includesSpeaker ? <div className="mt-10 border-t border-line pt-8">
                <h3 className="text-lg font-bold tracking-tight text-brand">
                  4 · Tu speaker en el espacio académico
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                  Toda participación académica queda sujeta a revisión y aprobación del Comité
                  Científico.
                </p>
                <ul className="mt-5 grid gap-3 md:grid-cols-3">
                  {speakerOptions.map((option) => {
              const isActive = option.id === speakerChoice;
              return <li key={option.id}>
                        <button type="button" onClick={() => setSpeakerChoice(option.id)} aria-pressed={isActive} className={`relative h-full w-full overflow-hidden rounded-2xl border p-5 text-left transition-shadow duration-200 ease-emphasis ${isActive ? 'border-transparent shadow-elev3' : 'border-line bg-white shadow-elev1 hover:shadow-elev2'}`}>
                          {isActive ? <span className="grad-futuro absolute inset-0" aria-hidden="true" /> : null}
                          <span className="relative block">
                            <MicIcon size={20} className={isActive ? 'text-white' : 'text-accent'} />
                            <span className={`mt-3 block text-sm font-bold ${isActive ? 'text-white' : 'text-brand'}`}>
                              {option.label}
                            </span>
                            <span className={`mt-1.5 block text-xs leading-relaxed ${isActive ? 'text-white/80' : 'text-ink-muted'}`}>
                              {option.description}
                            </span>
                          </span>
                        </button>
                      </li>;
            })}
                </ul>
              </div> : null}

            {/* Paso final — Datos y resumen */}
            <div className="mt-10 border-t border-line pt-8">
              <h3 className="text-lg font-bold tracking-tight text-brand">
                {plan.includesSpeaker ? '5' : plan.includesBridge ? '4' : '3'} · Crea el perfil de
                tu marca
              </h3>

              <div className="mt-5 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                {sent ? <div className="rounded-2xl border border-line bg-canvas p-7">
                    <CheckCircle2Icon size={28} className="text-emerald-600" />
                    <p className="mt-4 text-lg font-bold text-brand">
                      Perfil creado y solicitud enviada
                    </p>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
                      El equipo comercial recibió la notificación y confirma disponibilidad. Cuando
                      el acuerdo quede cerrado, recibirás el acceso a tu Portal de marca, donde
                      podrás autogestionar colaboradores, invitados, activos de marca, documentos y
                      pagos.
                    </p>
                  </div> : <form className="grid gap-3" onSubmit={(event) => {
              event.preventDefault();
              setSent(true);
            }}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input required className={field} placeholder="Razón social" />
                      <input required className={field} placeholder="NIT" />
                    </div>
                    <input required className={field} placeholder="Categoría del producto" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input required className={field} placeholder="Persona de contacto" />
                      <input required className={field} placeholder="Cargo" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input required type="email" className={field} placeholder="Correo corporativo" />
                      <input required className={field} placeholder="WhatsApp" />
                    </div>
                    <textarea rows={3} className={`resize-y ${field}`} placeholder="Objetivo comercial de la participación (opcional)." />
                    <label className="flex items-start gap-2.5 text-xs leading-relaxed text-ink">
                      <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-[color:var(--brand)]" />
                      Autorizo el tratamiento de mis datos para gestionar esta participación.
                    </label>
                    <button type="submit" disabled={!ready} className="grad-futuro mt-2 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-elev2 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0">
                      Crear perfil y enviar solicitud
                      <ArrowRightIcon size={16} />
                    </button>
                    {!ready ? <p className="text-xs text-ink-muted">
                        Completa los pasos anteriores para habilitar el envío.
                      </p> : null}
                  </form>}

                {/* Resumen vivo */}
                <aside className="h-fit rounded-2xl border border-line bg-canvas p-6 lg:sticky lg:top-28">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                    Tu participación
                  </p>
                  <dl className="mt-4 divide-y divide-line text-sm">
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-ink-muted">Plan</dt>
                      <dd className="text-right font-semibold text-brand">{plan.name}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-ink-muted">
                        {plan.space === 'estacion' ? 'Estación' : 'Stand'}
                      </dt>
                      <dd className="text-right font-semibold text-brand">
                        {selectedSpace ? `N.º ${selectedSpace.number}` : 'Sin elegir'}
                      </dd>
                    </div>
                    {plan.includesBridge ? <div className="flex items-baseline justify-between gap-4 py-2.5">
                        <dt className="text-ink-muted">Puente</dt>
                        <dd className="text-right font-semibold text-brand">
                          {trackId ? edition.trackAxis.tracks.find((t) => t.id === trackId)?.name : 'Sin elegir'}
                        </dd>
                      </div> : null}
                    {plan.includesSpeaker ? <div className="flex items-baseline justify-between gap-4 py-2.5">
                        <dt className="text-ink-muted">Speaker</dt>
                        <dd className="text-right font-semibold text-brand">
                          {speakerChoice ? speakerOptions.find((o) => o.id === speakerChoice)?.label : 'Sin definir'}
                        </dd>
                      </div> : null}
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-ink-muted">Colaboradores</dt>
                      <dd className="text-right font-semibold text-brand">{plan.maxStaff}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-ink-muted">Invitados profesionales</dt>
                      <dd className="text-right font-semibold text-brand">
                        {plan.guestPasses > 0 ? plan.guestPasses : '—'}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 border-t border-line pt-4 text-2xl font-bold tabular-nums text-brand">
                    {formatCop(plan.price)}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Valor antes de IVA. No se realiza pago en línea: el equipo comercial confirma
                    disponibilidad y emite la propuesta formal.
                  </p>
                </aside>
              </div>
            </div>
          </motion.div> : null}
      </AnimatePresence>
    </div>;
}