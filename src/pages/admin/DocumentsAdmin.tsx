import React, { useEffect, useState } from 'react';
import { FileTextIcon, PlusIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { requirementStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { supabase } from '../../lib/supabaseClient';
import { AdminModal, modalFieldClass, ModalField } from '../../components/admin/AdminModal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { RowActions } from '../../components/admin/RowActions';
import { moveToTrash } from '../../lib/trash';

interface CompanyDocument {
  id: string;
  company_id: string;
  edition_id: string;
  kind: string;
  name: string;
  status: string;
  date: string;
  size_label: string | null;
}

interface Requirement {
  id: string;
  company_id: string;
  edition_id: string;
  title: string;
  description: string;
  owner: string;
  due_date: string | null;
  kind: string;
  status: keyof typeof requirementStatusMeta;
  auto_generated: boolean;
}

interface Company { id: string; trade_name: string; logo_ready: boolean; }

const documentKinds = ['propuesta', 'contrato', 'orden', 'certificado', 'factura', 'fiscal', 'manual', 'acuerdo', 'otro'];
const documentStatuses = ['pendiente', 'enviado', 'firma-solicitada', 'firmado', 'aprobado'];
const requirementKinds = ['archivo', 'formulario', 'firma', 'pago', 'confirmacion', 'listado'];
const requirementStatusOptions = Object.entries(requirementStatusMeta) as [Requirement['status'], { label: string }][];

const emptyDocument = (editionId: string): Omit<CompanyDocument, 'id'> => ({
  company_id: '', edition_id: editionId, kind: 'propuesta', name: '', status: 'pendiente', date: new Date().toISOString().slice(0, 10), size_label: null
});
const emptyRequirement = (editionId: string): Omit<Requirement, 'id'> => ({
  company_id: '', edition_id: editionId, title: '', description: '', owner: '', due_date: null, kind: 'archivo', status: 'pendiente', auto_generated: false
});

export function DocumentsAdmin() {
  const { activeEditionId } = usePlatform();
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [docModalOpen, setDocModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState<Omit<CompanyDocument, 'id'>>(emptyDocument(activeEditionId));
  const [docTrashTarget, setDocTrashTarget] = useState<CompanyDocument | null>(null);

  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [reqForm, setReqForm] = useState<Omit<Requirement, 'id'>>(emptyRequirement(activeEditionId));
  const [reqTrashTarget, setReqTrashTarget] = useState<Requirement | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trashing, setTrashing] = useState(false);

  const load = async () => {
    const [{ data: docRows }, { data: reqRows }, { data: companyRows }] = await Promise.all([
      supabase.from('company_documents').select('*').eq('edition_id', activeEditionId).order('date', { ascending: false }),
      supabase.from('requirements').select('*').eq('edition_id', activeEditionId).order('due_date'),
      supabase.from('companies').select('id, trade_name, logo_ready')
    ]);
    setDocuments(docRows ?? []);
    setRequirements(reqRows ?? []);
    setCompanies(companyRows ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditionId]);

  const openCreateDoc = () => { setEditingDocId(null); setDocForm(emptyDocument(activeEditionId)); setError(null); setDocModalOpen(true); };
  const openEditDoc = (doc: CompanyDocument) => { setEditingDocId(doc.id); const { id: _id, ...rest } = doc; setDocForm(rest); setError(null); setDocModalOpen(true); };
  const submitDoc = async () => {
    if (!docForm.company_id) { setError('Selecciona una empresa.'); return; }
    setSaving(true); setError(null);
    const { error: submitError } = editingDocId
      ? await supabase.from('company_documents').update(docForm).eq('id', editingDocId)
      : await supabase.from('company_documents').insert(docForm);
    setSaving(false);
    if (submitError) { setError(submitError.message); return; }
    setDocModalOpen(false); load();
  };
  const confirmDocTrash = async () => {
    if (!docTrashTarget) return;
    setTrashing(true);
    const { error: trashError } = await moveToTrash('company_documents', docTrashTarget.id);
    setTrashing(false);
    if (trashError) { setError(trashError); return; }
    setDocTrashTarget(null); load();
  };

  const openCreateReq = () => { setEditingReqId(null); setReqForm(emptyRequirement(activeEditionId)); setError(null); setReqModalOpen(true); };
  const openEditReq = (req: Requirement) => { setEditingReqId(req.id); const { id: _id, ...rest } = req; setReqForm(rest); setError(null); setReqModalOpen(true); };
  const openDuplicateReq = (req: Requirement) => { setEditingReqId(null); const { id: _id, ...rest } = req; setReqForm({ ...rest, title: `${req.title} (copia)`, status: 'pendiente', auto_generated: false }); setError(null); setReqModalOpen(true); };
  const submitReq = async () => {
    if (!reqForm.company_id) { setError('Selecciona una empresa.'); return; }
    setSaving(true); setError(null);
    const { error: submitError } = editingReqId
      ? await supabase.from('requirements').update(reqForm).eq('id', editingReqId)
      : await supabase.from('requirements').insert(reqForm);
    setSaving(false);
    if (submitError) { setError(submitError.message); return; }
    setReqModalOpen(false); load();
  };
  const confirmReqTrash = async () => {
    if (!reqTrashTarget) return;
    setTrashing(true);
    const { error: trashError } = await moveToTrash('requirements', reqTrashTarget.id);
    setTrashing(false);
    if (trashError) { setError(trashError); return; }
    setReqTrashTarget(null); load();
  };

  const missingLogos = companies.filter((company) => !company.logo_ready);

  return <>
      <ModuleHeader eyebrow="Comercial" title="Documentos y requerimientos" description="Repositorio por empresa y lista de lo que falta." />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel emphasis title={`${documents.length} documentos`} actions={<button type="button" onClick={openCreateDoc} className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
              <PlusIcon size={14} /> Nuevo documento
            </button>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead className="bg-canvas">
                <tr>
                  <th className={thClass}>Documento</th>
                  <th className={thClass}>Empresa</th>
                  <th className={thClass}>Tipo</th>
                  <th className={thClass}>Fecha</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {documents.map((document) => <tr key={document.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-medium text-brand`}>
                      <span className="inline-flex items-center gap-2">
                        <FileTextIcon size={15} className="text-ink-muted" />
                        {document.name}
                      </span>
                    </td>
                    <td className={tdClass}>{companies.find((c) => c.id === document.company_id)?.trade_name ?? '—'}</td>
                    <td className={`${tdClass} capitalize`}>{document.kind}</td>
                    <td className={tdClass}>{document.date}</td>
                    <td className={tdClass}>
                      <StatusBadge label={document.status} tone={document.status === 'firma-solicitada' ? 'warning' : 'info'} />
                    </td>
                    <td className={tdClass}>
                      <RowActions onEdit={() => openEditDoc(document)} onDelete={() => setDocTrashTarget(document)} />
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title={`${requirements.length} requerimientos`} actions={<button type="button" onClick={openCreateReq} className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
                <PlusIcon size={14} /> Nuevo
              </button>}>
            <ul className="divide-y divide-line">
              {requirements.map((item) => <li key={item.id} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand">{item.title}</p>
                      <p className="text-xs text-ink-muted">
                        {item.owner} · vence {item.due_date ?? '—'}
                      </p>
                    </div>
                    <StatusBadge label={requirementStatusMeta[item.status].label} tone={requirementStatusMeta[item.status].tone} />
                    <RowActions onEdit={() => openEditReq(item)} onDuplicate={() => openDuplicateReq(item)} onDelete={() => setReqTrashTarget(item)} />
                  </div>
                  {item.auto_generated ? <p className="mt-1 text-xs text-amber-700">Generado automáticamente</p> : null}
                </li>)}
              {requirements.length === 0 ? <li className="px-5 py-4 text-sm text-ink-muted">Sin requerimientos.</li> : null}
            </ul>
          </Panel>

          <Panel title="Logos faltantes para el banner">
            <ul className="divide-y divide-line">
              {missingLogos.length === 0 ? <li className="px-5 py-4 text-sm text-ink-muted">Todas las marcas tienen logo listo.</li> : missingLogos.map((company) => <li key={company.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="text-sm font-medium text-brand">{company.trade_name}</span>
                    <StatusBadge label="Falta SVG" tone="danger" />
                  </li>)}
            </ul>
          </Panel>
        </div>
      </div>

      <AdminModal open={docModalOpen} onClose={() => setDocModalOpen(false)} title={editingDocId ? 'Editar documento' : 'Nuevo documento'} onSubmit={submitDoc} submitting={saving} error={error}>
        <div className="space-y-4">
          <ModalField label="Empresa">
            <select className={modalFieldClass} value={docForm.company_id} onChange={(event) => setDocForm({ ...docForm, company_id: event.target.value })}>
              <option value="">Selecciona una empresa</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.trade_name}</option>)}
            </select>
          </ModalField>
          <ModalField label="Nombre del documento">
            <input className={modalFieldClass} value={docForm.name} onChange={(event) => setDocForm({ ...docForm, name: event.target.value })} />
          </ModalField>
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField label="Tipo">
              <select className={modalFieldClass} value={docForm.kind} onChange={(event) => setDocForm({ ...docForm, kind: event.target.value })}>
                {documentKinds.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </ModalField>
            <ModalField label="Estado">
              <select className={modalFieldClass} value={docForm.status} onChange={(event) => setDocForm({ ...docForm, status: event.target.value })}>
                {documentStatuses.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </ModalField>
            <ModalField label="Fecha">
              <input type="date" className={modalFieldClass} value={docForm.date} onChange={(event) => setDocForm({ ...docForm, date: event.target.value })} />
            </ModalField>
            <ModalField label="Tamaño (etiqueta)">
              <input className={modalFieldClass} placeholder="Ej. 1.2 MB" value={docForm.size_label ?? ''} onChange={(event) => setDocForm({ ...docForm, size_label: event.target.value || null })} />
            </ModalField>
          </div>
        </div>
      </AdminModal>

      <AdminModal open={reqModalOpen} onClose={() => setReqModalOpen(false)} title={editingReqId ? 'Editar requerimiento' : 'Nuevo requerimiento'} onSubmit={submitReq} submitting={saving} error={error}>
        <div className="space-y-4">
          <ModalField label="Empresa">
            <select className={modalFieldClass} value={reqForm.company_id} onChange={(event) => setReqForm({ ...reqForm, company_id: event.target.value })}>
              <option value="">Selecciona una empresa</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.trade_name}</option>)}
            </select>
          </ModalField>
          <ModalField label="Título">
            <input className={modalFieldClass} value={reqForm.title} onChange={(event) => setReqForm({ ...reqForm, title: event.target.value })} />
          </ModalField>
          <ModalField label="Descripción">
            <textarea className={modalFieldClass} rows={2} value={reqForm.description} onChange={(event) => setReqForm({ ...reqForm, description: event.target.value })} />
          </ModalField>
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField label="Responsable">
              <input className={modalFieldClass} value={reqForm.owner} onChange={(event) => setReqForm({ ...reqForm, owner: event.target.value })} />
            </ModalField>
            <ModalField label="Vence">
              <input type="date" className={modalFieldClass} value={reqForm.due_date ?? ''} onChange={(event) => setReqForm({ ...reqForm, due_date: event.target.value || null })} />
            </ModalField>
            <ModalField label="Tipo">
              <select className={modalFieldClass} value={reqForm.kind} onChange={(event) => setReqForm({ ...reqForm, kind: event.target.value })}>
                {requirementKinds.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </ModalField>
            <ModalField label="Estado">
              <select className={modalFieldClass} value={reqForm.status} onChange={(event) => setReqForm({ ...reqForm, status: event.target.value as Requirement['status'] })}>
                {requirementStatusOptions.map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
            </ModalField>
          </div>
        </div>
      </AdminModal>

      <ConfirmDialog open={Boolean(docTrashTarget)} title="¿Mover este documento a la papelera?" description={docTrashTarget?.name} onConfirm={confirmDocTrash} onCancel={() => setDocTrashTarget(null)} loading={trashing} confirmLabel="Mover a la papelera" />
      <ConfirmDialog open={Boolean(reqTrashTarget)} title="¿Mover este requerimiento a la papelera?" description={reqTrashTarget?.title} onConfirm={confirmReqTrash} onCancel={() => setReqTrashTarget(null)} loading={trashing} confirmLabel="Mover a la papelera" />
    </>;
}
