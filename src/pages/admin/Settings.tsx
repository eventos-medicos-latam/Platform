import React from 'react';
import { CheckCircle2Icon, CircleDashedIcon } from 'lucide-react';
import { ModuleHeader, Panel } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { getEdition } from '../../data/editions';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pending } from '../../components/ui/Pending';
const integrations = [{
  name: 'Wompi',
  role: 'Pasarela de pagos de tickets',
  status: 'Estructura lista · credenciales PENDIENTE',
  ready: false
}, {
  name: 'GoHighLevel',
  role: 'CRM y automatizaciones (Ruta Hormobiota)',
  status: 'Mapeo de formularios definido · conexión PENDIENTE',
  ready: false
}, {
  name: 'Check-in QR',
  role: 'Validación de acceso en sitio',
  status: 'Operativo con datos de muestra',
  ready: true
}];
const forms = ['Contacto general', 'Registro a comunidad', 'Inscripción a evento', 'Registro a webinar', 'Solicitud de patrocinio', 'Solicitud de stand', 'Lista de espera', 'Descarga de contenido', 'Alta de empresa'];
export function Settings() {
  const {
    activeEditionId
  } = usePlatform();
  const edition = getEdition(activeEditionId);
  return <>
      <ModuleHeader eyebrow="Sistema" title="Configuración e integraciones" description="Estado de las conexiones externas, SEO de la edición y formularios que alimentan el CRM." />

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <Panel emphasis title="Integraciones">
            <ul className="divide-y divide-line">
              {integrations.map((integration) => <li key={integration.name} className="flex items-start gap-3 px-5 py-4">
                  {integration.ready ? <CheckCircle2Icon size={17} className="mt-0.5 shrink-0 text-emerald-600" /> : <CircleDashedIcon size={17} className="mt-0.5 shrink-0 text-amber-600" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand">{integration.name}</p>
                    <p className="text-xs text-ink-muted">{integration.role}</p>
                    <p className="mt-1 text-sm text-ink">{integration.status}</p>
                  </div>
                </li>)}
            </ul>
          </Panel>

          <Panel title="SEO de la edición activa">
            <dl className="divide-y divide-line">
              {[{
              label: 'Slug',
              value: edition ? `/eventos/hormobiota/${edition.slug}` : '—'
            }, {
              label: 'Meta título',
              value: edition ? `${edition.name} · ${edition.claim}` : '—'
            }, {
              label: 'Meta descripción',
              value: 'PENDIENTE'
            }, {
              label: 'Imagen Open Graph',
              value: 'PENDIENTE'
            }, {
              label: 'Canonical',
              value: 'PENDIENTE'
            }, {
              label: 'Indexable',
              value: edition?.status === 'borrador' ? 'No' : 'Sí'
            }, {
              label: 'Schema',
              value: 'Event + Organization'
            }].map((row) => <div key={row.label} className="flex items-start justify-between gap-4 px-5 py-3">
                  <dt className="text-sm text-ink-muted">{row.label}</dt>
                  <dd className="max-w-[60%] text-right text-sm font-medium text-brand">
                    {row.value === 'PENDIENTE' ? <Pending /> : row.value}
                  </dd>
                </div>)}
            </dl>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Formularios conectados al CRM">
            <ul className="divide-y divide-line">
              {forms.map((form) => <li key={form} className="flex items-center justify-between gap-3 px-5 py-2.5">
                  <span className="text-sm text-ink">{form}</span>
                  <StatusBadge label="Mapeado" tone="info" />
                </li>)}
            </ul>
          </Panel>

          <Panel title="Habeas Data">
            <div className="space-y-3 px-5 py-4 text-sm text-ink">
              <p>
                El consentimiento de comunicaciones comerciales se guarda por asistente y de forma
                separada del consentimiento de tratamiento de datos.
              </p>
              <p className="text-ink-muted">
                Ningún dato de asistente se entrega automáticamente a patrocinadores: la entrega depende
                del consentimiento registrado.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </>;
}