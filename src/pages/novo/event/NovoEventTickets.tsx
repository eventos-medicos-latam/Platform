import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusIcon, TicketIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { KPICard } from '../../../components/novo/ui/KPICard';
import { RowActions } from '../../../components/novo/ui/RowActions';
import {
  NovoModal, ModalBtn, FormField, FormInput, FormSelect, FormTextarea, FormSection,
} from '../../../components/novo/ui/NovoModal';
import { formatCurrency } from '../../../lib/novo/events';
import {
  createTicket, currentTicketNetPrice, deleteTicket, listTickets, updateTicket,
  type EventTicketRow, type TicketAccessLevel, type TicketWrite,
} from '../../../lib/novo/tickets';
import type { NovoEventModality, NovoEventOutlet } from '../../../types/novo';

const ACCESS_LABEL: Record<TicketAccessLevel, string> = {
  general: 'General',
  vip: 'VIP',
  workshop: 'Taller',
  staff: 'Staff',
};

const EMPTY_FORM = {
  name: '',
  description: '',
  modality: '' as NovoEventModality | '',
  access_level: 'general' as TicketAccessLevel,
  base_price: '0',
  tax_pct: '0',
  capacity: '',
  benefits: '',
  sale_start: '',
  sale_end: '',
  is_visible: true,
  has_qr: true,
};

