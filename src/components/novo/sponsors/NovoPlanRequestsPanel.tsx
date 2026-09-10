import React, { useEffect, useState } from 'react';
import { InboxIcon } from 'lucide-react';
import { RowActions } from '../ui/RowActions';
import { NovoModal, ModalBtn, FormField, FormSelect } from '../ui/NovoModal';
import type { NovoCompany } from '../../../lib/novo/companies';
import {
  listPlanRequestsForEvent, planRequestKindLabel, updatePlanRequestStatus,
  type PlanRequestRow, type PlanRequestStatus,
} from '../../../lib/novo/planRequests';
import type { NovoEvent } from '../../../types/novo';
import type { PlanTier, SponsorStatus } from '../../../lib/novo/sponsors';

export type SponsorDraftFromRequest = {
  company_id: string;
  contact_name: string;
  contact_email: string;
  contact_tel: string;
  notas: string;
  status: SponsorStatus;
  plan: PlanTier;
};

const STATUS_CONFIG: Record<PlanRequestStatus, { label: string; color: string; bg: string }> = {
  nueva:            { label: 'Nueva',           color: '#5B8AF0', bg: 'rgba(91,138,240,.12)'  },
  'en-conversacion':{ label: 'En conversación', color: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
  aprobada:         { label: 'Aprobada',        color: '#00C9A0', bg: 'rgba(0,201,160,.12)'  },
  descartada:       { label: 'Descartada',      color: '#7A9CB8', bg: 'rgba(122,156,184,.12)' },
};

function formatReceived(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function matchCompany(request: PlanRequestRow, companies: NovoCompany[]): NovoCompany | undefined {
  const name = request.company.trim().toLowerCase();
  const nit = (request.nit ?? '').replace(/\D/g, '');
  return companies.find((company) => {
    if (nit && company.nit.replace(/\D/g, '') === nit) return true;
    return company.name.trim().toLowerCase() === name;
  });
}

function draftFromRequest(request: PlanRequestRow, companies: NovoCompany[]): SponsorDraftFromRequest {
  const matched = matchCompany(request, companies);
  const lines = [
    request.plan_id || request.ally_role ? `Plan web: ${planRequestKindLabel(request)}` : '',
    request.nit ? `NIT: ${request.nit}` : '',
    request.category ? `Sector: ${request.category}` : '',
    [request.city, request.country].filter(Boolean).join(', '),
    request.notes,
  ].filter(Boolean);
  return {
    company_id: matched?.id ?? '',
    contact_name: request.contact_name,
    contact_email: request.contact_email,
    contact_tel: request.contact_whatsapp ?? '',
    notas: lines.join('\n'),
    status: 'negociacion',
    plan: 'aliado',
  };
}

export function NovoPlanRequestsPanel({
  event,
  companies,
  onConvert,
}: {
  event: NovoEvent;
  companies: NovoCompany[];
  onConvert: (draft: SponsorDraftFromRequest) => void;
}) {
  const [requests, setRequests] = useState<PlanRequestRow[]>([]);
  const [filter, setFilter] = useState<PlanRequestStatus | 'todas'>('todas');
  const [selected, setSelected] = useState<PlanRequestRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    listPlanRequestsForEvent(event)
      .then(setRequests)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar las postulaciones.'));
  };

  useEffect(() => {
    setError(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, event.slug]);

  const visible = filter === 'todas' ? requests : requests.filter((row) => row.status === filter);
  const nuevas = requests.filter((row) => row.status === 'nueva').length;

  const changeStatus = async (id: string, status: PlanRequestStatus) => {
    setSaving(true);
    setError(null);
    try {
      const saved = await updatePlanRequestStatus(id, status);
      setRequests((prev) => prev.map((row) => (row.id === saved.id ? saved : row)));
      setSelected((current) => (current?.id === saved.id ? saved : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold" style={{ color: '#E1EAF4' }}>Postulaciones de la web</h2>
          <p className="text-xs mt-0.5" style={{ color: '#7A9CB8' }}>
            Lo que llega desde Aliados. {nuevas > 0 ? `${nuevas} nueva${nuevas === 1 ? '' : 's'} por revisar.` : 'Sin pendientes nuevas.'}
          </p>
        </div>
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #1e3450' }}>
          {(['todas', 'nueva', 'en-conversacion', 'aprobada', 'descartada'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className="px-3 py-1.5 text-[11px] font-semibold transition-colors"
              style={{
                background: filter === item ? '#182d47' : '#112035',
                color: filter === item ? '#E1EAF4' : '#2a4a6b',
                borderRight: item === 'descartada' ? 'none' : '1px solid #1e3450',
              }}
            >
              {item === 'todas' ? 'Todas' : STATUS_CONFIG[item].label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mb-3 rounded-xl px-4 py-2.5 text-xs" style={{ background: 'rgba(242,68,99,.12)', color: '#F24463' }}>{error}</p>
      ) : null}

      <div className="overflow-x-auto overflow-hidden rounded-2xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
        <div className="grid min-w-[860px] px-5 py-3" style={{ gridTemplateColumns: '1.6fr 1fr 1.2fr 1fr 0.9fr 0.8fr auto', borderBottom: '1px solid #1e3450', background: '#182d47' }}>
          {['Empresa', 'Plan', 'Contacto', 'Ubicación', 'Recibida', 'Estado', ''].map((label) => (
            <p key={label || 'acciones'} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3A5470' }}>{label}</p>
          ))}
        </div>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-10 text-center">
            <InboxIcon size={22} style={{ color: '#2a4a6b' }} />
            <p className="mt-2 text-sm" style={{ color: '#7A9CB8' }}>
              {requests.length === 0 ? 'Todavía no hay postulaciones para este evento.' : 'No hay postulaciones con este estado.'}
            </p>
          </div>
        ) : visible.map((row, index) => {
          const st = STATUS_CONFIG[row.status];
          return (
            <div
              key={row.id}
              className="grid min-w-[860px] px-5 py-3.5 cursor-pointer"
              style={{
                gridTemplateColumns: '1.6fr 1fr 1.2fr 1fr 0.9fr 0.8fr auto',
                borderBottom: index < visible.length - 1 ? '1px solid #1a2e45' : 'none',
              }}
              onClick={() => setSelected(row)}
            >
              <div className="min-w-0 pr-2">
                <p className="text-sm font-semibold truncate" style={{ color: '#E1EAF4' }}>{row.company || 'Sin nombre'}</p>
                <p className="text-[11px] truncate" style={{ color: '#7A9CB8' }}>{row.contact_email}</p>
              </div>
              <p className="flex items-center text-xs" style={{ color: '#7A9CB8' }}>{planRequestKindLabel(row)}</p>
              <p className="flex items-center text-xs truncate" style={{ color: '#7A9CB8' }}>{row.contact_name}</p>
              <p className="flex items-center text-xs truncate" style={{ color: '#7A9CB8' }}>{[row.city, row.country].filter(Boolean).join(', ') || '—'}</p>
              <p className="flex items-center text-xs" style={{ color: '#7A9CB8' }}>{formatReceived(row.created_at)}</p>
              <div className="flex items-center">
                <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: st.color, background: st.bg }}>
                  {st.label}
                </span>
              </div>
              <div className="flex items-center justify-end">
                <RowActions onView={() => setSelected(row)} />
              </div>
            </div>
          );
        })}
      </div>

      <NovoModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.company || 'Postulación'}
        subtitle={selected ? `${planRequestKindLabel(selected)} · ${formatReceived(selected.created_at)}` : undefined}
        width={560}
        footer={selected ? (
          <>
            <ModalBtn variant="secondary" onClick={() => setSelected(null)}>Cerrar</ModalBtn>
            <ModalBtn
              variant="primary"
              onClick={() => {
                onConvert(draftFromRequest(selected, companies));
                setSelected(null);
              }}
            >
              Pasar a patrocinadores
            </ModalBtn>
          </>
        ) : undefined}
      >
        {selected ? (
          <div className="space-y-4">
            <FormField label="Estado">
              <FormSelect
                value={selected.status}
                onChange={(value) => { void changeStatus(selected.id, value as PlanRequestStatus); }}
                options={Object.entries(STATUS_CONFIG).map(([value, meta]) => ({ value, label: meta.label }))}
              />
            </FormField>
            {saving ? <p className="text-xs" style={{ color: '#7A9CB8' }}>Guardando estado…</p> : null}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Contacto" value={selected.contact_name} />
              <Info label="Correo" value={selected.contact_email} />
              <Info label="WhatsApp" value={selected.contact_whatsapp} />
              <Info label="NIT" value={selected.nit} />
              <Info label="Sector" value={selected.category} />
              <Info label="Ubicación" value={[selected.city, selected.country].filter(Boolean).join(', ')} />
            </div>
            {selected.notes ? (
              <div className="rounded-xl px-3.5 py-3" style={{ background: '#0d1829', border: '1px solid #1e3450' }}>
                <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: '#3A5470' }}>Notas</p>
                <p className="text-xs whitespace-pre-line leading-relaxed" style={{ color: '#7A9CB8' }}>{selected.notes}</p>
              </div>
            ) : null}
            {!matchCompany(selected, companies) ? (
              <p className="text-[11px]" style={{ color: '#3A5470' }}>
                Esta empresa no está en el CRM. Al pasarla a patrocinadores tendrás que elegirla o crearla.
              </p>
            ) : null}
          </div>
        ) : null}
      </NovoModal>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: '#0d1829', border: '1px solid #1e3450' }}>
      <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: '#3A5470' }}>{label}</p>
      <p className="text-xs break-all" style={{ color: '#E1EAF4' }}>{value?.trim() || '—'}</p>
    </div>
  );
}
