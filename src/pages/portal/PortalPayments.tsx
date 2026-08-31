import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCardIcon, DownloadIcon, FileTextIcon, LoaderIcon, TicketIcon } from 'lucide-react';
import { getEdition } from '../../data/editions';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { formatCop } from '../../utils/format';
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
  paid_at: string | null;
  wompi_reference: string | null;
  paid_reference: string | null;
}
interface Activity { id: string; date: string; actor: string; action: string; comment: string | null; }
interface Participation {
  id: string;
  plan_id: string;
  status: string;
  agreed_amount: number | null;
  paid_amount: number;
  included_tickets: number;
  activations: string[] | null;
}
interface Plan { name: string; }
interface Invoice { id: string; name: string; date: string; status: string; file_path: string | null; }
interface CompanyProfile {
  trade_name: string;
  legal_name: string | null;
  nit: string | null;
}

async function launchWompiCheckout(reference: string, amount: number): Promise<string | null> {
  const [{ data: signatureData }, { data: publicSettings }] = await Promise.all([
    supabase.functions.invoke('wompi-create-signature', {
      body: { reference, amount_in_cents: Math.round(amount * 100), currency: 'COP' }
    }),
    supabase.from('public_settings').select('key, value').eq('key', 'wompi_public_key')
  ]);
  const publicKey = publicSettings?.[0]?.value;
  const signature = (signatureData as { signature?: string } | null)?.signature;
  if (!signature || !publicKey) {
    return 'El cobro por Wompi todavía no está configurado. Contacta al equipo organizador.';
  }
  const checkoutUrl = new URL('https://checkout.wompi.co/p/');
  checkoutUrl.searchParams.set('public-key', publicKey);
  checkoutUrl.searchParams.set('currency', 'COP');
  checkoutUrl.searchParams.set('amount-in-cents', String(Math.round(amount * 100)));
  checkoutUrl.searchParams.set('reference', reference);
  checkoutUrl.searchParams.set('signature:integrity', signature);
  checkoutUrl.searchParams.set('redirect-url', window.location.href);
  window.location.href = checkoutUrl.toString();
  return null;
}

