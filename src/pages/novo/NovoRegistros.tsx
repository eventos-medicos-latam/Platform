import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchIcon, PlusIcon, UsersIcon, BadgeCheckIcon, TicketIcon,
  XIcon, PencilIcon, CopyIcon, TrashIcon, ChevronRightIcon,
  MailIcon, PhoneIcon, BuildingIcon, CalendarIcon, CheckCircleIcon,
  ClockIcon, BanknoteIcon, UserIcon, TagIcon,
} from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { RowActions } from '../../components/novo/ui/RowActions';
import {
  NovoModal, ModalBtn, FormSection, FormField, FormInput, FormSelect,
} from '../../components/novo/ui/NovoModal';
import { formatCurrency, formatDate } from '../../lib/novo/events';

/* ── Tipos ─────────────────────────────────────────────────── */
type RegType   = 'compra' | 'cortesia' | 'sponsor' | 'gratuito';
type RegStatus = 'confirmado' | 'asistio' | 'cancelado' | 'espera';
type Origin    = 'web' | 'admin' | 'portal-empresa' | 'importacion';

interface Registration {
  id: string;
  person_id: string;
  full_name: string;
  email: string;
  phone?: string;
  specialty?: string;
  company?: string;
  event_id: string;
  event_name: string;
  registration_type: RegType;
  origin: Origin;
  amount_paid: number;
  currency: string;
  status: RegStatus;
  created_at: string;
  notes?: string;
}

/* ── Config ────────────────────────────────────────────────── */
const TIPO_CFG: Record<RegType, { color: string; bg: string; label: string }> = {
  compra:   { color: '#00C9A0', bg: 'rgba(0,201,160,.12)',   label: 'Compra'   },
  cortesia: { color: '#A78BFA', bg: 'rgba(167,139,250,.12)', label: 'Cortesía' },
  sponsor:  { color: '#FF7043', bg: 'rgba(255,112,67,.12)',  label: 'Sponsor'  },
  gratuito: { color: '#7A9CB8', bg: 'rgba(122,156,184,.10)', label: 'Gratuito' },
};
const STATUS_CFG: Record<RegStatus, { color: string; bg: string; label: string; dot?: string }> = {
  confirmado: { color: '#5B8AF0', bg: 'rgba(91,138,240,.12)',  label: 'Confirmado' },
  asistio:    { color: '#00C9A0', bg: 'rgba(0,201,160,.12)',   label: 'Asistió',   dot: '#00C9A0' },
  cancelado:  { color: '#F24463', bg: 'rgba(242,68,99,.12)',   label: 'Cancelado'  },
  espera:     { color: '#F59E0B', bg: 'rgba(245,158,11,.12)',  label: 'En espera'  },
};
const ORIGIN_LABEL: Record<Origin, string> = {
  web: 'Web', admin: 'Admin', 'portal-empresa': 'Portal empresa', importacion: 'Importación',
};
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#00C9A0,#007AFF)',
  'linear-gradient(135deg,#FF7043,#F59E0B)',
  'linear-gradient(135deg,#A78BFA,#5B8AF0)',
  'linear-gradient(135deg,#5B8AF0,#00C9A0)',
  'linear-gradient(135deg,#F24463,#FF7043)',
  'linear-gradient(135deg,#00C9A0,#A78BFA)',
];
const BG      = '#112035';
const BG_DEEP = '#0d1829';
const BORDER  = '#1e3450';
const TEXT_HI = '#E1EAF4';
const TEXT_LO = '#7A9CB8';
const TEXT_DIM = '#3A5470';

