import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DownloadIcon, QrCodeIcon } from 'lucide-react';
import { ModuleHeader, Panel } from '../../components/admin/Panel';
import {
  exportPortalQrCsv, listPortalQrContacts, loadPortalQrContext, updatePortalQrNote,
  type PortalQrContact, type PortalQrContext,
} from '../../lib/novo/portalQr';

type Scope = 'empresa' | 'mios';

export function PortalContacts() {
  const [ctx, setCtx] = useState<PortalQrContext | null>(null);
  const [rows, setRows] = useState<PortalQrContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>('empresa');
  const [eventId, setEventId] = useState('');
  const [standId, setStandId] = useState('');
  const [scannerId, setScannerId] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = () => {
    setLoading(true);
    Promise.all([loadPortalQrContext(), listPortalQrContacts()])
      .then(([nextCtx, nextRows]) => {
        setCtx(nextCtx);
        setRows(nextRows);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los contactos.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (scope === 'mios' && ctx?.scanner_person_id && row.scanner_person_id !== ctx.scanner_person_id) return false;
      if (eventId && row.event_id !== eventId) return false;
      if (standId && row.stand_unit_id !== standId) return false;
      if (scannerId && row.scanner_person_id !== scannerId) return false;
      if (specialty && (row.specialty ?? '') !== specialty) return false;
      if (from && row.occurred_at.slice(0, 10) < from) return false;
      if (to && row.occurred_at.slice(0, 10) > to) return false;
      return true;
    });
  }, [rows, scope, ctx, eventId, standId, scannerId, specialty, from, to]);

  const stands = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => {
      if (row.stand_unit_id && row.stand_label) map.set(row.stand_unit_id, row.stand_label);
    });
    return [...map.entries()];
  }, [rows]);

  const scanners = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => {
      if (row.scanner_person_id) map.set(row.scanner_person_id, row.scanner_name ?? 'Colaborador');
    });
    return [...map.entries()];
  }, [rows]);

  const specialties = useMemo(() => {
    return [...new Set(rows.map((row) => row.specialty).filter((value): value is string => Boolean(value)))].sort();
  }, [rows]);

  const saveNote = async (id: string) => {
    setSaving(true);
    try {
      await updatePortalQrNote(id, draft);
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, note: draft.trim() || null } : row)));
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la nota.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        eyebrow="Portal de empresas"
        title="QR / Contactos"
        description="Leads capturados en el stand. El seguimiento comercial vive en GHL, no en esta tabla."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link to="/portal/escanear" className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white">
              <QrCodeIcon size={14} /> Escanear QR
            </Link>
            <button
              type="button"
              onClick={() => exportPortalQrCsv(filtered)}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-xs font-semibold text-ink disabled:opacity-50"
            >
              <DownloadIcon size={14} /> Exportar CSV
            </button>
          </div>
        )}
      />

      <div className="flex gap-2">
        {([
          { id: 'empresa' as const, label: 'Toda la empresa' },
          { id: 'mios' as const, label: 'Mis contactos' },
        ]).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setScope(tab.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${scope === tab.id ? 'bg-brand text-white' : 'border border-line text-ink-muted'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Panel title="Filtros">
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="rounded-xl border border-line bg-white px-3 py-2 text-sm">
            <option value="">Todos los eventos</option>
            {ctx?.events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
          </select>
          <select value={standId} onChange={(e) => setStandId(e.target.value)} className="rounded-xl border border-line bg-white px-3 py-2 text-sm">
            <option value="">Todos los stands</option>
            {stands.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <select value={scannerId} onChange={(e) => setScannerId(e.target.value)} className="rounded-xl border border-line bg-white px-3 py-2 text-sm">
            <option value="">Todos los colaboradores</option>
            {scanners.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="rounded-xl border border-line bg-white px-3 py-2 text-sm">
            <option value="">Todas las especialidades</option>
            {specialties.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-line bg-white px-3 py-2 text-sm" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-line bg-white px-3 py-2 text-sm" />
        </div>
      </Panel>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Panel
        emphasis
        title={scope === 'mios' ? 'Mis contactos' : 'Contactos de la empresa'}
        description={loading ? 'Cargando…' : `${filtered.length} contacto${filtered.length === 1 ? '' : 's'}`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line text-[11px] uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Asistente</th>
                <th className="px-4 py-3 font-semibold">Evento / stand</th>
                <th className="px-4 py-3 font-semibold">Colaborador</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                    Aún no hay contactos. Usa Escanear QR en el stand.
                  </td>
                </tr>
              ) : filtered.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-brand">{row.person_name}</p>
                    <p className="text-xs text-ink-muted">{[row.specialty, row.email].filter(Boolean).join(' · ') || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-ink">
                    <p>{row.event_name ?? '—'}</p>
                    <p className="text-xs text-ink-muted">{row.stand_label ?? 'Sin stand'}</p>
                  </td>
                  <td className="px-4 py-3 text-ink">{row.scanner_name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-ink-muted whitespace-nowrap">
                    {new Date(row.occurred_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3 min-w-[180px]">
                    {editing === row.id ? (
                      <div className="flex gap-2">
                        <input
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-line px-2 py-1 text-xs"
                        />
                        <button type="button" disabled={saving} onClick={() => { void saveNote(row.id); }} className="text-xs font-semibold text-brand">
                          Guardar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setEditing(row.id); setDraft(row.note ?? ''); }}
                        className="text-left text-xs text-ink-muted hover:text-brand"
                      >
                        {row.note || 'Agregar nota'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
