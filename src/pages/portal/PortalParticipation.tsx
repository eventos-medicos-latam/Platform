import React, { useEffect, useState } from 'react';
import { CheckIcon } from 'lucide-react';
import { ModuleHeader, Panel } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { getEdition } from '../../data/editions';
import { StatusBadge, participationStatusMeta } from '../../components/ui/StatusBadge';
import { Pending } from '../../components/ui/Pending';
import { TrackIcon } from '../../components/ui/TrackIcon';
import { supabase } from '../../lib/supabaseClient';
import type { Track as EventTrack } from '../../types/event';

interface BannerSlot { tier: string; order_num: number; logo_ready: boolean; active: boolean; }
interface Track { id: string; name: string; icon: EventTrack['icon']; }
interface Stand { number: string; category: string | null; location: string | null; size: string | null; }
interface PlanBenefitGroup { title: string; items: string[]; }
interface Plan { name: string; tagline: string; space: string; max_staff: number; guest_passes: number; benefit_groups: PlanBenefitGroup[]; includes_speaker: boolean; }
interface Participation {
  id: string;
  status: keyof typeof participationStatusMeta;
  stand_id: string | null;
  included_tickets: number;
  track_id: string | null;
  sponsored_speaker_track_id: string | null;
  plan_id: string;
}
interface SpeakerSubmission { id: string; name: string; email: string; bio: string | null; topic: string | null; status: 'enviado' | 'en-revision' | 'aprobado' | 'rechazado'; }

const speakerSubmissionMeta: Record<SpeakerSubmission['status'], { label: string; tone: 'warning' | 'info' | 'success' | 'danger' }> = {
  enviado: { label: 'Enviado, en espera de revisión', tone: 'warning' },
  'en-revision': { label: 'En revisión', tone: 'info' },
  aprobado: { label: 'Aprobado', tone: 'success' },
  rechazado: { label: 'Requiere una nueva propuesta', tone: 'danger' }
};

