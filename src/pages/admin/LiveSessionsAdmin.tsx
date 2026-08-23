import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, PlusIcon, RadioIcon, UsersIcon } from 'lucide-react';
import type { SecondaryEvent, SecondaryEventKind } from '../../types/content';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { secondaryEvents } from '../../data/content';
import { publicationStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { Pending } from '../../components/ui/Pending';
import { Drawer } from '../../components/ui/Drawer';
import { usePlatform } from '../../contexts/PlatformContext';
import { getEdition } from '../../data/editions';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';
const kindLabels: Record<SecondaryEventKind, string> = {
  webinar: 'Webinar',
  conversatorio: 'Conversatorio',
  masterclass: 'Masterclass',
  curso: 'Curso',
  lanzamiento: 'Lanzamiento'
};
type Filter = 'todos' | SecondaryEventKind;

/**
 * Formación en vivo: webinars, conversatorios y masterclass. Es el módulo que
 * alimenta la agenda digital pública y las automatizaciones de sala y
 * recordatorios. Una sesión sin ponente confirmado no se puede publicar.
 */
export function LiveSessionsAdmin() {
  const {
    activeEditionId
  } = usePlatform();
  const [filter, setFilter] = useState<Filter>('todos');
  const [selected, setSelected] = useState<SecondaryEvent | undefined>(undefined);
  const [sessions, setSessions] = useState<SecondaryEvent[]>(secondaryEvents);
  const edition = getEdition(activeEditionId);
  const list = useMemo(() => [...sessions].filter((item) => filter === 'todos' ? true : item.kind === filter).sort((a, b) => a.date.localeCompare(b.date)), [filter, sessions]);
  const totals = useMemo(() => ({
    publicadas: sessions.filter((item) => item.status === 'publicado').length,
    aprobadas: sessions.filter((item) => item.status === 'aprobado').length,
    borrador: sessions.filter((item) => item.status === 'borrador').length,
    inscritos: sessions.reduce((sum, item) => sum + item.registered, 0)
  }), [sessions]);
  function publish(session: SecondaryEvent) {
    // Regla: sin ponente confirmado no sale a la web.
    if (session.speakerLabel === 'PENDIENTE') return;
    setSessions((current) => current.map((item) => item.id === session.id ? {
      ...item,
      status: 'publicado'
    } : item));
    setSelected({
      ...session,
      status: 'publicado'
    });
  }
  return <>
      <ModuleHeader eyebrow="Contenido" title="Formación en vivo" description="Webinars, conversatorios y masterclass. Alimenta la agenda digital pública y dispara las automatizaciones de sala y recordatorios." actions={<button type="button" className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
            <PlusIcon size={15} /> Nueva sesión
          </button>} />

      {/* Resumen del módulo */}
      <dl className="mb-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {[{
        label: 'Publicadas',
        value: totals.publicadas
      }, {
        label: 'Aprobadas sin publicar',
        value: totals.aprobadas
      }, {
        label: 'En borrador',
        value: totals.borrador
      }, {
        label: 'Inscritos acumulados',
        value: totals.inscritos
      }].map((item) => <div key={item.label} className="bg-white px-5 py-4">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              {item.label}
            </dt>
            <dd className="mt-1.5 text-2xl font-bold tabular-nums text-brand">{item.value}</dd>
          </div>)}
      </dl>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(['todos', 'webinar', 'conversatorio', 'masterclass', 'lanzamiento'] as Filter[]).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150 ease-emphasis ${filter === item ? 'bg-brand text-white' : 'border border-line bg-white text-ink-muted hover:text-brand'}`}>
              {item === 'todos' ? 'Todas' : kindLabels[item as SecondaryEventKind]}
            </button>)}
      </div>

      <Panel emphasis title={`${list.length} sesiones`} description={edition ? `Edición activa: ${edition.name}` : undefined}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-canvas">
              <tr>
                <th className={thClass}>Sesión</th>
                <th className={thClass}>Tipo</th>
                <th className={thClass}>Fecha</th>
                <th className={thClass}>Hora</th>
                <th className={thClass}>Ponente</th>
                <th className={thClass}>Modalidad</th>
                <th className={thClass}>Cupo</th>
                <th className={thClass}>Inscritos</th>
                <th className={thClass}>Etiqueta CRM</th>
                <th className={thClass}>Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((session) => {
              const meta = publicationStatusMeta[session.status];
              return <tr key={session.id} onClick={() => setSelected(session)} className="cursor-pointer transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-medium text-brand`}>{session.title}</td>
                    <td className={tdClass}>{kindLabels[session.kind]}</td>
                    <td className={tdClass}>{session.date}</td>
                    <td className={tdClass}>
                      {session.time === 'PENDIENTE' ? <Pending /> : session.time}
                    </td>
                    <td className={tdClass}>
                      {session.speakerLabel === 'PENDIENTE' ? <Pending /> : session.speakerLabel}
                    </td>
                    <td className={`${tdClass} capitalize`}>{session.modality}</td>
                    <td className={tdClass}>
                      {session.seats === null ? <Pending /> : session.seats}
                    </td>
                    <td className={`${tdClass} font-semibold tabular-nums`}>
                      {session.registered}
                    </td>
                    <td className={`${tdClass} text-xs text-ink-muted`}>{session.crmTag}</td>
                    <td className={tdClass}>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="mt-4 text-sm text-ink-muted">
        Al publicar una sesión aparece en la agenda digital pública. El envío del enlace de sala, los
        recordatorios y el certificado de asistencia se ejecutan desde el CRM con la etiqueta de la
        sesión.
      </p>

      {/* Ficha de la sesión */}
      <Drawer open={Boolean(selected)} onClose={() => setSelected(undefined)} title={selected?.title ?? ''}>
        {selected ? <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                <RadioIcon size={12} /> {kindLabels[selected.kind]}
              </span>
              <StatusBadge label={publicationStatusMeta[selected.status].label} tone={publicationStatusMeta[selected.status].tone} />
            </div>

            <dl className="divide-y divide-line border-y border-line">
              {[{
            label: 'Fecha',
            value: selected.date
          }, {
            label: 'Hora',
            value: selected.time
          }, {
            label: 'Duración',
            value: selected.durationMinutes ? `${selected.durationMinutes} min` : 'PENDIENTE'
          }, {
            label: 'Ponente',
            value: selected.speakerLabel
          }, {
            label: 'Modalidad',
            value: selected.modality
          }, {
            label: 'Plataforma',
            value: selected.platform ?? 'PENDIENTE'
          }, {
            label: 'Cupo',
            value: selected.seats === null ? 'PENDIENTE' : String(selected.seats)
          }, {
            label: 'Inscritos',
            value: String(selected.registered)
          }, {
            label: 'Etiqueta CRM',
            value: selected.crmTag
          }].map((row) => <div key={row.label} className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="text-sm text-ink-muted">{row.label}</dt>
                  <dd className="max-w-[60%] text-right text-sm font-medium capitalize text-brand">
                    {row.value === 'PENDIENTE' ? <Pending /> : row.value}
                  </dd>
                </div>)}
            </dl>

            {/* Ocupación */}
            {selected.seats ? <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">Ocupación</span>
                  <span className="font-semibold text-brand">
                    {Math.round(selected.registered / selected.seats * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-soft">
                  <motion.div className="h-full rounded-full bg-accent" initial={{
              scaleX: 0
            }} animate={{
              scaleX: Math.min(selected.registered / selected.seats, 1)
            }} style={{
              transformOrigin: 'left'
            }} transition={{
              duration: DURATION.panel,
              ease: EASE_EMPHASIS
            }} />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
                  <UsersIcon size={12} /> {selected.seats - selected.registered} cupos disponibles
                </p>
              </div> : null}

            {selected.description ? <div>
                <h3 className="text-sm font-semibold text-brand">Descripción pública</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink">{selected.description}</p>
              </div> : null}

            {/* Automatizaciones */}
            <div className="rounded-xl border border-line bg-canvas p-4">
              <h3 className="text-sm font-semibold text-brand">Automatizaciones al inscribirse</h3>
              <ul className="mt-3 space-y-2">
                {['Correo de confirmación con el enlace de la sala', 'Recordatorio 24 horas antes', 'Recordatorio 1 hora antes por WhatsApp', 'Certificado de asistencia al finalizar'].map((item) => <li key={item} className="flex gap-2 text-sm text-ink">
                    <CheckIcon size={15} className="mt-0.5 shrink-0 text-accent" />
                    {item}
                  </li>)}
              </ul>
            </div>

            {/* Publicación */}
            <AnimatePresence mode="wait">
              {selected.status === 'publicado' ? <motion.p key="publicada" initial={{
            opacity: 0,
            y: 6
          }} animate={{
            opacity: 1,
            y: 0
          }} className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Publicada: visible en la agenda digital y abierta a inscripciones.
                </motion.p> : <motion.div key="acciones" initial={{
            opacity: 0,
            y: 6
          }} animate={{
            opacity: 1,
            y: 0
          }}>
                  <button type="button" onClick={() => publish(selected)} disabled={selected.speakerLabel === 'PENDIENTE'} className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-muted">
                    Publicar en la agenda digital
                  </button>
                  {selected.speakerLabel === 'PENDIENTE' ? <p className="mt-2 text-xs text-amber-700">
                      No se puede publicar sin ponente confirmado.
                    </p> : null}
                </motion.div>}
            </AnimatePresence>
          </div> : null}
      </Drawer>
    </>;
}