import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BuildingIcon, DollarSignIcon, CheckCircleIcon, AlertCircleIcon,
  PlusIcon, StarIcon,
} from 'lucide-react';
import { KPICard } from '../../../components/novo/ui/KPICard';
import { RowActions } from '../../../components/novo/ui/RowActions';
import {
  NovoModal, ModalBtn,
  FormField, FormInput, FormSelect, FormTextarea, FormSection, ImageField,
} from '../../../components/novo/ui/NovoModal';
import type { NovoEvent } from '../../../types/novo';

interface EventContext { event: NovoEvent }

type PlanTier = 'platino' | 'oro' | 'plata' | 'bronce' | 'aliado';
type SponsorStatus = 'activo' | 'pendiente_pago' | 'negociacion' | 'declinado';

interface Sponsor {
  id: string;
  company: string;
  logo: string;
  contact_name: string;
  contact_email: string;
  contact_tel: string;
  plan: PlanTier;
  amount: number;
  status: SponsorStatus;
  benefits_checked: number;
  benefits_total: number;
  notas: string;
}

const PLAN_CONFIG: Record<PlanTier, { label: string; color: string; bg: string; order: number }> = {
  platino: { label: 'Platino', color: '#A78BFA', bg: 'rgba(167,139,250,.12)', order: 1 },
  oro:     { label: 'Oro',     color: '#F59E0B', bg: 'rgba(245,158,11,.12)',  order: 2 },
  plata:   { label: 'Plata',   color: '#7A9CB8', bg: 'rgba(122,156,184,.12)', order: 3 },
  bronce:  { label: 'Bronce',  color: '#FF7043', bg: 'rgba(255,112,67,.12)',  order: 4 },
  aliado:  { label: 'Aliado',  color: '#00C9A0', bg: 'rgba(0,201,160,.12)',   order: 5 },
};

