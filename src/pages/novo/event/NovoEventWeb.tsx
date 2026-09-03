import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GlobeIcon, EyeIcon, ExternalLinkIcon,
  CheckCircleIcon, AlertCircleIcon, XCircleIcon,
  ChevronRightIcon, PencilIcon, GripVerticalIcon,
  PlusIcon, TrashIcon, SaveIcon, ArrowRightIcon,
  ImageIcon, FileTextIcon, MapPinIcon, HelpCircleIcon,
  UsersIcon, CalendarDaysIcon, BuildingIcon, TicketIcon,
  MegaphoneIcon, ZapIcon, PhotoIcon,
} from 'lucide-react';
import type { NovoEvent, NovoEventPublicationStatus } from '../../../types/novo';

interface EventContext { event: NovoEvent }

/* ── Tipos de sección ───────────────────────────────────── */
type SectionId =
  | 'hero' | 'concepto' | 'agenda' | 'speakers' | 'tickets'
  | 'patrocinadores' | 'aliados' | 'stands' | 'ubicacion'
  | 'faq' | 'galeria' | 'cta' | 'certificacion' | 'resultados';

interface FaqItem { q: string; a: string }

interface SectionContent {
  /* hero */
  hero_title?: string; hero_subtitle?: string; hero_cta_label?: string; hero_cta_url?: string; hero_image?: string;
  /* concepto */
  concepto_title?: string; concepto_body?: string; concepto_image?: string;
  /* ubicacion */
  ubicacion_venue?: string; ubicacion_address?: string; ubicacion_city?: string; ubicacion_maps?: string; ubicacion_transport?: string;
  /* faq */
  faq_items?: FaqItem[];
  /* cta */
  cta_title?: string; cta_body?: string; cta_label?: string; cta_url?: string;
  /* galeria */
  galeria_images?: string[];
  /* seo */
  seo_title?: string; seo_description?: string; seo_image?: string;
}

interface WebSection {
  id: SectionId;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  required?: boolean;
  status: 'ok' | 'warn' | 'empty';
  note?: string;
}

/* ── Configuración de secciones ─────────────────────────── */
const ALL_SECTIONS: WebSection[] = [
  { id: 'hero',         label: 'Hero / Portada',         description: 'Imagen principal, título y CTA del evento',     icon: ImageIcon,       enabled: true,  required: true,  status: 'ok'   },
  { id: 'concepto',     label: 'Acerca del evento',      description: 'Descripción, objetivos y propuesta de valor',   icon: FileTextIcon,    enabled: true,  status: 'ok'   },
  { id: 'agenda',       label: 'Agenda pública',         description: 'Programa del evento (toma datos de Agenda)',    icon: CalendarDaysIcon,enabled: true,  status: 'warn', note: 'Algunas sesiones sin confirmar' },
  { id: 'speakers',     label: 'Ponentes',               description: 'Grilla de speakers (toma datos de Speakers)',   icon: UsersIcon,       enabled: true,  status: 'ok'   },
  { id: 'tickets',      label: 'Tickets / Inscripción',  description: 'Tarifas, tipos y botón de registro',           icon: TicketIcon,      enabled: true,  status: 'ok'   },
  { id: 'patrocinadores',label:'Patrocinadores',          description: 'Logos por tier de patrocinio',                 icon: BuildingIcon,    enabled: true,  status: 'warn', note: 'Logos faltantes en algunos planes' },
  { id: 'aliados',      label: 'Aliados / Apoyan',       description: 'Instituciones y organizaciones aliadas',        icon: ZapIcon,         enabled: false, status: 'empty' },
  { id: 'stands',       label: 'Stands / Exposición',   description: 'Mapa del área de exposición',                   icon: BuildingIcon,    enabled: false, status: 'empty' },
  { id: 'ubicacion',    label: 'Ubicación y mapa',       description: 'Dirección, cómo llegar, transporte',           icon: MapPinIcon,      enabled: true,  status: 'ok'   },
  { id: 'faq',          label: 'Preguntas frecuentes',   description: 'Preguntas y respuestas para asistentes',       icon: HelpCircleIcon,  enabled: false, status: 'empty', note: 'Sin preguntas configuradas' },
  { id: 'galeria',      label: 'Galería',                description: 'Fotos del evento (previa o ediciones pasadas)', icon: PhotoIcon,       enabled: false, status: 'empty' },
  { id: 'cta',          label: 'CTA final / Cierre',     description: 'Llamado final a la acción antes del footer',   icon: MegaphoneIcon,   enabled: true,  status: 'ok'   },
  { id: 'certificacion',label: 'Certificación',          description: 'Información sobre el certificado de asistencia',icon: CheckCircleIcon, enabled: false, status: 'empty' },
  { id: 'resultados',   label: 'Resultados / Memorias',  description: 'Resumen y materiales post-evento',             icon: FileTextIcon,    enabled: false, status: 'empty' },
];

