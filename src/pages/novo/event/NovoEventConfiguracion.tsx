import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SettingsIcon, SaveIcon, TargetIcon, ShieldIcon, QrCodeIcon,
  AwardIcon, LockIcon, AlertTriangleIcon, CheckCircleIcon,
  XCircleIcon, AlertCircleIcon, CopyIcon, ArchiveIcon, BanIcon,
  TrendingUpIcon, UsersIcon, DollarSignIcon, PresentationIcon,
} from 'lucide-react';
import type { NovoEventOutlet } from '../../../types/novo';
import { duplicateEvent, DEFAULT_EVENT_SECTIONS, getEventSettings, patchEvent, upsertEventSettings } from '../../../lib/novo/events';

interface EventContext extends NovoEventOutlet {}

/* ── Paleta ─────────────────────────────────────────────── */
const BG      = '#112035';
const BG_DEEP = '#0d1829';
const BORDER  = '#1e3450';
const BORDER2 = '#1a2e45';
const ACCENT  = '#00C9A0';
const TEXT_HI = '#E1EAF4';
const TEXT_LO = '#7A9CB8';
const TEXT_DIM = '#2a4a6b';
const DANGER  = '#F24463';
const WARN    = '#F59E0B';

/* ── Primitivos ──────────────────────────────────────────── */
function SLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: TEXT_DIM }}>{children}</p>;
}

function SInput({ value, onChange, placeholder, type = 'text', suffix }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; suffix?: string;
}) {
  return (
    <div className="relative">
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
        style={{ background: BG_DEEP, border: `1px solid ${BORDER}`, color: TEXT_HI, paddingRight: suffix ? '2.5rem' : undefined }}
        onFocus={e => (e.currentTarget.style.borderColor = `${ACCENT}50`)}
        onBlur={e  => (e.currentTarget.style.borderColor = BORDER)} />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: TEXT_DIM }}>{suffix}</span>}
    </div>
  );
}

function SSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none appearance-none"
      style={{ background: BG_DEEP, border: `1px solid ${BORDER}`, color: TEXT_HI }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <SLabel>{label}</SLabel>
      {children}
      {hint && <p className="text-[10px] mt-1.5" style={{ color: TEXT_DIM }}>{hint}</p>}
    </div>
  );
}

function Toggle({ label, desc, on, onChange, warn }: {
  label: string; desc?: string; on: boolean; onChange: (v: boolean) => void; warn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3" style={{ borderBottom: `1px solid ${BORDER2}` }}>
      <div>
        <p className="text-sm" style={{ color: warn && on ? WARN : TEXT_LO }}>{label}</p>
        {desc && <p className="text-[10px] mt-0.5" style={{ color: TEXT_DIM }}>{desc}</p>}
      </div>
      <button onClick={() => onChange(!on)}
        className="relative h-5 w-9 rounded-full transition-colors shrink-0"
        style={{ background: on ? (warn ? WARN : ACCENT) : '#1e3450' }}>
        <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
          style={{ left: on ? 'calc(100% - 18px)' : '2px' }} />
      </button>
    </div>
  );
}

function SectionCard({ title, icon: Icon, iconColor = TEXT_LO, children }: {
  title: string; icon: React.ElementType; iconColor?: string; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl p-5" style={{ background: BG, border: `1px solid ${BORDER}` }}>
      <p className="text-xs font-bold mb-5 flex items-center gap-2" style={{ color: TEXT_HI }}>
        <Icon size={13} style={{ color: iconColor }} /> {title}
      </p>
      {children}
    </section>
  );
}

