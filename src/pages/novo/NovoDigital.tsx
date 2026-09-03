import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  VideoIcon, UsersIcon, CalendarDaysIcon, PlayCircleIcon,
  PlusIcon, ExternalLinkIcon, ClockIcon, MicIcon,
} from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';

type SessionType   = 'webinar' | 'masterclass' | 'conversatorio';
type SessionStatus = 'publicado' | 'proximo' | 'en_vivo' | 'finalizado';

interface DigitalSession {
  id: string;
  title: string;
  type: SessionType;
  status: SessionStatus;
  date: string;
  time: string;
  speaker: string;
  registrados: number;
  asistieron?: number;
  platform: string;
}

const TYPE_CONFIG: Record<SessionType, { label: string; color: string }> = {
  webinar:       { label: 'Webinar',       color: '#5B8AF0' },
  masterclass:   { label: 'Masterclass',   color: '#A78BFA' },
  conversatorio: { label: 'Conversatorio', color: '#00C9A0' },
};

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; bg: string }> = {
  publicado:  { label: 'Publicado',  color: '#00C9A0', bg: 'rgba(0,201,160,.12)'   },
  proximo:    { label: 'Próximo',    color: '#5B8AF0', bg: 'rgba(91,138,240,.12)'  },
  en_vivo:    { label: '● En vivo', color: '#F24463', bg: 'rgba(242,68,99,.12)'   },
  finalizado: { label: 'Finalizado', color: '#3A5470', bg: 'rgba(58,84,112,.12)'  },
};

const MOCK_SESSIONS: DigitalSession[] = [
  { id: 'd1', title: 'Microbiota intestinal: claves para la consulta',        type: 'webinar',       status: 'finalizado', date: '2026-08-05', time: '19:00', speaker: 'Dra. Valentina Ospina',  registrados: 312, asistieron: 241, platform: 'Zoom' },
  { id: 'd2', title: 'Nutrición funcional en ginecología: evidencia 2026',   type: 'masterclass',   status: 'finalizado', date: '2026-08-19', time: '18:30', speaker: 'Dr. Andrés Mejía',       registrados: 198, asistieron: 167, platform: 'Zoom' },
  { id: 'd3', title: 'Panel: Disruptores endocrinos en la práctica diaria',  type: 'conversatorio', status: 'proximo',    date: '2026-09-15', time: '19:00', speaker: 'Panel EML',              registrados: 89,               platform: 'Zoom' },
  { id: 'd4', title: 'Probióticos de última generación: ¿qué funciona?',     type: 'webinar',       status: 'proximo',    date: '2026-09-22', time: '19:00', speaker: 'Dra. Camila Ríos',       registrados: 54,               platform: 'Zoom' },
  { id: 'd5', title: 'Masterclass: Certificación hormobiota avanzada',       type: 'masterclass',   status: 'publicado',  date: '2026-10-10', time: '09:00', speaker: 'Equipo EML',             registrados: 23,               platform: 'Zoom' },
];

const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
const GRADS = ['linear-gradient(135deg,#1a4a7a,#2d6fae)', 'linear-gradient(135deg,#1a6b5a,#00C9A0)', 'linear-gradient(135deg,#5b2d8a,#A78BFA)'];

