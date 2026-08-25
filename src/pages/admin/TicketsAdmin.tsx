import React, { useEffect, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { formatCop, withVat } from '../../utils/format';
import { publicationStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { Pending } from '../../components/ui/Pending';
import { supabase } from '../../lib/supabaseClient';
import { AdminModal, modalFieldClass, ModalField } from '../../components/admin/AdminModal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { RowActions } from '../../components/admin/RowActions';
import { moveToTrash } from '../../lib/trash';

interface Ticket {
  id: string;
  edition_id: string;
  name: string;
  kind: string;
  modality: string;
  price: number | null;
  vat_rate: number;
  quota: number;
  sold: number;
  start_date: string | null;
  end_date: string | null;
  benefits: string[];
  status: keyof typeof publicationStatusMeta;
  visible: boolean;
  wompi_enabled: boolean;
  emits_qr: boolean;
}

const kindOptions = ['preventa', 'general', 'vip', 'estudiante', 'grupo', 'invitado', 'cortesia', 'patrocinador'];
const modalityOptions = ['presencial', 'virtual', 'hibrido'];
const statusOptions = Object.entries(publicationStatusMeta) as [Ticket['status'], { label: string }][];

const emptyForm = (editionId: string): Omit<Ticket, 'id' | 'sold'> => ({
  edition_id: editionId,
  name: '',
  kind: 'general',
  modality: 'presencial',
  price: null,
  vat_rate: 0.19,
  quota: 0,
  start_date: null,
  end_date: null,
  benefits: [],
  status: 'borrador',
  visible: true,
  wompi_enabled: false,
  emits_qr: true
});

export function TicketsAdmin() {
  const { activeEditionId } = usePlatform();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Ticket, 'id' | 'sold'>>(emptyForm(activeEditionId));
  const [benefitsText, setBenefitsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trashTarget, setTrashTarget] = useState<Ticket | null>(null);
  const [trashing, setTrashing] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('tickets').select('*').eq('edition_id', activeEditionId).order('start_date');
    setTickets(data ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditionId]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(activeEditionId));
    setBenefitsText('');
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (ticket: Ticket) => {
    setEditingId(ticket.id);
    const { sold: _sold, id: _id, ...rest } = ticket;
    setForm(rest);
    setBenefitsText(ticket.benefits.join('\n'));
    setError(null);
    setModalOpen(true);
  };

  const openDuplicate = (ticket: Ticket) => {
    setEditingId(null);
    const { sold: _sold, id: _id, ...rest } = ticket;
    setForm({ ...rest, name: `${ticket.name} (copia)` });
    setBenefitsText(ticket.benefits.join('\n'));
    setError(null);
    setModalOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    const payload = { ...form, benefits: benefitsText.split('\n').map((line) => line.trim()).filter(Boolean) };
    const { error: submitError } = editingId
      ? await supabase.from('tickets').update(payload).eq('id', editingId)
      : await supabase.from('tickets').insert(payload);
    setSaving(false);
    if (submitError) {
      setError(submitError.message);
      return;
    }
    setModalOpen(false);
    load();
  };

  const confirmTrash = async () => {
    if (!trashTarget) return;
    setTrashing(true);
    const { error: trashError } = await moveToTrash('tickets', trashTarget.id);
    setTrashing(false);
    if (trashError) {
      setError(trashError);
      return;
    }
    setTrashTarget(null);
    load();
  };

  return <>
      <ModuleHeader eyebrow="Operación" title="Tickets" description="Precio, IVA, cupo, ventanas de venta y visibilidad. Un ticket sin precio aprobado no puede publicarse con valor." actions={<button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
            <PlusIcon size={15} /> Nuevo ticket
          </button>} />

      <Panel emphasis title={`${tickets.length} tipos de ticket`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead className="bg-canvas">
              <tr>
                <th className={thClass}>Ticket</th>
                <th className={thClass}>Modalidad</th>
                <th className={thClass}>Precio</th>
                <th className={thClass}>IVA</th>
                <th className={thClass}>Precio final</th>
                <th className={thClass}>Cupo</th>
                <th className={thClass}>Vendidos</th>
                <th className={thClass}>Ventana</th>
                <th className={thClass}>Estado</th>
                <th className={thClass}>Visible</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tickets.map((ticket) => {
              const meta = publicationStatusMeta[ticket.status];
              return <tr key={ticket.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-medium text-brand`}>{ticket.name}</td>
                    <td className={`${tdClass} capitalize`}>{ticket.modality}</td>
                    <td className={tdClass}>
                      {ticket.price === null ? <Pending /> : formatCop(ticket.price)}
                    </td>
                    <td className={tdClass}>{Math.round(ticket.vat_rate * 100)}%</td>
                    <td className={`${tdClass} font-semibold`}>
                      {ticket.price === null ? '—' : formatCop(withVat(ticket.price, ticket.vat_rate))}
                    </td>
                    <td className={tdClass}>{ticket.quota}</td>
                    <td className={tdClass}>{ticket.sold}</td>
                    <td className={`${tdClass} text-xs`}>
                      {ticket.start_date} → {ticket.end_date}
                    </td>
                    <td className={tdClass}>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </td>
                    <td className={tdClass}>{ticket.visible ? 'Sí' : 'No'}</td>
                    <td className={tdClass}>
                      <RowActions onEdit={() => openEdit(ticket)} onDuplicate={() => openDuplicate(ticket)} onDelete={() => setTrashTarget(ticket)} />
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>
      </Panel>

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar ticket' : 'Nuevo ticket'} onSubmit={submit} submitting={saving} error={error}>
        <div className="space-y-4">
          <ModalField label="Nombre">
            <input className={modalFieldClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </ModalField>
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField label="Tipo">
              <select className={modalFieldClass} value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}>
                {kindOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </ModalField>
            <ModalField label="Modalidad">
              <select className={modalFieldClass} value={form.modality} onChange={(event) => setForm({ ...form, modality: event.target.value })}>
                {modalityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </ModalField>
            <ModalField label="Precio (COP, vacío = pendiente)">
              <input type="number" className={modalFieldClass} value={form.price ?? ''} onChange={(event) => setForm({ ...form, price: event.target.value === '' ? null : Number(event.target.value) })} />
            </ModalField>
            <ModalField label="IVA (ej. 0.19)">
              <input type="number" step="0.01" className={modalFieldClass} value={form.vat_rate} onChange={(event) => setForm({ ...form, vat_rate: Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Cupo">
              <input type="number" className={modalFieldClass} value={form.quota} onChange={(event) => setForm({ ...form, quota: Number(event.target.value) })} />
            </ModalField>
            <ModalField label="Estado">
              <select className={modalFieldClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Ticket['status'] })}>
                {statusOptions.map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
            </ModalField>
            <ModalField label="Inicio de venta">
              <input type="date" className={modalFieldClass} value={form.start_date ?? ''} onChange={(event) => setForm({ ...form, start_date: event.target.value || null })} />
            </ModalField>
            <ModalField label="Fin de venta">
              <input type="date" className={modalFieldClass} value={form.end_date ?? ''} onChange={(event) => setForm({ ...form, end_date: event.target.value || null })} />
            </ModalField>
          </div>
          <ModalField label="Beneficios (uno por línea)">
            <textarea className={modalFieldClass} rows={3} value={benefitsText} onChange={(event) => setBenefitsText(event.target.value)} />
          </ModalField>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2.5 text-sm text-ink">
              <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={form.visible} onChange={(event) => setForm({ ...form, visible: event.target.checked })} />
              Visible en la web
            </label>
            <label className="flex items-center gap-2.5 text-sm text-ink">
              <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={form.wompi_enabled} onChange={(event) => setForm({ ...form, wompi_enabled: event.target.checked })} />
              Cobro por Wompi
            </label>
            <label className="flex items-center gap-2.5 text-sm text-ink">
              <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={form.emits_qr} onChange={(event) => setForm({ ...form, emits_qr: event.target.checked })} />
              Emite QR
            </label>
          </div>
        </div>
      </AdminModal>

      <ConfirmDialog open={Boolean(trashTarget)} title="¿Mover este ticket a la papelera?" description={trashTarget?.name} onConfirm={confirmTrash} onCancel={() => setTrashTarget(null)} loading={trashing} confirmLabel="Mover a la papelera" />
    </>;
}
