import React, { useEffect, useState } from 'react';
import { FileTextIcon, LinkIcon, PlusIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { supabase } from '../../lib/supabaseClient';
import { getCompanyFileUrl, uploadSharedResource } from '../../lib/storage';
import { AdminModal, modalFieldClass, ModalField } from '../../components/admin/AdminModal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { RowActions } from '../../components/admin/RowActions';

interface Resource { id: string; category: 'agenda' | 'presskit' | 'tematico' | 'otro'; title: string; description: string | null; file_path: string | null; external_url: string | null; order_num: number; }

const categories = ['agenda', 'presskit', 'tematico', 'otro'] as const;
const categoryLabels: Record<Resource['category'], string> = { agenda: 'Agenda', presskit: 'Presskit', tematico: 'Documentos temáticos', otro: 'Otros' };

export function ResourcesAdmin() {
  const { activeEditionId } = usePlatform();
  const [resources, setResources] = useState<Resource[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState<Resource['category']>('agenda');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  const load = async () => {
    const { data } = await supabase.from('portal_resources').select('*').eq('edition_id', activeEditionId).order('order_num');
    setResources(data ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditionId]);

  const openCreate = () => {
    setEditingId(null);
    setCategory('agenda');
    setTitle('');
    setDescription('');
    setExternalUrl('');
    setFile(null);
    setError(null);
    setModalOpen(true);
  };

  const submit = async () => {
    if (!title.trim()) { setError('El título es obligatorio.'); return; }
    setSaving(true);
    setError(null);
    let filePath: string | null = null;
    if (file) {
      const { path, error: uploadError } = await uploadSharedResource(activeEditionId, file);
      if (uploadError || !path) { setSaving(false); setError(uploadError ?? 'No se pudo subir el archivo.'); return; }
      filePath = path;
    }
    const payload = {
      edition_id: activeEditionId,
      category,
      title,
      description: description || null,
      external_url: externalUrl || null,
      ...(filePath ? { file_path: filePath } : {})
    };
    const { error: submitError } = editingId
      ? await supabase.from('portal_resources').update(payload).eq('id', editingId)
      : await supabase.from('portal_resources').insert(payload);
    setSaving(false);
    if (submitError) { setError(submitError.message); return; }
    setModalOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('portal_resources').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  const preview = async (resource: Resource) => {
    if (resource.external_url) { window.open(resource.external_url, '_blank', 'noopener'); return; }
    if (!resource.file_path) return;
    const url = await getCompanyFileUrl(resource.file_path);
    if (url) window.open(url, '_blank', 'noopener');
  };

  return <>
      <ModuleHeader eyebrow="Sistema" title="Recursos del Portal" description="Descargables visibles para todas las empresas: agenda, presskit y documentos por temática." actions={<button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
            <PlusIcon size={14} /> Nuevo recurso
          </button>} />

      <Panel emphasis title={`${resources.length} recursos`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-canvas">
              <tr>
                <th className={thClass}>Título</th>
                <th className={thClass}>Categoría</th>
                <th className={thClass}>Origen</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {resources.map((resource) => <tr key={resource.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-medium text-brand`}>
                      <button type="button" onClick={() => preview(resource)} className="inline-flex items-center gap-2 hover:underline">
                        {resource.external_url ? <LinkIcon size={14} /> : <FileTextIcon size={14} />} {resource.title}
                      </button>
                    </td>
                    <td className={tdClass}>{categoryLabels[resource.category]}</td>
                    <td className={tdClass}>{resource.external_url ? 'Enlace externo' : 'Archivo'}</td>
                    <td className={tdClass}>
                      <RowActions onEdit={() => { setEditingId(resource.id); setCategory(resource.category); setTitle(resource.title); setDescription(resource.description ?? ''); setExternalUrl(resource.external_url ?? ''); setFile(null); setError(null); setModalOpen(true); }} onDelete={() => setDeleteTarget(resource)} />
                    </td>
                  </tr>)}
              {resources.length === 0 ? <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-ink-muted">Sin recursos todavía.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar recurso' : 'Nuevo recurso'} onSubmit={submit} submitting={saving} error={error}>
        <div className="space-y-4">
          <ModalField label="Categoría">
            <select className={modalFieldClass} value={category} onChange={(event) => setCategory(event.target.value as Resource['category'])}>
              {categories.map((option) => <option key={option} value={option}>{categoryLabels[option]}</option>)}
            </select>
          </ModalField>
          <ModalField label="Título">
            <input className={modalFieldClass} value={title} onChange={(event) => setTitle(event.target.value)} />
          </ModalField>
          <ModalField label="Descripción">
            <textarea className={modalFieldClass} rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
          </ModalField>
          <ModalField label="Archivo (opcional si usas un enlace)">
            <input type="file" className={modalFieldClass} onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </ModalField>
          <ModalField label="Enlace externo (opcional si subes un archivo)">
            <input className={modalFieldClass} placeholder="https://…" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} />
          </ModalField>
        </div>
      </AdminModal>

      <ConfirmDialog open={Boolean(deleteTarget)} title="¿Eliminar este recurso?" description={deleteTarget?.title} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} confirmLabel="Eliminar" />
    </>;
}
