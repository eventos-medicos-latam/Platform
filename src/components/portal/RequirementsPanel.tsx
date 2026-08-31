import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, UploadCloudIcon } from 'lucide-react';
import { Panel } from '../admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { requirementStatusMeta, StatusBadge } from '../ui/StatusBadge';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';
import { supabase } from '../../lib/supabaseClient';
import { uploadCompanyFile } from '../../lib/storage';

const kindLabels: Record<string, string> = {
  archivo: 'Subir archivo',
  formulario: 'Completar formulario',
  firma: 'Firmar documento',
  pago: 'Registrar pago',
  confirmacion: 'Confirmar',
  listado: 'Cargar listado'
};

interface Requirement {
  id: string;
  title: string;
  description: string;
  owner: string;
  due_date: string | null;
  kind: keyof typeof kindLabels;
  status: keyof typeof requirementStatusMeta;
  auto_generated: boolean;
}
interface Comment { id: string; requirement_id: string; author: string; date: string; text: string; }

export function RequirementsPanel() {
  const { session, activeEditionId } = usePlatform();
  const companyId = session?.companyId;
  const [list, setList] = useState<Requirement[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    if (!companyId) return;
    const [{ data: reqRows }, { data: commentRows }] = await Promise.all([
      supabase.from('requirements').select('id, title, description, owner, due_date, kind, status, auto_generated').eq('company_id', companyId).eq('edition_id', activeEditionId).order('due_date'),
      supabase.from('requirement_comments').select('id, requirement_id, author, date, text').order('date')
    ]);
    setList(reqRows ?? []);
    const ids = new Set((reqRows ?? []).map((row) => row.id));
    setComments((commentRows ?? []).filter((row) => ids.has(row.requirement_id)));
  };

  useEffect(() => {
    load();
    setOpenId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, activeEditionId]);

  const markResolved = async (requirement: Requirement) => {
    if (!companyId) return;
    setBusyId(requirement.id);
    await supabase.from('requirements').update({ status: 'en-revision' }).eq('id', requirement.id);
    await supabase.from('requirement_comments').insert({ requirement_id: requirement.id, author: session?.name ?? 'Empresa', text: `Marcado como resuelto: ${kindLabels[requirement.kind]}.` });
    setBusyId(null);
    load();
  };

  const uploadForRequirement = async (requirement: Requirement, file: File) => {
    if (!companyId) return;
    setBusyId(requirement.id);
    const { path, error } = await uploadCompanyFile(companyId, 'documents', file);
    if (error || !path) { setBusyId(null); alert(`No se pudo subir el archivo: ${error}`); return; }
    await supabase.from('company_documents').insert({ company_id: companyId, edition_id: activeEditionId, kind: 'otro', name: file.name, status: 'enviado', file_path: path });
    await supabase.from('requirements').update({ status: 'en-revision' }).eq('id', requirement.id);
    await supabase.from('requirement_comments').insert({ requirement_id: requirement.id, author: session?.name ?? 'Empresa', text: `Archivo cargado: ${file.name}.` });
    setBusyId(null);
    load();
  };

  const submitComment = async (requirementId: string) => {
    if (!commentDraft.trim()) return;
    await supabase.from('requirement_comments').insert({ requirement_id: requirementId, author: session?.name ?? 'Empresa', text: commentDraft.trim() });
    setCommentDraft('');
    load();
  };

  if (!companyId) return null;

  return (
    <div id="requerimientos">
      <Panel
        emphasis
        title="Requerimientos"
        description={`${list.length} ${list.length === 1 ? 'requerimiento' : 'requerimientos'} · al resolver uno, el equipo lo revisa y te confirma.`}
      >
        <ul className="divide-y divide-line">
          {list.map((requirement) => {
          const meta = requirementStatusMeta[requirement.status];
          const isOpen = openId === requirement.id;
          const requirementComments = comments.filter((comment) => comment.requirement_id === requirement.id);
          const resolvable = requirement.status !== 'aprobado' && requirement.status !== 'completado';
          return <li key={requirement.id}>
                <button type="button" onClick={() => setOpenId(isOpen ? null : requirement.id)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors duration-150 ease-emphasis hover:bg-canvas">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand">{requirement.title}</p>
                    <p className="text-xs text-ink-muted">
                      {kindLabels[requirement.kind]} · vence {requirement.due_date ?? '—'}
                      {requirement.auto_generated ? ' · generado automáticamente' : ''}
                    </p>
                  </div>
                  <StatusBadge label={meta.label} tone={meta.tone} />
                  <ChevronDownIcon size={16} className={`shrink-0 text-ink-muted transition-transform duration-200 ease-emphasis ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: DURATION.panel, ease: EASE_EMPHASIS }} className="overflow-hidden bg-canvas">
                      <div className="px-5 py-5">
                        <p className="max-w-2xl text-sm leading-relaxed text-ink">
                          {requirement.description}
                        </p>

                        {resolvable ? requirement.kind === 'archivo' ? <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-line bg-white px-5 py-6">
                            <UploadCloudIcon size={22} className="text-brand-support" />
                            <div className="min-w-[200px] flex-1">
                              <p className="text-sm font-medium text-brand">
                                Arrastra el archivo o selecciónalo
                              </p>
                              <p className="text-xs text-ink-muted">
                                Formatos aceptados: SVG, PNG, PDF · máx. 10 MB
                              </p>
                            </div>
                            <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadForRequirement(requirement, file); event.target.value = ''; }} />
                            <button type="button" disabled={busyId === requirement.id} onClick={() => fileInputRef.current?.click()} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
                              {busyId === requirement.id ? 'Subiendo…' : 'Seleccionar archivo'}
                            </button>
                          </div> : <div className="mt-5 flex flex-wrap gap-3">
                            <button type="button" disabled={busyId === requirement.id} onClick={() => markResolved(requirement)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
                              {busyId === requirement.id ? 'Enviando…' : kindLabels[requirement.kind]}
                            </button>
                          </div> : <p className="mt-5 text-sm font-medium text-emerald-700">Este requerimiento ya fue resuelto.</p>}

                        <div className="mt-6 space-y-3 border-t border-line pt-5">
                          {requirementComments.map((comment) => <div key={comment.id}>
                                <p className="text-xs font-semibold text-brand">
                                  {comment.author}{' '}
                                  <span className="font-normal text-ink-muted">{new Date(comment.date).toLocaleString('es-CO')}</span>
                                </p>
                                <p className="mt-0.5 text-sm text-ink">{comment.text}</p>
                              </div>)}
                          <form className="flex gap-2 pt-2" onSubmit={(event) => { event.preventDefault(); submitComment(requirement.id); }}>
                            <input value={openId === requirement.id ? commentDraft : ''} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Escribe un comentario o pregunta" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
                            <button type="submit" className="shrink-0 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand/40">
                              Enviar
                            </button>
                          </form>
                        </div>
                      </div>
                    </motion.div> : null}
                </AnimatePresence>
              </li>;
        })}
          {list.length === 0 ? <li className="px-5 py-10 text-center text-sm text-ink-muted">Sin requerimientos por ahora.</li> : null}
        </ul>
      </Panel>
    </div>
  );
}
