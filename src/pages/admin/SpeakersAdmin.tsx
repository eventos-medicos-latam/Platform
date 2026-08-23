import React from 'react';
import { LockIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { speakersByEdition } from '../../data/speakers';
import { getEdition } from '../../data/editions';
import { speakerStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { Pending } from '../../components/ui/Pending';
export function SpeakersAdmin() {
  const {
    activeEditionId
  } = usePlatform();
  const edition = getEdition(activeEditionId);
  const speakers = speakersByEdition(activeEditionId);
  const publishable = speakers.filter((speaker) => speaker.status === 'confirmado' || speaker.status === 'publicado').length;
  return <>
      <ModuleHeader eyebrow="Operación" title="Speakers" description="Un speaker solo puede publicarse cuando está confirmado. El resto vive aquí, nunca en la web." />

      <Panel emphasis title={`${speakers.length} espacios académicos`} description={`${publishable} pueden publicarse hoy`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-canvas">
              <tr>
                <th className={thClass}>Espacio</th>
                <th className={thClass}>Nombre</th>
                <th className={thClass}>Especialidad</th>
                <th className={thClass}>Track</th>
                <th className={thClass}>Tema</th>
                <th className={thClass}>Estado</th>
                <th className={thClass}>Publicable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {speakers.map((speaker) => {
              const meta = speakerStatusMeta[speaker.status];
              const track = edition?.trackAxis.tracks.find((item) => item.id === speaker.trackId);
              const canPublish = speaker.status === 'confirmado' || speaker.status === 'publicado';
              return <tr key={speaker.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} text-xs uppercase tracking-wide text-ink-muted`}>
                      {speaker.slotLabel}
                    </td>
                    <td className={`${tdClass} font-medium text-brand`}>
                      {speaker.name === 'PENDIENTE' ? <Pending /> : speaker.name}
                    </td>
                    <td className={tdClass}>{speaker.specialty}</td>
                    <td className={tdClass}>{track?.name ?? '—'}</td>
                    <td className={tdClass}>
                      {speaker.talks[0] === 'PENDIENTE' ? <Pending /> : speaker.talks[0]}
                    </td>
                    <td className={tdClass}>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </td>
                    <td className={tdClass}>
                      {canPublish ? 'Sí' : <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                          <LockIcon size={13} /> Bloqueado
                        </span>}
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>;
}