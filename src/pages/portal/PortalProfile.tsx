import React, { useEffect, useState } from 'react';
import { ModuleHeader, Panel } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { Pending } from '../../components/ui/Pending';
import { supabase } from '../../lib/supabaseClient';

interface CompanyProfile {
  trade_name: string;
  legal_name: string | null;
  nit: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  web: string | null;
  instagram: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  description: string | null;
}

const fields = [
  { key: 'trade_name', label: 'Nombre comercial' },
  { key: 'legal_name', label: 'Razón social' },
  { key: 'nit', label: 'NIT' },
  { key: 'address', label: 'Dirección' },
  { key: 'city', label: 'Ciudad' },
  { key: 'country', label: 'País' },
  { key: 'web', label: 'Sitio web' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'contact_name', label: 'Contacto principal' },
  { key: 'contact_email', label: 'Correo' },
  { key: 'contact_whatsapp', label: 'WhatsApp' }
] as const;

export function PortalProfile() {
  const { session } = usePlatform();
  const companyId = session?.companyId;
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from('companies')
      .select('trade_name, legal_name, nit, address, city, country, web, instagram, contact_name, contact_email, contact_whatsapp, description')
      .eq('id', companyId)
      .single()
      .then(({ data }) => setProfile(data));
  }, [companyId]);

  const save = async () => {
    if (!companyId || !profile) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error: submitError } = await supabase.from('companies').update(profile).eq('id', companyId);
    setSaving(false);
    if (submitError) { setError(submitError.message); return; }
    setSaved(true);
  };

  if (!companyId) {
    return <ModuleHeader eyebrow="Portal" title="Perfil de la empresa" description="Tu usuario todavía no está vinculado a una empresa. Contacta al equipo organizador." />;
  }

  if (!profile) return null;

  return <>
      <ModuleHeader eyebrow="Portal" title="Perfil de la empresa" description="Estos datos alimentan contratos, facturación y la ficha pública de tu marca." />

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Panel emphasis title="Datos de la empresa" actions={<button type="button" disabled={saving} onClick={save} className="rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>}>
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            {fields.map((field) => <label key={field.key} className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-muted">{field.label}</span>
                  <input value={profile[field.key] ?? ''} onChange={(event) => { setSaved(false); setProfile({ ...profile, [field.key]: event.target.value }); }} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
                </label>)}
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                Descripción comercial
              </span>
              <textarea value={profile.description ?? ''} onChange={(event) => { setSaved(false); setProfile({ ...profile, description: event.target.value }); }} className="min-h-[96px] w-full resize-y rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
            </label>
          </div>
          {error ? <p role="alert" className="border-t border-line px-5 py-3 text-sm font-medium text-rose-700">{error}</p> : null}
          {saved ? <p className="border-t border-line bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">Cambios guardados.</p> : null}
        </Panel>

        <Panel title="Estado del perfil">
          <ul className="divide-y divide-line">
            {fields.map((field) => <li key={field.key} className="flex items-center justify-between gap-4 px-5 py-2.5">
                <span className="text-sm text-ink-muted">{field.label}</span>
                {!profile[field.key] ? <Pending /> : <span className="text-sm font-medium text-brand">Completo</span>}
              </li>)}
          </ul>
          <p className="border-t border-line bg-canvas px-5 py-3 text-xs text-ink-muted">
            Los campos vacíos bloquean la emisión de contratos y facturas.
          </p>
        </Panel>
      </div>
    </>;
}
