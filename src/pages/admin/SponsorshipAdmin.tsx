import React, { useEffect, useState } from 'react';
import { PencilIcon, PlusIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { formatCop, formatShortDate } from '../../utils/format';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { supabase } from '../../lib/supabaseClient';
import { AdminModal, modalFieldClass, ModalField } from '../../components/admin/AdminModal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { RowActions } from '../../components/admin/RowActions';
import { moveToTrash } from '../../lib/trash';

interface PlanEdition {
  plan_id: string;
  edition_id: string;
  price: number;
  total_inventory: number | null;
  sold: number;
  availability_note: string | null;
}
interface PlanType { id: string; name: string; verb: string; }
interface Bridge { track_id: string; company_id: string | null; status: 'disponible' | 'reservado' | 'confirmado'; }
interface Track { id: string; name: string; }
interface Company { id: string; trade_name: string; }
interface PlanRequest {
  id: string; edition_id: string; plan_id: string | null; ally_role: string | null; space_id: string | null; track_id: string | null;
  speaker_choice: string | null; company: string; nit: string | null; contact_name: string; contact_email: string;
  contact_whatsapp: string | null; category: string | null; country: string | null; city: string | null; notes: string | null; status: string; created_at: string;
}
interface SpeakerSubmission {
  id: string; name: string; email: string; bio: string | null; topic: string | null;
  status: 'enviado' | 'en-revision' | 'aprobado' | 'rechazado'; created_at: string;
  participations: { company_id: string; edition_id: string } | null;
}

const requestMeta: Record<string, { label: string; tone: 'info' | 'warning' | 'success' | 'neutral' }> = {
  nueva: { label: 'Nueva', tone: 'info' },
  'en-conversacion': { label: 'En conversación', tone: 'warning' },
  aprobada: { label: 'Aprobada', tone: 'success' },
  descartada: { label: 'Descartada', tone: 'neutral' }
};
const bridgeStatusOptions: Bridge['status'][] = ['disponible', 'reservado', 'confirmado'];
const allyRoleOptions = ['sociedad-medica', 'aliado-academico', 'media-partner'];
const allyRoleLabels: Record<string, string> = {
  'sociedad-medica': 'Sociedad médica o científica',
  'aliado-academico': 'Universidad o grupo de investigación',
  'media-partner': 'Medio especializado'
};
const speakerSubmissionMeta: Record<SpeakerSubmission['status'], { label: string; tone: 'warning' | 'info' | 'success' | 'danger' }> = {
  enviado: { label: 'Enviado', tone: 'warning' },
  'en-revision': { label: 'En revisión', tone: 'info' },
  aprobado: { label: 'Aprobado', tone: 'success' },
  rechazado: { label: 'Rechazado', tone: 'danger' }
};
const speakerSubmissionOptions = Object.keys(speakerSubmissionMeta) as SpeakerSubmission['status'][];

const emptyRequest = (editionId: string): Omit<PlanRequest, 'id' | 'created_at'> => ({
  edition_id: editionId, plan_id: 'pop-up', ally_role: null, space_id: null, track_id: null, speaker_choice: null,
  company: '', nit: null, contact_name: '', contact_email: '', contact_whatsapp: null, category: null, country: null, city: null, notes: null, status: 'nueva'
});

export function SponsorshipAdmin() {
  const { activeEditionId } = usePlatform();
  const [planEditions, setPlanEditions] = useState<PlanEdition[]>([]);
  const [planTypes, setPlanTypes] = useState<PlanType[]>([]);
  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [requests, setRequests] = useState<PlanRequest[]>([]);
  const [speakerSubmissions, setSpeakerSubmissions] = useState<SpeakerSubmission[]>([]);
  const [filter, setFilter] = useState<'todas' | PlanRequest['status']>('todas');

  const [planModal, setPlanModal] = useState<PlanEdition | null>(null);
  const [bridgeModal, setBridgeModal] = useState<Bridge | null>(null);
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [reqForm, setReqForm] = useState<Omit<PlanRequest, 'id' | 'created_at'>>(emptyRequest(activeEditionId));
  const [trashTarget, setTrashTarget] = useState<PlanRequest | null>(null);
  const [saving, setSaving] = useState(false);
  const [trashing, setTrashing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [{ data: pe }, { data: pt }, { data: br }, { data: tr }, { data: co }, { data: rq }, { data: ss }] = await Promise.all([
      supabase.from('participation_plan_editions').select('*').eq('edition_id', activeEditionId),
      supabase.from('participation_plan_types').select('id, name, verb'),
      supabase.from('bridge_sponsorships').select('*'),
      supabase.from('tracks').select('id, name').eq('edition_id', activeEditionId),
      supabase.from('companies').select('id, trade_name'),
      supabase.from('plan_requests').select('*').eq('edition_id', activeEditionId).order('created_at', { ascending: false }),
      supabase.from('sponsored_speaker_submissions').select('id, name, email, bio, topic, status, created_at, participations!inner(company_id, edition_id)').eq('participations.edition_id', activeEditionId).order('created_at', { ascending: false })
    ]);
    setPlanEditions(pe ?? []);
    setPlanTypes(pt ?? []);
    setBridges(br ?? []);
    setTracks(tr ?? []);
    setCompanies(co ?? []);
    setRequests(rq ?? []);
    setSpeakerSubmissions((ss as unknown as SpeakerSubmission[]) ?? []);
  };

  const updateSpeakerStatus = async (id: string, status: SpeakerSubmission['status']) => {
    await supabase.from('sponsored_speaker_submissions').update({ status }).eq('id', id);
    load();
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditionId]);

  const visible = filter === 'todas' ? requests : requests.filter((r) => r.status === filter);

  const submitPlan = async () => {
    if (!planModal) return;
    setSaving(true);
    setError(null);
    const { error: submitError } = await supabase
      .from('participation_plan_editions')
      .update({ price: planModal.price, total_inventory: planModal.total_inventory, availability_note: planModal.availability_note })
      .eq('plan_id', planModal.plan_id)
      .eq('edition_id', planModal.edition_id);
    setSaving(false);
    if (submitError) { setError(submitError.message); return; }
    setPlanModal(null);
    load();
  };

  const submitBridge = async () => {
    if (!bridgeModal) return;
    setSaving(true);
    setError(null);
    const { error: submitError } = await supabase
      .from('bridge_sponsorships')
      .update({ company_id: bridgeModal.company_id, status: bridgeModal.status })
      .eq('track_id', bridgeModal.track_id);
    setSaving(false);
    if (submitError) { setError(submitError.message); return; }
    setBridgeModal(null);
    load();
  };

  const openCreateReq = () => { setEditingReqId(null); setReqForm(emptyRequest(activeEditionId)); setError(null); setReqModalOpen(true); };
  const openEditReq = (request: PlanRequest) => {
    setEditingReqId(request.id);
    const { id: _id, created_at: _created, ...rest } = request;
    setReqForm(rest);
    setError(null);
    setReqModalOpen(true);
  };
  const submitReq = async () => {
    if (!reqForm.company.trim() || !reqForm.contact_email.trim()) { setError('Empresa y correo de contacto son obligatorios.'); return; }
    setSaving(true);
    setError(null);
    const { error: submitError } = editingReqId
      ? await supabase.from('plan_requests').update(reqForm).eq('id', editingReqId)
      : await supabase.from('plan_requests').insert(reqForm);
    setSaving(false);
    if (submitError) { setError(submitError.message); return; }
    setReqModalOpen(false);
    load();
  };
  const confirmTrash = async () => {
    if (!trashTarget) return;
    setTrashing(true);
    const { error: trashError } = await moveToTrash('plan_requests', trashTarget.id);
    setTrashing(false);
    if (trashError) { setError(trashError); return; }
    setTrashTarget(null);
    load();
  };

  return <>
      <ModuleHeader eyebrow="Comercial" title="Planes de participación" description="Todo nace del plan. Los precios se publican en la web; los cupos se controlan aquí." />

      <div className="space-y-5">
        <Panel emphasis title="Cupos por plan" description="Disponibilidad publicada en el configurador de la web.">
          <div className="grid gap-px bg-line md:grid-cols-3">
            {planEditions.map((edition) => {
            const type = planTypes.find((t) => t.id === edition.plan_id);
            const left = edition.total_inventory === null ? null : edition.total_inventory - edition.sold;
            const fill = edition.total_inventory && edition.total_inventory > 0 ? edition.sold / edition.total_inventory : 0;
            return <div key={edition.plan_id} className="bg-white p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">{type?.verb}</p>
                      <p className="mt-1 text-base font-bold text-brand">{type?.name}</p>
                    </div>
                    <button type="button" onClick={() => setPlanModal(edition)} aria-label="Editar plan" className="rounded-lg p-1.5 text-ink-muted hover:bg-brand-soft hover:text-brand">
                      <PencilIcon size={15} />
                    </button>
                  </div>
                  <p className="mt-3 text-2xl font-bold tabular-nums text-brand">{formatCop(edition.price)}</p>
                  <div className="mt-4 flex items-baseline justify-between text-sm">
                    <span className="text-ink-muted">Vendidos</span>
                    <span className="font-semibold text-brand">{edition.sold} / {edition.total_inventory ?? '—'}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-soft">
                    <div className="grad-futuro h-full rounded-full" style={{ width: `${Math.round(fill * 100)}%` }} />
                  </div>
                  <p className="mt-3 text-xs text-ink-muted">
                    {left !== null ? `${left} cupos disponibles · ` : ''}{edition.availability_note}
                  </p>
                </div>;
          })}
          </div>
        </Panel>

        <Panel title="Exclusividad por puente" description="Protagonista: una sola marca por puente.">
          <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {bridges.map((bridge) => {
            const track = tracks.find((t) => t.id === bridge.track_id);
            const bridgeCompany = bridge.company_id ? companies.find((c) => c.id === bridge.company_id) : null;
            const tone = bridge.status === 'confirmado' ? 'success' : bridge.status === 'reservado' ? 'warning' : 'info';
            return <li key={bridge.track_id} className="bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-brand">{track?.name ?? bridge.track_id}</p>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge label={bridge.status === 'disponible' ? 'Disponible' : bridge.status === 'reservado' ? 'Reservado' : 'Confirmado'} tone={tone} />
                      <button type="button" onClick={() => setBridgeModal(bridge)} aria-label="Editar puente" className="rounded-lg p-1 text-ink-muted hover:bg-brand-soft hover:text-brand">
                        <PencilIcon size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">{bridgeCompany ? bridgeCompany.trade_name : 'Sin marca asignada'}</p>
                </li>;
          })}
          </ul>
        </Panel>

        <Panel title="Solicitudes entrantes" description="Cada envío del configurador crea el perfil de la marca y notifica a comercial." actions={<div className="flex flex-wrap items-center gap-1.5">
              {(['todas', 'nueva', 'en-conversacion', 'aprobada'] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors duration-150 ease-emphasis ${filter === item ? 'bg-brand text-white' : 'border border-line text-ink-muted hover:text-brand'}`}>
                  {item === 'todas' ? 'Todas' : requestMeta[item].label}
                </button>)}
              <button type="button" onClick={openCreateReq} className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
                <PlusIcon size={13} /> Nueva
              </button>
            </div>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead className="bg-canvas">
                <tr>
                  <th className={thClass}>Marca</th>
                  <th className={thClass}>Plan</th>
                  <th className={thClass}>Puente</th>
                  <th className={thClass}>Categoría</th>
                  <th className={thClass}>Ubicación</th>
                  <th className={thClass}>Recibida</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((request) => {
                const type = planTypes.find((t) => t.id === request.plan_id);
                const track = tracks.find((t) => t.id === request.track_id);
                const meta = requestMeta[request.status];
                return <tr key={request.id} className="transition-colors duration-150 hover:bg-canvas">
                      <td className={`${tdClass} font-medium text-brand`}>
                        {request.company}
                        <span className="mt-0.5 block text-xs font-normal text-ink-muted">{request.contact_email}</span>
                      </td>
                      <td className={tdClass}>
                        {request.plan_id ? (type?.name ?? request.plan_id) : <span className="text-brand-support">{allyRoleLabels[request.ally_role ?? ''] ?? request.ally_role}</span>}
                      </td>
                      <td className={tdClass}>{track?.name ?? '—'}</td>
                      <td className={tdClass}>{request.category ?? '—'}</td>
                      <td className={tdClass}>{[request.city, request.country].filter(Boolean).join(', ') || '—'}</td>
                      <td className={tdClass}>{formatShortDate(request.created_at)}</td>
                      <td className={tdClass}>
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </td>
                      <td className={tdClass}>
                        <RowActions onEdit={() => openEditReq(request)} onDelete={() => setTrashTarget(request)} />
                      </td>
                    </tr>;
              })}
              </tbody>
            </table>
          </div>
          {visible.length === 0 ? <p className="border-t border-line px-5 py-8 text-center text-sm text-ink-muted">No hay solicitudes con este estado.</p> : null}
        </Panel>

        <Panel title="Speakers patrocinados propuestos" description="Propuestas enviadas desde el Portal para los planes que incluyen speaker.">
          <ul className="divide-y divide-line">
            {speakerSubmissions.map((submission) => {
            const company = companies.find((c) => c.id === submission.participations?.company_id);
            return <li key={submission.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand">{submission.name} <span className="font-normal text-ink-muted">· {company?.trade_name ?? '—'}</span></p>
                    <p className="text-xs text-ink-muted">{submission.email}{submission.topic ? ` · ${submission.topic}` : ''}</p>
                    {submission.bio ? <p className="mt-1 text-sm text-ink">{submission.bio}</p> : null}
                  </div>
                  <select value={submission.status} onChange={(event) => updateSpeakerStatus(submission.id, event.target.value as SpeakerSubmission['status'])} className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs font-medium text-brand outline-none focus:border-brand">
                    {speakerSubmissionOptions.map((option) => <option key={option} value={option}>{speakerSubmissionMeta[option].label}</option>)}
                  </select>
                </li>;
          })}
            {speakerSubmissions.length === 0 ? <li className="px-5 py-6 text-center text-sm text-ink-muted">Sin propuestas de speaker todavía.</li> : null}
          </ul>
        </Panel>
      </div>

      {planModal ? <AdminModal open title="Editar plan" onClose={() => setPlanModal(null)} onSubmit={submitPlan} submitting={saving} error={error}>
          <div className="space-y-4">
            <ModalField label="Precio (COP)">
              <input type="number" className={modalFieldClass} value={planModal.price} onChange={(event) => setPlanModal({ ...planModal, price: Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Cupo total (vacío = ilimitado)">
              <input type="number" className={modalFieldClass} value={planModal.total_inventory ?? ''} onChange={(event) => setPlanModal({ ...planModal, total_inventory: event.target.value === '' ? null : Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Nota de disponibilidad">
              <input className={modalFieldClass} value={planModal.availability_note ?? ''} onChange={(event) => setPlanModal({ ...planModal, availability_note: event.target.value })} />
            </ModalField>
          </div>
        </AdminModal> : null}

      {bridgeModal ? <AdminModal open title="Editar puente" onClose={() => setBridgeModal(null)} onSubmit={submitBridge} submitting={saving} error={error}>
          <div className="space-y-4">
            <ModalField label="Empresa asignada">
              <select className={modalFieldClass} value={bridgeModal.company_id ?? ''} onChange={(event) => setBridgeModal({ ...bridgeModal, company_id: event.target.value || null })}>
                <option value="">Sin asignar</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.trade_name}</option>)}
              </select>
            </ModalField>
            <ModalField label="Estado">
              <select className={modalFieldClass} value={bridgeModal.status} onChange={(event) => setBridgeModal({ ...bridgeModal, status: event.target.value as Bridge['status'] })}>
                {bridgeStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </ModalField>
          </div>
        </AdminModal> : null}

      <AdminModal open={reqModalOpen} onClose={() => setReqModalOpen(false)} title={editingReqId ? 'Editar solicitud' : 'Nueva solicitud'} onSubmit={submitReq} submitting={saving} error={error}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField label="Empresa">
              <input className={modalFieldClass} value={reqForm.company} onChange={(event) => setReqForm({ ...reqForm, company: event.target.value })} />
            </ModalField>
            <ModalField label="NIT">
              <input className={modalFieldClass} value={reqForm.nit ?? ''} onChange={(event) => setReqForm({ ...reqForm, nit: event.target.value })} />
            </ModalField>
            <ModalField label="Contacto">
              <input className={modalFieldClass} value={reqForm.contact_name} onChange={(event) => setReqForm({ ...reqForm, contact_name: event.target.value })} />
            </ModalField>
            <ModalField label="Correo">
              <input type="email" className={modalFieldClass} value={reqForm.contact_email} onChange={(event) => setReqForm({ ...reqForm, contact_email: event.target.value })} />
            </ModalField>
            <ModalField label="WhatsApp">
              <input className={modalFieldClass} value={reqForm.contact_whatsapp ?? ''} onChange={(event) => setReqForm({ ...reqForm, contact_whatsapp: event.target.value })} />
            </ModalField>
            <ModalField label="Categoría">
              <input className={modalFieldClass} value={reqForm.category ?? ''} onChange={(event) => setReqForm({ ...reqForm, category: event.target.value })} />
            </ModalField>
            <ModalField label="País">
              <input className={modalFieldClass} value={reqForm.country ?? ''} onChange={(event) => setReqForm({ ...reqForm, country: event.target.value })} />
            </ModalField>
            <ModalField label="Ciudad">
              <input className={modalFieldClass} value={reqForm.city ?? ''} onChange={(event) => setReqForm({ ...reqForm, city: event.target.value })} />
            </ModalField>
            <ModalField label="Tipo de solicitud">
              <select className={modalFieldClass} value={reqForm.plan_id ? 'plan' : 'alianza'} onChange={(event) => setReqForm(event.target.value === 'plan' ? { ...reqForm, plan_id: planTypes[0]?.id ?? 'pop-up', ally_role: null } : { ...reqForm, plan_id: null, ally_role: allyRoleOptions[0] })}>
                <option value="plan">Plan comercial</option>
                <option value="alianza">Alianza institucional</option>
              </select>
            </ModalField>
            {reqForm.plan_id ? <ModalField label="Plan">
                <select className={modalFieldClass} value={reqForm.plan_id} onChange={(event) => setReqForm({ ...reqForm, plan_id: event.target.value })}>
                  {planTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>
              </ModalField> : <ModalField label="Rol de alianza">
                <select className={modalFieldClass} value={reqForm.ally_role ?? ''} onChange={(event) => setReqForm({ ...reqForm, ally_role: event.target.value })}>
                  {allyRoleOptions.map((option) => <option key={option} value={option}>{allyRoleLabels[option]}</option>)}
                </select>
              </ModalField>}
            <ModalField label="Puente de interés">
              <select className={modalFieldClass} value={reqForm.track_id ?? ''} onChange={(event) => setReqForm({ ...reqForm, track_id: event.target.value || null })}>
                <option value="">Sin definir</option>
                {tracks.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}
              </select>
            </ModalField>
            <ModalField label="Estado">
              <select className={modalFieldClass} value={reqForm.status} onChange={(event) => setReqForm({ ...reqForm, status: event.target.value })}>
                {Object.entries(requestMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
            </ModalField>
          </div>
          <ModalField label="Notas">
            <textarea className={modalFieldClass} rows={2} value={reqForm.notes ?? ''} onChange={(event) => setReqForm({ ...reqForm, notes: event.target.value })} />
          </ModalField>
        </div>
      </AdminModal>

      <ConfirmDialog open={Boolean(trashTarget)} title="¿Mover esta solicitud a la papelera?" description={trashTarget?.company} onConfirm={confirmTrash} onCancel={() => setTrashTarget(null)} loading={trashing} confirmLabel="Mover a la papelera" />
    </>;
}
