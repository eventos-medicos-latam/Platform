import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon, FileTextIcon, CalendarDaysIcon, ShoppingBagIcon,
  GalleryHorizontalIcon, BuildingIcon, SettingsIcon,
  CheckCircleIcon, AlertCircleIcon, ExternalLinkIcon, GlobeIcon,
} from 'lucide-react';
import { uploadPublicAsset } from '../../lib/storage';
import {
  BANNER_TIERS, domainFromSiteUrl, getPublicSettings,
  listContactMessages, listFeaturedEventSponsors, listSiteEvents, listSiteProducts,
  markContactMessageAttended, pageVisible, patchSiteEvent, setFeaturedSiteEvent,
  setSiteProductVisible, SITE_PAGES, SITE_PAGE_KEYS, siteUrlFromDomain,
  upsertPublicSettings, type ContactMessageRow, type SiteEventRow, type SitePageId,
  type SiteProductRow, type SiteSettings,
} from '../../lib/novo/site';
import type { EventSponsorRow } from '../../lib/novo/sponsors';
import { formatCop } from '../../utils/format';

type Section = 'home' | 'paginas' | 'eventos' | 'tienda' | 'banners' | 'organizacion' | 'config';

const SECTIONS: { id: Section; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'home',          label: 'Home / Inicio',           icon: HomeIcon,               desc: 'Hero · evento protagonista · bloques · CTA' },
  { id: 'paginas',       label: 'Páginas corporativas',    icon: FileTextIcon,            desc: 'Nosotros · Comunidad · Aliados · Contacto'  },
  { id: 'eventos',       label: 'Eventos en el sitio',     icon: CalendarDaysIcon,        desc: 'Visibilidad · orden · destacados · histórico'},
  { id: 'tienda',        label: 'Tienda',                  icon: ShoppingBagIcon,         desc: 'Qué se muestra · orden · CTA · Hotmart'     },
  { id: 'banners',       label: 'Banners / Marcas',        icon: GalleryHorizontalIcon,   desc: 'Logos del evento protagonista'  },
  { id: 'organizacion',  label: 'Organización y contacto', icon: BuildingIcon,            desc: 'Email · WhatsApp · redes · logo · mensajes' },
  { id: 'config',        label: 'Configuración web',       icon: SettingsIcon,            desc: 'SEO · favicon · dominio de publicación'   },
];

const STATUS_ICON = {
  ok:      { icon: CheckCircleIcon,  color: '#00C9A0' },
  warn:    { icon: AlertCircleIcon,  color: '#F59E0B' },
  pending: { icon: AlertCircleIcon,  color: '#2a4a6b' },
};

const BG_DEEP = '#0d1829'; const BORDER = '#1e3450'; const TEXT_HI = '#E1EAF4'; const TEXT_LO = '#7A9CB8'; const TEXT_DIM = '#2a4a6b'; const RAISED = '#182d47';

