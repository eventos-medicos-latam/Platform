import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquareIcon, MailIcon, SmartphoneIcon, CheckCircleIcon,
  ClockIcon, XCircleIcon, ZapIcon, PlusIcon, PencilIcon,
  PlayIcon, PauseIcon, SendIcon, WebhookIcon, ChevronRightIcon,
  AlertCircleIcon, InfoIcon, ExternalLinkIcon, TrashIcon, CopyIcon,
} from 'lucide-react';
import type { NovoEvent } from '../../../types/novo';
import { NovoModal, ModalBtn, FormSection, FormField, FormInput, FormSelect, FormTextarea } from '../../../components/novo/ui/NovoModal';

interface EventContext { event: NovoEvent }

type Channel        = 'email' | 'whatsapp' | 'sms';
type TriggerStatus  = 'activo' | 'pausado' | 'error';

interface CommTrigger {
  id: string;
  name: string;
  channel: Channel;
  event_trigger: string;
  delay_type: 'inmediato' | 'antes' | 'despues';
  delay_days: number;
  subject?: string;
  body: string;
  status: TriggerStatus;
  sent: number;
  opened: number;
  last_sent?: string;
}

/* ── Configuraciones ─────────────────────────────────────── */
const CHANNEL_CFG: Record<Channel, { label: string; color: string; icon: React.ElementType }> = {
  email:    { label: 'Email',    color: '#5B8AF0', icon: MailIcon          },
  whatsapp: { label: 'WhatsApp', color: '#00C9A0', icon: SmartphoneIcon    },
  sms:      { label: 'SMS',      color: '#A78BFA', icon: MessageSquareIcon },
};

const STATUS_CFG: Record<TriggerStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  activo:  { label: 'Activo',  color: '#00C9A0', bg: 'rgba(0,201,160,.12)',  icon: CheckCircleIcon },
  pausado: { label: 'Pausado', color: '#F59E0B', bg: 'rgba(245,158,11,.12)', icon: ClockIcon       },
  error:   { label: 'Error',   color: '#F24463', bg: 'rgba(242,68,99,.12)',  icon: XCircleIcon     },
};

const TRIGGER_EVENTS = [
  { value: 'registro.confirmado',    label: 'Inscripción confirmada'        },
  { value: 'registro.en_espera',     label: 'En lista de espera'            },
  { value: 'registro.aprobado',      label: 'Inscripción aprobada'          },
  { value: 'registro.cancelado',     label: 'Inscripción cancelada'         },
  { value: 'pago.recibido',          label: 'Pago recibido'                 },
  { value: 'checkin.habilitado',     label: 'QR de acceso listo'            },
  { value: 'evento.7_dias_antes',    label: '7 días antes del evento'       },
  { value: 'evento.3_dias_antes',    label: '3 días antes del evento'       },
  { value: 'evento.1_dia_antes',     label: '1 día antes del evento'        },
  { value: 'evento.dia_del_evento',  label: 'Día del evento'                },
  { value: 'evento.finalizado',      label: 'Evento finalizado'             },
  { value: 'certificado.disponible', label: 'Certificado disponible'        },
  { value: 'encuesta.enviada',       label: 'Encuesta post-evento enviada'  },
];

