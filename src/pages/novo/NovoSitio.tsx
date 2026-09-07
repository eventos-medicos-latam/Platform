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
              {active === 'organizacion' ? <OrganizacionPanel /> :
               active === 'home'         ? <HomePanel /> :
               active === 'paginas'      ? <PaginasPanel /> :
               active === 'eventos'      ? <EventosPanel /> :
               active === 'tienda'       ? <TiendaPanel /> :
               active === 'banners'      ? <BannersPanel /> :
               active === 'config'       ? <ConfigPanel /> : null}
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

/* ── Shared helpers ────────────────────────────────────────── */
const BG_DEEP = '#0d1829'; const BORDER = '#1e3450'; const TEXT_HI = '#E1EAF4'; const TEXT_LO = '#7A9CB8'; const TEXT_DIM = '#2a4a6b'; const RAISED = '#182d47';

function FieldRow({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: TEXT_DIM }}>{label}</p>
      <input className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
        style={{ background: '#112035', border: `1px solid ${BORDER}`, color: TEXT_HI }}
        placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function PanelSaveBtn({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
      <button type="button" onClick={onSave} disabled={saving}
        className="rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60 transition-all active:scale-95"
        style={{ background: '#00C9A0', color: BG_DEEP }}>
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  );
}

/* ── Home panel ────────────────────────────────────────────── */
function HomePanel() {
  const [vals, setVals] = useState({ hero_title: 'El encuentro de la medicina en movimiento', hero_subtitle: 'Congrega a los mejores especialistas de Latinoamérica', cta_text: 'Ver próximos eventos', featured_event: 'La Eterna Primavera' });
  const [saving, setSaving] = useState(false);
  const save = () => { setSaving(true); setTimeout(() => setSaving(false), 700); };
  const f = (k: keyof typeof vals) => (v: string) => setVals(p => ({ ...p, [k]: v }));
  const EVENTS = ['La Eterna Primavera', 'Hormobiota VI', 'Webinar Vitamina D'];
  return (
    <div className="p-5 space-y-5">
      <p className="text-xs font-bold" style={{ color: TEXT_HI }}>Hero principal</p>
      <div className="space-y-3">
        <FieldRow label="Título hero" value={vals.hero_title} onChange={f('hero_title')} />
        <FieldRow label="Subtítulo" value={vals.hero_subtitle} onChange={f('hero_subtitle')} />
        <FieldRow label="Texto del botón CTA" value={vals.cta_text} onChange={f('cta_text')} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: TEXT_DIM }}>Evento protagonista</p>
        <div className="flex gap-2 flex-wrap">
          {EVENTS.map(e => (
            <button key={e} type="button" onClick={() => setVals(p => ({ ...p, featured_event: e }))}
              className="rounded-xl px-3.5 py-2 text-xs font-semibold transition-all"
              style={{ background: vals.featured_event === e ? '#00C9A0' : RAISED, color: vals.featured_event === e ? BG_DEEP : TEXT_LO, border: `1px solid ${BORDER}` }}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <PanelSaveBtn saving={saving} onSave={save} />
    </div>
  );
}

/* ── Páginas panel ─────────────────────────────────────────── */
function PaginasPanel() {
  const [pages, setPages] = useState([
    { id: 'nosotros',  label: 'Nosotros',  visible: true,  slug: 'nosotros' },
    { id: 'comunidad', label: 'Comunidad', visible: true,  slug: 'comunidad' },
    { id: 'aliados',   label: 'Aliados',   visible: true,  slug: 'aliados' },
    { id: 'contacto',  label: 'Contacto',  visible: true,  slug: 'contacto' },
  ]);
  const toggle = (id: string) => setPages(p => p.map(pg => pg.id === id ? { ...pg, visible: !pg.visible } : pg));
  return (
    <div className="p-5 space-y-3">
      <p className="text-xs font-bold mb-3" style={{ color: TEXT_HI }}>Visibilidad de páginas</p>
      {pages.map(pg => (
        <div key={pg.id} className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{ background: '#112035', border: `1px solid ${BORDER}` }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: TEXT_HI }}>{pg.label}</p>
            <p className="text-[10px]" style={{ color: TEXT_DIM }}>/{ pg.slug }</p>
          </div>
          <button type="button" onClick={() => toggle(pg.id)}
            className="h-6 w-11 rounded-full transition-all relative"
            style={{ background: pg.visible ? '#00C9A0' : BORDER }}>
            <span className="absolute top-0.5 rounded-full h-5 w-5 transition-all"
              style={{ background: pg.visible ? '#0d1829' : TEXT_DIM, left: pg.visible ? '50%' : '2px' }} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Eventos panel ─────────────────────────────────────────── */
function EventosPanel() {
  const [items, setItems] = useState([
    { id:'ep', name: 'La Eterna Primavera', visible: true, destacado: true },
    { id:'hb', name: 'Hormobiota VI',       visible: true, destacado: false },
    { id:'vd', name: 'Webinar Vitamina D',  visible: true, destacado: false },
    { id:'ci', name: 'Congreso Invierno 24',visible: false, destacado: false },
  ]);
  const toggle = (id: string, key: 'visible' | 'destacado') =>
    setItems(p => p.map(e => e.id === id ? { ...e, [key]: !e[key] } : e));
  return (
    <div className="p-5 space-y-3">
      <p className="text-xs font-bold mb-3" style={{ color: TEXT_HI }}>Eventos en el sitio</p>
      <div className="grid text-[9px] font-bold uppercase tracking-widest px-2 pb-1"
        style={{ gridTemplateColumns: '1fr auto auto', color: TEXT_DIM, gap: '0 24px' }}>
        <span>Evento</span><span>Visible</span><span>Destacado</span>
      </div>
      {items.map(ev => (
        <div key={ev.id} className="flex items-center gap-4 rounded-xl px-4 py-3"
          style={{ background: '#112035', border: `1px solid ${BORDER}` }}>
          <p className="flex-1 text-sm font-semibold" style={{ color: ev.visible ? TEXT_HI : TEXT_DIM }}>{ev.name}</p>
          {(['visible', 'destacado'] as const).map(key => (
            <button key={key} type="button" onClick={() => toggle(ev.id, key)}
              className="h-6 w-11 rounded-full transition-all relative shrink-0"
              style={{ background: ev[key] ? '#00C9A0' : BORDER }}>
              <span className="absolute top-0.5 rounded-full h-5 w-5 transition-all"
                style={{ background: ev[key] ? '#0d1829' : TEXT_DIM, left: ev[key] ? '50%' : '2px' }} />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Tienda panel ──────────────────────────────────────────── */
function TiendaPanel() {
  const [items, setItems] = useState([
    { id:'p1', name: 'Entrada General — La Eterna Primavera', price: '$220.000',  visible: true  },
    { id:'p2', name: 'VIP Hormobiota VI',                     price: '$450.000',  visible: true  },
    { id:'p3', name: 'Paquete Grabaciones 2025',              price: '$85.000',   visible: true  },
    { id:'p4', name: 'Membresía EML Pro',                     price: '$1.200.000',visible: false },
  ]);
  const toggle = (id: string) => setItems(p => p.map(it => it.id === id ? { ...it, visible: !it.visible } : it));
  return (
    <div className="p-5 space-y-3">
      <p className="text-xs font-bold mb-1" style={{ color: TEXT_HI }}>Productos visibles en tienda</p>
      <p className="text-xs mb-3" style={{ color: TEXT_DIM }}>Plataforma de pago: Hotmart · ePayco</p>
      {items.map(it => (
        <div key={it.id} className="flex items-center gap-4 rounded-xl px-4 py-3"
          style={{ background: '#112035', border: `1px solid ${BORDER}` }}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: it.visible ? TEXT_HI : TEXT_DIM }}>{it.name}</p>
            <p className="text-xs tabular-nums" style={{ color: '#00C9A0' }}>{it.price}</p>
          </div>
          <button type="button" onClick={() => toggle(it.id)}
            className="h-6 w-11 rounded-full transition-all relative shrink-0"
            style={{ background: it.visible ? '#00C9A0' : BORDER }}>
            <span className="absolute top-0.5 rounded-full h-5 w-5 transition-all"
              style={{ background: it.visible ? '#0d1829' : TEXT_DIM, left: it.visible ? '50%' : '2px' }} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Banners panel ─────────────────────────────────────────── */
function BannersPanel() {
  const TIERS = [
    { label: 'Platinum', color: '#E5C97B', slots: 2, filled: 2 },
    { label: 'Gold',     color: '#C9A84C', slots: 4, filled: 3 },
    { label: 'Silver',   color: '#A0A8B8', slots: 6, filled: 4 },
    { label: 'Bronze',   color: '#B87333', slots: 8, filled: 2 },
  ];
  return (
    <div className="p-5 space-y-4">
      <p className="text-xs font-bold" style={{ color: TEXT_HI }}>Slots de patrocinadores</p>
      {TIERS.map(t => (
        <div key={t.label} className="rounded-xl p-4" style={{ background: '#112035', border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold" style={{ color: t.color }}>{t.label}</p>
            <span className="text-xs tabular-nums" style={{ color: TEXT_LO }}>{t.filled}/{t.slots} slots</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: t.slots }).map((_, i) => (
              <div key={i} className="h-10 w-16 rounded-lg flex items-center justify-center text-[9px] font-bold"
                style={{ background: i < t.filled ? `${t.color}22` : RAISED, border: `1px solid ${i < t.filled ? t.color + '44' : BORDER}`, color: i < t.filled ? t.color : TEXT_DIM }}>
                {i < t.filled ? 'Logo' : 'Libre'}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Config panel ──────────────────────────────────────────── */
function ConfigPanel() {
  const [vals, setVals] = useState({ domain: 'eventosmedicoslatam.com', seo_title: 'Eventos Médicos Latam — Congresología de excelencia', seo_description: 'Plataforma de eventos médicos de alta calidad para especialistas de toda Latinoamérica.', nav_links: 'Inicio, Eventos, Comunidad, Aliados, Tienda, Contacto' });
  const [saving, setSaving] = useState(false);
  const save = () => { setSaving(true); setTimeout(() => setSaving(false), 700); };
  const f = (k: keyof typeof vals) => (v: string) => setVals(p => ({ ...p, [k]: v }));
  return (
    <div className="p-5 space-y-4">
      <p className="text-xs font-bold" style={{ color: TEXT_HI }}>Configuración web</p>
      <FieldRow label="Dominio" value={vals.domain} onChange={f('domain')} placeholder="ejemplo.com" />
      <FieldRow label="Título SEO" value={vals.seo_title} onChange={f('seo_title')} />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: TEXT_DIM }}>Meta descripción</p>
        <textarea className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none"
          style={{ background: '#112035', border: `1px solid ${BORDER}`, color: TEXT_HI, minHeight: 72 }}
          value={vals.seo_description} onChange={e => setVals(p => ({ ...p, seo_description: e.target.value }))} />
      </div>
      <FieldRow label="Ítem del menú (separados por coma)" value={vals.nav_links} onChange={f('nav_links')} />
      <PanelSaveBtn saving={saving} onSave={save} />
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
