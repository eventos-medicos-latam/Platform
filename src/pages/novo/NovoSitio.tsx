import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HomeIcon, FileTextIcon, CalendarDaysIcon, ShoppingBagIcon,
  GalleryHorizontalIcon, BuildingIcon, SettingsIcon,
  CheckCircleIcon, AlertCircleIcon, ExternalLinkIcon, GlobeIcon,
} from 'lucide-react';

type Section = 'home' | 'paginas' | 'eventos' | 'tienda' | 'banners' | 'organizacion' | 'config';

const SECTIONS: { id: Section; label: string; icon: React.ElementType; desc: string; status: 'ok' | 'warn' | 'pending' }[] = [
  { id: 'home',          label: 'Home / Inicio',           icon: HomeIcon,               desc: 'Hero · evento protagonista · bloques · CTA', status: 'ok'      },
  { id: 'paginas',       label: 'Páginas corporativas',    icon: FileTextIcon,            desc: 'Nosotros · Comunidad · Aliados · Contacto',  status: 'ok'      },
  { id: 'eventos',       label: 'Eventos en el sitio',     icon: CalendarDaysIcon,        desc: 'Visibilidad · orden · destacados · histórico',status: 'ok'      },
  { id: 'tienda',        label: 'Tienda',                  icon: ShoppingBagIcon,         desc: 'Qué se muestra · orden · CTA · Hotmart',     status: 'warn'    },
  { id: 'banners',       label: 'Banners / Marcas',        icon: GalleryHorizontalIcon,   desc: 'Slots · tiers · logos · CTR · superficies',  status: 'ok'      },
  { id: 'organizacion',  label: 'Organización y contacto', icon: BuildingIcon,            desc: 'Email · WhatsApp · redes · logo · mensajes', status: 'ok'      },
  { id: 'config',        label: 'Configuración web',       icon: SettingsIcon,            desc: 'Navegación · SEO · favicon · publicación',   status: 'pending' },
];

const STATUS_ICON = {
  ok:      { icon: CheckCircleIcon,  color: '#00C9A0' },
  warn:    { icon: AlertCircleIcon,  color: '#F59E0B' },
  pending: { icon: AlertCircleIcon,  color: '#2a4a6b' },
};

// Mock de estado del sitio web
const SITE_STATUS = [
  { label: 'Sitio publicado', value: 'Sí',                      ok: true  },
  { label: 'Evento protagonista', value: 'La Eterna Primavera', ok: true  },
  { label: 'Tienda activa', value: '3 productos visibles',       ok: true  },
  { label: 'Logo cargado', value: 'EML logo v3.png',            ok: true  },
  { label: 'SEO / Meta', value: 'Incompleto',                   ok: false },
  { label: 'Favicon', value: 'No configurado',                  ok: false },
];

const MOCK_CONTACT_MSGS = [
  { id: 1, name: 'Dr. Miguel Arango',    reason: 'Patrocinio',   email: 'marango@roche.com',       status: 'nuevo',    created: '2026-09-02' },
  { id: 2, name: 'Lucia Torres',          reason: 'Información', email: 'lucia@gmail.com',          status: 'atendido', created: '2026-09-01' },
  { id: 3, name: 'Farmacéutica Del Sur',  reason: 'Alianza',     email: 'alianzas@fdelsur.com',    status: 'nuevo',    created: '2026-08-30' },
];

