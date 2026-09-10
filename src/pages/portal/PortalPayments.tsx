import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCardIcon, DownloadIcon, FileTextIcon, LoaderIcon, TicketIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { formatCop } from '../../utils/format';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { supabase } from '../../lib/supabaseClient';
import { getCompanyFileUrl } from '../../lib/storage';
import { listCompanyPaymentsForCompany, type CompanyPaymentRow } from '../../lib/companyPayments';
import { buildWompiCheckoutUrl } from '../../lib/wompi';

interface Activity { id: string; date: string; actor: string; action: string; comment: string | null; }
interface Participation {
  id: string;
  edition_id: string;
  plan_id: string;
  status: string;
  agreed_amount: number | null;
  paid_amount: number;
  included_tickets: number;
  activations: string[] | null;
}
interface Invoice { id: string; name: string; date: string; status: string; file_path: string | null; }
interface CompanyProfile {
  trade_name: string;
  legal_name: string | null;
  nit: string | null;
}

type PaymentGroup = {
  key: string;
  eventName: string;
  eventId: string | null;
  editionId: string | null;
  payments: CompanyPaymentRow[];
  participation: Participation | null;
  planName: string | null;
};

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
  window.location.href = buildWompiCheckoutUrl({
    publicKey,
    amountInCents: Math.round(amount * 100),
    reference,
    signature,
    redirectUrl: window.location.href,
  });
  return null;
}

function groupPayments(
  payments: CompanyPaymentRow[],
  participations: Participation[],
  planNames: Record<string, string>,
): PaymentGroup[] {
  const byKey = new Map<string, CompanyPaymentRow[]>();
  for (const payment of payments) {
    const list = byKey.get(payment.group_key) ?? [];
    list.push(payment);
    byKey.set(payment.group_key, list);
  }

  const groups: PaymentGroup[] = [...byKey.entries()].map(([key, rows]) => {
    const first = rows[0];
    const participation = first.edition_id
      ? participations.find((item) => item.edition_id === first.edition_id) ?? null
      : null;
    return {
      key,
      eventName: first.event_name,
      eventId: first.event_id,
      editionId: first.edition_id,
      payments: rows,
      participation,
      planName: participation?.plan_id ? planNames[participation.plan_id] ?? null : null,
    };
  });

  for (const participation of participations) {
    const key = `edition:${participation.edition_id}`;
    if (groups.some((group) => group.key === key)) continue;
    groups.push({
      key,
      eventName: payments.find((row) => row.edition_id === participation.edition_id)?.event_name
        ?? 'Convenio',
      eventId: null,
      editionId: participation.edition_id,
      payments: [],
      participation,
      planName: planNames[participation.plan_id] ?? null,
    });
  }

  return groups.sort((a, b) => a.eventName.localeCompare(b.eventName, 'es'));
}

