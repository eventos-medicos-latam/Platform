import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckIcon, CreditCardIcon, PhoneCallIcon, SendIcon } from 'lucide-react';
import type { PlanId } from '../../types/participation';
import { participationPlans } from '../../data/plans';
import { countries, defaultCountry } from '../../data/countries';
import { supabase } from '../../lib/supabaseClient';

export type AllyRole = 'sociedad-medica' | 'aliado-academico' | 'media-partner';
export type SponsorType = PlanId | AllyRole;

const allyLabels: Record<AllyRole, string> = {
  'sociedad-medica': 'Sociedad médica o científica',
  'aliado-academico': 'Universidad o grupo de investigación',
  'media-partner': 'Medio especializado'
};
function isAllyRole(id: SponsorType): id is AllyRole {
  return id in allyLabels;
}
function portalExtraFor(id: SponsorType): string {
  if (id === 'protagonista') return 'Elegir puente temático y confirmar tu speaker';
  if (id === 'conexion') return 'Selección de stand';
  if (id === 'pop-up') return 'Confirmar tu espacio en el recinto';
  return 'Perfil institucional y acreditaciones';
}

const emptyForm = {
  contactName: '',
  role: '',
  company: '',
  nit: '',
  category: '',
  country: defaultCountry.name,
  city: '',
  contactEmail: '',
  dialCode: defaultCountry.dialCode,
  phone: ''
};

/**
 * Registro de patrocinio como sección de página (no popup): se muestra ya
 * con el tipo elegido en la vitrina de planes de arriba. Sin límite de
 * alto ni scroll interno propio — es una página normal, para que nunca se
 * corte ni bloquee el siguiente paso.
 */
