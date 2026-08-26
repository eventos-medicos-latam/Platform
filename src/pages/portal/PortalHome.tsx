import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon, ClipboardListIcon, CreditCardIcon, EyeIcon, LayoutPanelLeftIcon, MousePointerClickIcon, TicketIcon, UploadCloudIcon } from 'lucide-react';
import { ModuleHeader, Panel } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { getEdition } from '../../data/editions';
import { formatCop, formatNumber } from '../../utils/format';
import { participationStatusMeta, requirementStatusMeta, StatusBadge } from '../../components/ui/StatusBadge';
import { EASE_EMPHASIS } from '../../utils/motion';
import { supabase } from '../../lib/supabaseClient';

interface BannerSlot { tier: string; impressions: number; clicks: number; active: boolean; }
interface Participation { stand_id: string | null; included_tickets: number; banner_tier: string | null; agreed_amount: number | null; paid_amount: number; status: keyof typeof participationStatusMeta; activations: string[] | null; plan_id: string; }
interface Requirement { id: string; title: string; due_date: string | null; status: keyof typeof requirementStatusMeta; }
interface Payment { id: string; concept: string; due_date: string | null; amount: number; }
interface DocumentRow { id: string; name: string; status: string; }
interface Activity { id: string; date: string; actor: string; action: string; }
interface Plan { name: string; }

