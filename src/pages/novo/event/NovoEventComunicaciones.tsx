import React, { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MailIcon, SmartphoneIcon, MessageSquareIcon, WebhookIcon,
  CheckCircleIcon, PauseCircleIcon, SendIcon, ExternalLinkIcon,
  PaperclipIcon, ClockIcon, ZapIcon, InfoIcon,
} from 'lucide-react';
import type { NovoEventOutlet } from '../../../types/novo';
import { usePlatform } from '../../../contexts/PlatformContext';
import { FormInput } from '../../../components/novo/ui/NovoModal';
import {
  EVENT_ATTENDEE_EMAILS, enqueueEmail, eventEmailVars, interpolateEmail,
  listEmailTemplates, listEventEmailOutbox,
  type EmailOutboxRow, type EmailTemplate,
} from '../../../lib/novo/emailTemplates';

type ChannelTab = 'email' | 'whatsapp' | 'sms' | 'webhooks';

const BG = '#112035';
const BG_DEEP = '#0d1829';
const BORDER = '#1e3450';
const ACCENT = '#00C9A0';
const TEXT_HI = '#E1EAF4';
const TEXT_LO = '#7A9CB8';
const TEXT_DIM = '#2a4a6b';

const STATUS_COLOR: Record<EmailOutboxRow['status'], string> = {
  pending: '#F59E0B',
  sent: '#00C9A0',
  error: '#F24463',
  skipped: '#7A9CB8',
};

const STATUS_LABEL: Record<EmailOutboxRow['status'], string> = {
  pending: 'En cola',
  sent: 'Enviado',
  error: 'Error',
  skipped: 'Omitido',
};

const TABS: { id: ChannelTab; label: string; live: boolean; icon: typeof MailIcon }[] = [
  { id: 'email', label: 'Email', live: true, icon: MailIcon },
  { id: 'whatsapp', label: 'WhatsApp', live: false, icon: SmartphoneIcon },
  { id: 'sms', label: 'SMS', live: false, icon: MessageSquareIcon },
  { id: 'webhooks', label: 'Webhooks', live: false, icon: WebhookIcon },
];

const COMING_SOON: Record<Exclude<ChannelTab, 'email'>, { title: string; body: string; items: string[] }> = {
  whatsapp: {
    title: 'WhatsApp',
    body: 'Confirmaciones y recordatorios por WhatsApp Business, con el mismo disparo que el correo.',
    items: ['Plantillas aprobadas por Meta', 'Inscripción confirmada y recordatorio 1 día antes', 'Estado de entrega en esta misma lista'],
  },
  sms: {
    title: 'SMS',
    body: 'Mensajes cortos de respaldo cuando el asistente no abre el correo.',
    items: ['QR / link de acceso', 'Aviso de cambio de sala o horario', 'Tope de caracteres y costo por envío'],
  },
  webhooks: {
    title: 'Webhooks e integraciones',
    body: 'Avisar a GoHighLevel, Zapier o n8n cuando cambia una inscripción o un pago.',
    items: ['registro.confirmado / cancelado', 'pago.recibido', 'Logs de cada llamada'],
  },
};

