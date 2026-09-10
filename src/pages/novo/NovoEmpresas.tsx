import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  SearchIcon, PlusIcon, BuildingIcon,
  TrendingUpIcon, FileTextIcon,
} from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { formatCurrency } from '../../lib/novo/events';
import {
  listCompanies, createCompany, updateCompany, deleteCompany, duplicateCompany,
  type CompanyAgreementStatus, type NovoCompany,
} from '../../lib/novo/companies';
import { RowActions } from '../../components/novo/ui/RowActions';
import {
  NovoModal, ModalBtn,
  FormField, FormInput, FormSelect, FormTextarea, FormSection, ImageField,
} from '../../components/novo/ui/NovoModal';

const SECTORES = [
  'Farmacéutica', 'Nutrición médica', 'Diagnóstico', 'Alimentación',
  'Tecnología', 'Seguros', 'Dispositivos médicos', 'Biotecnología', 'Otro',
];

const PAISES = ['Colombia', 'México', 'Perú', 'Chile', 'Argentina', 'Ecuador', 'Panamá', 'Otro'];

type AgreementStatus = CompanyAgreementStatus;
type Company = NovoCompany;

const EMPTY_FORM = {
  name: '', razon_social: '', nit: '', sector: 'Farmacéutica',
  logo: '', emoji: '🏢',
  ciudad: '', departamento: '', pais: 'Colombia', direccion: '',
  website: '', email_principal: '',
  contacto_nombre: '', contacto_cargo: '', contacto_email: '', contacto_tel: '',
  status: 'pendiente', notas: '',
};

const STATUS_STYLES: Record<AgreementStatus, { color: string; bg: string; label: string }> = {
  cerrado:   { color: '#00C9A0', bg: 'rgba(0,201,160,.12)',  label: 'Cerrado'       },
  aprobado:  { color: '#F59E0B', bg: 'rgba(245,158,11,.12)', label: 'Aprobado'      },
  pendiente: { color: '#5B8AF0', bg: 'rgba(91,138,240,.12)', label: 'En negociación' },
};