export function PortalPayments() {
  const { session } = usePlatform();
  const companyId = session?.companyId;
  const [payments, setPayments] = useState<CompanyPaymentRow[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [planNames, setPlanNames] = useState<Record<string, string>>({});
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = async () => {
    if (!companyId) return;
    const [paymentRows, { data: activityRows }, { data: participationRows }, { data: invoiceRows }, { data: companyRow }] = await Promise.all([
      listCompanyPaymentsForCompany(companyId),
      supabase.from('activity_log').select('id, date, actor, action, comment').eq('company_id', companyId).order('date', { ascending: false }).limit(20),
      supabase.from('participations').select('id, edition_id, plan_id, status, agreed_amount, paid_amount, included_tickets, activations').eq('company_id', companyId),
      supabase.from('company_documents').select('id, name, date, status, file_path').eq('company_id', companyId).eq('kind', 'factura').order('date', { ascending: false }),
      supabase.from('companies').select('trade_name, legal_name, nit').eq('id', companyId).single()
    ]);
    setPayments(paymentRows);
    setActivity(activityRows ?? []);
    const parts = (participationRows ?? []) as Participation[];
    setParticipations(parts);
    setInvoices(invoiceRows ?? []);
    setCompany(companyRow ?? null);

    const planIds = [...new Set(parts.map((item) => item.plan_id).filter(Boolean))];
    if (planIds.length > 0) {
      const { data: planRows } = await supabase.from('participation_plan_types').select('id, name').in('id', planIds);
      const names: Record<string, string> = {};
      for (const row of planRows ?? []) names[row.id] = row.name;
      setPlanNames(names);
    } else {
      setPlanNames({});
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const groups = useMemo(
    () => groupPayments(payments, participations, planNames),
    [payments, participations, planNames],
  );

  const downloadInvoice = async (path: string | null) => {
    if (!path) return;
    const url = await getCompanyFileUrl(path);
    if (url) window.open(url, '_blank', 'noopener');
  };

  const payWithWompi = async (payment: CompanyPaymentRow) => {
    setPayingId(payment.id);
    setPayError(null);
    const error = await launchWompiCheckout(`HB-PAY-${payment.id}`, payment.amount);
    setPayingId(null);
    if (error) setPayError(error);
  };

  const payGroupRemaining = async (group: PaymentGroup) => {
    const pending = group.payments.filter((payment) => payment.status !== 'pagado');
    const remainingFromContract = Math.max(
      (group.participation?.agreed_amount ?? 0) - (group.participation?.paid_amount ?? 0),
      0,
    );
    const outstanding = pending.reduce((total, payment) => total + payment.amount, 0) || remainingFromContract;
    if (outstanding <= 0) return;

    setPayingId(group.key);
    setPayError(null);

    let reference: string;
    if (group.participation) {
      reference = `HB-BAL-${group.participation.id}`;
    } else if (pending.length === 1) {
      reference = `HB-PAY-${pending[0].id}`;
    } else {
      setPayingId(null);
      return;
    }

    const error = await launchWompiCheckout(reference, outstanding);
    setPayingId(null);
    if (error) setPayError(error);
  };

  const receiptContext = (group: PaymentGroup) => ({
    companyName: company?.trade_name ?? session?.name ?? 'Empresa',
    companyLegalName: company?.legal_name ?? null,
    companyNit: company?.nit ?? null,
    editionName: group.eventName,
    planName: group.planName,
    agreedAmount: group.participation?.agreed_amount ?? group.payments.reduce((total, payment) => total + payment.amount, 0),
    paidAmount: group.participation?.paid_amount
      ?? group.payments.filter((payment) => payment.status === 'pagado').reduce((total, payment) => total + payment.amount, 0)
  });

  const downloadReceipt = async (group: PaymentGroup, items: CompanyPaymentRow[], id: string) => {
    setDownloadingId(id);
    setPayError(null);
    try {
      const { generatePaymentReceiptPdf } = await import('../../lib/pdf/generatePaymentReceiptPdf');
      await generatePaymentReceiptPdf(items, receiptContext(group));
    } catch {
      setPayError('No se pudo generar el recibo. Intenta de nuevo.');
    } finally {
      setDownloadingId(null);
    }
  };

  const hormobiotaTickets = participations.reduce((total, item) => total + (item.included_tickets ?? 0), 0);

  if (!companyId) {
    return <ModuleHeader eyebrow="Portal" title="Pagos y actividad" description="Tu usuario todavía no está vinculado a una empresa. Contacta al equipo organizador." />;
  }

  return <>
      <ModuleHeader
        eyebrow="Portal"
        title="Pagos y facturación"
        description="Pendientes agrupados por el evento en el que estás registrado. Paga cada cuota o el saldo de ese evento. Cada pago pagado tiene un recibo descargable."
      />

      {payError ? <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700">{payError}</p> : null}

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          {groups.length === 0 ? (
            <Panel title="Sin cuotas pendientes">
              <p className="px-5 py-8 text-center text-sm text-ink-muted">
                Aún no hay pagos registrados para tu empresa. Cuando el organizador registre una cuota de un evento, aparecerá aquí.
              </p>
            </Panel>
          ) : groups.map((group) => {
            const pendingPayments = group.payments.filter((payment) => payment.status !== 'pagado');
            const paidPayments = group.payments.filter((payment) => payment.status === 'pagado');
            const remaining = Math.max((group.participation?.agreed_amount ?? 0) - (group.participation?.paid_amount ?? 0), 0);
            const outstanding = pendingPayments.reduce((total, payment) => total + payment.amount, 0) || remaining;
            const canPayGroup = outstanding > 0 && (Boolean(group.participation) || pendingPayments.length === 1);
            const next = pendingPayments[0];
            const agreed = group.participation?.agreed_amount
              ?? group.payments.reduce((total, payment) => total + payment.amount, 0);
            const paid = group.participation?.paid_amount
              ?? paidPayments.reduce((total, payment) => total + payment.amount, 0);

            return (
              <Panel
                key={group.key}
                emphasis
                title={group.eventName}
                description={group.planName ?? (group.payments.length === 1 ? '1 cuota' : `${group.payments.length} cuotas`)}
                actions={canPayGroup ? <button type="button" disabled={payingId === group.key} onClick={() => payGroupRemaining(group)} className="rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
                      {payingId === group.key ? 'Redirigiendo…' : pendingPayments.length === 1 ? 'Pagar cuota' : 'Pagar pendientes'}
                    </button> : null}
              >
                <dl className="grid gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-3">
                  {[{ label: 'Valor acordado', value: formatCop(agreed) }, { label: 'Pagado', value: formatCop(paid) }, { label: 'Pendiente', value: formatCop(outstanding) }].map((row) => (
                    <div key={row.label}>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{row.label}</dt>
                      <dd className="mt-1 text-xl font-bold text-brand">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                {group.participation?.activations && group.participation.activations.length > 0 ? (
                  <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
                    {group.participation.activations.map((activation) => (
                      <span key={activation} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink">{activation}</span>
                    ))}
                  </div>
                ) : null}
                {next ? (
                  <p className="border-t border-line bg-canvas px-5 py-3 text-sm text-ink">
                    Próximo vencimiento: <strong>{next.concept}</strong> por {formatCop(next.amount)} el {next.due_date ?? '—'}.
                  </p>
                ) : outstanding <= 0 ? (
                  <p className="border-t border-line bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
                    Este evento está al día. No hay saldo pendiente.
                  </p>
                ) : null}

                <div className="overflow-x-auto border-t border-line">
                  <div className="flex items-center justify-between gap-3 px-5 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Cuotas</p>
                    {paidPayments.length > 0 ? (
                      <button type="button" disabled={downloadingId !== null} onClick={() => downloadReceipt(group, paidPayments, `${group.key}-all`)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand hover:bg-canvas disabled:opacity-60">
                        {downloadingId === `${group.key}-all` ? <LoaderIcon size={13} className="animate-spin" /> : <DownloadIcon size={13} />}
                        {downloadingId === `${group.key}-all` ? 'Generando…' : 'Descargar recibos'}
                      </button>
                    ) : null}
                  </div>
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
                      {group.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className={`${tdClass} font-medium text-brand`}>{payment.concept}</td>
                          <td className={tdClass}>{formatCop(payment.amount)}</td>
                          <td className={tdClass}>{payment.due_date ?? '—'}</td>
                          <td className={tdClass}>
                            <StatusBadge label={payment.status} tone={payment.status === 'pagado' ? 'success' : payment.status === 'vencido' ? 'danger' : 'warning'} />
                          </td>
                          <td className={tdClass}>
                            {payment.status === 'pagado' ? (
                              <button type="button" disabled={downloadingId !== null} aria-label={`Descargar recibo de ${payment.concept}`} onClick={() => downloadReceipt(group, [payment], payment.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand hover:bg-canvas disabled:opacity-60">
                                {downloadingId === payment.id ? <LoaderIcon size={13} className="animate-spin" /> : <DownloadIcon size={13} />}
                                {downloadingId === payment.id ? 'Generando…' : 'Descargar recibo'}
                              </button>
                            ) : (
                              <button type="button" disabled={payingId === payment.id} onClick={() => payWithWompi(payment)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
                                <CreditCardIcon size={13} /> {payingId === payment.id ? 'Redirigiendo…' : 'Pagar cuota'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {group.payments.length === 0 ? (
                        <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-ink-muted">Aún no hay cuotas registradas para este evento.</td></tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </Panel>
            );
          })}
        </div>

        <div className="space-y-5">
          <Panel title="Tiquetes extra" description="Las entradas adicionales para invitados se compran en Equipo.">
            <div className="px-5 py-5">
              <p className="text-sm text-ink-muted">
                El convenio Hormobiota ya incluye {hormobiotaTickets} entradas. Si necesitas más, cómpralas con Wompi junto al registro de tu equipo.
              </p>
              <Link to="/portal/equipo" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
                <TicketIcon size={15} /> Ir a Equipo e invitados
              </Link>
            </div>
          </Panel>

          <Panel title="Facturas" description="Factura electrónica de venta, cuando el organizador la emite y la carga. No es el recibo de cada pago.">
            <ul className="divide-y divide-line">
              {invoices.map((invoice) => (
                <li key={invoice.id} className="flex items-center gap-3 px-5 py-3">
                  <FileTextIcon size={16} className="shrink-0 text-ink-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-brand">{invoice.name}</p>
                    <p className="text-xs text-ink-muted">{new Date(invoice.date).toLocaleDateString('es-CO')}</p>
                  </div>
                  <StatusBadge label={invoice.status} tone={invoice.status === 'aprobado' ? 'success' : 'info'} />
                  <button type="button" disabled={!invoice.file_path} aria-label={`Descargar ${invoice.name}`} onClick={() => downloadInvoice(invoice.file_path)} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-canvas hover:text-brand disabled:cursor-not-allowed disabled:opacity-30">
                    <DownloadIcon size={15} />
                  </button>
                </li>
              ))}
              {invoices.length === 0 ? <li className="px-5 py-4 text-sm text-ink-muted">Aún no hay factura electrónica. El recibo de cada pago pagado se descarga en las cuotas del evento.</li> : null}
            </ul>
          </Panel>

          <Panel title="Actividad" description="Fecha, responsable, acción y comentario.">
            <ul className="divide-y divide-line">
              {activity.map((entry) => (
                <li key={entry.id} className="px-5 py-3.5">
                  <p className="text-sm font-semibold text-brand">{entry.action}</p>
                  <p className="text-xs text-ink-muted">{new Date(entry.date).toLocaleString('es-CO')} · {entry.actor}</p>
                  {entry.comment ? <p className="mt-1 text-sm text-ink">{entry.comment}</p> : null}
                </li>
              ))}
              {activity.length === 0 ? <li className="px-5 py-4 text-sm text-ink-muted">Sin actividad registrada.</li> : null}
            </ul>
          </Panel>
        </div>
      </div>
    </>;
}
