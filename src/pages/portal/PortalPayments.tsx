import React, { useEffect, useState } from 'react';
import { CreditCardIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { formatCop } from '../../utils/format';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { supabase } from '../../lib/supabaseClient';

interface Payment {
  id: string;
  concept: string;
  amount: number;
  due_date: string | null;
  status: 'pendiente' | 'pagado' | 'vencido';
  payment_method: string | null;
}
interface Activity { id: string; date: string; actor: string; action: string; comment: string | null; }
interface Participation { agreed_amount: number | null; paid_amount: number; }

export function PortalPayments() {
  const { session, activeEditionId } = usePlatform();
  const companyId = session?.companyId;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const [{ data: paymentRows }, { data: activityRows }, { data: participationRow }] = await Promise.all([
        supabase.from('company_payments').select('id, concept, amount, due_date, status, payment_method').eq('company_id', companyId).eq('edition_id', activeEditionId).order('due_date'),
        supabase.from('activity_log').select('id, date, actor, action, comment').eq('company_id', companyId).order('date', { ascending: false }).limit(20),
        supabase.from('participations').select('agreed_amount, paid_amount').eq('company_id', companyId).eq('edition_id', activeEditionId).maybeSingle()
      ]);
      setPayments(paymentRows ?? []);
      setActivity(activityRows ?? []);
      setParticipation(participationRow ?? null);
    })();
  }, [companyId, activeEditionId]);

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

  if (!companyId) {
    return <ModuleHeader eyebrow="Portal" title="Pagos y actividad" description="Tu usuario todavía no está vinculado a una empresa. Contacta al equipo organizador." />;
  }

  return <>
      <ModuleHeader eyebrow="Portal" title="Pagos y actividad" description="Consulta el estado de tus pagos y paga en línea con Wompi." />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Panel emphasis title="Estado de cuenta">
            <dl className="grid gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-3">
              {[{ label: 'Valor acordado', value: formatCop(participation?.agreed_amount ?? null) }, { label: 'Pagado', value: formatCop(participation?.paid_amount ?? 0) }, { label: 'Pendiente', value: formatCop((participation?.agreed_amount ?? 0) - (participation?.paid_amount ?? 0)) }].map((row) => <div key={row.label}>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{row.label}</dt>
                  <dd className="mt-1 text-xl font-bold text-brand">{row.value}</dd>
                </div>)}
            </dl>
            {next ? <p className="border-t border-line bg-canvas px-5 py-3 text-sm text-ink">
                Próximo vencimiento: <strong>{next.concept}</strong> por {formatCop(next.amount)} el {next.due_date ?? '—'}.
              </p> : null}
          </Panel>

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
        </div>

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
    </>;
}