export function NovoEmpresas() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch]       = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Company | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const f = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    listCompanies({ includeSample: true }).then(setCompanies).catch(() => setCompanies([]));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (co: Company) => {
    setEditing(co);
    setForm({
      name: co.name, razon_social: co.razon_social, nit: co.nit,
      sector: co.sector, logo: co.logo, emoji: co.emoji,
      ciudad: co.ciudad, departamento: co.departamento, pais: co.pais, direccion: co.direccion,
      website: co.website, email_principal: co.email_principal,
      contacto_nombre: co.contacto_nombre, contacto_cargo: co.contacto_cargo,
      contacto_email: co.contacto_email, contacto_tel: co.contacto_tel,
      status: co.status, notas: co.notas,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const input = {
      name: form.name, razon_social: form.razon_social, nit: form.nit,
      sector: form.sector, logo: form.logo,
      ciudad: form.ciudad, departamento: form.departamento, pais: form.pais, direccion: form.direccion,
      website: form.website, email_principal: form.email_principal,
      contacto_nombre: form.contacto_nombre, contacto_cargo: form.contacto_cargo,
      contacto_email: form.contacto_email, contacto_tel: form.contacto_tel,
      notas: form.notas,
    };
    try {
      if (editing) {
        const saved = await updateCompany(editing.id, input);
        setCompanies(prev => prev.map(c => c.id !== editing.id ? c : saved));
      } else {
        const saved = await createCompany(input);
        setCompanies(prev => [saved, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo guardar la empresa.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta empresa?')) return;
    try {
      await deleteCompany(id);
      setCompanies(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar. Puede tener participaciones o pagos.');
    }
  };

  const handleDuplicate = async (co: Company) => {
    try {
      const copy = await duplicateCompany(co);
      setCompanies(prev => [copy, ...prev]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo duplicar.');
    }
  };

  const filtered = companies.filter(c =>
    [c.name, c.sector, c.ciudad, c.contacto_nombre, c.nit].some(v =>
      v.toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalAcordado = companies.reduce((s, c) => s + (c.total_deal ?? 0), 0);
  const cerradas = companies.filter(c => c.status === 'cerrado').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>CRM global</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Empresas</h1>
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
          sub={`de ${companies.length} empresas`} icon={FileTextIcon} accent="#A78BFA" delay={0.05} />
        <KPICard label="Total acordado" value={formatCurrency(totalAcordado)}
          sub="acumulado todos los eventos" icon={TrendingUpIcon} accent="#FF7043" delay={0.1} />
      </div>

      {/* Búsqueda */}
      <div className="mb-4">
        <div className="relative inline-flex items-center"
          style={{ background: '#112035', border: '1px solid #1e3450', borderRadius: 12 }}>
          <SearchIcon size={14} className="absolute left-3" style={{ color: '#3A5470' }} />
          <input type="text" placeholder="Buscar empresa, sector, ciudad o NIT..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent pl-9 pr-4 py-2 text-sm outline-none w-80"
            style={{ color: '#E1EAF4' }} />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid #1e3450', background: '#112035' }}>
        <div className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-3"
          style={{ gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 1fr auto', color: '#3A5470', borderBottom: '1px solid #1a2e45', background: '#182d47' }}>
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
            <motion.div key={co.id}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1], delay: i * 0.04 }}
              className="group grid items-center px-5 py-4 transition-colors duration-150 cursor-pointer"
              style={{ gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 1fr auto', borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none' }}
              onClick={() => openEdit(co)}
              onMouseEnter={e => (e.currentTarget.style.background = '#182d47')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg overflow-hidden"
                  style={{ background: '#182d47', border: '1px solid #1e3450' }}>
                  {co.logo
                    ? <img src={co.logo} alt="" className="h-full w-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                    : co.emoji
                  }
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: '#E1EAF4' }}>{co.name}</p>
                  <p className="text-xs" style={{ color: '#3A5470' }}>
                    {co.nit} · {co.contacto_nombre}
                  </p>
                </div>
              </div>
              <div><p className="text-sm" style={{ color: '#7A9CB8' }}>{co.sector}</p></div>
              <div><p className="text-sm" style={{ color: '#7A9CB8' }}>{co.ciudad}</p></div>
              <div><p className="text-sm font-semibold tabular-nums" style={{ color: '#E1EAF4' }}>{co.events}</p></div>
              <div>
                <p className="text-sm font-semibold tabular-nums"
                  style={{ color: co.total_deal ? '#00C9A0' : '#3A5470' }}>
                  {co.total_deal ? formatCurrency(co.total_deal) : '—'}
                </p>
              </div>
              <div>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{ color: st.color, background: st.bg }}>{st.label}</span>
              </div>
              <div className="w-20 flex justify-end">
                <RowActions
                  onEdit={() => openEdit(co)}
                  onDuplicate={() => handleDuplicate(co)}
                  onDelete={() => handleDelete(co.id)}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ═══ MODAL ══════════════════════════════════════════════════════════ */}
      <NovoModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar empresa' : 'Nueva empresa'}
        subtitle={editing ? `Editando ${editing.name}` : 'Registrar empresa en el CRM'}
        width={640}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={handleSave} disabled={saving || !form.name}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear empresa'}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-6">

          {/* Identidad */}
          <FormSection title="Identidad">
            <ImageField
              label="Logo"
              value={form.logo}
              onChange={f('logo')}
              hint="URL pública del logo (PNG o SVG con fondo transparente ideal)"
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Nombre comercial" required>
                <FormInput value={form.name} onChange={f('name')} placeholder="Nombre con el que se presenta" />
              </FormField>
              <FormField label="Razón social">
                <FormInput value={form.razon_social} onChange={f('razon_social')} placeholder="Nombre legal completo" />
              </FormField>
              <FormField label="NIT / Documento tributario">
                <FormInput value={form.nit} onChange={f('nit')} placeholder="900.123.456-7" />
              </FormField>
              <FormField label="Sector">
                <FormSelect value={form.sector} onChange={f('sector')}
                  options={SECTORES.map(s => ({ value: s, label: s }))} />
              </FormField>
              <FormField label="Estado comercial">
                <FormSelect value={form.status} onChange={f('status')} options={[
                  { value: 'pendiente', label: 'En negociación' },
                  { value: 'aprobado',  label: 'Aprobado' },
                  { value: 'cerrado',   label: 'Cerrado / Activo' },
                ]} />
              </FormField>
              <FormField label="Sitio web">
                <FormInput value={form.website} onChange={f('website')} placeholder="empresa.com" />
              </FormField>
            </div>
          </FormSection>

          {/* Ubicación */}
          <FormSection title="Ubicación">
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Ciudad">
                <FormInput value={form.ciudad} onChange={f('ciudad')} placeholder="Bogotá" />
              </FormField>
              <FormField label="Departamento / Estado">
                <FormInput value={form.departamento} onChange={f('departamento')} placeholder="Cundinamarca" />
              </FormField>
              <FormField label="País">
                <FormSelect value={form.pais} onChange={f('pais')}
                  options={PAISES.map(p => ({ value: p, label: p }))} />
              </FormField>
            </div>
            <FormField label="Dirección completa">
              <FormInput value={form.direccion} onChange={f('direccion')} placeholder="Calle 100 # 8A-55, Torre A, Oficina 1201" />
            </FormField>
          </FormSection>

          {/* Contacto principal */}
          <FormSection title="Contacto principal">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Nombre">
                <FormInput value={form.contacto_nombre} onChange={f('contacto_nombre')} placeholder="Nombre completo" />
              </FormField>
              <FormField label="Cargo">
                <FormInput value={form.contacto_cargo} onChange={f('contacto_cargo')} placeholder="Gerente de Cuentas" />
              </FormField>
              <FormField label="Email">
                <FormInput type="email" value={form.contacto_email} onChange={f('contacto_email')} placeholder="nombre@empresa.com" />
              </FormField>
              <FormField label="Teléfono">
                <FormInput value={form.contacto_tel} onChange={f('contacto_tel')} placeholder="+57 310 555 0000" />
              </FormField>
            </div>
            <FormField label="Email corporativo general">
              <FormInput type="email" value={form.email_principal} onChange={f('email_principal')} placeholder="contacto@empresa.com" />
            </FormField>
          </FormSection>

          {/* Notas internas */}
          <FormSection title="Notas internas">
            <FormField label="Observaciones" hint="Solo visibles para el equipo de EML">
              <FormTextarea value={form.notas} onChange={f('notas')}
                placeholder="Historial de conversaciones, condiciones especiales, referencias…" rows={3} />
            </FormField>
          </FormSection>

        </div>
      </NovoModal>
    </div>
  );
}
