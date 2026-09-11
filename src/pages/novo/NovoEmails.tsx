import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MailIcon, SendIcon, BellIcon, CheckCircleIcon, PauseCircleIcon,
  PaperclipIcon, UsersIcon, BuildingIcon,
} from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { FormField, FormInput, FormTextarea } from '../../components/novo/ui/NovoModal';
import { usePlatform } from '../../contexts/PlatformContext';
import {
  EMAIL_SAMPLE_VARS, EMAIL_VAR_HINTS, enqueueDueReminders, enqueueEmail,
  interpolateEmail, listEmailOutbox, listEmailTemplates, updateEmailTemplate,
  type EmailAudience, type EmailOutboxRow, type EmailTemplate,
} from '../../lib/novo/emailTemplates';

const BG = '#112035';
const BORDER = '#1e3450';
const ACCENT = '#00C9A0';
const TEXT_HI = '#E1EAF4';
const TEXT_LO = '#7A9CB8';
const TEXT_DIM = '#3A5470';

const AUDIENCE_LABEL: Record<EmailAudience, string> = {
  cliente: 'Clientes (asistentes)',
  empresa: 'Empresas y aliados',
};

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

export function NovoEmails() {
  const { session } = usePlatform();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [outbox, setOutbox] = useState<EmailOutboxRow[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [testTo, setTestTo] = useState(session?.email ?? '');
  const [audienceFilter, setAudienceFilter] = useState<EmailAudience | 'todos'>('todos');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = templates.find((t) => t.key === selectedKey) ?? null;
  const dirty = Boolean(selected && (subject !== selected.subject || body !== selected.body_html));

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tpl, box] = await Promise.all([listEmailTemplates(), listEmailOutbox(20)]);
      setTemplates(tpl);
      setOutbox(box);
      setSelectedKey((current) => current && tpl.some((t) => t.key === current) ? current : tpl[0]?.key ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las plantillas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (session?.email && !testTo) setTestTo(session.email);
  }, [session?.email, testTo]);
  useEffect(() => {
    if (!selected) return;
    setSubject(selected.subject);
    setBody(selected.body_html);
  }, [selected?.key]);

  const visible = useMemo(
    () => audienceFilter === 'todos' ? templates : templates.filter((t) => t.audience === audienceFilter),
    [templates, audienceFilter],
  );
  const grouped = useMemo(() => {
    const map: Record<EmailAudience, EmailTemplate[]> = { cliente: [], empresa: [] };
    for (const t of visible) map[t.audience].push(t);
    return map;
  }, [visible]);

  const previewSubject = interpolateEmail(subject);
  const previewBody = interpolateEmail(body);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateEmailTemplate(selected.key, { subject, body_html: body });
      setTemplates((prev) => prev.map((t) => t.key === selected.key
        ? { ...t, subject, body_html: body, updated_at: new Date().toISOString() }
        : t));
      setMessage('Plantilla guardada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (tpl: EmailTemplate) => {
    const next = !tpl.enabled;
    setTemplates((prev) => prev.map((t) => t.key === tpl.key ? { ...t, enabled: next } : t));
    try {
      await updateEmailTemplate(tpl.key, { enabled: next });
    } catch (err) {
      setTemplates((prev) => prev.map((t) => t.key === tpl.key ? { ...t, enabled: tpl.enabled } : t));
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado.');
    }
  };

  const sendTest = async () => {
    if (!selected || !testTo.trim()) return;
    setTesting(true);
    setError(null);
    setMessage(null);
    try {
      const id = await enqueueEmail(selected.key, testTo.trim());
      if (!id) {
        setError('No se encoló el envío. Revisa que la plantilla esté activa y el correo sea válido.');
        return;
      }
      setMessage(`Prueba encolada hacia ${testTo.trim()}. Llega en unos segundos si Resend está configurado.`);
      setOutbox(await listEmailOutbox(20));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la prueba.');
    } finally {
      setTesting(false);
    }
  };

  const sendReminders = async () => {
    setReminding(true);
    setError(null);
    setMessage(null);
    try {
      const n = await enqueueDueReminders();
      setMessage(n === 0
        ? 'No hay inscripciones confirmadas a 7 días o 1 día del evento.'
        : `Se encolaron ${n} recordatorio${n === 1 ? '' : 's'}.`);
      setOutbox(await listEmailOutbox(20));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron encolar los recordatorios.');
    } finally {
      setReminding(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Ecosistema</p>
          <h1 className="text-xl font-bold" style={{ color: TEXT_HI, fontFamily: "'Sora', sans-serif" }}>Correos</h1>
          <p className="mt-0.5 text-sm" style={{ color: TEXT_LO }}>
            Plantillas transaccionales de asistentes y aliados. Se envían solas cuando cambia el estado.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { void sendReminders(); }}
          disabled={reminding}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-50"
          style={{ background: 'rgba(91,138,240,.12)', color: '#5B8AF0', border: '1px solid rgba(91,138,240,.25)' }}
        >
          <BellIcon size={13} />
          {reminding ? 'Encolando…' : 'Enviar recordatorios de hoy'}
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICard label="Plantillas" value={templates.length.toString()} icon={MailIcon} accent={ACCENT} />
        <KPICard label="Activas" value={templates.filter((t) => t.enabled).length.toString()} icon={CheckCircleIcon} accent="#5B8AF0" delay={0.05} />
        <KPICard label="Clientes" value={templates.filter((t) => t.audience === 'cliente').length.toString()} icon={UsersIcon} accent="#A78BFA" delay={0.1} />
        <KPICard label="Empresas" value={templates.filter((t) => t.audience === 'empresa').length.toString()} icon={BuildingIcon} accent="#F59E0B" delay={0.15} />
      </div>

      {(error || message) && (
        <p className="mb-4 text-sm" style={{ color: error ? '#F24463' : ACCENT }}>{error ?? message}</p>
      )}

      <div className="mb-4 flex gap-2">
        {(['todos', 'cliente', 'empresa'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setAudienceFilter(id)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{
              color: audienceFilter === id ? '#fff' : TEXT_LO,
              background: audienceFilter === id ? 'rgba(0,201,160,.18)' : BG,
              border: `1px solid ${audienceFilter === id ? 'rgba(0,201,160,.35)' : BORDER}`,
            }}
          >
            {id === 'todos' ? 'Todas' : AUDIENCE_LABEL[id]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: TEXT_LO }}>Cargando plantillas…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-5">
            {(['cliente', 'empresa'] as const).map((audience) => (
              grouped[audience].length === 0 ? null : (
                <div key={audience}>
                  <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_DIM }}>
                    {AUDIENCE_LABEL[audience]}
                  </p>
                  <ul className="space-y-1">
                    {grouped[audience].map((tpl) => {
                      const active = tpl.key === selectedKey;
                      return (
                        <li key={tpl.key}>
                          <button
                            type="button"
                            onClick={() => setSelectedKey(tpl.key)}
                            className="w-full rounded-xl px-3 py-2.5 text-left"
                            style={{
                              background: active ? 'rgba(0,201,160,.12)' : BG,
                              border: `1px solid ${active ? 'rgba(0,201,160,.35)' : BORDER}`,
                            }}
                          >
                            <span className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium" style={{ color: TEXT_HI }}>{tpl.name}</span>
                              {!tpl.enabled && <PauseCircleIcon size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-snug" style={{ color: TEXT_LO }}>{tpl.description}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )
            ))}
          </div>

          {selected && (
            <motion.div
              key={selected.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5"
              style={{ background: BG, border: `1px solid ${BORDER}` }}
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold" style={{ color: TEXT_HI }}>{selected.name}</h2>
                  <p className="mt-1 text-xs" style={{ color: TEXT_LO }}>{selected.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { void toggleEnabled(selected); }}
                  className="rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{
                    color: selected.enabled ? ACCENT : '#F59E0B',
                    background: selected.enabled ? 'rgba(0,201,160,.12)' : 'rgba(245,158,11,.12)',
                    border: `1px solid ${selected.enabled ? 'rgba(0,201,160,.25)' : 'rgba(245,158,11,.25)'}`,
                  }}
                >
                  {selected.enabled ? 'Activa' : 'Pausada'}
                </button>
              </div>

              {selected.attach_ticket_pdf && (
                <p className="mb-4 flex items-center gap-2 text-xs" style={{ color: '#5B8AF0' }}>
                  <PaperclipIcon size={13} /> Adjunta un PDF con el ticket y el QR al enviar.
                </p>
              )}

              <div className="space-y-4">
                <FormField label="Asunto">
                  <FormInput value={subject} onChange={setSubject} placeholder="Asunto del correo" />
                </FormField>
                <FormField label="Cuerpo HTML" hint={`Variables: ${EMAIL_VAR_HINTS.join(' ')}`}>
                  <FormTextarea value={body} onChange={setBody} rows={12} placeholder="<p>Hola {{nombre}}…</p>" />
                </FormField>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => { void save(); }}
                  disabled={saving || !dirty}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: ACCENT }}
                >
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
                <div className="w-56">
                  <FormInput value={testTo} onChange={setTestTo} placeholder="correo@prueba.com" />
                </div>
                <button
                  type="button"
                  onClick={() => { void sendTest(); }}
                  disabled={testing || !selected.enabled || !testTo.trim()}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-50"
                  style={{ background: 'rgba(91,138,240,.12)', color: '#5B8AF0', border: '1px solid rgba(91,138,240,.25)' }}
                >
                  <SendIcon size={12} />
                  {testing ? 'Enviando…' : 'Enviar prueba'}
                </button>
              </div>

              <div className="mt-6 rounded-xl p-4" style={{ background: '#0d1829', border: `1px solid ${BORDER}` }}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_DIM }}>Vista previa</p>
                <p className="mb-3 text-sm font-semibold" style={{ color: TEXT_HI }}>{previewSubject}</p>
                <div
                  className="prose prose-invert max-w-none text-sm"
                  style={{ color: TEXT_LO }}
                  dangerouslySetInnerHTML={{ __html: previewBody }}
                />
              </div>
            </motion.div>
          )}
        </div>
      )}

      <div className="mt-8">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_DIM }}>Últimos envíos</p>
        {outbox.length === 0 ? (
          <p className="text-sm" style={{ color: TEXT_LO }}>Todavía no hay correos en cola.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${BORDER}` }}>
            <table className="w-full text-left text-sm">
              <thead style={{ background: BG, color: TEXT_DIM }}>
                <tr className="text-[10px] uppercase tracking-widest">
                  <th className="px-4 py-2.5 font-semibold">Plantilla</th>
                  <th className="px-4 py-2.5 font-semibold">Para</th>
                  <th className="px-4 py-2.5 font-semibold">Estado</th>
                  <th className="px-4 py-2.5 font-semibold">Cuándo</th>
                </tr>
              </thead>
              <tbody>
                {outbox.map((row) => (
                  <tr key={row.id} style={{ borderTop: `1px solid ${BORDER}`, color: TEXT_HI }}>
                    <td className="px-4 py-2.5">{templates.find((t) => t.key === row.template_key)?.name ?? row.template_key}</td>
                    <td className="px-4 py-2.5" style={{ color: TEXT_LO }}>{row.to_email}</td>
                    <td className="px-4 py-2.5">
                      <span style={{ color: STATUS_COLOR[row.status] }}>{STATUS_LABEL[row.status]}</span>
                      {row.error && <span className="ml-2 text-[11px]" style={{ color: '#F24463' }}>{row.error}</span>}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: TEXT_LO }}>
                      {new Date(row.created_at).toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