export function PortalParticipation() {
  const { session, activeEditionId } = usePlatform();
  const companyId = session?.companyId;
  const edition = getEdition(activeEditionId);

  const [participation, setParticipation] = useState<Participation | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [stand, setStand] = useState<Stand | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [speakerTrack, setSpeakerTrack] = useState<Track | null>(null);
  const [slot, setSlot] = useState<BannerSlot | null>(null);
  const [surfaces, setSurfaces] = useState<string[]>([]);
  const [speakerSubmissions, setSpeakerSubmissions] = useState<SpeakerSubmission[]>([]);
  const [speakerForm, setSpeakerForm] = useState({ name: '', email: '', bio: '', topic: '' });
  const [submittingSpeaker, setSubmittingSpeaker] = useState(false);
  const [speakerError, setSpeakerError] = useState<string | null>(null);

  const loadSpeakerSubmissions = async (participationId: string) => {
    const { data } = await supabase.from('sponsored_speaker_submissions').select('id, name, email, bio, topic, status').eq('participation_id', participationId).order('created_at', { ascending: false });
    setSpeakerSubmissions(data ?? []);
  };

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const { data: participationRow } = await supabase
        .from('participations')
        .select('id, status, stand_id, included_tickets, track_id, sponsored_speaker_track_id, plan_id')
        .eq('company_id', companyId).eq('edition_id', activeEditionId).maybeSingle();
      setParticipation(participationRow ?? null);
      if (!participationRow) { setPlan(null); setStand(null); setTrack(null); setSpeakerTrack(null); setSpeakerSubmissions([]); return; }

      const [{ data: planRow }, { data: standRow }, { data: trackRow }, { data: speakerTrackRow }] = await Promise.all([
        supabase.from('participation_plan_types').select('name, tagline, space, max_staff, guest_passes, benefit_groups, includes_speaker').eq('id', participationRow.plan_id).single(),
        participationRow.stand_id ? supabase.from('stands').select('number, category, location, size').eq('id', participationRow.stand_id).single() : Promise.resolve({ data: null }),
        participationRow.track_id ? supabase.from('tracks').select('id, name, icon').eq('id', participationRow.track_id).single() : Promise.resolve({ data: null }),
        participationRow.sponsored_speaker_track_id ? supabase.from('tracks').select('id, name, icon').eq('id', participationRow.sponsored_speaker_track_id).single() : Promise.resolve({ data: null })
      ]);
      setPlan(planRow ?? null);
      setStand(standRow ?? null);
      setTrack(trackRow ?? null);
      setSpeakerTrack(speakerTrackRow ?? null);
      if (planRow?.includes_speaker) loadSpeakerSubmissions(participationRow.id);
    })();
    supabase.from('banner_slots').select('tier, order_num, logo_ready, active').eq('company_id', companyId).eq('edition_id', activeEditionId).maybeSingle().then(({ data }) => setSlot(data));
    supabase.from('sponsor_banner_configs').select('surfaces').eq('edition_id', activeEditionId).maybeSingle().then(({ data }) => setSurfaces(data?.surfaces ?? []));
  }, [companyId, activeEditionId]);

  const submitSpeaker = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!participation) return;
    if (!speakerForm.name.trim() || !speakerForm.email.trim()) { setSpeakerError('Nombre y correo son obligatorios.'); return; }
    setSubmittingSpeaker(true);
    setSpeakerError(null);
    const { error } = await supabase.from('sponsored_speaker_submissions').insert({ participation_id: participation.id, ...speakerForm });
    setSubmittingSpeaker(false);
    if (error) { setSpeakerError(error.message); return; }
    setSpeakerForm({ name: '', email: '', bio: '', topic: '' });
    loadSpeakerSubmissions(participation.id);
  };

  if (!companyId) {
    return <ModuleHeader eyebrow="Portal" title="Mi participación" description="Tu usuario todavía no está vinculado a una empresa. Contacta al equipo organizador." />;
  }

  if (!participation || !plan) {
    return <Panel title="Sin participación">
        <p className="px-5 py-10 text-center text-sm text-ink-muted">
          No hay participación registrada en esta edición.
        </p>
      </Panel>;
  }

  const meta = participationStatusMeta[participation.status];

  return <>
      <ModuleHeader eyebrow={edition ? `${edition.name} · ${edition.year}` : 'Portal'} title="Mi participación" description="Todo lo que incluye tu paquete y cómo se está mostrando tu marca." actions={<StatusBadge label={meta.label} tone={meta.tone} dot />} />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel emphasis title={plan.name} description={plan.tagline}>
          <div className="px-5 py-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[{
              label: 'Espacio',
              value: plan.space === 'estacion' ? 'Estación Pop Up' : 'Stand de foyer'
            }, {
              label: 'Colaboradores',
              value: String(plan.max_staff)
            }, {
              label: 'Invitados',
              value: plan.guest_passes > 0 ? String(plan.guest_passes) : '—'
            }].map((item) => <div key={item.label} className="rounded-lg bg-canvas px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    {item.label}
                  </p>
                  <p className="mt-1 text-base font-bold text-brand">{item.value}</p>
                </div>)}
            </div>

            <h3 className="mt-6 text-sm font-semibold text-brand">Beneficios incluidos</h3>
            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              {plan.benefit_groups.map((group) => <div key={group.title}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
                    {group.title}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {group.items.map((benefit) => <li key={benefit} className="flex gap-2.5 text-sm text-ink">
                        <CheckIcon size={15} className="mt-0.5 shrink-0 text-accent" />
                        {benefit}
                      </li>)}
                  </ul>
                </div>)}
            </div>

            <div className="mt-7 grid gap-x-8 gap-y-5 border-t border-line pt-5 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Entradas incluidas
                </p>
                <p className="mt-1 text-lg font-semibold text-brand">
                  {participation.included_tickets > 0 ? participation.included_tickets : <Pending />}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Área temática
                </p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-brand">
                  {track ? <>
                      <TrackIcon icon={track.icon} size={20} className="text-accent" />
                      {track.name}
                    </> : '—'}
                </p>
              </div>
              {speakerTrack ? <div className="sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    Speaker patrocinado
                  </p>
                  <p className="mt-1 text-lg font-semibold text-brand">
                    Espacio en {speakerTrack.name}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    Nombre del speaker y horario: <Pending />
                  </p>
                </div> : null}
            </div>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Tu stand">
            {stand ? <dl className="divide-y divide-line">
                {[{
              label: 'Número',
              value: stand.number
            }, {
              label: 'Categoría',
              value: stand.category ?? '—'
            }, {
              label: 'Ubicación',
              value: stand.location ?? '—'
            }, {
              label: 'Medidas',
              value: stand.size ?? '—'
            }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-3">
                    <dt className="text-sm text-ink-muted">{row.label}</dt>
                    <dd className="text-sm font-medium text-brand">{row.value}</dd>
                  </div>)}
              </dl> : <p className="px-5 py-6 text-sm text-ink-muted">
                Tu paquete no incluye stand en esta edición.
              </p>}
          </Panel>

          <Panel title="Tu logo en el banner" description="Cómo y dónde se está mostrando.">
            {slot ? <dl className="divide-y divide-line">
                {[{
              label: 'Nivel',
              value: slot.tier
            }, {
              label: 'Posición en la cinta',
              value: String(slot.order_num)
            }, {
              label: 'Superficies',
              value: surfaces.join(', ') || '—'
            }, {
              label: 'Logo vectorial',
              value: slot.logo_ready ? 'Aprobado' : 'Falta cargar'
            }, {
              label: 'Visible ahora',
              value: slot.active ? 'Sí' : 'No'
            }].map((row) => <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-3">
                    <dt className="text-sm text-ink-muted">{row.label}</dt>
                    <dd className="text-sm font-medium capitalize text-brand">{row.value}</dd>
                  </div>)}
              </dl> : <p className="px-5 py-6 text-sm text-ink-muted">
                Tu marca aún no tiene espacio asignado en el banner.
              </p>}
          </Panel>

          {plan.includes_speaker ? <Panel title="Speaker patrocinado" description="Propón el speaker que representará a tu marca.">
              <div className="px-5 py-5">
                {speakerSubmissions.length > 0 ? <ul className="space-y-3">
                    {speakerSubmissions.map((submission) => <li key={submission.id} className="rounded-lg border border-line px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-brand">{submission.name}</p>
                          <StatusBadge label={speakerSubmissionMeta[submission.status].label} tone={speakerSubmissionMeta[submission.status].tone} />
                        </div>
                        {submission.topic ? <p className="mt-1 text-sm text-ink-muted">{submission.topic}</p> : null}
                      </li>)}
                  </ul> : null}

                {speakerSubmissions.every((submission) => submission.status === 'rechazado') ? <form className="mt-4 space-y-3" onSubmit={submitSpeaker}>
                    <p className="text-xs text-ink-muted">{speakerSubmissions.length > 0 ? 'Envía una nueva propuesta.' : ''}</p>
                    <input required placeholder="Nombre del speaker" value={speakerForm.name} onChange={(event) => setSpeakerForm({ ...speakerForm, name: event.target.value })} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand" />
                    <input required type="email" placeholder="Correo" value={speakerForm.email} onChange={(event) => setSpeakerForm({ ...speakerForm, email: event.target.value })} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand" />
                    <input placeholder="Tema propuesto" value={speakerForm.topic} onChange={(event) => setSpeakerForm({ ...speakerForm, topic: event.target.value })} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand" />
                    <textarea placeholder="Biografía breve" rows={3} value={speakerForm.bio} onChange={(event) => setSpeakerForm({ ...speakerForm, bio: event.target.value })} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand" />
                    {speakerError ? <p role="alert" className="text-sm font-medium text-rose-700">{speakerError}</p> : null}
                    <button type="submit" disabled={submittingSpeaker} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep disabled:opacity-60">
                      {submittingSpeaker ? 'Enviando…' : 'Enviar propuesta'}
                    </button>
                  </form> : null}
              </div>
            </Panel> : null}
        </div>
      </div>
    </>;
}
