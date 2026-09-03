import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon, SearchIcon, ExternalLinkIcon,
  MapPinIcon, MonitorIcon, ZapIcon,
} from 'lucide-react';
import type { NovoEvent, NovoEventOperationalStatus, NovoEventType, NovoEventModality, NovoEventAudience } from '../../../types/novo';
import { EventStatusPill, ModalityBadge } from '../ui/StatusPill';
import { formatDate, formatCurrency } from '../../../lib/novo/events';
import { RowActions } from '../ui/RowActions';
import {
  NovoModal, ModalBtn,
  FormField, FormInput, FormSelect, FormSection, FormTextarea,
} from '../ui/NovoModal';

/* ── Opciones de selects ──────────────────────────────────── */
const FILTERS: { label: string; value: NovoEventOperationalStatus | 'todos' }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Próximos', value: 'proximo' },
  { label: 'Activos', value: 'activo' },
  { label: 'Borradores', value: 'borrador' },
  { label: 'Finalizados', value: 'finalizado' },
  { label: 'Cancelados', value: 'cancelado' },
  { label: 'Archivados', value: 'archivado' },
];

const MODALITY_ICON: Record<string, React.ElementType> = {
  presencial: MapPinIcon,
  virtual:    MonitorIcon,
  hibrido:    ZapIcon,
};

const MODALITY_OPTS = [
  { value: 'presencial', label: '📍 Presencial' },
  { value: 'virtual',    label: '💻 Virtual' },
  { value: 'hibrido',    label: '⚡ Híbrido' },
];

const TYPE_OPTS: { value: NovoEventType; label: string }[] = [
  { value: 'congreso',      label: 'Congreso' },
  { value: 'simposio',      label: 'Simposio' },
  { value: 'curso',         label: 'Curso / Taller' },
  { value: 'masterclass',   label: 'Masterclass' },
  { value: 'webinar',       label: 'Webinar' },
  { value: 'conversatorio', label: 'Conversatorio' },
  { value: 'lanzamiento',   label: 'Lanzamiento' },
  { value: 'otro',          label: 'Otro' },
];

const AUDIENCE_OPTS: { value: NovoEventAudience; label: string }[] = [
  { value: 'profesionales', label: 'Profesionales de la salud' },
  { value: 'pacientes',     label: 'Pacientes' },
  { value: 'ambos',         label: 'Profesionales y pacientes' },
  { value: 'general',       label: 'Público general' },
];