export function NovoDigital() {
  const [selected, setSelected] = useState<DigitalSession | null>(null);
  const [typeFilter, setTypeFilter] = useState<SessionType | 'todos'>('todos');

  const filtered = typeFilter === 'todos' ? MOCK_SESSIONS : MOCK_SESSIONS.filter(s => s.type === typeFilter);
  const totalReg    = MOCK_SESSIONS.reduce((s, d) => s + d.registrados, 0);
  const totalAsist  = MOCK_SESSIONS.reduce((s, d) => s + (d.asistieron ?? 0), 0);
  const avgRate     = MOCK_SESSIONS.filter(d => d.asistieron).length > 0
    ? Math.round((totalAsist / MOCK_SESSIONS.filter(d => d.asistieron).reduce((s, d) => s + d.registrados, 0)) * 100)
    : 0;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>Ecosistema</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Agenda Digital</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>Webinars · Masterclasses · Conversatorios</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{ background: 'rgba(0,201,160,.12)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
          <PlusIcon size={13} /> Nueva sesión
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard label="Total sesiones"   value={MOCK_SESSIONS.length.toString()} icon={VideoIcon}       accent="#5B8AF0" delay={0}    />
        <KPICard label="Registrados"       value={totalReg.toString()}             icon={UsersIcon}       accent="#00C9A0" delay={0.05} />
        <KPICard label="Asistencia media"  value={`${avgRate}%`}                   icon={PlayCircleIcon}  accent="#A78BFA" progress={avgRate} delay={0.1}  />
        <KPICard label="Próximas sesiones" value={MOCK_SESSIONS.filter(s => s.status === 'proximo' || s.status === 'publicado').length.toString()} icon={CalendarDaysIcon} accent="#FF7043" delay={0.15} />
      </div>

      {/* Filtro tipo */}
      <div className="mb-4 flex rounded-xl overflow-hidden" style={{ border: '1px solid #1e3450', width: 'fit-content' }}>
        {(['todos', 'webinar', 'masterclass', 'conversatorio'] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className="px-3.5 py-2 text-xs font-semibold transition-colors"
            style={{
              background: typeFilter === t ? '#182d47' : '#112035',
              color: typeFilter === t ? '#E1EAF4' : '#2a4a6b',
              borderRight: '1px solid #1e3450',
            }}>
            {t === 'todos' ? 'Todos' : TYPE_CONFIG[t].label}
          </button>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Lista */}
        <div className="flex-1 overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
          {filtered.map((sess, i) => {
            const tp = TYPE_CONFIG[sess.type];
            const st = STATUS_CONFIG[sess.status];
            const isSelected = selected?.id === sess.id;
            const rate = sess.asistieron && sess.registrados
              ? Math.round((sess.asistieron / sess.registrados) * 100) : null;
            return (
              <motion.div key={sess.id}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.04 }}
                onClick={() => setSelected(isSelected ? null : sess)}
                className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
                style={{
                  borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none',
                  background: isSelected ? '#182d47' : 'transparent',
                }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#182d4740')}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${tp.color}15`, border: `1px solid ${tp.color}30` }}>
                  <VideoIcon size={16} style={{ color: tp.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#E1EAF4' }}>{sess.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] font-bold" style={{ color: tp.color }}>{tp.label}</span>
                    <span className="text-[10px]" style={{ color: '#3A5470' }}>
                      <CalendarDaysIcon size={9} className="inline mr-0.5" />
                      {new Date(sess.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · {sess.time}
                    </span>
                    <span className="text-[10px]" style={{ color: '#3A5470' }}>
                      <MicIcon size={9} className="inline mr-0.5" />{sess.speaker}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-center">
                    <p className="text-sm font-bold tabular-nums" style={{ color: '#E1EAF4' }}>{sess.registrados}</p>
                    <p className="text-[9px]" style={{ color: '#3A5470' }}>registrados</p>
                  </div>
                  {rate !== null && (
                    <div className="text-center">
                      <p className="text-sm font-bold tabular-nums" style={{ color: '#00C9A0' }}>{rate}%</p>
                      <p className="text-[9px]" style={{ color: '#3A5470' }}>asistencia</p>
                    </div>
                  )}
                  <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ color: st.color, background: st.bg }}>{st.label}</span>
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
              animate={{ opacity: 1, x: 0, width: 260 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden shrink-0 rounded-2xl"
              style={{ background: '#112035', border: '1px solid #1e3450' }}
            >
              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: TYPE_CONFIG[selected.type].color }}>
                    {TYPE_CONFIG[selected.type].label}
                  </span>
                </div>
                <p className="text-sm font-bold mb-4 leading-snug" style={{ color: '#E1EAF4' }}>{selected.title}</p>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: GRADS[0] }}>{initials(selected.speaker)}</div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#E1EAF4' }}>{selected.speaker}</p>
                    <p className="text-[10px]" style={{ color: '#3A5470' }}>Ponente</p>
                  </div>
                </div>

                {[
                  { icon: CalendarDaysIcon, label: 'Fecha', value: `${new Date(selected.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}` },
                  { icon: ClockIcon,        label: 'Hora',  value: selected.time },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 mb-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: '#182d47' }}>
                      <item.icon size={12} style={{ color: '#7A9CB8' }} />
                    </div>
                    <div>
                      <p className="text-[10px]" style={{ color: '#3A5470' }}>{item.label}</p>
                      <p className="text-xs font-semibold capitalize" style={{ color: '#E1EAF4' }}>{item.value}</p>
                    </div>
                  </div>
                ))}

                {selected.asistieron && (
                  <div className="mt-3 rounded-xl p-3.5" style={{ background: '#0d1829', border: '1px solid #1e3450' }}>
                    <div className="flex justify-between mb-2">
                      <p className="text-[10px]" style={{ color: '#3A5470' }}>Asistencia</p>
                      <p className="text-xs font-bold" style={{ color: '#00C9A0' }}>
                        {Math.round((selected.asistieron / selected.registrados) * 100)}%
                      </p>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#1e3450' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${Math.round((selected.asistieron / selected.registrados) * 100)}%`,
                        background: '#00C9A0'
                      }} />
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: '#3A5470' }}>
                      {selected.asistieron} de {selected.registrados} registrados
                    </p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button className="rounded-xl py-2 text-xs font-semibold" style={{ background: '#182d47', color: '#7A9CB8', border: '1px solid #1e3450' }}>
                    Editar
                  </button>
                  <button className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold"
                    style={{ background: 'rgba(91,138,240,.1)', color: '#5B8AF0', border: '1px solid rgba(91,138,240,.2)' }}>
                    <ExternalLinkIcon size={11} /> Ver
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
