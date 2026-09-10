import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon, StarIcon, CopyIcon, Trash2Icon, PencilIcon,
  ChevronDownIcon, ChevronUpIcon, GripVerticalIcon, MapIcon,
  CheckCircleIcon, XCircleIcon, ImageIcon, LayoutPanelLeftIcon,
} from 'lucide-react';
import { KPICard } from '../../../components/novo/ui/KPICard';
import {
  NovoModal, ModalBtn,
  FormField, FormInput, FormSelect, FormTextarea, FormSection, ImageField,
} from '../../../components/novo/ui/NovoModal';
import type { NovoEvent } from '../../../types/novo';

interface EventContext { event: NovoEvent }

/* ── Types ─────────────────────────────────────────────────────────────── */

type StandType = 'estacion' | 'stand-pequeno' | 'stand-mediano' | 'stand-grande' | 'ninguno';

interface BenefitGroup {
  id: string;
  title: string;
  items: string[];
}

interface Participation {
  id: string;
  name: string;
  verb: string;
  tagline: string;
  price: number;
  spots: number;
  sold: number;
  image_url: string;
  stand_type: StandType;
  has_map: boolean;
  is_featured: boolean;
  is_active: boolean;
  benefit_groups: BenefitGroup[];
  closing: string;
}

/* ── Mock data ─────────────────────────────────────────────────────────── */

const MOCK_PARTICIPATIONS: Participation[] = [
  {
    id: 'p1',
    name: 'Paquete Protagonista',
    verb: 'Posicionarte',
    tagline: 'Posicionamiento integral + speaker + presencia académica',
    price: 19500000,
    spots: 4,
    sold: 0,
    image_url: '',
    stand_type: 'stand-grande',
    has_map: true,
    is_featured: true,
    is_active: true,
    benefit_groups: [
      { id: 'bg1', title: 'Presencia física', items: ['Stand 3×2 m', 'Branding en backing y señalética', 'Máximo 4 colaboradores'] },
      { id: 'bg2', title: 'Presencia web y digital', items: ['Logo destacado en la página web', 'Presencia digital en comunicaciones', 'Visibilidad 3 a 6 meses'] },
      { id: 'bg3', title: 'Speaker', items: ['Participación con speaker propio', 'Sujeto a aprobación del comité científico'] },
    ],
    closing: 'Protagonista integra tu marca dentro de la conversación científica del evento.',
  },
  {
    id: 'p2',
    name: 'Paquete Conexión',
    verb: 'Conectar',
    tagline: 'Presencia digital + web + stand + relacionamiento',
    price: 8900000,
    spots: 6,
    sold: 0,
    image_url: '',
    stand_type: 'stand-mediano',
    has_map: true,
    is_featured: false,
    is_active: true,
    benefit_groups: [
      { id: 'bg4', title: 'Presencia física', items: ['Stand 3×2 m', 'Máximo 4 colaboradores'] },
      { id: 'bg5', title: 'Presencia digital', items: ['Logo en la web oficial', '3 menciones en redes sociales'] },
      { id: 'bg6', title: 'Relacionamiento', items: ['Mesa de nicho en almuerzo', '10 invitaciones para profesionales'] },
    ],
    closing: 'Conexión combina presencia física y digital para tu marca.',
  },
  {
    id: 'p3',
    name: 'Pop Up',
    verb: 'Estar presente',
    tagline: 'Presencia de marca simple y directa',
    price: 3200000,
    spots: 4,
    sold: 0,
    image_url: '',
    stand_type: 'estacion',
    has_map: false,
    is_featured: false,
    is_active: true,
    benefit_groups: [
      { id: 'bg7', title: 'Presencia física', items: ['Estación compacta', '1 mesa + 2 sillas', '1 pendón roll-up', 'Máximo 2 colaboradores'] },
    ],
    closing: 'Una forma práctica de acercar tu marca al evento.',
  },
];

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
    id: 'hormobiota-2', name: 'Hormobiota 2 · 2027',
    participations: MOCK_PARTICIPATIONS,
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
  stand_type: 'ninguno', has_map: false, is_featured: false, is_active: true,
  benefit_groups: [EMPTY_GROUP()], closing: '',
});

/* ── Main component ─────────────────────────────────────────────────────── */

export function NovoEventParticipaciones() {
  const { event } = useOutletContext<EventContext>();
  const [participations, setParticipations] = useState<Participation[]>(MOCK_PARTICIPATIONS);
  const [modalOpen, setModalOpen] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [editing, setEditing] = useState<Participation | null>(null);
  const [form, setForm] = useState<Partial<Participation>>(EMPTY_PARTICIPATION());
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      const data = { ...EMPTY_PARTICIPATION(), ...form } as Participation;
      if (editing) {
        setParticipations(prev => prev.map(p => p.id === editing.id ? { ...p, ...data } : p));
      } else {
        setParticipations(prev => [...prev, { ...data, id: `p-${Date.now()}`, sold: 0 }]);
      }
      setModalOpen(false);
    }, 600);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta participación?')) return;
    setParticipations(prev => prev.filter(p => p.id !== id));
  };

  const handleDuplicate = (p: Participation) => {
    setParticipations(prev => [...prev, {
      ...p,
      id: `p-${Date.now()}`,
      name: `${p.name} (copia)`,
      sold: 0,
      is_active: false,
    }]);
  };

  const handleToggleActive = (id: string) => {
    setParticipations(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p));
  };

  const handleToggleFeatured = (id: string) => {
    setParticipations(prev => prev.map(p => p.id === id
      ? { ...p, is_featured: !p.is_featured }
      : { ...p, is_featured: false }
    ));
  };

  const handleClone = (source: Participation) => {
    setParticipations(prev => [...prev, {
      ...source,
      id: `p-${Date.now()}`,
      name: `${source.name} (importado)`,
      sold: 0,
      is_active: false,
    }]);
    setCloneOpen(false);
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

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-7 lg:grid-cols-4">
        <KPICard label="Activas" value={String(active)} sub={`de ${participations.length} total`} icon={CheckCircleIcon} accent={ACCENT} />
        <KPICard label="Cupos totales" value={String(totalSpots)} sub={`${totalSold} vendidos`} icon={LayoutPanelLeftIcon} accent="#5B8AF0" />
        <KPICard label="Con plano" value={String(withMap)} sub="muestran mapa al elegir" icon={MapIcon} accent="#A78BFA" />
        <KPICard label="Destacada" value={participations.find(p => p.is_featured)?.name ?? '—'} sub="plan principal" icon={StarIcon} accent="#F59E0B" />
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
                      <p className="text-[10px]" style={{ color: TEXT_MID }}>tipo de stand</p>
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
          <div className="mt-3 space-y-3 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
            <Toggle
              label="Mostrar plano del evento al elegir este plan"
              desc="El cliente verá el mapa y elegirá un stand antes del formulario"
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
    </div>
  );
}
