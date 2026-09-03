import React, { useState } from 'react';
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
import type { NovoEvent } from '../../../types/novo';

interface EventContext { event: NovoEvent }

type TicketStatus = 'confirmado' | 'pendiente' | 'cancelado' | 'lista_espera';
type TicketType   = 'medico' | 'estudiante' | 'industria' | 'cortesia';

interface Registration {
  id: string;
  name: string;
  email: string;
  company: string;
  ticket_type: TicketType;
  status: TicketStatus;
  registered_at: string;
  amount: number;
  qr_code: string;
}

const INIT_REGS: Registration[] = [
  { id: 'r001', name: 'Dra. Valentina Ospina',  email: 'vospina@hospital.com',    company: 'Hospital Pablo Tobón',   ticket_type: 'medico',     status: 'confirmado',   registered_at: '2026-08-10', amount: 180000, qr_code: 'QR-001' },
  { id: 'r002', name: 'Dr. Andrés Mejía',        email: 'amejia@clinica.com',      company: 'Clínica Medellín',       ticket_type: 'medico',     status: 'confirmado',   registered_at: '2026-08-12', amount: 180000, qr_code: 'QR-002' },
  { id: 'r003', name: 'Laura Gómez',             email: 'lgomez@uni.edu.co',       company: 'Univ. de Antioquia',     ticket_type: 'estudiante', status: 'pendiente',    registered_at: '2026-08-15', amount: 80000,  qr_code: 'QR-003' },
  { id: 'r004', name: 'Felipe Restrepo',         email: 'frestrepo@roche.com',     company: 'Roche',                  ticket_type: 'industria',  status: 'confirmado',   registered_at: '2026-08-16', amount: 250000, qr_code: 'QR-004' },
  { id: 'r005', name: 'Dra. Camila Ríos',        email: 'crios@eps.com.co',        company: 'EPS Sanitas',            ticket_type: 'medico',     status: 'confirmado',   registered_at: '2026-08-17', amount: 180000, qr_code: 'QR-005' },
  { id: 'r006', name: 'Marcos Velásquez',        email: 'mvelasquez@pfizer.com',   company: 'Pfizer Colombia',        ticket_type: 'industria',  status: 'lista_espera', registered_at: '2026-08-18', amount: 250000, qr_code: 'QR-006' },
  { id: 'r007', name: 'Alejandra Morales',       email: 'amorales@gmail.com',      company: 'Independiente',          ticket_type: 'medico',     status: 'cancelado',    registered_at: '2026-08-19', amount: 180000, qr_code: 'QR-007' },
  { id: 'r008', name: 'Dr. Juan Esteban Vargas', email: 'jevargas@hospital.com',   company: 'Hospital San Vicente',   ticket_type: 'medico',     status: 'confirmado',   registered_at: '2026-08-20', amount: 180000, qr_code: 'QR-008' },
  { id: 'r009', name: 'Sofía Castro',            email: 'scastro@novasc.com',      company: 'Novartis Colombia',      ticket_type: 'cortesia',   status: 'confirmado',   registered_at: '2026-08-21', amount: 0,      qr_code: 'QR-009' },
  { id: 'r010', name: 'Ricardo Patiño',          email: 'rpati@uni.edu.co',        company: 'Univ. CES',              ticket_type: 'estudiante', status: 'pendiente',    registered_at: '2026-08-22', amount: 80000,  qr_code: 'QR-010' },
];

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bg: string }> = {
  confirmado:   { label: 'Confirmado',   color: '#00C9A0', bg: 'rgba(0,201,160,.12)'   },
  pendiente:    { label: 'Pendiente',    color: '#F59E0B', bg: 'rgba(245,158,11,.12)'  },
  cancelado:    { label: 'Cancelado',    color: '#F24463', bg: 'rgba(242,68,99,.12)'   },
  lista_espera: { label: 'Lista espera', color: '#A78BFA', bg: 'rgba(167,139,250,.12)' },
};

const TYPE_CONFIG: Record<TicketType, { label: string; color: string }> = {
  medico:     { label: 'Médico',     color: '#5B8AF0' },
  estudiante: { label: 'Estudiante', color: '#00C9A0' },
  industria:  { label: 'Industria',  color: '#FF7043' },
  cortesia:   { label: 'Cortesía',   color: '#A78BFA' },
};