export function PortalHome() {
  const { session, activeEditionId } = usePlatform();
  const companyId = session?.companyId;
  const edition = getEdition(activeEditionId);

  const [participation, setParticipation] = useState<Participation | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [pending, setPending] = useState<Requirement[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [slot, setSlot] = useState<BannerSlot | null>(null);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const [{ data: participationRow }, { data: reqRows }, { data: paymentRows }, { data: docRows }, { data: activityRows }, { data: slotRow }] = await Promise.all([
        supabase.from('participations').select('stand_id, included_tickets, banner_tier, agreed_amount, paid_amount, status, activations, plan_id').eq('company_id', companyId).eq('edition_id', activeEditionId).maybeSingle(),
        supabase.from('requirements').select('id, title, due_date, status').eq('company_id', companyId).eq('edition_id', activeEditionId).in('status', ['pendiente', 'en-proceso', 'en-revision', 'requiere-cambios']).order('due_date'),
        supabase.from('company_payments').select('id, concept, due_date, amount').eq('company_id', companyId).eq('edition_id', activeEditionId).neq('status', 'pagado').order('due_date'),
        supabase.from('company_documents').select('id, name, status').eq('company_id', companyId).eq('edition_id', activeEditionId).neq('status', 'aprobado'),
        supabase.from('activity_log').select('id, date, actor, action').eq('company_id', companyId).order('date', { ascending: false }).limit(5),
        supabase.from('banner_slots').select('tier, impressions, clicks, active').eq('company_id', companyId).eq('edition_id', activeEditionId).maybeSingle()
      ]);
      setParticipation(participationRow ?? null);
      setPending(reqRows ?? []);
      setPayments(paymentRows ?? []);
      setDocuments(docRows ?? []);
      setActivity(activityRows ?? []);
      setSlot(slotRow ?? null);
      if (participationRow?.plan_id) {
        const { data: planRow } = await supabase.from('participation_plan_types').select('name').eq('id', participationRow.plan_id).single();
        setPlan(planRow);
      }
    })();
  }, [companyId, activeEditionId]);

  if (!companyId) {
    return <ModuleHeader eyebrow="Portal" title="Bienvenido" description="Tu usuario todavía no está vinculado a una empresa. Contacta al equipo organizador." />;
  }

  if (!participation) {
    return <Panel title="Sin participación activa">
        <p className="px-5 py-10 text-center text-sm text-ink-muted">
          Esta empresa no tiene participación registrada en la edición seleccionada.
        </p>
      </Panel>;
  }

  const balance = (participation.agreed_amount ?? 0) - participation.paid_amount;
  const meta = participationStatusMeta[participation.status];
  const progress = participation.agreed_amount ? participation.paid_amount / participation.agreed_amount : 0;

  const stats = [{
    label: 'Stand asignado',
    value: participation.stand_id ? 'Asignado' : '—',
    icon: LayoutPanelLeftIcon,
    bg: 'bg-[#e8eef6]',
    fg: 'text-[#1c5f8c]'
  }, {
    label: 'Entradas incluidas',
    value: String(participation.included_tickets),
    icon: TicketIcon,
    bg: 'bg-[#fdeef4]',
    fg: 'text-[#d6338c]'
  }, {
    label: 'Nivel en el banner',
    value: participation.banner_tier ?? '—',
    icon: LayoutPanelLeftIcon,
    bg: 'bg-[#f1eafb]',
    fg: 'text-[#7c6bc0]',
    capitalize: true
  }, {
    label: 'Impresiones del logo',
    value: slot ? formatNumber(slot.impressions) : '—',
    icon: EyeIcon,
    bg: 'bg-[#e9f7f0]',
    fg: 'text-[#159a63]'
  }];

  return <>
      {/* Hero de bienvenida con la textura de marca animada */}
      <div className="grad-futuro relative overflow-hidden rounded-3xl px-7 py-8 text-white shadow-lift sm:px-9">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[length:22px_22px]" aria-hidden="true" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-lg">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/60">
              {edition ? `${edition.name} · ${edition.year}` : 'Bienvenida de vuelta'}
            </p>
            <h1 className="mt-2 text-[28px] font-extrabold leading-tight tracking-tight sm:text-[32px]">
              {session?.name ?? 'Tu empresa'}
            </h1>
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              {plan ? <span className="rounded-full border border-white/25 bg-white/15 px-3.5 py-1 text-xs font-bold">
                  Plan {plan.name}
                </span> : null}
              <StatusBadge label={meta.label} tone={meta.tone} dot />
            </div>
          </div>

          <div className="min-w-[220px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/55">Saldo pendiente</p>
            <p className="mt-1 text-[28px] font-extrabold tabular-nums">{formatCop(balance)}</p>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/20">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-[#ffd166] to-[#ff8fab]" initial={{ scaleX: 0 }} animate={{ scaleX: progress }} style={{ transformOrigin: 'left' }} transition={{ duration: 0.5, ease: EASE_EMPHASIS }} />
            </div>
            <p className="mt-1.5 text-[11.5px] text-white/60">
              Pagado {formatCop(participation.paid_amount)} de {formatCop(participation.agreed_amount)}
            </p>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-2.5">
          {balance > 0 ? <Link to="/portal/pagos" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-brand-deep shadow-elev2 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
              <CreditCardIcon size={15} /> Pagar ahora
            </Link> : null}
          {pending.length > 0 ? <Link to="/portal/requerimientos" className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition-transform duration-200 ease-emphasis hover:-translate-y-0.5 hover:bg-white/15">
              <ClipboardListIcon size={15} /> Resolver {pending.length} requerimiento{pending.length === 1 ? '' : 's'}
            </Link> : null}
          <Link to="/portal/documentos" className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition-transform duration-200 ease-emphasis hover:-translate-y-0.5 hover:bg-white/15">
            <UploadCloudIcon size={15} /> Subir documentos
          </Link>
        </div>
      </div>

      {/* Fila de estadísticas con color */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <div key={stat.label} className="card-lift rounded-2xl border border-line bg-white p-5">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${stat.bg} ${stat.fg}`}>
              <stat.icon size={19} />
            </span>
            <p className="mt-3.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">{stat.label}</p>
            <p className={`mt-0.5 text-xl font-extrabold text-brand ${stat.capitalize ? 'capitalize' : ''}`}>{stat.value}</p>
          </div>)}
      </div>

      {/* Panel principal */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel emphasis title="Tu participación" description={plan?.name}>
          <div className="px-5 py-5">
            {participation.activations && participation.activations.length > 0 ? <ul className="flex flex-wrap gap-2">
                {participation.activations.map((activation) => <li key={activation} className="rounded-full bg-brand-soft px-3.5 py-1.5 text-xs font-semibold text-brand">
                    {activation}
                  </li>)}
              </ul> : <p className="text-sm text-ink-muted">Sin activaciones adicionales registradas.</p>}
            <Link to="/portal/participacion" className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-brand">
              Ver el detalle completo <ArrowRightIcon size={15} />
            </Link>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Lo que falta de tu lado" description={`${pending.length} requerimientos abiertos`} actions={<Link to="/portal/requerimientos" className="text-xs font-semibold text-brand-support">
                Resolver
              </Link>}>
            <ul className="divide-y divide-line">
              {pending.length === 0 ? <li className="px-5 py-5 text-sm text-ink-muted">Todo al día. Nada pendiente.</li> : pending.map((item) => <li key={item.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand">{item.title}</p>
                      <p className="text-xs text-ink-muted">Vence {item.due_date ?? '—'}</p>
                    </div>
                    <StatusBadge label={requirementStatusMeta[item.status].label} tone={requirementStatusMeta[item.status].tone} />
                  </li>)}
            </ul>
          </Panel>

          {slot ? <Panel title="Tu marca en el banner" description="Exposición acumulada de tu logo.">
              <dl className="divide-y divide-line">
                <div className="flex items-center justify-between gap-4 px-5 py-3">
                  <dt className="flex items-center gap-2 text-sm text-ink-muted">
                    <EyeIcon size={15} /> Impresiones
                  </dt>
                  <dd className="text-sm font-semibold text-brand">
                    {formatNumber(slot.impressions)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-5 py-3">
                  <dt className="flex items-center gap-2 text-sm text-ink-muted">
                    <MousePointerClickIcon size={15} /> Clics
                  </dt>
                  <dd className="text-sm font-semibold text-brand">{formatNumber(slot.clicks)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-5 py-3">
                  <dt className="text-sm text-ink-muted">Estado</dt>
                  <dd>
                    <StatusBadge label={slot.active ? 'Visible' : 'No visible'} tone={slot.active ? 'success' : 'warning'} />
                  </dd>
                </div>
              </dl>
            </Panel> : null}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Panel title="Próximos vencimientos">
          <ul className="divide-y divide-line">
            {payments.length === 0 ? <li className="px-5 py-4 text-sm text-ink-muted">Sin pagos pendientes.</li> : payments.map((payment) => <li key={payment.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand">{payment.concept}</p>
                    <p className="text-xs text-ink-muted">Vence {payment.due_date ?? '—'}</p>
                  </div>
                  <span className="text-sm font-semibold text-brand">
                    {formatCop(payment.amount)}
                  </span>
                </li>)}
          </ul>
        </Panel>

        <Panel title="Documentos por resolver">
          <ul className="divide-y divide-line">
            {documents.length === 0 ? <li className="px-5 py-4 text-sm text-ink-muted">Todos los documentos están aprobados.</li> : documents.map((document) => <li key={document.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-brand">
                    {document.name}
                  </span>
                  <StatusBadge label={document.status} tone="warning" />
                </li>)}
          </ul>
        </Panel>

        <Panel title="Últimas actividades">
          <ul className="divide-y divide-line">
            {activity.map((entry) => <li key={entry.id} className="px-5 py-3">
                <p className="text-sm font-medium text-brand">{entry.action}</p>
                <p className="text-xs text-ink-muted">
                  {new Date(entry.date).toLocaleString('es-CO')} · {entry.actor}
                </p>
              </li>)}
            {activity.length === 0 ? <li className="px-5 py-4 text-sm text-ink-muted">Sin actividad registrada.</li> : null}
          </ul>
        </Panel>
      </div>
    </>;
}
