import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCodeIcon, CheckCircleIcon, XCircleIcon, LogInIcon, CoffeeIcon,
  UtensilsIcon, GiftIcon, StarIcon, AwardIcon,
} from 'lucide-react';
import { listEvents } from '../../lib/novo/events';
import {
  countTodayScans, listRecentScans, scanPersonQr,
  type ScanInteractionKey, type ScanLogEntry,
} from '../../lib/novo/scanner';
import type { NovoEvent } from '../../types/novo';

const INTERACTION_TYPES: { id: ScanInteractionKey; label: string; emoji: string; rule: string; icon: typeof LogInIcon; color: string }[] = [
  { id: 'entrada',     label: 'Entrada',     emoji: '🚪', rule: 'Una vez',     icon: LogInIcon,    color: '#00C9A0' },
  { id: 'coffee',      label: 'Coffee',      emoji: '☕', rule: 'Una vez/día', icon: CoffeeIcon,   color: '#F59E0B' },
  { id: 'lunch',       label: 'Lunch',       emoji: '🍽',  rule: 'Una vez/día', icon: UtensilsIcon, color: '#FF7043' },
  { id: 'kit',         label: 'Kit',         emoji: '🎁', rule: 'Una vez',     icon: GiftIcon,     color: '#A78BFA' },
  { id: 'vip',         label: 'VIP',         emoji: '⭐', rule: 'Múltiples',   icon: StarIcon,     color: '#5B8AF0' },
  { id: 'certificado', label: 'Certificado', emoji: '📜', rule: 'Una vez',     icon: AwardIcon,    color: '#7A9CB8' },
];

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

const GRADIENTS = [
  'linear-gradient(135deg,#00C9A0,#007AFF)',
  'linear-gradient(135deg,#A78BFA,#5B8AF0)',
  'linear-gradient(135deg,#FF7043,#F59E0B)',
  'linear-gradient(135deg,#5B8AF0,#00C9A0)',
];

function formatAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  if (Math.abs(mins) < 60) return rtf.format(-Math.max(mins, 0), 'minute');
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return rtf.format(-hours, 'hour');
  return rtf.format(-Math.round(hours / 24), 'day');
}

