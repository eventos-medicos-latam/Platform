import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2Icon, ClockIcon, MonitorPlayIcon, RadioIcon, UsersIcon } from 'lucide-react';
import type { SecondaryEvent, SecondaryEventKind } from '../../types/content';
import { PageTransition } from '../../components/motion/PageTransition';
import { DisplayTitle } from '../../components/ui/DisplayTitle';
import { DigitalCalendar } from '../../components/public/DigitalCalendar';
import { publicSecondaryEvents } from '../../data/content';
import { getEdition } from '../../data/editions';
import { Pending } from '../../components/ui/Pending';
import { media } from '../../data/media';
import { DURATION, EASE_EMPHASIS, cascadeChild, cascadeParent } from '../../utils/motion';
import { TrackIcon } from '../../components/ui/TrackIcon';
const kindLabels: Record<SecondaryEventKind, string> = {
  webinar: 'Webinar',
  conversatorio: 'Conversatorio',
  masterclass: 'Masterclass',
  curso: 'Curso',
  lanzamiento: 'Lanzamiento'
};
const filters: ('todos' | SecondaryEventKind)[] = ['todos', 'webinar', 'conversatorio', 'masterclass', 'lanzamiento'];
function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}
export function Digital() {
  const events = publicSecondaryEvents();
  const [params] = useSearchParams();
  const [filter, setFilter] = useState<'todos' | SecondaryEventKind>('todos');
  // Se puede llegar con una sesión ya elegida desde la Home: ?sesion=<id>
  const [selected, setSelected] = useState<SecondaryEvent | undefined>(() => {
    const requested = params.get('sesion');
    return events.find((event) => event.id === requested) ?? events[0];
  });
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    whatsapp: '',
    consent: false
  });
  const visible = useMemo(() => filter === 'todos' ? events : events.filter((event) => event.kind === filter), [events, filter]);
  const fieldClass = 'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-accent';
  const edition = selected?.relatedEditionId ? getEdition(selected.relatedEditionId) : undefined;
  const track = edition?.trackAxis.tracks.find((item) => item.id === selected?.trackId);
  const seatsLeft = selected?.seats !== null && selected?.seats !== undefined ? selected.seats - selected.registered : null;
  function submit(event: React.FormEvent) {
    event.preventDefault();
    setSent(true);
  }
  function pick(event: SecondaryEvent) {
    setSelected(event);
    setSent(false);
  }
  return <PageTransition>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-brand-deep text-white">
        <img src={media.stage} alt="" aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 -z-10" aria-hidden="true" style={{
        background: 'linear-gradient(180deg, rgba(10,33,64,0.9) 0%, rgba(10,33,64,0.78) 50%, rgba(10,33,64,0.98) 100%)'
      }} />
        <div className="grid-texture absolute inset-0 -z-10" aria-hidden="true" />

        <motion.div className="relative mx-auto max-w-shell px-6 py-16 lg:py-24" variants={cascadeParent()} initial="initial" animate="enter">
          <motion.p variants={cascadeChild} className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-accent">
            <RadioIcon size={15} /> Agenda digital
          </motion.p>
          <DisplayTitle as="h1" size="xl" surface="dark" animate={false} className="mt-5 max-w-4xl" parts={[{
          text: 'Formación en vivo',
          tone: 'bold'
        }, {
          text: 'todos los meses',
          tone: 'light'
        }]} />
          <motion.p variants={cascadeChild} className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            Webinars, conversatorios y masterclass en línea. Te inscribes una vez y recibes el enlace de
            la sala y los recordatorios por correo y WhatsApp.
          </motion.p>

          <motion.dl variants={cascadeChild} className="mt-10 flex flex-wrap gap-3">
            {[{
            label: 'Sesiones programadas',
            value: String(events.length)
          }, {
            label: 'Inscritos acumulados',
            value: String(events.reduce((total, item) => total + item.registered, 0))
          }, {
            label: 'Acceso',
            value: 'Sin costo'
          }].map((item) => <div key={item.label} className="glass-panel rounded-2xl px-5 py-3.5">
                <dd className="text-2xl font-bold text-white">{item.value}</dd>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
                  {item.label}
                </dt>
              </div>)}
          </motion.dl>
        </motion.div>
      </section>

      {/* Calendario + agenda */}
      <section className="tint-aurora">
        <div className="mx-auto max-w-shell px-6 py-14">
          {/* Los dos pasos del flujo, explícitos */}
          <ol className="mb-10 grid gap-4 sm:grid-cols-2">
            {[{
            n: 1,
            title: 'Elige una sesión',
            text: 'En el calendario o en la lista de la derecha.'
          }, {
            n: 2,
            title: 'Completa tu registro',
            text: 'El formulario aparece bajo el calendario con la sesión elegida.'
          }].map((step) => <li key={step.n} className="flex items-start gap-4 rounded-2xl border border-line bg-white/80 p-5 backdrop-blur">
                <span className="grad-futuro grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white">
                  {step.n}
                </span>
                <div>
                  <p className="font-semibold text-brand">{step.title}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">{step.text}</p>
                </div>
              </li>)}
          </ol>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.45fr] lg:items-start">
            {/* Columna izquierda: calendario y ficha */}
            <div className="space-y-6 lg:sticky lg:top-28">
              <DigitalCalendar events={events} selectedId={selected?.id} onSelect={pick} milestone={{
              dates: ['2027-04-23', '2027-04-24'],
              label: 'Hormobiota 2 · Congreso presencial',
              href: '/eventos/hormobiota/hormobiota-2-2027'
            }} />

              {selected ? <motion.div key={selected.id} initial={{
              opacity: 0,
              y: 10
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: DURATION.panel,
              ease: EASE_EMPHASIS
            }} className="overflow-hidden rounded-3xl border border-line bg-white shadow-elev3">
                  {/* Cabecera del paso 2: deja claro que aquí se registra */}
                  <div className="grad-futuro flex items-center gap-3 px-6 py-4 text-white">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20 text-xs font-bold">
                      2
                    </span>
                    <p className="text-sm font-semibold">
                      {sent ? 'Registro confirmado' : 'Completa tu registro a esta sesión'}
                    </p>
                  </div>

                  <div className="p-6">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-accent/12 px-3 py-1 text-xs font-semibold text-accent">
                      {kindLabels[selected.kind]}
                    </span>
                    {track ? <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                        <TrackIcon icon={track.icon} size={15} className="text-accent" />
                        {track.name}
                      </span> : null}
                  </div>

                  <h2 className="mt-4 text-xl font-bold leading-snug tracking-tight text-brand">
                    {selected.title}
                  </h2>
                  <p className="mt-1 text-sm capitalize text-ink-muted">
                    {formatDate(selected.date)}
                    {selected.time !== 'PENDIENTE' ? ` · ${selected.time}` : ''}
                  </p>

                  {selected.description ? <p className="mt-4 text-sm leading-relaxed text-ink">{selected.description}</p> : null}

                  <dl className="mt-5 divide-y divide-line border-y border-line">
                    {[{
                    label: 'Duración',
                    value: selected.durationMinutes ? `${selected.durationMinutes} minutos` : 'PENDIENTE'
                  }, {
                    label: 'Modalidad',
                    value: selected.modality
                  }, {
                    label: 'Ponente',
                    value: selected.speakerLabel
                  }, {
                    label: 'Cupos disponibles',
                    value: seatsLeft === null ? 'PENDIENTE' : String(seatsLeft)
                  }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
                        <dt className="text-sm text-ink-muted">{row.label}</dt>
                        <dd className="text-right text-sm font-semibold capitalize text-brand">
                          {row.value === 'PENDIENTE' ? <Pending /> : row.value}
                        </dd>
                      </div>)}
                  </dl>

                  {/* Registro */}
                  {sent ? <div className="mt-5 rounded-2xl bg-canvas p-5">
                      <CheckCircle2Icon size={24} className="text-emerald-600" />
                      <p className="mt-3 text-sm font-semibold text-brand">
                        Estás inscrito a «{selected.title}»
                      </p>
                      <p className="mt-1 text-sm text-ink-muted">
                        El enlace de la sala y los recordatorios llegan por correo y WhatsApp.
                      </p>
                    </div> : <form onSubmit={submit} className="mt-5">
                      <div className="grid gap-3">
                        <input required className={fieldClass} placeholder="Nombre completo" value={form.name} onChange={(event) => setForm({
                      ...form,
                      name: event.target.value
                    })} />
                        <input required type="email" className={fieldClass} placeholder="Correo" value={form.email} onChange={(event) => setForm({
                      ...form,
                      email: event.target.value
                    })} />
                        <input className={fieldClass} placeholder="WhatsApp" value={form.whatsapp} onChange={(event) => setForm({
                      ...form,
                      whatsapp: event.target.value
                    })} />
                      </div>
                      <label className="mt-3 flex items-start gap-2.5 text-xs text-ink">
                        <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-[color:var(--brand)]" checked={form.consent} onChange={(event) => setForm({
                      ...form,
                      consent: event.target.checked
                    })} />
                        Autorizo el tratamiento de mis datos para recibir el enlace de la sala y los
                        recordatorios.
                      </label>
                      <button type="submit" style={{
                    boxShadow: 'var(--elev-2), 0 0 30px rgb(var(--tone-futuro) / 0.22)'
                  }} className="grad-futuro mt-4 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                        Inscribirme gratis
                      </button>
                    </form>}
                  </div>
                </motion.div> : null}
            </div>

            {/* Columna derecha: próximas sesiones */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="grad-futuro grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white">
                  1
                </span>
                <h2 className="text-lg font-bold tracking-tight text-brand">
                  Próximas sesiones
                  <span className="font-normal text-ink-muted"> · elige una</span>
                </h2>
              </div>

              <div className="mb-5 flex flex-wrap gap-1.5">
                {filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition-colors duration-150 ease-emphasis ${filter === item ? 'bg-brand text-white shadow-elev2' : 'bg-white text-ink-muted shadow-elev1 hover:text-brand'}`}>
                    {item === 'todos' ? 'Todas' : kindLabels[item]}
                  </button>)}
              </div>

              <ul className="space-y-3">
                {visible.map((event, index) => {
                const isActive = event.id === selected?.id;
                const left = event.seats !== null ? event.seats - event.registered : null;
                const fill = event.seats && event.seats > 0 ? Math.min(event.registered / event.seats, 1) : 0;
                return <motion.li key={event.id} initial={{
                  opacity: 0,
                  y: 14
                }} whileInView={{
                  opacity: 1,
                  y: 0
                }} viewport={{
                  once: true,
                  margin: '-40px'
                }} transition={{
                  duration: 0.26,
                  ease: EASE_EMPHASIS,
                  delay: Math.min(index, 5) * 0.04
                }}>
                      <button type="button" onClick={() => pick(event)} style={isActive ? {
                    borderColor: '#a8419e',
                    boxShadow: 'var(--elev-3), 0 0 28px rgb(var(--tone-futuro) / 0.16)'
                  } : undefined} className={`card-lift block w-full rounded-2xl border bg-white p-5 text-left ${isActive ? '' : 'border-line'}`}>
                        <div className="flex flex-wrap items-start gap-4">
                          {/* Bloque de fecha */}
                          <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-xl text-white ${isActive ? 'grad-futuro' : ''}`} style={isActive ? undefined : {
                        backgroundColor: 'var(--hb-ink)'
                      }}>
                            <span className="text-xl font-bold leading-none tabular-nums">
                              {event.date.slice(8)}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
                              {new Date(Number(event.date.slice(0, 4)), Number(event.date.slice(5, 7)) - 1, 1).toLocaleDateString('es-CO', {
                            month: 'short'
                          }).replace('.', '')}
                            </span>
                          </div>

                          <div className="min-w-[200px] flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand">
                                {kindLabels[event.kind]}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                                <MonitorPlayIcon size={12} /> {event.modality}
                              </span>
                              {event.time !== 'PENDIENTE' ? <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                                  <ClockIcon size={12} /> {event.time}
                                </span> : null}
                            </div>
                            <h3 className="mt-2 text-base font-semibold leading-snug text-brand">
                              {event.title}
                            </h3>
                            {event.description ? <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                                {event.description}
                              </p> : null}

                            {left !== null ? <div className="mt-3 flex items-center gap-3">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-soft">
                                  <motion.div className="h-full rounded-full bg-accent" initial={{
                              scaleX: 0
                            }} whileInView={{
                              scaleX: fill
                            }} viewport={{
                              once: true
                            }} style={{
                              transformOrigin: 'left'
                            }} transition={{
                              duration: 0.3,
                              ease: EASE_EMPHASIS
                            }} />
                                </div>
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted">
                                  <UsersIcon size={12} /> {left} cupos
                                </span>
                              </div> : <p className="mt-3 text-[11px] font-medium text-amber-700">
                                Cupo por confirmar
                              </p>}
                          </div>
                        </div>
                      </button>
                    </motion.li>;
              })}
              </ul>

              <p className="mt-6 rounded-2xl border border-line bg-white p-5 text-sm text-ink-muted shadow-elev1">
                Tras el registro, el envío del enlace de la sala, los recordatorios y el certificado de
                asistencia se ejecutan de forma automática desde el CRM.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>;
}