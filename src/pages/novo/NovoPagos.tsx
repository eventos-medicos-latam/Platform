import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCardIcon, CheckCircleIcon, ClockIcon, AlertCircleIcon,
  PlusIcon, DownloadIcon, PencilIcon, TrashIcon, ReceiptIcon,
  BuildingIcon, CalendarIcon, DollarSignIcon, FileTextIcon,
} from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { formatCurrency, formatDate, listEvents } from '../../lib/novo/events';
import { listCompanies } from '../../lib/novo/companies';
import type { NovoEvent } from '../../types/novo';
import type { NovoCompany } from '../../lib/novo/companies';
import {
  createCompanyPayment,
  deleteCompanyPayment,
  listCompanyPayments,
  markCompanyPaymentPaid,
  toLedgerStatus,
  toNovoStatus,
  updateCompanyPayment,
  type CompanyPaymentRow,
} from '../../lib/companyPayments';
import { listRegistrations } from '../../lib/novo/registrations';
import { RowActions } from '../../components/novo/ui/RowActions';
import {
  NovoModal, ModalBtn,
  FormSection, FormField, FormInput, FormSelect, FormTextarea,
} from '../../components/novo/ui/NovoModal';

/* ── Tipos ───────────────────────────────────────────────── */
type PayStatus = 'pagado' | 'proximo' | 'vencido';
type PayMethod = 'transferencia' | 'wompi' | 'efectivo' | 'cheque';

interface Payment {
  id: string;
  agreement_id: string;
  company_id: string;
  event_id: string;
  edition_id: string | null;
  event_name: string;
  description: string;
  amount: number;
  currency: string;
  due_date: string;
  paid_at: string | null;
  method?: PayMethod;
  notes?: string;
  status: PayStatus;
  receipt_url?: string;
  kind: 'empresa' | 'ticket';
  payer_name: string;
}

function paymentPayerName(item: Payment, companies: NovoCompany[]) {
  if (item.kind === 'ticket') return item.payer_name || 'Ticket web';
  return companies.find(c => c.id === item.company_id)?.name ?? 'Empresa';
}

function asPayMethod(value: string | null): PayMethod | undefined {
  if (value === 'transferencia' || value === 'wompi' || value === 'efectivo' || value === 'cheque') return value;
  return undefined;
}

function fromLedger(row: CompanyPaymentRow): Payment {
  return {
    id: row.id,
    agreement_id: '',
    company_id: row.company_id,
    event_id: row.event_id ?? '',
    edition_id: row.edition_id,
    event_name: row.event_name,
    description: row.concept,
    amount: row.amount,
    currency: 'COP',
    due_date: row.due_date ?? '',
    paid_at: row.paid_at ? row.paid_at.slice(0, 10) : null,
    method: asPayMethod(row.payment_method),
    status: toNovoStatus(row.status, row.due_date),
    kind: 'empresa',
    payer_name: '',
  };
}

/* ── Config ──────────────────────────────────────────────── */
const STATUS_CFG: Record<PayStatus, { color: string; bg: string; border: string; label: string; icon: React.ElementType }> = {
  pagado:  { color: '#00C9A0', bg: 'rgba(0,201,160,.12)',  border: 'rgba(0,201,160,.25)',  label: 'Pagado',  icon: CheckCircleIcon  },
  proximo: { color: '#5B8AF0', bg: 'rgba(91,138,240,.12)', border: 'rgba(91,138,240,.25)', label: 'Próximo', icon: ClockIcon        },
  vencido: { color: '#F24463', bg: 'rgba(242,68,99,.12)',  border: 'rgba(242,68,99,.25)',  label: 'Vencido', icon: AlertCircleIcon  },
};

const METHOD_LABEL: Record<PayMethod, string> = {
  transferencia: 'Transferencia bancaria',
  wompi:         'Wompi (PSE / tarjeta)',
  efectivo:      'Efectivo',
  cheque:        'Cheque',
};

/* ── Colores ──────────────────────────────────────────────── */
const BG      = '#112035';
const BG_DEEP = '#0d1829';
const BORDER  = '#1e3450';
const ACCENT  = '#00C9A0';
const TEXT_HI = '#E1EAF4';
const TEXT_LO = '#7A9CB8';
const TEXT_DIM = '#3A5470';

