import React, { useEffect, useMemo, useState } from 'react';
import { DownloadIcon, LoaderIcon, PlusIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { formatCompactCop, formatCop } from '../../utils/format';
import { paymentStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { supabase } from '../../lib/supabaseClient';
import { AdminModal, modalFieldClass, ModalField } from '../../components/admin/AdminModal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { RowActions } from '../../components/admin/RowActions';
import { moveToTrash } from '../../lib/trash';
import { getEdition } from '../../data/editions';

interface CompanyPayment {
  id: string;
  company_id: string;
  edition_id: string;
  concept: string;
  amount: number;
  due_date: string | null;
  status: 'pendiente' | 'pagado' | 'vencido';
  paid_at: string | null;
  payment_method: string | null;
  paid_reference: string | null;
  wompi_reference: string | null;
}

interface Company { id: string; trade_name: string; legal_name: string | null; nit: string | null; }
interface Participation { company_id: string; agreed_amount: number | null; paid_amount: number; plan_id: string | null; }
interface Plan { id: string; name: string; }
interface Registration { payment_status: string; }

const statusMeta: Record<CompanyPayment['status'], { label: string; tone: 'success' | 'danger' | 'warning' }> = {
  pendiente: { label: 'Pendiente', tone: 'warning' },
  pagado: { label: 'Pagado', tone: 'success' },
  vencido: { label: 'Vencido', tone: 'danger' }
};
const paymentMethodOptions = ['wompi', 'transferencia', 'efectivo', 'otro'];

const emptyForm = (editionId: string): Omit<CompanyPayment, 'id'> => ({
  company_id: '',
  edition_id: editionId,
  concept: '',
  amount: 0,
  due_date: null,
  status: 'pendiente',
  paid_at: null,
  payment_method: null,
  paid_reference: null,
  wompi_reference: null
});

export function PaymentsAdmin() {
  const { activeEditionId } = usePlatform();
  const [payments, setPayments] = useState<CompanyPayment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<CompanyPayment, 'id'>>(emptyForm(activeEditionId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trashTarget, setTrashTarget] = useState<CompanyPayment | null>(null);
  const [trashing, setTrashing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: paymentRows }, { data: companyRows }, { data: participationRows }, { data: planRows }, { data: regRows }] = await Promise.all([
      supabase.from('company_payments').select('*').eq('edition_id', activeEditionId).order('due_date'),
      supabase.from('companies').select('id, trade_name, legal_name, nit'),
      supabase.from('participations').select('company_id, agreed_amount, paid_amount, plan_id').eq('edition_id', activeEditionId),
      supabase.from('participation_plan_types').select('id, name'),
      supabase.from('registrations').select('payment_status').eq('edition_id', activeEditionId)
    ]);
    setPayments(paymentRows ?? []);
    setCompanies(companyRows ?? []);
    setParticipations(participationRows ?? []);
    setPlans(planRows ?? []);
    setRegistrations(regRows ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditionId]);

  const totals = useMemo(() => ({
    paid: payments.filter((p) => p.status === 'pagado').reduce((t, p) => t + p.amount, 0),
    pending: payments.filter((p) => p.status === 'pendiente').reduce((t, p) => t + p.amount, 0),
    overdue: payments.filter((p) => p.status === 'vencido').reduce((t, p) => t + p.amount, 0)
  }), [payments]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(activeEditionId));
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (payment: CompanyPayment) => {
    setEditingId(payment.id);
    const { id: _id, ...rest } = payment;
    setForm(rest);
    setError(null);
    setModalOpen(true);
  };

  const openDuplicate = (payment: CompanyPayment) => {
    setEditingId(null);
    const { id: _id, ...rest } = payment;
    setForm({ ...rest, status: 'pendiente', paid_at: null, payment_method: null, paid_reference: null, wompi_reference: null });
    setError(null);
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.company_id) {
      setError('Selecciona una empresa.');
      return;
    }
    setSaving(true);
    setError(null);
    const { wompi_reference: _wompi, ...formWithoutWompi } = form;
    const payload = {
      ...formWithoutWompi,
      paid_at: form.status === 'pagado' && !form.paid_at ? new Date().toISOString() : form.paid_at
    };
    const { error: submitError } = editingId
      ? await supabase.from('company_payments').update(payload).eq('id', editingId)
      : await supabase.from('company_payments').insert(payload);
    setSaving(false);
    if (submitError) {
      setError(submitError.message);
      return;
    }
    setModalOpen(false);
    load();
  };

  const confirmTrash = async () => {
    if (!trashTarget) return;
    setTrashing(true);
    const { error: trashError } = await moveToTrash('company_payments', trashTarget.id);
    setTrashing(false);
    if (trashError) {
      setError(trashError);
      return;
    }
    setTrashTarget(null);
    load();
  };

  const downloadReceipt = async (payment: CompanyPayment) => {
    const company = companies.find((item) => item.id === payment.company_id);
    const participation = participations.find((item) => item.company_id === payment.company_id);
    const planName = plans.find((item) => item.id === participation?.plan_id)?.name ?? null;
    setDownloadingId(payment.id);
    setError(null);
    try {
      const { generatePaymentReceiptPdf } = await import('../../lib/pdf/generatePaymentReceiptPdf');
      await generatePaymentReceiptPdf([payment], {
        companyName: company?.trade_name ?? payment.company_id,
        companyLegalName: company?.legal_name ?? null,
        companyNit: company?.nit ?? null,
        editionName: getEdition(activeEditionId)?.name ?? 'Edición activa',
        planName,
        agreedAmount: participation?.agreed_amount ?? null,
        paidAmount: participation?.paid_amount ?? 0
      });
    } catch {
      setError('No se pudo generar el recibo. Intenta de nuevo.');
    } finally {
      setDownloadingId(null);
    }
  };

  return <>
      <ModuleHeader eyebrow="Comercial" title="Pagos" description="Cuotas del convenio (adelanto y saldo). Lo pagado en cada participación se calcula desde estos cobros. En cada cobro pagado puedes descargar el recibo." actions={<button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
            <PlusIcon size={15} /> Nuevo cobro
          </button>} />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel emphasis title="Cobros de patrocinio">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-canvas">
                <tr>
                  <th className={thClass}>Empresa</th>
                  <th className={thClass}>Concepto</th>
                  <th className={thClass}>Valor</th>
                  <th className={thClass}>Vence</th>
                  <th className={thClass}>Método</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map((payment) => <tr key={payment.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-medium text-brand`}>
                      {companies.find((c) => c.id === payment.company_id)?.trade_name ?? payment.company_id}
                    </td>
                    <td className={tdClass}>{payment.concept}</td>
                    <td className={tdClass}>{formatCop(payment.amount)}</td>
                    <td className={tdClass}>{payment.due_date}</td>
                    <td className={`${tdClass} capitalize`}>{payment.payment_method ?? '—'}</td>
                    <td className={tdClass}>
                      <StatusBadge label={statusMeta[payment.status].label} tone={statusMeta[payment.status].tone} />
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center justify-end gap-1">
                        {payment.status === 'pagado' ? <button type="button" disabled={downloadingId !== null} aria-label={`Descargar recibo de ${payment.concept}`} onClick={() => downloadReceipt(payment)} className="rounded-lg p-1.5 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-brand-soft hover:text-brand disabled:opacity-50">
                            {downloadingId === payment.id ? <LoaderIcon size={15} className="animate-spin" /> : <DownloadIcon size={15} />}
                          </button> : null}
                        <RowActions onEdit={() => openEdit(payment)} onDuplicate={() => openDuplicate(payment)} onDelete={() => setTrashTarget(payment)} />
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Estado de cartera">
            <dl className="divide-y divide-line">
              {[{ label: 'Recaudado', value: formatCompactCop(totals.paid) }, { label: 'Por cobrar', value: formatCompactCop(totals.pending) }, { label: 'Vencido', value: formatCompactCop(totals.overdue) }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-3">
                  <dt className="text-sm text-ink-muted">{row.label}</dt>
                  <dd className="text-sm font-semibold text-brand">{row.value}</dd>
                </div>)}
            </dl>
          </Panel>

          <Panel title="Transacciones de tickets" description="Estados devueltos por Wompi.">
            <dl className="divide-y divide-line">
              {Object.entries(paymentStatusMeta).map(([status, meta]) => <div key={status} className="flex items-center justify-between gap-4 px-5 py-2.5">
                  <dt>
                    <StatusBadge label={meta.label} tone={meta.tone} />
                  </dt>
                  <dd className="text-sm font-semibold text-brand">
                    {registrations.filter((item) => item.payment_status === status).length}
                  </dd>
                </div>)}
            </dl>
          </Panel>
        </div>
      </div>

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar cobro' : 'Nuevo cobro'} onSubmit={submit} submitting={saving} error={error}>
        <div className="space-y-4">
          <ModalField label="Empresa">
            <select className={modalFieldClass} value={form.company_id} onChange={(event) => setForm({ ...form, company_id: event.target.value })}>
              <option value="">Selecciona una empresa</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.trade_name}</option>)}
            </select>
          </ModalField>
          <ModalField label="Concepto">
            <input className={modalFieldClass} value={form.concept} onChange={(event) => setForm({ ...form, concept: event.target.value })} />
          </ModalField>
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField label="Valor (COP)">
              <input type="number" className={modalFieldClass} value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Vence">
              <input type="date" className={modalFieldClass} value={form.due_date ?? ''} onChange={(event) => setForm({ ...form, due_date: event.target.value || null })} />
            </ModalField>
            <ModalField label="Estado">
              <select className={modalFieldClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CompanyPayment['status'] })}>
                {Object.entries(statusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
            </ModalField>
            <ModalField label="Método de pago">
              <select className={modalFieldClass} value={form.payment_method ?? ''} onChange={(event) => setForm({ ...form, payment_method: event.target.value || null })}>
                <option value="">Sin definir</option>
                {paymentMethodOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </ModalField>
          </div>
          <ModalField label="Comprobante / nota (pagos manuales)">
            <input className={modalFieldClass} placeholder="Ej. Transferencia Bancolombia #1234" value={form.paid_reference ?? ''} onChange={(event) => setForm({ ...form, paid_reference: event.target.value || null })} />
          </ModalField>
        </div>
      </AdminModal>

      <ConfirmDialog open={Boolean(trashTarget)} title="¿Mover este cobro a la papelera?" description={trashTarget?.concept} onConfirm={confirmTrash} onCancel={() => setTrashTarget(null)} loading={trashing} confirmLabel="Mover a la papelera" />
    </>;
}
