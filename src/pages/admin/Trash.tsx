import React, { useEffect, useState } from 'react';
import { RotateCcwIcon, Trash2Icon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { supabase } from '../../lib/supabaseClient';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { restoreFromTrash } from '../../lib/trash';

interface TrashRow {
  id: string;
  source_table: string;
  source_id: string;
  row_data: Record<string, unknown>;
  deleted_at: string;
}

const tableLabels: Record<string, string> = {
  agenda_items: 'Agenda', speakers: 'Speakers', tickets: 'Tickets', registrations: 'Registros',
  participations: 'Participaciones', plan_requests: 'Solicitudes de patrocinio', banner_slots: 'Banner',
  stands: 'Stands', company_payments: 'Pagos', company_documents: 'Documentos', requirements: 'Requerimientos',
  secondary_events: 'Formación en vivo', info_products: 'Tienda'
};

const nameFields = ['title', 'name', 'full_name', 'trade_name', 'concept', 'company'];

function rowLabel(row: TrashRow): string {
  for (const field of nameFields) {
    const value = row.row_data[field];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return row.source_id;
}

export function Trash() {
  const [rows, setRows] = useState<TrashRow[]>([]);
  const [filter, setFilter] = useState<'todas' | string>('todas');
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrashRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('trash').select('*').order('deleted_at', { ascending: false });
    setRows(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const visible = filter === 'todas' ? rows : rows.filter((row) => row.source_table === filter);
  const tables = [...new Set(rows.map((row) => row.source_table))];

  const restore = async (row: TrashRow) => {
    setRestoringId(row.id);
    setError(null);
    const { error: restoreError } = await restoreFromTrash(row.id);
    setRestoringId(null);
    if (restoreError) {
      setError(restoreError);
      return;
    }
    load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error: deleteError } = await supabase.from('trash').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setDeleteTarget(null);
    load();
  };

  return <>
      <ModuleHeader eyebrow="Sistema" title="Papelera" description="Todo lo que se elimina en el dashboard llega aquí primero. Restaura o elimina definitivamente." />

      {error ? <p className="mb-4 text-sm font-medium text-rose-700">{error}</p> : null}

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setFilter('todas')} className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150 ease-emphasis ${filter === 'todas' ? 'bg-brand text-white' : 'border border-line bg-white text-ink-muted hover:text-brand'}`}>
          Todas
        </button>
        {tables.map((table) => <button key={table} type="button" onClick={() => setFilter(table)} className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150 ease-emphasis ${filter === table ? 'bg-brand text-white' : 'border border-line bg-white text-ink-muted hover:text-brand'}`}>
            {tableLabels[table] ?? table}
          </button>)}
      </div>

      <Panel emphasis title={`${visible.length} elementos en la papelera`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-canvas">
              <tr>
                <th className={thClass}>Elemento</th>
                <th className={thClass}>Tabla</th>
                <th className={thClass}>Eliminado</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((row) => <tr key={row.id} className="transition-colors duration-150 hover:bg-canvas">
                  <td className={`${tdClass} font-medium text-brand`}>{rowLabel(row)}</td>
                  <td className={tdClass}>{tableLabels[row.source_table] ?? row.source_table}</td>
                  <td className={`${tdClass} text-xs`}>{new Date(row.deleted_at).toLocaleString('es-CO')}</td>
                  <td className={tdClass}>
                    <div className="flex justify-end gap-1">
                      <button type="button" disabled={restoringId === row.id} onClick={() => restore(row)} aria-label="Restaurar" className="rounded-lg p-1.5 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-brand-soft hover:text-brand disabled:opacity-50">
                        <RotateCcwIcon size={15} />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(row)} aria-label="Eliminar definitivamente" className="rounded-lg p-1.5 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-rose-50 hover:text-rose-700">
                        <Trash2Icon size={15} />
                      </button>
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
          {visible.length === 0 ? <p className="px-5 py-10 text-center text-sm text-ink-muted">La papelera está vacía.</p> : null}
        </div>
      </Panel>

      <ConfirmDialog open={Boolean(deleteTarget)} title="¿Eliminar definitivamente?" description="Esta acción no se puede deshacer." confirmLabel="Eliminar definitivamente" onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </>;
}
