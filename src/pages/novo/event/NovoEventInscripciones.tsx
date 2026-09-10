import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UsersIcon, TicketIcon, CheckCircleIcon, XCircleIcon,
  SearchIcon, DownloadIcon, QrCodeIcon, PlusIcon,
  CalendarIcon, BuildingIcon, MailIcon,
} from 'lucide-react';
import { KPICard } from '../../../components/novo/ui/KPICard';
import { RowActions } from '../../../components/novo/ui/RowActions';
import {
  NovoModal, ModalBtn,
  FormField, FormInput, FormSelect, FormSection,
} from '../../../components/novo/ui/NovoModal';
import { formatCurrency } from '../../../lib/novo/events';
import type { NovoEventOutlet } from '../../../types/novo';
import type { NovoRegistrationType } from '../../../types/novo';
import { listCompanies, type NovoCompany } from '../../../lib/novo/companies';
import {
  createRegistration, deleteRegistration, listRegistrations, setRegistrationStatus, updateRegistration,
  type EventRegistrationRow, type RegistrationStatus,
} from '../../../lib/novo/registrations';

const STATUS_CONFIG: Record<RegistrationStatus, { label: string; color: string; bg: string }> = {
  confirmado: { label: 'Confirmado', color: '#00C9A0', bg: 'rgba(0,201,160,.12)' },
  asistio:    { label: 'Asistió',    color: '#5B8AF0', bg: 'rgba(91,138,240,.12)' },
  espera:     { label: 'En espera',  color: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
  cancelado:  { label: 'Cancelado',  color: '#F24463', bg: 'rgba(242,68,99,.12)' },
};

const TYPE_CONFIG: Record<NovoRegistrationType, { label: string; color: string }> = {
  compra:      { label: 'Compra',      color: '#00C9A0' },
  invitacion:  { label: 'Invitación',  color: '#7A9CB8' },
  cortesia:    { label: 'Cortesía',    color: '#A78BFA' },
  sponsor:     { label: 'Sponsor',     color: '#FF7043' },
  colaborador: { label: 'Colaborador', color: '#5B8AF0' },
  importacion: { label: 'Importación', color: '#F59E0B' },
  manual:      { label: 'Manual',      color: '#7A9CB8' },
};

const TYPE_OPTIONS = Object.entries(TYPE_CONFIG).map(([v, c]) => ({ value: v, label: c.label }));
const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }));
const ALL_STATUSES: RegistrationStatus[] = ['confirmado', 'asistio', 'espera', 'cancelado'];

const fmt = (n: number) => n === 0 ? '—' : formatCurrency(n);
const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
const GRADIENTS = [
  'linear-gradient(135deg,#1a4a7a,#2d6fae)',
  'linear-gradient(135deg,#1a6b5a,#00C9A0)',
  'linear-gradient(135deg,#5b2d8a,#A78BFA)',
  'linear-gradient(135deg,#7a3a1a,#FF7043)',
  'linear-gradient(135deg,#1a3a7a,#5B8AF0)',
];

const EMPTY_FORM = {
  name: '', email: '', company: '', company_id: '', phone: '',
  registration_type: 'compra' as NovoRegistrationType,
  status: 'confirmado' as RegistrationStatus,
  amount: '0',
};