/* ── Datos iniciales ─────────────────────────────────────── */
const EMPTY_FORM = {
  agreement_id: '', company_id: '', event_id: '', description: '',
  amount: '', currency: 'COP', due_date: '', paid_at: '',
  method: 'transferencia' as PayMethod, notes: '', status: 'proximo' as PayStatus,
};

const FILTERS = ['Todos', 'Pagados', 'Próximos', 'Vencidos'] as const;
type Filter = typeof FILTERS[number];

/* ════════════════════════════════════════════════════════════ */
export function NovoPagos() {
  const [payments, setPayments]  = useState<Payment[]>([]);
  const [companies, setCompanies] = useState<NovoCompany[]>([]);
  const [events, setEvents]      = useState<NovoEvent[]>([]);
  const [filter, setFilter]      = useState<Filter>('Todos');
  const [selected, setSelected]  = useState<Payment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]    = useState<Payment | null>(null);
  const [form, setForm]          = useState(EMPTY_FORM);
  const [saving, setSaving]      = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const reloadPayments = async () => {
    const [companyRows, regs] = await Promise.all([
      listCompanyPayments(),
      listRegistrations().catch(() => []),
    ]);
    const tickets: Payment[] = regs
      .filter((row) => row.registration_type === 'compra')
      .map((row) => {
        const paid = row.status === 'confirmado' || row.status === 'asistio' || row.amount_paid > 0;
        return {
          id: row.id,
          agreement_id: '',
          company_id: '',
          event_id: row.event_id,
          edition_id: null,
          event_name: row.event_name,
          description: `Ticket web · ${row.full_name}`,
          amount: row.amount_paid,
          currency: 'COP',
          due_date: row.created_at.slice(0, 10),
          paid_at: paid ? row.created_at.slice(0, 10) : null,
          method: 'wompi' as PayMethod,
          status: paid ? 'pagado' as const : row.status === 'cancelado' ? 'vencido' as const : 'proximo' as const,
          kind: 'ticket' as const,
          payer_name: row.full_name,
        };
      });
    setPayments([...tickets, ...companyRows.map(fromLedger)]);
  };

  useEffect(() => {
    listCompanies().then(setCompanies).catch(() => setCompanies([]));
    listEvents().then(setEvents).catch(() => setEvents([]));
    reloadPayments().catch(() => setPayments([]));
  }, []);

  /* ── Stats ─────────────────────────────────────────────── */
  const totalAcordado  = payments.reduce((s, p) => s + p.amount, 0);
  const totalRecaudado = payments.filter(p => p.status === 'pagado').reduce((s, p) => s + p.amount, 0);
  const totalPendiente = totalAcordado - totalRecaudado;
  const pctRecaudado   = totalAcordado ? Math.round((totalRecaudado / totalAcordado) * 100) : 0;
  const vencidos       = payments.filter(p => p.status === 'vencido').length;

  /* ── Filtro ─────────────────────────────────────────────── */
  const filtered = payments.filter(p => {
    if (filter === 'Pagados')  return p.status === 'pagado';
    if (filter === 'Próximos') return p.status === 'proximo';
    if (filter === 'Vencidos') return p.status === 'vencido';
    return true;
  });

  /* ── CRUD ───────────────────────────────────────────────── */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (p: Payment) => {
    setEditing(p);
    setSaveError(null);
    setForm({
      agreement_id: p.agreement_id, company_id: p.company_id, event_id: p.event_id,
      description: p.description, amount: String(p.amount), currency: p.currency,
      due_date: p.due_date, paid_at: p.paid_at ?? '', method: p.method ?? 'transferencia',
      notes: p.notes ?? '', status: p.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.company_id) return;
    if (!form.event_id && !editing?.edition_id) return;
    setSaving(true);
    setSaveError(null);
    const payload = {
      company_id: form.company_id,
      event_id: form.event_id || null,
      edition_id: form.event_id ? null : (editing?.edition_id ?? null),
      concept: form.description.trim() || 'Cuota',
      amount: Number(form.amount) || 0,
      due_date: form.due_date || null,
      status: toLedgerStatus(form.status),
      payment_method: form.method,
      paid_at: form.status === 'pagado' ? (form.paid_at || new Date().toISOString()) : null,
    };
    try {
      const row = editing
        ? await updateCompanyPayment(editing.id, payload)
        : await createCompanyPayment(payload);
      const mapped = fromLedger(row);
      setPayments(prev => editing
        ? prev.map(p => p.id === editing.id ? mapped : p)
        : [...prev, mapped]);
      if (selected?.id === editing?.id) setSelected(mapped);
      setModalOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudo guardar el pago.');
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (id: string) => {
    try {
      await markCompanyPaymentPaid(id);
      const today = new Date().toISOString().split('T')[0];
      setPayments(prev => prev.map(p => p.id !== id ? p : { ...p, status: 'pagado', paid_at: today }));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: 'pagado', paid_at: today } : prev);
    } catch {
      setSaveError('No se pudo marcar el pago como recibido.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCompanyPayment(id);
      setPayments(prev => prev.filter(p => p.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {
      setSaveError('No se pudo eliminar el pago.');
    }
  };

  const handleDuplicate = async (item: Payment) => {
    try {
      const row = await createCompanyPayment({
        company_id: item.company_id,
        event_id: item.event_id || null,
        edition_id: item.event_id ? null : item.edition_id,
        concept: `${item.description} (copia)`,
        amount: item.amount,
        due_date: item.due_date || null,
        status: 'pendiente',
        payment_method: item.method ?? 'transferencia',
      });
      setPayments(prev => [...prev, fromLedger(row)]);
    } catch {
      setSaveError('No se pudo duplicar el pago.');
    }
  };

  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  /* ─────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>Recaudo flexible</p>
          <h1 className="text-xl font-bold" style={{ color: TEXT_HI, fontFamily: "'Sora', sans-serif" }}>Facturación y Pagos</h1>
          <p className="mt-0.5 text-sm" style={{ color: TEXT_LO }}>Tickets web · acuerdos de empresas · Wompi</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => {}} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
            style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}>
            <DownloadIcon size={13} /> Exportar CSV
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold active:scale-95"
            style={{ background: ACCENT, color: '#0d1829' }}>
            <PlusIcon size={15} strokeWidth={2.5} /> Registrar pago
          </button>
        </div>
      </div>

      {saveError && !modalOpen ? (
        <p className="mb-4 rounded-xl px-4 py-2.5 text-xs" style={{ background: 'rgba(242,68,99,.12)', color: '#F24463' }}>{saveError}</p>
      ) : null}

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Total acordado"  value={formatCurrency(totalAcordado)}  sub="todos los acuerdos" icon={CreditCardIcon} accent="#FF7043" delay={0}    />
        <KPICard label="Recaudado"       value={formatCurrency(totalRecaudado)} sub={`${pctRecaudado}% del total`} icon={CheckCircleIcon} accent={ACCENT} progress={pctRecaudado} delay={0.05} />
        <KPICard label="Por recaudar"    value={formatCurrency(totalPendiente)} sub="pendiente total"    icon={ClockIcon}       accent="#F59E0B" delay={0.1}  />
        <KPICard label="Cuotas vencidas" value={String(vencidos)}               sub="requieren atención" icon={AlertCircleIcon} accent="#F24463" delay={0.15} />
      </div>

      {/* Filtro */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-0.5 p-1 rounded-xl" style={{ background: BG, border: `1px solid ${BORDER}` }}>
          {FILTERS.map(fv => (
            <button key={fv} onClick={() => setFilter(fv)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              style={{ background: filter === fv ? '#1e3450' : 'transparent', color: filter === fv ? TEXT_HI : TEXT_DIM }}>
              {fv}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-5">
        {/* Tabla */}
        <div className="flex-1 min-w-0">
          <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${BORDER}`, background: BG }}>
            {/* Header tabla */}
            <div className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-3"
              style={{ gridTemplateColumns: '2fr 1.4fr .9fr 1fr .9fr 1fr auto', color: TEXT_DIM, borderBottom: `1px solid #1a2e45`, background: '#182d47' }}>
              <span>Pagador</span><span>Evento</span><span>Concepto</span><span>Monto</span><span>Fecha</span><span>Estado</span><span />
            </div>

            {filtered.length === 0 && (
              <div className="py-16 text-center" style={{ color: TEXT_DIM }}>
                <p className="text-sm">Sin pagos en esta categoría.</p>
              </div>
            )}

            {filtered.map((item, i) => {
              const st      = STATUS_CFG[item.status];
              const isActive = selected?.id === item.id;
              return (
                <motion.div key={item.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.04 }}
                  onClick={() => setSelected(isActive ? null : item)}
                  className="grid items-center px-5 py-4 transition-colors cursor-pointer"
                  style={{
                    gridTemplateColumns: '2fr 1.4fr .9fr 1fr .9fr 1fr auto',
                    borderBottom: i < filtered.length - 1 ? `1px solid #1a2e45` : 'none',
                    background: isActive ? 'rgba(0,201,160,.04)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#182d47'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(0,201,160,.04)' : 'transparent'; }}>

                  <div className="min-w-0 pr-3">
                    <p className="truncate text-sm font-semibold" style={{ color: TEXT_HI }}>{paymentPayerName(item, companies)}</p>
                    {item.kind === 'ticket'
                      ? <p className="text-[10px]" style={{ color: TEXT_DIM }}>Ticket web</p>
                      : item.agreement_id ? <p className="text-[10px]" style={{ color: TEXT_DIM }}>#{item.agreement_id}</p> : null}
                  </div>
                  <p className="truncate text-sm pr-2" style={{ color: TEXT_LO }}>{item.event_name}</p>
                  <p className="text-sm" style={{ color: TEXT_LO }}>{item.description}</p>
                  <p className="text-sm font-semibold tabular-nums" style={{ color: TEXT_HI }}>{formatCurrency(item.amount)}</p>
                  <div>
                    <p className="text-sm tabular-nums" style={{ color: item.status === 'vencido' ? '#F24463' : TEXT_LO }}>{formatDate(item.due_date)}</p>
                    {item.paid_at && <p className="text-[10px]" style={{ color: TEXT_DIM }}>Pagado {formatDate(item.paid_at)}</p>}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border"
                    style={{ color: st.color, background: st.bg, borderColor: st.border }}>
                    <st.icon size={9} /> {st.label}
                  </span>

                  <div onClick={e => e.stopPropagation()}>
                    {item.kind === 'empresa' ? (
                      <RowActions
                        onEdit={() => openEdit(item)}
                        onDuplicate={() => { void handleDuplicate(item); }}
                        extra={[
                          ...(item.status !== 'pagado' ? [{ label: 'Marcar pagado', icon: CheckCircleIcon, onClick: () => { void markPaid(item.id); } }] : []),
                          { label: 'Eliminar', icon: TrashIcon, onClick: () => { void handleDelete(item.id); }, variant: 'danger' as const },
                        ]}
                      />
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Panel detalle */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }} animate={{ opacity: 1, x: 0, width: 280 }}
              exit={{ opacity: 0, x: 20, width: 0 }} transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="shrink-0 overflow-hidden rounded-2xl" style={{ background: BG, border: `1px solid ${BORDER}` }}>
              <div className="p-5">
                {/* Status banner */}
                {(() => { const st = STATUS_CFG[selected.status]; return (
                  <div className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                    <st.icon size={13} style={{ color: st.color }} />
                    <p className="text-xs font-bold" style={{ color: st.color }}>{st.label}</p>
                  </div>
                ); })()}

                {/* Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2.5">
                    <BuildingIcon size={13} style={{ color: TEXT_DIM, flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: TEXT_HI }}>{paymentPayerName(selected, companies)}</p>
                      {selected.kind === 'ticket'
                        ? <p className="text-[10px]" style={{ color: TEXT_DIM }}>Ticket web</p>
                        : selected.agreement_id ? <p className="text-[10px]" style={{ color: TEXT_DIM }}>#{selected.agreement_id}</p> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <FileTextIcon size={13} style={{ color: TEXT_DIM, flexShrink: 0 }} />
                    <p className="text-xs" style={{ color: TEXT_LO }}>{selected.event_name}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <DollarSignIcon size={13} style={{ color: TEXT_DIM, flexShrink: 0 }} />
                    <p className="text-base font-bold tabular-nums" style={{ color: TEXT_HI }}>{formatCurrency(selected.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CalendarIcon size={13} style={{ color: TEXT_DIM, flexShrink: 0 }} />
                    <div>
                      <p className="text-xs" style={{ color: TEXT_LO }}>Vencimiento: {formatDate(selected.due_date)}</p>
                      {selected.paid_at && <p className="text-[10px]" style={{ color: ACCENT }}>Pagado: {formatDate(selected.paid_at)}</p>}
                    </div>
                  </div>
                  {selected.method && (
                    <div className="flex items-center gap-2.5">
                      <CreditCardIcon size={13} style={{ color: TEXT_DIM, flexShrink: 0 }} />
                      <p className="text-xs" style={{ color: TEXT_LO }}>{METHOD_LABEL[selected.method]}</p>
                    </div>
                  )}
                  {selected.notes && (
                    <div className="rounded-xl p-3" style={{ background: BG_DEEP }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: TEXT_DIM }}>Notas</p>
                      <p className="text-xs" style={{ color: TEXT_LO }}>{selected.notes}</p>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="space-y-2">
                  {selected.kind === 'empresa' && selected.status !== 'pagado' && (
                    <button onClick={() => { void markPaid(selected.id); }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold"
                      style={{ background: 'rgba(0,201,160,.12)', color: ACCENT, border: '1px solid rgba(0,201,160,.25)' }}>
                      <CheckCircleIcon size={13} /> Marcar como pagado
                    </button>
                  )}
                  {selected.kind === 'empresa' && (
                    <button onClick={() => openEdit(selected)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold"
                      style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}>
                      <PencilIcon size={12} /> Editar
                    </button>
                  )}
                  <button onClick={() => {}}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold"
                    style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}>
                    <ReceiptIcon size={12} /> Ver comprobante
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modal registrar / editar pago ─────────────────── */}
      <NovoModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar pago' : 'Registrar pago'}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={() => { void handleSave(); }} disabled={saving || !form.company_id || (!form.event_id && !editing?.edition_id)}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Registrar pago'}
            </ModalBtn>
          </>
        }>

        {saveError ? (
          <p className="mb-4 rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(242,68,99,.12)', color: '#F24463' }}>{saveError}</p>
        ) : null}

        <FormSection title="Identificación">
          <FormField label="Empresa patrocinadora" required hint="Empresas del CRM. Si no está, créala en Empresas.">
            <FormSelect
              value={form.company_id}
              onChange={f('company_id')}
              options={[
                { value: '', label: 'Seleccionar empresa…' },
                ...companies.map(c => ({ value: c.id, label: `${c.name} · ${c.ciudad}` })),
              ]}
            />
          </FormField>
          <FormField label="Evento relacionado" required hint="La empresa verá y pagará esta cuota en el portal, agrupada en este evento.">
            <FormSelect
              value={form.event_id}
              onChange={f('event_id')}
              options={[
                { value: '', label: 'Seleccionar evento…' },
                ...events.map(e => ({
                  value: e.id,
                  label: `${e.name} · ${e.start_date.slice(0, 4)}`,
                })),
              ]}
            />
          </FormField>
          <FormField label="N° de acuerdo / contrato">
            <FormInput value={form.agreement_id} onChange={f('agreement_id')} placeholder="AGR-001" />
          </FormField>
        </FormSection>

        <FormSection title="Detalle del pago">
          <FormField label="Descripción de la cuota">
            <FormInput value={form.description} onChange={f('description')} placeholder="Anticipo 50%, Saldo final…" />
          </FormField>
          <FormField label="Monto (COP)">
            <FormInput type="number" value={form.amount} onChange={f('amount')} placeholder="9000000" />
          </FormField>
          <FormField label="Fecha de vencimiento">
            <FormInput type="date" value={form.due_date} onChange={f('due_date')} />
          </FormField>
          <FormField label="Método de pago">
            <FormSelect value={form.method} onChange={f('method')} options={[
              { value: 'transferencia', label: 'Transferencia bancaria' },
              { value: 'wompi',         label: 'Wompi (PSE / tarjeta)' },
              { value: 'efectivo',      label: 'Efectivo' },
              { value: 'cheque',        label: 'Cheque' },
            ]} />
          </FormField>
        </FormSection>

        <FormSection title="Estado">
          <FormField label="Estado del pago">
            <FormSelect value={form.status} onChange={f('status')} options={[
              { value: 'proximo', label: 'Próximo — pendiente de pago' },
              { value: 'pagado',  label: 'Pagado — ya recibido' },
              { value: 'vencido', label: 'Vencido — sin pago en plazo' },
            ]} />
          </FormField>
          {(form.status === 'pagado') && (
            <FormField label="Fecha de pago efectivo">
              <FormInput type="date" value={form.paid_at} onChange={f('paid_at')} />
            </FormField>
          )}
          <FormField label="Notas internas">
            <FormTextarea value={form.notes} onChange={f('notes')} rows={2} placeholder="Observaciones del pago…" />
          </FormField>
        </FormSection>
      </NovoModal>
    </div>
  );
}
