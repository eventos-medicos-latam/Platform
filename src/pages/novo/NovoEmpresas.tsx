import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  SearchIcon, PlusIcon, BuildingIcon,
  TrendingUpIcon, FileTextIcon,
} from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { AgreementStatusPill } from '../../components/novo/ui/StatusPill';
import { MOCK_AGREEMENTS } from '../../lib/novo/mock';
import { formatCurrency } from '../../lib/novo/events';
import { RowActions } from '../../components/novo/ui/RowActions';
import { NovoModal, ModalBtn, FormField, FormInput, FormSelect } from '../../components/novo/ui/NovoModal';

// ── Mock companies ──────────────────────────────────────────────────────────
const SECTORES = ['Farmacéutica', 'Nutrición médica', 'Diagnóstico', 'Alimentación', 'Tecnología', 'Seguros', 'Otro'];
const INIT_COMPANIES = [
  {
    id: 'co-001', name: 'Laboratorios Roche Colombia', sector: 'Farmacéutica',
    city: 'Bogotá', website: 'roche.com', contacts: 8, events: 3,
    total_deal: 18000000, status: 'cerrado' as const,
    emoji: '🔬',
  },
  {
    id: 'co-002', name: 'Nestlé Health Science', sector: 'Nutrición médica',
    city: 'Cali', website: 'nestle.com', contacts: 4, events: 1,
    total_deal: 8500000, status: 'aprobado' as const,
    emoji: '🥛',
  },
  {
    id: 'co-003', name: 'Abbott Laboratories', sector: 'Diagnóstico',
    city: 'Bogotá', website: 'abbott.com', contacts: 5, events: 2,
    total_deal: 12000000, status: 'cerrado' as const,
    emoji: '💊',
  },
  {
    id: 'co-004', name: 'Pfizer Colombia', sector: 'Farmacéutica',
    city: 'Bogotá', website: 'pfizer.com', contacts: 3, events: 2,
    total_deal: null, status: 'pendiente' as const,
    emoji: '🧪',
  },
  {
    id: 'co-005', name: 'Nutresa Salud', sector: 'Alimentación',
    city: 'Medellín', website: 'nutresa.com', contacts: 2, events: 1,
    total_deal: 5000000, status: 'cerrado' as const,
    emoji: '🌿',
  },
  {
    id: 'co-006', name: 'MSD Colombia', sector: 'Farmacéutica',
    city: 'Bogotá', website: 'msd.com', contacts: 4, events: 0,
    total_deal: null, status: 'pendiente' as const,
    emoji: '🏥',
  },
];

const EMPTY_CO_FORM = { name: '', sector: 'Farmacéutica', city: '', website: '', status: 'pendiente' };
type AgreementStatus = 'cerrado' | 'aprobado' | 'pendiente';

const STATUS_STYLES: Record<AgreementStatus, { color: string; bg: string; label: string }> = {
  cerrado:  { color: '#00C9A0', bg: 'rgba(0,201,160,.12)',   label: 'Cerrado'      },
  aprobado: { color: '#F59E0B', bg: 'rgba(245,158,11,.12)',  label: 'Aprobado'     },
  pendiente:{ color: '#5B8AF0', bg: 'rgba(91,138,240,.12)',  label: 'En negociación'},
};

