import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2Icon, XCircleIcon } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { supabase } from '../lib/supabaseClient';
import { EASE_EMPHASIS } from '../utils/motion';

interface InvitationInfo {
  name: string;
  company_name: string;
  status: string;
  responded_at: string | null;
  reconfirmed_at: string | null;
  edition_id: string | null;
  edition_name: string | null;
  edition_start_date: string | null;
}

const ACCEPTED_STATUS: Record<'staff' | 'guest', string> = { staff: 'acreditado', guest: 'registrado' };

export function InvitationResponse() {
  const { kind, token } = useParams<{ kind: string; token: string }>();
  const validKind = kind === 'staff' || kind === 'guest' ? kind : null;

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const load = async () => {
    if (!validKind || !token) { setError('Enlace inválido.'); setLoading(false); return; }
    setLoading(true);
    const { data, error: fetchError } = await supabase.rpc('get_team_invitation_info', { p_kind: validKind, p_token: token });
    setLoading(false);
    if (fetchError || !data) { setError('No encontramos esta invitación. Puede que ya haya expirado.'); return; }
    setInfo(data as InvitationInfo);
    setError(null);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, token]);

  const respond = async (action: 'aceptar' | 'rechazar' | 'reconfirmar') => {
    if (!validKind || !token) return;
    setActing(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('respond_to_team_invitation', {
      p_kind: validKind,
      p_token: token,
      p_action: action,
      p_edition_id: info?.edition_id ?? null
    });
    setActing(false);
    if (rpcError) { setError(rpcError.message); return; }
    if (action === 'reconfirmar') setQrCode((data as { qr_code?: string })?.qr_code ?? null);
    load();
  };

  const withinReconfirmWindow = info?.edition_start_date
    ? new Date() >= new Date(new Date(info.edition_start_date).getTime() - 14 * 24 * 60 * 60 * 1000)
    : false;

  return <div className="flex min-h-screen w-full items-center justify-center bg-canvas px-6 py-16">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: EASE_EMPHASIS }} className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-panel">
        <Logo surface="onLight" compact />

        {loading ? <p className="mt-8 text-sm text-ink-muted">Cargando invitación…</p> : null}

        {!loading && error ? <>
            <h1 className="mt-6 text-xl font-bold text-brand">No pudimos cargar tu invitación</h1>
            <p className="mt-2 text-sm text-ink-muted">{error}</p>
          </> : null}

        {!loading && info ? <>
            <h1 className="mt-6 text-xl font-bold text-brand">Hola, {info.name}</h1>
            <p className="mt-2 text-sm text-ink-muted">
              {info.company_name} te invita {validKind === 'staff' ? 'como colaborador de marca' : 'como profesional invitado'} a
              {info.edition_name ? ` ${info.edition_name}` : ' su próximo evento'}.
            </p>

            {info.responded_at === null ? <div className="mt-7 flex flex-wrap gap-3">
                <button type="button" disabled={acting} onClick={() => respond('aceptar')} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
                  <CheckCircle2Icon size={16} /> Aceptar invitación
                </button>
                <button type="button" disabled={acting} onClick={() => respond('rechazar')} className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand/40 disabled:opacity-60">
                  <XCircleIcon size={16} /> No podré asistir
                </button>
              </div> : null}

            {info.responded_at !== null && info.status === (validKind ? ACCEPTED_STATUS[validKind] : '') && !info.reconfirmed_at && !qrCode ? <>
                {withinReconfirmWindow ? <div className="mt-7">
                    <p className="text-sm text-ink">Ya faltan menos de dos semanas. Reconfirma tu asistencia para recibir tu boleto de entrada.</p>
                    <button type="button" disabled={acting} onClick={() => respond('reconfirmar')} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
                      <CheckCircle2Icon size={16} /> Reconfirmar mi asistencia
                    </button>
                  </div> : <p className="mt-7 text-sm text-ink">
                    ¡Ya aceptaste! Por seguridad, tu boleto y código QR se activan la semana del{' '}
                    {info.edition_start_date ? new Date(new Date(info.edition_start_date).getTime() - 14 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO') : 'evento'} — te avisaremos para que reconfirmes tu asistencia.
                  </p>}
              </> : null}

            {info.reconfirmed_at || qrCode ? <div className="mt-7 rounded-xl bg-emerald-50 px-5 py-4">
                <p className="text-sm font-semibold text-emerald-800">Asistencia reconfirmada</p>
                <p className="mt-1 text-sm text-emerald-700">
                  Tu boleto ya está disponible. {validKind === 'staff' || validKind === 'guest' ? 'Pide a quien te invitó que te lo comparta desde su Portal.' : ''}
                </p>
              </div> : null}

            {info.status === 'rechazado' ? <p className="mt-7 text-sm text-ink-muted">Registramos que no podrás asistir. Gracias por avisar.</p> : null}

            {error ? <p role="alert" className="mt-4 text-sm font-medium text-rose-700">{error}</p> : null}
          </> : null}

        <Link to="/" className="mt-8 inline-block text-sm font-medium text-brand-support">
          Ir al sitio público
        </Link>
      </motion.div>
    </div>;
}