function ComingSoon({ tab }: { tab: Exclude<ChannelTab, 'email'> }) {
  const copy = COMING_SOON[tab];
  const Icon = TABS.find((t) => t.id === tab)?.icon ?? InfoIcon;
  return (
    <div className="rounded-2xl p-8" style={{ background: BG, border: `1px dashed ${BORDER}` }}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(245,158,11,.12)' }}>
          <Icon size={18} style={{ color: '#F59E0B' }} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: TEXT_HI }}>{copy.title}</p>
          <span className="inline-flex mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(245,158,11,.12)', color: '#F59E0B' }}>
            Próximamente
          </span>
        </div>
      </div>
      <p className="text-sm mb-4" style={{ color: TEXT_LO }}>{copy.body}</p>
      <ul className="space-y-2">
        {copy.items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs" style={{ color: TEXT_DIM }}>
            <ClockIcon size={12} className="mt-0.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NovoEventComunicaciones() {
  const { event } = useOutletContext<NovoEventOutlet>();
  const { session } = usePlatform();
  const [tab, setTab] = useState<ChannelTab>('email');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [outbox, setOutbox] = useState<EmailOutboxRow[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(EVENT_ATTENDEE_EMAILS[0].key);
  const [testTo, setTestTo] = useState(session?.email ?? '');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const vars = useMemo(
    () => eventEmailVars(event, { nombre: session?.name || 'Equipo EML' }),
    [event, session?.name],
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tpl, box] = await Promise.all([
        listEmailTemplates(),
        listEventEmailOutbox(event.id),
      ]);
      setTemplates(tpl);
      setOutbox(box);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los envíos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [event.id]);
  useEffect(() => {
    if (session?.email && !testTo) setTestTo(session.email);
  }, [session?.email, testTo]);

  const flows = EVENT_ATTENDEE_EMAILS.map((flow) => {
    const template = templates.find((t) => t.key === flow.key);
    const rows = outbox.filter((row) => row.template_key === flow.key);
    const sent = rows.filter((row) => row.status === 'sent').length;
    const errors = rows.filter((row) => row.status === 'error').length;
    const last = rows[0]?.created_at;
    return { ...flow, template, sent, errors, last, total: rows.length };
  });

  const selected = flows.find((flow) => flow.key === selectedKey) ?? flows[0];
  const sentTotal = outbox.filter((row) => row.status === 'sent').length;
  const pendingTotal = outbox.filter((row) => row.status === 'pending').length;
  const errorTotal = outbox.filter((row) => row.status === 'error').length;

  const sendTest = async () => {
    if (!selected?.template || !testTo.trim()) return;
    setTesting(true);
    setError(null);
    setMessage(null);
    try {
      const id = await enqueueEmail(selected.key, testTo.trim(), vars);
      if (!id) {
        setError('No se encoló. Revisa que la plantilla esté activa y el correo sea válido.');
        return;
      }
      setMessage(`Prueba encolada hacia ${testTo.trim()}. Llega en unos segundos si Resend está configurado.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la prueba.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: TEXT_HI, fontFamily: "'Sora', sans-serif" }}>Comunicaciones</h1>
          <p className="mt-0.5 text-sm" style={{ color: TEXT_LO }}>
            Correos transaccionales de este evento. WhatsApp, SMS y webhooks vienen después.
          </p>
        </div>
        <Link
          to="/novo/emails"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{ background: 'rgba(0,201,160,.12)', color: ACCENT, border: '1px solid rgba(0,201,160,.2)' }}
        >
          <ExternalLinkIcon size={13} /> Editar plantillas
        </Link>
      </div>

      <div className="mb-4 flex rounded-xl overflow-hidden w-fit" style={{ border: `1px solid ${BORDER}` }}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
            style={{ background: tab === item.id ? '#182d47' : BG, color: tab === item.id ? TEXT_HI : TEXT_DIM }}
          >
            <item.icon size={12} />
            {item.label}
            {!item.live ? (
              <span className="rounded-full px-1.5 py-px text-[8px] font-bold uppercase tracking-wider"
                style={{ background: 'rgba(245,158,11,.15)', color: '#F59E0B' }}>
                Pronto
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab !== 'email' ? <ComingSoon tab={tab} /> : (
        <>
          <div className="mb-5 grid grid-cols-4 gap-3">
            {([
              { label: 'Enviados', value: sentTotal, color: ACCENT },
              { label: 'En cola', value: pendingTotal, color: '#F59E0B' },
              { label: 'Con error', value: errorTotal, color: '#F24463' },
              { label: 'Flujos de email', value: flows.filter((f) => f.template?.enabled).length, color: '#5B8AF0' },
            ] as const).map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: i * 0.04 }}
                className="rounded-2xl p-4" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: TEXT_DIM }}>{stat.label}</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: stat.color }}>{loading ? '…' : stat.value}</p>
              </motion.div>
            ))}
          </div>

          {(error || message) ? (
            <p className="mb-4 text-sm" style={{ color: error ? '#F24463' : ACCENT }}>{error ?? message}</p>
          ) : null}

          {loading ? (
            <p className="text-sm" style={{ color: TEXT_LO }}>Cargando envíos de este evento…</p>
          ) : (
            <div className="flex gap-5">
              <div className="flex-1 min-w-0 space-y-2">
                {flows.map((flow, i) => {
                  const active = selected?.key === flow.key;
                  const enabled = flow.template?.enabled !== false;
                  return (
                    <motion.button
                      key={flow.key}
                      type="button"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: i * 0.03 }}
                      onClick={() => setSelectedKey(flow.key)}
                      className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left"
                      style={{
                        background: active ? 'rgba(0,201,160,.05)' : BG,
                        border: `1px solid ${active ? 'rgba(0,201,160,.25)' : BORDER}`,
                      }}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: 'rgba(91,138,240,.12)', border: '1px solid rgba(91,138,240,.25)' }}>
                        <MailIcon size={16} style={{ color: '#5B8AF0' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-center gap-2">
                          <p className="truncate text-sm font-semibold" style={{ color: TEXT_HI }}>
                            {flow.template?.name ?? flow.key}
                          </p>
                          {flow.template?.attach_ticket_pdf ? <PaperclipIcon size={11} style={{ color: '#5B8AF0' }} /> : null}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ZapIcon size={9} style={{ color: TEXT_DIM }} />
                          <p className="text-[10px]" style={{ color: TEXT_DIM }}>{flow.trigger}</p>
                          {flow.last ? (
                            <>
                              <span style={{ color: BORDER }}>·</span>
                              <p className="text-[10px]" style={{ color: TEXT_DIM }}>
                                Último: {new Date(flow.last).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                              </p>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div className="shrink-0 text-center">
                        <p className="text-xs font-bold tabular-nums" style={{ color: TEXT_HI }}>{flow.sent}</p>
                        <p className="text-[9px]" style={{ color: TEXT_DIM }}>enviados</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                        style={{
                          color: enabled ? ACCENT : '#F59E0B',
                          background: enabled ? 'rgba(0,201,160,.12)' : 'rgba(245,158,11,.12)',
                        }}>
                        {enabled ? <CheckCircleIcon size={10} /> : <PauseCircleIcon size={10} />}
                        {enabled ? 'Activo' : 'Pausado'}
                      </span>
                    </motion.button>
                  );
                })}

                <div className="mt-6">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_DIM }}>
                    Últimos envíos de este evento
                  </p>
                  {outbox.length === 0 ? (
                    <p className="rounded-2xl px-4 py-8 text-center text-sm" style={{ background: BG, border: `1px dashed ${BORDER}`, color: TEXT_DIM }}>
                      Todavía no hay correos ligados a inscripciones de este evento.
                    </p>
                  ) : (
                    <div className="overflow-hidden rounded-2xl" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                      {outbox.slice(0, 12).map((row, i) => (
                        <div key={row.id} className="flex items-center gap-3 px-4 py-3"
                          style={{ borderBottom: i < Math.min(outbox.length, 12) - 1 ? `1px solid ${BORDER}` : 'none' }}>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm" style={{ color: TEXT_HI }}>
                              {templates.find((t) => t.key === row.template_key)?.name ?? row.template_key}
                            </p>
                            <p className="truncate text-[11px]" style={{ color: TEXT_DIM }}>{row.to_email}</p>
                          </div>
                          <span className="text-[11px] font-semibold" style={{ color: STATUS_COLOR[row.status] }}>
                            {STATUS_LABEL[row.status]}
                          </span>
                          <p className="w-28 shrink-0 text-right text-[11px]" style={{ color: TEXT_DIM }}>
                            {new Date(row.created_at).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {selected?.template ? (
                  <motion.div
                    key={selected.key}
                    initial={{ opacity: 0, x: 16, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: 300 }}
                    exit={{ opacity: 0, x: 16, width: 0 }}
                    className="shrink-0 overflow-hidden rounded-2xl"
                    style={{ background: BG, border: `1px solid ${BORDER}` }}
                  >
                    <div className="p-5">
                      <p className="text-sm font-bold" style={{ color: TEXT_HI }}>{selected.template.name}</p>
                      <p className="mt-1 text-[11px]" style={{ color: TEXT_LO }}>{selected.when}</p>
                      {selected.template.attach_ticket_pdf ? (
                        <p className="mt-3 flex items-center gap-1.5 text-[11px]" style={{ color: '#5B8AF0' }}>
                          <PaperclipIcon size={11} /> Adjunta PDF con ticket y QR
                        </p>
                      ) : null}

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-xl p-3 text-center" style={{ background: BG_DEEP }}>
                          <p className="text-lg font-bold tabular-nums" style={{ color: ACCENT }}>{selected.sent}</p>
                          <p className="text-[9px]" style={{ color: TEXT_DIM }}>Enviados</p>
                        </div>
                        <div className="rounded-xl p-3 text-center" style={{ background: BG_DEEP }}>
                          <p className="text-lg font-bold tabular-nums" style={{ color: selected.errors ? '#F24463' : TEXT_HI }}>{selected.errors}</p>
                          <p className="text-[9px]" style={{ color: TEXT_DIM }}>Errores</p>
                        </div>
                      </div>

                      <p className="mt-4 mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_DIM }}>Vista previa</p>
                      <p className="mb-2 text-xs font-semibold" style={{ color: TEXT_HI }}>
                        {interpolateEmail(selected.template.subject, vars)}
                      </p>
                      <div
                        className="mb-4 max-h-40 overflow-y-auto rounded-xl p-3 text-[11px] leading-relaxed"
                        style={{ background: BG_DEEP, color: TEXT_LO }}
                        dangerouslySetInnerHTML={{ __html: interpolateEmail(selected.template.body_html, vars) }}
                      />

                      <p className="mb-2 text-[10px]" style={{ color: TEXT_DIM }}>
                        Activar o editar el contenido se hace en Correos (vale para todos los eventos).
                      </p>
                      <div className="space-y-2">
                        <FormInput value={testTo} onChange={setTestTo} placeholder="correo@prueba.com" />
                        <button
                          type="button"
                          onClick={() => { void sendTest(); }}
                          disabled={testing || !selected.template.enabled || !testTo.trim()}
                          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold disabled:opacity-40"
                          style={{ background: 'rgba(0,201,160,.1)', color: ACCENT, border: '1px solid rgba(0,201,160,.2)' }}
                        >
                          <SendIcon size={12} />
                          {testing ? 'Enviando…' : 'Enviar prueba'}
                        </button>
                        <Link
                          to="/novo/emails"
                          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold"
                          style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}
                        >
                          Abrir en Correos
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}