export function NovoEmpresas() {
  const [companies, setCompanies] = useState(INIT_COMPANIES);
  const [search, setSearch]       = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<typeof INIT_COMPANIES[0] | null>(null);
  const [form, setForm]           = useState(EMPTY_CO_FORM);
  const [saving, setSaving]       = useState(false);

  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_CO_FORM); setModalOpen(true); };
  const openEdit   = (co: typeof INIT_COMPANIES[0]) => { setEditing(co); setForm({ name: co.name, sector: co.sector, city: co.city, website: co.website, status: co.status }); setModalOpen(true); };
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      if (editing) {
        setCompanies(prev => prev.map(c => c.id !== editing.id ? c : { ...c, name: form.name, sector: form.sector, city: form.city, website: form.website, status: form.status as AgreementStatus }));
      } else {
        setCompanies(prev => [{ id: `co-${Date.now()}`, name: form.name, sector: form.sector, city: form.city, website: form.website, contacts: 0, events: 0, total_deal: null, status: form.status as AgreementStatus, emoji: '🏢' }, ...prev]);
      }
      setModalOpen(false);
    }, 700);
  };
  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta empresa?')) return;
    setCompanies(prev => prev.filter(c => c.id !== id));
  };

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.sector.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase()),
  );

  const totalAcordado = companies.reduce((s, c) => s + (c.total_deal ?? 0), 0);
  const cerradas = companies.filter(c => c.status === 'cerrado').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>
            CRM global
          </p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>
            Empresas
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#7A9CB8' }}>
            {companies.length} empresas · acuerdos, cartera y participaciones
          </p>
        </div>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}>
          <PlusIcon size={15} strokeWidth={2.5} /> Nueva empresa
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <KPICard label="Total empresas" value={companies.length.toString()}
          sub="en la plataforma" icon={BuildingIcon} delay={0} />
        <KPICard label="Acuerdos cerrados" value={cerradas.toString()}
          sub={`de ${companies.length} empresas`}
          icon={FileTextIcon} accent="#A78BFA" delay={0.05} />
        <KPICard label="Total acordado" value={formatCurrency(totalAcordado)}
          sub="acumulado todos los eventos"
          icon={TrendingUpIcon} accent="#FF7043" delay={0.1} />
      </div>

      {/* Búsqueda */}
      <div className="mb-4">
        <div
          className="relative inline-flex items-center"
          style={{ background: '#112035', border: '1px solid #1e3450', borderRadius: 12 }}
        >
          <SearchIcon size={14} className="absolute left-3" style={{ color: '#3A5470' }} />
          <input
            type="text"
            placeholder="Buscar empresa, sector o ciudad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent pl-9 pr-4 py-2 text-sm outline-none w-72"
            style={{ color: '#E1EAF4' }}
          />
        </div>
      </div>

      {/* Tabla */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ border: '1px solid #1e3450', background: '#112035' }}
      >
        {/* Cabecera */}
        <div
          className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-3"
          style={{
            gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 1fr auto',
            color: '#3A5470',
            borderBottom: '1px solid #1a2e45',
            background: '#182d47',
          }}
        >
          <span>Empresa</span>
          <span>Sector</span>
          <span>Ciudad</span>
          <span>Eventos</span>
          <span>Acuerdo total</span>
          <span>Estado</span>
          <span className="w-20" />
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: '#3A5470' }}>
            <p className="text-sm">Sin resultados</p>
          </div>
        )}

        {filtered.map((co, i) => {
          const st = STATUS_STYLES[co.status];
          return (
            <motion.div
              key={co.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1], delay: i * 0.04 }}
              className="group grid items-center px-5 py-4 transition-colors duration-150 cursor-pointer"
              style={{
                gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 1fr auto',
                borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none',
              }}
              onClick={() => openEdit(co)}
              onMouseEnter={e => (e.currentTarget.style.background = '#182d47')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Empresa */}
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ background: '#182d47', border: '1px solid #1e3450' }}
                >
                  {co.emoji}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: '#E1EAF4' }}>
                    {co.name}
                  </p>
                  <p className="text-xs" style={{ color: '#3A5470' }}>
                    {co.website} · {co.contacts} contactos
                  </p>
                </div>
              </div>

              {/* Sector */}
              <div>
                <p className="text-sm" style={{ color: '#7A9CB8' }}>{co.sector}</p>
              </div>

              {/* Ciudad */}
              <div>
                <p className="text-sm" style={{ color: '#7A9CB8' }}>{co.city}</p>
              </div>

              {/* Eventos */}
              <div>
                <p className="text-sm font-semibold tabular-nums" style={{ color: '#E1EAF4' }}>
                  {co.events}
                </p>
              </div>

              {/* Acuerdo */}
              <div>
                <p className="text-sm font-semibold tabular-nums"
                  style={{ color: co.total_deal ? '#00C9A0' : '#3A5470' }}>
                  {co.total_deal ? formatCurrency(co.total_deal) : '—'}
                </p>
              </div>

              {/* Estado */}
              <div>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{ color: st.color, background: st.bg }}>{st.label}</span>
              </div>
              <div className="w-20 flex justify-end">
                <RowActions
                  onEdit={() => openEdit(co)}
                  onDelete={() => handleDelete(co.id)}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      <NovoModal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar empresa' : 'Nueva empresa'}
        subtitle={editing ? `Editando ${editing.name}` : 'Agregar empresa al CRM'}
        width={480}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={handleSave} disabled={saving || !form.name}>
              {saving ? 'Guardando…' : editing ? 'Guardar' : 'Crear empresa'}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Nombre de la empresa" required>
            <FormInput value={form.name} onChange={f('name')} placeholder="Nombre completo o razón social" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Sector">
              <FormSelect value={form.sector} onChange={f('sector')} options={SECTORES.map(s => ({ value: s, label: s }))} />
            </FormField>
            <FormField label="Estado">
              <FormSelect value={form.status} onChange={f('status')} options={[
                { value: 'pendiente', label: 'En negociación' },
                { value: 'aprobado',  label: 'Aprobado' },
                { value: 'cerrado',   label: 'Cerrado' },
              ]} />
            </FormField>
            <FormField label="Ciudad">
              <FormInput value={form.city} onChange={f('city')} placeholder="Bogotá, Medellín…" />
            </FormField>
            <FormField label="Sitio web">
              <FormInput value={form.website} onChange={f('website')} placeholder="empresa.com" />
            </FormField>
          </div>
        </div>
      </NovoModal>
    </div>
  );
}
