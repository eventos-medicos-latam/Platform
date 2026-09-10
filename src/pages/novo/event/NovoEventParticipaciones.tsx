import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon, StarIcon, CopyIcon, Trash2Icon, PencilIcon,
  ChevronDownIcon, ChevronUpIcon, GripVerticalIcon, MapIcon,
  CheckCircleIcon, XCircleIcon, ImageIcon, LayoutPanelLeftIcon, UploadIcon, Maximize2Icon,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { KPICard } from '../../../components/novo/ui/KPICard';
import {
  NovoModal, ModalBtn,
  FormField, FormInput, FormSelect, FormTextarea, FormSection, ImageField,
} from '../../../components/novo/ui/NovoModal';
import {
  defaultParticipationsForSlug,
  getFloorPlanUrl,
  listEventParticipations,
  saveEventParticipations,
  saveFloorPlanUrl,
  type BenefitGroup,
  type EventParticipation as Participation,
  type StandType,
} from '../../../lib/novo/participations';
import { listStandUnits } from '../../../lib/novo/stands';
import { uploadPublicAsset } from '../../../lib/storage';
import type { NovoEvent } from '../../../types/novo';

interface EventContext { event: NovoEvent }

const STAND_TYPE_OPTIONS: { value: StandType; label: string }[] = [
  { value: 'ninguno',        label: 'Sin stand físico' },
  { value: 'estacion',       label: 'Estación (mesa + sillas)' },
  { value: 'stand-pequeno',  label: 'Stand pequeño (3×3 m)' },
  { value: 'stand-mediano',  label: 'Stand mediano (3×6 m)' },
  { value: 'stand-grande',   label: 'Stand grande (6×6 m)' },
];

const STAND_TYPE_LABEL: Record<StandType, string> = {
  ninguno:       'Sin stand',
  estacion:      'Estación',
  'stand-pequeno': 'Stand 3×3',
  'stand-mediano': 'Stand 3×6',
  'stand-grande':  'Stand 6×6',
};

const EVENTS_LIBRARY: { id: string; name: string; participations: Participation[] }[] = [
  {
    id: 'eterna-primavera-2026',
    name: 'La Eterna Primavera · 2026',
    participations: defaultParticipationsForSlug('eterna-primavera-2026'),
  },
  {
    id: 'hormobiota-2-2027',
    name: 'Hormobiota 2 · 2027',
    participations: defaultParticipationsForSlug('hormobiota-2-2027'),
  },
];

/* ── Helpers ────────────────────────────────────────────────────────────── */

const fmt = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;
const CARD = '#112035';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT_HI = '#E1EAF4';
const TEXT_MID = '#7A9CB8';
const ACCENT = '#00C9A0';

function Toggle({ label, desc, on, onChange }: { label: string; desc?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold" style={{ color: TEXT_HI }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: TEXT_MID }}>{desc}</p>}
      </div>
      <button type="button" onClick={() => onChange(!on)}
        className="relative h-6 w-11 rounded-full transition-colors duration-200 flex-shrink-0"
        style={{ background: on ? ACCENT : 'rgba(255,255,255,0.12)' }}>
        <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
          style={{ left: on ? '22px' : '2px' }} />
      </button>
    </div>
  );
}

const EMPTY_GROUP = (): BenefitGroup => ({ id: `bg-${Date.now()}`, title: '', items: [''] });

const EMPTY_PARTICIPATION = (): Partial<Participation> => ({
  name: '', verb: '', tagline: '', price: 0, spots: 0, image_url: '',
  stand_type: 'ninguno', stand_zone: '', has_map: false, is_featured: false, is_active: true,
  benefit_groups: [EMPTY_GROUP()], closing: '',
});

/* ── Main component ─────────────────────────────────────────────────────── */

