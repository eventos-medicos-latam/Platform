import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SaveIcon, MapPinIcon, MonitorIcon, ZapIcon,
  CalendarIcon, BuildingIcon, GlobeIcon, PaletteIcon,
  ShieldCheckIcon, UsersIcon, InfoIcon,
} from 'lucide-react';
import type { NovoEvent, NovoEventType, NovoEventModality, NovoEventAudience, NovoEventOperationalStatus } from '../../../types/novo';

interface EventContext { event: NovoEvent }

/* ── Paleta de la página ──────────────────────────────────── */
const BG      = '#112035';
const BG_DEEP = '#0d1829';
const BORDER  = '#1e3450';
const ACCENT  = '#00C9A0';
const TEXT_HI = '#E1EAF4';
const TEXT_LO = '#7A9CB8';
const TEXT_DIM = '#3A5470';

/* ── Primitivos de campo ──────────────────────────────────── */
function SectionCard({ icon: Icon, title, children }: { icon?: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl p-5 space-y-4" style={{ background: BG, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon size={14} style={{ color: TEXT_LO }} />}
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: TEXT_HI }}>{title}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_DIM }}>{label}</p>
        {hint && <p className="text-[10px]" style={{ color: TEXT_DIM }}>{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type}
      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors"
      style={{ background: BG_DEEP, border: `1px solid ${BORDER}`, color: TEXT_HI }}
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      onFocus={e => (e.currentTarget.style.borderColor = `${ACCENT}50`)}
      onBlur={e  => (e.currentTarget.style.borderColor = BORDER)}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea rows={rows}
      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors resize-none"
      style={{ background: BG_DEEP, border: `1px solid ${BORDER}`, color: TEXT_HI }}
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      onFocus={e => (e.currentTarget.style.borderColor = `${ACCENT}50`)}
      onBlur={e  => (e.currentTarget.style.borderColor = BORDER)}
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
      style={{ background: BG_DEEP, border: `1px solid ${BORDER}`, color: TEXT_HI }}
      value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full rounded-xl px-4 py-3 transition-all"
      style={{ background: value ? 'rgba(0,201,160,.08)' : BG_DEEP, border: `1px solid ${value ? 'rgba(0,201,160,.25)' : BORDER}` }}>
      <span className="text-sm font-medium" style={{ color: value ? ACCENT : TEXT_LO }}>{label}</span>
      <div className="relative h-5 w-9 rounded-full transition-colors"
        style={{ background: value ? ACCENT : '#1e3450' }}>
        <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
          style={{ left: value ? '1.25rem' : '0.125rem' }} />
      </div>
    </button>
  );
}

