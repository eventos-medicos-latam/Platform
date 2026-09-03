import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquareIcon, MailIcon, SmartphoneIcon, CheckCircleIcon,
  ClockIcon, XCircleIcon, ZapIcon, PlusIcon,
} from 'lucide-react';
import type { NovoEvent } from '../../../types/novo';

interface EventContext { event: NovoEvent }

type Channel  = 'email' | 'whatsapp' | 'sms';
type TriggerStatus = 'activo' | 'pausado' | 'error';

interface Trigger {
  id: string;
  name: string;
  channel: Channel;
  event_trigger: string;
  status: TriggerStatus;
  sent: number;
  opened: number;
  last_sent?: string;
}

const CHANNEL_CONFIG: Record<Channel, { label: string; color: string; icon: React.ElementType }> = {
  email:    { label: 'Email',    color: '#5B8AF0', icon: MailIcon          },
  whatsapp: { label: 'WhatsApp', color: '#00C9A0', icon: SmartphoneIcon    },
  sms:      { label: 'SMS',      color: '#A78BFA', icon: MessageSquareIcon },
};

const STATUS_CONFIG: Record<TriggerStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  activo:  { label: 'Activo',  color: '#00C9A0', bg: 'rgba(0,201,160,.12)',  icon: CheckCircleIcon },
  pausado: { label: 'Pausado', color: '#F59E0B', bg: 'rgba(245,158,11,.12)', icon: ClockIcon       },
  error:   { label: 'Error',   color: '#F24463', bg: 'rgba(242,68,99,.12)',  icon: XCircleIcon     },
};

const MOCK_TRIGGERS: Trigger[] = [
  { id: 't1', name: 'Confirmación de inscripción',   channel: 'email',    event_trigger: 'registro.confirmado',    status: 'activo',  sent: 87,  opened: 61, last_sent: '2026-09-01' },
  { id: 't2', name: 'Recordatorio 7 días antes',    channel: 'email',    event_trigger: 'evento.7_dias_antes',    status: 'activo',  sent: 82,  opened: 54, last_sent: '2026-09-03' },
  { id: 't3', name: 'WhatsApp inscripción OK',       channel: 'whatsapp', event_trigger: 'registro.confirmado',    status: 'activo',  sent: 87,  opened: 87, last_sent: '2026-09-01' },
  { id: 't4', name: 'Recordatorio día anterior',    channel: 'whatsapp', event_trigger: 'evento.1_dia_antes',     status: 'pausado', sent: 0,   opened: 0  },
  { id: 't5', name: 'QR de acceso',                 channel: 'email',    event_trigger: 'checkin.habilitado',     status: 'activo',  sent: 87,  opened: 70, last_sent: '2026-09-08' },
  { id: 't6', name: 'Encuesta post-evento',         channel: 'email',    event_trigger: 'evento.finalizado',      status: 'error',   sent: 12,  opened: 4,  last_sent: '2026-09-09' },
  { id: 't7', name: 'Certificado de asistencia',    channel: 'email',    event_trigger: 'certificado.disponible', status: 'pausado', sent: 0,   opened: 0  },
];

const total_sent   = MOCK_TRIGGERS.reduce((s, t) => s + t.sent, 0);
const total_opened = MOCK_TRIGGERS.reduce((s, t) => s + t.opened, 0);
const open_rate    = total_sent > 0 ? Math.round((total_opened / total_sent) * 100) : 0;

export function NovoEventComunicaciones() {
  const { event } = useOutletContext<EventContext>();
  const [filter, setFilter] = useState<TriggerStatus | 'todos'>('todos');

  const filtered = filter === 'todos' ? MOCK_TRIGGERS : MOCK_TRIGGERS.filter(t => t.status === filter);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Comunicaciones</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>Triggers · envíos · email · WhatsApp</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{ background: 'rgba(0,201,160,.12)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.2)' }}>
          <PlusIcon size={13} /> Nuevo trigger
        </button>
      </div>

      {/* Stats rápidas */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {[
          { label: 'Triggers activos',  value: MOCK_TRIGGERS.filter(t => t.status === 'activo').length.toString(), color: '#00C9A0' },
          { label: 'Total enviados',    value: total_sent.toLocaleString('es-CO'),                                  color: '#5B8AF0' },
          { label: 'Tasa de apertura',  value: `${open_rate}%`,                                                    color: '#A78BFA' },
          { label: 'Con errores',       value: MOCK_TRIGGERS.filter(t => t.status === 'error').length.toString(),   color: '#F24463' },
        ].map((stat, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            className="rounded-2xl p-4"
            style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#3A5470' }}>{stat.label}</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filtro */}
      <div className="mb-4 flex rounded-xl overflow-hidden" style={{ border: '1px solid #1e3450', width: 'fit-content' }}>
        {(['todos', 'activo', 'pausado', 'error'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3.5 py-2 text-xs font-semibold transition-colors"
            style={{
              background: filter === f ? '#182d47' : '#112035',
              color: filter === f ? '#E1EAF4' : '#2a4a6b',
              borderRight: '1px solid #1e3450',
            }}>
            {f === 'todos' ? 'Todos' : STATUS_CONFIG[f].label}
          </button>
        ))}
      </div>

      {/* Lista de triggers */}
      <div className="space-y-2">
        {filtered.map((trigger, i) => {
          const ch  = CHANNEL_CONFIG[trigger.channel];
          const st  = STATUS_CONFIG[trigger.status];
          const pctOpen = trigger.sent > 0 ? Math.round((trigger.opened / trigger.sent) * 100) : 0;
          return (
            <motion.div key={trigger.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              className="flex items-center gap-5 rounded-2xl px-5 py-4"
              style={{ background: '#112035', border: '1px solid #1e3450' }}
            >
              {/* Canal */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${ch.color}15`, border: `1px solid ${ch.color}30` }}>
                <ch.icon size={16} style={{ color: ch.color }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold" style={{ color: '#E1EAF4' }}>{trigger.name}</p>
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: ch.color }}>
                    {ch.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ZapIcon size={9} style={{ color: '#3A5470' }} />
                  <p className="text-[10px]" style={{ color: '#3A5470' }}>{trigger.event_trigger}</p>
                  {trigger.last_sent && (
                    <>
                      <span style={{ color: '#1e3450' }}>·</span>
                      <p className="text-[10px]" style={{ color: '#3A5470' }}>
                        Último envío: {new Date(trigger.last_sent).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Stats */}
              {trigger.sent > 0 ? (
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-center">
                    <p className="text-xs font-bold tabular-nums" style={{ color: '#E1EAF4' }}>{trigger.sent}</p>
                    <p className="text-[9px]" style={{ color: '#3A5470' }}>enviados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold tabular-nums" style={{ color: '#00C9A0' }}>{pctOpen}%</p>
                    <p className="text-[9px]" style={{ color: '#3A5470' }}>abiertos</p>
                  </div>
                  <div className="w-20">
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#1e3450' }}>
                      <div className="h-full rounded-full" style={{ width: `${pctOpen}%`, background: '#00C9A0' }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="shrink-0 w-40" />
              )}

              {/* Estado */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{ color: st.color, background: st.bg }}>
                  <st.icon size={10} />
                  {st.label}
                </span>
                <button className="rounded-lg px-3 py-1.5 text-[10px] font-semibold"
                  style={{ background: '#182d47', color: '#7A9CB8', border: '1px solid #1e3450' }}>
                  {trigger.status === 'activo' ? 'Pausar' : 'Activar'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