const STATUS_CONFIG: Record<SponsorStatus, { label: string; color: string; bg: string }> = {
  activo:         { label: 'Activo',       color: '#00C9A0', bg: 'rgba(0,201,160,.12)'  },
  pendiente_pago: { label: 'Pago pend.',   color: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
  negociacion:    { label: 'Negociación',  color: '#5B8AF0', bg: 'rgba(91,138,240,.12)' },
  declinado:      { label: 'Declinado',    color: '#F24463', bg: 'rgba(242,68,99,.12)'  },
};

const INIT_SPONSORS: Sponsor[] = [
  { id: 'sp1', company: 'Roche Colombia',     logo: '', contact_name: 'Felipe Restrepo',  contact_email: 'f.restrepo@roche.com', contact_tel: '+57 310 111 0001', plan: 'platino', amount: 18000000, status: 'activo',         benefits_checked: 8, benefits_total: 10, notas: 'Stand doble confirmado. Tarima 30 min apertura.' },
  { id: 'sp2', company: 'Nestlé Health Sci.', logo: '', contact_name: 'Ana Gutiérrez',    contact_email: 'a.gutierrez@nestle.com', contact_tel: '+57 311 222 0002', plan: 'oro',     amount: 12000000, status: 'pendiente_pago', benefits_checked: 5, benefits_total: 7,  notas: 'Contrato firmado. Pendiente 2do pago.' },
  { id: 'sp3', company: 'Pfizer Colombia',    logo: '', contact_name: 'Marcos Velásquez', contact_email: 'm.velasquez@pfizer.com', contact_tel: '+57 312 333 0003', plan: 'oro',     amount: 12000000, status: 'activo',         benefits_checked: 7, benefits_total: 7,  notas: '' },
  { id: 'sp4', company: 'Tecnoquímicas',      logo: '', contact_name: 'Gloria Suárez',    contact_email: 'g.suarez@tecnoq.com',   contact_tel: '+57 313 444 0004', plan: 'plata',   amount: 7000000,  status: 'activo',         benefits_checked: 4, benefits_total: 5,  notas: '' },
  { id: 'sp5', company: 'Novartis Colombia',  logo: '', contact_name: 'Sofía Castro',     contact_email: 's.castro@novartis.com', contact_tel: '+57 314 555 0005', plan: 'bronce',  amount: 4000000,  status: 'negociacion',    benefits_checked: 0, benefits_total: 3,  notas: 'Primera reunión 15 oct.' },
  { id: 'sp6', company: 'Instituto de Salud', logo: '', contact_name: 'Dr. Rivera',       contact_email: 'rivera@is.gov.co',      contact_tel: '+57 315 666 0006', plan: 'aliado',  amount: 0,        status: 'activo',         benefits_checked: 2, benefits_total: 2,  notas: 'Aliado institucional sin pago.' },
];

const EMPTY_FORM = {
  company: '', logo: '', contact_name: '', contact_email: '', contact_tel: '',
  plan: 'oro' as PlanTier, amount: '', status: 'negociacion' as SponsorStatus,
  benefits_checked: '0', benefits_total: '5', notas: '',
};

const fmt = (n: number) => n === 0 ? 'Aliado' : `$${(n / 1_000_000).toFixed(1)}M`;

export function NovoEventPatrocinadores() {
  const { event } = useOutletContext<EventContext>();
  const [sponsors, setSponsors] = useState<Sponsor[]>(INIT_SPONSORS);
  const [selected, setSelected] = useState<Sponsor | null>(null);
  const [filter, setFilter]     = useState<PlanTier | 'todos'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Sponsor | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const f = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit   = (sp: Sponsor) => {
    setEditing(sp);
    setForm({
      company: sp.company, logo: sp.logo,
      contact_name: sp.contact_name, contact_email: sp.contact_email, contact_tel: sp.contact_tel,
      plan: sp.plan, amount: String(sp.amount), status: sp.status,
      benefits_checked: String(sp.benefits_checked), benefits_total: String(sp.benefits_total),
      notas: sp.notas,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      const data: Partial<Sponsor> = {
        company: form.company, logo: form.logo,
        contact_name: form.contact_name, contact_email: form.contact_email, contact_tel: form.contact_tel,
        plan: form.plan, amount: Number(form.amount) || 0, status: form.status,
        benefits_checked: Number(form.benefits_checked) || 0,
        benefits_total:   Number(form.benefits_total)   || 5,
        notas: form.notas,
      };
      if (editing) {
        setSponsors(prev => prev.map(s => s.id !== editing.id ? s : { ...s, ...data } as Sponsor));
        if (selected?.id === editing.id) setSelected(s => s ? { ...s, ...data } as Sponsor : null);
      } else {
        setSponsors(prev => [...prev, { id: `sp-${Date.now()}`, ...data } as Sponsor]);
      }
      setModalOpen(false);
    }, 600);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este patrocinador?')) return;
    setSponsors(prev => prev.filter(s => s.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const handleDuplicate = (sp: Sponsor) => {
    setSponsors(prev => [...prev, {
      ...sp, id: `sp-${Date.now()}`, company: `${sp.company} (copia)`, status: 'negociacion', benefits_checked: 0,
    }]);
  };

  const filtered = filter === 'todos' ? sponsors : sponsors.filter(s => s.plan === filter);
  const activos  = sponsors.filter(s => s.status === 'activo');
  const ingresos = activos.reduce((sum, s) => sum + s.amount, 0);
  const pending  = sponsors.filter(s => s.status === 'pendiente_pago').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Patrocinadores</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>Empresas · planes · beneficios · pagos</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}>
          <PlusIcon size={14} /> Agregar patrocinador
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Patrocinadores"   value={sponsors.length.toString()} icon={BuildingIcon}    accent="#00C9A0" delay={0}    />
        <KPICard label="Activos"           value={activos.length.toString()} icon={CheckCircleIcon} accent="#00C9A0"
          progress={sponsors.length ? Math.round((activos.length / sponsors.length) * 100) : 0} delay={0.05} />
        <KPICard label="Ingresos patro."   value={`$${(ingresos / 1_000_000).toFixed(1)}M`} icon={DollarSignIcon}  accent="#FF7043" delay={0.1}  />
        <KPICard label="Pagos pendientes"  value={pending.toString()}        icon={AlertCircleIcon} accent="#F59E0B" delay={0.15} />
      </div>

      {/* Filtro */}
      <div className="mb-4 flex rounded-xl overflow-hidden" style={{ border: '1px solid #1e3450', width: 'fit-content' }}>
        {(['todos', 'platino', 'oro', 'plata', 'bronce', 'aliado'] as const).map(p => (
          <button key={p} onClick={() => setFilter(p)}
            className="px-3.5 py-2 text-xs font-semibold transition-colors"
            style={{
              background: filter === p ? '#182d47' : '#112035',
              color: filter === p ? '#E1EAF4' : '#2a4a6b',
              borderRight: '1px solid #1e3450',
            }}>
            {p === 'todos' ? 'Todos' : PLAN_CONFIG[p].label}
          </button>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Tabla */}
        <div className="flex-1 overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
          {/* Cabecera */}
          <div className="grid px-5 py-3" style={{ gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1fr auto', borderBottom: '1px solid #1e3450', background: '#182d47' }}>
            {['Empresa', 'Contacto', 'Plan', 'Monto', 'Beneficios', 'Estado', ''].map((h, i) => (
              <p key={i} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3A5470' }}>{h}</p>
            ))}
          </div>
          {filtered.map((sp, i) => {
            const plan = PLAN_CONFIG[sp.plan];
            const st   = STATUS_CONFIG[sp.status];
            const isSelected = selected?.id === sp.id;
            const pctBenefits = sp.benefits_total > 0 ? Math.round((sp.benefits_checked / sp.benefits_total) * 100) : 0;
            return (
              <motion.div key={sp.id}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.04 }}
                onClick={() => setSelected(isSelected ? null : sp)}
                className="grid px-5 py-4 cursor-pointer transition-colors"
                style={{
                  gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1fr auto',
                  borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none',
                  background: isSelected ? '#182d47' : 'transparent',
                }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'rgba(24,45,71,0.4)')}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden"
                    style={{ background: plan.bg, border: `1px solid ${plan.color}30` }}>
                    {sp.logo
                      ? <img src={sp.logo} alt="" className="h-full w-full object-cover" onError={e => { e.currentTarget.style.display='none'; }} />
                      : <BuildingIcon size={14} style={{ color: plan.color }} />
                    }
                  </div>
                  <p className="text-sm font-semibold truncate" style={{ color: '#E1EAF4' }}>{sp.company}</p>
                </div>
                <p className="flex items-center text-xs truncate" style={{ color: '#7A9CB8' }}>{sp.contact_name}</p>
                <div className="flex items-center">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ color: plan.color, background: plan.bg }}>
                    <StarIcon size={9} /> {plan.label}
                  </span>
                </div>
                <p className="flex items-center text-sm font-semibold tabular-nums" style={{ color: '#E1EAF4' }}>{fmt(sp.amount)}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#1e3450' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pctBenefits}%`, background: '#00C9A0' }} />
                  </div>
                  <span className="text-[10px] tabular-nums shrink-0" style={{ color: '#3A5470' }}>{sp.benefits_checked}/{sp.benefits_total}</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ color: st.color, background: st.bg }}>{st.label}</span>
                </div>
                <div className="flex items-center" onClick={e => e.stopPropagation()}>
                  <RowActions
                    onEdit={() => openEdit(sp)}
                    onDuplicate={() => handleDuplicate(sp)}
                    onDelete={() => handleDelete(sp.id)}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Panel detalle */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 268 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden shrink-0 rounded-2xl"
              style={{ background: '#112035', border: '1px solid #1e3450' }}
            >
              <div className="p-5">
                {/* Plan badge */}
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold mb-3"
                  style={{ color: PLAN_CONFIG[selected.plan].color, background: PLAN_CONFIG[selected.plan].bg }}>
                  <StarIcon size={9} /> {PLAN_CONFIG[selected.plan].label}
                </span>
                <p className="text-sm font-bold" style={{ color: '#E1EAF4' }}>{selected.company}</p>
                <p className="text-xs mt-0.5 mb-4" style={{ color: '#7A9CB8' }}>{selected.contact_name}</p>

                {/* Contacto */}
                {(selected.contact_email || selected.contact_tel) && (
                  <div className="rounded-xl p-3 mb-4 space-y-1.5" style={{ background: '#0d1829', border: '1px solid #1e3450' }}>
                    {selected.contact_email && <p className="text-[11px]" style={{ color: '#7A9CB8' }}>✉ {selected.contact_email}</p>}
                    {selected.contact_tel   && <p className="text-[11px]" style={{ color: '#7A9CB8' }}>📞 {selected.contact_tel}</p>}
                  </div>
                )}

                {/* Monto */}
                <div className="rounded-xl p-4 mb-4" style={{ background: '#0d1829', border: '1px solid #1e3450' }}>
                  <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: '#3A5470' }}>Monto comprometido</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: '#E1EAF4' }}>{fmt(selected.amount)}</p>
                  <span className="inline-flex mt-2 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ color: STATUS_CONFIG[selected.status].color, background: STATUS_CONFIG[selected.status].bg }}>
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                </div>

                {/* Beneficios */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#3A5470' }}>Beneficios entregados</p>
                    <p className="text-xs font-bold" style={{ color: '#E1EAF4' }}>{selected.benefits_checked}/{selected.benefits_total}</p>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: '#1e3450' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${selected.benefits_total > 0 ? Math.round((selected.benefits_checked / selected.benefits_total) * 100) : 0}%`, background: '#00C9A0' }} />
                  </div>
                </div>

                {/* Notas */}
                {selected.notas && (
                  <div className="rounded-xl p-3 mb-4" style={{ background: '#0d1829', border: '1px solid #1e3450' }}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: '#3A5470' }}>Notas</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: '#7A9CB8' }}>{selected.notas}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => openEdit(selected)}
                    className="rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-95"
                    style={{ background: 'rgba(0,201,160,.1)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(selected.id)}
                    className="rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-95"
                    style={{ background: 'rgba(242,68,99,.08)', color: '#F24463', border: '1px solid rgba(242,68,99,.2)' }}>
                    Eliminar
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
        title={editing ? 'Editar patrocinador' : 'Nuevo patrocinador'}
        subtitle={editing ? `Editando: ${editing.company}` : 'Registrar empresa en este evento'}
        width={600}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={handleSave} disabled={saving || !form.company}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar patrocinador'}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-5">
          <FormSection title="Empresa">
            <ImageField label="Logo" value={form.logo} onChange={f('logo')} hint="URL pública del logo" />
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FormField label="Nombre de la empresa" required>
                  <FormInput value={form.company} onChange={f('company')} placeholder="Laboratorios Roche Colombia" />
                </FormField>
              </div>
              <FormField label="Plan">
                <FormSelect value={form.plan} onChange={v => setForm(p => ({ ...p, plan: v as PlanTier }))}
                  options={Object.entries(PLAN_CONFIG)
                    .sort(([,a],[,b]) => a.order - b.order)
                    .map(([v, c]) => ({ value: v, label: c.label }))} />
              </FormField>
              <FormField label="Estado">
                <FormSelect value={form.status} onChange={v => setForm(p => ({ ...p, status: v as SponsorStatus }))}
                  options={Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))} />
              </FormField>
              <FormField label="Monto (COP)" hint="0 para aliados sin pago">
                <FormInput type="number" value={form.amount} onChange={f('amount')} placeholder="12000000" />
              </FormField>
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Beneficios entregados">
                  <FormInput type="number" value={form.benefits_checked} onChange={f('benefits_checked')} placeholder="0" />
                </FormField>
                <FormField label="Total beneficios">
                  <FormInput type="number" value={form.benefits_total} onChange={f('benefits_total')} placeholder="5" />
                </FormField>
              </div>
            </div>
          </FormSection>
          <FormSection title="Contacto">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Nombre contacto">
                <FormInput value={form.contact_name} onChange={f('contact_name')} placeholder="Felipe Restrepo" />
              </FormField>
              <FormField label="Cargo / email">
                <FormInput type="email" value={form.contact_email} onChange={f('contact_email')} placeholder="f.restrepo@empresa.com" />
              </FormField>
              <div className="col-span-2">
                <FormField label="Teléfono">
                  <FormInput value={form.contact_tel} onChange={f('contact_tel')} placeholder="+57 310 555 0000" />
                </FormField>
              </div>
            </div>
          </FormSection>
          <FormSection title="Notas internas">
            <FormField label="Observaciones">
              <FormTextarea value={form.notas} onChange={f('notas')} placeholder="Condiciones especiales, pendientes, historial…" rows={2} />
            </FormField>
          </FormSection>
        </div>
      </NovoModal>
    </div>
  );
}