/* ── Opciones ─────────────────────────────────────────────── */
const TYPE_OPTS:     { value: NovoEventType;     label: string }[] = [
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
const STATUS_OPTS:   { value: NovoEventOperationalStatus; label: string }[] = [
  { value: 'borrador',   label: 'Borrador' },
  { value: 'proximo',    label: 'Próximo' },
  { value: 'activo',     label: 'Activo' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado',  label: 'Cancelado' },
];

const MODALITY_OPTIONS: { value: NovoEventModality; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'presencial', label: 'Presencial', icon: MapPinIcon,  desc: 'En un lugar físico' },
  { value: 'virtual',    label: 'Virtual',    icon: MonitorIcon, desc: 'Plataforma en línea' },
  { value: 'hibrido',    label: 'Híbrido',    icon: ZapIcon,     desc: 'Físico + en línea' },
];

/* ══════════════════════════════════════════════════════════ */
export function NovoEventInformacion() {
  const { event } = useOutletContext<EventContext>();

  const [form, setForm] = useState({
    name:              event.name,
    tagline:           event.tagline ?? '',
    description:       event.description ?? '',
    event_type:        event.event_type ?? 'congreso',
    modality:          event.modality ?? 'presencial',
    audience:          event.audience ?? 'profesionales',
    operational_status: event.operational_status ?? 'proximo',
    is_public:         event.is_public ?? false,
    is_free:           event.is_free ?? false,
    is_featured:       event.is_featured ?? false,
    /* Fechas */
    start_date:        event.start_date?.split('T')[0] ?? '',
    end_date:          event.end_date?.split('T')[0] ?? '',
    start_time:        event.start_time ?? '',
    end_time:          event.end_time ?? '',
    /* Presencial */
    venue_name:        event.venue_name ?? '',
    venue_city:        event.venue_city ?? '',
    venue_address:     event.venue_address ?? '',
    venue_country:     event.venue_country ?? 'Colombia',
    /* Virtual */
    platform_name:     event.platform_name ?? '',
    platform_url:      event.platform_url ?? '',
    /* Operacional */
    max_capacity:      String(event.max_capacity ?? ''),
    contracting_company: event.contracting_company?.name ?? '',
    has_certificate:   event.has_certificate ?? false,
    certificate_send_at: event.certificate_send_at?.split('T')[0] ?? '',
    /* Identidad visual */
    cover_image_url:   event.cover_image_url ?? '',
    logo_url:          event.logo_url ?? '',
    primary_color:     event.primary_color ?? '#00C9A0',
    accent_color:      event.accent_color ?? '#5B8AF0',
  });

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const f   = (k: keyof typeof form) => (v: string)  => setForm(p => ({ ...p, [k]: v }));
  const fBool = (k: keyof typeof form) => (v: boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }, 900);
  };

  const isPresencial = form.modality === 'presencial' || form.modality === 'hibrido';
  const isVirtual    = form.modality === 'virtual'    || form.modality === 'hibrido';

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: TEXT_HI, fontFamily: "'Sora', sans-serif" }}>Información del Evento</h1>
          <p className="text-sm mt-0.5" style={{ color: TEXT_LO }}>Datos base · lugar · fechas · identidad visual</p>
        </div>
        <motion.button whileTap={{ scale: 0.96 }} onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
          style={{
            background: saved ? 'rgba(0,201,160,.18)' : 'rgba(0,201,160,.12)',
            color: ACCENT, border: `1px solid rgba(0,201,160,.3)`,
          }}>
          <SaveIcon size={14} />
          {saving ? 'Guardando…' : saved ? '¡Guardado!' : 'Guardar cambios'}
        </motion.button>
      </div>

      <div className="grid grid-cols-3 gap-5">

        {/* ── Columna principal (2/3) ─────────────────────── */}
        <div className="col-span-2 space-y-5">

          {/* 1. Identidad */}
          <SectionCard icon={InfoIcon} title="Identidad">
            <Field label="Nombre del evento">
              <TextInput value={form.name} onChange={f('name')} />
            </Field>
            <Field label="Tagline · subtítulo">
              <TextInput value={form.tagline} onChange={f('tagline')}
                placeholder="Una línea que resume el espíritu del evento" />
            </Field>
            <Field label="Descripción pública">
              <Textarea value={form.description} onChange={f('description')}
                placeholder="¿De qué trata? ¿A quién va dirigido?" rows={3} />
            </Field>
          </SectionCard>

          {/* 2. Tipo, modalidad, audiencia */}
          <SectionCard icon={UsersIcon} title="Clasificación">
            {/* Selector de modalidad visual */}
            <Field label="Modalidad del evento">
              <div className="grid grid-cols-3 gap-2">
                {MODALITY_OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setForm(p => ({ ...p, modality: opt.value }))}
                    className="flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-semibold transition-all"
                    style={{
                      background: form.modality === opt.value ? 'rgba(0,201,160,.1)' : BG_DEEP,
                      border: form.modality === opt.value ? `1.5px solid rgba(0,201,160,.4)` : `1px solid ${BORDER}`,
                      color: form.modality === opt.value ? ACCENT : TEXT_LO,
                    }}>
                    <opt.icon size={16} style={{ color: form.modality === opt.value ? ACCENT : TEXT_DIM }} />
                    <span>{opt.label}</span>
                    <span className="text-[9px] font-normal" style={{ color: TEXT_DIM }}>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo de evento">
                <Select value={form.event_type} onChange={f('event_type')} options={TYPE_OPTS} />
              </Field>
              <Field label="Audiencia">
                <Select value={form.audience} onChange={f('audience')} options={AUDIENCE_OPTS} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Toggle label="Evento público" value={form.is_public} onChange={fBool('is_public')} />
              <Toggle label="Gratuito" value={form.is_free} onChange={fBool('is_free')} />
              <Toggle label="Evento destacado" value={form.is_featured} onChange={fBool('is_featured')} />
            </div>
          </SectionCard>

          {/* 3. Fechas */}
          <SectionCard icon={CalendarIcon} title="Fechas y horarios">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fecha de inicio">
                <TextInput type="date" value={form.start_date} onChange={f('start_date')} />
              </Field>
              <Field label="Fecha de cierre">
                <TextInput type="date" value={form.end_date} onChange={f('end_date')} />
              </Field>
              <Field label="Hora de inicio">
                <TextInput type="time" value={form.start_time} onChange={f('start_time')} />
              </Field>
              <Field label="Hora de cierre">
                <TextInput type="time" value={form.end_time} onChange={f('end_time')} />
              </Field>
            </div>
          </SectionCard>

          {/* 4. Lugar físico (presencial / híbrido) */}
          <AnimatePresence>
            {isPresencial && (
              <motion.div key="venue"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                <SectionCard icon={MapPinIcon} title="Lugar físico">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Nombre del recinto / sede">
                      <TextInput value={form.venue_name} onChange={f('venue_name')}
                        placeholder="Centro de Convenciones, Hotel…" />
                    </Field>
                    <Field label="Ciudad">
                      <TextInput value={form.venue_city} onChange={f('venue_city')} placeholder="Medellín" />
                    </Field>
                    <Field label="Dirección">
                      <TextInput value={form.venue_address} onChange={f('venue_address')} placeholder="Calle 10 # 32-15" />
                    </Field>
                    <Field label="País">
                      <TextInput value={form.venue_country} onChange={f('venue_country')} placeholder="Colombia" />
                    </Field>
                  </div>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 5. Plataforma virtual (virtual / híbrido) */}
          <AnimatePresence>
            {isVirtual && (
              <motion.div key="platform"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                <SectionCard icon={MonitorIcon} title="Plataforma virtual">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Nombre de la plataforma">
                      <TextInput value={form.platform_name} onChange={f('platform_name')}
                        placeholder="Zoom, Hopin, Teams, YouTube Live…" />
                    </Field>
                    <Field label="URL de acceso">
                      <TextInput value={form.platform_url} onChange={f('platform_url')} placeholder="https://zoom.us/j/..." />
                    </Field>
                  </div>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 6. Identidad visual */}
          <SectionCard icon={PaletteIcon} title="Identidad visual">
            <div className="grid grid-cols-2 gap-4">
              <Field label="URL imagen de portada">
                <TextInput value={form.cover_image_url} onChange={f('cover_image_url')} placeholder="https://..." />
              </Field>
              <Field label="URL logo del evento">
                <TextInput value={form.logo_url} onChange={f('logo_url')} placeholder="https://..." />
              </Field>
              <Field label="Color primario">
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.primary_color}
                    onChange={e => f('primary_color')(e.target.value)}
                    className="h-10 w-14 rounded-xl cursor-pointer shrink-0"
                    style={{ background: 'transparent', border: `1px solid ${BORDER}`, padding: 3 }} />
                  <TextInput value={form.primary_color} onChange={f('primary_color')} />
                </div>
              </Field>
              <Field label="Color acento">
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.accent_color}
                    onChange={e => f('accent_color')(e.target.value)}
                    className="h-10 w-14 rounded-xl cursor-pointer shrink-0"
                    style={{ background: 'transparent', border: `1px solid ${BORDER}`, padding: 3 }} />
                  <TextInput value={form.accent_color} onChange={f('accent_color')} />
                </div>
              </Field>
            </div>
            {/* Preview de colores */}
            <div className="flex gap-3 mt-1">
              <div className="flex-1 h-8 rounded-lg" style={{ background: form.primary_color }} />
              <div className="flex-1 h-8 rounded-lg" style={{ background: form.accent_color }} />
            </div>
          </SectionCard>

        </div>

        {/* ── Columna lateral (1/3) ───────────────────────── */}
        <div className="space-y-4">

          {/* Estado operacional */}
          <SectionCard icon={InfoIcon} title="Estado">
            <Select value={form.operational_status}
              onChange={v => setForm(p => ({ ...p, operational_status: v as NovoEventOperationalStatus }))}
              options={STATUS_OPTS} />
            <p className="text-[10px] mt-2" style={{ color: TEXT_DIM }}>
              El estado controla la visibilidad y acciones disponibles en el evento.
            </p>
          </SectionCard>

          {/* Capacidad */}
          <SectionCard icon={UsersIcon} title="Capacidad">
            <Field label="Aforo máximo">
              <TextInput type="number" value={form.max_capacity} onChange={f('max_capacity')} placeholder="500" />
            </Field>
            <div className="rounded-xl p-3.5" style={{ background: BG_DEEP, border: `1px solid ${BORDER}` }}>
              <p className="text-[10px]" style={{ color: TEXT_DIM }}>Inscritos actuales</p>
              <p className="text-2xl font-bold tabular-nums mt-0.5" style={{ color: TEXT_HI }}>
                {event.registrations_count ?? 0}
              </p>
              {form.max_capacity && Number(form.max_capacity) > 0 && (
                <>
                  <div className="mt-2 h-1.5 w-full rounded-full overflow-hidden" style={{ background: BORDER }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{
                      width: `${Math.min(100, Math.round(((event.registrations_count ?? 0) / Number(form.max_capacity)) * 100))}%`,
                      background: ACCENT,
                    }} />
                  </div>
                  <p className="text-[10px] mt-1 text-right" style={{ color: TEXT_DIM }}>
                    {Math.min(100, Math.round(((event.registrations_count ?? 0) / Number(form.max_capacity)) * 100))}% ocupado
                  </p>
                </>
              )}
            </div>
          </SectionCard>

          {/* Contratante */}
          <SectionCard icon={BuildingIcon} title="Empresa contratante">
            <TextInput value={form.contracting_company} onChange={f('contracting_company')}
              placeholder="EML, clínica, institución…" />
          </SectionCard>

          {/* Certificado */}
          <SectionCard icon={ShieldCheckIcon} title="Certificado">
            <Toggle label="Emitir certificado de asistencia" value={form.has_certificate} onChange={fBool('has_certificate')} />
            <AnimatePresence>
              {form.has_certificate && (
                <motion.div key="cert-date"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                  <Field label="Fecha de envío del certificado">
                    <TextInput type="date" value={form.certificate_send_at} onChange={f('certificate_send_at')} />
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>

          {/* Identificadores */}
          <SectionCard icon={GlobeIcon} title="Identificadores del sistema">
            {[
              { label: 'ID',    value: event.id },
              { label: 'Slug',  value: event.slug ?? '—' },
              { label: 'Publicación', value: event.publication_status ?? '—' },
            ].map((item, i) => (
              <div key={i} className="mb-2">
                <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: TEXT_DIM }}>{item.label}</p>
                <p className="text-xs font-mono break-all" style={{ color: TEXT_LO }}>{item.value}</p>
              </div>
            ))}
          </SectionCard>

        </div>
      </div>
    </div>
  );
}