export function SponsorRegistrationSection({ editionId, type }: { editionId: string; type: SponsorType | null }) {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'registro' | 'pago' | 'confirmacion'>('registro');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const returningFromPayment = searchParams.get('pago') === 'exitoso';

  useEffect(() => {
    if (returningFromPayment) setStep('confirmacion');
  }, [returningFromPayment]);

  useEffect(() => {
    if (type) {
      setStep('registro');
      setForm(emptyForm);
      setError(null);
      setRequestId(null);
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [type]);

  // Cada paso tiene una altura muy distinta (el formulario completo vs. la
  // tarjeta corta de pago/confirmación). Sin esto, al pasar de un paso a
  // otro el contenido de abajo "sube" y el usuario queda mirando una
  // sección random de la página, con el scroll apuntando a donde sea que
  // haya quedado el contenido tras encogerse.
  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  if (!type && !returningFromPayment) return null;

  const chosenPlan = type && !isAllyRole(type) ? participationPlans.find((plan) => plan.id === type) : undefined;
  const chosenLabel = chosenPlan?.name ?? (type && isAllyRole(type) ? allyLabels[type] : '');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!type) return;
    setSubmitting(true);
    setError(null);
    const { data, error: submitError } = await supabase.rpc('submit_plan_request', {
      p_edition_id: editionId,
      p_plan_id: isAllyRole(type) ? null : type,
      p_ally_role: isAllyRole(type) ? type : null,
      p_company: form.company,
      p_nit: form.nit || null,
      p_category: form.category || null,
      p_country: form.country || null,
      p_city: form.city || null,
      p_contact_name: form.role ? `${form.contactName} (${form.role})` : form.contactName,
      p_contact_email: form.contactEmail,
      p_contact_whatsapp: `${form.dialCode} ${form.phone}`.trim()
    });
    setSubmitting(false);
    if (submitError || !data) { setError('No pudimos enviar tu solicitud. Intenta de nuevo en un momento.'); return; }
    setRequestId(data);
    setStep(chosenPlan ? 'pago' : 'confirmacion');
  };

  const payWithWompi = async () => {
    if (!requestId || !chosenPlan) return;
    setSubmitting(true);
    setError(null);
    const reference = `HB-SPONSOR-${requestId}`;
    const amountInCents = Math.round(chosenPlan.price * 100);
    const [{ data: signatureData }, { data: publicSettings }] = await Promise.all([
    supabase.functions.invoke('wompi-create-signature', { body: { reference, amount_in_cents: amountInCents, currency: 'COP' } }),
    supabase.from('public_settings').select('key, value').eq('key', 'wompi_public_key')]
    );
    const publicKey = publicSettings?.[0]?.value;
    const signature = signatureData?.signature;
    setSubmitting(false);
    if (!signature || !publicKey) { setError('El pago en línea todavía no está disponible. Elige "prefiero que me contacten".'); return; }
    const redirectUrl = new URL(window.location.href);
    redirectUrl.searchParams.set('pago', 'exitoso');
    const checkoutUrl = new URL('https://checkout.wompi.co/p/');
    checkoutUrl.searchParams.set('public-key', publicKey);
    checkoutUrl.searchParams.set('currency', 'COP');
    checkoutUrl.searchParams.set('amount-in-cents', String(amountInCents));
    checkoutUrl.searchParams.set('reference', reference);
    checkoutUrl.searchParams.set('signature:integrity', signature);
    checkoutUrl.searchParams.set('redirect-url', redirectUrl.toString());
    window.location.href = checkoutUrl.toString();
  };

  const field = 'w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand';
  const label = 'mb-1.5 block text-sm font-semibold text-brand';

  return <section id="registro" ref={sectionRef} className="scroll-mt-24 tint-aurora border-t border-white/60">
      <div className="mx-auto max-w-2xl px-6 py-16 lg:py-20">

        {step === 'registro' ? <>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">Registro de participación</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-brand sm:text-3xl">{chosenLabel}</h2>
            {chosenPlan ? <p className="mt-1 text-lg font-semibold text-ink-muted">COP ${chosenPlan.price.toLocaleString('es-CO')}</p> : null}
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              Registro formal de tu empresa u organización para participar en {chosenLabel ? 'esta modalidad' : 'el evento'}. Los campos con * son obligatorios.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-6 rounded-3xl border border-line bg-white p-7 shadow-elev2 sm:p-9">

              <div>
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-brand-support">Datos de la empresa</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className={label}>Nombre de la empresa u organización *</span>
                    <input required className={field} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className={label}>NIT o identificación tributaria</span>
                    <input className={field} value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} placeholder="Si aplica en tu país" />
                  </label>
                  <label className="block">
                    <span className={label}>Categoría / sector</span>
                    <input className={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ej. Farmacéutica" />
                  </label>
                  <label className="block">
                    <span className={label}>País *</span>
                    <select required className={field} value={form.country} onChange={(e) => {
                    const match = countries.find((c) => c.name === e.target.value);
                    setForm({ ...form, country: e.target.value, dialCode: match?.dialCode ?? form.dialCode });
                  }}>
                      {countries.map((c) => <option key={c.iso} value={c.name}>{c.name}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className={label}>Ciudad *</span>
                    <input required className={field} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </label>
                </div>
              </div>

              <div className="border-t border-line pt-6">
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-brand-support">Persona encargada del registro</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={label}>Nombre del representante *</span>
                    <input required className={field} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className={label}>Cargo</span>
                    <input className={field} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ej. Gerente comercial" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={label}>Correo corporativo *</span>
                    <input required type="email" className={field} value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={label}>Teléfono / WhatsApp *</span>
                    <div className="flex gap-2">
                      <select required className={`${field} w-32 shrink-0`} value={form.dialCode} onChange={(e) => setForm({ ...form, dialCode: e.target.value })} aria-label="Código de país">
                        {countries.map((c) => <option key={c.iso} value={c.dialCode}>{c.dialCode} {c.iso !== 'XX' ? c.iso : ''}</option>)}
                      </select>
                      <input required type="tel" className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="300 000 0000" />
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-hb-violet/50 bg-hb-violet-soft/40 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-hb-violet-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-hb-violet-deep">Portal</span>
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-hb-violet-deep">Esto lo completas después, ya adentro</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {['Logo y activos de marca', 'Equipo y colaboradores', 'Documentos y contratos', portalExtraFor(type ?? 'pop-up')].map((item) => <span key={item} className="flex items-start gap-2 text-sm text-ink">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-hb-violet" />
                      {item}
                    </span>)}
                </div>
              </div>

              <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-muted">
                <input type="checkbox" required className="mt-1 h-4 w-4 rounded border-line text-brand focus:ring-brand" />
                Autorizo el tratamiento de mis datos para ser contactado sobre esta solicitud.
              </label>

              {error ? <p role="alert" className="text-sm font-medium text-rose-700">{error}</p> : null}

              <button type="submit" disabled={submitting} className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-elev2 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5 disabled:opacity-60">
                {submitting ? 'Enviando…' : 'Enviar solicitud'}
                <SendIcon size={15} className="transition-transform duration-200 ease-emphasis group-hover:translate-x-0.5" />
              </button>
            </form>
          </> : null}

        {step === 'pago' ? <div className="rounded-3xl border border-line bg-white p-7 shadow-elev2 sm:p-9">
            <h2 className="text-xl font-bold tracking-tight text-brand">Recibimos tu solicitud</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">¿Cómo prefieres continuar?</p>
            <div className="mt-6 space-y-3">
              <button type="button" disabled={submitting} onClick={payWithWompi} className="flex w-full items-center gap-3 rounded-2xl border-2 border-brand bg-brand-soft/40 p-4 text-left transition-transform duration-150 ease-emphasis hover:-translate-y-0.5 disabled:opacity-60">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white">
                  <CreditCardIcon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-brand">Pagar ahora con Wompi</span>
                  <span className="block text-xs text-ink-muted">Confirmas y quedas inscrito de inmediato.</span>
                </span>
              </button>
              <button type="button" onClick={() => setStep('confirmacion')} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left transition-colors duration-150 ease-emphasis hover:border-brand/40">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-canvas text-brand">
                  <PhoneCallIcon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-brand">Prefiero que se comuniquen conmigo</span>
                  <span className="block text-xs text-ink-muted">El equipo comercial te contacta para cerrar los detalles.</span>
                </span>
              </button>
            </div>
            {error ? <p role="alert" className="mt-4 text-sm font-medium text-rose-700">{error}</p> : null}
          </div> : null}

        {step === 'confirmacion' ? <div className="rounded-3xl border border-line bg-white p-7 text-center shadow-elev2 sm:p-9">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white">
              <CheckIcon size={26} strokeWidth={2.5} />
            </span>
            <h2 className="mt-5 text-xl font-bold tracking-tight text-brand">
              {returningFromPayment ? 'Pago recibido' : 'Solicitud enviada'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {returningFromPayment ? 'Confirmamos tu pago y tu participación queda registrada.' : 'Nuestro equipo comercial la revisa y te contacta en los próximos días hábiles.'}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Cuando quede aprobada, te llega el acceso a tu Portal para completar logo, equipo,
              documentos y todo lo demás.
            </p>
          </div> : null}
      </div>
    </section>;
}
