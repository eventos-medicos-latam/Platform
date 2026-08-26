import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FacebookIcon, InstagramIcon, LinkedinIcon } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { organization } from '../../data/organization';
import { editions, getFamily } from '../../data/editions';
import { Pending } from '../ui/Pending';
import { supabase } from '../../lib/supabaseClient';

interface SiteSettings {
  email: string;
  whatsapp: string;
  instagram: string;
  linkedin: string;
  facebook: string;
}

const SETTINGS_KEYS = ['contact_email', 'contact_whatsapp_dial_code', 'contact_whatsapp_number', 'social_instagram', 'social_linkedin', 'social_facebook'];

export function PublicFooter() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  useEffect(() => {
    supabase
      .from('public_settings')
      .select('key, value')
      .in('key', SETTINGS_KEYS)
      .then(({ data }) => {
        const values = Object.fromEntries((data ?? []).map((row) => [row.key, row.value ?? '']));
        setSettings({
          email: values.contact_email ?? '',
          whatsapp: values.contact_whatsapp_dial_code && values.contact_whatsapp_number ? `+${values.contact_whatsapp_dial_code} ${values.contact_whatsapp_number}` : '',
          instagram: values.social_instagram ?? '',
          linkedin: values.social_linkedin ?? '',
          facebook: values.social_facebook ?? ''
        });
      });
  }, []);
  const socialLinks = [{ href: settings?.instagram, icon: InstagramIcon, label: 'Instagram' }, { href: settings?.linkedin, icon: LinkedinIcon, label: 'LinkedIn' }, { href: settings?.facebook, icon: FacebookIcon, label: 'Facebook' }].filter((item) => item.href);
  return <footer className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-shell gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo surface="onLight" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
            {organization.valueProposition}
          </p>
          <dl className="mt-6 space-y-1.5 text-sm">
            <div className="flex gap-2">
              <dt className="text-ink-muted">Sede:</dt>
              <dd className="text-brand">
                {organization.city}, {organization.country}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-ink-muted">Correo:</dt>
              <dd>
                {settings === null ? null : settings.email ? <a href={`mailto:${settings.email}`} className="text-brand hover:underline">{settings.email}</a> : <Pending />}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-ink-muted">WhatsApp:</dt>
              <dd>
                {settings === null ? null : settings.whatsapp ? <a href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-brand hover:underline">{settings.whatsapp}</a> : <Pending />}
              </dd>
            </div>
          </dl>
          {socialLinks.length > 0 ? <div className="mt-5 flex items-center gap-3">
              {socialLinks.map((item) => <a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-muted transition-colors duration-150 ease-emphasis hover:border-brand/40 hover:text-brand">
                  <item.icon size={16} />
                </a>)}
            </div> : null}
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Eventos</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {editions.map((edition) => {
            const family = getFamily(edition.familyId);
            if (!family) return null;
            return <li key={edition.id}>
                  <Link className="text-brand transition-colors duration-150 ease-emphasis hover:text-brand-support" to={`/eventos/${family.slug}/${edition.slug}`}>
                    {edition.name} · {edition.year}
                  </Link>
                </li>;
          })}
            <li>
              <Link className="text-ink-muted hover:text-brand" to="/eventos">
                Todos los eventos
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Organización
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link className="text-ink-muted hover:text-brand" to="/nosotros">
                Nosotros
              </Link>
            </li>
            <li>
              <Link className="text-ink-muted hover:text-brand" to="/comunidad">
                Comunidad médica
              </Link>
            </li>
            <li>
              <Link className="text-ink-muted hover:text-brand" to="/aliados">
                Aliados
              </Link>
            </li>
            <li>
              <Link className="text-ink-muted hover:text-brand" to="/contenido">
                Contenido
              </Link>
            </li>
            <li>
              <Link className="text-ink-muted hover:text-brand" to="/legal">
                Legal y Habeas Data
              </Link>
            </li>
            <li>
              <Link className="text-ink-muted hover:text-brand" to="/login">
                Iniciar sesión
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-shell flex-col gap-2 px-6 py-5 text-xs text-ink-muted md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {organization.name}. Identidad visual oficial: PENDIENTE.
          </p>
          <p>Razón social: PENDIENTE · Medellín, Colombia</p>
        </div>
      </div>
    </footer>;
}