/* ── Estado de publicación ──────────────────────────────── */
const PUB_CONFIG: Record<NovoEventPublicationStatus, {
  label: string; color: string; bg: string; border: string; description: string;
  next?: NovoEventPublicationStatus; nextLabel?: string;
  prev?: NovoEventPublicationStatus; prevLabel?: string;
}> = {
  borrador:      { label: 'Borrador',      color: '#F59E0B', bg: 'rgba(245,158,11,.12)',  border: 'rgba(245,158,11,.3)',  description: 'Solo visible para administradores.',      next: 'vista-previa', nextLabel: 'Enviar a vista previa' },
  'vista-previa':{ label: 'Vista previa',  color: '#5B8AF0', bg: 'rgba(91,138,240,.12)',  border: 'rgba(91,138,240,.3)',  description: 'Visible con enlace privado de vista previa.', next: 'publicado', nextLabel: 'Publicar', prev: 'borrador', prevLabel: 'Volver a borrador' },
  publicado:     { label: 'Publicado',     color: '#00C9A0', bg: 'rgba(0,201,160,.12)',   border: 'rgba(0,201,160,.3)',   description: 'Visible al público en el sitio web.',     next: 'oculto',       nextLabel: 'Ocultar página' },
  oculto:        { label: 'Oculto',        color: '#3A5470', bg: 'rgba(58,84,112,.2)',    border: 'rgba(58,84,112,.3)',   description: 'Retirada del sitio, datos conservados.',  next: 'publicado',    nextLabel: 'Republicar' },
};

const STATUS_CFG = {
  ok:    { icon: CheckCircleIcon, color: '#00C9A0' },
  warn:  { icon: AlertCircleIcon, color: '#F59E0B' },
  empty: { icon: XCircleIcon,     color: '#2a4a6b' },
};

/* ── Estilos comunes ─────────────────────────────────────── */
const BG      = '#112035';
const BG_DEEP = '#0d1829';
const BORDER  = '#1e3450';
const ACCENT  = '#00C9A0';
const TEXT_HI = '#E1EAF4';
const TEXT_LO = '#7A9CB8';
const TEXT_DIM = '#3A5470';

function SInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-xl px-3 py-2 text-sm outline-none"
      style={{ background: BG_DEEP, border: `1px solid ${BORDER}`, color: TEXT_HI }}
      onFocus={e => (e.currentTarget.style.borderColor = `${ACCENT}50`)}
      onBlur={e  => (e.currentTarget.style.borderColor = BORDER)} />
  );
}

function STextarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none"
      style={{ background: BG_DEEP, border: `1px solid ${BORDER}`, color: TEXT_HI }}
      onFocus={e => (e.currentTarget.style.borderColor = `${ACCENT}50`)}
      onBlur={e  => (e.currentTarget.style.borderColor = BORDER)} />
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: TEXT_DIM }}>{children}</p>;
}

function SField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><SLabel>{label}</SLabel>{children}</div>;
}