export function NovoSitio() {
  const [active, setActive] = useState<Section | null>(null);
  const [settings, setSettings] = useState<SiteSettings>({});
  const [events, setEvents] = useState<SiteEventRow[]>([]);
  const [products, setProducts] = useState<SiteProductRow[]>([]);
  const [messages, setMessages] = useState<ContactMessageRow[]>([]);
  const [sponsors, setSponsors] = useState<EventSponsorRow[]>([]);
  const [featured, setFeatured] = useState<SiteEventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [site, eventRows, productRows, messageRows] = await Promise.all([
        getPublicSettings(),
        listSiteEvents(),
        listSiteProducts(),
        listContactMessages(),
      ]);
      const banner = await listFeaturedEventSponsors(eventRows);
      setSettings(site);
      setEvents(eventRows);
      setProducts(productRows);
      setMessages(messageRows);
      setSponsors(banner.sponsors);
      setFeatured(banner.event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el sitio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const publishedProducts = products.filter((p) => p.status === 'publicado' || p.status === 'aprobado');
  const newMessages = messages.filter((m) => m.status !== 'atendido');
  const siteUrl = settings.site_url || 'https://eventosmedicoslatam.com';

  const sectionStatus = (id: Section): 'ok' | 'warn' | 'pending' => {
    if (id === 'home') return featured ? 'ok' : 'warn';
    if (id === 'tienda') return publishedProducts.length ? 'ok' : 'warn';
    if (id === 'banners') return sponsors.length ? 'ok' : 'warn';
    if (id === 'organizacion') return settings.contact_email ? 'ok' : 'warn';
    if (id === 'config') return settings.seo_title ? 'ok' : 'pending';
    return 'ok';
  };

  const siteStatus = [
    { label: 'Sitio publicado', value: domainFromSiteUrl(siteUrl) || 'Sí', ok: true },
    { label: 'Evento protagonista', value: featured?.name ?? 'Ninguno', ok: Boolean(featured) },
    { label: 'Tienda activa', value: `${publishedProducts.length} productos visibles`, ok: publishedProducts.length > 0 },
    { label: 'Logo cargado', value: settings.logo_url ? 'Sí' : 'Pendiente', ok: Boolean(settings.logo_url) },
    { label: 'SEO / Meta', value: settings.seo_title ? 'Configurado' : 'Incompleto', ok: Boolean(settings.seo_title) },
    { label: 'Favicon', value: settings.favicon_url ? 'Configurado' : 'No configurado', ok: Boolean(settings.favicon_url) },
  ];

  const saveSettings = async (patch: Record<string, string>) => {
    await upsertPublicSettings(patch);
    setSettings((current) => ({ ...current, ...patch }));
  };

  return (
    <div>
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
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
          style={{ background: '#182d47', color: '#7A9CB8', border: '1px solid #1e3450' }}
        >
          <GlobeIcon size={14} /> Ver sitio <ExternalLinkIcon size={12} />
        </a>
      </div>

      {error ? <p className="mb-4 text-sm" style={{ color: '#F24463' }}>{error}</p> : null}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-2">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#2a4a6b' }}>
            Secciones
          </p>
          {SECTIONS.map((sec, i) => {
            const status = sectionStatus(sec.id);
            const st = STATUS_ICON[status];
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
                  border: `1px solid ${isActive ? '#00C9A040' : '#1e3450'}`,
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

          {active && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden rounded-2xl"
              style={{ background: '#0d1829', border: '1px solid #1e3450' }}
            >
              {active === 'organizacion' ? <OrganizacionPanel settings={settings} onSave={saveSettings} onError={setError} /> :
               active === 'home'         ? <HomePanel settings={settings} events={events} featuredId={featured?.id ?? ''} onSave={saveSettings} onFeature={async (id) => { await setFeaturedSiteEvent(id, events); await load(); }} /> :
               active === 'paginas'      ? <PaginasPanel settings={settings} onSave={saveSettings} /> :
               active === 'eventos'      ? <EventosPanel events={events} onToggle={async (id, key, value) => {
                 const current = events.find((event) => event.id === id);
                 if (key === 'is_public' && value && current?.publication_status === 'borrador') {
                   await patchSiteEvent(id, { is_public: true, publication_status: 'publicado' });
                 } else {
                   await patchSiteEvent(id, { [key]: value });
                 }
                 await load();
               }} /> :
               active === 'tienda'       ? <TiendaPanel products={products} onToggle={async (id, visible) => { await setSiteProductVisible(id, visible); await load(); }} /> :
               active === 'banners'      ? <BannersPanel event={featured} sponsors={sponsors} /> :
               active === 'config'       ? <ConfigPanel settings={settings} onSave={saveSettings} onError={setError} /> : null}
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#2a4a6b' }}>
              Estado del sitio
            </p>
            <div className="overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
              {siteStatus.map((item, i) => (
                <div key={item.label} className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: i < siteStatus.length - 1 ? '1px solid #1a2e45' : 'none' }}>
                  <p className="text-xs" style={{ color: '#7A9CB8' }}>{item.label}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold" style={{ color: item.ok ? '#E1EAF4' : '#F59E0B' }}>{loading ? '…' : item.value}</p>
                    {item.ok
                      ? <CheckCircleIcon size={12} style={{ color: '#00C9A0' }} />
                      : <AlertCircleIcon size={12} style={{ color: '#F59E0B' }} />
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#2a4a6b' }}>
              Mensajes recientes {newMessages.length ? `(${newMessages.length} nuevos)` : ''}
            </p>
            <div className="overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
              {messages.map((msg, i) => (
                <button
                  key={msg.id}
                  type="button"
                  className="w-full px-4 py-3.5 text-left transition-colors"
                  style={{ borderBottom: i < messages.length - 1 ? '1px solid #1a2e45' : 'none' }}
                  onClick={() => { if (msg.status !== 'atendido') void markContactMessageAttended(msg.id).then(load); }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#182d47')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold truncate" style={{ color: '#E1EAF4' }}>{msg.name}</p>
                    <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        color: msg.status === 'atendido' ? '#2a4a6b' : '#5B8AF0',
                        background: msg.status === 'atendido' ? 'rgba(58,84,112,.12)' : 'rgba(91,138,240,.12)',
                      }}>
                      {msg.status === 'atendido' ? 'Atendido' : 'Nuevo'}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#7A9CB8' }}>{msg.reason}{msg.company ? ` · ${msg.company}` : ''}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#2a4a6b' }}>{msg.email}</p>
                </button>
              ))}
              {messages.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm" style={{ color: TEXT_DIM }}>{loading ? 'Cargando…' : 'Sin mensajes todavía.'}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

function PanelSaveBtn({ saving, onSave, label }: { saving: boolean; onSave: () => void; label?: string }) {
  return (
    <div className="flex justify-end pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
      <button type="button" onClick={onSave} disabled={saving}
        className="rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60 transition-all active:scale-95"
        style={{ background: '#00C9A0', color: BG_DEEP }}>
        {saving ? 'Guardando…' : label ?? 'Guardar cambios'}
      </button>
    </div>
  );
}

function HomePanel({
  settings, events, featuredId, onSave, onFeature,
}: {
  settings: SiteSettings;
  events: SiteEventRow[];
  featuredId: string;
  onSave: (patch: Record<string, string>) => Promise<void>;
  onFeature: (id: string) => Promise<void>;
}) {
  const [vals, setVals] = useState({
    hero_title: settings.home_hero_title ?? '',
    hero_subtitle: settings.home_hero_subtitle ?? '',
    cta_text: settings.home_cta_text ?? '',
  });
  const [saving, setSaving] = useState(false);
  const live = events.filter((e) => e.operational_status === 'proximo' || e.operational_status === 'activo' || e.is_public);
  const save = async () => {
    setSaving(true);
    await onSave({
      home_hero_title: vals.hero_title,
      home_hero_subtitle: vals.hero_subtitle,
      home_cta_text: vals.cta_text,
    });
    setSaving(false);
  };
  const f = (k: keyof typeof vals) => (v: string) => setVals(p => ({ ...p, [k]: v }));
  return (
    <div className="p-5 space-y-5">
      <p className="text-xs font-bold" style={{ color: TEXT_HI }}>Hero principal</p>
      <div className="space-y-3">
        <FieldRow label="Título hero" value={vals.hero_title} onChange={f('hero_title')} placeholder="Educación médica que conecta especialidades" />
        <FieldRow label="Subtítulo" value={vals.hero_subtitle} onChange={f('hero_subtitle')} placeholder="Congrega a los mejores especialistas de Latinoamérica" />
        <FieldRow label="Texto del botón CTA" value={vals.cta_text} onChange={f('cta_text')} placeholder="Ver próximos eventos" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: TEXT_DIM }}>Evento protagonista</p>
        <div className="flex gap-2 flex-wrap">
          {live.map(e => (
            <button key={e.id} type="button" onClick={() => { void onFeature(e.id); }}
              className="rounded-xl px-3.5 py-2 text-xs font-semibold transition-all"
              style={{ background: featuredId === e.id ? '#00C9A0' : RAISED, color: featuredId === e.id ? BG_DEEP : TEXT_LO, border: `1px solid ${BORDER}` }}>
              {e.name}
            </button>
          ))}
          {live.length === 0 ? <p className="text-xs" style={{ color: TEXT_DIM }}>No hay eventos para destacar.</p> : null}
        </div>
      </div>
      <PanelSaveBtn saving={saving} onSave={() => { void save(); }} />
    </div>
  );
}

function PaginasPanel({ settings, onSave }: { settings: SiteSettings; onSave: (patch: Record<string, string>) => Promise<void> }) {
  const [pages, setPages] = useState(SITE_PAGES.map((page) => ({ ...page, visible: pageVisible(settings, page.id) })));
  const toggle = async (id: SitePageId) => {
    const next = pages.map((pg) => pg.id === id ? { ...pg, visible: !pg.visible } : pg);
    setPages(next);
    const page = next.find((pg) => pg.id === id);
    if (page) await onSave({ [SITE_PAGE_KEYS[id]]: page.visible ? 'true' : 'false' });
  };
  return (
    <div className="p-5 space-y-3">
      <p className="text-xs font-bold mb-3" style={{ color: TEXT_HI }}>Visibilidad de páginas</p>
      {pages.map(pg => (
        <div key={pg.id} className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{ background: '#112035', border: `1px solid ${BORDER}` }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: TEXT_HI }}>{pg.label}</p>
            <p className="text-[10px]" style={{ color: TEXT_DIM }}>/{pg.slug}</p>
          </div>
          <button type="button" onClick={() => { void toggle(pg.id); }}
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

function EventosPanel({ events, onToggle }: {
  events: SiteEventRow[];
  onToggle: (id: string, key: 'is_public' | 'is_featured', value: boolean) => Promise<void>;
}) {
  return (
    <div className="p-5 space-y-3">
      <p className="text-xs font-bold mb-3" style={{ color: TEXT_HI }}>Eventos en el sitio</p>
      <div className="grid text-[9px] font-bold uppercase tracking-widest px-2 pb-1"
        style={{ gridTemplateColumns: '1fr auto auto', color: TEXT_DIM, gap: '0 24px' }}>
        <span>Evento</span><span>Visible</span><span>Destacado</span>
      </div>
      {events.map(ev => (
        <div key={ev.id} className="flex items-center gap-4 rounded-xl px-4 py-3"
          style={{ background: '#112035', border: `1px solid ${BORDER}` }}>
          <p className="flex-1 text-sm font-semibold" style={{ color: ev.is_public ? TEXT_HI : TEXT_DIM }}>{ev.name}</p>
          {([['is_public', ev.is_public], ['is_featured', ev.is_featured]] as const).map(([key, on]) => (
            <button key={key} type="button" onClick={() => { void onToggle(ev.id, key, !on); }}
              className="h-6 w-11 rounded-full transition-all relative shrink-0"
              style={{ background: on ? '#00C9A0' : BORDER }}>
              <span className="absolute top-0.5 rounded-full h-5 w-5 transition-all"
                style={{ background: on ? '#0d1829' : TEXT_DIM, left: on ? '50%' : '2px' }} />
            </button>
          ))}
        </div>
      ))}
      {events.length === 0 ? <p className="text-sm" style={{ color: TEXT_DIM }}>Sin eventos todavía.</p> : null}
    </div>
  );
}

function TiendaPanel({ products, onToggle }: {
  products: SiteProductRow[];
  onToggle: (id: string, visible: boolean) => Promise<void>;
}) {
  return (
    <div className="p-5 space-y-3">
      <p className="text-xs font-bold mb-1" style={{ color: TEXT_HI }}>Productos visibles en tienda</p>
      <p className="text-xs mb-3" style={{ color: TEXT_DIM }}>Se publican en /tienda cuando el estado es publicado</p>
      {products.map(it => {
        const visible = it.status === 'publicado' || it.status === 'aprobado';
        return (
          <div key={it.id} className="flex items-center gap-4 rounded-xl px-4 py-3"
            style={{ background: '#112035', border: `1px solid ${BORDER}` }}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: visible ? TEXT_HI : TEXT_DIM }}>{it.name}</p>
              <p className="text-xs tabular-nums" style={{ color: '#00C9A0' }}>{formatCop(it.price)}</p>
            </div>
            <button type="button" onClick={() => { void onToggle(it.id, !visible); }}
              className="h-6 w-11 rounded-full transition-all relative shrink-0"
              style={{ background: visible ? '#00C9A0' : BORDER }}>
              <span className="absolute top-0.5 rounded-full h-5 w-5 transition-all"
                style={{ background: visible ? '#0d1829' : TEXT_DIM, left: visible ? '50%' : '2px' }} />
            </button>
          </div>
        );
      })}
      {products.length === 0 ? <p className="text-sm" style={{ color: TEXT_DIM }}>Sin productos. Cárgalos en la tienda del admin.</p> : null}
    </div>
  );
}

function BannersPanel({ event, sponsors }: { event: SiteEventRow | null; sponsors: EventSponsorRow[] }) {
  const byTier = useMemo(() => (
    BANNER_TIERS.map((tier) => ({
      ...tier,
      items: sponsors.filter((s) => s.plan === tier.id && s.status === 'activo'),
    }))
  ), [sponsors]);
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold" style={{ color: TEXT_HI }}>
          {event ? `Aliados de ${event.name}` : 'Slots de patrocinadores'}
        </p>
        {event ? (
          <Link to={`/novo/eventos/${event.id}/patrocinadores`} className="text-[10px] font-semibold" style={{ color: '#00C9A0' }}>
            Editar en el evento
          </Link>
        ) : null}
      </div>
      {byTier.map(t => (
        <div key={t.id} className="rounded-xl p-4" style={{ background: '#112035', border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold" style={{ color: t.color }}>{t.label}</p>
            <span className="text-xs tabular-nums" style={{ color: TEXT_LO }}>{t.items.length} logos</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {t.items.length === 0 ? (
              <div className="h-10 px-3 rounded-lg flex items-center justify-center text-[9px] font-bold"
                style={{ background: RAISED, border: `1px solid ${BORDER}`, color: TEXT_DIM }}>
                Libre
              </div>
            ) : t.items.map((item) => (
              <div key={item.id} className="h-10 min-w-[4rem] px-2 rounded-lg flex items-center justify-center text-[9px] font-bold"
                style={{ background: `${t.color}22`, border: `1px solid ${t.color}44`, color: t.color }}>
                {item.logo ? <img src={item.logo} alt={item.company_name} className="h-6 max-w-[72px] object-contain" /> : item.company_name}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfigPanel({
  settings, onSave, onError,
}: {
  settings: SiteSettings;
  onSave: (patch: Record<string, string>) => Promise<void>;
  onError: (msg: string | null) => void;
}) {
  const [vals, setVals] = useState({
    domain: domainFromSiteUrl(settings.site_url ?? '') || 'eventosmedicoslatam.com',
    seo_title: settings.seo_title ?? '',
    seo_description: settings.seo_description ?? '',
    nav_links: settings.nav_links ?? 'Inicio, Eventos, Comunidad, Aliados, Tienda, Contacto',
    favicon_url: settings.favicon_url ?? '',
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    onError(null);
    try {
      await onSave({
        site_url: siteUrlFromDomain(vals.domain),
        seo_title: vals.seo_title,
        seo_description: vals.seo_description,
        nav_links: vals.nav_links,
        favicon_url: vals.favicon_url,
      });
    } catch (err) {
      onError(err instanceof Error ? err.message : 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };
  const onFavicon = async (file: File | null) => {
    if (!file) return;
    const { url, error } = await uploadPublicAsset(file);
    if (error || !url) { onError(error ?? 'No se pudo subir el favicon.'); return; }
    setVals((p) => ({ ...p, favicon_url: url }));
    await onSave({ favicon_url: url });
  };
  const f = (k: keyof typeof vals) => (v: string) => setVals(p => ({ ...p, [k]: v }));
  return (
    <div className="p-5 space-y-4">
      <p className="text-xs font-bold" style={{ color: TEXT_HI }}>Configuración web</p>
      <FieldRow label="Dominio" value={vals.domain} onChange={f('domain')} placeholder="eventosmedicoslatam.com" />
      <FieldRow label="Título SEO" value={vals.seo_title} onChange={f('seo_title')} />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: TEXT_DIM }}>Meta descripción</p>
        <textarea className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none"
          style={{ background: '#112035', border: `1px solid ${BORDER}`, color: TEXT_HI, minHeight: 72 }}
          value={vals.seo_description} onChange={e => setVals(p => ({ ...p, seo_description: e.target.value }))} />
      </div>
      <FieldRow label="Ítems del menú (referencia)" value={vals.nav_links} onChange={f('nav_links')} />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: TEXT_DIM }}>Favicon</p>
        <div className="flex items-center gap-3">
          {vals.favicon_url ? <img src={vals.favicon_url} alt="" className="h-8 w-8 rounded-lg object-contain" style={{ background: '#112035', border: `1px solid ${BORDER}` }} /> : null}
          <label className="cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold" style={{ background: RAISED, color: TEXT_LO, border: `1px solid ${BORDER}` }}>
            Subir favicon
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { void onFavicon(e.target.files?.[0] ?? null); }} />
          </label>
        </div>
      </div>
      <PanelSaveBtn saving={saving} onSave={() => { void save(); }} />
    </div>
  );
}

function OrganizacionPanel({
  settings, onSave, onError,
}: {
  settings: SiteSettings;
  onSave: (patch: Record<string, string>) => Promise<void>;
  onError: (msg: string | null) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({
    contact_email: settings.contact_email ?? '',
    contact_whatsapp_dial_code: settings.contact_whatsapp_dial_code ?? '57',
    contact_whatsapp_number: settings.contact_whatsapp_number ?? '',
    contact_city: settings.contact_city ?? '',
    contact_country: settings.contact_country ?? '',
    social_instagram: settings.social_instagram ?? '',
    social_linkedin: settings.social_linkedin ?? '',
    social_facebook: settings.social_facebook ?? '',
    logo_url: settings.logo_url ?? '',
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const saveField = async (key: string) => {
    setSaving(key);
    onError(null);
    try {
      await onSave({ [key]: values[key] ?? '' });
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } catch (err) {
      onError(err instanceof Error ? err.message : `Error guardando ${key}`);
    } finally {
      setSaving(null);
    }
  };

  const onLogo = async (file: File | null) => {
    if (!file) return;
    setSaving('logo_url');
    const { url, error } = await uploadPublicAsset(file);
    if (error || !url) { onError(error ?? 'Error subiendo el logo'); setSaving(null); return; }
    setValues((current) => ({ ...current, logo_url: url }));
    await onSave({ logo_url: url });
    setSaving(null);
    setSaved('logo_url');
    setTimeout(() => setSaved(null), 2000);
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
          onClick={() => { void saveField(key); }}
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
          {renderField('contact_whatsapp_dial_code', 'Código de país', '57')}
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
      <div style={{ borderTop: '1px solid #1e3450', paddingTop: 16 }}>
        <p className="text-xs font-bold mb-3" style={{ color: '#E1EAF4' }}>Logo</p>
        <div className="flex items-center gap-4">
          {values.logo_url ? <img src={values.logo_url} alt="Logo" className="h-12 w-auto rounded-lg object-contain" style={{ background: '#112035', border: '1px solid #1e3450' }} /> : <p className="text-xs" style={{ color: TEXT_DIM }}>Sin logo</p>}
          <label className="cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold" style={{ background: RAISED, color: TEXT_LO, border: `1px solid ${BORDER}` }}>
            {saving === 'logo_url' ? 'Subiendo…' : 'Subir logo'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { void onLogo(e.target.files?.[0] ?? null); }} />
          </label>
        </div>
      </div>
    </div>
  );
}
