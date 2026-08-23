import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { agendaDays, agendaTypeLabels } from '../../data/agenda';
import { getEdition } from '../../data/editions';
import { speakersByEdition } from '../../data/speakers';
import { Pending } from '../../components/ui/Pending';
import { DURATION, EASE_EMPHASIS } from '../../utils/motion';
import { formatTimeRange } from '../../utils/format';
export function AgendaAdmin() {
  const {
    activeEditionId
  } = usePlatform();
  const edition = getEdition(activeEditionId);
  const days = agendaDays(activeEditionId);
  const speakers = speakersByEdition(activeEditionId);
  const [activeDay, setActiveDay] = useState(days[0]?.day ?? 1);
  const day = days.find((item) => item.day === activeDay) ?? days[0];
  return <>
      <ModuleHeader eyebrow="Operación" title="Agenda" description="Editor por día. Cada actividad tiene tipo, track y sala. Los horarios sin aprobar quedan como PENDIENTE." actions={<div className="flex rounded-lg border border-line p-0.5">
            {days.map((item) => <button key={item.day} type="button" onClick={() => setActiveDay(item.day)} className={`relative rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ease-emphasis ${item.day === activeDay ? 'text-white' : 'text-ink-muted'}`}>
                {item.day === activeDay ? <motion.span layoutId="agenda-day-tab" className="absolute inset-0 rounded-md bg-brand" transition={{
          duration: DURATION.dropdown,
          ease: EASE_EMPHASIS
        }} /> : null}
                <span className="relative">Día {item.day}</span>
              </button>)}
          </div>} />

      {day ? <Panel emphasis title={day.label} description={day.concept}>
          <AnimatePresence mode="wait">
            <motion.div key={day.day} initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} transition={{
          duration: 0.16,
          ease: EASE_EMPHASIS
        }} className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead className="bg-canvas">
                  <tr>
                    <th className={thClass}>Horario</th>
                    <th className={thClass}>Tipo</th>
                    <th className={thClass}>Actividad</th>
                    <th className={thClass}>Track</th>
                    <th className={thClass}>Speaker</th>
                    <th className={thClass}>Sala</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {day.items.map((item) => {
                const track = edition?.trackAxis.tracks.find((entry) => entry.id === item.trackId);
                const itemSpeakers = speakers.filter((speaker) => item.speakerIds.includes(speaker.id));
                return <tr key={item.id} className="transition-colors duration-150 hover:bg-canvas">
                        <td className={tdClass}>
                          {item.start === 'PENDIENTE' ? <Pending /> : formatTimeRange(item.start, item.end)}
                        </td>
                        <td className={`${tdClass} text-xs uppercase tracking-wide text-ink-muted`}>
                          {agendaTypeLabels[item.type]}
                        </td>
                        <td className={`${tdClass} font-medium text-brand`}>{item.title}</td>
                        <td className={tdClass}>{track?.name ?? '—'}</td>
                        <td className={tdClass}>
                          {itemSpeakers.length === 0 ? '—' : itemSpeakers.map((speaker) => speaker.status === 'confirmado' || speaker.status === 'publicado' ? speaker.name : 'Por confirmar').join(', ')}
                        </td>
                        <td className={tdClass}>
                          {item.room === 'PENDIENTE' ? <Pending /> : item.room}
                        </td>
                      </tr>;
              })}
                </tbody>
              </table>
            </motion.div>
          </AnimatePresence>
        </Panel> : <Panel title="Sin agenda">
          <p className="px-5 py-10 text-center text-sm text-ink-muted">
            Esta edición todavía no tiene actividades cargadas.
          </p>
        </Panel>}
    </>;
}