import React, { useEffect, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { paymentStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { supabase } from '../../lib/supabaseClient';
import { AdminModal, modalFieldClass, ModalField } from '../../components/admin/AdminModal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { RowActions } from '../../components/admin/RowActions';
import { moveToTrash } from '../../lib/trash';

interface Registration {
  id: string;
  edition_id: string;
  ticket_id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  city: string;
  specialty: string;
  track_interest_id: string | null;
  modality: string;
  amount: number | null;
  payment_status: keyof typeof paymentStatusMeta;
  qr_code: string;
  qr_status: 'active' | 'used' | 'cancelled' | 'invalid';
  source: string;
  crm_synced: boolean;
}

interface Ticket { id: string; name: string; }
interface Track { id: string; name: string; }

const paymentFilters = ['todos', 'approved', 'pending', 'declined', 'expired', 'refunded'] as const;
const paymentStatusOptions = Object.entries(paymentStatusMeta) as [Registration['payment_status'], { label: string }][];
const qrStatusOptions: Registration['qr_status'][] = ['active', 'used', 'cancelled', 'invalid'];

export function Registrations() {
  const { activeEditionId } = usePlatform();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [query, setQuery] = useState('');
  const [payment, setPayment] = useState<(typeof paymentFilters)[number]>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Registration | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trashTarget, setTrashTarget] = useState<Registration | null>(null);
  const [trashing, setTrashing] = useState(false);

  const load = async () => {
    const [{ data: regRows }, { data: ticketRows }, { data: trackRows }] = await Promise.all([
      supabase.from('registrations').select('*').eq('edition_id', activeEditionId).order('created_at', { ascending: false }),
      supabase.from('tickets').select('id, name').eq('edition_id', activeEditionId),
      supabase.from('tracks').select('id, name').eq('edition_id', activeEditionId)
    ]);
    setRegistrations(regRows ?? []);
    setTickets(ticketRows ?? []);
    setTracks(trackRows ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditionId]);

  const filtered = useMemo(() => registrations.filter((registration) => {
    const matchesQuery = query.trim() === '' || `${registration.full_name} ${registration.city} ${registration.specialty} ${registration.qr_code}`.toLowerCase().includes(query.toLowerCase());
    const matchesPayment = payment === 'todos' || registration.payment_status === payment;
    return matchesQuery && matchesPayment;
  }), [registrations, query, payment]);

  const openEdit = (registration: Registration) => {
    setEditing(registration);
    setError(null);
    setModalOpen(true);
  };

  const submit = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const { id, ...payload } = editing;
    const { error: submitError } = await supabase.from('registrations').update(payload).eq('id', id);
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
    const { error: trashError } = await moveToTrash('registrations', trashTarget.id);
    setTrashing(false);
    if (trashError) {
      setError(trashError);
      return;
    }
    setTrashTarget(null);
    load();
  };

  return <>
      <ModuleHeader eyebrow="Operación" title="Registros" description="Inscripciones reales de la edición activa. El consentimiento comercial se registra por asistente." />

      <Panel emphasis title={`${filtered.length} registros`} description="Filtra por estado de pago o busca por nombre, ciudad, especialidad o código QR." actions={<>
            <label className="relative">
              <SearchIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" className="w-52 rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
            </label>
            <select value={payment} onChange={(event) => setPayment(event.target.value as typeof payment)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink" aria-label="Filtrar por estado de pago">
              {paymentFilters.map((filter) => <option key={filter} value={filter}>
                  {filter === 'todos' ? 'Todos los pagos' : paymentStatusMeta[filter].label}
                </option>)}
            </select>
          </>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-canvas">
              <tr>
                <th className={thClass}>Asistente</th>
                <th className={thClass}>Ticket</th>
                <th className={thClass}>Ciudad</th>
                <th className={thClass}>Especialidad</th>
                <th className={thClass}>Interés</th>
                <th className={thClass}>Pago</th>
                <th className={thClass}>QR</th>
                <th className={thClass}>Fuente</th>
                <th className={thClass}>CRM</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((registration) => {
              const ticket = tickets.find((item) => item.id === registration.ticket_id);
              const track = tracks.find((item) => item.id === registration.track_interest_id);
              const meta = paymentStatusMeta[registration.payment_status];
              return <tr key={registration.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-medium text-brand`}>{registration.full_name}</td>
                    <td className={tdClass}>{ticket?.name ?? '—'}</td>
                    <td className={tdClass}>{registration.city}</td>
                    <td className={tdClass}>{registration.specialty}</td>
                    <td className={tdClass}>{track?.name ?? '—'}</td>
                    <td className={tdClass}>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </td>
                    <td className={`${tdClass} font-mono text-xs`}>
                      {registration.qr_code}
                      <span className="ml-2 text-[10px] uppercase text-ink-muted">{registration.qr_status}</span>
                    </td>
                    <td className={`${tdClass} text-xs`}>{registration.source}</td>
                    <td className={tdClass}>{registration.crm_synced ? 'Sí' : 'Pendiente'}</td>
                    <td className={tdClass}>
                      <RowActions onEdit={() => openEdit(registration)} onDelete={() => setTrashTarget(registration)} />
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
          {filtered.length === 0 ? <p className="px-5 py-10 text-center text-sm text-ink-muted">
              Ningún registro coincide con los filtros aplicados.
            </p> : null}
        </div>
      </Panel>

      {editing ? <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title="Editar registro" onSubmit={submit} submitting={saving} error={error}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ModalField label="Nombre">
                <input className={modalFieldClass} value={editing.full_name} onChange={(event) => setEditing({ ...editing, full_name: event.target.value })} />
              </ModalField>
              <ModalField label="Correo">
                <input type="email" className={modalFieldClass} value={editing.email} onChange={(event) => setEditing({ ...editing, email: event.target.value })} />
              </ModalField>
              <ModalField label="WhatsApp">
                <input className={modalFieldClass} value={editing.whatsapp} onChange={(event) => setEditing({ ...editing, whatsapp: event.target.value })} />
              </ModalField>
              <ModalField label="Ciudad">
                <input className={modalFieldClass} value={editing.city} onChange={(event) => setEditing({ ...editing, city: event.target.value })} />
              </ModalField>
              <ModalField label="Especialidad">
                <input className={modalFieldClass} value={editing.specialty} onChange={(event) => setEditing({ ...editing, specialty: event.target.value })} />
              </ModalField>
              <ModalField label="Interés (track)">
                <select className={modalFieldClass} value={editing.track_interest_id ?? ''} onChange={(event) => setEditing({ ...editing, track_interest_id: event.target.value || null })}>
                  <option value="">Sin definir</option>
                  {tracks.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}
                </select>
              </ModalField>
              <ModalField label="Estado de pago">
                <select className={modalFieldClass} value={editing.payment_status} onChange={(event) => setEditing({ ...editing, payment_status: event.target.value as Registration['payment_status'] })}>
                  {paymentStatusOptions.map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
                </select>
              </ModalField>
              <ModalField label="Estado del QR">
                <select className={modalFieldClass} value={editing.qr_status} onChange={(event) => setEditing({ ...editing, qr_status: event.target.value as Registration['qr_status'] })}>
                  {qrStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </ModalField>
            </div>
          </div>
        </AdminModal> : null}

      <ConfirmDialog open={Boolean(trashTarget)} title="¿Mover este registro a la papelera?" description={trashTarget?.full_name} onConfirm={confirmTrash} onCancel={() => setTrashTarget(null)} loading={trashing} confirmLabel="Mover a la papelera" />
    </>;
}
