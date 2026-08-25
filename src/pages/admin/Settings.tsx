import React, { useEffect, useState } from 'react';
import { ModuleHeader, Panel } from '../../components/admin/Panel';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { supabase } from '../../lib/supabaseClient';

const fieldClass = 'w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand';

interface PublicFieldDef {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'select';
  options?: { value: string; label: string }[];
}

interface SecretFieldDef {
  key: string;
  label: string;
  placeholder?: string;
}

interface IntegrationDef {
  name: string;
  description: string;
  publicFields: PublicFieldDef[];
  secretFields: SecretFieldDef[];
}

const integrations: IntegrationDef[] = [
  {
    name: 'Wompi',
    description: 'Pasarela de pagos de tickets. La llave pública viaja al navegador; los secretos de integridad y eventos se usan solo en el servidor.',
    publicFields: [
      { key: 'wompi_public_key', label: 'Public Key' },
      { key: 'wompi_environment', label: 'Entorno', type: 'select', options: [{ value: 'sandbox', label: 'Sandbox (pruebas)' }, { value: 'production', label: 'Producción' }] }
    ],
    secretFields: [
      { key: 'wompi_integrity_secret', label: 'Integrity Secret' },
      { key: 'wompi_events_secret', label: 'Events Secret (verificación de webhook)' }
    ]
  },
  {
    name: 'GoHighLevel (CRM)',
    description: 'Sincroniza inscripciones, comunidad y solicitudes de patrocinio como contactos en GHL.',
    publicFields: [],
    secretFields: [
      { key: 'ghl_private_token', label: 'Private Integration Token' },
      { key: 'ghl_location_id', label: 'Location ID' }
    ]
  },
  {
    name: 'Hotmart',
    description: 'Verificación del webhook de ventas de productos digitales (los links de compra por producto se configuran en Tienda).',
    publicFields: [],
    secretFields: [
      { key: 'hotmart_hottok', label: 'Hottok' },
      { key: 'hotmart_client_secret', label: 'Client Secret' }
    ]
  },
  {
    name: 'Meta (Facebook Pixel)',
    description: 'El Pixel ID es público y se inyecta en el sitio para tracking. El access token de Conversions API es opcional y mejora la atribución.',
    publicFields: [{ key: 'meta_pixel_id', label: 'Pixel ID' }],
    secretFields: [{ key: 'meta_capi_access_token', label: 'Conversions API Access Token (opcional)' }]
  },
  {
    name: 'Google (Analytics / Search Console)',
    description: 'IDs públicos que se inyectan en el sitio para medición y verificación de propiedad.',
    publicFields: [
      { key: 'ga_measurement_id', label: 'Google Analytics 4 · Measurement ID' },
      { key: 'gtm_container_id', label: 'Google Tag Manager · Container ID (opcional)' },
      { key: 'gsc_verification_content', label: 'Search Console · contenido del meta tag de verificación' }
    ],
    secretFields: []
  }
];

interface SecretMeta {
  updatedAt: string;
}

export function Settings() {
  const [publicValues, setPublicValues] = useState<Record<string, string>>({});
  const [secretMeta, setSecretMeta] = useState<Record<string, SecretMeta>>({});
  const [secretDrafts, setSecretDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    const [{ data: publicRows }, { data: secretRows }] = await Promise.all([
      supabase.from('public_settings').select('key, value'),
      supabase.from('secret_settings').select('key, updated_at')
    ]);
    setPublicValues(Object.fromEntries((publicRows ?? []).map((row) => [row.key, row.value ?? ''])));
    setSecretMeta(Object.fromEntries((secretRows ?? []).map((row) => [row.key, { updatedAt: row.updated_at }])));
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const savePublicField = async (key: string, value: string) => {
    setSaving(key);
    setMessage(null);
    const { error } = await supabase.from('public_settings').upsert({ key, value, updated_at: new Date().toISOString() });
    setSaving(null);
    setMessage(error ? `Error guardando ${key}` : 'Guardado');
  };

  const saveSecretField = async (key: string) => {
    const value = secretDrafts[key];
    if (!value) return;
    setSaving(key);
    setMessage(null);
    const { error } = await supabase.rpc('set_integration_secret', { p_key: key, p_value: value });
    setSaving(null);
    if (error) {
      setMessage(`Error guardando ${key}`);
      return;
    }
    setMessage('Guardado');
    setSecretDrafts((current) => ({ ...current, [key]: '' }));
    await loadSettings();
  };

  return <>
      <ModuleHeader eyebrow="Sistema" title="Configuración e integraciones" description="Credenciales y valores de las integraciones externas. Los secretos se cifran en Supabase Vault y nunca se muestran de nuevo una vez guardados." />

      {message ? <p className="mb-4 text-sm font-medium text-brand">{message}</p> : null}

      <div className="space-y-5">
        {integrations.map((integration) => <Panel key={integration.name} title={integration.name} description={integration.description}>
            <div className="space-y-5 px-5 py-5">
              {integration.publicFields.length > 0 ? <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">Valores públicos</p>
                  {integration.publicFields.map((field) => <label key={field.key} className="block">
                      <span className="mb-1.5 block text-xs font-medium text-ink-muted">{field.label}</span>
                      <div className="flex gap-2">
                        {field.type === 'select' ? <select className={fieldClass} value={publicValues[field.key] ?? ''} onChange={(event) => setPublicValues((current) => ({ ...current, [field.key]: event.target.value }))} disabled={loading}>
                            <option value="">Sin definir</option>
                            {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select> : <input className={fieldClass} placeholder={field.placeholder} value={publicValues[field.key] ?? ''} onChange={(event) => setPublicValues((current) => ({ ...current, [field.key]: event.target.value }))} disabled={loading} />}
                        <button type="button" disabled={saving === field.key || loading} onClick={() => savePublicField(field.key, publicValues[field.key] ?? '')} className="shrink-0 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
                          {saving === field.key ? 'Guardando…' : 'Guardar'}
                        </button>
                      </div>
                    </label>)}
                </div> : null}

              {integration.secretFields.length > 0 ? <div className="space-y-4 border-t border-line pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">Secretos</p>
                  {integration.secretFields.map((field) => {
                const meta = secretMeta[field.key];
                return <label key={field.key} className="block">
                        <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-ink-muted">
                          {field.label}
                          {meta ? <StatusBadge label={`Configurado · ${new Date(meta.updatedAt).toLocaleDateString('es-CO')}`} tone="success" /> : <StatusBadge label="No configurado" tone="draft" />}
                        </span>
                        <div className="flex gap-2">
                          <input type="password" className={fieldClass} placeholder={meta ? '●●●●●●●● (dejar vacío para no cambiar)' : field.placeholder} value={secretDrafts[field.key] ?? ''} onChange={(event) => setSecretDrafts((current) => ({ ...current, [field.key]: event.target.value }))} disabled={loading} />
                          <button type="button" disabled={saving === field.key || loading || !secretDrafts[field.key]} onClick={() => saveSecretField(field.key)} className="shrink-0 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
                            {saving === field.key ? 'Guardando…' : 'Guardar'}
                          </button>
                        </div>
                      </label>;
              })}
                </div> : null}
            </div>
          </Panel>)}
      </div>
    </>;
}
