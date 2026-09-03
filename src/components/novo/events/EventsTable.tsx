import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon, SearchIcon,
  ExternalLinkIcon,
  MapPinIcon, MonitorIcon, ZapIcon,
} from 'lucide-react';
import type { NovoEvent, NovoEventOperationalStatus } from '../../../types/novo';
import { EventStatusPill, ModalityBadge } from '../ui/StatusPill';
import { formatDate, formatCurrency } from '../../../lib/novo/events';
import { RowActions } from '../ui/RowActions';
import {
  NovoModal, ModalBtn,
  FormField, FormInput, FormSelect, FormSection, FormTextarea,
} from '../ui/NovoModal';

const FILTERS: { label: string; value: NovoEventOperationalStatus | 'todos' }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activo' },
  { label: 'Próximos', value: 'proximo' },
  { label: 'Borradores', value: 'borrador' },
  { label: 'Finalizados', value: 'finalizado' },
  { label: 'Cancelados', value: 'cancelado' },
  { label: 'Archivados', value: 'archivado' },
];

const MODALITY_ICON: Record<string, React.ElementType> = {
  presencial: MapPinIcon,
  virtual: MonitorIcon,
  hibrido: ZapIcon,
};

const MODALITY_OPTIONS = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual',    label: 'Virtual' },
  { value: 'hibrido',    label: 'Híbrido' },
];