export function NovoEventInscripciones() {
  const { event } = useOutletContext<NovoEventOutlet>();
  const [registrations, setRegistrations] = useState<EventRegistrationRow[]>([]);
  const [companies, setCompanies] = useState<NovoCompany[]>([]);
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'todos'>('todos');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<EventRegistrationRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventRegistrationRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const f = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const reload = () => listRegistrations(event.id).then(setRegistrations).catch((err) => {
    setRegistrations([]);
    setError(err instanceof Error ? err.message : 'No se pudieron cargar las inscripciones.');
  });

  useEffect(() => {
    listCompanies().then(setCompanies).catch(() => setCompanies([]));
  }, []);

  useEffect(() => {
    reload();
    setSelected(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(null); setModalOpen(true); };
  const openEdit = (r: EventRegistrationRow) => {
    setEditing(r);
    setError(null);
    setForm({
      name: r.full_name, email: r.email, company: r.company, company_id: r.company_id ?? '',
      phone: r.phone, registration_type: r.registration_type, status: r.status, amount: String(r.amount_paid),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const input = {
      full_name: form.name,
      email: form.email,
      phone: form.phone,
      specialty: '',
      company: form.company,
      company_id: form.company_id || null,
      event_id: event.id,
      registration_type: form.registration_type,
      origin: 'eml' as const,
      amount_paid: Number(form.amount) || 0,
      status: form.status,
      notes: '',
    };
    try {
      const saved = editing
        ? await updateRegistration(editing.id, editing.person_id, input)
        : await createRegistration(input);
      setRegistrations(prev => editing ? prev.map(r => r.id !== editing.id ? r : saved) : [saved, ...prev]);
      if (selected?.id === editing?.id) setSelected(saved);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la inscripción.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro? La persona se conserva.')) return;
    try {
      await deleteRegistration(id);
      setRegistrations(prev => prev.filter(r => r.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    }
  };

  const handleCancelReg = async (id: string) => {
    try {
      await setRegistrationStatus(id, 'cancelado');
      setRegistrations(prev => prev.map(r => r.id !== id ? r : { ...r, status: 'cancelado', attended: false }));
      if (selected?.id === id) setSelected(s => s ? { ...s, status: 'cancelado', attended: false } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar.');
    }
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'Email', 'Empresa', 'Tipo', 'Estado', 'Monto', 'Fecha'];
    const rows = registrations.map(r => [r.full_name, r.email, r.company, r.registration_type, r.status, r.amount_paid, r.created_at]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `inscripciones-${event.id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = registrations.filter(r => {
    const matchStatus = statusFilter === 'todos' || r.status === statusFilter;
    const q = query.toLowerCase();
    const matchQ = !q || r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.company.toLowerCase().includes(q);
    return matchStatus && matchQ;
  });

  const counts = {
    total:       registrations.length,
    confirmados: registrations.filter(r => r.status === 'confirmado' || r.status === 'asistio').length,
    espera:      registrations.filter(r => r.status === 'espera').length,
    cancelados:  registrations.filter(r => r.status === 'cancelado').length,
  };
  const ingresos = registrations.filter(r => r.status !== 'cancelado').reduce((s, r) => s + r.amount_paid, 0);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Inscripciones</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>Las mismas filas que Registros, filtradas a este evento</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}>
          <PlusIcon size={13} /> Nueva inscripción
        </button>
      </div>

      {error && !modalOpen ? (
        <p className="mb-4 rounded-xl px-4 py-2.5 text-xs" style={{ background: 'rgba(242,68,99,.12)', color: '#F24463' }}>{error}</p>
      ) : null}

      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Total inscritos"  value={counts.total.toString()}       icon={UsersIcon}      accent="#00C9A0" delay={0} />
        <KPICard label="Confirmados"      value={counts.confirmados.toString()}  icon={CheckCircleIcon} accent="#00C9A0" progress={counts.total ? Math.round((counts.confirmados/counts.total)*100) : 0} delay={0.05} />
        <KPICard label="En espera"        value={counts.espera.toString()}       icon={TicketIcon}     accent="#F59E0B" delay={0.1} />
        <KPICard label="Ingresos"         value={formatCurrency(ingresos)} icon={XCircleIcon} accent="#5B8AF0" delay={0.15} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] rounded-xl px-3.5 py-2.5"
          style={{ background: '#112035', border: '1px solid #1e3450' }}>
          <SearchIcon size={14} style={{ color: '#2a4a6b' }} />
          <input className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#E1EAF4' }}
            placeholder="Buscar por nombre, email o empresa…" value={query}
            onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #1e3450' }}>
          {(['todos', ...ALL_STATUSES] as const).map(s => {
            const isActive = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="px-3.5 py-2 text-xs font-semibold transition-colors"
                style={{ background: isActive ? '#182d47' : '#112035', color: isActive ? '#E1EAF4' : '#2a4a6b', borderRight: '1px solid #1e3450' }}>
                {s === 'todos' ? 'Todos' : STATUS_CONFIG[s].label}
              </button>
            );
          })}
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-95"
          style={{ background: '#182d47', color: '#7A9CB8', border: '1px solid #1e3450' }}>
          <DownloadIcon size={13} /> Exportar CSV
        </button>
      </div>

      <div className="flex gap-5">
        <div className="flex-1 overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
          <div className="grid px-5 py-3"
            style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr auto', borderBottom: '1px solid #1e3450' }}>
            {['Participante', 'Empresa', 'Tipo', 'Monto', 'Estado', ''].map(h => (
              <p key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#2a4a6b' }}>{h}</p>
            ))}
          </div>
          {filtered.map((reg, i) => {
            const st = STATUS_CONFIG[reg.status];
            const tt = TYPE_CONFIG[reg.registration_type];
            const isSelected = selected?.id === reg.id;
            return (
              <motion.div key={reg.id}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.03 }}
                onClick={() => setSelected(isSelected ? null : reg)}
                className="grid px-5 py-3.5 cursor-pointer transition-colors"
                style={{
                  gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr auto',
                  borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none',
                  background: isSelected ? '#182d47' : 'transparent',
                }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#182d4750')}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                    {initials(reg.full_name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#E1EAF4' }}>{reg.full_name}</p>
                    <p className="text-[10px]" style={{ color: '#3A5470' }}>{reg.email}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <p className="text-sm truncate" style={{ color: '#7A9CB8' }}>{reg.company || '—'}</p>
                </div>
                <div className="flex items-center">
                  <span className="text-xs font-semibold" style={{ color: tt.color }}>{tt.label}</span>
                </div>
                <div className="flex items-center">
                  <p className="text-sm tabular-nums" style={{ color: '#E1EAF4' }}>{fmt(reg.amount_paid)}</p>
                </div>
                <div className="flex items-center">
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ color: st.color, background: st.bg }}>
                    {st.label}
                  </span>
                </div>
                <div className="flex items-center" onClick={e => e.stopPropagation()}>
                  <RowActions
                    onEdit={() => openEdit(reg)}
                    onDelete={() => { void handleDelete(reg.id); }}
                  />
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm" style={{ color: '#2a4a6b' }}>{registrations.length === 0 ? 'Aún no hay inscripciones en este evento.' : 'Sin resultados'}</p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 280 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden shrink-0 rounded-2xl"
              style={{ background: '#112035', border: '1px solid #1e3450' }}
            >
              <div className="p-5">
                <div className="flex flex-col items-center gap-2 mb-5 pb-5" style={{ borderBottom: '1px solid #1e3450' }}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ background: GRADIENTS[Math.max(0, registrations.findIndex(r => r.id === selected.id)) % GRADIENTS.length] }}>
                    {initials(selected.full_name)}
                  </div>
                  <p className="text-sm font-bold text-center" style={{ color: '#E1EAF4' }}>{selected.full_name}</p>
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ color: STATUS_CONFIG[selected.status].color, background: STATUS_CONFIG[selected.status].bg }}>
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                </div>

                {[
                  { icon: MailIcon,     label: 'Email',   value: selected.email || '—' },
                  { icon: BuildingIcon, label: 'Empresa', value: selected.company || '—' },
                  { icon: TicketIcon,   label: 'Tipo',    value: TYPE_CONFIG[selected.registration_type].label },
                  { icon: CalendarIcon, label: 'Registro',value: new Date(selected.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 mb-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: '#182d47' }}>
                      <item.icon size={12} style={{ color: '#7A9CB8' }} />
                    </div>
                    <div>
                      <p className="text-[10px]" style={{ color: '#3A5470' }}>{item.label}</p>
                      <p className="text-xs font-semibold" style={{ color: '#E1EAF4' }}>{item.value}</p>
                    </div>
                  </div>
                ))}

                <div className="flex flex-col items-center justify-center rounded-xl py-5 mt-2"
                  style={{ background: '#0d1829', border: '1px dashed #1e3450' }}>
                  <QrCodeIcon size={32} style={{ color: '#2a4a6b' }} />
                  <p className="text-[10px] mt-2 break-all px-2 text-center" style={{ color: '#3A5470' }}>{selected.qr_token || 'QR pendiente'}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#2a4a6b' }}>QR de acceso</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => openEdit(selected)}
                    className="rounded-xl py-2 text-xs font-semibold transition-all active:scale-95"
                    style={{ background: 'rgba(0,201,160,.1)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
                    Editar
                  </button>
                  <button onClick={() => { void handleCancelReg(selected.id); }}
                    disabled={selected.status === 'cancelado'}
                    className="rounded-xl py-2 text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
                    style={{ background: 'rgba(242,68,99,.1)', color: '#F24463', border: '1px solid rgba(242,68,99,.2)' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NovoModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar inscripción' : 'Nueva inscripción'}
        subtitle={editing ? `Editando: ${editing.full_name}` : `Registrar participante en ${event.name}`}
        width={560}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={() => { void handleSave(); }} disabled={saving || !form.name || !form.email}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear registro'}
            </ModalBtn>
          </>
        }
      >
        {error ? (
          <p className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(242,68,99,.12)', color: '#F24463' }}>{error}</p>
        ) : null}
        <div className="space-y-5">
          <FormSection title="Datos del participante">
            <FormField label="Nombre completo" required>
              <FormInput value={form.name} onChange={f('name')} placeholder="Dr. Juan Pérez" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Email" required>
                <FormInput type="email" value={form.email} onChange={f('email')} placeholder="juan@hospital.com" />
              </FormField>
              <FormField label="Teléfono">
                <FormInput value={form.phone} onChange={f('phone')} placeholder="+57 310 000 0000" />
              </FormField>
              <FormField label="Empresa del CRM">
                <FormSelect value={form.company_id} onChange={f('company_id')}
                  options={[{ value: '', label: 'Ninguna' }, ...companies.map(c => ({ value: c.id, label: c.name }))]} />
              </FormField>
              <FormField label="Institución">
                <FormInput value={form.company} onChange={f('company')} placeholder="Hospital, clínica…" />
              </FormField>
            </div>
          </FormSection>
          <FormSection title="Tipo y estado">
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Tipo">
                <FormSelect value={form.registration_type} onChange={v => setForm(p => ({ ...p, registration_type: v as NovoRegistrationType }))} options={TYPE_OPTIONS} />
              </FormField>
              <FormField label="Estado">
                <FormSelect value={form.status} onChange={v => setForm(p => ({ ...p, status: v as RegistrationStatus }))} options={STATUS_OPTIONS} />
              </FormField>
              <FormField label="Monto ($)">
                <FormInput type="number" value={form.amount} onChange={f('amount')} placeholder="180000" />
              </FormField>
            </div>
          </FormSection>
        </div>
      </NovoModal>
    </div>
  );
}