/* ══════════════════════════════════════════════════════════ */
export function NovoEventWeb() {
  const { event } = useOutletContext<EventContext>();

  const [pubStatus, setPubStatus]   = useState<NovoEventPublicationStatus>('borrador');
  const [sections, setSections]     = useState<WebSection[]>(ALL_SECTIONS);
  const [selected, setSelected]     = useState<SectionId | 'seo' | null>(null);
  const [content, setContent]       = useState<SectionContent>({
    hero_title: event.name, hero_subtitle: event.tagline ?? '', hero_cta_label: 'Inscríbete ahora',
    concepto_title: 'Acerca del evento', concepto_body: event.description ?? '',
    ubicacion_venue: event.venue_name ?? '', ubicacion_city: event.venue_city ?? '',
    faq_items: [{ q: '¿Cuál es el aforo?', a: `${event.max_capacity ?? 'Consultar'} asistentes.` }],
    cta_title: '¿Listo para asistir?', cta_label: 'Reservar mi lugar',
    seo_title: event.name, seo_description: event.description ?? '',
    galeria_images: [],
  });
  const [saving, setSaving]         = useState(false);
  const [saved,  setSaved]          = useState(false);

  const cfg = PUB_CONFIG[pubStatus];

  const toggleSection = (id: SectionId) => {
    setSections(prev => prev.map(s => s.id !== id || s.required ? s : { ...s, enabled: !s.enabled }));
  };

  const c = (k: keyof SectionContent) => (v: string) =>
    setContent(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }, 700);
  };

  const enabledOk   = sections.filter(s => s.enabled && s.status === 'ok').length;
  const enabledWarn = sections.filter(s => s.enabled && s.status === 'warn').length;
  const enabledAll  = sections.filter(s => s.enabled).length;
  const readiness   = enabledAll > 0 ? Math.round((enabledOk / enabledAll) * 100) : 0;

  /* ── Editor de sección seleccionada ──────────────────── */
  const renderEditor = () => {
    if (!selected) return null;

    if (selected === 'seo') return (
      <div className="space-y-4">
        <p className="text-xs font-bold" style={{ color: TEXT_HI }}>SEO y metadatos</p>
        <SField label="Título SEO (max 60 chars)">
          <SInput value={content.seo_title ?? ''} onChange={c('seo_title')} placeholder={event.name} />
          <p className="text-[10px] mt-1" style={{ color: TEXT_DIM }}>{(content.seo_title ?? '').length}/60 caracteres</p>
        </SField>
        <SField label="Descripción meta (max 160 chars)">
          <STextarea value={content.seo_description ?? ''} onChange={c('seo_description')} rows={3} placeholder="Descripción del evento para buscadores…" />
          <p className="text-[10px] mt-1" style={{ color: TEXT_DIM }}>{(content.seo_description ?? '').length}/160 caracteres</p>
        </SField>
        <SField label="Imagen OG (Open Graph)">
          <SInput value={content.seo_image ?? ''} onChange={c('seo_image')} placeholder="https://..." />
        </SField>
        <div className="rounded-xl p-3.5 text-xs" style={{ background: BG_DEEP, border: `1px solid ${BORDER}` }}>
          <p className="font-semibold mb-1" style={{ color: TEXT_HI }}>URL canónica</p>
          <p className="font-mono" style={{ color: TEXT_DIM }}>eventosmedicoslatam.com/eventos/{event.slug ?? event.id}</p>
        </div>
      </div>
    );

    const sec = sections.find(s => s.id === selected);
    if (!sec) return null;

    if (selected === 'hero') return (
      <div className="space-y-4">
        <p className="text-xs font-bold" style={{ color: TEXT_HI }}>Hero / Portada</p>
        <SField label="Título principal"><SInput value={content.hero_title ?? ''} onChange={c('hero_title')} /></SField>
        <SField label="Subtítulo"><SInput value={content.hero_subtitle ?? ''} onChange={c('hero_subtitle')} /></SField>
        <SField label="Texto del botón CTA"><SInput value={content.hero_cta_label ?? ''} onChange={c('hero_cta_label')} placeholder="Inscríbete ahora" /></SField>
        <SField label="URL del CTA"><SInput value={content.hero_cta_url ?? ''} onChange={c('hero_cta_url')} placeholder="https://..." /></SField>
        <SField label="URL imagen de fondo"><SInput value={content.hero_image ?? ''} onChange={c('hero_image')} placeholder="https://..." /></SField>
      </div>
    );

    if (selected === 'concepto') return (
      <div className="space-y-4">
        <p className="text-xs font-bold" style={{ color: TEXT_HI }}>Acerca del evento</p>
        <SField label="Título de la sección"><SInput value={content.concepto_title ?? ''} onChange={c('concepto_title')} /></SField>
        <SField label="Descripción / cuerpo">
          <STextarea value={content.concepto_body ?? ''} onChange={c('concepto_body')} rows={5} placeholder="Descripción completa del evento…" />
        </SField>
        <SField label="URL imagen ilustrativa"><SInput value={content.concepto_image ?? ''} onChange={c('concepto_image')} placeholder="https://..." /></SField>
      </div>
    );

    if (selected === 'ubicacion') return (
      <div className="space-y-4">
        <p className="text-xs font-bold" style={{ color: TEXT_HI }}>Ubicación y cómo llegar</p>
        <SField label="Nombre del recinto"><SInput value={content.ubicacion_venue ?? ''} onChange={c('ubicacion_venue')} /></SField>
        <SField label="Dirección"><SInput value={content.ubicacion_address ?? ''} onChange={c('ubicacion_address')} /></SField>
        <SField label="Ciudad"><SInput value={content.ubicacion_city ?? ''} onChange={c('ubicacion_city')} /></SField>
        <SField label="Link Google Maps"><SInput value={content.ubicacion_maps ?? ''} onChange={c('ubicacion_maps')} placeholder="https://maps.google.com/..." /></SField>
        <SField label="Cómo llegar / transporte">
          <STextarea value={content.ubicacion_transport ?? ''} onChange={c('ubicacion_transport')} rows={3} placeholder="Metro, buses, parqueadero…" />
        </SField>
      </div>
    );

    if (selected === 'faq') {
      const items = content.faq_items ?? [];
      const addItem = () => setContent(p => ({ ...p, faq_items: [...(p.faq_items ?? []), { q: '', a: '' }] }));
      const removeItem = (i: number) => setContent(p => ({ ...p, faq_items: (p.faq_items ?? []).filter((_, idx) => idx !== i) }));
      const updateItem = (i: number, field: 'q' | 'a', v: string) =>
        setContent(p => ({ ...p, faq_items: (p.faq_items ?? []).map((item, idx) => idx === i ? { ...item, [field]: v } : item) }));
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold" style={{ color: TEXT_HI }}>Preguntas frecuentes</p>
            <button onClick={addItem} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{ background: 'rgba(0,201,160,.1)', color: ACCENT }}>
              <PlusIcon size={11} /> Agregar
            </button>
          </div>
          {items.map((item, i) => (
            <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: BG_DEEP, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_DIM }}>Pregunta {i + 1}</p>
                <button onClick={() => removeItem(i)}><TrashIcon size={11} style={{ color: '#F24463' }} /></button>
              </div>
              <SInput value={item.q} onChange={v => updateItem(i, 'q', v)} placeholder="¿Cuál es el costo del evento?" />
              <STextarea value={item.a} onChange={v => updateItem(i, 'a', v)} rows={2} placeholder="Respuesta…" />
            </div>
          ))}
          {items.length === 0 && (
            <div className="rounded-xl py-8 text-center" style={{ background: BG_DEEP, border: `1px dashed ${BORDER}` }}>
              <p className="text-sm" style={{ color: TEXT_DIM }}>Sin preguntas. Agrega la primera.</p>
            </div>
          )}
        </div>
      );
    }

    if (selected === 'cta') return (
      <div className="space-y-4">
        <p className="text-xs font-bold" style={{ color: TEXT_HI }}>CTA final / Cierre</p>
        <SField label="Título"><SInput value={content.cta_title ?? ''} onChange={c('cta_title')} placeholder="¿Listo para asistir?" /></SField>
        <SField label="Texto de apoyo"><STextarea value={content.cta_body ?? ''} onChange={c('cta_body')} rows={2} placeholder="No dejes pasar esta oportunidad…" /></SField>
        <SField label="Texto del botón"><SInput value={content.cta_label ?? ''} onChange={c('cta_label')} placeholder="Reservar mi lugar" /></SField>
        <SField label="URL del botón"><SInput value={content.cta_url ?? ''} onChange={c('cta_url')} placeholder="https://..." /></SField>
      </div>
    );

    if (selected === 'galeria') {
      const imgs = content.galeria_images ?? [];
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold" style={{ color: TEXT_HI }}>Galería de imágenes</p>
            <button onClick={() => setContent(p => ({ ...p, galeria_images: [...(p.galeria_images ?? []), ''] }))}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{ background: 'rgba(0,201,160,.1)', color: ACCENT }}>
              <PlusIcon size={11} /> Agregar URL
            </button>
          </div>
          {imgs.map((url, i) => (
            <div key={i} className="flex gap-2">
              <SInput value={url} onChange={v => setContent(p => ({ ...p, galeria_images: (p.galeria_images ?? []).map((u, idx) => idx === i ? v : u) }))} placeholder="https://..." />
              <button onClick={() => setContent(p => ({ ...p, galeria_images: (p.galeria_images ?? []).filter((_, idx) => idx !== i) }))}
                className="rounded-lg px-2.5" style={{ background: 'rgba(242,68,99,.1)', color: '#F24463', border: '1px solid rgba(242,68,99,.2)' }}>
                <TrashIcon size={12} />
              </button>
            </div>
          ))}
        </div>
      );
    }

    /* Secciones que solo tienen toggle (agenda, speakers, tickets, patrocinadores, etc.) */
    return (
      <div className="space-y-3">
        <p className="text-xs font-bold" style={{ color: TEXT_HI }}>{sec.label}</p>
        <div className="rounded-xl p-4" style={{ background: BG_DEEP, border: `1px solid ${BORDER}` }}>
          <p className="text-xs" style={{ color: TEXT_LO }}>{sec.description}</p>
          {sec.note && (
            <div className="mt-3 flex items-start gap-2 rounded-lg p-2.5" style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)' }}>
              <AlertCircleIcon size={13} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs" style={{ color: '#F59E0B' }}>{sec.note}</p>
            </div>
          )}
        </div>
        {selected === 'agenda' && (
          <Link to={`/novo/eventos/${event.id}/agenda`}
            className="flex items-center justify-between w-full rounded-xl px-4 py-3 text-xs font-semibold transition-all"
            style={{ background: 'rgba(0,201,160,.08)', color: ACCENT, border: `1px solid rgba(0,201,160,.2)` }}>
            Ir a Agenda del evento <ChevronRightIcon size={13} />
          </Link>
        )}
        {selected === 'speakers' && (
          <Link to={`/novo/speakers`}
            className="flex items-center justify-between w-full rounded-xl px-4 py-3 text-xs font-semibold transition-all"
            style={{ background: 'rgba(0,201,160,.08)', color: ACCENT, border: `1px solid rgba(0,201,160,.2)` }}>
            Ir a Speakers globales <ChevronRightIcon size={13} />
          </Link>
        )}
        {selected === 'patrocinadores' && (
          <Link to={`/novo/eventos/${event.id}/patrocinadores`}
            className="flex items-center justify-between w-full rounded-xl px-4 py-3 text-xs font-semibold transition-all"
            style={{ background: 'rgba(0,201,160,.08)', color: ACCENT, border: `1px solid rgba(0,201,160,.2)` }}>
            Ir a Patrocinadores del evento <ChevronRightIcon size={13} />
          </Link>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* ── Header ───────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: TEXT_HI, fontFamily: "'Sora', sans-serif" }}>Página Web del Evento</h1>
          <p className="text-sm mt-0.5" style={{ color: TEXT_LO }}>Secciones · contenido · publicación</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a href={`/eventos/${event.slug ?? event.id}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all"
            style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}>
            <EyeIcon size={13} /> Vista previa <ExternalLinkIcon size={10} />
          </a>
          <motion.button whileTap={{ scale: 0.96 }} onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold"
            style={{ background: saved ? 'rgba(0,201,160,.18)' : 'rgba(0,201,160,.12)', color: ACCENT, border: `1px solid rgba(0,201,160,.3)` }}>
            <SaveIcon size={13} />
            {saving ? 'Guardando…' : saved ? '¡Guardado!' : 'Guardar cambios'}
          </motion.button>
        </div>
      </div>

      <div className="flex gap-5">

        {/* ── Lista de secciones ──────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Estado de publicación */}
          <div className="mb-4 rounded-2xl p-4" style={{ background: BG, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <GlobeIcon size={16} style={{ color: cfg.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                    <span className="text-xs" style={{ color: TEXT_DIM }}>{cfg.description}</span>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: TEXT_DIM }}>
                    {enabledAll} secciones activas · {readiness}% lista
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {cfg.prev && (
                  <button onClick={() => setPubStatus(cfg.prev!)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}>
                    {cfg.prevLabel}
                  </button>
                )}
                {cfg.next && (
                  <button onClick={() => setPubStatus(cfg.next!)}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95"
                    style={{ background: cfg.color, color: '#0d1829' }}>
                    {cfg.nextLabel} <ArrowRightIcon size={12} />
                  </button>
                )}
              </div>
            </div>
            {/* Barra de progreso de secciones */}
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full" style={{ background: BORDER }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${readiness}%`, background: readiness === 100 ? ACCENT : '#F59E0B' }} />
            </div>
          </div>

          {/* Cabecera de columna */}
          <div className="grid px-4 py-2 mb-2 text-[10px] font-bold uppercase tracking-widest"
            style={{ gridTemplateColumns: '1fr auto auto auto', color: TEXT_DIM }}>
            <span>Sección</span><span>Estado</span><span>Editar</span><span>Activa</span>
          </div>

          <div className="space-y-1.5">
            {sections.map((sec, i) => {
              const si   = STATUS_CFG[sec.status];
              const isSelected = selected === sec.id;
              return (
                <motion.div key={sec.id}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12, delay: i * 0.03 }}
                  className="grid items-center rounded-2xl px-4 py-3 transition-all"
                  style={{
                    gridTemplateColumns: '1fr auto auto auto',
                    gap: '12px',
                    background: isSelected ? 'rgba(0,201,160,.06)' : BG,
                    border: `1px solid ${isSelected ? 'rgba(0,201,160,.25)' : BORDER}`,
                    opacity: sec.enabled ? 1 : 0.55,
                  }}>
                  {/* Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <GripVerticalIcon size={12} style={{ color: TEXT_DIM, flexShrink: 0 }} />
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: isSelected ? 'rgba(0,201,160,.12)' : '#182d47' }}>
                      <sec.icon size={13} style={{ color: isSelected ? ACCENT : TEXT_DIM }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold" style={{ color: TEXT_HI }}>{sec.label}</p>
                        {sec.required && (
                          <span className="text-[9px] font-bold rounded-full px-1.5 py-0.5"
                            style={{ background: 'rgba(91,138,240,.15)', color: '#5B8AF0' }}>Requerida</span>
                        )}
                      </div>
                      {sec.note && <p className="text-[10px] mt-0.5 truncate" style={{ color: '#F59E0B' }}>{sec.note}</p>}
                      {!sec.note && <p className="text-[10px] mt-0.5 truncate" style={{ color: TEXT_DIM }}>{sec.description}</p>}
                    </div>
                  </div>

                  {/* Estado */}
                  <si.icon size={14} style={{ color: si.color }} />

                  {/* Editar */}
                  <button onClick={() => setSelected(isSelected ? null : sec.id)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      background: isSelected ? 'rgba(0,201,160,.1)' : '#182d47',
                      color: isSelected ? ACCENT : TEXT_LO,
                      border: `1px solid ${isSelected ? 'rgba(0,201,160,.25)' : BORDER}`,
                    }}>
                    <PencilIcon size={11} />
                  </button>

                  {/* Toggle */}
                  <button onClick={() => !sec.required && toggleSection(sec.id)}
                    className="relative h-5 w-9 rounded-full transition-colors shrink-0"
                    style={{ background: sec.enabled ? ACCENT : '#1e3450', cursor: sec.required ? 'not-allowed' : 'pointer' }}
                    title={sec.required ? 'Sección requerida' : sec.enabled ? 'Desactivar' : 'Activar'}>
                    <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                      style={{ left: sec.enabled ? '1.25rem' : '0.125rem' }} />
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* SEO */}
          <button onClick={() => setSelected(selected === 'seo' ? null : 'seo')}
            className="mt-3 flex w-full items-center justify-between rounded-2xl px-5 py-3.5 transition-all"
            style={{
              background: selected === 'seo' ? 'rgba(91,138,240,.08)' : BG,
              border: `1px solid ${selected === 'seo' ? 'rgba(91,138,240,.3)' : BORDER}`,
            }}>
            <div className="flex items-center gap-3">
              <GlobeIcon size={14} style={{ color: selected === 'seo' ? '#5B8AF0' : TEXT_DIM }} />
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: TEXT_HI }}>SEO y metadatos</p>
                <p className="text-[10px]" style={{ color: TEXT_DIM }}>Título, descripción e imagen para buscadores y redes</p>
              </div>
            </div>
            <ChevronRightIcon size={13} style={{ color: TEXT_DIM, transform: selected === 'seo' ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
          </button>
        </div>

        {/* ── Panel editor lateral ─────────────────────────── */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected}
              initial={{ opacity: 0, x: 24, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 300 }}
              exit={{ opacity: 0, x: 24, width: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="shrink-0 overflow-hidden rounded-2xl"
              style={{ background: BG, border: `1px solid ${BORDER}` }}>
              <div className="p-5 h-full overflow-y-auto" style={{ maxHeight: '80vh' }}>
                {renderEditor()}
                <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <button onClick={handleSave}
                    className="w-full rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-95"
                    style={{ background: 'rgba(0,201,160,.12)', color: ACCENT, border: `1px solid rgba(0,201,160,.25)` }}>
                    Guardar sección
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
