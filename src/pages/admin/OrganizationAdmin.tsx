import React, { useEffect, useState } from 'react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { supabase } from '../../lib/supabaseClient';
import { uploadPublicAsset } from '../../lib/storage';
import { formatShortDate } from '../../utils/format';

const fieldClass = 'w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand';

const contactFields: { key: string; label: string; placeholder?: string }[] = [
  { key: 'contact_email', label: 'Correo de contacto', placeholder: 'hola@eventosmedicoslatam.com' },
  { key: 'contact_whatsapp_dial_code', label: 'Código de país (WhatsApp)', placeholder: '57' },
  { key: 'contact_whatsapp_number', label: 'Número de WhatsApp', placeholder: '300 000 0000' },
  { key: 'contact_city', label: 'Ciudad', placeholder: 'Medellín' },
  { key: 'contact_country', label: 'País', placeholder: 'Colombia' }
];

const socialFields: { key: string; label: string; placeholder?: string }[] = [
  { key: 'social_instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'social_linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/...' },
  { key: 'social_facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' }
];

interface ContactMessage {
  id: string;
  reason: string;
  name: string;
  email: string;
  whatsapp: string | null;
  company: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

export function OrganizationAdmin() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  const loadSettings = async () => {
    const { data } = await supabase.from('public_settings').select('key, value');
    setValues(Object.fromEntries((data ?? []).map((row) => [row.key, row.value ?? ''])));
    setLoading(false);
  };

  const loadMessages = async () => {
    const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(30);
    setMessages(data ?? []);
  };

  useEffect(() => {
    loadSettings();
    loadMessages();
  }, []);

  const saveField = async (key: string, value: string) => {
    setSaving(key);
    setMessage(null);
    const { error } = await supabase.from('public_settings').upsert({ key, value, updated_at: new Date().toISOString() });
    setSaving(null);
    setMessage(error ? `Error guardando ${key}` : 'Guardado');
  };

  const onLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const { url, error } = await uploadPublicAsset(file);
    setUploadingLogo(false);
    if (error || !url) { setMessage('Error subiendo el logo'); return; }
    setValues((current) => ({ ...current, logo_url: url }));
    await saveField('logo_url', url);
  };

  const markAttended = async (id: string) => {
    await supabase.from('contact_messages').update({ status: 'atendido' }).eq('id', id);
    loadMessages();
  };

  const renderField = (field: { key: string; label: string; placeholder?: string }) => <label key={field.key} className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-muted">{field.label}</span>
      <div className="flex gap-2">
        <input className={fieldClass} placeholder={field.placeholder} value={values[field.key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} disabled={loading} />
        <button type="button" disabled={saving === field.key || loading} onClick={() => saveField(field.key, values[field.key] ?? '')} className="shrink-0 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
          {saving === field.key ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </label>;

  return <>
      <ModuleHeader eyebrow="Sitio web" title="Organización y contacto" description="Datos de contacto, redes sociales y logo que se muestran en la web pública (página de Contacto, widget de chat)." />

      {message ? <p className="mb-4 text-sm font-medium text-brand">{message}</p> : null}

      <div className="space-y-5">
        <Panel emphasis title="Contacto" description="Correo y WhatsApp que ve cualquier visitante en la web.">
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            {contactFields.map(renderField)}
          </div>
        </Panel>

        <Panel title="Redes sociales">
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            {socialFields.map(renderField)}
          </div>
        </Panel>

        <Panel title="Logo">
          <div className="flex flex-wrap items-center gap-5 px-5 py-5">
            {values.logo_url ? <img src={values.logo_url} alt="Logo actual" className="h-14 w-auto rounded-lg border border-line bg-canvas object-contain p-2" /> : <p className="text-sm text-ink-muted">Sin logo cargado todavía.</p>}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand/40">
              {uploadingLogo ? 'Subiendo…' : 'Subir logo'}
              <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} disabled={uploadingLogo} />
            </label>
          </div>
        </Panel>

        <Panel title="Mensajes de contacto" description="Lo que llega desde el formulario público de Contacto.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-canvas">
                <tr>
                  <th className={thClass}>Nombre</th>
                  <th className={thClass}>Motivo</th>
                  <th className={thClass}>Contacto</th>
                  <th className={thClass}>Mensaje</th>
                  <th className={thClass}>Recibido</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {messages.map((row) => <tr key={row.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-medium text-brand`}>{row.name}{row.company ? <span className="mt-0.5 block text-xs font-normal text-ink-muted">{row.company}</span> : null}</td>
                    <td className={tdClass}>{row.reason}</td>
                    <td className={tdClass}>{row.email}{row.whatsapp ? <span className="mt-0.5 block text-xs text-ink-muted">{row.whatsapp}</span> : null}</td>
                    <td className={`${tdClass} max-w-xs truncate`}>{row.message ?? '—'}</td>
                    <td className={tdClass}>{formatShortDate(row.created_at)}</td>
                    <td className={tdClass}>
                      <StatusBadge label={row.status === 'atendido' ? 'Atendido' : 'Nuevo'} tone={row.status === 'atendido' ? 'success' : 'info'} />
                    </td>
                    <td className={tdClass}>
                      {row.status !== 'atendido' ? <button type="button" onClick={() => markAttended(row.id)} className="text-xs font-semibold text-brand-support hover:underline">
                          Marcar atendido
                        </button> : null}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
          {messages.length === 0 ? <p className="border-t border-line px-5 py-8 text-center text-sm text-ink-muted">No han llegado mensajes todavía.</p> : null}
        </Panel>
      </div>
    </>;
}
