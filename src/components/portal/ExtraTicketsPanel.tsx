import React, { useEffect, useState } from 'react';
import { TicketIcon } from 'lucide-react';
import { Panel } from '../admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { formatCop, withVat } from '../../utils/format';
import { supabase } from '../../lib/supabaseClient';

interface EventTicket { id: string; name: string; price: number | null; vat_rate: number; }

export function ExtraTicketsPanel() {
  const { session, activeEditionId } = usePlatform();
  const companyId = session?.companyId;
  const [eventTickets, setEventTickets] = useState<EventTicket[]>([]);
  const [ticketId, setTicketId] = useState('');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [buyingTicket, setBuyingTicket] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from('tickets')
      .select('id, name, price, vat_rate')
      .eq('edition_id', activeEditionId)
      .eq('visible', true)
      .eq('status', 'publicado')
      .then(({ data }) => {
        const rows = data ?? [];
        setEventTickets(rows);
        setTicketId((current) => current || rows[0]?.id || '');
      });
  }, [companyId, activeEditionId]);

  const selectedTicket = eventTickets.find((item) => item.id === ticketId);
  const extraTicketAmount = selectedTicket ? withVat(selectedTicket.price, selectedTicket.vat_rate) : null;

  const buyExtraTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyId || !selectedTicket) return;
    if (!attendeeName.trim() || !attendeeEmail.trim()) { setBuyError('Indica nombre y correo del asistente.'); return; }
    setBuyingTicket(true);
    setBuyError(null);
    const reference = `HB-REG-${crypto.randomUUID()}`;
    const { data, error: insertError } = await supabase
      .from('registrations')
      .insert({
        edition_id: activeEditionId,
        ticket_id: selectedTicket.id,
        full_name: attendeeName,
        email: attendeeEmail,
        modality: 'presencial',
        amount: extraTicketAmount,
        payment_status: extraTicketAmount === null ? 'approved' : 'pending',
        wompi_reference: extraTicketAmount === null ? null : reference,
        source: 'compra-empresa',
        company_id: companyId
      })
      .select('id')
      .single();

    if (insertError || !data) {
      setBuyingTicket(false);
      setBuyError('No pudimos registrar la compra. Intenta de nuevo.');
      return;
    }

    if (extraTicketAmount === null) {
      setBuyingTicket(false);
      setAttendeeName('');
      setAttendeeEmail('');
      alert('Tiquete adicional registrado.');
      return;
    }

    const [{ data: signatureData }, { data: publicSettings }] = await Promise.all([
      supabase.functions.invoke('wompi-create-signature', {
        body: { reference, amount_in_cents: Math.round(extraTicketAmount * 100), currency: 'COP' }
      }),
      supabase.from('public_settings').select('key, value').eq('key', 'wompi_public_key')
    ]);
    const publicKey = publicSettings?.[0]?.value;
    const signature = (signatureData as { signature?: string } | null)?.signature;
    setBuyingTicket(false);
    if (!signature || !publicKey) {
      setBuyError('El cobro por Wompi todavía no está configurado. Contacta al equipo organizador.');
      return;
    }
    const checkoutUrl = new URL('https://checkout.wompi.co/p/');
    checkoutUrl.searchParams.set('public-key', publicKey);
    checkoutUrl.searchParams.set('currency', 'COP');
    checkoutUrl.searchParams.set('amount-in-cents', String(Math.round(extraTicketAmount * 100)));
    checkoutUrl.searchParams.set('reference', reference);
    checkoutUrl.searchParams.set('signature:integrity', signature);
    checkoutUrl.searchParams.set('redirect-url', window.location.href);
    window.location.href = checkoutUrl.toString();
  };

  if (!companyId) return null;

  return (
    <Panel title="Comprar tiquetes adicionales" description="Además de lo que incluye tu plan, puedes comprar entradas extra para el evento.">
      <form className="grid gap-3 px-5 py-5 sm:grid-cols-2" onSubmit={buyExtraTicket}>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">Tipo de tiquete</span>
          <select className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand" value={ticketId} onChange={(event) => setTicketId(event.target.value)}>
            {eventTickets.map((item) => <option key={item.id} value={item.id}>{item.name} · {formatCop(withVat(item.price, item.vat_rate))}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">Nombre del asistente</span>
          <input required value={attendeeName} onChange={(event) => setAttendeeName(event.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">Correo del asistente</span>
          <input required type="email" value={attendeeEmail} onChange={(event) => setAttendeeEmail(event.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand" />
        </label>
        <div className="flex items-center justify-between gap-3 sm:col-span-2">
          <span className="text-sm text-ink-muted">Total: <strong className="text-brand">{formatCop(extraTicketAmount)}</strong></span>
          <button type="submit" disabled={buyingTicket || eventTickets.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
            <TicketIcon size={15} /> {buyingTicket ? 'Procesando…' : 'Comprar con Wompi'}
          </button>
        </div>
        {eventTickets.length === 0 ? <p className="text-xs text-ink-muted sm:col-span-2">Todavía no hay tiquetes publicados para esta edición.</p> : null}
        {buyError ? <p role="alert" className="text-sm font-medium text-rose-700 sm:col-span-2">{buyError}</p> : null}
      </form>
    </Panel>
  );
}