const INIT_TRIGGERS: CommTrigger[] = [
  { id: 't1', name: 'Confirmación de inscripción',  channel: 'email',    event_trigger: 'registro.confirmado',    delay_type: 'inmediato', delay_days: 0, subject: '¡Tu inscripción está confirmada!', body: 'Hola {{nombre}},\n\nTu inscripción a {{evento}} ha sido confirmada exitosamente.\n\nFecha: {{fecha}}\nLugar: {{lugar}}\n\nAdjunto encontrarás tu QR de acceso.\n\n¡Nos vemos pronto!', status: 'activo',  sent: 87,  opened: 61, last_sent: '2026-09-01' },
  { id: 't2', name: 'Recordatorio 7 días antes',   channel: 'email',    event_trigger: 'evento.7_dias_antes',    delay_type: 'inmediato', delay_days: 0, subject: 'Faltan 7 días para {{evento}}', body: 'Hola {{nombre}},\n\nFaltan solo 7 días para {{evento}}. Recuerda:\n\n📅 Fecha: {{fecha}}\n📍 Lugar: {{lugar}}\n\nAquí tu QR de acceso: {{qr_link}}', status: 'activo',  sent: 82,  opened: 54, last_sent: '2026-09-03' },
  { id: 't3', name: 'WhatsApp inscripción OK',      channel: 'whatsapp', event_trigger: 'registro.confirmado',    delay_type: 'inmediato', delay_days: 0, body: '¡Hola {{nombre}}! 🎉 Tu inscripción a *{{evento}}* está confirmada.\n\n📅 {{fecha}} | 📍 {{lugar}}\n\nTu QR de acceso: {{qr_link}}', status: 'activo',  sent: 87,  opened: 87, last_sent: '2026-09-01' },
  { id: 't4', name: 'Recordatorio día anterior',   channel: 'whatsapp', event_trigger: 'evento.1_dia_antes',     delay_type: 'inmediato', delay_days: 0, body: '¡Hola {{nombre}}! 👋 Mañana es {{evento}}. Te esperamos a las {{hora}} en {{lugar}}.\n\nTu QR: {{qr_link}}', status: 'pausado', sent: 0,   opened: 0  },
  { id: 't5', name: 'QR de acceso',                channel: 'email',    event_trigger: 'checkin.habilitado',     delay_type: 'inmediato', delay_days: 0, subject: 'Tu QR de acceso a {{evento}}', body: 'Hola {{nombre}},\n\nTu código QR de acceso al evento ya está listo. Preséntalo en la acreditación.\n\n{{qr_image}}\n\nLink de respaldo: {{qr_link}}', status: 'activo',  sent: 87,  opened: 70, last_sent: '2026-09-08' },
  { id: 't6', name: 'Encuesta post-evento',        channel: 'email',    event_trigger: 'evento.finalizado',      delay_type: 'despues', delay_days: 1, subject: '¿Cómo fue tu experiencia en {{evento}}?', body: 'Hola {{nombre}},\n\nGracias por asistir a {{evento}}. Tu opinión es muy importante para nosotros.\n\nCompleta la encuesta (5 min): {{encuesta_link}}', status: 'error',   sent: 12,  opened: 4,  last_sent: '2026-09-09' },
  { id: 't7', name: 'Certificado de asistencia',   channel: 'email',    event_trigger: 'certificado.disponible', delay_type: 'inmediato', delay_days: 0, subject: 'Tu certificado de {{evento}} está disponible', body: 'Hola {{nombre}},\n\nTu certificado de asistencia a {{evento}} ya está disponible.\n\nDescárgalo aquí: {{certificado_link}}\n\nHoras acreditadas: {{horas}}h', status: 'pausado', sent: 0,   opened: 0  },
];

/* ── Webhook data ─────────────────────────────────────────── */
const WEBHOOKS = [
  { id: 'w1', name: 'GoHighLevel — Inscripciones', endpoint: 'https://services.leadconnectorhq.com/hooks/...', events: ['registro.confirmado', 'registro.cancelado'], status: 'activo' as const },
  { id: 'w2', name: 'Zapier — Pagos',              endpoint: 'https://hooks.zapier.com/hooks/catch/...',       events: ['pago.recibido'],                              status: 'activo' as const },
];

/* ── Colores ──────────────────────────────────────────────── */
const BG      = '#112035';
const BG_DEEP = '#0d1829';
const BORDER  = '#1e3450';
const ACCENT  = '#00C9A0';
const TEXT_HI = '#E1EAF4';
const TEXT_LO = '#7A9CB8';
const TEXT_DIM = '#2a4a6b';

const EMPTY_FORM: Omit<CommTrigger, 'id' | 'sent' | 'opened'> = {
  name: '', channel: 'email', event_trigger: 'registro.confirmado',
  delay_type: 'inmediato', delay_days: 0,
  subject: '', body: '', status: 'pausado',
};

