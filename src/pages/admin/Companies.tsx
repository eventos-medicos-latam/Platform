import React, { useEffect, useState } from 'react';
import { PencilIcon, PlusIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { Drawer } from '../../components/ui/Drawer';
import { usePlatform } from '../../contexts/PlatformContext';
import { participationStatusMeta, requirementStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { formatCompactCop, formatCop } from '../../utils/format';
import { Pending } from '../../components/ui/Pending';
import { supabase } from '../../lib/supabaseClient';
import { AdminModal, modalFieldClass, ModalField } from '../../components/admin/AdminModal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { RowActions } from '../../components/admin/RowActions';
import { moveToTrash } from '../../lib/trash';
import { getCompanyFileUrl, publishCompanyLogoFromAsset } from '../../lib/storage';

interface Company {
  id: string;
  trade_name: string;
  legal_name: string | null;
  nit: string | null;
  city: string | null;
  country: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
}

interface Participation {
  id: string;
  company_id: string;
  edition_id: string;
  roles: string[];
  plan_id: string;
  stand_id: string | null;
  included_tickets: number;
  agreed_amount: number | null;
  paid_amount: number;
  status: keyof typeof participationStatusMeta;
  banner_tier: string | null;
}

interface Plan { id: string; name: string; }
interface Requirement { id: string; title: string; due_date: string | null; status: keyof typeof requirementStatusMeta; }
interface Payment { id: string; concept: string; due_date: string | null; amount: number; status: string; }
interface CompanyDoc { id: string; name: string; kind: string; date: string; size_label: string | null; status: string; }
interface Activity { id: string; date: string; actor: string; action: string; comment: string | null; }
interface BrandAsset { id: string; kind: string; name: string; status: string; file_path: string | null; }

const brandAssetStatusOptions = ['pendiente', 'cargado', 'aprobado', 'requiere-cambios'];

const roleOptions = ['patrocinador', 'expositor', 'aliado-comercial', 'marca', 'sociedad-medica', 'aliado-academico', 'aliado-institucional', 'certificador', 'organizador', 'media-partner'];
const bannerTierOptions = ['principal', 'destacado', 'apoyo'];
const statusOptions = Object.entries(participationStatusMeta) as [Participation['status'], { label: string }][];

const emptyParticipation = (editionId: string, planId = 'pop-up'): Omit<Participation, 'id'> => ({
  company_id: '', edition_id: editionId, roles: [], plan_id: planId, stand_id: null, included_tickets: 0, agreed_amount: null, paid_amount: 0, status: 'en-negociacion', banner_tier: null
});
const emptyCompany: Omit<Company, 'id'> = { trade_name: '', legal_name: '', nit: '', city: '', country: '', contact_name: '', contact_email: '', contact_whatsapp: '' };

function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

function friendlyCompanyError(message: string): string {
  if (message.includes('companies_nit_unique')) return 'Ya existe una empresa con ese NIT.';
  return message;
}

function friendlyParticipationError(message: string): string {
  if (message.includes('participations_company_id_edition_id')) return 'Esta empresa ya tiene una participación en esta edición.';
  if (message.includes('participation_plan_editions') || message.includes('plan_id_edition_id')) return 'Ese plan no está disponible en la edición activa.';
  return message;
}

export function Companies() {
  const { activeEditionId } = usePlatform();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ requirements: Requirement[]; payments: Payment[]; documents: CompanyDoc[]; activity: Activity[]; assets: BrandAsset[] }>({ requirements: [], payments: [], documents: [], activity: [], assets: [] });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Participation, 'id'>>(emptyParticipation(activeEditionId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trashTarget, setTrashTarget] = useState<Participation | null>(null);
  const [trashing, setTrashing] = useState(false);

  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [companyForm, setCompanyForm] = useState<Omit<Company, 'id'>>(emptyCompany);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const load = async () => {
    const [{ data: participationRows }, { data: companyRows }, { data: planRows }] = await Promise.all([
      supabase.from('participations').select('*').eq('edition_id', activeEditionId),
      supabase.from('companies').select('id, trade_name, legal_name, nit, city, country, contact_name, contact_email, contact_whatsapp'),
      supabase.from('participation_plan_types').select('id, name')
    ]);
    setParticipations(participationRows ?? []);
    setCompanies(companyRows ?? []);
    setPlans(planRows ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditionId]);

  const selected = participations.find((item) => item.id === openId);
  const company = selected ? companies.find((item) => item.id === selected.company_id) : undefined;

  const loadDetail = async () => {
    if (!company) { setDetail({ requirements: [], payments: [], documents: [], activity: [], assets: [] }); return; }
    const [{ data: req }, { data: pay }, { data: docs }, { data: activity }, { data: assets }] = await Promise.all([
      supabase.from('requirements').select('id, title, due_date, status').eq('company_id', company.id),
      supabase.from('company_payments').select('id, concept, due_date, amount, status').eq('company_id', company.id),
      supabase.from('company_documents').select('id, name, kind, date, size_label, status').eq('company_id', company.id),
      supabase.from('activity_log').select('id, date, actor, action, comment').eq('company_id', company.id).order('date', { ascending: false }).limit(20),
      supabase.from('brand_assets').select('id, kind, name, status, file_path').eq('company_id', company.id)
    ]);
    setDetail({ requirements: req ?? [], payments: pay ?? [], documents: docs ?? [], activity: activity ?? [], assets: assets ?? [] });
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  const updateAssetStatus = async (assetId: string, status: string) => {
    await supabase.from('brand_assets').update({ status }).eq('id', assetId);
    if (status === 'aprobado' && company) {
      const asset = detail.assets.find((item) => item.id === assetId);
      if (asset && (asset.kind === 'logo-png' || asset.kind === 'logo-svg') && asset.file_path) {
        await publishCompanyLogoFromAsset(company.id, asset.file_path);
      }
    }
    loadDetail();
  };

  const openAssetFile = async (path: string | null) => {
    if (!path) return;
    const url = await getCompanyFileUrl(path);
    if (url) window.open(url, '_blank', 'noopener');
  };

  const defaultPlanId = plans[0]?.id ?? 'pop-up';
  const companiesWithoutParticipation = companies.filter((item) => !participations.some((participation) => participation.company_id === item.id));
  const companyChoices = editingId
    ? companies
    : companies.filter((item) => item.id === form.company_id || !participations.some((participation) => participation.company_id === item.id));

  const openCreate = () => { setEditingId(null); setForm(emptyParticipation(activeEditionId, defaultPlanId)); setError(null); setModalOpen(true); };
  const openCreateForCompany = (companyId: string) => {
    setEditingId(null);
    setForm({ ...emptyParticipation(activeEditionId, defaultPlanId), company_id: companyId });
    setError(null);
    setModalOpen(true);
  };
  const openEdit = (participation: Participation) => { setEditingId(participation.id); const { id: _id, ...rest } = participation; setForm(rest); setError(null); setModalOpen(true); };

  const toggleRole = (role: string) => {
    setForm((current) => ({ ...current, roles: current.roles.includes(role) ? current.roles.filter((r) => r !== role) : [...current.roles, role] }));
  };

  const submit = async () => {
    if (!form.company_id) { setError('Selecciona una empresa.'); return; }
    setSaving(true);
    setError(null);
    const { paid_amount: _paid, ...payload } = form;
    const { error: submitError } = editingId
      ? await supabase.from('participations').update(payload).eq('id', editingId)
      : await supabase.from('participations').insert(payload);
    setSaving(false);
    if (submitError) { setError(friendlyParticipationError(submitError.message)); return; }
    setModalOpen(false);
    load();
  };

  const confirmTrash = async () => {
    if (!trashTarget) return;
    setTrashing(true);
    const { error: trashError } = await moveToTrash('participations', trashTarget.id);
    setTrashing(false);
    if (trashError) { setError(trashError); return; }
    setTrashTarget(null);
    setOpenId(null);
    load();
  };

  const openCreateCompany = () => { setEditingCompanyId(null); setCompanyForm(emptyCompany); setCompanyError(null); setCompanyModalOpen(true); };
  const openEditCompanyRecord = (item: Company) => {
    setEditingCompanyId(item.id);
    const { id: _id, ...rest } = item;
    setCompanyForm(rest);
    setCompanyError(null);
    setCompanyModalOpen(true);
  };
  const openEditCompany = () => {
    if (!company) return;
    openEditCompanyRecord(company);
  };
  const submitCompany = async () => {
    const tradeName = companyForm.trade_name.trim();
    if (!tradeName) {
      setCompanyError('El nombre comercial es obligatorio.');
      return;
    }
    setCompanySaving(true);
    setCompanyError(null);
    const payload = {
      trade_name: tradeName,
      legal_name: blankToNull(companyForm.legal_name),
      nit: blankToNull(companyForm.nit),
      city: blankToNull(companyForm.city),
      country: blankToNull(companyForm.country),
      contact_name: blankToNull(companyForm.contact_name),
      contact_email: blankToNull(companyForm.contact_email),
      contact_whatsapp: blankToNull(companyForm.contact_whatsapp)
    };
    if (editingCompanyId) {
      const { error: submitError } = await supabase.from('companies').update(payload).eq('id', editingCompanyId);
      setCompanySaving(false);
      if (submitError) { setCompanyError(friendlyCompanyError(submitError.message)); return; }
      setCompanyModalOpen(false);
      load();
      return;
    }
    const { data: created, error: submitError } = await supabase.from('companies').insert(payload).select('id').single();
    setCompanySaving(false);
    if (submitError) { setCompanyError(friendlyCompanyError(submitError.message)); return; }
    setCompanyModalOpen(false);
    await load();
    if (created?.id) openCreateForCompany(created.id);
  };

  return <>
      <ModuleHeader eyebrow="Comercial" title="Empresas y participaciones" description="Primero la ficha de la empresa, después el plan de esta edición. Una empresa no aparece en la tabla hasta que tiene participación." actions={<div className="flex gap-2">
            <button type="button" onClick={openCreateCompany} className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand/40">
              <PlusIcon size={15} /> Nueva empresa
            </button>
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
              <PlusIcon size={15} /> Nueva participación
            </button>
          </div>} />

      <div className="space-y-5">
      <Panel emphasis title={`${participations.length} participaciones en esta edición`} description="Selecciona una fila para ver el detalle completo.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-canvas">
              <tr>
                <th className={thClass}>Empresa</th>
                <th className={thClass}>Plan</th>
                <th className={thClass}>Rol</th>
                <th className={thClass}>Acordado</th>
                <th className={thClass}>Pagado</th>
                <th className={thClass}>Estado</th>
                <th className={thClass}>Banner</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {participations.map((participation) => {
              const item = companies.find((c) => c.id === participation.company_id);
              const plan = plans.find((p) => p.id === participation.plan_id);
              const meta = participationStatusMeta[participation.status];
              return <tr key={participation.id} onClick={() => setOpenId(participation.id)} className="cursor-pointer transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-medium text-brand`}>{item?.trade_name}</td>
                    <td className={tdClass}>{plan?.name ?? participation.plan_id}</td>
                    <td className={`${tdClass} capitalize`}>{participation.roles[0] ?? '—'}</td>
                    <td className={tdClass}>{formatCompactCop(participation.agreed_amount)}</td>
                    <td className={tdClass}>{formatCompactCop(participation.paid_amount)}</td>
                    <td className={tdClass}>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </td>
                    <td className={tdClass}>{participation.banner_tier ?? '—'}</td>
                    <td className={tdClass}>
                      <RowActions onEdit={() => openEdit(participation)} onDelete={() => setTrashTarget(participation)} />
                    </td>
                  </tr>;
            })}
              {participations.length === 0 ? <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-ink-muted">Aún no hay participaciones en esta edición. Crea una empresa o asígnale un plan a una existente.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Panel>

      {companiesWithoutParticipation.length > 0 ? <Panel title="Empresas sin participación en esta edición" description="Quedaron creadas como ficha comercial. Asígnales un plan para operarlas aquí.">
          <ul className="divide-y divide-line">
            {companiesWithoutParticipation.map((item) => <li key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-brand">{item.trade_name}</p>
                  <p className="text-xs text-ink-muted">{item.contact_email || item.nit || 'Sin NIT ni correo'}</p>
                </div>
                <button type="button" onClick={() => openEditCompanyRecord(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand/40">
                  <PencilIcon size={13} /> Editar ficha
                </button>
                <button type="button" onClick={() => openCreateForCompany(item.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
                  Asignar plan
                </button>
              </li>)}
          </ul>
        </Panel> : null}
      </div>

      <Drawer open={Boolean(selected)} onClose={() => setOpenId(null)} title={company?.trade_name ?? ''} subtitle={plans.find((p) => p.id === selected?.plan_id)?.name}>
        {selected && company ? <div className="space-y-7">
            <section>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-brand">Participación</h3>
                <RowActions onEdit={() => openEdit(selected)} />
              </div>
              <dl className="mt-3 divide-y divide-line rounded-lg border border-line">
                {[{ label: 'Estado', value: participationStatusMeta[selected.status].label }, { label: 'Valor acordado', value: formatCop(selected.agreed_amount) }, { label: 'Pagado', value: formatCop(selected.paid_amount) }, { label: 'Entradas incluidas', value: String(selected.included_tickets) }, { label: 'Nivel en banner', value: selected.banner_tier ?? '—' }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <dt className="text-sm text-ink-muted">{row.label}</dt>
                    <dd className="text-sm font-medium capitalize text-brand">{row.value}</dd>
                  </div>)}
              </dl>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-brand">Requerimientos</h3>
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
                {detail.requirements.map((requirement) => <li key={requirement.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand">{requirement.title}</p>
                      <p className="text-xs text-ink-muted">Vence: {requirement.due_date ?? '—'}</p>
                    </div>
                    <StatusBadge label={requirementStatusMeta[requirement.status].label} tone={requirementStatusMeta[requirement.status].tone} />
                  </li>)}
                {detail.requirements.length === 0 ? <li className="px-4 py-3 text-sm text-ink-muted">Sin requerimientos abiertos.</li> : null}
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-brand">Pagos</h3>
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
                {detail.payments.map((payment) => <li key={payment.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-brand">{payment.concept}</p>
                        <p className="text-xs text-ink-muted">Vence: {payment.due_date ?? '—'}</p>
                      </div>
                      <span className="text-sm font-semibold text-brand">{formatCop(payment.amount)}</span>
                      <StatusBadge label={payment.status} tone={payment.status === 'pagado' ? 'success' : payment.status === 'vencido' ? 'danger' : 'warning'} />
                    </li>)}
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-brand">Documentos</h3>
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
                {detail.documents.map((document) => <li key={document.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-brand">{document.name}</p>
                        <p className="text-xs capitalize text-ink-muted">{document.kind} · {document.date} · {document.size_label}</p>
                      </div>
                      <StatusBadge label={document.status} tone="info" />
                    </li>)}
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-brand">Activos de marca</h3>
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
                {detail.assets.map((asset) => <li key={asset.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <button type="button" disabled={!asset.file_path} onClick={() => openAssetFile(asset.file_path)} className="truncate text-left text-sm font-medium text-brand underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:no-underline">
                          {asset.name}
                        </button>
                        <p className="text-xs capitalize text-ink-muted">{asset.kind}</p>
                      </div>
                      <select value={asset.status} onChange={(event) => updateAssetStatus(asset.id, event.target.value)} className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs font-medium text-brand outline-none transition-colors duration-150 ease-emphasis focus:border-brand">
                        {brandAssetStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </li>)}
                {detail.assets.length === 0 ? <li className="px-4 py-3 text-sm text-ink-muted">Sin activos cargados.</li> : null}
              </ul>
            </section>

            <section>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-brand">Perfil</h3>
                <button type="button" onClick={openEditCompany} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-support">
                  <PencilIcon size={13} /> Editar
                </button>
              </div>
              <dl className="mt-3 divide-y divide-line rounded-lg border border-line">
                {[{ label: 'Razón social', value: company.legal_name }, { label: 'NIT', value: company.nit }, { label: 'Ciudad', value: `${company.city ?? ''}, ${company.country ?? ''}` }, { label: 'Contacto', value: company.contact_name }, { label: 'Correo', value: company.contact_email }, { label: 'WhatsApp', value: company.contact_whatsapp }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <dt className="text-sm text-ink-muted">{row.label}</dt>
                    <dd className="text-sm font-medium text-brand">{!row.value ? <Pending /> : row.value}</dd>
                  </div>)}
              </dl>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-brand">Actividad</h3>
              <ul className="mt-3 space-y-3">
                {detail.activity.map((entry) => <li key={entry.id} className="border-l-2 border-line pl-3">
                      <p className="text-sm font-medium text-brand">{entry.action}</p>
                      <p className="text-xs text-ink-muted">{new Date(entry.date).toLocaleString('es-CO')} · {entry.actor}</p>
                      {entry.comment ? <p className="mt-0.5 text-sm text-ink">{entry.comment}</p> : null}
                    </li>)}
              </ul>
            </section>
          </div> : null}
      </Drawer>

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar participación' : 'Nueva participación'} onSubmit={submit} submitting={saving} error={error}>
        <div className="space-y-4">
          <ModalField label="Empresa">
            <select className={modalFieldClass} value={form.company_id} onChange={(event) => setForm({ ...form, company_id: event.target.value })}>
              <option value="">Selecciona una empresa</option>
              {companyChoices.map((item) => <option key={item.id} value={item.id}>{item.trade_name}</option>)}
            </select>
            {!editingId && companyChoices.length === 0 ? <span className="mt-1.5 block text-[11px] text-ink-muted">No hay empresas libres en esta edición. Crea una con «Nueva empresa».</span> : null}
          </ModalField>
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField label="Plan">
              <select className={modalFieldClass} value={form.plan_id} onChange={(event) => setForm({ ...form, plan_id: event.target.value })}>
                {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
              </select>
            </ModalField>
            <ModalField label="Estado">
              <select className={modalFieldClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Participation['status'] })}>
                {statusOptions.map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
            </ModalField>
            <ModalField label="Valor acordado (COP)">
              <input type="number" className={modalFieldClass} value={form.agreed_amount ?? ''} onChange={(event) => setForm({ ...form, agreed_amount: event.target.value === '' ? null : Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Pagado (COP)">
              <input type="number" readOnly className={`${modalFieldClass} bg-canvas text-ink-muted`} value={form.paid_amount} />
              <span className="mt-1.5 block text-[11px] text-ink-muted">Se calcula solo: suma de las cuotas marcadas como pagadas en Pagos.</span>
            </ModalField>
            <ModalField label="Entradas incluidas">
              <input type="number" className={modalFieldClass} value={form.included_tickets} onChange={(event) => setForm({ ...form, included_tickets: Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Nivel en banner">
              <select className={modalFieldClass} value={form.banner_tier ?? ''} onChange={(event) => setForm({ ...form, banner_tier: event.target.value || null })}>
                <option value="">Sin banner</option>
                {bannerTierOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </ModalField>
          </div>
          <ModalField label="Roles">
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((role) => <button key={role} type="button" onClick={() => toggleRole(role)} className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium capitalize transition-colors duration-150 ease-emphasis ${form.roles.includes(role) ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink-muted hover:border-brand/40'}`}>
                    {role}
                  </button>)}
            </div>
          </ModalField>
        </div>
      </AdminModal>

      <AdminModal open={companyModalOpen} onClose={() => setCompanyModalOpen(false)} title={editingCompanyId ? 'Editar empresa' : 'Nueva empresa'} onSubmit={submitCompany} submitting={companySaving} error={companyError} submitLabel={editingCompanyId ? 'Guardar' : 'Crear y asignar plan'}>
        <div className="space-y-4">
          <ModalField label="Nombre comercial">
            <input required className={modalFieldClass} value={companyForm.trade_name} onChange={(event) => setCompanyForm({ ...companyForm, trade_name: event.target.value })} />
          </ModalField>
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField label="Razón social">
              <input className={modalFieldClass} value={companyForm.legal_name ?? ''} onChange={(event) => setCompanyForm({ ...companyForm, legal_name: event.target.value })} />
            </ModalField>
            <ModalField label="NIT">
              <input className={modalFieldClass} value={companyForm.nit ?? ''} onChange={(event) => setCompanyForm({ ...companyForm, nit: event.target.value })} />
            </ModalField>
            <ModalField label="Ciudad">
              <input className={modalFieldClass} value={companyForm.city ?? ''} onChange={(event) => setCompanyForm({ ...companyForm, city: event.target.value })} />
            </ModalField>
            <ModalField label="País">
              <input className={modalFieldClass} value={companyForm.country ?? ''} onChange={(event) => setCompanyForm({ ...companyForm, country: event.target.value })} />
            </ModalField>
            <ModalField label="Contacto">
              <input className={modalFieldClass} value={companyForm.contact_name ?? ''} onChange={(event) => setCompanyForm({ ...companyForm, contact_name: event.target.value })} />
            </ModalField>
            <ModalField label="Correo">
              <input type="email" className={modalFieldClass} value={companyForm.contact_email ?? ''} onChange={(event) => setCompanyForm({ ...companyForm, contact_email: event.target.value })} />
            </ModalField>
            <ModalField label="WhatsApp">
              <input className={modalFieldClass} value={companyForm.contact_whatsapp ?? ''} onChange={(event) => setCompanyForm({ ...companyForm, contact_whatsapp: event.target.value })} />
            </ModalField>
          </div>
        </div>
      </AdminModal>

      <ConfirmDialog open={Boolean(trashTarget)} title="¿Mover esta participación a la papelera?" description={companies.find((c) => c.id === trashTarget?.company_id)?.trade_name} onConfirm={confirmTrash} onCancel={() => setTrashTarget(null)} loading={trashing} confirmLabel="Mover a la papelera" />
    </>;
}