/* ── Mini KPI card ────────────────────────────────────────── */
function KpiCard({ label, current, target, icon: Icon, color, format }: {
  label: string; current: number; target: number;
  icon: React.ElementType; color: string;
  format?: (n: number) => string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const fmt = format ?? ((n: number) => n.toLocaleString('es-CO'));
  return (
    <div className="rounded-xl p-4" style={{ background: BG_DEEP, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${color}15` }}>
          <Icon size={13} style={{ color }} />
        </div>
        <span className="text-[10px] font-bold" style={{ color: pct >= 100 ? ACCENT : pct >= 60 ? WARN : TEXT_DIM }}>
          {pct}%
        </span>
      </div>
      <p className="text-lg font-bold tabular-nums" style={{ color: TEXT_HI }}>{fmt(current)}</p>
      <p className="text-[10px]" style={{ color: TEXT_DIM }}>{label} · meta {fmt(target)}</p>
      <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: BORDER }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: pct >= 100 ? ACCENT : WARN }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
const INIT_ACCESS = {
  registro_publico:    true,
  lista_espera:        true,
  requiere_aprobacion: false,
  permite_invitados:   false,
  alerta_capacidad:    true,
};

const INIT_QR = {
  check_in:           true,
  sesiones:           true,
  stands:             false,
  patrocinadores:     false,
  validacion_id:      false,
};

const INIT_PRIVACY = {
  compartir_patrocinadores: false,
  grabar_sesiones:          false,
  fotografia_asistentes:    true,
  almacenar_nit:            false,
  newsletter:               true,
  retener_datos_meses:      '12',
};

const INIT_CERT = {
  horas_credito:  '8',
  firmante_nombre: '',
  firmante_cargo:  '',
  auto_envio:     false,
  dias_espera:    '3',
  template:       'clasico',
};

type OpsCustom = {
  access: typeof INIT_ACCESS;
  qr: typeof INIT_QR;
  qrTipo: 'unico' | 'tipo';
  privacy: typeof INIT_PRIVACY;
  cert: typeof INIT_CERT;
  alertaPorc: string;
};

export function NovoEventConfiguracion() {
  const { event, onEventChange } = useOutletContext<EventContext>();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error, setError]   = useState<string | null>(null);

  /* ── Metas / KPIs ─────────────────────────────────────── */
  const [goals, setGoals] = useState({
    registros:    String(event.goals?.registros    ?? ''),
    ingresos:     String(event.goals?.ingresos     ?? ''),
    ponentes:     String(event.goals?.ponentes      ?? ''),
    stands:       String(event.goals?.stands        ?? ''),
    patrocinadores: String(event.goals?.patrocinadores ?? ''),
  });

  /* ── Capacidad y acceso ─────────────────────────────────── */
  const [capacity, setCapacity]       = useState(String(event.max_capacity ?? ''));
  const [alertaPorc, setAlertaPorc]   = useState('85');

  /* ── Flags de acceso ───────────────────────────────────── */
  const [access, setAccess] = useState(INIT_ACCESS);

  /* ── QR e interacciones ─────────────────────────────────── */
  const [qr, setQr] = useState(INIT_QR);
  const [qrTipo, setQrTipo] = useState<'unico' | 'tipo'>('unico');

  /* ── Privacidad y consentimientos ──────────────────────── */
  const [privacy, setPrivacy] = useState(INIT_PRIVACY);

  /* ── Certificado ────────────────────────────────────────── */
  const [cert, setCert] = useState(INIT_CERT);
  const certUpdate = (k: keyof typeof cert) => (v: string | boolean) =>
    setCert(p => ({ ...p, [k]: v }));

  useEffect(() => {
    getEventSettings(event.id).then(row => {
      const ops = row?.custom.ops as OpsCustom | undefined;
      if (!ops) return;
      if (ops.access) setAccess({ ...INIT_ACCESS, ...ops.access });
      if (ops.qr) setQr({ ...INIT_QR, ...ops.qr });
      if (ops.qrTipo) setQrTipo(ops.qrTipo);
      if (ops.privacy) setPrivacy({ ...INIT_PRIVACY, ...ops.privacy });
      if (ops.cert) setCert({ ...INIT_CERT, ...ops.cert });
      if (ops.alertaPorc) setAlertaPorc(ops.alertaPorc);
    }).catch(() => { /* defaults */ });
  }, [event.id]);

  /* ── Danger zone ────────────────────────────────────────── */
  const [dangerAction, setDangerAction] = useState<null | 'archivar' | 'cancelar' | 'duplicar'>(null);

  /* ── Save ───────────────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const nextGoals = {
        registros: Number(goals.registros) || 0,
        ingresos: Number(goals.ingresos) || 0,
        ponentes: Number(goals.ponentes) || 0,
        stands: Number(goals.stands) || 0,
        patrocinadores: Number(goals.patrocinadores) || 0,
      };
      const savedEvent = await patchEvent(event.id, {
        max_capacity: capacity ? Number(capacity) : null,
        goals: nextGoals,
      });
      onEventChange(savedEvent);
      const current = await getEventSettings(event.id);
      await upsertEventSettings(event.id, {
        sections: current?.sections ?? DEFAULT_EVENT_SECTIONS,
        custom: {
          ...(current?.custom ?? {}),
          ops: { access, qr, qrTipo, privacy, cert, alertaPorc } satisfies OpsCustom,
        },
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDanger = async () => {
    if (!dangerAction) return;
    setError(null);
    try {
      if (dangerAction === 'duplicar') {
        const copy = await duplicateEvent(event);
        setDangerAction(null);
        navigate(`/novo/eventos/${copy.id}/configuracion`);
        return;
      }
      const status = dangerAction === 'archivar' ? 'archivado' : 'cancelado';
      const savedEvent = await patchEvent(event.id, { operational_status: status });
      onEventChange(savedEvent);
      setDangerAction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la acción.');
      setDangerAction(null);
    }
  };

  /* ── Checklist ──────────────────────────────────────────── */
  const checklist = [
    { label: 'Capacidad configurada',       ok: Number(capacity) > 0 },
    { label: 'Meta de registros definida',  ok: Number(goals.registros) > 0 },
    { label: 'Meta de ingresos definida',   ok: Number(goals.ingresos)  > 0 },
    { label: 'QR de check-in activo',       ok: qr.check_in },
    { label: 'Alerta de capacidad',         ok: access.alerta_capacidad },
    { label: 'Firmante de certificado',     ok: cert.firmante_nombre.trim().length > 0 },
    { label: 'Política de retención datos', ok: Number(privacy.retener_datos_meses) > 0 },
  ];
  const checkOk = checklist.filter(c => c.ok).length;

  /* ── Datos actuales simulados (para KPIs) ───────────────── */
  const current = {
    registros:      event.registrations_count ?? 0,
    ingresos:       (event.registrations_count ?? 0) * 120000,
    ponentes:       event.speakers_count ?? 0,
    stands:         event.stands_count ?? 0,
    patrocinadores: event.sponsors_count ?? 0,
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: TEXT_HI, fontFamily: "'Sora', sans-serif" }}>Configuración</h1>
          <p className="text-sm mt-0.5" style={{ color: TEXT_LO }}>Metas · capacidad · QR · privacidad · certificado</p>
        </div>
        <motion.button whileTap={{ scale: 0.96 }} onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
          style={{ background: 'rgba(0,201,160,.12)', color: ACCENT, border: `1px solid rgba(0,201,160,.25)` }}>
          <SaveIcon size={14} />
          {saving ? 'Guardando…' : saved ? '¡Guardado!' : 'Guardar cambios'}
        </motion.button>
      </div>
      {error && <p className="mb-4 text-sm" style={{ color: DANGER }}>{error}</p>}

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 300px' }}>

        {/* ── Columna principal ─────────────────────────────── */}
        <div className="space-y-5 min-w-0">

          {/* KPIs actuales */}
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Registros"     current={current.registros}     target={Number(goals.registros)}     icon={UsersIcon}        color="#5B8AF0" />
            <KpiCard label="Ingresos (COP)" current={current.ingresos}     target={Number(goals.ingresos)}      icon={DollarSignIcon}   color={ACCENT}
              format={n => `$${(n/1000000).toFixed(1)}M`} />
            <KpiCard label="Ponentes"      current={current.ponentes}       target={Number(goals.ponentes)}      icon={PresentationIcon} color="#A78BFA" />
          </div>

          {/* Metas */}
          <SectionCard title="Metas y KPIs del evento" icon={TargetIcon} iconColor={ACCENT}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Meta registros" hint="Inscritos objetivo totales">
                <SInput type="number" value={goals.registros} onChange={v => setGoals(g => ({ ...g, registros: v }))} />
              </Field>
              <Field label="Meta ingresos (COP)" hint="Ingresos totales esperados">
                <SInput type="number" value={goals.ingresos} onChange={v => setGoals(g => ({ ...g, ingresos: v }))} />
              </Field>
              <Field label="Meta ponentes">
                <SInput type="number" value={goals.ponentes} onChange={v => setGoals(g => ({ ...g, ponentes: v }))} />
              </Field>
              <Field label="Meta stands">
                <SInput type="number" value={goals.stands} onChange={v => setGoals(g => ({ ...g, stands: v }))} />
              </Field>
              <Field label="Meta patrocinadores">
                <SInput type="number" value={goals.patrocinadores} onChange={v => setGoals(g => ({ ...g, patrocinadores: v }))} />
              </Field>
            </div>
          </SectionCard>

          {/* Capacidad y acceso */}
          <SectionCard title="Capacidad y control de acceso" icon={SettingsIcon}>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <Field label="Capacidad máxima" hint="0 = sin límite">
                <SInput type="number" value={capacity} onChange={setCapacity} />
              </Field>
              <Field label="Alerta de llenado" hint="Notificar cuando alcance este %">
                <SInput type="number" value={alertaPorc} onChange={setAlertaPorc} suffix="%" />
              </Field>
            </div>
            <Toggle label="Registro público" desc="Sin necesidad de aprobación manual"
              on={access.registro_publico} onChange={v => setAccess(a => ({ ...a, registro_publico: v }))} />
            <Toggle label="Lista de espera activa" desc="Cuando se llene el cupo, se guarda la lista"
              on={access.lista_espera} onChange={v => setAccess(a => ({ ...a, lista_espera: v }))} />
            <Toggle label="Requiere aprobación manual" desc="El admin aprueba cada inscripción" warn
              on={access.requiere_aprobacion} onChange={v => setAccess(a => ({ ...a, requiere_aprobacion: v }))} />
            <Toggle label="Permite acompañantes / invitados"
              on={access.permite_invitados} onChange={v => setAccess(a => ({ ...a, permite_invitados: v }))} />
            <Toggle label="Alerta de capacidad" desc={`Notificar al alcanzar ${alertaPorc}% del aforo`}
              on={access.alerta_capacidad} onChange={v => setAccess(a => ({ ...a, alerta_capacidad: v }))} />
          </SectionCard>

          {/* QR */}
          <SectionCard title="QR e interacciones" icon={QrCodeIcon}>
            <Field label="Modo de QR" hint="Cómo se genera el código de cada asistente">
              <div className="grid grid-cols-2 gap-2">
                {([['unico','QR único por persona'],['tipo','QR por tipo de acceso']] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setQrTipo(v)}
                    className="rounded-xl px-3 py-2.5 text-xs font-semibold transition-all"
                    style={{
                      background: qrTipo === v ? 'rgba(0,201,160,.12)' : BG_DEEP,
                      color: qrTipo === v ? ACCENT : TEXT_LO,
                      border: `1px solid ${qrTipo === v ? 'rgba(0,201,160,.3)' : BORDER}`,
                    }}>
                    {l}
                  </button>
                ))}
              </div>
            </Field>
            <div className="mt-5">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: TEXT_DIM }}>Tipos de escaneo habilitados</p>
              <Toggle label="Check-in / Acreditación" desc="Lectura QR en ingreso al evento"
                on={qr.check_in} onChange={v => setQr(q => ({ ...q, check_in: v }))} />
              <Toggle label="Sesiones individuales" desc="QR por actividad de la agenda"
                on={qr.sesiones} onChange={v => setQr(q => ({ ...q, sesiones: v }))} />
              <Toggle label="Stands de exposición" desc="Escaneo en cada stand"
                on={qr.stands} onChange={v => setQr(q => ({ ...q, stands: v }))} />
              <Toggle label="Patrocinadores" desc="QR de patrocinador para captación de leads"
                on={qr.patrocinadores} onChange={v => setQr(q => ({ ...q, patrocinadores: v }))} />
              <Toggle label="Validación de identidad" desc="Requiere confirmar documento del asistente" warn
                on={qr.validacion_id} onChange={v => setQr(q => ({ ...q, validacion_id: v }))} />
            </div>
          </SectionCard>

          {/* Privacidad */}
          <SectionCard title="Privacidad y consentimientos" icon={LockIcon}>
            <Toggle label="Compartir datos con patrocinadores" desc="El asistente da consentimiento explícito al inscribirse" warn
              on={privacy.compartir_patrocinadores} onChange={v => setPrivacy(p => ({ ...p, compartir_patrocinadores: v }))} />
            <Toggle label="Grabar sesiones" desc="Las conferencias podrán ser grabadas y distribuidas" warn
              on={privacy.grabar_sesiones} onChange={v => setPrivacy(p => ({ ...p, grabar_sesiones: v }))} />
            <Toggle label="Fotografía y material gráfico" desc="Se pueden publicar fotos con asistentes en redes sociales"
              on={privacy.fotografia_asistentes} onChange={v => setPrivacy(p => ({ ...p, fotografia_asistentes: v }))} />
            <Toggle label="Almacenar NIT / identificación"
              on={privacy.almacenar_nit} onChange={v => setPrivacy(p => ({ ...p, almacenar_nit: v }))} />
            <Toggle label="Suscribir a newsletter de EML"
              on={privacy.newsletter} onChange={v => setPrivacy(p => ({ ...p, newsletter: v }))} />
            <div className="mt-4">
              <Field label="Retención de datos (meses)" hint="Tiempo que se conservan los datos del participante">
                <SInput type="number" value={privacy.retener_datos_meses}
                  onChange={v => setPrivacy(p => ({ ...p, retener_datos_meses: v }))} suffix="meses" />
              </Field>
            </div>
          </SectionCard>

          {/* Certificado */}
          <SectionCard title="Certificado de asistencia" icon={AwardIcon} iconColor="#A78BFA">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Plantilla">
                <SSelect value={cert.template} onChange={certUpdate('template')} options={[
                  { value: 'clasico',    label: 'Clásico EML' },
                  { value: 'moderno',   label: 'Moderno' },
                  { value: 'minimalista', label: 'Minimalista' },
                ]} />
              </Field>
              <Field label="Horas de crédito" hint="Para certificaciones CME / equivalentes">
                <SInput type="number" value={cert.horas_credito} onChange={certUpdate('horas_credito')} suffix="h" />
              </Field>
              <Field label="Nombre del firmante">
                <SInput value={cert.firmante_nombre} onChange={certUpdate('firmante_nombre')} placeholder="Dr. Nombre Apellido" />
              </Field>
              <Field label="Cargo del firmante">
                <SInput value={cert.firmante_cargo} onChange={certUpdate('firmante_cargo')} placeholder="Director Científico" />
              </Field>
            </div>
            <Toggle label="Envío automático al finalizar el evento"
              on={cert.auto_envio} onChange={v => certUpdate('auto_envio')(v)} />
            <AnimatePresence>
              {cert.auto_envio && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <div className="pt-4">
                    <Field label="Días de espera post-evento para envío">
                      <SInput type="number" value={cert.dias_espera} onChange={certUpdate('dias_espera')} suffix="días" />
                    </Field>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>

          {/* Zona peligrosa */}
          <section className="rounded-2xl p-5" style={{ background: 'rgba(242,68,99,.04)', border: `1px solid rgba(242,68,99,.15)` }}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangleIcon size={13} style={{ color: DANGER }} />
              <p className="text-xs font-bold" style={{ color: DANGER }}>Zona peligrosa</p>
            </div>
            <p className="text-[10px] mb-4" style={{ color: TEXT_LO }}>Estas acciones afectan la disponibilidad del evento y en algunos casos son irreversibles.</p>

            <div className="space-y-2">
              {/* Duplicar */}
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: BG_DEEP, border: `1px solid ${BORDER}` }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: TEXT_HI }}>Duplicar evento</p>
                  <p className="text-[10px]" style={{ color: TEXT_DIM }}>Crea una copia borrador con la misma configuración</p>
                </div>
                <button onClick={() => setDangerAction('duplicar')}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}>
                  <CopyIcon size={11} /> Duplicar
                </button>
              </div>

              {/* Archivar */}
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: BG_DEEP, border: `1px solid rgba(245,158,11,.15)` }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: WARN }}>Archivar evento</p>
                  <p className="text-[10px]" style={{ color: TEXT_DIM }}>Lo oculta del panel pero conserva todos los datos</p>
                </div>
                <button onClick={() => setDangerAction('archivar')}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{ background: 'rgba(245,158,11,.08)', color: WARN, border: `1px solid rgba(245,158,11,.2)` }}>
                  <ArchiveIcon size={11} /> Archivar
                </button>
              </div>

              {/* Cancelar */}
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'rgba(242,68,99,.04)', border: `1px solid rgba(242,68,99,.2)` }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: DANGER }}>Cancelar evento</p>
                  <p className="text-[10px]" style={{ color: TEXT_DIM }}>Marca el evento como cancelado. Notifica a inscritos.</p>
                </div>
                <button onClick={() => setDangerAction('cancelar')}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{ background: 'rgba(242,68,99,.08)', color: DANGER, border: `1px solid rgba(242,68,99,.25)` }}>
                  <BanIcon size={11} /> Cancelar
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ── Sidebar ───────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Checklist */}
          <div className="rounded-2xl p-5" style={{ background: BG, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: TEXT_DIM }}>
                <ShieldIcon size={10} /> Checklist
              </p>
              <span className="text-xs font-bold" style={{ color: checkOk === checklist.length ? ACCENT : WARN }}>
                {checkOk}/{checklist.length}
              </span>
            </div>
            <div className="mb-3 h-1 rounded-full overflow-hidden" style={{ background: BORDER }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(checkOk / checklist.length) * 100}%`, background: checkOk === checklist.length ? ACCENT : WARN }} />
            </div>
            {checklist.map((item, i, arr) => (
              <div key={i} className="flex items-center justify-between py-2.5"
                style={{ borderBottom: i < arr.length - 1 ? `1px solid ${BORDER2}` : 'none' }}>
                <p className="text-xs" style={{ color: TEXT_LO }}>{item.label}</p>
                {item.ok
                  ? <CheckCircleIcon size={12} style={{ color: ACCENT }} />
                  : <AlertCircleIcon size={12} style={{ color: WARN }} />}
              </div>
            ))}
          </div>

          {/* Resumen QR */}
          <div className="rounded-2xl p-5" style={{ background: BG, border: `1px solid ${BORDER}` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-1.5" style={{ color: TEXT_DIM }}>
              <QrCodeIcon size={10} /> Interacciones QR
            </p>
            {([
              ['Check-in',       qr.check_in],
              ['Sesiones',       qr.sesiones],
              ['Stands',         qr.stands],
              ['Patrocinadores', qr.patrocinadores],
              ['Validación ID',  qr.validacion_id],
            ] as [string, boolean][]).map(([l, on], i, arr) => (
              <div key={l} className="flex items-center justify-between py-2"
                style={{ borderBottom: i < arr.length - 1 ? `1px solid ${BORDER2}` : 'none' }}>
                <p className="text-xs" style={{ color: TEXT_LO }}>{l}</p>
                {on
                  ? <CheckCircleIcon size={12} style={{ color: ACCENT }} />
                  : <XCircleIcon size={12} style={{ color: TEXT_DIM }} />}
              </div>
            ))}
          </div>

          {/* Capacidad visual */}
          {Number(capacity) > 0 && (
            <div className="rounded-2xl p-5" style={{ background: BG, border: `1px solid ${BORDER}` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: TEXT_DIM }}>Ocupación actual</p>
              <div className="flex items-end justify-between mb-2">
                <p className="text-2xl font-bold tabular-nums" style={{ color: TEXT_HI }}>
                  {current.registros}
                  <span className="text-sm font-normal ml-1" style={{ color: TEXT_DIM }}>/ {capacity}</span>
                </p>
                <p className="text-xs font-bold" style={{ color: ACCENT }}>
                  {Math.min(100, Math.round((current.registros / Number(capacity)) * 100))}%
                </p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: BORDER }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (current.registros / Number(capacity)) * 100)}%`,
                    background: (current.registros / Number(capacity)) > 0.8 ? WARN : ACCENT
                  }} />
              </div>
              <p className="text-[10px] mt-2" style={{ color: TEXT_DIM }}>
                Alerta al {alertaPorc}% · queda {Math.max(0, Number(capacity) - current.registros)} cupos
              </p>
            </div>
          )}

          {/* Certificado resumen */}
          <div className="rounded-2xl p-4" style={{ background: BG, border: `1px solid ${BORDER}` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: TEXT_DIM }}>
              <AwardIcon size={10} /> Certificado
            </p>
            <p className="text-xs font-semibold" style={{ color: TEXT_HI }}>{cert.firmante_nombre || '—'}</p>
            <p className="text-[10px]" style={{ color: TEXT_DIM }}>{cert.firmante_cargo || '—'}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: 'rgba(167,139,250,.12)', color: '#A78BFA' }}>
                {cert.horas_credito}h crédito
              </span>
              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: '#182d47', color: TEXT_DIM }}>
                Plantilla: {cert.template}
              </span>
            </div>
          </div>

          {/* Metas KPI sidebar */}
          <div className="rounded-2xl p-4 space-y-2" style={{ background: BG, border: `1px solid ${BORDER}` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: TEXT_DIM }}>
              <TrendingUpIcon size={10} /> Metas adicionales
            </p>
            {([
              ['Stands',         current.stands,         Number(goals.stands)],
              ['Patrocinadores', current.patrocinadores, Number(goals.patrocinadores)],
              ['Ponentes',       current.ponentes,       Number(goals.ponentes)],
            ] as [string, number, number][]).map(([l, cur, tgt]) => {
              const p = tgt > 0 ? Math.min(100, Math.round((cur / tgt) * 100)) : 0;
              return (
                <div key={l}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span style={{ color: TEXT_LO }}>{l}</span>
                    <span style={{ color: p >= 100 ? ACCENT : TEXT_DIM }}>{cur}/{tgt}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: BORDER }}>
                    <div className="h-full rounded-full" style={{ width: `${p}%`, background: p >= 100 ? ACCENT : '#5B8AF0' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Modal de confirmación danger ─────────────────────── */}
      <AnimatePresence>
        {dangerAction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="rounded-2xl p-6 w-full max-w-sm"
              style={{ background: BG, border: `1px solid ${dangerAction === 'duplicar' ? BORDER : dangerAction === 'archivar' ? 'rgba(245,158,11,.3)' : 'rgba(242,68,99,.3)'}` }}>
              <div className="flex items-center gap-3 mb-3">
                {dangerAction === 'duplicar' && <CopyIcon size={18} style={{ color: TEXT_LO }} />}
                {dangerAction === 'archivar' && <ArchiveIcon size={18} style={{ color: WARN }} />}
                {dangerAction === 'cancelar' && <BanIcon size={18} style={{ color: DANGER }} />}
                <p className="text-base font-bold" style={{ color: dangerAction === 'cancelar' ? DANGER : dangerAction === 'archivar' ? WARN : TEXT_HI }}>
                  {dangerAction === 'duplicar' ? 'Duplicar evento' : dangerAction === 'archivar' ? 'Archivar evento' : 'Cancelar evento'}
                </p>
              </div>
              <p className="text-sm mb-5" style={{ color: TEXT_LO }}>
                {dangerAction === 'duplicar' && 'Se creará una copia del evento con estado "Borrador". Podrás editarla de forma independiente.'}
                {dangerAction === 'archivar' && 'El evento dejará de aparecer en el panel activo pero todos los datos quedan conservados.'}
                {dangerAction === 'cancelar' && 'Esta acción notificará a todos los inscritos y marcará el evento como cancelado. No se puede revertir automáticamente.'}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDangerAction(null)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                  style={{ background: '#182d47', color: TEXT_LO, border: `1px solid ${BORDER}` }}>
                  Cancelar
                </button>
                <button onClick={confirmDanger}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                  style={{
                    background: dangerAction === 'cancelar' ? 'rgba(242,68,99,.12)' : dangerAction === 'archivar' ? 'rgba(245,158,11,.12)' : 'rgba(0,201,160,.12)',
                    color: dangerAction === 'cancelar' ? DANGER : dangerAction === 'archivar' ? WARN : ACCENT,
                    border: `1px solid ${dangerAction === 'cancelar' ? 'rgba(242,68,99,.3)' : dangerAction === 'archivar' ? 'rgba(245,158,11,.3)' : 'rgba(0,201,160,.3)'}`,
                  }}>
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