export function NovoScanner() {
  const [events, setEvents] = useState<NovoEvent[]>([]);
  const [eventId, setEventId] = useState('');
  const [activeType, setActiveType] = useState<ScanInteractionKey>('entrada');
  const [token, setToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<{ ok: boolean; name: string; message: string } | null>(null);
  const [log, setLog] = useState<ScanLogEntry[]>([]);
  const [today, setToday] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const selectedEvent = events.find((event) => event.id === eventId);

  const reloadLog = async (id: string) => {
    const [nextLog, nextToday] = await Promise.all([
      listRecentScans(id),
      countTodayScans(id),
    ]);
    setLog(nextLog);
    setToday(nextToday);
  };

  useEffect(() => {
    listEvents().then((rows) => {
      setEvents(rows);
      const live = rows.find((event) => event.operational_status === 'activo')
        ?? rows.find((event) => event.operational_status === 'proximo')
        ?? rows[0];
      if (live) setEventId(live.id);
    }).catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    if (!eventId) return;
    reloadLog(eventId).catch(() => {
      setLog([]);
      setToday({});
    });
  }, [eventId]);

  async function handleScan() {
    if (!eventId || scanning) return;
    setScanning(true);
    setError(null);
    try {
      const outcome = await scanPersonQr({ eventId, token, interaction: activeType });
      setLastResult({ ok: outcome.ok, name: outcome.name, message: outcome.message });
      setToken('');
      await reloadLog(eventId);
      window.setTimeout(() => setLastResult(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el escaneo.');
    } finally {
      setScanning(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>
            QR universal
          </p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>
            Scanner Universal
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#7A9CB8' }}>
            Una persona = un QR permanente · reglas de uso por evento
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <div className="h-2 w-2 rounded-full" style={{ background: '#00C9A0', boxShadow: '0 0 6px #00C9A0' }} />
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="bg-transparent text-sm font-semibold outline-none"
              style={{ color: '#E1EAF4' }}
            >
              {events.length === 0 ? <option value="">Sin eventos</option> : null}
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl px-4 py-2.5 text-xs" style={{ background: 'rgba(242,68,99,.12)', color: '#F24463' }}>{error}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl p-6 flex flex-col items-center gap-5"
            style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <div
              className="relative flex items-center justify-center"
              style={{
                width: 200, height: 200, borderRadius: 20,
                border: `2px solid ${scanning ? '#00C9A0' : '#1e3450'}`,
                background: scanning ? 'rgba(0,201,160,.04)' : '#0d1829',
                transition: 'border-color .3s, background .3s',
              }}
            >
              {[
                { top: -2, left: -2, borderRight: 'none', borderBottom: 'none', borderRadius: '4px 0 0 0' },
                { top: -2, right: -2, borderLeft: 'none', borderBottom: 'none', borderRadius: '0 4px 0 0' },
                { bottom: -2, left: -2, borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 4px' },
                { bottom: -2, right: -2, borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 4px 0' },
              ].map((corner, i) => (
                <div key={i} style={{
                  position: 'absolute', width: 28, height: 28,
                  borderStyle: 'solid', borderColor: '#00C9A0', borderWidth: 3,
                  ...corner,
                }} />
              ))}

              {scanning && (
                <motion.div
                  animate={{ y: [-80, 80, -80] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: 160, height: 2,
                    background: 'linear-gradient(90deg, transparent, #00C9A0, transparent)',
                  }}
                />
              )}

              {!scanning && (
                <QrCodeIcon size={48} strokeWidth={1} style={{ color: '#1e3450' }} />
              )}

              <AnimatePresence>
                {lastResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-[18px]"
                    style={{ background: lastResult.ok ? 'rgba(0,201,160,.15)' : 'rgba(242,68,99,.15)' }}
                  >
                    {lastResult.ok
                      ? <CheckCircleIcon size={48} style={{ color: '#00C9A0' }} />
                      : <XCircleIcon    size={48} style={{ color: '#F24463' }} />
                    }
                    <p className="mt-2 text-xs font-semibold text-center px-4"
                      style={{ color: lastResult.ok ? '#00C9A0' : '#F24463' }}>
                      {lastResult.ok ? '✓ Acceso permitido' : `✗ ${lastResult.message}`}
                    </p>
                    {lastResult.name ? (
                      <p className="text-xs mt-1 text-center px-4" style={{ color: '#7A9CB8' }}>
                        {lastResult.name}
                      </p>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-sm text-center" style={{ color: '#7A9CB8' }}>
              {scanning ? 'Validando inscripción…' : selectedEvent ? `Escaneo para ${selectedEvent.name}` : 'Elige un evento'}
            </p>

            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleScan(); }}
              placeholder="Pega el código QR"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: '#0d1829', border: '1px solid #1e3450', color: '#E1EAF4' }}
            />

            <button
              type="button"
              onClick={() => { void handleScan(); }}
              disabled={scanning || !eventId || !token.trim()}
              className="w-full rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95"
              style={{ background: scanning || !token.trim() ? '#1e3450' : '#00C9A0', color: scanning || !token.trim() ? '#3A5470' : '#0d1829' }}
            >
              {scanning ? 'Procesando...' : 'Validar QR'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Entradas',  value: today.entrada ?? 0, color: '#00C9A0' },
              { label: 'Coffee',    value: today.coffee ?? 0,  color: '#F59E0B' },
              { label: 'Kit',       value: today.kit ?? 0,     color: '#A78BFA' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl p-3 text-center"
                style={{ background: '#112035', border: '1px solid #1e3450' }}>
                <p className="text-xl font-bold tabular-nums" style={{ color: kpi.color, fontFamily: "'Sora', sans-serif" }}>
                  {kpi.value}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: '#3A5470' }}>
                  {kpi.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3A5470' }}>
              Tipo de interacción activo
            </p>
            <div className="grid grid-cols-3 gap-2">
              {INTERACTION_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveType(t.id)}
                  className="rounded-xl p-3 text-center transition-all"
                  style={{
                    background: activeType === t.id ? `${t.color}15` : '#112035',
                    border: `1px solid ${activeType === t.id ? t.color + '55' : '#1e3450'}`,
                  }}
                >
                  <div className="text-xl">{t.emoji}</div>
                  <p className="mt-1 text-xs font-semibold" style={{ color: activeType === t.id ? t.color : '#7A9CB8' }}>
                    {t.label}
                  </p>
                  <p className="text-[9px]" style={{ color: '#3A5470' }}>{t.rule}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3A5470' }}>
              Últimas capturas
            </p>
            <div className="overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
              {log.length === 0 && (
                <p className="px-4 py-10 text-center text-sm" style={{ color: '#3A5470' }}>
                  Aún no hay escaneos en este evento.
                </p>
              )}
              {log.map((entry, i) => {
                const meta = INTERACTION_TYPES.find((t) => t.id === entry.interaction);
                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < log.length - 1 ? '1px solid #1a2e45' : 'none' }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: GRADIENTS[i % GRADIENTS.length], color: '#fff' }}>
                      {initials(entry.person)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium" style={{ color: '#E1EAF4' }}>{entry.person}</p>
                      <p className="text-xs" style={{ color: '#3A5470' }}>
                        {meta?.label ?? entry.interaction} · {formatAgo(entry.occurred_at)}
                      </p>
                    </div>
                    {entry.ok
                      ? <CheckCircleIcon size={16} style={{ color: '#00C9A0', flexShrink: 0 }} />
                      : <XCircleIcon    size={16} style={{ color: '#F24463', flexShrink: 0 }} />
                    }
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