export function NovoEventTickets() {
  const { event } = useOutletContext<NovoEventOutlet>();
  const [tickets, setTickets] = useState<EventTicketRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventTicketRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const f = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  const reload = () => listTickets(event.id).then(setTickets).catch((err) => {
    setTickets([]);
    setError(err instanceof Error ? err.message : 'No se pudieron cargar los tickets.');
  });

  useEffect(() => {
    setError(null);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const toWrite = (): TicketWrite => ({
    event_id: event.id,
    name: form.name,
    description: form.description,
    modality: form.modality,
    access_level: form.access_level,
    base_price: Number(form.base_price) || 0,
    tax_pct: Number(form.tax_pct) || 0,
    capacity: form.capacity.trim() === '' ? null : Number(form.capacity),
    benefits: form.benefits.split('\n'),
    sale_start: form.sale_start || null,
    sale_end: form.sale_end || null,
    is_visible: form.is_visible,
    has_qr: form.has_qr,
  });

  const openCreate = () => {
    setEditing(null);
    setError(null);
    setForm({ ...EMPTY_FORM, modality: event.modality ?? '' });
    setModalOpen(true);
  };
  const openEdit = (ticket: EventTicketRow) => {
    setEditing(ticket);
    setError(null);
    setForm({
      name: ticket.name,
      description: ticket.description,
      modality: ticket.modality ?? '',
      access_level: ticket.access_level,
      base_price: String(ticket.base_price),
      tax_pct: String(ticket.tax_pct),
      capacity: ticket.capacity == null ? '' : String(ticket.capacity),
      benefits: ticket.benefits.join('\n'),
      sale_start: ticket.sale_start ? ticket.sale_start.slice(0, 16) : '',
      sale_end: ticket.sale_end ? ticket.sale_end.slice(0, 16) : '',
      is_visible: ticket.is_visible,
      has_qr: ticket.has_qr,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const saved = editing
        ? await updateTicket(editing.id, toWrite(), editing.sort_order)
        : await createTicket(toWrite());
      setTickets((prev) => editing
        ? prev.map((row) => row.id === editing.id ? saved : row)
        : [...prev, saved]);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el ticket.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este tipo de ticket? Las inscripciones ya hechas se conservan.')) return;
    try {
      await deleteTicket(id);
      setTickets((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    }
  };

  const sold = tickets.reduce((sum, row) => sum + row.sold, 0);
  const visible = tickets.filter((row) => row.is_visible).length;
  const publicUrl = `/e/${event.slug}`;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Tickets</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>
            Tipos de entrada que el público puede comprar en{' '}
            <Link to={publicUrl} className="font-semibold" style={{ color: '#00C9A0' }}>/e/{event.slug}</Link>
          </p>
        </div>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}>
          <PlusIcon size={13} /> Nuevo ticket
        </button>
      </div>

      {error && !modalOpen ? (
        <p className="mb-4 rounded-xl px-4 py-2.5 text-xs" style={{ background: 'rgba(242,68,99,.12)', color: '#F24463' }}>{error}</p>
      ) : null}

      <div className="mb-6 grid grid-cols-3 gap-4">
        <KPICard label="Tipos" value={String(tickets.length)} icon={TicketIcon} delay={0} />
        <KPICard label="Visibles al público" value={String(visible)} icon={EyeIcon} accent="#5B8AF0" delay={0.05} />
        <KPICard label="Vendidos" value={String(sold)} icon={TicketIcon} accent="#00C9A0" delay={0.1} />
      </div>

      <div className="overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
        <div className="grid px-5 py-3 text-[10px] font-bold uppercase tracking-widest"
          style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', color: '#2a4a6b', borderBottom: '1px solid #1e3450' }}>
          <span>Ticket</span><span>Precio</span><span>Cupo</span><span>Vendidos</span><span>Estado</span><span />
        </div>
        {tickets.length === 0 && (
          <div className="px-5 py-16 text-center text-sm" style={{ color: '#2a4a6b' }}>
            Aún no hay tipos de entrada. Crea General, VIP o un taller.
          </div>
        )}
        {tickets.map((ticket, i) => {
          const net = currentTicketNetPrice(ticket);
          return (
          <motion.div key={ticket.id}
            initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: i * 0.03 }}
            className="grid items-center px-5 py-3.5"
            style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', borderBottom: i < tickets.length - 1 ? '1px solid #1a2e45' : 'none' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#E1EAF4' }}>{ticket.name}</p>
              <p className="text-[10px]" style={{ color: '#3A5470' }}>{ACCESS_LABEL[ticket.access_level]}</p>
            </div>
            <div>
              <p className="text-sm tabular-nums" style={{ color: net > 0 ? '#00C9A0' : '#3A5470' }}>
                {net > 0 ? formatCurrency(net) : 'Gratis'}
              </p>
              {net > 0 && ticket.tax_pct > 0 ? (
                <p className="text-[10px]" style={{ color: '#3A5470' }}>sin IVA</p>
              ) : null}
            </div>
            <p className="text-sm" style={{ color: '#7A9CB8' }}>{ticket.capacity ?? 'Ilimitado'}</p>
            <p className="text-sm tabular-nums" style={{ color: '#E1EAF4' }}>{ticket.sold}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold"
              style={{ color: ticket.is_visible ? '#00C9A0' : '#3A5470' }}>
              {ticket.is_visible ? <EyeIcon size={11} /> : <EyeOffIcon size={11} />}
              {ticket.is_visible ? 'Visible' : 'Oculto'}
            </span>
            <RowActions onEdit={() => openEdit(ticket)} onDelete={() => { void handleDelete(ticket.id); }} />
          </motion.div>
          );
        })}
      </div>

      <NovoModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar ticket' : 'Nuevo ticket'}
        subtitle="El precio con IVA es el que ve el público"
        width={560}
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</ModalBtn>
            <ModalBtn variant="primary" onClick={() => { void handleSave(); }} disabled={saving || !form.name.trim()}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear ticket'}
            </ModalBtn>
          </>
        }
      >
        {error ? (
          <p className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(242,68,99,.12)', color: '#F24463' }}>{error}</p>
        ) : null}
        <div className="space-y-5">
          <FormSection title="Tipo de entrada">
            <FormField label="Nombre" required>
              <FormInput value={form.name} onChange={f('name')} placeholder="General, VIP, Taller de microbiota…" />
            </FormField>
            <FormField label="Descripción">
              <FormTextarea value={form.description} onChange={f('description')} rows={2} placeholder="Qué incluye este ticket" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Nivel de acceso">
                <FormSelect value={form.access_level} onChange={(v) => setForm((p) => ({ ...p, access_level: v as TicketAccessLevel }))}
                  options={Object.entries(ACCESS_LABEL).map(([value, label]) => ({ value, label }))} />
              </FormField>
              <FormField label="Modalidad">
                <FormSelect value={form.modality} onChange={(v) => setForm((p) => ({ ...p, modality: v as NovoEventModality | '' }))}
                  options={[
                    { value: '', label: 'La del evento' },
                    { value: 'presencial', label: 'Presencial' },
                    { value: 'virtual', label: 'Virtual' },
                    { value: 'hibrido', label: 'Híbrido' },
                  ]} />
              </FormField>
            </div>
          </FormSection>
          <FormSection title="Precio y cupo">
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Precio base">
                <FormInput type="number" value={form.base_price} onChange={f('base_price')} placeholder="0" />
              </FormField>
              <FormField label="IVA %">
                <FormInput type="number" value={form.tax_pct} onChange={f('tax_pct')} placeholder="0" />
              </FormField>
              <FormField label="Cupo" hint="Vacío = ilimitado">
                <FormInput type="number" value={form.capacity} onChange={f('capacity')} placeholder="Ilimitado" />
              </FormField>
            </div>
            <p className="text-xs" style={{ color: '#7A9CB8' }}>
              Público paga {formatCurrency((Number(form.base_price) || 0) * (1 + (Number(form.tax_pct) || 0) / 100))}.
              {Number(form.base_price) === 0 ? ' Si el evento no es gratuito, 0 = cortesía / inscripción libre.' : ''}
            </p>
          </FormSection>
          <FormSection title="Venta y beneficios">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Venta desde">
                <FormInput type="datetime-local" value={form.sale_start} onChange={f('sale_start')} />
              </FormField>
              <FormField label="Venta hasta">
                <FormInput type="datetime-local" value={form.sale_end} onChange={f('sale_end')} />
              </FormField>
            </div>
            <FormField label="Beneficios" hint="Uno por línea">
              <FormTextarea value={form.benefits} onChange={f('benefits')} rows={3} placeholder={'Acceso a conferencias\nCoffee break\nCertificado'} />
            </FormField>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: '#7A9CB8' }}>
              <input type="checkbox" checked={form.is_visible} onChange={(e) => setForm((p) => ({ ...p, is_visible: e.target.checked }))} />
              Visible en el microsite público
            </label>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: '#7A9CB8' }}>
              <input type="checkbox" checked={form.has_qr} onChange={(e) => setForm((p) => ({ ...p, has_qr: e.target.checked }))} />
              Genera QR de acceso
            </label>
          </FormSection>
        </div>
      </NovoModal>
    </div>
  );
}