export function PortalPayments() {
  const { session, activeEditionId } = usePlatform();
  const companyId = session?.companyId;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = async () => {
    if (!companyId) return;
    const [{ data: paymentRows }, { data: activityRows }, { data: participationRow }, { data: invoiceRows }, { data: companyRow }] = await Promise.all([
      supabase.from('company_payments').select('id, concept, amount, due_date, status, payment_method, paid_at, wompi_reference, paid_reference').eq('company_id', companyId).eq('edition_id', activeEditionId).order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('activity_log').select('id, date, actor, action, comment').eq('company_id', companyId).order('date', { ascending: false }).limit(20),
      supabase.from('participations').select('id, plan_id, status, agreed_amount, paid_amount, included_tickets, activations').eq('company_id', companyId).eq('edition_id', activeEditionId).maybeSingle(),
      supabase.from('company_documents').select('id, name, date, status, file_path').eq('company_id', companyId).eq('edition_id', activeEditionId).eq('kind', 'factura').order('date', { ascending: false }),
      supabase.from('companies').select('trade_name, legal_name, nit').eq('id', companyId).single()
    ]);
    setPayments(paymentRows ?? []);
    setActivity(activityRows ?? []);
    setParticipation(participationRow ?? null);
    setInvoices(invoiceRows ?? []);
    setCompany(companyRow ?? null);
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

  const pendingPayments = payments.filter((payment) => payment.status !== 'pagado');
  const paidPayments = payments.filter((payment) => payment.status === 'pagado');
  const next = pendingPayments[0];
  const remaining = Math.max((participation?.agreed_amount ?? 0) - (participation?.paid_amount ?? 0), 0);
  const outstanding = pendingPayments.reduce((total, payment) => total + payment.amount, 0) || remaining;

  const payWithWompi = async (payment: Payment) => {
    setPayingId(payment.id);
    setPayError(null);
    const error = await launchWompiCheckout(`HB-PAY-${payment.id}`, payment.amount);
    setPayingId(null);
    if (error) setPayError(error);
  };

  const payRemaining = async () => {
    if (!participation || outstanding <= 0) return;
    setPayingId('balance');
    setPayError(null);
    const error = await launchWompiCheckout(`HB-BAL-${participation.id}`, outstanding);
    setPayingId(null);
    if (error) setPayError(error);
  };

  const receiptContext = () => ({
    companyName: company?.trade_name ?? session?.name ?? 'Empresa',
    companyLegalName: company?.legal_name ?? null,
    companyNit: company?.nit ?? null,
    editionName: getEdition(activeEditionId)?.name ?? 'Edición activa',
    planName: plan?.name ?? null,
    agreedAmount: participation?.agreed_amount ?? null,
    paidAmount: participation?.paid_amount ?? 0
  });

  const downloadReceipt = async (items: Payment[], id: string) => {
    setDownloadingId(id);
    setPayError(null);
    try {
      const { generatePaymentReceiptPdf } = await import('../../lib/pdf/generatePaymentReceiptPdf');
      await generatePaymentReceiptPdf(items, receiptContext());
    } catch {
      setPayError('No se pudo generar el recibo. Intenta de nuevo.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (!companyId) {
    return <ModuleHeader eyebrow="Portal" title="Pagos y actividad" description="Tu usuario todavía no está vinculado a una empresa. Contacta al equipo organizador." />;
  }

  return <>
      <ModuleHeader eyebrow="Portal" title="Pagos y facturación" description="El valor pactado, lo que ya pagaste y lo que falta. Cada pago pagado (anticipo, abono o liquidación) tiene un recibo descargable. La factura electrónica la carga el organizador cuando la emite." />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          {participation ? <Panel emphasis title="Convenio pactado" description={plan?.name} actions={outstanding > 0 ? <button type="button" disabled={payingId === 'balance'} onClick={payRemaining} className="rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
                {payingId === 'balance' ? 'Redirigiendo…' : 'Pagar saldo restante'}
              </button> : null}>
              <dl className="grid gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-3">
                {[{ label: 'Valor acordado', value: formatCop(participation.agreed_amount) }, { label: 'Pagado', value: formatCop(participation.paid_amount) }, { label: 'Pendiente', value: formatCop(remaining) }, { label: 'Entradas incluidas', value: String(participation.included_tickets) }].map((row) => <div key={row.label}>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{row.label}</dt>
                    <dd className="mt-1 text-xl font-bold text-brand">{row.value}</dd>
                  </div>)}
              </dl>
              {participation.activations && participation.activations.length > 0 ? <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
                  {participation.activations.map((activation) => <span key={activation} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink">{activation}</span>)}
                </div> : null}
              {next ? <p className="border-t border-line bg-canvas px-5 py-3 text-sm text-ink">
                  Próximo vencimiento: <strong>{next.concept}</strong> por {formatCop(next.amount)} el {next.due_date ?? '—'}.
                </p> : remaining <= 0 ? <p className="border-t border-line bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
                  Convenio al día. No hay saldo pendiente.
                </p> : null}
              {payError ? <p role="alert" className="border-t border-line px-5 py-3 text-sm font-medium text-rose-700">{payError}</p> : null}
            </Panel> : null}

          <Panel title="Cuotas del convenio" description="Adelanto y saldo se generan al pactar el valor. Paga una cuota o el total pendiente, y descarga el recibo de lo ya pagado." actions={paidPayments.length > 0 ? <button type="button" disabled={downloadingId !== null} onClick={() => downloadReceipt(paidPayments, 'all')} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand hover:bg-canvas disabled:opacity-60">
                {downloadingId === 'all' ? <LoaderIcon size={13} className="animate-spin" /> : <DownloadIcon size={13} />}
                {downloadingId === 'all' ? 'Generando…' : 'Descargar todos los recibos'}
              </button> : null}>
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
                        {payment.status === 'pagado' ? <button type="button" disabled={downloadingId !== null} aria-label={`Descargar recibo de ${payment.concept}`} onClick={() => downloadReceipt([payment], payment.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand hover:bg-canvas disabled:opacity-60">
                            {downloadingId === payment.id ? <LoaderIcon size={13} className="animate-spin" /> : <DownloadIcon size={13} />}
                            {downloadingId === payment.id ? 'Generando…' : 'Descargar recibo'}
                          </button> : <button type="button" disabled={payingId === payment.id} onClick={() => payWithWompi(payment)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
                            <CreditCardIcon size={13} /> {payingId === payment.id ? 'Redirigiendo…' : 'Pagar cuota'}
                          </button>}
                      </td>
                    </tr>)}
                  {payments.length === 0 ? <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-ink-muted">Aún no hay cuotas. Se crean al registrar el valor pactado de la participación.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Tiquetes extra" description="Las entradas adicionales para invitados se compran en Equipo.">
            <div className="px-5 py-5">
              <p className="text-sm text-ink-muted">
                El convenio ya incluye {participation ? participation.included_tickets : 0} entradas. Si necesitas más, cómpralas con Wompi junto al registro de tu equipo.
              </p>
              <Link to="/portal/equipo" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
                <TicketIcon size={15} /> Ir a Equipo e invitados
              </Link>
            </div>
          </Panel>

          <Panel title="Facturas" description="Factura electrónica de venta, cuando el organizador la emite y la carga. No es el recibo de cada pago.">
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
              {invoices.length === 0 ? <li className="px-5 py-4 text-sm text-ink-muted">Aún no hay factura electrónica. El recibo de cada pago pagado se descarga en las cuotas del convenio.</li> : null}
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
