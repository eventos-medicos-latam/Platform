import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SaveIcon, MapPinIcon, CalendarIcon, GlobeIcon } from 'lucide-react';
import type { NovoEvent } from '../../../types/novo';

interface EventContext { event: NovoEvent }

const MODALITIES = ['presencial', 'virtual', 'hibrido'];
const EVENT_TYPES = ['Congreso', 'Curso', 'Simposio', 'Taller', 'Webinar', 'Conversatorio', 'Summit'];
const STATUSES    = ['borrador', 'proximo', 'en_curso', 'finalizado', 'cancelado'];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#2a4a6b' }}>{label}</p>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors"
      style={{ background: '#0d1829', border: '1px solid #1e3450', color: '#E1EAF4' }}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={e => (e.currentTarget.style.borderColor = '#00C9A040')}
      onBlur={e  => (e.currentTarget.style.borderColor = '#1e3450')}
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
      style={{ background: '#0d1829', border: '1px solid #1e3450', color: '#E1EAF4' }}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function NovoEventInformacion() {
  const { event } = useOutletContext<EventContext>();
  const [form, setForm] = useState({
    name:          event.name,
    tagline:       event.tagline ?? '',
    description:   event.description ?? '',
    event_type:    event.event_type ?? 'Congreso',
    modality:      event.modality ?? 'presencial',
    status:        event.operational_status ?? 'proximo',
    start_date:    event.start_date,
    end_date:      event.end_date,
    start_time:    event.start_time ?? '',
    end_time:      event.end_time ?? '',
    venue_name:    event.venue_name ?? '',
    venue_city:    event.venue_city ?? '',
    venue_address: event.venue_address ?? '',
    platform_name: event.platform_name ?? '',
    max_capacity:  String(event.max_capacity ?? ''),
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const f = (k: keyof typeof form) => (v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }, 900);
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Información del Evento</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>Datos básicos · lugar · fechas · identidad</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
          style={{
            background: saved ? 'rgba(0,201,160,.15)' : 'rgba(0,201,160,.12)',
            color: saved ? '#00C9A0' : '#00C9A0',
            border: '1px solid rgba(0,201,160,.25)',
          }}
        >
          <SaveIcon size={14} />
          {saving ? 'Guardando…' : saved ? '¡Guardado!' : 'Guardar cambios'}
        </motion.button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Columna principal */}
        <div className="col-span-2 space-y-5">
          {/* Identidad */}
          <section className="rounded-2xl p-5 space-y-4" style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <p className="text-xs font-bold" style={{ color: '#E1EAF4' }}>Identidad</p>
            <Field label="Nombre del evento">
              <Input value={form.name} onChange={f('name')} />
            </Field>
            <Field label="Tagline / subtítulo">
              <Input value={form.tagline} onChange={f('tagline')} placeholder="Una línea que resume el espíritu del evento" />
            </Field>
            <Field label="Descripción">
              <textarea
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none"
                style={{ background: '#0d1829', border: '1px solid #1e3450', color: '#E1EAF4', minHeight: 100 }}
                value={form.description}
                onChange={e => f('description')(e.target.value)}
                placeholder="Descripción pública del evento…"
                onFocus={e => (e.currentTarget.style.borderColor = '#00C9A040')}
                onBlur={e  => (e.currentTarget.style.borderColor = '#1e3450')}
              />
            </Field>
          </section>

          {/* Clasificación */}
          <section className="rounded-2xl p-5" style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <p className="text-xs font-bold mb-4" style={{ color: '#E1EAF4' }}>Tipo y modalidad</p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Tipo de evento">
                <Select value={form.event_type} onChange={f('event_type')} options={EVENT_TYPES} />
              </Field>
              <Field label="Modalidad">
                <Select value={form.modality} onChange={f('modality')} options={MODALITIES} />
              </Field>
              <Field label="Estado operativo">
                <Select value={form.status} onChange={f('status')} options={STATUSES} />
              </Field>
            </div>
          </section>

          {/* Fechas */}
          <section className="rounded-2xl p-5" style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <p className="text-xs font-bold mb-4" style={{ color: '#E1EAF4' }}>
              <CalendarIcon size={13} className="inline mr-1.5" style={{ color: '#7A9CB8' }} />
              Fechas y horarios
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fecha inicio"><Input value={form.start_date} onChange={f('start_date')} /></Field>
              <Field label="Fecha fin">   <Input value={form.end_date}   onChange={f('end_date')}   /></Field>
              <Field label="Hora inicio"> <Input value={form.start_time} onChange={f('start_time')} placeholder="08:00" /></Field>
              <Field label="Hora fin">    <Input value={form.end_time}   onChange={f('end_time')}   placeholder="18:00" /></Field>
            </div>
          </section>

          {/* Lugar */}
          <section className="rounded-2xl p-5" style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <p className="text-xs font-bold mb-4" style={{ color: '#E1EAF4' }}>
              <MapPinIcon size={13} className="inline mr-1.5" style={{ color: '#7A9CB8' }} />
              Lugar
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre del recinto"><Input value={form.venue_name} onChange={f('venue_name')} placeholder="Hotel, Centro de Convenciones…" /></Field>
              <Field label="Ciudad">             <Input value={form.venue_city} onChange={f('venue_city')} /></Field>
            </div>
            <div className="mt-4">
              <Field label="Dirección"><Input value={form.venue_address} onChange={f('venue_address')} /></Field>
            </div>
            {(form.modality === 'virtual' || form.modality === 'hibrido') && (
              <div className="mt-4">
                <Field label="Plataforma virtual">
                  <Input value={form.platform_name} onChange={f('platform_name')} placeholder="Zoom, Hopin, Teams…" />
                </Field>
              </div>
            )}
          </section>
        </div>

        {/* Columna lateral — capacidad + meta */}
        <div className="space-y-4">
          <section className="rounded-2xl p-5 space-y-4" style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <p className="text-xs font-bold" style={{ color: '#E1EAF4' }}>Capacidad</p>
            <Field label="Máximo de asistentes">
              <Input value={form.max_capacity} onChange={f('max_capacity')} placeholder="150" />
            </Field>
            <div className="rounded-xl p-3.5" style={{ background: '#0d1829', border: '1px solid #1e3450' }}>
              <p className="text-[10px]" style={{ color: '#3A5470' }}>Inscritos actuales</p>
              <p className="text-xl font-bold tabular-nums mt-0.5" style={{ color: '#E1EAF4' }}>{event.registrations_count ?? 0}</p>
              {form.max_capacity && (
                <>
                  <div className="mt-2 h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#1e3450' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${Math.min(100, Math.round(((event.registrations_count ?? 0) / Number(form.max_capacity)) * 100))}%`,
                      background: '#00C9A0'
                    }} />
                  </div>
                  <p className="text-[10px] mt-1 text-right" style={{ color: '#3A5470' }}>
                    {Math.min(100, Math.round(((event.registrations_count ?? 0) / Number(form.max_capacity)) * 100))}% ocupado
                  </p>
                </>
              )}
            </div>
          </section>

          <section className="rounded-2xl p-5" style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <p className="text-xs font-bold mb-3" style={{ color: '#E1EAF4' }}>
              <GlobeIcon size={13} className="inline mr-1.5" style={{ color: '#7A9CB8' }} />
              Identificadores
            </p>
            {[
              { label: 'ID del evento', value: event.id },
              { label: 'Slug',          value: event.slug ?? '—' },
              { label: 'Familia',       value: event.family_name ?? '—' },
            ].map((item, i) => (
              <div key={i} className="mb-3">
                <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: '#3A5470' }}>{item.label}</p>
                <p className="text-xs font-mono" style={{ color: '#7A9CB8' }}>{item.value}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
