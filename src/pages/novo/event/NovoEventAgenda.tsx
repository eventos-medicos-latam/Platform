import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDaysIcon, ClockIcon, MicIcon, UsersIcon, CoffeeIcon,
  PlusIcon, ChevronRightIcon, PencilIcon, LayoutListIcon, GridIcon,
} from 'lucide-react';
import type { NovoEvent } from '../../../types/novo';

interface EventContext { event: NovoEvent }

type SessionType = 'conferencia' | 'panel' | 'taller' | 'break' | 'operacion';

interface Session {
  id: string;
  time: string;
  end_time: string;
  title: string;
  type: SessionType;
  speaker?: string;
  room?: string;
  description?: string;
}

const TYPE_CONFIG: Record<SessionType, { label: string; color: string; icon: React.ElementType }> = {
  conferencia: { label: 'Conferencia', color: '#00C9A0', icon: MicIcon       },
  panel:       { label: 'Panel',       color: '#5B8AF0', icon: UsersIcon     },
  taller:      { label: 'Taller',      color: '#A78BFA', icon: LayoutListIcon },
  break:       { label: 'Break',       color: '#F59E0B', icon: CoffeeIcon    },
  operacion:   { label: 'Operación',   color: '#3A5470', icon: CalendarDaysIcon },
};

const MOCK_SESSIONS: Session[] = [
  { id: 's1',  time: '07:30', end_time: '08:30', title: 'Registro y acreditación',                      type: 'operacion',   room: 'Hall principal' },
  { id: 's2',  time: '08:30', end_time: '09:00', title: 'Bienvenida institucional',                    type: 'operacion',   room: 'Auditorio A', speaker: 'Organización EML' },
  { id: 's3',  time: '09:00', end_time: '10:00', title: 'Conferencia inaugural: Microbiota y salud hormonal', type: 'conferencia', room: 'Auditorio A', speaker: 'Dra. Valentina Ospina', description: 'Panorama actualizado del eje intestino-hormona: evidencia y aplicación clínica.' },
  { id: 's4',  time: '10:00', end_time: '10:30', title: 'Coffee break',                                type: 'break',       room: 'Foyer' },
  { id: 's5',  time: '10:30', end_time: '11:30', title: 'Panel: Disruptores endocrinos en la práctica diaria', type: 'panel',  room: 'Auditorio A', speaker: 'Dr. Andrés Mejía · Dra. Camila Ríos' },
  { id: 's6',  time: '11:30', end_time: '12:30', title: 'Taller: Lectura de microbioma en consulta',  type: 'taller',      room: 'Sala B', speaker: 'Dr. Juan E. Vargas', description: 'Cómo interpretar informes de microbioma y traducirlos en intervención.' },
  { id: 's7',  time: '12:30', end_time: '13:30', title: 'Almuerzo',                                   type: 'break',       room: 'Restaurante' },
  { id: 's8',  time: '13:30', end_time: '14:30', title: 'Conferencia: Probióticos de última generación', type: 'conferencia', room: 'Auditorio A', speaker: 'Dr. Andrés Mejía' },
  { id: 's9',  time: '14:30', end_time: '15:30', title: 'Panel: Nutrición funcional en ginecología', type: 'panel',       room: 'Auditorio A', speaker: 'Dra. Valentina Ospina · Dra. Camila Ríos' },
  { id: 's10', time: '15:30', end_time: '16:00', title: 'Clausura y sorteos',                        type: 'operacion',   room: 'Auditorio A', speaker: 'Organización EML' },
];