export function NovoSitio() {
  const [active, setActive] = useState<Section | null>(null);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>
            Administración global
          </p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>
            Sitio Web EML
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#7A9CB8' }}>
            Web corporativa · no confundir con la página de cada evento
          </p>
        </div>
        <a
          href="https://eventosmedicoslatam.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
          style={{ background: '#182d47', color: '#7A9CB8', border: '1px solid #1e3450' }}
        >
          <GlobeIcon size={14} /> Ver sitio <ExternalLinkIcon size={12} />
        </a>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Columna izquierda — secciones del sitio */}
        <div className="col-span-2 space-y-2">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#2a4a6b' }}>
            Secciones
          </p>
          {SECTIONS.map((sec, i) => {
            const st = STATUS_ICON[sec.status];
            const isActive = active === sec.id;
            return (
              <motion.button
                key={sec.id}
                type="button"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                onClick={() => setActive(isActive ? null : sec.id)}
                className="w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-150"
                style={{
                  background: isActive ? '#182d47' : '#112035',
                  border: `1px solid ${isActive ? '#00C9A0' + '40' : '#1e3450'}`,
                }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: isActive ? 'rgba(0,201,160,.12)' : '#182d47', border: '1px solid #1e3450' }}>
                  <sec.icon size={18} style={{ color: isActive ? '#00C9A0' : '#7A9CB8' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#E1EAF4' }}>{sec.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#7A9CB8' }}>{sec.desc}</p>
                </div>
                <st.icon size={15} style={{ color: st.color, flexShrink: 0 }} />
              </motion.button>
            );
          })}

          {/* Sub-panel expandible */}
          {active && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden rounded-2xl"
              style={{ background: '#0d1829', border: '1px solid #1e3450' }}
            >
              {active === 'organizacion' ? (
                <OrganizacionPanel />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: '#182d47', border: '1px solid #1e3450' }}>
                    {React.createElement(SECTIONS.find(s => s.id === active)!.icon, { size: 20, style: { color: '#2a4a6b' } })}
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#7A9CB8' }}>
                    {SECTIONS.find(s => s.id === active)?.label}
                  </p>
                  <p className="text-xs" style={{ color: '#2a4a6b' }}>Editor en construcción</p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Columna derecha — estado + mensajes */}
        <div className="space-y-4">
          {/* Estado del sitio */}
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#2a4a6b' }}>
              Estado del sitio
            </p>
            <div className="overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
              {SITE_STATUS.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: i < SITE_STATUS.length - 1 ? '1px solid #1a2e45' : 'none' }}>
                  <p className="text-xs" style={{ color: '#7A9CB8' }}>{item.label}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold" style={{ color: item.ok ? '#E1EAF4' : '#F59E0B' }}>{item.value}</p>
                    {item.ok
                      ? <CheckCircleIcon size={12} style={{ color: '#00C9A0' }} />
                      : <AlertCircleIcon size={12} style={{ color: '#F59E0B' }} />
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mensajes de contacto */}
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#2a4a6b' }}>
              Mensajes recientes
            </p>
            <div className="overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
              {MOCK_CONTACT_MSGS.map((msg, i) => (
                <div key={msg.id} className="px-4 py-3.5 cursor-pointer transition-colors"
                  style={{ borderBottom: i < MOCK_CONTACT_MSGS.length - 1 ? '1px solid #1a2e45' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#182d47')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold truncate" style={{ color: '#E1EAF4' }}>{msg.name}</p>
                    <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        color: msg.status === 'nuevo' ? '#5B8AF0' : '#2a4a6b',
                        background: msg.status === 'nuevo' ? 'rgba(91,138,240,.12)' : 'rgba(58,84,112,.12)',
                      }}>
                      {msg.status === 'nuevo' ? 'Nuevo' : 'Atendido'}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#7A9CB8' }}>{msg.reason}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#2a4a6b' }}>{msg.email}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-panel de Organización y Contacto — rescata OrganizationAdmin
function OrganizacionPanel() {
  const [values, setValues] = useState<Record<string, string>>({
    contact_email: 'hola@eventosmedicoslatam.com',
    contact_whatsapp_number: '300 000 0000',
    contact_city: 'Medellín',
    contact_country: 'Colombia',
    social_instagram: 'https://instagram.com/eventosmedicoslatam',
    social_linkedin: 'https://linkedin.com/company/eventos-medicos-latam',
    social_facebook: '',
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const saveField = (key: string) => {
    setSaving(key);
    setTimeout(() => {
      setSaving(null);
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    }, 800);
  };

  const renderField = (key: string, label: string, placeholder?: string) => (
    <div key={key}>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#2a4a6b' }}>{label}</p>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors"
          style={{ background: '#112035', border: '1px solid #1e3450', color: '#E1EAF4' }}
          placeholder={placeholder}
          value={values[key] ?? ''}
          onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
        />
        <button
          type="button"
          onClick={() => saveField(key)}
          disabled={saving === key}
          className="shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-60"
          style={{ background: saved === key ? 'rgba(0,201,160,.15)' : '#182d47', color: saved === key ? '#00C9A0' : '#7A9CB8', border: '1px solid #1e3450' }}
        >
          {saving === key ? '…' : saved === key ? '✓' : 'Guardar'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-5 space-y-5">
      <div>
        <p className="text-xs font-bold mb-3" style={{ color: '#E1EAF4' }}>Contacto</p>
        <div className="grid grid-cols-2 gap-3">
          {renderField('contact_email', 'Correo', 'hola@eventosmedicoslatam.com')}
          {renderField('contact_whatsapp_number', 'WhatsApp', '300 000 0000')}
          {renderField('contact_city', 'Ciudad', 'Medellín')}
          {renderField('contact_country', 'País', 'Colombia')}
        </div>
      </div>
      <div style={{ borderTop: '1px solid #1e3450', paddingTop: 16 }}>
        <p className="text-xs font-bold mb-3" style={{ color: '#E1EAF4' }}>Redes sociales</p>
        <div className="space-y-3">
          {renderField('social_instagram', 'Instagram')}
          {renderField('social_linkedin', 'LinkedIn')}
          {renderField('social_facebook', 'Facebook')}
        </div>
      </div>
    </div>
  );
}
