import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GlobeIcon, CheckCircleIcon, AlertCircleIcon, EyeIcon, PencilIcon,
  ExternalLinkIcon, ToggleLeftIcon, ToggleRightIcon,
} from 'lucide-react';
import type { NovoEvent } from '../../../types/novo';

interface EventContext { event: NovoEvent }

interface WebSection {
  id: string;
  label: string;
  enabled: boolean;
  status: 'ok' | 'warn' | 'empty';
  note?: string;
}

const INIT_SECTIONS: WebSection[] = [
  { id: 'hero',         label: 'Hero / Portada',           enabled: true,  status: 'ok',   note: 'Imagen y textos configurados' },
  { id: 'about',        label: 'Acerca del evento',        enabled: true,  status: 'ok',   note: 'Descripción completa' },
  { id: 'agenda',       label: 'Agenda pública',           enabled: true,  status: 'warn', note: '3 sesiones sin confirmar' },
  { id: 'speakers',     label: 'Ponentes',                 enabled: true,  status: 'ok'   },
  { id: 'sponsors',     label: 'Patrocinadores',           enabled: true,  status: 'warn', note: 'Nestlé: logo faltante' },
  { id: 'tickets',      label: 'Tickets / Registro',       enabled: true,  status: 'ok'   },
  { id: 'location',     label: 'Ubicación / Mapa',         enabled: true,  status: 'ok'   },
  { id: 'faq',          label: 'Preguntas frecuentes',     enabled: false, status: 'empty', note: 'Sin preguntas agregadas' },
  { id: 'contact',      label: 'Contacto',                 enabled: true,  status: 'ok'   },
];

const STATUS_ICON = {
  ok:    { icon: CheckCircleIcon, color: '#00C9A0' },
  warn:  { icon: AlertCircleIcon, color: '#F59E0B' },
  empty: { icon: AlertCircleIcon, color: '#2a4a6b' },
};

export function NovoEventWeb() {
  const { event } = useOutletContext<EventContext>();
  const [published, setPublished] = useState(true);
  const [sections, setSections] = useState<WebSection[]>(INIT_SECTIONS);

  const toggle = (id: string) =>
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));

  const enabledCount = sections.filter(s => s.enabled).length;
  const warnCount    = sections.filter(s => s.status === 'warn').length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Página Web del Evento</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>Secciones · publicación · vista previa</p>
        </div>
        <div className="flex items-center gap-3">
          <a className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
            style={{ background: '#182d47', color: '#7A9CB8', border: '1px solid #1e3450' }}>
            <EyeIcon size={13} /> Vista previa <ExternalLinkIcon size={11} />
          </a>
          <button
            onClick={() => setPublished(p => !p)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold"
            style={{
              background: published ? 'rgba(0,201,160,.12)' : '#182d47',
              color: published ? '#00C9A0' : '#7A9CB8',
              border: `1px solid ${published ? 'rgba(0,201,160,.25)' : '#1e3450'}`,
            }}>
            {published ? <ToggleRightIcon size={14} /> : <ToggleLeftIcon size={14} />}
            {published ? 'Publicada' : 'Despublicada'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Secciones */}
        <div className="col-span-2">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#2a4a6b' }}>Secciones de la página</p>
          <div className="space-y-2">
            {sections.map((sec, i) => {
              const si = STATUS_ICON[sec.status];
              return (
                <motion.div key={sec.id}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.04 }}
                  className="flex items-center gap-4 rounded-2xl px-5 py-3.5"
                  style={{ background: '#112035', border: '1px solid #1e3450', opacity: sec.enabled ? 1 : 0.5 }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: '#E1EAF4' }}>{sec.label}</p>
                    {sec.note && <p className="text-[10px] mt-0.5" style={{ color: sec.status === 'warn' ? '#F59E0B' : '#3A5470' }}>{sec.note}</p>}
                  </div>
                  <si.icon size={14} style={{ color: si.color, flexShrink: 0 }} />
                  <button className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5"
                    style={{ background: '#182d47', color: '#7A9CB8', border: '1px solid #1e3450' }}>
                    <PencilIcon size={11} /> Editar
                  </button>
                  <button onClick={() => toggle(sec.id)}
                    className="flex items-center"
                    style={{ color: sec.enabled ? '#00C9A0' : '#2a4a6b' }}>
                    {sec.enabled
                      ? <ToggleRightIcon size={22} />
                      : <ToggleLeftIcon  size={22} />}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Estado */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#2a4a6b' }}>Estado de publicación</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: published ? 'rgba(0,201,160,.12)' : '#182d47', border: '1px solid #1e3450' }}>
                <GlobeIcon size={18} style={{ color: published ? '#00C9A0' : '#2a4a6b' }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: published ? '#00C9A0' : '#7A9CB8' }}>
                  {published ? 'Publicada' : 'No publicada'}
                </p>
                <p className="text-[10px]" style={{ color: '#3A5470' }}>
                  {published ? 'Visible al público' : 'Solo administradores'}
                </p>
              </div>
            </div>

            {[
              { label: 'Secciones activas',  value: `${enabledCount}/${sections.length}` },
              { label: 'Avisos pendientes',  value: warnCount.toString() },
              { label: 'URL del evento',     value: `eml.co/${event.slug ?? event.id}` },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2.5"
                style={{ borderTop: '1px solid #1a2e45' }}>
                <p className="text-xs" style={{ color: '#7A9CB8' }}>{item.label}</p>
                <p className="text-xs font-semibold" style={{ color: '#E1EAF4' }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-5" style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#2a4a6b' }}>SEO / Meta</p>
            {[
              { label: 'Título SEO',    status: 'ok'  },
              { label: 'Descripción',   status: 'ok'  },
              { label: 'Imagen OG',     status: 'warn' },
              { label: 'URL canónica',  status: 'ok'  },
            ].map((item, i) => {
              const si = STATUS_ICON[item.status as 'ok' | 'warn'];
              return (
                <div key={i} className="flex items-center justify-between py-2"
                  style={{ borderBottom: i < 3 ? '1px solid #1a2e45' : 'none' }}>
                  <p className="text-xs" style={{ color: '#7A9CB8' }}>{item.label}</p>
                  <si.icon size={13} style={{ color: si.color }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
