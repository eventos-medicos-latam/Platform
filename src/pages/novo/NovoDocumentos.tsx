import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon, SearchIcon, FileTextIcon, FolderIcon, DownloadIcon,
  TrashIcon, PencilIcon, EyeIcon, CopyIcon, UploadIcon,
  FileIcon, ImageIcon, ArchiveIcon, TableIcon, GridIcon, ListIcon,
} from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { RowActions } from '../../components/novo/ui/RowActions';
import {
  NovoModal, ModalBtn,
  FormSection, FormField, FormInput, FormSelect, FormTextarea,
} from '../../components/novo/ui/NovoModal';
import { listCompanies, type NovoCompany } from '../../lib/novo/companies';
import {
  createCatalogResource, deleteCatalogDocument, duplicateCatalogResource,
  fileTypeFromName, listCatalogDocuments, openCatalogDocument, updateCatalogResource, uploadCatalogFile,
  type CatalogDoc, type DocCategory, type DocScope, type DocType,
} from '../../lib/novo/resources';
import { listSiteEvents, type SiteEventRow } from '../../lib/novo/site';

type ViewMode = 'list' | 'grid';

const SCOPE_CFG: Record<DocScope, { color: string; bg: string }> = {
  Público:  { color: '#00C9A0', bg: 'rgba(0,201,160,.12)'   },
  Empresa:  { color: '#F59E0B', bg: 'rgba(245,158,11,.12)'  },
  Interno:  { color: '#5B8AF0', bg: 'rgba(91,138,240,.12)'  },
  Privado:  { color: '#A78BFA', bg: 'rgba(167,139,250,.12)' },
};

const TYPE_ICON: Record<DocType, React.ElementType> = {
  PDF:  FileTextIcon,
  XLSX: TableIcon,
  PNG:  ImageIcon,
  JPG:  ImageIcon,
  ZIP:  ArchiveIcon,
  DOCX: FileIcon,
  MP4:  FileIcon,
};

const TYPE_COLOR: Record<DocType, string> = {
  PDF:  '#F24463', XLSX: '#00C9A0', PNG: '#A78BFA', JPG: '#A78BFA',
  ZIP:  '#F59E0B', DOCX: '#5B8AF0', MP4: '#FF7043',
};

const BG      = '#112035';
const BG_DEEP = '#0d1829';
const BORDER  = '#1e3450';
const ACCENT  = '#00C9A0';
const TEXT_HI = '#E1EAF4';
const TEXT_LO = '#7A9CB8';
const TEXT_DIM = '#3A5470';

type CatFilter = 'Todos' | 'Globales' | 'Por empresa' | 'Por evento';
const CAT_FILTERS: CatFilter[] = ['Todos', 'Globales', 'Por empresa', 'Por evento'];

const EMPTY_FORM = {
  name: '', category: 'global' as DocCategory, type: 'PDF' as DocType,
  scope: 'Público' as DocScope, event: '', company: '', description: '', url: '',
};

