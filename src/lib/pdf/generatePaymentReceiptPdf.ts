import { supabase } from '../supabaseClient';
import { media } from '../../data/media';
import { organization } from '../../data/organization';
import { formatCop } from '../../utils/format';

function absoluteUrl(path: string): string {
  return new URL(path, window.location.origin).toString();
}

const methodLabels: Record<string, string> = {
  wompi: 'Wompi',
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  otro: 'Otro'
};

export interface ReceiptPaymentInput {
  id: string;
  concept: string;
  amount: number;
  paid_at: string | null;
  payment_method: string | null;
  wompi_reference: string | null;
  paid_reference: string | null;
}

export interface ReceiptContextInput {
  companyName: string;
  companyLegalName: string | null;
  companyNit: string | null;
  editionName: string;
  planName: string | null;
  agreedAmount: number | null;
  paidAmount: number;
}

export function receiptKindLabel(concept: string): string {
  const name = concept.toLowerCase();
  if (/adelanto|anticipo/.test(name)) return 'Anticipo';
  if (/saldo|liquid|convenio/.test(name)) return 'Liquidación';
  return 'Abono parcial';
}

function paidAtLabel(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export async function generatePaymentReceiptPdf(
  payments: ReceiptPaymentInput[],
  context: ReceiptContextInput
): Promise<void> {
  if (payments.length === 0) return;

  const remaining = Math.max((context.agreedAmount ?? 0) - context.paidAmount, 0);
  const [{ data: settingsRow }, { pdf }, { PaymentReceiptPdfDocument }] = await Promise.all([
    supabase.from('public_settings').select('key, value').eq('key', 'logo_url').maybeSingle(),
    import('@react-pdf/renderer'),
    import('../../components/pdf/PaymentReceiptPdfDocument')
  ]);

  const lines = payments.map((payment) => ({
      concept: payment.concept,
      kindLabel: receiptKindLabel(payment.concept),
      amountLabel: formatCop(payment.amount),
      paidAtLabel: paidAtLabel(payment.paid_at),
      methodLabel: methodLabels[payment.payment_method ?? ''] ?? (payment.payment_method || 'Registrado'),
      reference: payment.wompi_reference || payment.paid_reference || ''
    }));

  const single = payments.length === 1;
  const title = single ? 'Recibo de pago' : 'Recibos de pagos del convenio';
  const kindLabel = single ? lines[0].kindLabel : `${payments.length} pagos`;
  const amountLabel = single ? formatCop(payments[0].amount) : formatCop(payments.reduce((total, item) => total + item.amount, 0));
  const generatedAtLabel = new Date().toLocaleString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const place = [organization.city, organization.country].filter(Boolean).join(', ');

  const blob = await pdf(
    PaymentReceiptPdfDocument({
      logoUrl: settingsRow?.value ? settingsRow.value : absoluteUrl(media.logoHormobiota),
      title,
      kindLabel,
      amountLabel,
      issuerName: organization.name,
      issuerPlace: place,
      companyName: context.companyName,
      companyLegalName: context.companyLegalName ?? '',
      companyNit: context.companyNit ?? '',
      editionName: context.editionName,
      planName: context.planName ?? '',
      agreedLabel: formatCop(context.agreedAmount),
      paidLabel: formatCop(context.paidAmount),
      remainingLabel: formatCop(remaining),
      lines,
      generatedAtLabel
    })
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const slug = single
    ? `recibo-${payments[0].concept.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
    : 'recibos-convenio';
  link.download = `${slug}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
