import React, { useEffect, useState } from 'react';
import { DownloadIcon, PencilIcon, PlusIcon, SendIcon, Trash2Icon, UserRoundIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { getEdition } from '../../data/editions';
import { StatusBadge, type BadgeTone } from '../../components/ui/StatusBadge';
import { supabase } from '../../lib/supabaseClient';
import { AdminModal, modalFieldClass, ModalField } from '../../components/admin/AdminModal';
import { ExtraTicketsPanel } from '../../components/portal/ExtraTicketsPanel';

const field = 'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand';

interface StaffMember { id: string; name: string; role: string; email: string; whatsapp: string | null; document: string | null; accreditation_status: 'pendiente' | 'acreditado' | 'rechazado'; responded_at: string | null; reconfirmed_at: string | null; invitation_token: string; }
// Un invitado profesional es una fila más de `registrations` (source = 'invitado-patrocinio'),
// no una tabla aparte: así hay una sola lista de asistentes al evento con etiquetas por caso.
interface Guest { id: string; full_name: string; specialty: string | null; email: string; whatsapp: string | null; city: string | null; qr_status: 'active' | 'used' | 'cancelled' | 'invalid'; qr_code: string; responded_at: string | null; reconfirmed_at: string | null; invitation_token: string; }
interface Plan { name: string; max_staff: number; guest_passes: number; }
interface StaffTicket { staff_id: string; qr_code: string; }

const invitationMeta: Record<string, { label: string; tone: BadgeTone }> = {
  pendiente: { label: 'Invitación pendiente', tone: 'warning' },
  aceptada: { label: 'Aceptada', tone: 'info' },
  reconfirmada: { label: 'Asistencia reconfirmada', tone: 'success' },
  rechazada: { label: 'Rechazada', tone: 'danger' }
};

function invitationStateFor(row: { responded_at: string | null; reconfirmed_at: string | null }, rejected: boolean) {
  if (rejected) return 'rechazada';
  if (row.reconfirmed_at) return 'reconfirmada';
  if (row.responded_at) return 'aceptada';
  return 'pendiente';
}

/** Barra de cupo consumido frente al tope del plan. */
function QuotaBar({ used, total, label }: { used: number; total: number; label: string }) {
  const fill = total > 0 ? Math.min(used / total, 1) : 0;
  const full = used >= total;
  return <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-ink-muted">{label}</span>
        <span className="font-semibold text-brand tabular-nums">
          {used} / {total}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-soft">
        <div className={`h-full rounded-full ${full ? 'bg-amber-500' : 'grad-futuro'}`} style={{
        width: `${Math.round(fill * 100)}%`
      }} />
      </div>
    </div>;
}

export function PortalTeam() {
  const { session, activeEditionId } = usePlatform();
  const companyId = session?.companyId;
  const edition = getEdition(activeEditionId);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [staffTickets, setStaffTickets] = useState<StaffTicket[]>([]);
  const [staffForm, setStaffForm] = useState({ name: '', role: '', email: '', whatsapp: '' });
  const [guestForm, setGuestForm] = useState({ name: '', specialty: '', email: '', whatsapp: '', city: '' });
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    if (!companyId) return;
    const [{ data: participation }, { data: staffRows }, { data: guestRows }] = await Promise.all([
      supabase.from('participations').select('plan_id').eq('company_id', companyId).eq('edition_id', activeEditionId).maybeSingle(),
      supabase.from('brand_staff_members').select('id, name, role, email, whatsapp, document, accreditation_status, responded_at, reconfirmed_at, invitation_token').eq('company_id', companyId).order('created_at'),
      supabase.from('registrations').select('id, full_name, specialty, email, whatsapp, city, qr_status, qr_code, responded_at, reconfirmed_at, invitation_token').eq('company_id', companyId).eq('source', 'invitado-patrocinio').order('created_at')
    ]);
    setStaff(staffRows ?? []);
    setGuests(guestRows ?? []);
    if (participation?.plan_id) {
      const { data: planRow } = await supabase.from('participation_plan_types').select('name, max_staff, guest_passes').eq('id', participation.plan_id).single();
      setPlan(planRow);
    } else {
      setPlan(null);
    }
    const staffIds = (staffRows ?? []).map((row) => row.id);
    if (staffIds.length) {
      const { data: ticketRows } = await supabase.from('registrations').select('staff_id, qr_code').in('staff_id', staffIds);
      setStaffTickets((ticketRows ?? []) as StaffTicket[]);
    } else {
      setStaffTickets([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, activeEditionId]);

  const staffFull = plan ? staff.length >= plan.max_staff : true;
  const guestsFull = plan ? guests.length >= plan.guest_passes : true;

  const addStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyId || staffFull) return;
    await supabase.from('brand_staff_members').insert({ company_id: companyId, ...staffForm, whatsapp: staffForm.whatsapp || null });
    setStaffForm({ name: '', role: '', email: '', whatsapp: '' });
    load();
  };
  const removeStaff = async (id: string) => {
    await supabase.from('brand_staff_members').delete().eq('id', id);
    load();
  };
  const addGuest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!guestsFull) return;
    setError(null);
    const { error: rpcError } = await supabase.rpc('invite_guest', {
      p_edition_id: activeEditionId,
      p_full_name: guestForm.name,
      p_email: guestForm.email,
      p_specialty: guestForm.specialty,
      p_city: guestForm.city || null,
      p_whatsapp: guestForm.whatsapp || null
    });
    if (rpcError) { setError(rpcError.message); return; }
    setGuestForm({ name: '', specialty: '', email: '', whatsapp: '', city: '' });
    load();
  };
  const removeGuest = async (id: string) => {
    await supabase.from('registrations').delete().eq('id', id);
    load();
  };

  const saveStaff = async () => {
    if (!editingStaff) return;
    setSaving(true);
    const { id, invitation_token: _t, responded_at: _r, reconfirmed_at: _rc, accreditation_status: _as, ...rest } = editingStaff;
    await supabase.from('brand_staff_members').update(rest).eq('id', id);
    setSaving(false);
    setEditingStaff(null);
    load();
  };
  const saveGuest = async () => {
    if (!editingGuest) return;
    setSaving(true);
    await supabase.from('registrations').update({
      full_name: editingGuest.full_name,
      specialty: editingGuest.specialty,
      email: editingGuest.email,
      whatsapp: editingGuest.whatsapp,
      city: editingGuest.city
    }).eq('id', editingGuest.id);
    setSaving(false);
    setEditingGuest(null);
    load();
  };

  const resend = async (kind: 'staff' | 'guest', row: { id: string; invitation_token: string }) => {
    const link = `${window.location.origin}/invitacion/${kind}/${row.invitation_token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(row.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      window.prompt('Copia este enlace y compártelo:', link);
    }
    supabase.functions.invoke('ghl-sync-contact', { body: { table: kind === 'staff' ? 'brand_staff_members' : 'registrations', record: { id: row.id } } }).catch(() => undefined);
  };

  const downloadTicket = (personName: string, qrCode: string) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>Boleto</title><style>
      body{font-family:system-ui,sans-serif;padding:48px;text-align:center;color:#111}
      h1{font-size:20px;margin-bottom:4px}
      p{color:#555;margin-top:0}
      .code{margin-top:28px;padding:20px;border:2px dashed #999;font-size:26px;font-weight:700;letter-spacing:3px;border-radius:12px}
    </style></head><body>
      <h1>${edition ? `${edition.name} · ${edition.year}` : 'Boleto de entrada'}</h1>
      <p>${personName}</p>
      <div class="code">${qrCode}</div>
      <p style="margin-top:20px;font-size:13px;">Presenta este código en el ingreso al evento.</p>
    </body></html>`);
    win.document.close();
    win.print();
  };

  if (!companyId) {
    return <ModuleHeader eyebrow="Portal" title="Equipo e invitados" description="Tu usuario todavía no está vinculado a una empresa. Contacta al equipo organizador." />;
  }

  if (!plan) {
    return <>
      <ModuleHeader eyebrow="Portal" title="Equipo e invitados" description="Compra tiquetes extra para el evento. Para registrar colaboradores e invitados del plan, primero debe existir una participación en esta edición." />
      <Panel title="Sin participación">
        <p className="px-5 py-10 text-center text-sm text-ink-muted">
          No hay participación registrada en esta edición.
        </p>
      </Panel>
      <div className="mt-5">
        <ExtraTicketsPanel />
      </div>
    </>;
  }

  return <>
      <ModuleHeader eyebrow={`${edition ? `${edition.name} · ` : ''}${plan.name}`} title="Equipo e invitados" description="Registra a quienes atienden tu espacio, invita profesionales de la salud y compra tiquetes extra cuando el plan no alcance." />

      <div className="mb-5 grid gap-5 sm:grid-cols-2">
        <Panel title="Colaboradores de marca" description="Personal acreditado para atender el espacio.">
          <div className="px-5 py-5">
            <QuotaBar used={staff.length} total={plan.max_staff} label="Cupos usados" />
          </div>
        </Panel>
        <Panel title="Invitados profesionales" description="Profesionales de la salud invitados por la marca.">
          <div className="px-5 py-5">
            {plan.guest_passes > 0 ? <QuotaBar used={guests.length} total={plan.guest_passes} label="Invitaciones usadas" /> : <p className="text-sm text-ink-muted">
                El plan {plan.name} no incluye invitaciones para profesionales.
              </p>}
          </div>
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel emphasis title="Colaboradores" description={`Máximo ${plan.max_staff} personas según el plan ${plan.name}.`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-canvas">
                <tr>
                  <th className={thClass}>Nombre</th>
                  <th className={thClass}>Rol en el espacio</th>
                  <th className={thClass}>Correo</th>
                  <th className={thClass}>Teléfono</th>
                  <th className={thClass}>Invitación</th>
                  <th className={thClass}>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {staff.map((member) => {
                const state = invitationStateFor(member, member.accreditation_status === 'rechazado');
                const meta = invitationMeta[state];
                const ticket = staffTickets.find((t) => t.staff_id === member.id);
                return <tr key={member.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={`${tdClass} font-medium text-brand`}>
                      <span className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-brand">
                          <UserRoundIcon size={15} />
                        </span>
                        {member.name}
                      </span>
                    </td>
                    <td className={tdClass}>{member.role}</td>
                    <td className={tdClass}>{member.email}</td>
                    <td className={tdClass}>{member.whatsapp || '—'}</td>
                    <td className={tdClass}>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <div className="flex items-center justify-end gap-1">
                        {ticket ? <button type="button" aria-label={`Descargar boleto de ${member.name}`} onClick={() => downloadTicket(member.name, ticket.qr_code)} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-brand-soft hover:text-brand">
                            <DownloadIcon size={15} />
                          </button> : null}
                        <button type="button" aria-label={`Editar a ${member.name}`} onClick={() => setEditingStaff(member)} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-brand-soft hover:text-brand">
                          <PencilIcon size={15} />
                        </button>
                        <button type="button" aria-label={`Reenviar invitación a ${member.name}`} onClick={() => resend('staff', member)} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-brand-soft hover:text-brand">
                          <SendIcon size={15} />
                        </button>
                        <button type="button" aria-label={`Quitar a ${member.name}`} onClick={() => removeStaff(member.id)} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-rose-50 hover:text-rose-700">
                          <Trash2Icon size={15} />
                        </button>
                      </div>
                      {copiedId === member.id ? <p className="mt-1 text-[11px] font-medium text-emerald-700">Enlace copiado</p> : null}
                    </td>
                  </tr>;
              })}
                {staff.length === 0 ? <tr><td colSpan={6} className="px-5 py-6 text-center text-sm text-ink-muted">Sin colaboradores registrados.</td></tr> : null}
              </tbody>
            </table>
          </div>

          <form className="grid gap-3 border-t border-line bg-canvas px-5 py-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]" onSubmit={addStaff}>
            <input required className={field} placeholder="Nombre completo" value={staffForm.name} onChange={(event) => setStaffForm({ ...staffForm, name: event.target.value })} />
            <input required className={field} placeholder="Rol en el espacio" value={staffForm.role} onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })} />
            <input required type="email" className={field} placeholder="Correo" value={staffForm.email} onChange={(event) => setStaffForm({ ...staffForm, email: event.target.value })} />
            <input required type="tel" className={field} placeholder="Teléfono" value={staffForm.whatsapp} onChange={(event) => setStaffForm({ ...staffForm, whatsapp: event.target.value })} />
            <button type="submit" disabled={staffFull} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 ease-emphasis hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40">
              <PlusIcon size={15} /> Agregar
            </button>
            {staffFull ? <p className="text-xs text-amber-700 sm:col-span-2 xl:col-span-5">
                Alcanzaste el máximo de {plan.max_staff} colaboradores de tu plan. Para ampliarlo,
                escribe al equipo comercial.
              </p> : null}
          </form>
        </Panel>

        {plan.guest_passes > 0 ? <Panel title="Invitados profesionales de la salud" description={`${plan.guest_passes} invitaciones incluidas en el plan ${plan.name}. Cada invitado recibe su enlace de aceptación y, más cerca del evento, su código QR.`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-canvas">
                  <tr>
                    <th className={thClass}>Nombre</th>
                    <th className={thClass}>Especialidad</th>
                    <th className={thClass}>Correo</th>
                    <th className={thClass}>Teléfono</th>
                    <th className={thClass}>Invitación</th>
                    <th className={thClass}>
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {guests.map((guest) => {
                  const state = invitationStateFor(guest, guest.qr_status === 'cancelled');
                  const meta = invitationMeta[state];
                  return <tr key={guest.id} className="transition-colors duration-150 hover:bg-canvas">
                      <td className={`${tdClass} font-medium text-brand`}>{guest.full_name}</td>
                      <td className={tdClass}>{guest.specialty}</td>
                      <td className={tdClass}>{guest.email}</td>
                      <td className={tdClass}>{guest.whatsapp || '—'}</td>
                      <td className={tdClass}>
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <div className="flex items-center justify-end gap-1">
                          {guest.qr_status === 'active' ? <button type="button" aria-label={`Descargar boleto de ${guest.full_name}`} onClick={() => downloadTicket(guest.full_name, guest.qr_code)} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-brand-soft hover:text-brand">
                              <DownloadIcon size={15} />
                            </button> : null}
                          <button type="button" aria-label={`Editar a ${guest.full_name}`} onClick={() => setEditingGuest(guest)} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-brand-soft hover:text-brand">
                            <PencilIcon size={15} />
                          </button>
                          <button type="button" aria-label={`Reenviar invitación a ${guest.full_name}`} onClick={() => resend('guest', guest)} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-brand-soft hover:text-brand">
                            <SendIcon size={15} />
                          </button>
                          <button type="button" aria-label={`Quitar a ${guest.full_name}`} onClick={() => removeGuest(guest.id)} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-rose-50 hover:text-rose-700">
                            <Trash2Icon size={15} />
                          </button>
                        </div>
                        {copiedId === guest.id ? <p className="mt-1 text-[11px] font-medium text-emerald-700">Enlace copiado</p> : null}
                      </td>
                    </tr>;
                })}
                  {guests.length === 0 ? <tr><td colSpan={6} className="px-5 py-6 text-center text-sm text-ink-muted">Sin invitados registrados.</td></tr> : null}
                </tbody>
              </table>
            </div>

            <form className="grid gap-3 border-t border-line bg-canvas px-5 py-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]" onSubmit={addGuest}>
              <input required className={field} placeholder="Nombre del profesional" value={guestForm.name} onChange={(event) => setGuestForm({ ...guestForm, name: event.target.value })} />
              <input required className={field} placeholder="Especialidad" value={guestForm.specialty} onChange={(event) => setGuestForm({ ...guestForm, specialty: event.target.value })} />
              <input required type="email" className={field} placeholder="Correo" value={guestForm.email} onChange={(event) => setGuestForm({ ...guestForm, email: event.target.value })} />
              <input required type="tel" className={field} placeholder="Teléfono" value={guestForm.whatsapp} onChange={(event) => setGuestForm({ ...guestForm, whatsapp: event.target.value })} />
              <button type="submit" disabled={guestsFull} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 ease-emphasis hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40">
                <PlusIcon size={15} /> Invitar
              </button>
              {guestsFull ? <p className="text-xs text-amber-700 sm:col-span-2 xl:col-span-5">
                  Usaste las {plan.guest_passes} invitaciones de tu plan.
                </p> : <p className="text-xs text-ink-muted sm:col-span-2 xl:col-span-5">
                  Copia el enlace con "Reenviar" para mandarlo por WhatsApp o correo.
                </p>}
              {error ? <p role="alert" className="text-sm font-medium text-rose-700 sm:col-span-2 xl:col-span-5">{error}</p> : null}
            </form>
          </Panel> : null}

        <ExtraTicketsPanel />
      </div>

      {editingStaff ? <AdminModal open title="Editar colaborador" onClose={() => setEditingStaff(null)} onSubmit={saveStaff} submitting={saving}>
          <div className="space-y-4">
            <ModalField label="Nombre">
              <input className={modalFieldClass} value={editingStaff.name} onChange={(event) => setEditingStaff({ ...editingStaff, name: event.target.value })} />
            </ModalField>
            <ModalField label="Rol en el espacio">
              <input className={modalFieldClass} value={editingStaff.role} onChange={(event) => setEditingStaff({ ...editingStaff, role: event.target.value })} />
            </ModalField>
            <ModalField label="Correo">
              <input type="email" className={modalFieldClass} value={editingStaff.email} onChange={(event) => setEditingStaff({ ...editingStaff, email: event.target.value })} />
            </ModalField>
            <ModalField label="Teléfono">
              <input type="tel" required className={modalFieldClass} value={editingStaff.whatsapp ?? ''} onChange={(event) => setEditingStaff({ ...editingStaff, whatsapp: event.target.value })} />
            </ModalField>
          </div>
        </AdminModal> : null}

      {editingGuest ? <AdminModal open title="Editar invitado" onClose={() => setEditingGuest(null)} onSubmit={saveGuest} submitting={saving}>
          <div className="space-y-4">
            <ModalField label="Nombre">
              <input className={modalFieldClass} value={editingGuest.full_name} onChange={(event) => setEditingGuest({ ...editingGuest, full_name: event.target.value })} />
            </ModalField>
            <ModalField label="Especialidad">
              <input className={modalFieldClass} value={editingGuest.specialty ?? ''} onChange={(event) => setEditingGuest({ ...editingGuest, specialty: event.target.value })} />
            </ModalField>
            <ModalField label="Correo">
              <input type="email" className={modalFieldClass} value={editingGuest.email} onChange={(event) => setEditingGuest({ ...editingGuest, email: event.target.value })} />
            </ModalField>
            <ModalField label="Teléfono">
              <input type="tel" required className={modalFieldClass} value={editingGuest.whatsapp ?? ''} onChange={(event) => setEditingGuest({ ...editingGuest, whatsapp: event.target.value })} />
            </ModalField>
            <ModalField label="Ciudad">
              <input className={modalFieldClass} value={editingGuest.city ?? ''} onChange={(event) => setEditingGuest({ ...editingGuest, city: event.target.value })} />
            </ModalField>
          </div>
        </AdminModal> : null}
    </>;
}