/* ── Datos mock ────────────────────────────────────────────── */
const INIT_REGS: Registration[] = [
  { id:'reg-001', person_id:'p-001', full_name:'Dr. Alejandro Moreno', email:'amoreno@clinica.co',   phone:'+57 310 123 4567', specialty:'Endocrinología', company:'Clínica El Bosque',   event_id:'evt-1', event_name:'La Eterna Primavera', registration_type:'compra',   origin:'web',    amount_paid:480000, currency:'COP', status:'asistio',    created_at:'2025-08-15T09:30:00Z', notes:'Participó como ponente en sesión 3' },
  { id:'reg-002', person_id:'p-002', full_name:'Dra. Sofía Ramírez',   email:'sramirez@unal.edu.co', phone:'+57 311 987 6543', specialty:'Nutrición Clínica', company:'U. Nacional',      event_id:'evt-1', event_name:'La Eterna Primavera', registration_type:'compra',   origin:'web',    amount_paid:480000, currency:'COP', status:'asistio',    created_at:'2025-08-16T11:00:00Z' },
  { id:'reg-003', person_id:'p-003', full_name:'Dr. Tomás Guerrero',   email:'tguerrero@med.co',     phone:'+57 314 555 8877', specialty:'Medicina Interna',  company:'Hospital Simón',   event_id:'evt-2', event_name:'Hormobiota VI',       registration_type:'compra',   origin:'web',    amount_paid:480000, currency:'COP', status:'asistio',    created_at:'2025-08-20T16:30:00Z' },
  { id:'reg-004', person_id:'p-004', full_name:'Dra. Carolina Mejía',  email:'cmejia@roche.com',     phone:'+57 317 222 3344', specialty:'Farmacología',      company:'Laboratorios Roche',event_id:'evt-1', event_name:'La Eterna Primavera', registration_type:'cortesia', origin:'admin',  amount_paid:0,      currency:'COP', status:'asistio',    created_at:'2025-08-28T10:00:00Z' },
  { id:'reg-005', person_id:'p-005', full_name:'Dr. Felipe Arango',    email:'farango@clinicaVida.co',                           specialty:'Cardiología',       company:'Clínica Vida',     event_id:'evt-2', event_name:'Hormobiota VI',       registration_type:'compra',   origin:'web',    amount_paid:480000, currency:'COP', status:'asistio',    created_at:'2025-08-20T16:30:00Z' },
  { id:'reg-006', person_id:'p-006', full_name:'Lic. Mariana Torres',  email:'mtorres@nutrimed.co',  phone:'+57 300 444 5566', specialty:'Dietética',         company:'NutriMed',         event_id:'evt-3', event_name:'Webinar Vitamina D',  registration_type:'gratuito', origin:'web',    amount_paid:0,      currency:'COP', status:'asistio',    created_at:'2025-09-10T11:15:00Z' },
  { id:'reg-007', person_id:'p-007', full_name:'Dr. Andrés Castillo',  email:'acastillo@imss.mx',    phone:'+52 55 1234 5678', specialty:'Endocrinología',    company:'IMSS México',      event_id:'evt-2', event_name:'Hormobiota VI',       registration_type:'compra',   origin:'web',    amount_paid:480000, currency:'COP', status:'confirmado', created_at:'2025-09-01T08:00:00Z' },
  { id:'reg-008', person_id:'p-001', full_name:'Dr. Alejandro Moreno', email:'amoreno@clinica.co',   phone:'+57 310 123 4567', specialty:'Endocrinología', company:'Clínica El Bosque',   event_id:'evt-2', event_name:'Hormobiota VI',       registration_type:'cortesia', origin:'admin',  amount_paid:0,      currency:'COP', status:'confirmado', created_at:'2025-09-05T14:00:00Z', notes:'Speaker confirmado para panel final' },
];

const EVENTS = [
  'La Eterna Primavera',
  'Hormobiota VI',
  'Webinar Vitamina D',
  'Congreso de Oncología 2026',
];

const EMPTY_FORM = {
  full_name: '', email: '', phone: '', specialty: '', company: '',
  event_name: '', registration_type: 'compra' as RegType,
  origin: 'admin' as Origin, amount_paid: '', currency: 'COP',
  status: 'confirmado' as RegStatus, notes: '',
};

const FILTERS = ['Todos', 'Compras', 'Cortesías', 'Sponsors', 'Gratuitos'] as const;
type Filter = typeof FILTERS[number];

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
function avatarGrad(id: string) {
  const n = id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[n % AVATAR_GRADIENTS.length];
}