export function NovoEventAgenda() {
  const { event } = useOutletContext<EventContext>();
  const [selected, setSelected] = useState<Session | null>(null);
  const [view, setView] = useState<'list' | 'timeline'>('list');

  const totalMin = MOCK_SESSIONS.reduce((s, sess) => {
    const [sh, sm] = sess.time.split(':').map(Number);
    const [eh, em] = sess.end_time.split(':').map(Number);
    return s + (eh * 60 + em - sh * 60 - sm);
  }, 0);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Agenda del Evento</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>
            {MOCK_SESSIONS.length} sesiones · {Math.round(totalMin / 60)}h programadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #1e3450' }}>
            {(['list', 'timeline'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-2 transition-colors"
                style={{ background: view === v ? '#182d47' : '#112035' }}>
                {v === 'list' ? <LayoutListIcon size={14} style={{ color: view === v ? '#E1EAF4' : '#2a4a6b' }} />
                              : <GridIcon      size={14} style={{ color: view === v ? '#E1EAF4' : '#2a4a6b' }} />}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
            style={{ background: 'rgba(0,201,160,.12)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
            <PlusIcon size={13} /> Agregar sesión
          </button>
        </div>
      </div>

      {/* Leyenda de tipos */}
      <div className="mb-4 flex flex-wrap gap-3">
        {(Object.entries(TYPE_CONFIG) as [SessionType, typeof TYPE_CONFIG[SessionType]][]).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: cfg.color }} />
            <span className="text-[10px] font-semibold" style={{ color: '#7A9CB8' }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Lista / Timeline */}
        <div className="flex-1 overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
          {MOCK_SESSIONS.map((sess, i) => {
            const cfg = TYPE_CONFIG[sess.type];
            const isSelected = selected?.id === sess.id;
            return (
              <motion.div key={sess.id}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.03 }}
                onClick={() => setSelected(isSelected ? null : sess)}
                className="flex gap-4 px-5 py-4 cursor-pointer transition-colors"
                style={{
                  borderBottom: i < MOCK_SESSIONS.length - 1 ? '1px solid #1a2e45' : 'none',
                  background: isSelected ? '#182d47' : 'transparent',
                  borderLeft: `3px solid ${cfg.color}`,
                }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#182d4740')}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
              >
                {/* Hora */}
                <div className="w-20 shrink-0">
                  <p className="text-xs font-bold tabular-nums" style={{ color: '#E1EAF4' }}>{sess.time}</p>
                  <p className="text-[10px]" style={{ color: '#3A5470' }}>{sess.end_time}</p>
                </div>
                {/* Icono tipo */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>
                  <cfg.icon size={14} style={{ color: cfg.color }} />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#E1EAF4' }}>{sess.title}</p>
                  <div className="flex flex-wrap gap-3 mt-0.5">
                    {sess.speaker && <p className="text-[10px]" style={{ color: '#7A9CB8' }}><MicIcon size={9} className="inline mr-0.5" />{sess.speaker}</p>}
                    {sess.room && <p className="text-[10px]" style={{ color: '#3A5470' }}>{sess.room}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ color: cfg.color, background: `${cfg.color}15` }}>
                    {cfg.label}
                  </span>
                  <ChevronRightIcon size={12} style={{ color: '#2a4a6b' }} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Panel detalle */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 280 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden shrink-0 rounded-2xl"
              style={{ background: '#112035', border: '1px solid #1e3450' }}
            >
              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full" style={{ background: TYPE_CONFIG[selected.type].color }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: TYPE_CONFIG[selected.type].color }}>
                    {TYPE_CONFIG[selected.type].label}
                  </span>
                </div>
                <p className="text-sm font-bold mb-4 leading-snug" style={{ color: '#E1EAF4' }}>{selected.title}</p>

                {[
                  { label: 'Horario', value: `${selected.time} – ${selected.end_time}` },
                  ...(selected.speaker ? [{ label: 'Ponente', value: selected.speaker }] : []),
                  ...(selected.room    ? [{ label: 'Sala',    value: selected.room    }] : []),
                ].map((item, i) => (
                  <div key={i} className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: '#3A5470' }}>{item.label}</p>
                    <p className="text-xs" style={{ color: '#7A9CB8' }}>{item.value}</p>
                  </div>
                ))}

                {selected.description && (
                  <div className="mt-3 rounded-xl p-3.5" style={{ background: '#0d1829', border: '1px solid #1e3450' }}>
                    <p className="text-xs leading-relaxed" style={{ color: '#7A9CB8' }}>{selected.description}</p>
                  </div>
                )}

                <button className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold"
                  style={{ background: '#182d47', color: '#7A9CB8', border: '1px solid #1e3450' }}>
                  <PencilIcon size={12} /> Editar sesión
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