const STATUS_OPTIONS: { value: NovoEventOperationalStatus; label: string }[] = [
  { value: 'borrador',   label: 'Borrador' },
  { value: 'proximo',    label: 'Próximo' },
  { value: 'activo',     label: 'Activo' },
  { value: 'en_curso',   label: 'En curso' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado',  label: 'Cancelado' },
];

const EMPTY_FORM = {
  name: '', modality: 'presencial', start_date: '', end_date: '',
  venue_city: '', venue_name: '', max_capacity: '', description: '',
  tagline: '', operational_status: 'borrador' as NovoEventOperationalStatus,
};

interface Props {
  events: NovoEvent[];
  onCreateEvent?: () => void;
}

export function EventsTable({ events: initialEvents }: Props) {
  const [events, setEvents] = useState<NovoEvent[]>(initialEvents);
  const [filter, setFilter] = useState<NovoEventOperationalStatus | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NovoEvent | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const f = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (ev: NovoEvent) => {
    setEditing(ev);
    setForm({
      name: ev.name,
      modality: ev.modality,
      start_date: ev.start_date,
      end_date: ev.end_date,
      venue_city: ev.venue_city ?? '',
      venue_name: ev.venue_name ?? '',
      max_capacity: String(ev.max_capacity ?? ''),
      description: ev.description ?? '',
      tagline: ev.tagline ?? '',
      operational_status: ev.operational_status,
    });
    setModalOpen(true);
    setOpenMenu(null);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (editing) {
        setEvents(prev => prev.map(e => e.id !== editing.id ? e : {
          ...e,
          name: form.name,
          modality: form.modality as NovoEvent['modality'],
          start_date: form.start_date,
          end_date: form.end_date,
          venue_city: form.venue_city || undefined,
          venue_name: form.venue_name || undefined,
          max_capacity: form.max_capacity ? Number(form.max_capacity) : undefined,
          description: form.description || undefined,
          tagline: form.tagline || undefined,
          operational_status: form.operational_status,
          updated_at: new Date().toISOString(),
        }));
      } else {
        const newEv: NovoEvent = {
          id: `ev-${Date.now()}`,
          name: form.name,
          slug,
          event_type: 'congreso',
          modality: form.modality as NovoEvent['modality'],
          audience: 'medicos',
          start_date: form.start_date || new Date().toISOString(),
          end_date: form.end_date || new Date().toISOString(),
          timezone: 'America/Bogota',
          venue_city: form.venue_city || undefined,
          venue_name: form.venue_name || undefined,
          max_capacity: form.max_capacity ? Number(form.max_capacity) : undefined,
          description: form.description || undefined,
          tagline: form.tagline || undefined,
          is_public: false,
          is_free: false,
          has_certificate: false,
          is_featured: false,
          operational_status: form.operational_status,
          publication_status: 'borrador',
          registrations_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setEvents(prev => [newEv, ...prev]);
      }
      setModalOpen(false);
    }, 700);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este evento? Esta acción no se puede deshacer.')) return;
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const filtered = events.filter((e) => {
    const matchFilter = filter === 'todos' || e.operational_status === filter;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.venue_city ?? '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

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
          <PlusIcon size={16} strokeWidth={2.5} />
          Crear evento
        </button>
      </div>

      {/* Controles */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex items-center"
          style={{ background: '#112035', border: '1px solid #1e3450', borderRadius: 12 }}>
          <SearchIcon size={14} className="absolute left-3" style={{ color: '#3A5470' }} />
          <input type="text" placeholder="Buscar evento..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent pl-9 pr-4 py-2 text-sm outline-none w-52"
            style={{ color: '#E1EAF4' }} />
        </div>

        <div className="flex items-center gap-0.5 p-1 rounded-xl"
          style={{ background: '#112035', border: '1px solid #1e3450' }}>
          {FILTERS.map((f) => (
            <button key={f.value} type="button" onClick={() => setFilter(f.value)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
              style={{
                background: filter === f.value ? '#1e3450' : 'transparent',
                color: filter === f.value ? '#E1EAF4' : '#3A5470',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid #1e3450', background: '#112035' }}>
        <div className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-3"
          style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', color: '#3A5470', borderBottom: '1px solid #1a2e45' }}>
          <span>Evento</span>
          <span>Modalidad</span>
          <span>Fecha</span>
          <span>Registros</span>
          <span>Ingresos</span>
          <span>Estado</span>
          <span />
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: '#3A5470' }}>
            <p className="text-sm">Sin resultados para esta búsqueda</p>
          </div>
        )}
        {filtered.map((event, i) => {
          const ModalIcon = MODALITY_ICON[event.modality] ?? MapPinIcon;
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
                background: 'transparent',
              }}
              onMouseEnter={(el) => (el.currentTarget.style.background = '#182d47')}
              onMouseLeave={(el) => (el.currentTarget.style.background = 'transparent')}
            >
              {/* Nombre */}
              <div className="flex items-center gap-3 min-w-0 pr-4">
                {event.cover_image_url ? (
                  <img src={event.cover_image_url} alt=""
                    className="h-9 w-14 rounded-lg object-cover shrink-0"
                    style={{ border: '1px solid #1e3450' }} />
                ) : (
                  <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg text-lg"
                    style={{ background: '#182d47', border: '1px solid #1e3450' }}>
                    🏥
                  </div>
                )}
                <div className="min-w-0">
                  <Link to={`/novo/eventos/${event.id}`}
                    className="block truncate text-sm font-semibold transition-colors duration-100 hover:text-[#00C9A0]"
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
                <p className="text-sm tabular-nums" style={{ color: '#7A9CB8' }}>
                  {formatDate(event.start_date)}
                </p>
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

              {/* Acciones */}
              <div className="relative flex items-center gap-1 pl-2" onClick={e => e.stopPropagation()}>
                <Link to={`/eventos/${event.slug}`} target="_blank"
                  className="flex h-7 w-7 items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: '#3A5470', background: '#182d47' }}
                  title="Ver sitio público">
                  <ExternalLinkIcon size={13} />
                </Link>
                <RowActions
                  onEdit={() => openEdit(event)}
                  onDelete={() => handleDelete(event.id)}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ═══ MODAL ══════════════════════════════════════════════════════════ */}
      <NovoModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar evento' : 'Nuevo evento'}
        subtitle={editing ? `Editando: ${editing.name}` : 'Crear un nuevo evento en la plataforma'}
        width={640}
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
          <FormSection title="Información general">
            <FormField label="Nombre del evento" required>
              <FormInput value={form.name} onChange={f('name')} placeholder="Congreso Nacional de Endocrinología 2027" />
            </FormField>
            <FormField label="Tagline / Subtítulo">
              <FormInput value={form.tagline} onChange={f('tagline')} placeholder="La cumbre anual de la medicina hormonal" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Modalidad">
                <FormSelect value={form.modality} onChange={f('modality')} options={MODALITY_OPTIONS} />
              </FormField>
              <FormField label="Estado operacional">
                <FormSelect value={form.operational_status}
                  onChange={v => setForm(p => ({ ...p, operational_status: v as NovoEventOperationalStatus }))}
                  options={STATUS_OPTIONS} />
              </FormField>
            </div>
            <FormField label="Descripción">
              <FormTextarea value={form.description} onChange={f('description')}
                placeholder="Breve descripción del evento…" rows={2} />
            </FormField>
          </FormSection>
          <FormSection title="Fechas y lugar">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Fecha de inicio">
                <FormInput type="date" value={form.start_date} onChange={f('start_date')} />
              </FormField>
              <FormField label="Fecha de cierre">
                <FormInput type="date" value={form.end_date} onChange={f('end_date')} />
              </FormField>
              <FormField label="Ciudad">
                <FormInput value={form.venue_city} onChange={f('venue_city')} placeholder="Medellín" />
              </FormField>
              <FormField label="Sede / Venue">
                <FormInput value={form.venue_name} onChange={f('venue_name')} placeholder="Centro de Convenciones…" />
              </FormField>
            </div>
            <FormField label="Aforo máximo">
              <FormInput type="number" value={form.max_capacity} onChange={f('max_capacity')} placeholder="500" />
            </FormField>
          </FormSection>
        </div>
      </NovoModal>
    </div>
  );
}