const STATUS_OPTS: { value: NovoEventOperationalStatus; label: string }[] = [
  { value: 'borrador',   label: 'Borrador' },
  { value: 'proximo',    label: 'Próximo' },
  { value: 'activo',     label: 'Activo' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado',  label: 'Cancelado' },
];

/* ── Formulario vacío ──────────────────────────────────────── */
const EMPTY_FORM = {
  /* Identidad */
  name: '', tagline: '', description: '',
  event_type: 'congreso' as NovoEventType,
  modality: 'presencial' as NovoEventModality,
  audience: 'profesionales' as NovoEventAudience,
  operational_status: 'borrador' as NovoEventOperationalStatus,
  is_public: 'false', is_free: 'false', is_featured: 'false',
  /* Fechas */
  start_date: '', end_date: '', start_time: '', end_time: '',
  /* Presencial */
  venue_name: '', venue_city: '', venue_address: '', venue_country: 'Colombia',
  /* Virtual */
  platform_name: '', platform_url: '',
  /* Capacidad y certificado */
  max_capacity: '', has_certificate: 'false', certificate_send_at: '',
  /* Contratante */
  contracting_company: '',
  /* Identidad visual */
  cover_image_url: '', logo_url: '', primary_color: '#00C9A0', accent_color: '#5B8AF0',
};

type Form = typeof EMPTY_FORM;

/* ── Props ─────────────────────────────────────────────────── */
interface Props {
  events: NovoEvent[];
  onCreateEvent?: () => void;
}

export function EventsTable({ events: initialEvents }: Props) {
  const [events, setEvents] = useState<NovoEvent[]>(initialEvents);
  const [filter, setFilter] = useState<NovoEventOperationalStatus | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NovoEvent | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (initialEvents.length > 0) setEvents(initialEvents);
  }, [initialEvents]);

  const f = (k: keyof Form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };

  const openEdit = (ev: NovoEvent) => {
    setEditing(ev);
    setForm({
      name: ev.name, tagline: ev.tagline ?? '', description: ev.description ?? '',
      event_type: ev.event_type, modality: ev.modality,
      audience: ev.audience ?? 'profesionales',
      operational_status: ev.operational_status,
      is_public: String(ev.is_public), is_free: String(ev.is_free), is_featured: String(ev.is_featured),
      start_date: ev.start_date?.split('T')[0] ?? '',
      end_date: ev.end_date?.split('T')[0] ?? '',
      start_time: ev.start_time ?? '', end_time: ev.end_time ?? '',
      venue_name: ev.venue_name ?? '', venue_city: ev.venue_city ?? '',
      venue_address: ev.venue_address ?? '', venue_country: ev.venue_country ?? 'Colombia',
      platform_name: ev.platform_name ?? '', platform_url: ev.platform_url ?? '',
      max_capacity: String(ev.max_capacity ?? ''),
      has_certificate: String(ev.has_certificate),
      certificate_send_at: ev.certificate_send_at?.split('T')[0] ?? '',
      contracting_company: ev.contracting_company?.name ?? '',
      cover_image_url: ev.cover_image_url ?? '', logo_url: ev.logo_url ?? '',
      primary_color: ev.primary_color ?? '#00C9A0', accent_color: ev.accent_color ?? '#5B8AF0',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (editing) {
        setEvents(prev => prev.map(e => e.id !== editing.id ? e : {
          ...e,
          name: form.name, tagline: form.tagline || undefined,
          description: form.description || undefined,
          event_type: form.event_type, modality: form.modality,
          audience: form.audience, operational_status: form.operational_status,
          is_public: form.is_public === 'true', is_free: form.is_free === 'true',
          is_featured: form.is_featured === 'true',
          start_date: form.start_date, end_date: form.end_date,
          start_time: form.start_time || undefined, end_time: form.end_time || undefined,
          venue_name: form.venue_name || undefined, venue_city: form.venue_city || undefined,
          venue_address: form.venue_address || undefined, venue_country: form.venue_country || undefined,
          platform_name: form.platform_name || undefined, platform_url: form.platform_url || undefined,
          max_capacity: form.max_capacity ? Number(form.max_capacity) : undefined,
          has_certificate: form.has_certificate === 'true',
          certificate_send_at: form.certificate_send_at || undefined,
          cover_image_url: form.cover_image_url || undefined, logo_url: form.logo_url || undefined,
          primary_color: form.primary_color || undefined, accent_color: form.accent_color || undefined,
          updated_at: new Date().toISOString(),
        }));
      } else {
        const newEv: NovoEvent = {
          id: `ev-${Date.now()}`, slug,
          name: form.name, tagline: form.tagline || undefined,
          description: form.description || undefined,
          event_type: form.event_type, modality: form.modality,
          audience: form.audience, operational_status: form.operational_status,
          publication_status: 'borrador',
          is_public: form.is_public === 'true', is_free: form.is_free === 'true',
          is_featured: form.is_featured === 'true',
          start_date: form.start_date || new Date().toISOString(),
          end_date: form.end_date || new Date().toISOString(),
          start_time: form.start_time || undefined, end_time: form.end_time || undefined,
          timezone: 'America/Bogota',
          venue_name: form.venue_name || undefined, venue_city: form.venue_city || undefined,
          venue_address: form.venue_address || undefined, venue_country: form.venue_country || undefined,
          platform_name: form.platform_name || undefined, platform_url: form.platform_url || undefined,
          max_capacity: form.max_capacity ? Number(form.max_capacity) : undefined,
          has_certificate: form.has_certificate === 'true',
          certificate_send_at: form.certificate_send_at || undefined,
          cover_image_url: form.cover_image_url || undefined, logo_url: form.logo_url || undefined,
          primary_color: form.primary_color || undefined, accent_color: form.accent_color || undefined,
          registrations_count: 0,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        };
        setEvents(prev => [newEv, ...prev]);
      }
      setModalOpen(false);
    }, 700);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este evento?')) return;
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const filtered = events.filter(e => {
    const matchFilter = filter === 'todos' || e.operational_status === filter;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.venue_city ?? '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  /* ── Sección condicional por modalidad ─────────────────── */
  const isPresencial = form.modality === 'presencial' || form.modality === 'hibrido';
  const isVirtual    = form.modality === 'virtual'    || form.modality === 'hibrido';

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', 'Inter', sans-serif" }}>
            Mis Eventos
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#7A9CB8' }}>
            {events.length} eventos · motor universal
          </p>
        </div>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}>
          <PlusIcon size={16} strokeWidth={2.5} /> Crear evento
        </button>
      </div>

      {/* Controles */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex items-center"
          style={{ background: '#112035', border: '1px solid #1e3450', borderRadius: 12 }}>
          <SearchIcon size={14} className="absolute left-3" style={{ color: '#3A5470' }} />
          <input type="text" placeholder="Buscar evento..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent pl-9 pr-4 py-2 text-sm outline-none w-52"
            style={{ color: '#E1EAF4' }} />
        </div>
        <div className="flex items-center gap-0.5 p-1 rounded-xl"
          style={{ background: '#112035', border: '1px solid #1e3450' }}>
          {FILTERS.map(fil => (
            <button key={fil.value} type="button" onClick={() => setFilter(fil.value)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
              style={{
                background: filter === fil.value ? '#1e3450' : 'transparent',
                color: filter === fil.value ? '#E1EAF4' : '#3A5470',
              }}>
              {fil.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid #1e3450', background: '#112035' }}>
        <div className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-3"
          style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', color: '#3A5470', borderBottom: '1px solid #1a2e45' }}>
          <span>Evento</span><span>Modalidad</span><span>Fecha</span>
          <span>Registros</span><span>Ingresos</span><span>Estado</span><span />
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: '#3A5470' }}>
            <p className="text-sm">Sin resultados para esta búsqueda</p>
          </div>
        )}

        {filtered.map((event, i) => {
          const regProgress = event.max_capacity && event.registrations_count
            ? (event.registrations_count / event.max_capacity) * 100 : undefined;
          return (
            <motion.div key={event.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1], delay: i * 0.04 }}
              className="group relative grid items-center px-5 py-4 transition-colors duration-150"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto',
                borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none',
              }}
              onMouseEnter={el => (el.currentTarget.style.background = '#182d47')}
              onMouseLeave={el => (el.currentTarget.style.background = 'transparent')}
            >
              <div className="flex items-center gap-3 min-w-0 pr-4">
                {event.cover_image_url ? (
                  <img src={event.cover_image_url} alt="" className="h-9 w-14 rounded-lg object-cover shrink-0"
                    style={{ border: '1px solid #1e3450' }} />
                ) : (
                  <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg text-lg"
                    style={{ background: '#182d47', border: '1px solid #1e3450' }}>🏥</div>
                )}
                <div className="min-w-0">
                  <Link to={`/novo/eventos/${event.id}`}
                    className="block truncate text-sm font-semibold transition-colors hover:text-[#00C9A0]"
                    style={{ color: '#E1EAF4' }}>
                    {event.name}
                  </Link>
                  <p className="truncate text-xs mt-0.5" style={{ color: '#3A5470' }}>
                    {event.venue_city ?? event.platform_name ?? 'Sin ubicación'}
                    {event.contracting_company && ` · ${event.contracting_company.name}`}
                  </p>
                </div>
              </div>
              <div><ModalityBadge modality={event.modality} /></div>
              <div>
                <p className="text-sm tabular-nums" style={{ color: '#7A9CB8' }}>{formatDate(event.start_date)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold tabular-nums" style={{ color: '#E1EAF4' }}>
                  {(event.registrations_count ?? 0).toLocaleString('es-CO')}
                </p>
                {regProgress !== undefined && (
                  <div className="mt-1.5 h-1 w-16 overflow-hidden rounded-full" style={{ background: '#1e3450' }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${Math.min(regProgress, 100)}%`, background: '#00C9A0' }} />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold tabular-nums" style={{ color: '#E1EAF4' }}>
                  {event.revenue ? formatCurrency(event.revenue) : '—'}
                </p>
              </div>
              <div><EventStatusPill status={event.operational_status} /></div>
              <div className="flex items-center gap-1 pl-2" onClick={e => e.stopPropagation()}>
                <Link to={`/eventos/${event.slug}`} target="_blank"
                  className="flex h-7 w-7 items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: '#3A5470', background: '#182d47' }} title="Ver sitio público">
                  <ExternalLinkIcon size={13} />
                </Link>
                <RowActions onEdit={() => openEdit(event)} onDelete={() => handleDelete(event.id)} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ═══ MODAL crear / editar evento ════════════════════════════════════ */}
      <NovoModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar evento' : 'Nuevo evento'}
        subtitle={editing ? editing.name : 'Configura todos los detalles antes de publicar'}
        width={680}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={handleSave} disabled={saving || !form.name}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear evento'}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-5">

          {/* ── 1. Identidad ── */}
          <FormSection title="Identidad del evento">
            <FormField label="Nombre del evento" required>
              <FormInput value={form.name} onChange={f('name')}
                placeholder="Congreso Nacional de Endocrinología 2027" />
            </FormField>
            <FormField label="Tagline · subtítulo">
              <FormInput value={form.tagline} onChange={f('tagline')}
                placeholder="Una línea que resume el espíritu del evento" />
            </FormField>
            <FormField label="Descripción pública">
              <FormTextarea value={form.description} onChange={f('description')}
                placeholder="¿De qué trata el evento? ¿A quién va dirigido?" rows={2} />
            </FormField>
          </FormSection>

          {/* ── 2. Tipo, modalidad, audiencia ── */}
          <FormSection title="Clasificación">
            {/* Selector de modalidad visual */}
            <FormField label="Modalidad" required>
              <div className="grid grid-cols-3 gap-2">
                {MODALITY_OPTS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setForm(p => ({ ...p, modality: opt.value as NovoEventModality }))}
                    className="rounded-xl py-2.5 text-xs font-semibold transition-all"
                    style={{
                      background: form.modality === opt.value ? 'rgba(0,201,160,.12)' : '#0d1829',
                      border: form.modality === opt.value ? '1.5px solid rgba(0,201,160,.4)' : '1px solid #1e3450',
                      color: form.modality === opt.value ? '#00C9A0' : '#7A9CB8',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Tipo de evento">
                <FormSelect value={form.event_type}
                  onChange={v => setForm(p => ({ ...p, event_type: v as NovoEventType }))}
                  options={TYPE_OPTS} />
              </FormField>
              <FormField label="Audiencia">
                <FormSelect value={form.audience}
                  onChange={v => setForm(p => ({ ...p, audience: v as NovoEventAudience }))}
                  options={AUDIENCE_OPTS} />
              </FormField>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Estado operacional">
                <FormSelect value={form.operational_status}
                  onChange={v => setForm(p => ({ ...p, operational_status: v as NovoEventOperationalStatus }))}
                  options={STATUS_OPTS} />
              </FormField>
              <FormField label="Visibilidad">
                <FormSelect value={form.is_public} onChange={f('is_public')}
                  options={[{ value: 'false', label: 'Privado' }, { value: 'true', label: 'Público' }]} />
              </FormField>
              <FormField label="Precio">
                <FormSelect value={form.is_free} onChange={f('is_free')}
                  options={[{ value: 'false', label: 'Con costo' }, { value: 'true', label: 'Gratuito' }]} />
              </FormField>
            </div>
          </FormSection>

          {/* ── 3. Fechas ── */}
          <FormSection title="Fechas y horarios">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Fecha de inicio" required>
                <FormInput type="date" value={form.start_date} onChange={f('start_date')} />
              </FormField>
              <FormField label="Fecha de cierre" required>
                <FormInput type="date" value={form.end_date} onChange={f('end_date')} />
              </FormField>
              <FormField label="Hora inicio">
                <FormInput type="time" value={form.start_time} onChange={f('start_time')} />
              </FormField>
              <FormField label="Hora fin">
                <FormInput type="time" value={form.end_time} onChange={f('end_time')} />
              </FormField>
            </div>
          </FormSection>

          {/* ── 4. Lugar presencial (condicional) ── */}
          {isPresencial && (
            <FormSection title="Lugar físico">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nombre del recinto / sede">
                  <FormInput value={form.venue_name} onChange={f('venue_name')}
                    placeholder="Centro de Convenciones, Hotel…" />
                </FormField>
                <FormField label="Ciudad">
                  <FormInput value={form.venue_city} onChange={f('venue_city')} placeholder="Medellín" />
                </FormField>
                <FormField label="Dirección">
                  <FormInput value={form.venue_address} onChange={f('venue_address')}
                    placeholder="Calle 10 # 32-15" />
                </FormField>
                <FormField label="País">
                  <FormInput value={form.venue_country} onChange={f('venue_country')} placeholder="Colombia" />
                </FormField>
              </div>
            </FormSection>
          )}

          {/* ── 5. Plataforma virtual (condicional) ── */}
          {isVirtual && (
            <FormSection title="Plataforma virtual">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nombre de la plataforma">
                  <FormInput value={form.platform_name} onChange={f('platform_name')}
                    placeholder="Zoom, Hopin, Teams, YouTube Live…" />
                </FormField>
                <FormField label="URL de acceso">
                  <FormInput value={form.platform_url} onChange={f('platform_url')}
                    placeholder="https://zoom.us/j/..." />
                </FormField>
              </div>
            </FormSection>
          )}

          {/* ── 6. Capacidad, contratante, certificado ── */}
          <FormSection title="Detalles operacionales">
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Aforo máximo">
                <FormInput type="number" value={form.max_capacity} onChange={f('max_capacity')}
                  placeholder="500" />
              </FormField>
              <FormField label="Empresa contratante">
                <FormInput value={form.contracting_company} onChange={f('contracting_company')}
                  placeholder="EML, clínica, institución…" />
              </FormField>
              <FormField label="Certificado">
                <FormSelect value={form.has_certificate} onChange={f('has_certificate')}
                  options={[{ value: 'false', label: 'Sin certificado' }, { value: 'true', label: 'Con certificado' }]} />
              </FormField>
            </div>
            {form.has_certificate === 'true' && (
              <FormField label="Fecha de envío del certificado">
                <FormInput type="date" value={form.certificate_send_at} onChange={f('certificate_send_at')} />
              </FormField>
            )}
          </FormSection>

          {/* ── 7. Identidad visual ── */}
          <FormSection title="Identidad visual">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="URL imagen de portada">
                <FormInput value={form.cover_image_url} onChange={f('cover_image_url')}
                  placeholder="https://..." />
              </FormField>
              <FormField label="URL logo del evento">
                <FormInput value={form.logo_url} onChange={f('logo_url')} placeholder="https://..." />
              </FormField>
              <FormField label="Color primario">
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.primary_color}
                    onChange={e => f('primary_color')(e.target.value)}
                    className="h-10 w-14 rounded-lg cursor-pointer"
                    style={{ background: 'transparent', border: '1px solid #1e3450', padding: 2 }} />
                  <FormInput value={form.primary_color} onChange={f('primary_color')} placeholder="#00C9A0" />
                </div>
              </FormField>
              <FormField label="Color acento">
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.accent_color}
                    onChange={e => f('accent_color')(e.target.value)}
                    className="h-10 w-14 rounded-lg cursor-pointer"
                    style={{ background: 'transparent', border: '1px solid #1e3450', padding: 2 }} />
                  <FormInput value={form.accent_color} onChange={f('accent_color')} placeholder="#5B8AF0" />
                </div>
              </FormField>
            </div>
          </FormSection>

        </div>
      </NovoModal>
    </div>
  );
}
