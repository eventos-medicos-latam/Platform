import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  getPublicSettings,
  pageVisible,
  pathVisible,
  type SitePageId,
  type SiteSettings,
} from '../lib/novo/site';

interface SiteSettingsContextValue {
  settings: SiteSettings;
  loading: boolean;
  pageVisible: (page: SitePageId) => boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getPublicSettings()
      .then((value) => { if (alive) setSettings(value); })
      .catch(() => { if (alive) setSettings({}); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const value = useMemo<SiteSettingsContextValue>(() => ({
    settings,
    loading,
    pageVisible: (page) => pageVisible(settings, page),
  }), [settings, loading]);

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettingsContextValue {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    return {
      settings: {},
      loading: false,
      pageVisible: () => true,
    };
  }
  return ctx;
}

export function SitePageGuard({ page, children }: { page: SitePageId; children: React.ReactNode }) {
  const { settings, loading } = useSiteSettings();
  if (loading) return null;
  if (!pageVisible(settings, page)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function SiteHead() {
  const { settings, loading } = useSiteSettings();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    const title = (settings.seo_title ?? '').trim() || 'Eventos Médicos LATAM';
    const description = (settings.seo_description ?? '').trim();
    const favicon = (settings.favicon_url ?? '').trim();
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    if (description) meta.setAttribute('content', description);

    if (favicon) {
      let icon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!icon) {
        icon = document.createElement('link');
        icon.rel = 'icon';
        document.head.appendChild(icon);
      }
      icon.href = favicon;
    }
  }, [settings, loading, location.pathname]);

  return null;
}

export function isPublicPathVisible(settings: SiteSettings, pathname: string) {
  return pathVisible(settings, pathname);
}