export function NovoDocumentos() {
  const [docs, setDocs]          = useState<CatalogDoc[]>([]);
  const [events, setEvents]      = useState<SiteEventRow[]>([]);
  const [companies, setCompanies] = useState<NovoCompany[]>([]);
  const [catFilter, setCatFilter] = useState<CatFilter>('Todos');
  const [search, setSearch]      = useState('');
  const [viewMode, setViewMode]  = useState<ViewMode>('list');
  const [selected, setSelected]  = useState<CatalogDoc | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]    = useState<CatalogDoc | null>(null);
  const [form, setForm]          = useState(EMPTY_FORM);
  const [file, setFile]          = useState<File | null>(null);
  const [saving, setSaving]      = useState(false);
  const [loading, setLoading]    = useState(true);
  const [error, setError]        = useState<string | null>(null);
  const [dragOver, setDragOver]  = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, eventRows, companyRows] = await Promise.all([
        listCatalogDocuments(),
        listSiteEvents(),
        listCompanies(),
      ]);
      setDocs(rows);
      setEvents(eventRows);
      setCompanies(companyRows);
      setSelected((current) => current ? rows.find((row) => row.id === current.id) ?? null : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los documentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = docs.filter(d => {
    const matchCat =
      catFilter === 'Todos'       ||
      (catFilter === 'Globales'    && d.category === 'global')  ||
      (catFilter === 'Por empresa' && d.category === 'empresa') ||
      (catFilter === 'Por evento'  && d.category === 'evento');
    const q = search.toLowerCase();
    const matchSearch = !q || d.name.toLowerCase().includes(q) ||
      (d.company ?? '').toLowerCase().includes(q) ||
      (d.event ?? '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setError(null);
    setModalOpen(true);
  };
  const openEdit = (d: CatalogDoc) => {
    if (d.source !== 'resource') return;
    setEditing(d);
    setForm({
      name: d.name, category: d.category, type: d.type, scope: d.scope,
      event: d.eventId ?? '', company: d.companyId ?? '', description: d.description, url: d.url,
    });
    setFile(null);
    setError(null);
    setModalOpen(true);
  };

  const takeFile = (next: File | null) => {
    if (!next) return;
    setFile(next);
    setForm((prev) => ({
      ...prev,
      name: prev.name || next.name.replace(/\.[^.]+$/, ''),
      type: fileTypeFromName(next.name, next.type),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return; }
    if (form.category === 'evento' && !form.event) { setError('Elige el evento.'); return; }
    if (form.category === 'empresa' && !form.company) { setError('Elige la empresa.'); return; }
    setSaving(true);
    setError(null);
    try {
      let url = form.url;
      let storagePath = editing?.storagePath ?? null;
      let type = form.type;
      let sizeBytes = editing?.sizeBytes ?? null;
      if (file) {
        const uploaded = await uploadCatalogFile(file, form.scope);
        url = uploaded.url || url;
        storagePath = uploaded.storagePath ?? storagePath;
        type = uploaded.type;
        sizeBytes = uploaded.sizeBytes;
      }
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        type,
        scope: form.scope,
        eventId: form.event || null,
        companyId: form.company || null,
        url,
        storagePath,
        sizeBytes,
      };
      if (editing) await updateCatalogResource(editing.id, payload);
      else await createCatalogResource(payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el recurso.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doc: CatalogDoc) => {
    if (!window.confirm(`¿Eliminar «${doc.name}»?`)) return;
    try {
      await deleteCatalogDocument(doc);
      if (selected?.id === doc.id) setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    }
  };

  const handleDuplicate = async (doc: CatalogDoc) => {
    try {
      await duplicateCatalogResource(doc);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo duplicar.');
    }
  };

  const handleOpen = async (doc: CatalogDoc) => {
    try {
      await openCatalogDocument(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir el archivo.');
    }
  };

  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>Catálogo global</p>
          <h1 className="text-xl font-bold" style={{ color: TEXT_HI, fontFamily: "'Sora', sans-serif" }}>Documentos y Recursos</h1>
          <p className="mt-0.5 text-sm" style={{ color: TEXT_LO }}>Global reutilizable · asignado a eventos · por empresa</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold active:scale-95"
          style={{ background: ACCENT, color: '#0d1829' }}>
          <PlusIcon size={15} strokeWidth={2.5} /> Subir recurso
        </button>
      </div>

      {error ? <p className="mb-4 text-sm" style={{ color: '#F24463' }}>{error}</p> : null}

      <div className="mb-6 grid grid-cols-3 gap-4">
        <KPICard label="Total archivos"         value={loading ? '…' : String(docs.length)}                                    sub="en la plataforma"               icon={FileTextIcon} delay={0}    />
        <KPICard label="Globales reutilizables" value={loading ? '…' : String(docs.filter(d => d.category === 'global').length)} sub="disponibles en todos los eventos" icon={FolderIcon}   accent="#5B8AF0" delay={0.05} />
        <KPICard label="Privados / empresa"     value={loading ? '…' : String(docs.filter(d => d.scope === 'Privado' || d.category === 'empresa').length)} sub="de acceso restringido"            icon={DownloadIcon} accent="#A78BFA" delay={0.1} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex items-center rounded-xl" style={{ background: BG, border: `1px solid ${BORDER}` }}>
          <SearchIcon size={14} className="absolute left-3" style={{ color: TEXT_DIM }} />
          <input type="text" placeholder="Buscar documento…" value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent pl-9 pr-4 py-2 text-sm outline-none w-52" style={{ color: TEXT_HI }} />
        </div>

        <div className="flex gap-0.5 p-1 rounded-xl" style={{ background: BG, border: `1px solid ${BORDER}` }}>
          {CAT_FILTERS.map(cf => (
            <button key={cf} onClick={() => setCatFilter(cf)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              style={{ background: catFilter === cf ? '#1e3450' : 'transparent', color: catFilter === cf ? TEXT_HI : TEXT_DIM }}>
              {cf}
            </button>
          ))}
        </div>

        <div className="ml-auto flex rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          {([['list', ListIcon], ['grid', GridIcon]] as const).map(([m, Icon]) => (
            <button key={m} onClick={() => setViewMode(m)}
              className="flex items-center justify-center w-9 h-9 transition-colors"
              style={{ background: viewMode === m ? '#182d47' : BG }}>
              <Icon size={14} style={{ color: viewMode === m ? TEXT_HI : TEXT_DIM }} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-5">
        {viewMode === 'list' && (
          <div className="flex-1 min-w-0 overflow-hidden rounded-2xl" style={{ border: `1px solid ${BORDER}`, background: BG }}>
            <div className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-3"
              style={{ gridTemplateColumns: '2.5fr .7fr 1.2fr .8fr .9fr auto', color: TEXT_DIM, borderBottom: `1px solid #1a2e45`, background: '#182d47' }}>
              <span>Documento</span><span>Tipo</span><span>Evento / Empresa</span><span>Acceso</span><span>Actualizado</span><span />
            </div>

            {filtered.length === 0 && (
              <div className="py-14 text-center" style={{ color: TEXT_DIM }}>
                <p className="text-sm">{loading ? 'Cargando…' : 'Sin resultados.'}</p>
              </div>
            )}

            {filtered.map((doc, i) => {
              const scope    = SCOPE_CFG[doc.scope];
              const DocIcon  = TYPE_ICON[doc.type] ?? FileIcon;
              const typeColor = TYPE_COLOR[doc.type] ?? TEXT_DIM;
              const isActive = selected?.id === doc.id;
              return (
                <motion.div key={`${doc.source}-${doc.id}`}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.03 }}
                  onClick={() => setSelected(isActive ? null : doc)}
                  className="group grid items-center px-5 py-3.5 cursor-pointer transition-colors"
                  style={{
                    gridTemplateColumns: '2.5fr .7fr 1.2fr .8fr .9fr auto',
                    borderBottom: i < filtered.length - 1 ? `1px solid #1a2e45` : 'none',
                    background: isActive ? 'rgba(0,201,160,.04)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#182d47'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(0,201,160,.04)' : 'transparent'; }}>

                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${typeColor}15`, border: `1px solid ${typeColor}30` }}>
                      <DocIcon size={14} style={{ color: typeColor }} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: TEXT_HI }}>{doc.name}</p>
                      <p className="text-[10px]" style={{ color: TEXT_DIM }}>{doc.size}{doc.source === 'company' ? ' · Portal' : ''}</p>
                    </div>
                  </div>

                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ background: `${TYPE_COLOR[doc.type]}15`, color: TYPE_COLOR[doc.type] }}>
                    {doc.type}
                  </span>

                  <p className="truncate text-xs pr-2" style={{ color: TEXT_LO }}>
                    {doc.event ?? doc.company ?? '—'}
                  </p>

                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ color: scope.color, background: scope.bg }}>
                    {doc.scope}
                  </span>

                  <p className="text-xs" style={{ color: TEXT_DIM }}>{doc.updated}</p>

                  <div onClick={e => e.stopPropagation()}>
                    <RowActions
                      onEdit={doc.source === 'resource' ? () => openEdit(doc) : undefined}
                      onDuplicate={doc.source === 'resource' ? () => { void handleDuplicate(doc); } : undefined}
                      extra={[
                        { label: 'Descargar', icon: DownloadIcon, onClick: () => { void handleOpen(doc); } },
                        { label: 'Vista previa', icon: EyeIcon, onClick: () => setSelected(doc) },
                        { label: 'Eliminar', icon: TrashIcon, onClick: () => { void handleDelete(doc); }, variant: 'danger' },
                      ]}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="flex-1 min-w-0">
            {filtered.length === 0 ? (
              <p className="py-14 text-center text-sm" style={{ color: TEXT_DIM }}>{loading ? 'Cargando…' : 'Sin resultados.'}</p>
            ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {filtered.map((doc, i) => {
                const scope    = SCOPE_CFG[doc.scope];
                const DocIcon  = TYPE_ICON[doc.type] ?? FileIcon;
                const typeColor = TYPE_COLOR[doc.type] ?? TEXT_DIM;
                const isActive = selected?.id === doc.id;
                return (
                  <motion.div key={`${doc.source}-${doc.id}`}
                    initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15, delay: i * 0.03 }}
                    onClick={() => setSelected(isActive ? null : doc)}
                    className="rounded-2xl p-4 cursor-pointer transition-all"
                    style={{
                      background: isActive ? 'rgba(0,201,160,.06)' : BG,
                      border: `1px solid ${isActive ? 'rgba(0,201,160,.25)' : BORDER}`,
                    }}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-3"
                      style={{ background: `${typeColor}15`, border: `1px solid ${typeColor}25` }}>
                      <DocIcon size={22} style={{ color: typeColor }} />
                    </div>
                    <p className="text-sm font-semibold leading-tight mb-1 line-clamp-2" style={{ color: TEXT_HI }}>{doc.name}</p>
                    <p className="text-[10px] mb-2" style={{ color: TEXT_DIM }}>{doc.size} · {doc.updated}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold rounded-full px-2 py-0.5" style={{ color: scope.color, background: scope.bg }}>
                        {doc.scope}
                      </span>
                      <span className="text-[9px] font-bold rounded px-1.5 py-0.5"
                        style={{ color: typeColor, background: `${typeColor}15` }}>{doc.type}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            )}
          </div>
        )}

        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 20, width: 0 }} animate={{ opacity: 1, x: 0, width: 280 }}
              exit={{ opacity: 0, x: 20, width: 0 }} transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="shrink-0 overflow-hidden rounded-2xl" style={{ background: BG, border: `1px solid ${BORDER}` }}>
              <div className="p-5">
                <div className="flex items-center justify-center rounded-2xl mb-4 py-7"
                  style={{ background: BG_DEEP }}>
                  {(() => {
                    const Icon = TYPE_ICON[selected.type] ?? FileIcon;
                    const color = TYPE_COLOR[selected.type];
                    return <Icon size={40} style={{ color, opacity: 0.9 }} />;
                  })()}
                </div>

                <p className="text-sm font-bold leading-snug mb-1" style={{ color: TEXT_HI }}>{selected.name}</p>
                {selected.description && <p className="text-xs mb-3" style={{ color: TEXT_LO }}>{selected.description}</p>}

                <div className="space-y-2 mb-4">
                  {[
                    ['Tipo',      selected.type],
                    ['Tamaño',    selected.size],
                    ['Actualizado', selected.updated],
                    ['Acceso',    selected.scope],
                    ...(selected.event   ? [['Evento',   selected.event]]   : []),
                    ...(selected.company ? [['Empresa',  selected.company]] : []),
                  ].map(([l, v]) => (
                    <div key={l} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid #1a2e45` }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_DIM }}>{l}</p>
                      <p className="text-xs" style={{ color: TEXT_LO }}>{v}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <button type="button" onClick={() => { void handleOpen(selected); }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold"
                    style={{ background: 'rgba(0,201,160,.1)', color: ACCENT, border: `1px solid rgba(0,201,160,.2)` }}>
                    <DownloadIcon size={12} /> Descargar
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" disabled={selected.source !== 'resource'} onClick={() => openEdit(selected)}
                      className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold disabled:opacity-40"
                      style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}>
                      <PencilIcon size={11} /> Editar
                    </button>
                    <button type="button" disabled={selected.source !== 'resource'} onClick={() => { void handleDuplicate(selected); }}
                      className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold disabled:opacity-40"
                      style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}>
                      <CopyIcon size={11} /> Duplicar
                    </button>
                  </div>
                  <button type="button" onClick={() => { void handleDelete(selected); }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold"
                    style={{ background: 'rgba(242,68,99,.06)', color: '#F24463', border: '1px solid rgba(242,68,99,.2)' }}>
                    <TrashIcon size={11} /> Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NovoModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar recurso' : 'Subir recurso'}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={() => { void handleSave(); }} disabled={saving || !form.name.trim()}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar recurso'}
            </ModalBtn>
          </>
        }>

        {!editing && (
          <div
            className="mb-2 flex flex-col items-center justify-center gap-3 rounded-2xl py-10 transition-all"
            style={{
              background: dragOver ? 'rgba(0,201,160,.08)' : BG_DEEP,
              border: `2px dashed ${dragOver ? ACCENT : BORDER}`,
            }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); takeFile(e.dataTransfer.files[0] ?? null); }}>
            <UploadIcon size={24} style={{ color: dragOver ? ACCENT : TEXT_DIM }} />
            <p className="text-sm font-semibold" style={{ color: dragOver ? ACCENT : TEXT_LO }}>
              {file ? file.name : 'Arrastra un archivo aquí'}
            </p>
            <label className="cursor-pointer text-xs font-semibold" style={{ color: ACCENT }}>
              Elegir archivo
              <input type="file" className="hidden" onChange={e => takeFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        )}

        <FormSection title="Información del documento">
          <FormField label="Nombre del documento">
            <FormInput value={form.name} onChange={f('name')} placeholder="Manual del Expositor v3…" />
          </FormField>
          <FormField label="Tipo de archivo">
            <FormSelect value={form.type} onChange={f('type')} options={[
              { value: 'PDF',  label: 'PDF'  },
              { value: 'XLSX', label: 'Excel (XLSX)' },
              { value: 'DOCX', label: 'Word (DOCX)' },
              { value: 'PNG',  label: 'Imagen PNG' },
              { value: 'JPG',  label: 'Imagen JPG' },
              { value: 'ZIP',  label: 'ZIP / comprimido' },
              { value: 'MP4',  label: 'Video MP4' },
            ]} />
          </FormField>
          {editing ? (
            <FormField label="Reemplazar archivo">
              <input type="file" className="w-full text-xs" style={{ color: TEXT_LO }} onChange={e => takeFile(e.target.files?.[0] ?? null)} />
            </FormField>
          ) : null}
          <FormField label="URL del archivo" hint="Opcional si subes el archivo. Drive, S3 o enlace público.">
            <FormInput value={form.url} onChange={f('url')} placeholder="https://…" />
          </FormField>
          <FormField label="Descripción">
            <FormTextarea value={form.description} onChange={f('description')} rows={2} placeholder="Breve descripción del contenido…" />
          </FormField>
        </FormSection>

        <FormSection title="Clasificación y acceso">
          <FormField label="Categoría">
            <FormSelect value={form.category} onChange={f('category')} options={[
              { value: 'global',  label: 'Global — reutilizable en todos los eventos' },
              { value: 'evento',  label: 'Por evento — asociado a un evento específico' },
              { value: 'empresa', label: 'Por empresa — específico de un patrocinador' },
            ]} />
          </FormField>
          <FormField label="Nivel de acceso">
            <FormSelect value={form.scope} onChange={f('scope')} options={[
              { value: 'Público',  label: 'Público — visible a todos' },
              { value: 'Empresa',  label: 'Empresa — visible a empresas registradas' },
              { value: 'Interno',  label: 'Interno — solo equipo EML' },
              { value: 'Privado',  label: 'Privado — solo la empresa involucrada' },
            ]} />
          </FormField>
          {(form.category === 'evento' || form.category === 'empresa') && (
            <FormField label="Evento relacionado">
              <FormSelect value={form.event} onChange={f('event')} options={[
                { value: '', label: 'Sin evento específico' },
                ...events.map(ev => ({ value: ev.id, label: ev.name })),
              ]} />
            </FormField>
          )}
          {form.category === 'empresa' && (
            <FormField label="Empresa relacionada">
              <FormSelect value={form.company} onChange={f('company')} options={[
                { value: '', label: 'Selecciona una empresa' },
                ...companies.map(c => ({ value: c.id, label: c.name })),
              ]} />
            </FormField>
          )}
        </FormSection>
      </NovoModal>
    </div>
  );
}