const TYPE_OPTIONS = Object.entries(TYPE_CONFIG).map(([v, c]) => ({ value: v, label: c.label }));
const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }));

const ALL_STATUSES: TicketStatus[] = ['confirmado', 'pendiente', 'cancelado', 'lista_espera'];

const fmt = (n: number) =>
  n === 0 ? 'Cortesía' : `$${n.toLocaleString('es-CO')}`;

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const GRADIENTS = [
  'linear-gradient(135deg,#1a4a7a,#2d6fae)',
  'linear-gradient(135deg,#1a6b5a,#00C9A0)',
  'linear-gradient(135deg,#5b2d8a,#A78BFA)',
  'linear-gradient(135deg,#7a3a1a,#FF7043)',
  'linear-gradient(135deg,#1a3a7a,#5B8AF0)',
];

const EMPTY_FORM = {
  name: '', email: '', company: '',
  ticket_type: 'medico' as TicketType,
  status: 'pendiente' as TicketStatus,
  amount: '180000',
};

export function NovoEventInscripciones() {
  const { event } = useOutletContext<EventContext>();
  const [registrations, setRegistrations] = useState<Registration[]>(INIT_REGS);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'todos'>('todos');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Registration | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Registration | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const f = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (r: Registration) => {
    setEditing(r);
    setForm({ name: r.name, email: r.email, company: r.company, ticket_type: r.ticket_type, status: r.status, amount: String(r.amount) });
    setModalOpen(true);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      if (editing) {
        const updated = { ...editing, name: form.name, email: form.email, company: form.company, ticket_type: form.ticket_type, status: form.status, amount: Number(form.amount) };
        setRegistrations(prev => prev.map(r => r.id !== editing.id ? r : updated));
        if (selected?.id === editing.id) setSelected(updated);
      } else {
        const newR: Registration = {
          id: `r-${Date.now()}`,
          name: form.name, email: form.email, company: form.company,
          ticket_type: form.ticket_type, status: form.status,
          amount: Number(form.amount),
          registered_at: new Date().toISOString().split('T')[0],
          qr_code: `QR-${Date.now()}`,
        };
        setRegistrations(prev => [newR, ...prev]);
      }
      setModalOpen(false);
    }, 600);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return;
    setRegistrations(prev => prev.filter(r => r.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const handleDuplicate = (r: Registration) => {
    const copy: Registration = { ...r, id: `r-${Date.now()}`, status: 'pendiente', qr_code: `QR-${Date.now()}` };
    setRegistrations(prev => [copy, ...prev]);
  };

  const handleCancelReg = (id: string) => {
    setRegistrations(prev => prev.map(r => r.id !== id ? r : { ...r, status: 'cancelado' }));
    if (selected?.id === id) setSelected(s => s ? { ...s, status: 'cancelado' } : null);
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'Email', 'Empresa', 'Ticket', 'Estado', 'Monto', 'Fecha'];
    const rows = registrations.map(r => [r.name, r.email, r.company, r.ticket_type, r.status, r.amount, r.registered_at]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `inscripciones-${event.id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = registrations.filter(r => {
    const matchStatus = statusFilter === 'todos' || r.status === statusFilter;
    const q = query.toLowerCase();
    const matchQ = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.company.toLowerCase().includes(q);
    return matchStatus && matchQ;
  });

  const counts = {
    total:       registrations.length,
    confirmados: registrations.filter(r => r.status === 'confirmado').length,
    pendientes:  registrations.filter(r => r.status === 'pendiente').length,
    cancelados:  registrations.filter(r => r.status === 'cancelado').length,
  };
  const ingresos = registrations.filter(r => r.status === 'confirmado').reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Inscripciones</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>Registros · tickets · estados · QR</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}>
          <PlusIcon size={13} /> Nueva inscripción
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Total inscritos"  value={counts.total.toString()}       icon={UsersIcon}      accent="#00C9A0" delay={0} />
        <KPICard label="Confirmados"      value={counts.confirmados.toString()}  icon={CheckCircleIcon} accent="#00C9A0" progress={counts.total ? Math.round((counts.confirmados/counts.total)*100) : 0} delay={0.05} />
        <KPICard label="Pendientes"       value={counts.pendientes.toString()}   icon={TicketIcon}     accent="#F59E0B" delay={0.1} />
        <KPICard label="Ingresos netos"   value={`$${(ingresos/1000).toFixed(0)}K`} icon={XCircleIcon} accent="#5B8AF0" delay={0.15} />
      </div>

      {/* Toolbar */}
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
        {/* Tabla */}
        <div className="flex-1 overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
          <div className="grid px-5 py-3"
            style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr auto', borderBottom: '1px solid #1e3450' }}>
            {['Participante', 'Empresa', 'Ticket', 'Monto', 'Estado', ''].map(h => (
              <p key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#2a4a6b' }}>{h}</p>
            ))}
          </div>
          {filtered.map((reg, i) => {
            const st = STATUS_CONFIG[reg.status];
            const tt = TYPE_CONFIG[reg.ticket_type];
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
                    {initials(reg.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#E1EAF4' }}>{reg.name}</p>
                    <p className="text-[10px]" style={{ color: '#3A5470' }}>{reg.email}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <p className="text-sm truncate" style={{ color: '#7A9CB8' }}>{reg.company}</p>
                </div>
                <div className="flex items-center">
                  <span className="text-xs font-semibold" style={{ color: tt.color }}>{tt.label}</span>
                </div>
                <div className="flex items-center">
                  <p className="text-sm tabular-nums" style={{ color: '#E1EAF4' }}>{fmt(reg.amount)}</p>
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
                    onDuplicate={() => handleDuplicate(reg)}
                    onDelete={() => handleDelete(reg.id)}
                  />
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm" style={{ color: '#2a4a6b' }}>Sin resultados</p>
            </div>
          )}
        </div>

        {/* Panel lateral */}
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
                    style={{ background: GRADIENTS[registrations.indexOf(selected) % GRADIENTS.length] }}>
                    {initials(selected.name)}
                  </div>
                  <p className="text-sm font-bold text-center" style={{ color: '#E1EAF4' }}>{selected.name}</p>
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ color: STATUS_CONFIG[selected.status].color, background: STATUS_CONFIG[selected.status].bg }}>
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                </div>

                {[
                  { icon: MailIcon,     label: 'Email',   value: selected.email },
                  { icon: BuildingIcon, label: 'Empresa', value: selected.company },
                  { icon: TicketIcon,   label: 'Ticket',  value: TYPE_CONFIG[selected.ticket_type].label },
                  { icon: CalendarIcon, label: 'Registro',value: new Date(selected.registered_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 mb-4">
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
                  <p className="text-[10px] mt-2" style={{ color: '#3A5470' }}>{selected.qr_code}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#2a4a6b' }}>QR de acceso</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => openEdit(selected)}
                    className="rounded-xl py-2 text-xs font-semibold transition-all active:scale-95"
                    style={{ background: 'rgba(0,201,160,.1)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
                    Editar
                  </button>
                  <button onClick={() => handleCancelReg(selected.id)}
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

      {/* ═══ MODAL ══════════════════════════════════════════════════════════ */}
      <NovoModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar inscripción' : 'Nueva inscripción'}
        subtitle={editing ? `Editando: ${editing.name}` : 'Registrar participante manualmente'}
        width={560}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={handleSave} disabled={saving || !form.name || !form.email}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear registro'}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-5">
          <FormSection title="Datos del participante">
            <FormField label="Nombre completo" required>
              <FormInput value={form.name} onChange={f('name')} placeholder="Dr. Juan Pérez" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Email" required>
                <FormInput type="email" value={form.email} onChange={f('email')} placeholder="juan@hospital.com" />
              </FormField>
              <FormField label="Empresa / Institución">
                <FormInput value={form.company} onChange={f('company')} placeholder="Hospital, clínica…" />
              </FormField>
            </div>
          </FormSection>
          <FormSection title="Ticket y estado">
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Tipo de ticket">
                <FormSelect value={form.ticket_type} onChange={v => setForm(p => ({ ...p, ticket_type: v as TicketType }))} options={TYPE_OPTIONS} />
              </FormField>
              <FormField label="Estado">
                <FormSelect value={form.status} onChange={v => setForm(p => ({ ...p, status: v as TicketStatus }))} options={STATUS_OPTIONS} />
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
