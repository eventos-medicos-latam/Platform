import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2Icon, QrCodeIcon, XCircleIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { popVariants } from '../../utils/motion';
import { supabase } from '../../lib/supabaseClient';

interface Registration {
  id: string;
  full_name: string;
  qr_code: string;
  qr_status: 'active' | 'used' | 'cancelled' | 'invalid';
  payment_status: string;
  checked_in_at: string | null;
}

const qrTone = {
  active: 'success',
  used: 'info',
  cancelled: 'neutral',
  invalid: 'danger'
} as const;

export function CheckIn() {
  const { activeEditionId } = usePlatform();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('registrations')
      .select('id, full_name, qr_code, qr_status, payment_status, checked_in_at')
      .eq('edition_id', activeEditionId)
      .order('full_name');
    setRegistrations(data ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditionId]);

  const scan = async (event: React.FormEvent) => {
    event.preventDefault();
    const match = registrations.find((registration) => registration.qr_code.toLowerCase() === code.trim().toLowerCase());
    if (!match) {
      setResult({ ok: false, message: 'Código no encontrado en esta edición.' });
      return;
    }
    if (match.qr_status !== 'active') {
      setResult({ ok: false, message: `Código ${match.qr_status}: acceso denegado.` });
      return;
    }
    if (match.payment_status !== 'approved') {
      setResult({ ok: false, message: 'Pago no aprobado: acceso denegado.' });
      return;
    }
    const { error } = await supabase
      .from('registrations')
      .update({ qr_status: 'used', checked_in_at: new Date().toISOString() })
      .eq('id', match.id);
    if (error) {
      setResult({ ok: false, message: 'No se pudo registrar el check-in. Intenta de nuevo.' });
      return;
    }
    setResult({ ok: true, message: `Acceso autorizado · ${match.full_name}` });
    setCode('');
    load();
  };

  return <>
      <ModuleHeader eyebrow="Operación" title="Check-in por QR" description="Cada asistente aprobado tiene un código único ligado a evento, ticket y pago." />

      <div className="grid gap-5 xl:grid-cols-[1fr_1.5fr]">
        <Panel emphasis title="Validar código">
          <form onSubmit={scan} className="px-5 py-5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">Código QR</span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <QrCodeIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="HB-XXXXXXXXXX" className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 font-mono text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
                </div>
                <button type="submit" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
                  Validar
                </button>
              </div>
            </label>

            <AnimatePresence mode="wait">
              {result ? <motion.p key={result.message} variants={popVariants} initial="initial" animate="enter" exit="exit" role="status" className={`mt-4 flex items-center gap-2 rounded-lg px-3.5 py-3 text-sm font-medium ${result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {result.ok ? <CheckCircle2Icon size={16} /> : <XCircleIcon size={16} />}
                  {result.message}
                </motion.p> : null}
            </AnimatePresence>

            <p className="mt-4 text-xs text-ink-muted">
              Estados posibles del código: Active, Used, Cancelled, Invalid.
            </p>
          </form>
        </Panel>

        <Panel title="Códigos emitidos">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="bg-canvas">
                <tr>
                  <th className={thClass}>Código</th>
                  <th className={thClass}>Asistente</th>
                  <th className={thClass}>Estado QR</th>
                  <th className={thClass}>Check-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {registrations.map((registration) => <tr key={registration.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-mono text-xs`}>{registration.qr_code}</td>
                    <td className={`${tdClass} font-medium text-brand`}>{registration.full_name}</td>
                    <td className={tdClass}>
                      <StatusBadge label={registration.qr_status} tone={qrTone[registration.qr_status]} />
                    </td>
                    <td className={tdClass}>{registration.checked_in_at ? new Date(registration.checked_in_at).toLocaleString('es-CO') : '—'}</td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>;
}
