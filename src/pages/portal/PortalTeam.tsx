import React, { useState } from 'react';
import { PlusIcon, SendIcon, Trash2Icon, UserRoundIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { getCompany, participationsByCompany, portalCompanyId } from '../../data/companies';
import { getEdition } from '../../data/editions';
import { guestsByCompany, planFromTier, staffByCompany } from '../../data/plans';
import type { BrandGuest, BrandStaffMember } from '../../types/participation';
import { StatusBadge } from '../../components/ui/StatusBadge';
const field = 'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand';

/** Barra de cupo consumido frente al tope del plan. */
function QuotaBar({
  used,
  total,
  label




}: {used: number;total: number;label: string;}) {
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

/**
 * Autogestión de la marca: sus colaboradores de stand y los profesionales de
 * la salud que invita. Los topes los define el plan contratado.
 */
export function PortalTeam() {
  const {
    session,
    activeEditionId
  } = usePlatform();
  const companyId = session?.companyId ?? portalCompanyId;
  const company = getCompany(companyId);
  const edition = getEdition(activeEditionId);
  const participation = participationsByCompany(companyId).find((item) => item.editionId === activeEditionId);
  const plan = planFromTier(participation?.packageTier);
  const [staff, setStaff] = useState<BrandStaffMember[]>(staffByCompany(companyId));
  const [guests, setGuests] = useState<BrandGuest[]>(guestsByCompany(companyId));
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: '',
    email: ''
  });
  const [guestForm, setGuestForm] = useState({
    name: '',
    specialty: '',
    email: '',
    city: ''
  });
  const staffFull = staff.length >= plan.maxStaff;
  const guestsFull = guests.length >= plan.guestPasses;
  if (!company || !edition) {
    return <Panel title="Sin participación">
        <p className="px-5 py-10 text-center text-sm text-ink-muted">
          No hay participación registrada en esta edición.
        </p>
      </Panel>;
  }
  return <>
      <ModuleHeader eyebrow={`${edition.name} · ${plan.name}`} title="Equipo e invitados" description="Registra a quienes atienden tu espacio y a los profesionales de la salud que invitas. Los cupos los define tu plan." />

      <div className="mb-5 grid gap-5 sm:grid-cols-2">
        <Panel title="Colaboradores de marca" description="Personal acreditado para atender el espacio.">
          <div className="px-5 py-5">
            <QuotaBar used={staff.length} total={plan.maxStaff} label="Cupos usados" />
          </div>
        </Panel>
        <Panel title="Invitados profesionales" description="Profesionales de la salud invitados por la marca.">
          <div className="px-5 py-5">
            {plan.guestPasses > 0 ? <QuotaBar used={guests.length} total={plan.guestPasses} label="Invitaciones usadas" /> : <p className="text-sm text-ink-muted">
                El plan {plan.name} no incluye invitaciones para profesionales.
              </p>}
          </div>
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel emphasis title="Colaboradores" description={`Máximo ${plan.maxStaff} personas según el plan ${plan.name}.`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-canvas">
                <tr>
                  <th className={thClass}>Nombre</th>
                  <th className={thClass}>Rol en el espacio</th>
                  <th className={thClass}>Correo</th>
                  <th className={thClass}>Documento</th>
                  <th className={thClass}>Acreditación</th>
                  <th className={thClass}>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {staff.map((member) => <tr key={member.id} className="transition-colors duration-150 hover:bg-canvas">
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
                    <td className={tdClass}>{member.document}</td>
                    <td className={tdClass}>
                      <StatusBadge label={member.accreditationStatus === 'acreditado' ? 'Acreditado' : 'Pendiente'} tone={member.accreditationStatus === 'acreditado' ? 'success' : 'warning'} />
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <button type="button" aria-label={`Quitar a ${member.name}`} onClick={() => setStaff(staff.filter((item) => item.id !== member.id))} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-rose-50 hover:text-rose-700">
                        <Trash2Icon size={15} />
                      </button>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>

          <form className="grid gap-3 border-t border-line bg-canvas px-5 py-4 sm:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={(event) => {
          event.preventDefault();
          if (staffFull) return;
          setStaff([...staff, {
            id: `stf-${Date.now()}`,
            companyId,
            name: staffForm.name,
            role: staffForm.role,
            email: staffForm.email,
            document: 'PENDIENTE',
            accreditationStatus: 'pendiente'
          }]);
          setStaffForm({
            name: '',
            role: '',
            email: ''
          });
        }}>
            <input required className={field} placeholder="Nombre completo" value={staffForm.name} onChange={(event) => setStaffForm({
            ...staffForm,
            name: event.target.value
          })} />
            <input required className={field} placeholder="Rol en el espacio" value={staffForm.role} onChange={(event) => setStaffForm({
            ...staffForm,
            role: event.target.value
          })} />
            <input required type="email" className={field} placeholder="Correo" value={staffForm.email} onChange={(event) => setStaffForm({
            ...staffForm,
            email: event.target.value
          })} />
            <button type="submit" disabled={staffFull} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 ease-emphasis hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40">
              <PlusIcon size={15} /> Agregar
            </button>
            {staffFull ? <p className="text-xs text-amber-700 sm:col-span-4">
                Alcanzaste el máximo de {plan.maxStaff} colaboradores de tu plan. Para ampliarlo,
                escribe al equipo comercial.
              </p> : null}
          </form>
        </Panel>

        {plan.guestPasses > 0 ? <Panel title="Invitados profesionales de la salud" description={`${plan.guestPasses} invitaciones incluidas en el plan ${plan.name}. Cada invitado recibe su registro y su código QR.`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-canvas">
                  <tr>
                    <th className={thClass}>Nombre</th>
                    <th className={thClass}>Especialidad</th>
                    <th className={thClass}>Correo</th>
                    <th className={thClass}>Ciudad</th>
                    <th className={thClass}>Estado</th>
                    <th className={thClass}>
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {guests.map((guest) => <tr key={guest.id} className="transition-colors duration-150 hover:bg-canvas">
                      <td className={`${tdClass} font-medium text-brand`}>{guest.name}</td>
                      <td className={tdClass}>{guest.specialty}</td>
                      <td className={tdClass}>{guest.email}</td>
                      <td className={tdClass}>{guest.city}</td>
                      <td className={tdClass}>
                        <StatusBadge label={guest.status === 'asistio' ? 'Asistió' : guest.status === 'registrado' ? 'Registrado' : 'Invitado'} tone={guest.status === 'asistio' ? 'success' : guest.status === 'registrado' ? 'info' : 'neutral'} />
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <button type="button" aria-label={`Reenviar invitación a ${guest.name}`} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-brand-soft hover:text-brand">
                          <SendIcon size={15} />
                        </button>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>

            <form className="grid gap-3 border-t border-line bg-canvas px-5 py-4 sm:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={(event) => {
          event.preventDefault();
          if (guestsFull) return;
          setGuests([...guests, {
            id: `gst-${Date.now()}`,
            companyId,
            name: guestForm.name,
            specialty: guestForm.specialty,
            email: guestForm.email,
            city: guestForm.city || 'PENDIENTE',
            status: 'invitado'
          }]);
          setGuestForm({
            name: '',
            specialty: '',
            email: '',
            city: ''
          });
        }}>
              <input required className={field} placeholder="Nombre del profesional" value={guestForm.name} onChange={(event) => setGuestForm({
            ...guestForm,
            name: event.target.value
          })} />
              <input required className={field} placeholder="Especialidad" value={guestForm.specialty} onChange={(event) => setGuestForm({
            ...guestForm,
            specialty: event.target.value
          })} />
              <input required type="email" className={field} placeholder="Correo" value={guestForm.email} onChange={(event) => setGuestForm({
            ...guestForm,
            email: event.target.value
          })} />
              <button type="submit" disabled={guestsFull} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 ease-emphasis hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40">
                <PlusIcon size={15} /> Invitar
              </button>
              {guestsFull ? <p className="text-xs text-amber-700 sm:col-span-4">
                  Usaste las {plan.guestPasses} invitaciones de tu plan.
                </p> : <p className="text-xs text-ink-muted sm:col-span-4">
                  El envío del correo de invitación y el recordatorio se ejecutan automáticamente.
                </p>}
            </form>
          </Panel> : null}
      </div>
    </>;
}