/* ══════════════════════════════════════════════════════════ */
export function NovoRegistros() {
  const [regs, setRegs]           = useState<Registration[]>(INIT_REGS);
  const [filter, setFilter]       = useState<Filter>('Todos');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState<Registration | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Registration | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  /* ── Stats ─────────────────────────────────────────────── */
  const total     = regs.length;
  const pagados   = regs.filter(r => r.amount_paid > 0).length;
  const asistidos = regs.filter(r => r.status === 'asistio').length;

  /* ── Filtro ─────────────────────────────────────────────── */
  const filtered = regs.filter(r => {
    const matchFilter =
      filter === 'Todos' ||
      (filter === 'Compras'   && r.registration_type === 'compra')   ||
      (filter === 'Cortesías' && r.registration_type === 'cortesia') ||
      (filter === 'Sponsors'  && r.registration_type === 'sponsor')  ||
      (filter === 'Gratuitos' && r.registration_type === 'gratuito');
    const q = search.toLowerCase();
    const matchSearch = !q || r.full_name.toLowerCase().includes(q) ||
      r.event_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  /* ── CRUD ───────────────────────────────────────────────── */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };
  const openEdit = (r: Registration) => {
    setEditing(r);
    setForm({
      full_name: r.full_name, email: r.email, phone: r.phone ?? '',
      specialty: r.specialty ?? '', company: r.company ?? '',
      event_name: r.event_name, registration_type: r.registration_type,
      origin: r.origin, amount_paid: String(r.amount_paid),
      currency: r.currency, status: r.status, notes: r.notes ?? '',
    });
    setModalOpen(true);
  };
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      const pid = editing?.person_id ?? `p-${Date.now()}`;
      const newR: Registration = {
        id:                editing?.id ?? `reg-${Date.now()}`,
        person_id:         pid,
        full_name:         form.full_name,
        email:             form.email,
        phone:             form.phone || undefined,
        specialty:         form.specialty || undefined,
        company:           form.company || undefined,
        event_id:          editing?.event_id ?? `evt-${Date.now()}`,
        event_name:        form.event_name,
        registration_type: form.registration_type,
        origin:            form.origin,
        amount_paid:       Number(form.amount_paid) || 0,
        currency:          form.currency,
        status:            form.status,
        created_at:        editing?.created_at ?? new Date().toISOString(),
        notes:             form.notes || undefined,
      };
      setRegs(prev => editing
        ? prev.map(r => r.id === editing.id ? newR : r)
        : [...prev, newR]);
      if (selected?.id === editing?.id) setSelected(newR);
      setSaving(false);
      setModalOpen(false);
    }, 650);
  };
  const handleDuplicate = (r: Registration) => {
    setRegs(prev => [...prev, { ...r, id: `reg-${Date.now()}`, status: 'confirmado', created_at: new Date().toISOString() }]);
  };
  const handleDelete = (id: string) => {
    setRegs(prev => prev.filter(r => r.id !== id));
    if (selected?.id === id) setSelected(null);
  };
  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  /* ── Historia de persona ────────────────────────────────── */
  const personHistory = selected
    ? regs.filter(r => r.person_id === selected.person_id).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  /* ─────────────────────────────────────────────────────── */
  return (
    <div className="flex gap-5" style={{ minHeight: 0 }}>
      {/* ── Main ── */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>
              Vista global
            </p>
            <h1 className="text-xl font-bold" style={{ color: TEXT_HI, fontFamily: "'Sora', sans-serif" }}>
              Registros
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: TEXT_LO }}>
              Todas las personas · todos los eventos
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
            style={{ background: '#00C9A0', color: '#0d1829' }}
          >
            <PlusIcon size={15} strokeWidth={2.5} /> Agregar registro
          </button>
        </div>

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <KPICard label="Total registros" value={total.toString()} sub="todas las ediciones" icon={UsersIcon} delay={0} />
          <KPICard label="Con pago confirmado" value={pagados.toString()} sub={`de ${total} registros`}
            icon={BadgeCheckIcon} accent="#5B8AF0" delay={0.05} />
          <KPICard label="Check-in completado" value={asistidos.toString()} sub="asistencia registrada"
            icon={TicketIcon} accent="#A78BFA" delay={0.1} />
        </div>

        {/* Controles */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex items-center"
            style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
            <SearchIcon size={14} className="absolute left-3" style={{ color: TEXT_DIM }} />
            <input
              type="text"
              placeholder="Buscar persona, evento o email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent pl-9 pr-4 py-2 text-sm outline-none w-60"
              style={{ color: TEXT_HI }}
            />
          </div>
          <div className="flex items-center gap-0.5 p-1 rounded-xl"
            style={{ background: BG, border: `1px solid ${BORDER}` }}>
            {FILTERS.map(fi => (
              <button key={fi} type="button" onClick={() => setFilter(fi)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
                style={{ background: filter === fi ? '#1e3450' : 'transparent', color: filter === fi ? TEXT_HI : TEXT_DIM }}>
                {fi}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${BORDER}`, background: BG }}>
          <div className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-3"
            style={{ gridTemplateColumns: '2.4fr 1.7fr 1fr 1fr 1fr 40px', color: TEXT_DIM,
              borderBottom: '1px solid #1a2e45', background: '#182d47' }}>
            <span>Persona</span><span>Evento</span><span>Tipo</span>
            <span>Pagado</span><span>Estado</span><span />
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center" style={{ color: TEXT_DIM }}>
              <p className="text-sm">Sin resultados</p>
            </div>
          )}

          {filtered.map((reg, i) => {
            const tipo = TIPO_CFG[reg.registration_type];
            const st   = STATUS_CFG[reg.status];
            const grad = avatarGrad(reg.person_id);
            const isActive = selected?.id === reg.id;

            return (
              <motion.div key={reg.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1], delay: i * 0.035 }}
                className="group grid items-center px-5 py-3.5 cursor-pointer transition-colors duration-150"
                style={{
                  gridTemplateColumns: '2.4fr 1.7fr 1fr 1fr 1fr 40px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none',
                  background: isActive ? '#182d47' : 'transparent',
                }}
                onClick={() => setSelected(isActive ? null : reg)}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#182d47'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: grad }}>
                    {initials(reg.full_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: TEXT_HI }}>{reg.full_name}</p>
                    <p className="text-xs truncate" style={{ color: TEXT_DIM }}>{reg.email}</p>
                  </div>
                </div>

                <div className="min-w-0 pr-2">
                  <p className="truncate text-sm" style={{ color: TEXT_LO }}>{reg.event_name}</p>
                  <p className="text-xs" style={{ color: TEXT_DIM }}>{formatDate(reg.created_at.split('T')[0])}</p>
                </div>

                <div>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ color: tipo.color, background: tipo.bg }}>
                    {tipo.label}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-semibold tabular-nums"
                    style={{ color: reg.amount_paid > 0 ? '#00C9A0' : TEXT_DIM }}>
                    {reg.amount_paid > 0 ? formatCurrency(reg.amount_paid) : '—'}
                  </p>
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ color: st.color, background: st.bg }}>
                    {st.dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot, boxShadow: `0 0 5px ${st.dot}` }} />}
                    {st.label}
                  </span>
                </div>

                <div onClick={e => e.stopPropagation()}>
                  <RowActions
                    onEdit={() => openEdit(reg)}
                    onDuplicate={() => handleDuplicate(reg)}
                    onDelete={() => handleDelete(reg.id)}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Ficha de persona ── */}
      <AnimatePresence>
        {selected && (
          <motion.aside
            key="ficha"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="w-80 shrink-0 rounded-2xl overflow-hidden flex flex-col"
            style={{ background: BG, border: `1px solid ${BORDER}`, alignSelf: 'flex-start', position: 'sticky', top: 0 }}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${BORDER}`, background: '#182d47' }}>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#00C9A0' }}>
                Ficha de persona
              </span>
              <button type="button" onClick={() => setSelected(null)}
                className="rounded-lg p-1 transition-colors hover:bg-white/5" style={{ color: TEXT_DIM }}>
                <XIcon size={14} />
              </button>
            </div>

            {/* Avatar + datos */}
            <div className="px-5 py-5 flex flex-col gap-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                  style={{ background: avatarGrad(selected.person_id) }}>
                  {initials(selected.full_name)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm leading-snug" style={{ color: TEXT_HI }}>{selected.full_name}</p>
                  {selected.specialty && <p className="text-xs" style={{ color: '#00C9A0' }}>{selected.specialty}</p>}
                  {selected.company && <p className="text-xs" style={{ color: TEXT_LO }}>{selected.company}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <a href={`mailto:${selected.email}`}
                  className="flex items-center gap-2 text-xs transition-colors hover:opacity-80"
                  style={{ color: TEXT_LO }} onClick={e => e.stopPropagation()}>
                  <MailIcon size={12} style={{ color: TEXT_DIM }} /> {selected.email}
                </a>
                {selected.phone && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: TEXT_LO }}>
                    <PhoneIcon size={12} style={{ color: TEXT_DIM }} /> {selected.phone}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => openEdit(selected)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all hover:opacity-80"
                  style={{ background: '#1e3450', color: TEXT_HI }}>
                  <PencilIcon size={12} /> Editar
                </button>
                <button type="button" onClick={() => handleDuplicate(selected)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all hover:opacity-80"
                  style={{ background: '#1e3450', color: TEXT_HI }}>
                  <CopyIcon size={12} /> Duplicar
                </button>
              </div>
            </div>

            {/* Stats rápidos */}
            <div className="grid grid-cols-2 gap-px" style={{ background: BORDER }}>
              {[
                { label: 'Eventos', value: new Set(personHistory.map(r => r.event_id)).size },
                { label: 'Asistencias', value: personHistory.filter(r => r.status === 'asistio').length },
                { label: 'Total pagado', value: formatCurrency(personHistory.reduce((s, r) => s + r.amount_paid, 0)) },
                { label: 'Origen', value: ORIGIN_LABEL[selected.origin] },
              ].map(item => (
                <div key={item.label} className="flex flex-col gap-0.5 px-4 py-3" style={{ background: BG }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_DIM }}>{item.label}</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: TEXT_HI }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Historial de eventos */}
            <div className="px-5 py-4 flex-1 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: TEXT_DIM }}>
                Historial de participación
              </p>
              <div className="flex flex-col gap-2">
                {personHistory.map(r => {
                  const st   = STATUS_CFG[r.status];
                  const tipo = TIPO_CFG[r.registration_type];
                  return (
                    <div key={r.id}
                      className="rounded-xl p-3 flex flex-col gap-1.5"
                      style={{ background: '#182d47', border: `1px solid ${BORDER}` }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold leading-snug" style={{ color: TEXT_HI }}>
                          {r.event_name}
                        </p>
                        <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ color: st.color, background: st.bg }}>
                          {st.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ color: tipo.color, background: tipo.bg }}>
                          {tipo.label}
                        </span>
                        {r.amount_paid > 0 && (
                          <span className="text-[11px] font-semibold tabular-nums" style={{ color: '#00C9A0' }}>
                            {formatCurrency(r.amount_paid)}
                          </span>
                        )}
                        <span className="ml-auto text-[10px]" style={{ color: TEXT_DIM }}>
                          {formatDate(r.created_at.split('T')[0])}
                        </span>
                      </div>
                      {r.notes && (
                        <p className="text-[11px] leading-relaxed" style={{ color: TEXT_LO }}>
                          {r.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Modal CRUD ── */}
      <NovoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar registro' : 'Agregar registro'}
        subtitle={editing ? 'Modifica los datos de este registro' : 'Registra una persona en un evento'}
        width={600}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </ModalBtn>
            <ModalBtn variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar registro'}
            </ModalBtn>
          </>
        }
      >
        <FormSection title="Datos de la persona">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombre completo" required>
              <FormInput placeholder="Dr. Nombre Apellido" value={form.full_name} onChange={f('full_name')} />
            </FormField>
            <FormField label="Email" required>
              <FormInput type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={f('email')} />
            </FormField>
            <FormField label="Teléfono">
              <FormInput placeholder="+57 310 000 0000" value={form.phone} onChange={f('phone')} />
            </FormField>
            <FormField label="Especialidad">
              <FormInput placeholder="Ej. Endocrinología" value={form.specialty} onChange={f('specialty')} />
            </FormField>
            <FormField label="Empresa / Institución" className="col-span-2">
              <FormInput placeholder="Ej. Clínica El Bosque" value={form.company} onChange={f('company')} />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Datos del registro">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Evento" required className="col-span-2">
              <FormSelect value={form.event_name} onChange={f('event_name')}
                options={[{ value: '', label: 'Seleccionar evento…' }, ...EVENTS.map(e => ({ value: e, label: e }))]} />
            </FormField>
            <FormField label="Tipo de registro">
              <FormSelect value={form.registration_type} onChange={f('registration_type')}
                options={[
                  { value: 'compra',   label: 'Compra' },
                  { value: 'cortesia', label: 'Cortesía' },
                  { value: 'sponsor',  label: 'Sponsor' },
                  { value: 'gratuito', label: 'Gratuito' },
                ]} />
            </FormField>
            <FormField label="Origen">
              <FormSelect value={form.origin} onChange={f('origin')}
                options={[
                  { value: 'web',             label: 'Web' },
                  { value: 'admin',           label: 'Admin' },
                  { value: 'portal-empresa',  label: 'Portal empresa' },
                  { value: 'importacion',     label: 'Importación' },
                ]} />
            </FormField>
            <FormField label="Monto pagado">
              <FormInput type="number" placeholder="0" value={form.amount_paid} onChange={f('amount_paid')} />
            </FormField>
            <FormField label="Estado">
              <FormSelect value={form.status} onChange={f('status')}
                options={[
                  { value: 'confirmado', label: 'Confirmado' },
                  { value: 'asistio',    label: 'Asistió' },
                  { value: 'cancelado',  label: 'Cancelado' },
                  { value: 'espera',     label: 'En espera' },
                ]} />
            </FormField>
            <FormField label="Notas" className="col-span-2">
              <FormInput placeholder="Notas internas opcionales…" value={form.notes} onChange={f('notes')} />
            </FormField>
          </div>
        </FormSection>
      </NovoModal>
    </div>
  );
}