export function NovoEventParticipaciones() {
  const { event } = useOutletContext<EventContext>();
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [editing, setEditing] = useState<Participation | null>(null);
  const [form, setForm] = useState<Partial<Participation>>(EMPTY_PARTICIPATION());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [floorPlanUrl, setFloorPlanUrl] = useState('');
  const [mapUrlDraft, setMapUrlDraft] = useState('');
  const [uploadingMap, setUploadingMap] = useState(false);
  const [savingMap, setSavingMap] = useState(false);
  const [standZones, setStandZones] = useState<string[]>([]);
  const [mapExpanded, setMapExpanded] = useState(false);
  const mapFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [saved, mapUrl, units] = await Promise.all([
          listEventParticipations(event.id),
          getFloorPlanUrl(event.id),
          listStandUnits(event.id).catch(() => []),
        ]);
        if (cancelled) return;
        setFloorPlanUrl(mapUrl);
        setMapUrlDraft(mapUrl);
        setStandZones(
          [...new Set(units.map((unit) => unit.zone.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
        );
        if (saved.length) {
          setParticipations(saved);
          return;
        }
        const seeded = defaultParticipationsForSlug(event.slug);
        setParticipations(seeded);
        if (seeded.length) await saveEventParticipations(event.id, seeded);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las participaciones.');
        setParticipations(defaultParticipationsForSlug(event.slug));
        setStandZones([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [event.id, event.slug]);

  useEffect(() => {
    if (!mapExpanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMapExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mapExpanded]);

  const persistFloorPlan = async (url: string) => {
    setSavingMap(true);
    setError(null);
    try {
      await saveFloorPlanUrl(event.id, url);
      setFloorPlanUrl(url);
      setMapUrlDraft(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el plano.');
    } finally {
      setSavingMap(false);
    }
  };

  const onMapFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingMap(true);
    setError(null);
    try {
      const { url, error: uploadError } = await uploadPublicAsset(file);
      if (uploadError || !url) throw new Error(uploadError ?? 'No se pudo subir el plano.');
      await persistFloorPlan(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el plano.');
    } finally {
      setUploadingMap(false);
    }
  };

  const persist = async (next: Participation[]) => {
    setParticipations(next);
    await saveEventParticipations(event.id, next);
  };

  /* form helpers */
  const f = <K extends keyof Participation>(k: K) => (v: Participation[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_PARTICIPATION());
    setModalOpen(true);
  };

  const openEdit = (p: Participation) => {
    setEditing(p);
    setForm({ ...p });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const data = { ...EMPTY_PARTICIPATION(), ...form, sold: editing?.sold ?? 0 } as Participation;
    const next = editing
      ? participations.map((row) => (row.id === editing.id ? { ...row, ...data, id: editing.id } : row))
      : [...participations, { ...data, id: `p-${Date.now()}`, sold: 0 }];
    try {
      await persist(next);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la participación.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta participación?')) return;
    setError(null);
    try {
      await persist(participations.filter((row) => row.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    }
  };

  const handleDuplicate = async (p: Participation) => {
    setError(null);
    try {
      await persist([...participations, {
        ...p,
        id: `p-${Date.now()}`,
        name: `${p.name} (copia)`,
        sold: 0,
        is_active: false,
        is_featured: false,
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo duplicar.');
    }
  };

  const handleToggleActive = async (id: string) => {
    setError(null);
    try {
      await persist(participations.map((row) => (row.id === id ? { ...row, is_active: !row.is_active } : row)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar.');
    }
  };

  const handleToggleFeatured = async (id: string) => {
    setError(null);
    try {
      await persist(participations.map((row) => (
        row.id === id
          ? { ...row, is_featured: !row.is_featured }
          : { ...row, is_featured: false }
      )));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar.');
    }
  };

  const handleClone = async (source: Participation) => {
    setError(null);
    try {
      await persist([...participations, {
        ...source,
        id: `p-${Date.now()}`,
        name: `${source.name} (importado)`,
        sold: 0,
        is_active: false,
        is_featured: false,
      }]);
      setCloneOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo importar.');
    }
  };

  /* benefit group helpers */
  const addGroup = () => setForm(p => ({
    ...p,
    benefit_groups: [...(p.benefit_groups ?? []), EMPTY_GROUP()],
  }));

  const removeGroup = (idx: number) => setForm(p => ({
    ...p,
    benefit_groups: (p.benefit_groups ?? []).filter((_, i) => i !== idx),
  }));

  const updateGroup = (idx: number, field: keyof BenefitGroup, val: string | string[]) =>
    setForm(p => ({
      ...p,
      benefit_groups: (p.benefit_groups ?? []).map((g, i) =>
        i === idx ? { ...g, [field]: val } : g
      ),
    }));

  const addItem = (gIdx: number) => setForm(p => ({
    ...p,
    benefit_groups: (p.benefit_groups ?? []).map((g, i) =>
      i === gIdx ? { ...g, items: [...g.items, ''] } : g
    ),
  }));

  const removeItem = (gIdx: number, iIdx: number) => setForm(p => ({
    ...p,
    benefit_groups: (p.benefit_groups ?? []).map((g, i) =>
      i === gIdx ? { ...g, items: g.items.filter((_, j) => j !== iIdx) } : g
    ),
  }));

  const updateItem = (gIdx: number, iIdx: number, val: string) => setForm(p => ({
    ...p,
    benefit_groups: (p.benefit_groups ?? []).map((g, i) =>
      i === gIdx ? { ...g, items: g.items.map((it, j) => j === iIdx ? val : it) } : g
    ),
  }));

  /* KPIs */
  const active = participations.filter(p => p.is_active).length;
  const totalSpots = participations.reduce((s, p) => s + p.spots, 0);
  const totalSold  = participations.reduce((s, p) => s + p.sold, 0);
  const withMap    = participations.filter(p => p.has_map).length;

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] mb-1" style={{ color: ACCENT }}>
            {event.name}
          </p>
          <h1 className="text-2xl font-bold" style={{ color: TEXT_HI, fontFamily: "'Sora', sans-serif" }}>
            Participaciones
          </h1>
          <p className="text-sm mt-1" style={{ color: TEXT_MID }}>
            Planes de participación disponibles para marcas en este evento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCloneOpen(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: TEXT_HI, border: `1px solid ${BORDER}` }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>
            <CopyIcon size={14} /> Importar de otro evento
          </button>
          <button type="button" onClick={openCreate}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all"
            style={{ background: ACCENT, color: '#0d1829' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
            <PlusIcon size={15} /> Nueva participación
          </button>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl px-4 py-2.5 text-xs" style={{ background: 'rgba(242,68,99,.12)', color: '#F24463' }}>{error}</p>
      ) : null}
      {loading ? (
        <p className="mb-4 text-xs" style={{ color: TEXT_MID }}>Cargando participaciones…</p>
      ) : null}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-7 lg:grid-cols-4">
        <KPICard label="Activas" value={String(active)} sub={`de ${participations.length} total`} icon={CheckCircleIcon} accent={ACCENT} />
        <KPICard label="Cupos totales" value={String(totalSpots)} sub={`${totalSold} vendidos`} icon={LayoutPanelLeftIcon} accent="#5B8AF0" />
        <KPICard label="Con plano" value={String(withMap)} sub="muestran mapa al elegir" icon={MapIcon} accent="#A78BFA" />
        <KPICard label="Destacada" value={participations.find(p => p.is_featured)?.name ?? '—'} sub="plan principal" icon={StarIcon} accent="#F59E0B" />
      </div>

      {/* Plano de stands del recinto */}
      <div className="mb-7 overflow-hidden rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex flex-wrap items-start justify-between gap-4 p-5 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: ACCENT }}>Mapa del recinto</p>
            <h2 className="mt-1 text-base font-bold" style={{ color: TEXT_HI, fontFamily: "'Sora', sans-serif" }}>
              Plano de stands
            </h2>
            <p className="mt-1 max-w-xl text-xs" style={{ color: TEXT_MID }}>
              Un plano por evento. Se muestra en Aliados cuando un plan tiene “Mostrar plano” activo.
            </p>
          </div>
          <input ref={mapFileRef} type="file" accept="image/*" className="hidden" onChange={onMapFile} />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={uploadingMap || savingMap}
              onClick={() => mapFileRef.current?.click()}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: ACCENT, color: '#0d1829' }}>
              <UploadIcon size={14} />
              {uploadingMap ? 'Subiendo…' : floorPlanUrl ? 'Reemplazar imagen' : 'Subir imagen'}
            </button>
            {floorPlanUrl ? (
              <button type="button" disabled={savingMap}
                onClick={() => { void persistFloorPlan(''); }}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                style={{ background: 'rgba(242,68,99,.1)', color: '#F24463', border: '1px solid rgba(242,68,99,.3)' }}>
                Quitar
              </button>
            ) : null}
          </div>
        </div>
        {floorPlanUrl ? (
          <button
            type="button"
            onClick={() => setMapExpanded(true)}
            className="relative mx-5 mb-4 block w-[calc(100%-2.5rem)] overflow-hidden rounded-xl text-left"
            style={{ background: '#0d1829', border: `1px solid ${BORDER}` }}
            aria-label="Ampliar plano de stands"
          >
            <img src={floorPlanUrl} alt="Plano de stands del evento" className="max-h-72 w-full object-contain" />
            <span
              className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ background: 'rgba(0,201,160,.18)', color: ACCENT }}
            >
              <Maximize2Icon size={11} /> Ampliar
            </span>
          </button>
        ) : (
          <div className="mx-5 mb-4 flex h-36 flex-col items-center justify-center gap-2 rounded-xl"
            style={{ background: '#0d1829', border: `1px dashed ${BORDER}` }}>
            <MapIcon size={22} style={{ color: TEXT_MID }} />
            <p className="text-xs" style={{ color: TEXT_MID }}>Aún no hay plano cargado</p>
          </div>
        )}
        <div className="px-5 pb-5">
          <FormField label="O pega una URL" hint="PNG, JPG o SVG público">
            <div className="flex gap-2">
              <FormInput value={mapUrlDraft} onChange={setMapUrlDraft} placeholder="https://…/plano-stands.png" />
              <ModalBtn variant="primary" disabled={savingMap || mapUrlDraft.trim() === floorPlanUrl}
                onClick={() => { void persistFloorPlan(mapUrlDraft.trim()); }}>
                {savingMap ? 'Guardando…' : 'Guardar URL'}
              </ModalBtn>
            </div>
          </FormField>
        </div>
      </div>

      {/* Cards */}
      {participations.length === 0 ? (
        <div className="rounded-2xl flex flex-col items-center justify-center py-20 gap-3"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <LayoutPanelLeftIcon size={32} style={{ color: TEXT_MID }} />
          <p className="text-sm font-semibold" style={{ color: TEXT_HI }}>Sin participaciones</p>
          <p className="text-xs" style={{ color: TEXT_MID }}>Crea el primer plan de participación para este evento</p>
          <button type="button" onClick={openCreate}
            className="mt-2 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold"
            style={{ background: ACCENT, color: '#0d1829' }}>
            <PlusIcon size={14} /> Nueva participación
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {participations.map((p) => {
            const isExpanded = expandedId === p.id;
            const left = p.spots - p.sold;
            return (
              <motion.div key={p.id} layout
                className="rounded-2xl overflow-hidden"
                style={{ background: CARD, border: `1px solid ${p.is_featured ? 'rgba(0,201,160,0.4)' : BORDER}` }}>

                {/* Card header */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Image thumbnail */}
                  <div className="h-12 w-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    {p.image_url
                      ? <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                      : <ImageIcon size={18} style={{ color: TEXT_MID }} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold truncate" style={{ color: TEXT_HI }}>{p.name}</p>
                      {p.is_featured && (
                        <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: 'rgba(0,201,160,0.15)', color: ACCENT }}>
                          <StarIcon size={9} /> Principal
                        </span>
                      )}
                      {!p.is_active && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: 'rgba(255,255,255,0.06)', color: TEXT_MID }}>
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: TEXT_MID }}>{p.tagline}</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden lg:flex items-center gap-6 text-right flex-shrink-0">
                    <div>
                      <p className="text-sm font-bold tabular-nums" style={{ color: TEXT_HI }}>{fmt(p.price)}</p>
                      <p className="text-[10px]" style={{ color: TEXT_MID }}>precio</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold tabular-nums" style={{ color: left > 0 ? ACCENT : '#F59E0B' }}>{left}</p>
                      <p className="text-[10px]" style={{ color: TEXT_MID }}>cupos libres</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: TEXT_HI }}>{STAND_TYPE_LABEL[p.stand_type]}</p>
                      <p className="text-[10px]" style={{ color: TEXT_MID }}>
                        {p.stand_zone ? p.stand_zone : 'tipo de stand'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapIcon size={12} style={{ color: p.has_map ? ACCENT : TEXT_MID }} />
                      <p className="text-[10px] font-semibold" style={{ color: p.has_map ? ACCENT : TEXT_MID }}>
                        {p.has_map ? 'Con plano' : 'Sin plano'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button type="button" title={p.is_featured ? 'Quitar destacado' : 'Marcar como principal'}
                      onClick={() => handleToggleFeatured(p.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: p.is_featured ? '#F59E0B' : TEXT_MID, background: 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <StarIcon size={15} />
                    </button>
                    <button type="button" title="Editar" onClick={() => openEdit(p)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: TEXT_MID, background: 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <PencilIcon size={15} />
                    </button>
                    <button type="button" title="Duplicar" onClick={() => handleDuplicate(p)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: TEXT_MID, background: 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <CopyIcon size={15} />
                    </button>
                    <button type="button" title={p.is_active ? 'Desactivar' : 'Activar'}
                      onClick={() => handleToggleActive(p.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: p.is_active ? ACCENT : TEXT_MID, background: 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      {p.is_active ? <CheckCircleIcon size={15} /> : <XCircleIcon size={15} />}
                    </button>
                    <button type="button" title="Eliminar" onClick={() => handleDelete(p.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: '#F24463', background: 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(242,68,99,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <Trash2Icon size={15} />
                    </button>
                    <button type="button" onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      className="p-2 rounded-lg transition-colors ml-1"
                      style={{ color: TEXT_MID, background: 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      {isExpanded ? <ChevronUpIcon size={15} /> : <ChevronDownIcon size={15} />}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden">
                      <div className="px-5 pb-5 pt-1" style={{ borderTop: `1px solid ${BORDER}` }}>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {p.benefit_groups.map((g) => (
                            <div key={g.id} className="rounded-xl p-4"
                              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}>
                              <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-2" style={{ color: ACCENT }}>
                                {g.title}
                              </p>
                              <ul className="space-y-1.5">
                                {g.items.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: TEXT_MID }}>
                                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                        {p.closing && (
                          <p className="mt-4 text-xs italic" style={{ color: TEXT_MID }}>{p.closing}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Create/Edit modal ─────────────────────────────────────────────── */}
      <NovoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar participación' : 'Nueva participación'}
        subtitle={editing ? editing.name : 'Configura el plan de participación para este evento'}
        width={720}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={handleSave} disabled={saving}>
              {editing ? 'Guardar cambios' : 'Crear participación'}
            </ModalBtn>
          </>
        }>

        {/* Identidad */}
        <FormSection title="Identidad del plan">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nombre del plan" required>
              <FormInput value={form.name ?? ''} onChange={f('name')} placeholder="Paquete Protagonista" />
            </FormField>
            <FormField label="Verbo de posicionamiento" required>
              <FormInput value={form.verb ?? ''} onChange={f('verb')} placeholder="Posicionarte" />
            </FormField>
          </div>
          <FormField label="Tagline (descripción corta)" required>
            <FormInput value={form.tagline ?? ''} onChange={f('tagline')} placeholder="Posicionamiento integral + speaker + presencia académica" />
          </FormField>
          <ImageField label="Imagen de referencia del plan" value={form.image_url ?? ''} onChange={f('image_url')} hint="URL de imagen que se mostrará en la tarjeta pública" />
        </FormSection>

        {/* Precio y cupos */}
        <FormSection title="Precio y disponibilidad">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Precio (COP)" required>
              <FormInput value={form.price ? String(form.price) : ''} onChange={v => f('price')(Number(v) || 0)} placeholder="19500000" />
            </FormField>
            <FormField label="Cupos disponibles" required>
              <FormInput value={form.spots ? String(form.spots) : ''} onChange={v => f('spots')(Number(v) || 0)} placeholder="4" />
            </FormField>
          </div>
        </FormSection>

        {/* Stand y plano */}
        <FormSection title="Stand y plano del evento">
          <FormField label="Tipo de stand asociado">
            <FormSelect
              value={form.stand_type ?? 'ninguno'}
              onChange={v => f('stand_type')(v as StandType)}
              options={STAND_TYPE_OPTIONS}
            />
          </FormField>
          <FormField
            label="Sección de stands"
            hint="El aliado solo podrá elegir stands de esta zona del plano. Déjalo vacío para mostrar todas."
          >
            <FormInput
              value={form.stand_zone ?? ''}
              onChange={f('stand_zone')}
              placeholder="Ej. Zona A, Foyer, Estaciones Pop Up"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => f('stand_zone')('')}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  background: !(form.stand_zone ?? '').trim() ? 'rgba(0,201,160,.18)' : 'rgba(255,255,255,0.06)',
                  color: !(form.stand_zone ?? '').trim() ? ACCENT : TEXT_MID,
                  border: `1px solid ${!(form.stand_zone ?? '').trim() ? 'rgba(0,201,160,.35)' : BORDER}`,
                }}
              >
                Todas
              </button>
              {standZones.map((zone) => {
                const on = (form.stand_zone ?? '').trim().toLowerCase() === zone.toLowerCase();
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => f('stand_zone')(zone)}
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      background: on ? 'rgba(0,201,160,.18)' : 'rgba(255,255,255,0.06)',
                      color: on ? ACCENT : TEXT_MID,
                      border: `1px solid ${on ? 'rgba(0,201,160,.35)' : BORDER}`,
                    }}
                  >
                    {zone}
                  </button>
                );
              })}
            </div>
          </FormField>
          <div className="mt-3 space-y-3 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
            <Toggle
              label="Mostrar plano del evento al elegir este plan"
              desc="Usa el plano cargado arriba. El aliado lo verá al postularse y podrá indicar un stand"
              on={form.has_map ?? false}
              onChange={f('has_map')}
            />
            <Toggle
              label="Marcar como plan principal"
              desc="Se destaca visualmente como el plan recomendado"
              on={form.is_featured ?? false}
              onChange={f('is_featured')}
            />
            <Toggle
              label="Plan activo (visible en la web)"
              desc="Desactiva para ocultar sin eliminar"
              on={form.is_active ?? true}
              onChange={f('is_active')}
            />
          </div>
        </FormSection>

        {/* Grupos de beneficios */}
        <FormSection title="Beneficios por sección">
          <p className="text-xs mb-3" style={{ color: TEXT_MID }}>
            Organiza los beneficios en secciones. Cada sección aparece como un bloque en la tarjeta pública.
          </p>
          {(form.benefit_groups ?? []).map((group, gIdx) => (
            <div key={group.id} className="mb-4 rounded-xl overflow-hidden"
              style={{ border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <GripVerticalIcon size={13} style={{ color: TEXT_MID }} />
                <input
                  value={group.title}
                  onChange={e => updateGroup(gIdx, 'title', e.target.value)}
                  placeholder="Nombre de la sección (ej: Presencia física)"
                  className="flex-1 bg-transparent text-sm font-semibold outline-none"
                  style={{ color: TEXT_HI }}
                />
                <button type="button" onClick={() => removeGroup(gIdx)}
                  className="p-1 rounded transition-colors"
                  style={{ color: '#F24463' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(242,68,99,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <Trash2Icon size={13} />
                </button>
              </div>
              <div className="px-3 py-2 space-y-2">
                {group.items.map((item, iIdx) => (
                  <div key={iIdx} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                    <input
                      value={item}
                      onChange={e => updateItem(gIdx, iIdx, e.target.value)}
                      placeholder="Describe el beneficio…"
                      className="flex-1 bg-transparent text-sm outline-none py-1"
                      style={{ color: TEXT_HI, borderBottom: `1px solid ${BORDER}` }}
                    />
                    <button type="button" onClick={() => removeItem(gIdx, iIdx)}
                      style={{ color: TEXT_MID }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#F24463'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = TEXT_MID; }}>
                      <XCircleIcon size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addItem(gIdx)}
                  className="flex items-center gap-1.5 mt-2 text-xs font-semibold transition-colors"
                  style={{ color: ACCENT }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                  <PlusIcon size={12} /> Agregar ítem
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addGroup}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold w-full justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px dashed ${BORDER}`, color: TEXT_MID }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT_MID; }}>
            <PlusIcon size={14} /> Agregar sección de beneficios
          </button>
        </FormSection>

        {/* Cierre */}
        <FormSection title="Frase de cierre">
          <FormTextarea
            value={form.closing ?? ''}
            onChange={f('closing')}
            placeholder="Una frase corta que resume la propuesta de valor del plan…"
            rows={2}
          />
        </FormSection>
      </NovoModal>

      {/* ── Clone modal ───────────────────────────────────────────────────── */}
      <NovoModal
        open={cloneOpen}
        onClose={() => setCloneOpen(false)}
        title="Importar participación"
        subtitle="Clona un plan de otro evento y ajústalo"
        width={560}
        footer={<ModalBtn variant="secondary" onClick={() => setCloneOpen(false)}>Cerrar</ModalBtn>}
      >
        {EVENTS_LIBRARY.map(ev => (
          <div key={ev.id} className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] mb-2" style={{ color: TEXT_MID }}>{ev.name}</p>
            <div className="space-y-2">
              {ev.participations.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: TEXT_HI }}>{p.name}</p>
                    <p className="text-xs truncate" style={{ color: TEXT_MID }}>{fmt(p.price)} · {p.spots} cupos</p>
                  </div>
                  <button type="button" onClick={() => handleClone(p)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold flex-shrink-0 transition-all"
                    style={{ background: 'rgba(0,201,160,0.12)', color: ACCENT, border: `1px solid rgba(0,201,160,0.3)` }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,201,160,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,201,160,0.12)'; }}>
                    <CopyIcon size={12} /> Importar
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </NovoModal>
      {mapExpanded && floorPlanUrl && createPortal(
        <div
          className="fixed inset-0 z-[80] flex flex-col p-4 sm:p-6"
          style={{ background: 'rgba(5,10,20,.88)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Plano de stands ampliado"
          onClick={() => setMapExpanded(false)}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold" style={{ color: TEXT_HI }}>Plano de stands</p>
            <button
              type="button"
              onClick={() => setMapExpanded(false)}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,.08)', color: TEXT_HI }}
            >
              Cerrar
            </button>
          </div>
          <div
            className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-transparent p-2"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={floorPlanUrl}
              alt="Plano de stands del evento"
              className="mx-auto h-auto w-auto max-h-[62vh] max-w-[min(800px,85vw)] object-contain drop-shadow-lg"
            />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
