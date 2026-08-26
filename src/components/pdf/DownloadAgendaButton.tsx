import React, { useState } from 'react';
import { DownloadIcon, LoaderIcon } from 'lucide-react';
import type { Edition } from '../../types/event';

interface DownloadAgendaButtonProps {
  edition: Edition;
  label?: string;
  className?: string;
}

export function DownloadAgendaButton({ edition, label = 'Descargar agenda en PDF', className }: DownloadAgendaButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const download = async () => {
    setLoading(true);
    setError(false);
    try {
      const { generateAgendaPdf } = await import('../../lib/pdf/generateAgendaPdf');
      await generateAgendaPdf(edition);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return <button type="button" onClick={download} disabled={loading} className={className ?? 'inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white/85 transition-colors duration-150 ease-emphasis hover:border-white hover:text-white disabled:opacity-60'}>
      {loading ? <LoaderIcon size={14} className="animate-spin" /> : <DownloadIcon size={14} />}
      {loading ? 'Generando…' : error ? 'Intentar de nuevo' : label}
    </button>;
}
