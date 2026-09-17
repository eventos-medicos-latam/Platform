import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CameraIcon, CheckCircleIcon, KeyboardIcon, QrCodeIcon, XCircleIcon } from 'lucide-react';
import { ModuleHeader, Panel } from '../../components/admin/Panel';
import {
  attachCameraStream, cameraErrorMessage, createNativeQrDetector, decodeQrFromVideo, openRearCamera,
} from '../../lib/novo/qrCamera';
import {
  capturePortalQrLead, loadPortalQrContext, pickPortalQrEventId, pickPortalQrStandId,
  rememberPortalQrEventId, rememberPortalQrStandId,
  type PortalQrContext, type PortalQrEvent,
} from '../../lib/novo/portalQr';

export function PortalScan() {
  const [ctx, setCtx] = useState<PortalQrContext | null>(null);
  const [eventId, setEventId] = useState('');
  const [standId, setStandId] = useState('');
  const [note, setNote] = useState('');
  const [token, setToken] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraHint, setCameraHint] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<{ ok: boolean; title: string; detail: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const lastTokenRef = useRef({ value: '', at: 0 });
  const eventIdRef = useRef(eventId);
  const standIdRef = useRef(standId);
  const noteRef = useRef(note);

  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  eventIdRef.current = eventId;
  standIdRef.current = standId;
  noteRef.current = note;
  const selectedEvent: PortalQrEvent | undefined = ctx?.events.find((event) => event.id === eventId);

  useEffect(() => {
    loadPortalQrContext()
      .then((next) => {
        setCtx(next);
        const picked = pickPortalQrEventId(next.events);
        setEventId(picked);
        const event = next.events.find((row) => row.id === picked);
        setStandId(pickPortalQrStandId(event));
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'No se pudo cargar el scanner.'));
  }, []);

  useEffect(() => {
    if (!eventId) return;
    rememberPortalQrEventId(eventId);
    const event = ctx?.events.find((row) => row.id === eventId);
    const nextStand = pickPortalQrStandId(event);
    setStandId(nextStand);
  }, [eventId, ctx]);

  useEffect(() => {
    if (eventId && standId) rememberPortalQrStandId(eventId, standId);
  }, [eventId, standId]);

  useEffect(() => {
    if (!last || !cameraOn) return;
    const timer = window.setTimeout(() => setLast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [last, cameraOn]);

  useEffect(() => {
    if (!cameraOn) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      return;
    }
    let cancelled = false;
    let timer: number | null = null;
    const detector = createNativeQrDetector();
    const stop = () => {
      if (timer) window.clearTimeout(timer);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
    const tick = async () => {
      if (cancelled) return;
      const videoEl = videoRef.current;
      if (videoEl && videoEl.readyState >= 2 && !scanningRef.current) {
        try {
          const raw = await decodeQrFromVideo(videoEl, detector);
          if (raw) {
            const now = Date.now();
            if (!(lastTokenRef.current.value === raw && now - lastTokenRef.current.at < 2500)) {
              lastTokenRef.current = { value: raw, at: now };
              await handleScan(raw);
            }
          }
        } catch {
          /* skip */
        }
      }
      if (!cancelled) timer = window.setTimeout(() => { void tick(); }, 180);
    };
    (async () => {
      try {
        const stream = await openRearCamera();
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        let video = videoRef.current;
        for (let i = 0; i < 12 && !video; i += 1) {
          await new Promise<void>((resolve) => { requestAnimationFrame(() => resolve()); });
          video = videoRef.current;
        }
        if (!video) {
          stream.getTracks().forEach((track) => track.stop());
          setCameraHint('No se pudo mostrar la cámara.');
          setCameraOn(false);
          return;
        }
        attachCameraStream(video, stream);
        try { await video.play(); } catch { /* muted autoplay */ }
        setCameraHint(null);
        void tick();
      } catch (err) {
        setCameraHint(cameraErrorMessage(err));
        setCameraOn(false);
      }
    })();
    return () => { cancelled = true; stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOn]);

  async function handleScan(rawToken?: string) {
    const value = (rawToken ?? token).trim();
    if (!eventIdRef.current || scanningRef.current || !value) return;
    const event = ctxRef.current?.events.find((row) => row.id === eventIdRef.current);
    if ((event?.stands.length ?? 0) > 1 && !standIdRef.current) {
      setError('Elige el stand una vez para este evento.');
      return;
    }
    scanningRef.current = true;
    setScanning(true);
    setError(null);
    setLast(null);
    try {
      const outcome = await capturePortalQrLead({
        token: value,
        eventId: eventIdRef.current,
        standId: standIdRef.current,
        note: noteRef.current,
      });
      setToken('');
      if (outcome.duplicate) {
        const when = outcome.previous_at
          ? new Date(outcome.previous_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
          : '';
        setLast({
          ok: false,
          title: 'Contacto ya registrado',
          detail: `${outcome.name ?? ''} · ${when}${outcome.previous_by ? ` · ${outcome.previous_by}` : ''}`.trim(),
        });
      } else if (!outcome.ok) {
        setLast({ ok: false, title: outcome.message, detail: outcome.name ?? '' });
      } else {
        setLast({ ok: true, title: 'Contacto capturado', detail: outcome.name ?? '' });
        setNote('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el contacto.');
    } finally {
      scanningRef.current = false;
      setScanning(false);
    }
  }

  if (loadError) {
    return <ModuleHeader eyebrow="Portal" title="Escanear QR" description={loadError} />;
  }
  if (!ctx) {
    return <p className="text-sm text-ink-muted">Cargando scanner…</p>;
  }

  const needsStandChoice = (selectedEvent?.stands.length ?? 0) > 1;
  const canScan = Boolean(eventId) && (!needsStandChoice || Boolean(standId));

  return (
    <div className="space-y-6">
      <ModuleHeader
        eyebrow="Captura en el evento"
        title="Escanear QR"
        description="Lee el QR del asistente. No se crea otra persona: se guarda un contacto ligado a quien ya existe."
        actions={(
          <Link to="/portal/contactos" className="rounded-lg border border-line px-3.5 py-2 text-xs font-semibold text-ink">
            Ver contactos
          </Link>
        )}
      />

      <Panel
        emphasis
        title="Scanner de la empresa"
        description={`Escaneas como ${ctx.scanner_name || 'colaborador'} · ${selectedEvent?.name ?? 'elige un evento'}`}
      >
        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,280px)_1fr]">
          <div className="flex flex-col items-center gap-4">
            <div
              className="relative flex aspect-square w-full max-w-[260px] items-center justify-center overflow-hidden rounded-2xl border-2"
              style={{ borderColor: cameraOn || scanning ? '#00C9A0' : '#d5dde7', background: '#0d1829' }}
            >
              {cameraOn ? (
                <video ref={videoRef} muted playsInline autoPlay className="h-full w-full object-cover" />
              ) : (
                <QrCodeIcon size={48} className="text-white/20" />
              )}
              {last ? (
                <div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center"
                  style={{ background: last.ok ? 'rgba(0,201,160,.92)' : 'rgba(242,68,99,.92)' }}
                >
                  {last.ok
                    ? <CheckCircleIcon size={40} className="text-brand-deep" />
                    : <XCircleIcon size={40} className="text-white" />}
                  <p className={`mt-2 text-sm font-bold ${last.ok ? 'text-brand-deep' : 'text-white'}`}>{last.title}</p>
                  {last.detail ? (
                    <p className={`mt-1 text-xs ${last.ok ? 'text-brand-deep' : 'text-white'}`}>{last.detail}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="grid w-full max-w-[260px] grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCameraOn((on) => !on)}
                className="flex items-center justify-center gap-2 rounded-xl border border-line px-3 py-2 text-xs font-semibold"
              >
                <CameraIcon size={14} />
                {cameraOn ? 'Cerrar cámara' : 'Usar cámara'}
              </button>
              <button
                type="button"
                onClick={() => { setCameraOn(false); inputRef.current?.focus(); }}
                className="flex items-center justify-center gap-2 rounded-xl border border-line px-3 py-2 text-xs font-semibold"
              >
                <KeyboardIcon size={14} />
                Lector USB
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">Evento</span>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none"
              >
                {ctx.events.length === 0 ? <option value="">Sin eventos vinculados</option> : null}
                {ctx.events.map((event) => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </label>

            {needsStandChoice ? (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">Stand</span>
                <select
                  value={standId}
                  onChange={(e) => setStandId(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none"
                >
                  <option value="">Elige el stand una vez</option>
                  {selectedEvent?.stands.map((stand) => (
                    <option key={stand.id} value={stand.id}>{stand.label}</option>
                  ))}
                </select>
              </label>
            ) : selectedEvent?.stands.length === 1 ? (
              <p className="text-sm text-ink-muted">Stand {selectedEvent.stands[0].label} (único, ya seleccionado)</p>
            ) : (
              <p className="text-sm text-ink-muted">Este evento no tiene stand asignado. El contacto queda a nombre de la empresa.</p>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">Nota (opcional)</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Interés, producto, seguimiento…"
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none"
              />
            </label>

            <input
              ref={inputRef}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleScan(); }}
              placeholder="Pega el código QR o usa un lector USB"
              className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none"
            />

            {cameraHint ? <p className="text-xs text-amber-700">{cameraHint}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {ctx.events.length === 0 ? (
              <p className="text-sm text-ink-muted">Cuando tengas un stand o patrocinio Novo, podrás escanear en ese evento.</p>
            ) : null}

            <button
              type="button"
              disabled={scanning || !canScan || !token.trim()}
              onClick={() => { void handleScan(); }}
              className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {scanning ? 'Guardando…' : 'Capturar contacto'}
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