/* ══════════════════════════════════════════════════════════ */
export function NovoEventComunicaciones() {
  const { event } = useOutletContext<EventContext>();

  const [triggers, setTriggers]     = useState<CommTrigger[]>(INIT_TRIGGERS);
  const [filter, setFilter]         = useState<TriggerStatus | 'todos'>('todos');
  const [selected, setSelected]     = useState<CommTrigger | null>(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<CommTrigger | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [testSent, setTestSent]     = useState<string | null>(null);
  const [tab, setTab]               = useState<'triggers' | 'webhooks'>('triggers');

  /* ── Stats ────────────────────────────────────────────── */
  const totalSent   = triggers.reduce((s, t) => s + t.sent, 0);
  const totalOpened = triggers.reduce((s, t) => s + t.opened, 0);
  const openRate    = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

  /* ── Filtro ───────────────────────────────────────────── */
  const filtered = filter === 'todos' ? triggers : triggers.filter(t => t.status === filter);

  /* ── CRUD ─────────────────────────────────────────────── */
  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit   = (t: CommTrigger) => { setEditing(t); setForm({ name: t.name, channel: t.channel, event_trigger: t.event_trigger, delay_type: t.delay_type, delay_days: t.delay_days, subject: t.subject ?? '', body: t.body, status: t.status }); setModalOpen(true); };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      if (editing) {
        setTriggers(prev => prev.map(t => t.id === editing.id ? { ...t, ...form } : t));
        if (selected?.id === editing.id) setSelected(prev => prev ? { ...prev, ...form } : prev);
      } else {
        const newT: CommTrigger = { ...form, id: `t${Date.now()}`, sent: 0, opened: 0 };
        setTriggers(prev => [...prev, newT]);
      }
      setSaving(false);
      setModalOpen(false);
    }, 700);
  };

  const toggleStatus = (id: string) => {
    setTriggers(prev => prev.map(t =>
      t.id !== id ? t : { ...t, status: t.status === 'activo' ? 'pausado' : 'activo' }
    ));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: prev.status === 'activo' ? 'pausado' : 'activo' } : prev);
  };

  const handleDelete = (id: string) => {
    setTriggers(prev => prev.filter(t => t.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const handleDuplicate = (t: CommTrigger) => {
    setTriggers(prev => [...prev, { ...t, id: `t${Date.now()}`, name: `${t.name} (copia)`, status: 'pausado', sent: 0, opened: 0, last_sent: undefined }]);
  };

  const handleTest = (id: string) => {
    setTestSent(id);
    setTimeout(() => setTestSent(null), 2500);
  };

  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  /* ── Trigger label ──────────────────────────────────────── */
  const triggerLabel = (ev: string) => TRIGGER_EVENTS.find(e => e.value === ev)?.label ?? ev;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: TEXT_HI, fontFamily: "'Sora', sans-serif" }}>Comunicaciones</h1>
          <p className="text-sm mt-0.5" style={{ color: TEXT_LO }}>Triggers · envíos · WhatsApp · Email · Webhooks</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{ background: 'rgba(0,201,160,.12)', color: ACCENT, border: `1px solid rgba(0,201,160,.2)` }}>
          <PlusIcon size={13} /> Nuevo trigger
        </button>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-4 gap-3">
        {([
          { label: 'Triggers activos', value: triggers.filter(t => t.status === 'activo').length, color: ACCENT },
          { label: 'Total enviados',   value: totalSent.toLocaleString('es-CO'),                  color: '#5B8AF0' },
          { label: 'Tasa apertura',    value: `${openRate}%`,                                     color: '#A78BFA' },
          { label: 'Con errores',      value: triggers.filter(t => t.status === 'error').length,  color: '#F24463' },
        ] as { label: string; value: string | number; color: string }[]).map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: i * 0.04 }}
            className="rounded-2xl p-4" style={{ background: BG, border: `1px solid ${BORDER}` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: TEXT_DIM }}>{s.label}</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}`, width: 'fit-content' }}>
          {(['triggers', 'webhooks'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-2 text-xs font-semibold transition-colors capitalize"
              style={{ background: tab === t ? '#182d47' : BG, color: tab === t ? TEXT_HI : TEXT_DIM }}>
              {t === 'triggers' ? 'Triggers de comunicación' : 'Webhooks / Integraciones'}
            </button>
          ))}
        </div>

        {tab === 'triggers' && (
          <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}`, width: 'fit-content' }}>
            {(['todos', 'activo', 'pausado', 'error'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 text-[10px] font-semibold transition-colors"
                style={{ background: filter === f ? '#182d47' : BG, color: filter === f ? TEXT_HI : TEXT_DIM }}>
                {f === 'todos' ? 'Todos' : STATUS_CFG[f].label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-5">

        {/* ── Lista ──────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {tab === 'triggers' && (
            <div className="space-y-2">
              {filtered.map((trigger, i) => {
                const ch       = CHANNEL_CFG[trigger.channel];
                const st       = STATUS_CFG[trigger.status];
                const pctOpen  = trigger.sent > 0 ? Math.round((trigger.opened / trigger.sent) * 100) : 0;
                const isActive = selected?.id === trigger.id;
                return (
                  <motion.div key={trigger.id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.03 }}
                    onClick={() => setSelected(isActive ? null : trigger)}
                    className="flex items-center gap-4 rounded-2xl px-5 py-4 cursor-pointer transition-all"
                    style={{
                      background: isActive ? 'rgba(0,201,160,.05)' : BG,
                      border: `1px solid ${isActive ? 'rgba(0,201,160,.25)' : BORDER}`,
                    }}>
                    {/* Canal */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${ch.color}15`, border: `1px solid ${ch.color}30` }}>
                      <ch.icon size={16} style={{ color: ch.color }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold truncate" style={{ color: TEXT_HI }}>{trigger.name}</p>
                        <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: ch.color }}>{ch.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ZapIcon size={9} style={{ color: TEXT_DIM }} />
                        <p className="text-[10px]" style={{ color: TEXT_DIM }}>{triggerLabel(trigger.event_trigger)}</p>
                        {trigger.delay_type !== 'inmediato' && (
                          <>
                            <span style={{ color: BORDER }}>·</span>
                            <p className="text-[10px]" style={{ color: TEXT_DIM }}>
                              {trigger.delay_days}d {trigger.delay_type === 'antes' ? 'antes' : 'después'}
                            </p>
                          </>
                        )}
                        {trigger.last_sent && (
                          <>
                            <span style={{ color: BORDER }}>·</span>
                            <p className="text-[10px]" style={{ color: TEXT_DIM }}>
                              Último: {new Date(trigger.last_sent).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    {trigger.sent > 0 ? (
                      <div className="flex items-center gap-5 shrink-0">
                        <div className="text-center">
                          <p className="text-xs font-bold tabular-nums" style={{ color: TEXT_HI }}>{trigger.sent}</p>
                          <p className="text-[9px]" style={{ color: TEXT_DIM }}>enviados</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold tabular-nums" style={{ color: ACCENT }}>{pctOpen}%</p>
                          <p className="text-[9px]" style={{ color: TEXT_DIM }}>apertura</p>
                        </div>
                        <div className="w-16">
                          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: BORDER }}>
                            <div className="h-full rounded-full" style={{ width: `${pctOpen}%`, background: ACCENT }} />
                          </div>
                        </div>
                      </div>
                    ) : <div className="w-36 shrink-0" />}

                    {/* Estado + acciones */}
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                        style={{ color: st.color, background: st.bg }}>
                        <st.icon size={10} /> {st.label}
                      </span>
                      <button onClick={() => toggleStatus(trigger.id)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-all"
                        style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}>
                        {trigger.status === 'activo' ? <PauseIcon size={10} /> : <PlayIcon size={10} />}
                        {trigger.status === 'activo' ? 'Pausar' : 'Activar'}
                      </button>
                      <button onClick={() => openEdit(trigger)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                        style={{ background: '#182d47', border: `1px solid ${BORDER}` }}>
                        <PencilIcon size={11} style={{ color: TEXT_LO }} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              {filtered.length === 0 && (
                <div className="rounded-2xl py-12 text-center" style={{ background: BG, border: `1px dashed ${BORDER}` }}>
                  <p className="text-sm" style={{ color: TEXT_DIM }}>Sin triggers en este estado.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Webhooks ─────────────────────────────────────── */}
          {tab === 'webhooks' && (
            <div className="space-y-3">
              <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(91,138,240,.06)', border: '1px solid rgba(91,138,240,.2)' }}>
                <InfoIcon size={13} style={{ color: '#5B8AF0', flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs" style={{ color: TEXT_LO }}>
                  Los webhooks envían datos en tiempo real a sistemas externos (GoHighLevel, Zapier, Make, etc.) cada vez que ocurre un evento en el sistema.
                </p>
              </div>
              {WEBHOOKS.map(wh => (
                <div key={wh.id} className="rounded-2xl px-5 py-4" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgba(0,201,160,.1)' }}>
                        <WebhookIcon size={14} style={{ color: ACCENT }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: TEXT_HI }}>{wh.name}</p>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: 'rgba(0,201,160,.12)', color: ACCENT }}>
                          Activo
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold"
                        style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}>
                        <ExternalLinkIcon size={10} /> Ver logs
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] font-mono mt-2 mb-2 truncate px-2 py-1.5 rounded-lg" style={{ background: BG_DEEP, color: TEXT_DIM }}>{wh.endpoint}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {wh.events.map(ev => (
                      <span key={ev} className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: '#182d47', color: TEXT_LO }}>
                        {triggerLabel(ev)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <button className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-xs font-semibold"
                style={{ background: BG, border: `1px dashed ${BORDER}`, color: TEXT_DIM }}>
                <PlusIcon size={13} /> Agregar webhook
              </button>
            </div>
          )}
        </div>

        {/* ── Panel detalle trigger ─────────────────────────── */}
        <AnimatePresence>
          {selected && tab === 'triggers' && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 290 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="shrink-0 overflow-hidden rounded-2xl"
              style={{ background: BG, border: `1px solid ${BORDER}` }}>
              <div className="p-5 overflow-y-auto" style={{ maxHeight: '75vh' }}>
                {/* Cabecera panel */}
                <div className="flex items-center gap-2 mb-4">
                  {(() => { const ch = CHANNEL_CFG[selected.channel]; return (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${ch.color}15` }}>
                      <ch.icon size={14} style={{ color: ch.color }} />
                    </div>
                  ); })()}
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight truncate" style={{ color: TEXT_HI }}>{selected.name}</p>
                    <p className="text-[10px]" style={{ color: TEXT_DIM }}>{CHANNEL_CFG[selected.channel].label}</p>
                  </div>
                </div>

                {/* Stats */}
                {selected.sent > 0 && (
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    {([
                      ['Enviados', selected.sent, '#5B8AF0'],
                      ['Abiertos', selected.opened, ACCENT],
                    ] as [string, number, string][]).map(([l, v, c]) => (
                      <div key={l} className="rounded-xl p-3 text-center" style={{ background: BG_DEEP }}>
                        <p className="text-lg font-bold tabular-nums" style={{ color: c }}>{v}</p>
                        <p className="text-[9px]" style={{ color: TEXT_DIM }}>{l}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Trigger info */}
                <div className="mb-4 space-y-2 rounded-xl p-3" style={{ background: BG_DEEP }}>
                  <div className="flex items-center gap-2">
                    <ZapIcon size={11} style={{ color: TEXT_DIM }} />
                    <p className="text-xs" style={{ color: TEXT_LO }}>{triggerLabel(selected.event_trigger)}</p>
                  </div>
                  {selected.delay_type !== 'inmediato' && (
                    <div className="flex items-center gap-2">
                      <ClockIcon size={11} style={{ color: TEXT_DIM }} />
                      <p className="text-xs" style={{ color: TEXT_LO }}>{selected.delay_days} días {selected.delay_type}</p>
                    </div>
                  )}
                </div>

                {/* Vista previa del template */}
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: TEXT_DIM }}>Vista previa del mensaje</p>
                {selected.subject && (
                  <p className="text-xs font-semibold mb-1.5" style={{ color: TEXT_HI }}>
                    Asunto: {selected.subject}
                  </p>
                )}
                <div className="rounded-xl p-3 text-xs whitespace-pre-wrap leading-relaxed mb-4"
                  style={{ background: BG_DEEP, color: TEXT_LO, fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>
                  {selected.body}
                </div>

                {/* Variables disponibles */}
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: TEXT_DIM }}>Variables</p>
                <div className="flex flex-wrap gap-1 mb-5">
                  {['{{nombre}}', '{{evento}}', '{{fecha}}', '{{lugar}}', '{{hora}}', '{{qr_link}}', '{{qr_image}}'].map(v => (
                    <span key={v} className="rounded-full px-2 py-0.5 text-[9px] font-mono"
                      style={{ background: '#182d47', color: '#5B8AF0' }}>{v}</span>
                  ))}
                </div>

                {/* Acciones */}
                <div className="space-y-2">
                  <button onClick={() => handleTest(selected.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all"
                    style={{ background: testSent === selected.id ? 'rgba(0,201,160,.18)' : 'rgba(0,201,160,.08)', color: ACCENT, border: `1px solid rgba(0,201,160,.2)` }}>
                    <SendIcon size={12} />
                    {testSent === selected.id ? '¡Enviado a tu correo!' : 'Enviar prueba'}
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => openEdit(selected)}
                      className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold"
                      style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}>
                      <PencilIcon size={11} /> Editar
                    </button>
                    <button onClick={() => handleDuplicate(selected)}
                      className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold"
                      style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}>
                      <CopyIcon size={11} /> Duplicar
                    </button>
                  </div>
                  <button onClick={() => handleDelete(selected.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold"
                    style={{ background: 'rgba(242,68,99,.06)', color: '#F24463', border: '1px solid rgba(242,68,99,.2)' }}>
                    <TrashIcon size={11} /> Eliminar trigger
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modal crear / editar ─────────────────────────────── */}
      <NovoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar trigger' : 'Nuevo trigger'}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={handleSave} >
              {editing ? 'Guardar cambios' : 'Crear trigger'}
            </ModalBtn>
          </>
        }>

        <FormSection title="Información básica">
          <FormField label="Nombre del trigger">
            <FormInput value={form.name} onChange={f('name')} placeholder="Confirmación de inscripción…" />
          </FormField>
          <FormField label="Canal de envío">
            <FormSelect value={form.channel} onChange={f('channel')} options={[
              { value: 'email',    label: 'Email' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'sms',      label: 'SMS' },
            ]} />
          </FormField>
        </FormSection>

        <FormSection title="Disparador y momento">
          <FormField label="Evento que activa el envío">
            <FormSelect value={form.event_trigger} onChange={f('event_trigger')}
              options={TRIGGER_EVENTS.map(e => ({ value: e.value, label: e.label }))} />
          </FormField>
          <FormField label="Momento de envío">
            <FormSelect value={form.delay_type} onChange={f('delay_type')} options={[
              { value: 'inmediato', label: 'Inmediato (al ocurrir el evento)' },
              { value: 'antes',     label: 'Días antes del evento' },
              { value: 'despues',   label: 'Días después del evento' },
            ]} />
          </FormField>
          {form.delay_type !== 'inmediato' && (
            <FormField label="Cantidad de días">
              <FormInput type="number" value={String(form.delay_days)} onChange={v => setForm(p => ({ ...p, delay_days: Number(v) }))} placeholder="1" />
            </FormField>
          )}
        </FormSection>

        <FormSection title="Contenido del mensaje">
          {form.channel === 'email' && (
            <FormField label="Asunto del email">
              <FormInput value={form.subject ?? ''} onChange={f('subject')} placeholder="¡Tu inscripción está confirmada!" />
            </FormField>
          )}
          <FormField label="Cuerpo del mensaje" hint="Variables: {{nombre}}, {{evento}}, {{fecha}}, {{lugar}}, {{hora}}, {{qr_link}}">
            <FormTextarea value={form.body} onChange={f('body')} rows={6}
              placeholder={`Hola {{nombre}},\n\nTu inscripción a {{evento}} está confirmada.\n\n¡Nos vemos pronto!`} />
          </FormField>
        </FormSection>

        <FormSection title="Estado inicial">
          <FormField label="Estado del trigger">
            <FormSelect value={form.status} onChange={f('status')} options={[
              { value: 'activo',  label: 'Activo — comenzará a enviar de inmediato' },
              { value: 'pausado', label: 'Pausado — guardado, sin envíos' },
            ]} />
          </FormField>
        </FormSection>
      </NovoModal>
    </div>
  );
}
