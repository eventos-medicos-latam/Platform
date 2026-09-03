import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCodeIcon, CheckCircleIcon, XCircleIcon, LogInIcon, CoffeeIcon, UtensilsIcon, GiftIcon, StarIcon, AwardIcon } from 'lucide-react';

interface ScanResult {
  id: string;
  person: string;
  interaction: string;
  ok: boolean;
  time: string;
}

const INTERACTION_TYPES = [
  { id: 'entrada',     label: 'Entrada',     emoji: '🚪', rule: 'Una vez',    icon: LogInIcon,      color: '#00C9A0' },
  { id: 'coffee',      label: 'Coffee',      emoji: '☕', rule: 'Una vez/día', icon: CoffeeIcon,     color: '#F59E0B' },
  { id: 'lunch',       label: 'Lunch',       emoji: '🍽',  rule: 'Una vez/día', icon: UtensilsIcon,   color: '#FF7043' },
  { id: 'kit',         label: 'Kit',         emoji: '🎁', rule: 'Una vez',    icon: GiftIcon,       color: '#A78BFA' },
  { id: 'vip',         label: 'VIP',         emoji: '⭐', rule: 'Múltiples',  icon: StarIcon,       color: '#5B8AF0' },
  { id: 'certificado', label: 'Certificado', emoji: '📜', rule: 'Una vez',    icon: AwardIcon,      color: '#7A9CB8' },
];

const MOCK_LOG: ScanResult[] = [
  { id: 'sc-001', person: 'Dra. Valentina Ospina',  interaction: 'Entrada',     ok: true,  time: 'hace 2 min'  },
  { id: 'sc-002', person: 'Dr. Andrés Morales',     interaction: 'Coffee',      ok: true,  time: 'hace 8 min'  },
  { id: 'sc-003', person: 'Juan Pablo Restrepo',    interaction: 'Entrada',     ok: false, time: 'hace 12 min' },
  { id: 'sc-004', person: 'Dra. Carolina Mejía',    interaction: 'Kit',         ok: true,  time: 'hace 15 min' },
];

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const GRADIENTS = [
  'linear-gradient(135deg,#00C9A0,#007AFF)',
  'linear-gradient(135deg,#A78BFA,#5B8AF0)',
  'linear-gradient(135deg,#FF7043,#F59E0B)',
  'linear-gradient(135deg,#5B8AF0,#00C9A0)',
];

export function NovoScanner() {
  const [activeType, setActiveType] = useState('entrada');
  const [scanning, setScanning]   = useState(false);
  const [lastResult, setLastResult] = useState<{ ok: boolean; name: string } | null>(null);

  function handleScan() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      const ok = Math.random() > 0.3;
      setLastResult({ ok, name: 'Dra. Valentina Ospina' });
      setTimeout(() => setLastResult(null), 3000);
    }, 1800);
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
            style={{ background: '#0E1520', border: '1px solid #1E2D45' }}>
            <div className="h-2 w-2 rounded-full" style={{ background: '#00C9A0', boxShadow: '0 0 6px #00C9A0' }} />
            <span className="text-sm font-semibold" style={{ color: '#E1EAF4' }}>Hormobiota VI</span>
          </div>
          <div className="rounded-xl px-3 py-2" style={{ background: '#0E1520', border: '1px solid #1E2D45' }}>
            <span className="text-sm" style={{ color: '#7A9CB8' }}>Stand B-01</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Panel izquierdo — scanner + KPIs */}
        <div className="space-y-4">
          {/* Frame scanner */}
          <div className="rounded-2xl p-6 flex flex-col items-center gap-5"
            style={{ background: '#0E1520', border: '1px solid #1E2D45' }}>
            <div
              className="relative flex items-center justify-center"
              style={{
                width: 200, height: 200, borderRadius: 20,
                border: `2px solid ${scanning ? '#00C9A0' : '#1E2D45'}`,
                background: scanning ? 'rgba(0,201,160,.04)' : '#080C14',
                transition: 'border-color .3s, background .3s',
              }}
            >
              {/* Esquinas */}
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

              {/* Línea de escaneo */}
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

              {/* Icono cuando no escanea */}
              {!scanning && (
                <QrCodeIcon size={48} strokeWidth={1} style={{ color: '#1E2D45' }} />
              )}

              {/* Resultado overlay */}
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
                      {lastResult.ok ? '✓ Acceso permitido' : '✗ Ya utilizado / no válido'}
                    </p>
                    <p className="text-xs mt-1 text-center px-4" style={{ color: '#7A9CB8' }}>
                      {lastResult.name}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-sm text-center" style={{ color: '#7A9CB8' }}>
              {scanning ? 'Escaneando...' : 'Apunta la cámara al QR del asistente'}
            </p>

            <button
              type="button"
              onClick={handleScan}
              disabled={scanning}
              className="w-full rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95"
              style={{ background: scanning ? '#1E2D45' : '#00C9A0', color: scanning ? '#3A5470' : '#080C14' }}
            >
              {scanning ? 'Procesando...' : 'Escanear QR'}
            </button>
          </div>

          {/* Contadores del día */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Entradas',  value: 247, color: '#00C9A0' },
              { label: 'Coffee',    value: 89,  color: '#F59E0B' },
              { label: 'Stands',    value: 34,  color: '#A78BFA' },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-xl p-3 text-center"
                style={{ background: '#0E1520', border: '1px solid #1E2D45' }}>
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

        {/* Panel derecho — tipos de interacción + log */}
        <div className="space-y-4">
          {/* Tipos */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3A5470' }}>
              Tipo de interacción activo
            </p>
            <div className="grid grid-cols-3 gap-2">
              {INTERACTION_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveType(t.id)}
                  className="rounded-xl p-3 text-center transition-all"
                  style={{
                    background: activeType === t.id ? `${t.color}15` : '#0E1520',
                    border: `1px solid ${activeType === t.id ? t.color + '55' : '#1E2D45'}`,
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

          {/* Log */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3A5470' }}>
              Últimas capturas
            </p>
            <div className="overflow-hidden rounded-2xl" style={{ background: '#0E1520', border: '1px solid #1E2D45' }}>
              {MOCK_LOG.map((entry, i) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < MOCK_LOG.length - 1 ? '1px solid #152238' : 'none' }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: GRADIENTS[i % GRADIENTS.length], color: '#fff' }}>
                    {initials(entry.person)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium" style={{ color: '#E1EAF4' }}>{entry.person}</p>
                    <p className="text-xs" style={{ color: '#3A5470' }}>
                      {entry.interaction} · {entry.time}
                    </p>
                  </div>
                  {entry.ok
                    ? <CheckCircleIcon size={16} style={{ color: '#00C9A0', flexShrink: 0 }} />
                    : <XCircleIcon    size={16} style={{ color: '#F24463', flexShrink: 0 }} />
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
