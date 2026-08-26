import React, { useEffect, useState } from 'react';
import { CreditCardIcon, DownloadIcon, FileTextIcon, TicketIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { formatCop, withVat } from '../../utils/format';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { supabase } from '../../lib/supabaseClient';
import { getCompanyFileUrl } from '../../lib/storage';

interface Payment {
  id: string;
  concept: string;
  amount: number;
  due_date: string | null;
  status: 'pendiente' | 'pagado' | 'vencido';
  payment_method: string | null;
}
interface Activity { id: string; date: string; actor: string; action: string; comment: string | null; }
interface Participation { plan_id: string; status: string; agreed_amount: number | null; paid_amount: number; included_tickets: number; activations: string[] | null; }
interface Plan { name: string; }
interface Invoice { id: string; name: string; date: string; status: string; file_path: string | null; }
interface EventTicket { id: string; name: string; price: number | null; vat_rate: number; }

export function PortalPayments() {
  const { session, activeEditionId } = usePlatform();
  const companyId = session?.companyId;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);

  const [eventTickets, setEventTickets] = useState<EventTicket[]>([]);
  const [ticketId, setTicketId] = useState('');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [buyingTicket, setBuyingTicket] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  const load = async () => {
    if (!companyId) return;
    const [{ data: paymentRows }, { data: activityRows }, { data: participationRow }, { data: invoiceRows }, { data: ticketRows }] = await Promise.all([
      supabase.from('company_payments').select('id, concept, amount, due_date, status, payment_method').eq('company_id', companyId).eq('edition_id', activeEditionId).order('due_date'),
      supabase.from('activity_log').select('id, date, actor, action, comment').eq('company_id', companyId).order('date', { ascending: false }).limit(20),
      supabase.from('participations').select('plan_id, status, agreed_amount, paid_amount, included_tickets, activations').eq('company_id', companyId).eq('edition_id', activeEditionId).maybeSingle(),
      supabase.from('company_documents').select('id, name, date, status, file_path').eq('company_id', companyId).eq('edition_id', activeEditionId).eq('kind', 'factura').order('date', { ascending: false }),
      supabase.from('tickets').select('id, name, price, vat_rate').eq('edition_id', activeEditionId).eq('visible', true).eq('status', 'publicado')
    ]);
    setPayments(paymentRows ?? []);
    setActivity(activityRows ?? []);
    setParticipation(participationRow ?? null);
    setInvoices(invoiceRows ?? []);
    setEventTickets(ticketRows ?? []);
    if (!ticketId && ticketRows && ticketRows.length > 0) setTicketId(ticketRows[0].id);
    if (participationRow?.plan_id) {
      const { data: planRow } = await supabase.from('participation_plan_types').select('name').eq('id', participationRow.plan_id).single();
      setPlan(planRow);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, activeEditionId]);

  const downloadInvoice = async (path: string | null) => {
    if (!path) return;
    const url = await getCompanyFileUrl(path);
    if (url) window.open(url, '_blank', 'noopener');
  };

  const next = payments.find((payment) => payment.status !== 'pagado');

  const payWithWompi = async (payment: Payment) => {
    setPayingId(payment.id);
    const reference = `HB-PAY-${payment.id}`;
    const [{ data: signatureData }, { data: publicSettings }] = await Promise.all([
      supabase.functions.invoke('wompi-create-signature', {
        body: { reference, amount_in_cents: Math.round(payment.amount * 100), currency: 'COP' }
      }),
      supabase.from('public_settings').select('key, value').eq('key', 'wompi_public_key')
    ]);
    const publicKey = publicSettings?.[0]?.value;
    const signature = (signatureData as { signature?: string } | null)?.signature;
    setPayingId(null);
    if (!signature || !publicKey) {
      alert('El cobro por Wompi todavía no está configurado. Contacta al equipo organizador.');
      return;
    }
    const checkoutUrl = new URL('https://checkout.wompi.co/p/');
    checkoutUrl.searchParams.set('public-key', publicKey);
    checkoutUrl.searchParams.set('currency', 'COP');
    checkoutUrl.searchParams.set('amount-in-cents', String(Math.round(payment.amount * 100)));
    checkoutUrl.searchParams.set('reference', reference);
    checkoutUrl.searchParams.set('signature:integrity', signature);
    checkoutUrl.searchParams.set('redirect-url', window.location.href);
    window.location.href = checkoutUrl.toString();
  };

  const selectedTicket = eventTickets.find((item) => item.id === ticketId);
  const extraTicketAmount = selectedTicket ? withVat(selectedTicket.price, selectedTicket.vat_rate) : null;

  const buyExtraTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyId || !selectedTicket) return;
    if (!attendeeName.trim() || !attendeeEmail.trim()) { setBuyError('Indica nombre y correo del asistente.'); return; }
    setBuyingTicket(true);
    setBuyError(null);
    const reference = `HB-REG-${crypto.randomUUID()}`;
    const { data, error: insertError } = await supabase
      .from('registrations')
      .insert({
        edition_id: activeEditionId,
        ticket_id: selectedTicket.id,
        full_name: attendeeName,
        email: attendeeEmail,
        modality: 'presencial',
        amount: extraTicketAmount,
        payment_status: extraTicketAmount === null ? 'approved' : 'pending',
        wompi_reference: extraTicketAmount === null ? null : reference,
        source: 'compra-empresa',
        company_id: companyId
      })
      .select('id')
      .single();

    if (insertError || !data) {
      setBuyingTicket(false);
      setBuyError('No pudimos registrar la compra. Intenta de nuevo.');
      return;
    }

    if (extraTicketAmount === null) {
      setBuyingTicket(false);
      setAttendeeName('');
      setAttendeeEmail('');
      alert('Tiquete adicional registrado.');
      return;
    }

    const [{ data: signatureData }, { data: publicSettings }] = await Promise.all([
      supabase.functions.invoke('wompi-create-signature', {
        body: { reference, amount_in_cents: Math.round(extraTicketAmount * 100), currency: 'COP' }
      }),
      supabase.from('public_settings').select('key, value').eq('key', 'wompi_public_key')
    ]);
    const publicKey = publicSettings?.[0]?.value;
    const signature = (signatureData as { signature?: string } | null)?.signature;
    setBuyingTicket(false);
    if (!signature || !publicKey) {
      setBuyError('El cobro por Wompi todavía no está configurado. Contacta al equipo organizador.');
      return;
    }
    const checkoutUrl = new URL('https://checkout.wompi.co/p/');
    checkoutUrl.searchParams.set('public-key', publicKey);
    checkoutUrl.searchParams.set('currency', 'COP');
    checkoutUrl.searchParams.set('amount-in-cents', String(Math.round(extraTicketAmount * 100)));
    checkoutUrl.searchParams.set('reference', reference);
    checkoutUrl.searchParams.set('signature:integrity', signature);
    checkoutUrl.searchParams.set('redirect-url', window.location.href);
    window.location.href = checkoutUrl.toString();
  };

  if (!companyId) {
    return <ModuleHeader eyebrow="Portal" title="Pagos y actividad" description="Tu usuario todavía no está vinculado a una empresa. Contacta al equipo organizador." />;
  }

  return <>
      <ModuleHeader eyebrow="Portal" title="Pagos y actividad" description="Tu convenio, tus pagos, tus facturas y la compra de tiquetes adicionales, todo en un solo lugar." />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          {participation ? <Panel emphasis title="Convenio pactado" description={plan?.name}>
              <dl className="grid gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-3">
                {[{ label: 'Valor acordado', value: formatCop(participation.agreed_amount) }, { label: 'Pagado', value: formatCop(participation.paid_amount) }, { label: 'Pendiente', value: formatCop((participation.agreed_amount ?? 0) - participation.paid_amount) }, { label: 'Entradas incluidas', value: String(participation.included_tickets) }].map((row) => <div key={row.label}>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{row.label}</dt>
                    <dd className="mt-1 text-xl font-bold text-brand">{row.value}</dd>
                  </div>)}
              </dl>
              {participation.activations && participation.activations.length > 0 ? <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
                  {participation.activations.map((activation) => <span key={activation} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink">{activation}</span>)}
                </div> : null}
              {next ? <p className="border-t border-line bg-canvas px-5 py-3 text-sm text-ink">
                  Próximo vencimiento: <strong>{next.concept}</strong> por {formatCop(next.amount)} el {next.due_date ?? '—'}.
                </p> : null}
            </Panel> : null}

          <Panel title="Historial de pagos">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px]">
                <thead className="bg-canvas">
                  <tr>
                    <th className={thClass}>Concepto</th>
                    <th className={thClass}>Valor</th>
                    <th className={thClass}>Vence</th>
                    <th className={thClass}>Estado</th>
                    <th className={thClass} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {payments.map((payment) => <tr key={payment.id}>
                      <td className={`${tdClass} font-medium text-brand`}>{payment.concept}</td>
                      <td className={tdClass}>{formatCop(payment.amount)}</td>
                      <td className={tdClass}>{payment.due_date ?? '—'}</td>
                      <td className={tdClass}>
                        <StatusBadge label={payment.status} tone={payment.status === 'pagado' ? 'success' : payment.status === 'vencido' ? 'danger' : 'warning'} />
                      </td>
                      <td className={tdClass}>
                        {payment.status !== 'pagado' ? <button type="button" disabled={payingId === payment.id} onClick={() => payWithWompi(payment)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
                            <CreditCardIcon size={13} /> {payingId === payment.id ? 'Redirigiendo…' : 'Pagar con Wompi'}
                          </button> : null}
                      </td>
                    </tr>)}
                  {payments.length === 0 ? <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-ink-muted">Sin pagos registrados.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Comprar tiquetes adicionales" description="Además de lo que incluye tu plan, puedes comprar entradas extra para el evento.">
            <form className="grid gap-3 px-5 py-5 sm:grid-cols-2" onSubmit={buyExtraTicket}>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">Tipo de tiquete</span>
                <select className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand" value={ticketId} onChange={(event) => setTicketId(event.target.value)}>
                  {eventTickets.map((item) => <option key={item.id} value={item.id}>{item.name} · {formatCop(withVat(item.price, item.vat_rate))}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">Nombre del asistente</span>
                <input required value={attendeeName} onChange={(event) => setAttendeeName(event.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">Correo del asistente</span>
                <input required type="email" value={attendeeEmail} onChange={(event) => setAttendeeEmail(event.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand" />
              </label>
              <div className="flex items-center justify-between gap-3 sm:col-span-2">
                <span className="text-sm text-ink-muted">Total: <strong className="text-brand">{formatCop(extraTicketAmount)}</strong></span>
                <button type="submit" disabled={buyingTicket || eventTickets.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
                  <TicketIcon size={15} /> {buyingTicket ? 'Procesando…' : 'Comprar con Wompi'}
                </button>
              </div>
              {eventTickets.length === 0 ? <p className="text-xs text-ink-muted sm:col-span-2">Todavía no hay tiquetes publicados para esta edición.</p> : null}
              {buyError ? <p role="alert" className="text-sm font-medium text-rose-700 sm:col-span-2">{buyError}</p> : null}
            </form>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Facturas" description="Facturas emitidas para esta edición.">
            <ul className="divide-y divide-line">
              {invoices.map((invoice) => <li key={invoice.id} className="flex items-center gap-3 px-5 py-3">
                    <FileTextIcon size={16} className="shrink-0 text-ink-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-brand">{invoice.name}</p>
                      <p className="text-xs text-ink-muted">{new Date(invoice.date).toLocaleDateString('es-CO')}</p>
                    </div>
                    <StatusBadge label={invoice.status} tone={invoice.status === 'aprobado' ? 'success' : 'info'} />
                    <button type="button" disabled={!invoice.file_path} aria-label={`Descargar ${invoice.name}`} onClick={() => downloadInvoice(invoice.file_path)} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-canvas hover:text-brand disabled:cursor-not-allowed disabled:opacity-30">
                      <DownloadIcon size={15} />
                    </button>
                  </li>)}
              {invoices.length === 0 ? <li className="px-5 py-4 text-sm text-ink-muted">Sin facturas emitidas todavía.</li> : null}
            </ul>
          </Panel>

          <Panel title="Actividad" description="Fecha, responsable, acción y comentario.">
            <ul className="divide-y divide-line">
              {activity.map((entry) => <li key={entry.id} className="px-5 py-3.5">
                  <p className="text-sm font-semibold text-brand">{entry.action}</p>
                  <p className="text-xs text-ink-muted">{new Date(entry.date).toLocaleString('es-CO')} · {entry.actor}</p>
                  {entry.comment ? <p className="mt-1 text-sm text-ink">{entry.comment}</p> : null}
                </li>)}
              {activity.length === 0 ? <li className="px-5 py-4 text-sm text-ink-muted">Sin actividad registrada.</li> : null}
            </ul>
          </Panel>
        </div>
      </div>
    </>;
}
