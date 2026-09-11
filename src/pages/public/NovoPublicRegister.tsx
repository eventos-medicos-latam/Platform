import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { PageTransition } from '../../components/motion/PageTransition';
import { formatCurrency, getEventBySlug } from '../../lib/novo/events';
import {
  fetchWompiTicketReceipt,
  listPublicTickets,
  registerPublicTicket,
  type EventTicketRow,
  type WompiTicketReceipt,
} from '../../lib/novo/tickets';
import { supabase } from '../../lib/supabaseClient';
import { buildWompiCheckoutUrl } from '../../lib/wompi';
import type { NovoEvent } from '../../types/novo';

export function NovoPublicRegister() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const wompiId = params.get('id');
  const wompiEnv = params.get('env');
  const [event, setEvent] = useState<NovoEvent | null>(null);
  const [tickets, setTickets] = useState<EventTicketRow[]>([]);
  const [ticketId, setTicketId] = useState(params.get('ticket') ?? '');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    audience: '' as '' | 'paciente' | 'profesional',
    specialty: '',
    consent: false,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ qr: string; name: string; paid: boolean } | null>(null);
  const [receipt, setReceipt] = useState<WompiTicketReceipt | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(Boolean(wompiId));

  useEffect(() => {
    if (!slug) return;
    getEventBySlug(slug).then(async (found) => {
      if (!found) return;
      setEvent(found);
      const list = await listPublicTickets(found.id).catch(() => []);
      setTickets(list);
      if (!ticketId && list[0]) setTicketId(list[0].id);
    }).catch(() => setError('No se pudo cargar el evento.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!wompiId) return;
    let alive = true;
    setReceiptLoading(true);
    fetchWompiTicketReceipt(wompiId, wompiEnv)
      .then((data) => {
        if (alive) setReceipt(data);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'No se pudo cargar el comprobante de Wompi.');
        setReceipt({
          wompi_id: wompiId,
          status: 'RETURNED',
          status_label: 'Volviste de Wompi',
          approved: false,
          amount: 0,
          currency: 'COP',
          reference: '',
          email: null,
          payment_method_label: null,
          card_last_four: null,
          ticket_name: tickets.find((item) => item.id === ticketId)?.name ?? null,
          person_name: null,
          qr_token: null,
          event_name: null,
        });
      })
      .finally(() => {
        if (alive) setReceiptLoading(false);
      });
    return () => { alive = false; };
  }, [wompiId, wompiEnv]);

  const ticket = tickets.find((item) => item.id === ticketId);
  const fieldClass = 'w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand';

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!event || !ticket) {
      setError('Selecciona un tipo de entrada.');
      return;
    }
    if (!form.full_name.trim() || !form.email.trim() || !form.consent) {
      setError('Completa nombre, correo y autoriza el tratamiento de datos.');
      return;
    }
    if (!form.audience) {
      setError('Indica si eres paciente o profesional de la salud.');
      return;
    }
    if (form.audience === 'profesional' && !form.specialty.trim()) {
      setError('Indica tu especialidad.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await registerPublicTicket({
        event_id: event.id,
        ticket_type_id: ticket.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        specialty: form.audience === 'profesional' ? form.specialty : '',
        classification: form.audience,
      });
      if (result.needs_payment && result.wompi_reference && result.amount > 0) {
        const [{ data: signatureData }, { data: publicSettings }] = await Promise.all([
          supabase.functions.invoke('wompi-create-signature', {
            body: { reference: result.wompi_reference, amount_in_cents: Math.round(result.amount * 100), currency: 'COP' },
          }),
          supabase.from('public_settings').select('key, value').eq('key', 'wompi_public_key'),
        ]);
        const publicKey = publicSettings?.[0]?.value;
        const signature = (signatureData as { signature?: string } | null)?.signature;
        if (signature && publicKey) {
          const returnTo = new URL(`${window.location.origin}/e/${event.slug}/inscripcion`);
          returnTo.searchParams.set('ticket', ticket.id);
          window.location.href = buildWompiCheckoutUrl({
            publicKey,
            amountInCents: Math.round(result.amount * 100),
            reference: result.wompi_reference,
            signature,
            redirectUrl: returnTo.toString(),
          });
          return;
        }
        setError('La inscripción quedó en espera: no se pudo abrir Wompi. Un admin puede confirmar el pago.');
      }
      setDone({ qr: result.qr_token, name: result.ticket_name, paid: !result.needs_payment });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la inscripción.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!event) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-shell px-6 py-24 text-center text-sm text-ink-muted">Cargando inscripción…</div>
      </PageTransition>
    );
  }

  if (wompiId && receiptLoading) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-xl px-6 py-24 text-center text-sm text-ink-muted">
          Confirmando tu pago con Wompi…
        </div>
      </PageTransition>
    );
  }

  if (receipt) {
    const method = receipt.card_last_four
      ? `${receipt.payment_method_label ?? 'Tarjeta'} ···· ${receipt.card_last_four}`
      : receipt.payment_method_label;
    return (
      <PageTransition>
        <div className="mx-auto max-w-xl px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">
            {receipt.event_name || event.name}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-ink">{receipt.status_label}</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {receipt.approved
              ? 'Guarda este comprobante. Tu código QR es el acceso al evento.'
              : receipt.status === 'RETURNED'
                ? 'Wompi te devolvió a esta página. Conserva el id de transacción; el equipo puede confirmar el cupo con ese dato.'
                : 'Wompi devolvió este estado. Si el cobro no se completó, puedes intentar de nuevo.'}
          </p>

          <dl className="mt-8 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white text-sm">
            {receipt.person_name ? (
              <div className="flex justify-between gap-4 px-5 py-3">
                <dt className="text-ink-muted">Nombre</dt>
                <dd className="font-semibold text-ink">{receipt.person_name}</dd>
              </div>
            ) : null}
            {(receipt.ticket_name || ticket?.name) ? (
              <div className="flex justify-between gap-4 px-5 py-3">
                <dt className="text-ink-muted">Entrada</dt>
                <dd className="font-semibold text-ink">{receipt.ticket_name || ticket?.name}</dd>
              </div>
            ) : null}
            {receipt.amount > 0 ? (
              <div className="flex justify-between gap-4 px-5 py-3">
                <dt className="text-ink-muted">Valor</dt>
                <dd className="font-semibold text-ink">{formatCurrency(receipt.amount)}</dd>
              </div>
            ) : null}
            {method ? (
              <div className="flex justify-between gap-4 px-5 py-3">
                <dt className="text-ink-muted">Medio</dt>
                <dd className="font-semibold text-ink">{method}</dd>
              </div>
            ) : null}
            {receipt.email ? (
              <div className="flex justify-between gap-4 px-5 py-3">
                <dt className="text-ink-muted">Correo</dt>
                <dd className="truncate font-semibold text-ink">{receipt.email}</dd>
              </div>
            ) : null}
            {receipt.reference ? (
              <div className="flex justify-between gap-4 px-5 py-3">
                <dt className="text-ink-muted">Referencia</dt>
                <dd className="break-all font-mono text-xs text-ink">{receipt.reference}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 px-5 py-3">
              <dt className="text-ink-muted">Transacción</dt>
              <dd className="break-all font-mono text-xs text-ink">{receipt.wompi_id}</dd>
            </div>
          </dl>

          {receipt.approved && receipt.qr_token ? (
            <p className="mt-6 break-all rounded-2xl border border-line bg-canvas px-4 py-6 text-center font-mono text-sm text-ink">
              {receipt.qr_token}
            </p>
          ) : null}

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          <div className="mt-8 flex flex-col items-center gap-3">
            {receipt.approved ? (
              <Link to={`/e/${event.slug}`} className="text-sm font-semibold text-brand">Volver al evento</Link>
            ) : (
              <Link to={`/e/${event.slug}/inscripcion${ticketId ? `?ticket=${ticketId}` : ''}`} className="text-sm font-semibold text-brand">
                Volver a la inscripción
              </Link>
            )}
          </div>
        </div>
      </PageTransition>
    );
  }

  if (done) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">{event.name}</p>
          <h1 className="mt-2 text-2xl font-bold text-ink">Inscripción confirmada</h1>
          <p className="mt-2 text-sm text-ink-muted">{done.name} · guarda este código QR de acceso.</p>
          <p className="mt-8 break-all rounded-2xl border border-line bg-canvas px-4 py-6 font-mono text-sm text-ink">{done.qr}</p>
          <Link to={`/e/${event.slug}`} className="mt-8 inline-block text-sm font-semibold text-brand">Volver al evento</Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-widest text-brand">{event.name}</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Inscripción</h1>
        <p className="mt-1 text-sm text-ink-muted">Puedes comprar más de una entrada con el mismo correo. Si el ticket tiene costo, te llevamos a Wompi.</p>

        <form onSubmit={submit} className="mt-8 space-y-4 rounded-3xl border border-line bg-white p-6 shadow-sm">
          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p> : null}
          {wompiId && !receipt ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Volviste de Wompi pero no pudimos cargar el comprobante. Conserva el id {wompiId}.
            </p>
          ) : null}
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">Tipo de entrada</span>
            <select className={fieldClass} value={ticketId} onChange={(e) => setTicketId(e.target.value)}>
              {tickets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.current_price > 0 ? formatCurrency(item.current_price) : 'Gratis'}
                </option>
              ))}
            </select>
          </label>
          {tickets.length === 0 ? (
            <p className="text-sm text-ink-muted">Este evento aún no tiene entradas a la venta.</p>
          ) : null}
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">Nombre completo</span>
            <input className={fieldClass} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">Correo</span>
            <input type="email" className={fieldClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">Teléfono</span>
              <input className={fieldClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">Perfil</span>
              <select
                required
                className={fieldClass}
                value={form.audience}
                onChange={(e) => setForm({
                  ...form,
                  audience: e.target.value as '' | 'paciente' | 'profesional',
                  specialty: e.target.value === 'profesional' ? form.specialty : '',
                })}
              >
                <option value="">Selecciona…</option>
                <option value="paciente">Paciente</option>
                <option value="profesional">Profesional de la salud</option>
              </select>
            </label>
          </div>
          {form.audience === 'profesional' ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">Especialidad</span>
              <input
                required
                className={fieldClass}
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                placeholder="Ej. Endocrinología"
              />
            </label>
          ) : null}
          <label className="flex items-start gap-2 text-xs text-ink-muted">
            <input type="checkbox" className="mt-0.5" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
            Autorizo el tratamiento de mis datos para esta inscripción.
          </label>
          <button type="submit" disabled={submitting || tickets.length === 0}
            className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-50">
            {submitting ? 'Procesando…' : ticket && ticket.current_price > 0 ? `Pagar ${formatCurrency(ticket.current_price)}` : 'Confirmar inscripción'}
          </button>
        </form>
      </div>
    </PageTransition>
  );
}
