import React, { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2Icon, CreditCardIcon, LoaderIcon, QrCodeIcon } from 'lucide-react';
import type { Edition } from '../../types/event';
import { PageTransition } from '../../components/motion/PageTransition';
import { EventPageHeader } from '../../components/event/EventPageHeader';
import { media } from '../../data/media';
import { formatCop, withVat } from '../../utils/format';
import { Pending } from '../../components/ui/Pending';
import { supabase } from '../../lib/supabaseClient';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';

interface DbTicket {
  id: string;
  name: string;
  price: number | null;
  vat_rate: number;
}
type Step = 'datos' | 'orden' | 'pasarela' | 'confirmado';
const steps: {
  id: Step;
  label: string;
}[] = [{
  id: 'datos',
  label: 'Tus datos'
}, {
  id: 'orden',
  label: 'Resumen de la orden'
}, {
  id: 'pasarela',
  label: 'Pago con Wompi'
}, {
  id: 'confirmado',
  label: 'Confirmación y QR'
}];
export function EventRegistration() {
  const {
    edition
  } = useOutletContext<{
    edition: Edition;
  }>();
  const [params] = useSearchParams();
  const [tickets, setTickets] = useState<DbTicket[]>([]);
  const [ticketId, setTicketId] = useState(params.get('ticket') ?? '');
  useEffect(() => {
    supabase
      .from('tickets')
      .select('id, name, price, vat_rate')
      .eq('edition_id', edition.id)
      .then(({ data }) => {
        setTickets(data ?? []);
        if (!ticketId && data && data.length > 0) setTicketId(data[0].id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edition.id]);
  const [step, setStep] = useState<Step>('datos');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    city: '',
    specialty: '',
    trackInterestId: edition.trackAxis.tracks[0]?.id ?? '',
    consentData: false,
    consentCommercial: false
  });
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const ticket = tickets.find((item) => item.id === ticketId);
  const amount = ticket ? withVat(ticket.price, ticket.vat_rate) : null;
  const fieldClass = 'w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand';
  const submitData = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ticket) {
      setError('No hay tickets publicados todavía para esta edición.');
      return;
    }
    if (!form.fullName.trim() || !form.email.trim() || !form.consentData) {
      setError('Completa nombre, correo y autoriza el tratamiento de datos.');
      return;
    }
    setError('');
    setStep('orden');
  };
  const pay = async () => {
    setStep('pasarela');
    const reference = `HB-REG-${crypto.randomUUID()}`;

    const { data, error: insertError } = await supabase
      .from('registrations')
      .insert({
        edition_id: edition.id,
        ticket_id: ticketId,
        full_name: form.fullName,
        email: form.email,
        whatsapp: form.whatsapp,
        city: form.city,
        specialty: form.specialty,
        track_interest_id: form.trackInterestId || null,
        modality: 'presencial',
        amount,
        payment_status: 'pending',
        wompi_reference: amount === null ? null : reference,
        source: `inscripcion-${edition.slug}`,
        consent_commercial: form.consentCommercial
      })
      .select('qr_code')
      .single();

    if (insertError || !data) {
      setError('No pudimos completar tu inscripción. Intenta de nuevo.');
      setStep('orden');
      return;
    }

    setQrCode(data.qr_code);

    if (amount !== null) {
      const [{ data: signatureData }, { data: publicSettings }] = await Promise.all([
        supabase.functions.invoke('wompi-create-signature', {
          body: { reference, amount_in_cents: Math.round(amount * 100), currency: 'COP' }
        }),
        supabase.from('public_settings').select('key, value').eq('key', 'wompi_public_key')
      ]);
      const publicKey = publicSettings?.[0]?.value;
      const signature = (signatureData as { signature?: string } | null)?.signature;
      if (signature && publicKey) {
        const checkoutUrl = new URL('https://checkout.wompi.co/p/');
        checkoutUrl.searchParams.set('public-key', publicKey);
        checkoutUrl.searchParams.set('currency', 'COP');
        checkoutUrl.searchParams.set('amount-in-cents', String(Math.round(amount * 100)));
        checkoutUrl.searchParams.set('reference', reference);
        checkoutUrl.searchParams.set('signature:integrity', signature);
        checkoutUrl.searchParams.set('redirect-url', window.location.href);
        window.location.href = checkoutUrl.toString();
        return;
      }
    }

    setStep('confirmado');
  };
  const activeIndex = steps.findIndex((item) => item.id === step);
  return <PageTransition>
      <EventPageHeader eyebrow="Inscripción" image={media.networking} parts={[{
      text: 'Reserva tu lugar en',
      tone: 'light'
    }, {
      text: edition.name,
      tone: 'bold'
    }]} lead={`${edition.dateLabel} · ${edition.venue.name}, ${edition.venue.city}. Completa el registro y recibe tu código QR de acceso.`}>
        {/* Progreso */}
        <ol className="flex flex-wrap gap-x-3 gap-y-3">
          {steps.map((item, index) => {
          const done = index <= activeIndex;
          return <li key={item.id} className="flex items-center gap-2.5">
                <span className={`relative grid h-8 w-8 place-items-center overflow-hidden rounded-full text-xs font-bold transition-colors duration-200 ease-emphasis ${done ? 'text-white' : 'bg-white/10 text-white/50'}`}>
                  {done ? <motion.span layoutId={`reg-step-${item.id}`} className="grad-futuro absolute inset-0" transition={{
                duration: 0.2
              }} /> : null}
                  <span className="relative">{index + 1}</span>
                </span>
                <span className={`text-sm ${index === activeIndex ? 'font-semibold text-white' : 'text-white/55'}`}>
                  {item.label}
                </span>
                {index < steps.length - 1 ? <span className="ml-1 hidden h-px w-8 bg-white/20 sm:block" aria-hidden="true" /> : null}
              </li>;
        })}
        </ol>
      </EventPageHeader>

      <section className="tint-aurora">
        <div className="mx-auto max-w-shell px-6 py-14 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl border border-white bg-white/90 p-8 shadow-elev3 backdrop-blur lg:p-10">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{
                opacity: 0,
                y: 10
              }} animate={{
                opacity: 1,
                y: 0
              }} exit={{
                opacity: 0,
                y: -8
              }} transition={{
                duration: DURATION.panel,
                ease: EASE_EMPHASIS
              }}>
                  {step === 'datos' ? <form onSubmit={submitData}>
                      <h2 className="text-xl font-bold tracking-tight text-brand">Tus datos</h2>
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                            Nombre completo
                          </span>
                          <input className={fieldClass} value={form.fullName} onChange={(event) => setForm({
                        ...form,
                        fullName: event.target.value
                      })} autoComplete="name" />
                        </label>
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-medium text-ink-muted">Correo</span>
                          <input type="email" className={fieldClass} value={form.email} onChange={(event) => setForm({
                        ...form,
                        email: event.target.value
                      })} autoComplete="email" />
                        </label>
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                            WhatsApp
                          </span>
                          <input className={fieldClass} value={form.whatsapp} onChange={(event) => setForm({
                        ...form,
                        whatsapp: event.target.value
                      })} autoComplete="tel" />
                        </label>
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-medium text-ink-muted">Ciudad</span>
                          <input className={fieldClass} value={form.city} onChange={(event) => setForm({
                        ...form,
                        city: event.target.value
                      })} />
                        </label>
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                            Especialidad
                          </span>
                          <input className={fieldClass} value={form.specialty} onChange={(event) => setForm({
                        ...form,
                        specialty: event.target.value
                      })} />
                        </label>
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                            {edition.trackAxis.label} de mayor interés
                          </span>
                          <select className={fieldClass} value={form.trackInterestId} onChange={(event) => setForm({
                        ...form,
                        trackInterestId: event.target.value
                      })}>
                            {edition.trackAxis.tracks.map((track) => <option key={track.id} value={track.id}>
                                {track.name}
                              </option>)}
                          </select>
                        </label>
                      </div>

                      <div className="mt-6 space-y-3 border-t border-line pt-5">
                        <label className="flex items-start gap-3 text-sm text-ink">
                          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[color:var(--brand)]" checked={form.consentData} onChange={(event) => setForm({
                        ...form,
                        consentData: event.target.checked
                      })} />
                          Autorizo el tratamiento de mis datos personales conforme a la política de
                          privacidad y Habeas Data.
                        </label>
                        <label className="flex items-start gap-3 text-sm text-ink">
                          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[color:var(--brand)]" checked={form.consentCommercial} onChange={(event) => setForm({
                        ...form,
                        consentCommercial: event.target.checked
                      })} />
                          Quiero recibir comunicaciones comerciales de eventos y aliados (opcional).
                        </label>
                      </div>

                      {error ? <p role="alert" className="mt-4 text-sm font-medium text-rose-700">
                          {error}
                        </p> : null}

                      <button type="submit" className="mt-6 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
                        Continuar
                      </button>
                    </form> : null}

                  {step === 'orden' ? <div>
                      <h2 className="text-xl font-bold tracking-tight text-brand">
                        Resumen de la orden
                      </h2>
                      <dl className="mt-6 divide-y divide-line rounded-xl border border-line">
                        {[{
                      label: 'Asistente',
                      value: form.fullName
                    }, {
                      label: 'Correo',
                      value: form.email
                    }, {
                      label: 'Ticket',
                      value: ticket?.name ?? '—'
                    }, {
                      label: 'Valor',
                      value: amount === null ? 'PENDIENTE' : formatCop(amount)
                    }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3">
                            <dt className="text-sm text-ink-muted">{row.label}</dt>
                            <dd className="text-sm font-medium text-brand">
                              {row.value === 'PENDIENTE' ? <Pending /> : row.value}
                            </dd>
                          </div>)}
                      </dl>
                      <p className="mt-4 text-sm text-ink-muted">
                        {amount === null ? 'La tarifa aún no está aprobada: quedarás en lista de preventa y te avisaremos al publicarse.' : 'Serás redirigido a Wompi para completar el pago de forma segura.'}
                      </p>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button type="button" onClick={pay} className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
                          <CreditCardIcon size={16} />
                          {amount === null ? 'Reservar mi lugar' : 'Pagar con Wompi'}
                        </button>
                        <button type="button" onClick={() => setStep('datos')} className="rounded-lg border border-line px-5 py-3 text-sm font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand/40">
                          Volver
                        </button>
                      </div>
                    </div> : null}

                  {step === 'pasarela' ? <div className="py-8 text-center">
                      <LoaderIcon size={28} className="mx-auto animate-spin text-brand-support" />
                      <h2 className="mt-5 text-lg font-semibold text-brand">
                        Procesando con Wompi
                      </h2>
                      <p className="mt-2 text-sm text-ink-muted">
                        No cierres esta ventana. Estamos confirmando la transacción.
                      </p>
                    </div> : null}

                  {step === 'confirmado' ? <div>
                      <CheckCircle2Icon size={30} className="text-emerald-600" />
                      <h2 className="mt-4 text-xl font-bold tracking-tight text-brand">
                        {amount === null ? 'Lugar reservado' : 'Inscripción confirmada'}
                      </h2>
                      <p className="mt-2 max-w-lg text-sm text-ink">
                        {amount === null ? 'Te avisaremos por correo y WhatsApp en el momento en que se publiquen las tarifas.' : 'Recibirás tu ticket y el código QR de acceso por correo.'}
                      </p>
                      <div className="mt-6 flex items-center gap-4 rounded-xl border border-line bg-canvas p-5">
                        <QrCodeIcon size={40} className="text-brand" />
                        <div>
                          <p className="text-sm font-semibold text-brand">Código de acceso</p>
                          <p className="text-xs text-ink-muted">
                            {qrCode || 'Se emite al aprobarse el pago y se valida en el check-in.'}
                          </p>
                        </div>
                      </div>
                    </div> : null}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Selección de ticket */}
            <aside className="rounded-2xl border border-line bg-white p-6">
              <h2 className="text-sm font-semibold text-brand">Elige tu ticket</h2>
              <ul className="mt-4 space-y-2.5">
                {tickets.map((item) => {
                const final = withVat(item.price, item.vat_rate);
                return <li key={item.id}>
                      <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors duration-150 ease-emphasis ${item.id === ticketId ? 'border-brand bg-canvas' : 'border-line hover:border-brand/40'}`}>
                        <input type="radio" name="ticket" className="mt-1 h-4 w-4 accent-[color:var(--brand)]" checked={item.id === ticketId} onChange={() => setTicketId(item.id)} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-brand">{item.name}</span>
                          <span className="mt-0.5 block text-xs text-ink-muted">
                            {final === null ? 'Tarifa PENDIENTE' : formatCop(final)}
                          </span>
                        </span>
                      </label>
                    </li>;
              })}
              </ul>
              <p className="mt-5 border-t border-line pt-4 text-xs text-ink-muted">
                Los datos se envían al CRM con la fuente, el evento y tu interés temático para
                personalizar la comunicación.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </PageTransition>;
}