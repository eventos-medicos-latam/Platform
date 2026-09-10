import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { PageTransition } from '../../components/motion/PageTransition';
import { formatCurrency, getEventBySlug } from '../../lib/novo/events';
import { listPublicTickets, registerPublicTicket, type EventTicketRow } from '../../lib/novo/tickets';
import { supabase } from '../../lib/supabaseClient';
import { buildWompiCheckoutUrl } from '../../lib/wompi';
import type { NovoEvent } from '../../types/novo';

export function NovoPublicRegister() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const [event, setEvent] = useState<NovoEvent | null>(null);
  const [tickets, setTickets] = useState<EventTicketRow[]>([]);
  const [ticketId, setTicketId] = useState(params.get('ticket') ?? '');
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', specialty: '', consent: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ qr: string; name: string; paid: boolean } | null>(null);

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
    setSubmitting(true);
    setError('');
    try {
      const result = await registerPublicTicket({
        event_id: event.id,
        ticket_type_id: ticket.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        specialty: form.specialty,
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
          window.location.href = buildWompiCheckoutUrl({
            publicKey,
            amountInCents: Math.round(result.amount * 100),
            reference: result.wompi_reference,
            signature,
            redirectUrl: window.location.href,
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
        <p className="mt-1 text-sm text-ink-muted">Una persona, un cupo. Si el ticket tiene costo, te llevamos a Wompi.</p>

        <form onSubmit={submit} className="mt-8 space-y-4 rounded-3xl border border-line bg-white p-6 shadow-sm">
          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p> : null}
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
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">Especialidad</span>
              <input className={fieldClass} value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
            </label>
          </div>
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
