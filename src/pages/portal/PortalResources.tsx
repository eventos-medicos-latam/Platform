import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarIcon, CheckCircle2Icon, DownloadIcon, FileTextIcon, GraduationCapIcon, LinkIcon, MessagesSquareIcon, MonitorPlayIcon, RocketIcon, SendIcon, UserPlusIcon, UsersRoundIcon, XIcon } from 'lucide-react';
import { ModuleHeader, Panel } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { supabase } from '../../lib/supabaseClient';
import { getCompanyFileUrl } from '../../lib/storage';
import { EASE_EMPHASIS } from '../../utils/motion';

interface Resource { id: string; category: 'agenda' | 'presskit' | 'tematico' | 'otro'; title: string; description: string | null; file_path: string | null; external_url: string | null; }
interface DigitalEvent { id: string; title: string; kind: string; date: string | null; time: string | null; modality: string; }
interface EventRegistration { secondary_event_id: string; email: string; }

const categoryLabels: Record<Resource['category'], string> = { agenda: 'Agenda', presskit: 'Presskit', tematico: 'Documentos temáticos', otro: 'Otros' };

const kindMeta: Record<string, { icon: typeof MonitorPlayIcon; label: string; bar: string; bg: string; fg: string }> = {
  webinar: { icon: MonitorPlayIcon, label: 'Webinar', bar: 'bg-[#1c5f8c]', bg: 'bg-[#e8eef6]', fg: 'text-[#1c5f8c]' },
  conversatorio: { icon: MessagesSquareIcon, label: 'Conversatorio', bar: 'bg-[#0f7a7a]', bg: 'bg-[#e3f3f3]', fg: 'text-[#0f7a7a]' },
  masterclass: { icon: UsersRoundIcon, label: 'Masterclass', bar: 'bg-[#7c6bc0]', bg: 'bg-[#f1eafb]', fg: 'text-[#7c6bc0]' },
  curso: { icon: GraduationCapIcon, label: 'Curso', bar: 'bg-[#b07a2c]', bg: 'bg-[#faf1e2]', fg: 'text-[#b07a2c]' },
  lanzamiento: { icon: RocketIcon, label: 'Lanzamiento', bar: 'bg-[#d6338c]', bg: 'bg-[#fdeef4]', fg: 'text-[#d6338c]' }
};
function metaOf(kind: string) {
  return kindMeta[kind] ?? kindMeta.webinar;
}
function daysUntil(date: string): number {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function PortalResources() {
  const { session, activeEditionId } = usePlatform();
  const companyId = session?.companyId;
  const [tab, setTab] = useState<'descargables' | 'agenda'>('agenda');
  const [resources, setResources] = useState<Resource[]>([]);
  const [digitalEvents, setDigitalEvents] = useState<DigitalEvent[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<EventRegistration[]>([]);
  const [kindFilter, setKindFilter] = useState('todos');
  const [inviteEvent, setInviteEvent] = useState<DigitalEvent | null>(null);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '' });
  const [inviteSent, setInviteSent] = useState(false);

  const load = async () => {
    const [{ data: resourceRows }, { data: eventRows }] = await Promise.all([
      supabase.from('portal_resources').select('id, category, title, description, file_path, external_url').eq('edition_id', activeEditionId).order('order_num'),
      supabase.from('secondary_events').select('id, title, kind, date, time, modality').eq('related_edition_id', activeEditionId).in('status', ['aprobado', 'publicado']).order('date')
    ]);
    setResources(resourceRows ?? []);
    setDigitalEvents(eventRows ?? []);
    if (companyId) {
      const { data: regRows } = await supabase.from('secondary_event_registrations').select('secondary_event_id, email').eq('company_id', companyId);
      setMyRegistrations(regRows ?? []);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, activeEditionId]);

  const download = async (resource: Resource) => {
    if (resource.external_url) { window.open(resource.external_url, '_blank', 'noopener'); return; }
    if (!resource.file_path) return;
    const url = await getCompanyFileUrl(resource.file_path);
    if (url) window.open(url, '_blank', 'noopener');
  };

  const applySelf = async (eventId: string) => {
    if (!companyId || !session) return;
    await supabase.from('secondary_event_registrations').insert({ secondary_event_id: eventId, company_id: companyId, full_name: session.name, email: session.email });
    load();
  };

  const openInvite = (digitalEvent: DigitalEvent) => {
    setInviteEvent(digitalEvent);
    setInviteForm({ name: '', email: '' });
    setInviteSent(false);
  };

  const sendInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyId || !inviteEvent || !inviteForm.name.trim() || !inviteForm.email.trim()) return;
    await supabase.from('secondary_event_registrations').insert({ secondary_event_id: inviteEvent.id, company_id: companyId, full_name: inviteForm.name, email: inviteForm.email });
    setInviteSent(true);
    load();
  };

  const kinds = useMemo(() => {
    const set = new Set(digitalEvents.map((event) => event.kind));
    return ['todos', ...Array.from(set)];
  }, [digitalEvents]);
  const filteredEvents = kindFilter === 'todos' ? digitalEvents : digitalEvents.filter((event) => event.kind === kindFilter);

  const grouped = (Object.keys(categoryLabels) as Resource['category'][]).map((category) => ({
    category,
    items: resources.filter((resource) => resource.category === category)
  })).filter((group) => group.items.length > 0);

  if (!companyId) {
    return <ModuleHeader eyebrow="Portal" title="Recursos" description="Tu usuario todavía no está vinculado a una empresa. Contacta al equipo organizador." />;
  }

  return <>
      <ModuleHeader eyebrow="Portal" title="Recursos" description="Descargables del evento y toda la formación digital abierta a tu marca." actions={<div className="flex gap-1.5">
            {([{ id: 'agenda', label: 'Agenda digital' }, { id: 'descargables', label: 'Descargables' }] as const).map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors duration-150 ease-emphasis ${tab === item.id ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink-muted hover:text-brand'}`}>
                {item.label}
              </button>)}
          </div>} />

      {tab === 'descargables' ? <div className="space-y-5">
          {grouped.map((group) => <Panel key={group.category} title={categoryLabels[group.category]}>
              <ul className="divide-y divide-line">
                {group.items.map((resource) => <li key={resource.id} className="flex items-center gap-3 px-5 py-3.5">
                    {resource.external_url ? <LinkIcon size={16} className="shrink-0 text-ink-muted" /> : <FileTextIcon size={16} className="shrink-0 text-ink-muted" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand">{resource.title}</p>
                      {resource.description ? <p className="text-xs text-ink-muted">{resource.description}</p> : null}
                    </div>
                    <button type="button" onClick={() => download(resource)} className="rounded-lg p-2 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-canvas hover:text-brand">
                      <DownloadIcon size={16} />
                    </button>
                  </li>)}
              </ul>
            </Panel>)}
          {grouped.length === 0 ? <Panel title="Descargables">
              <p className="px-5 py-8 text-center text-sm text-ink-muted">Todavía no hay recursos publicados para esta edición.</p>
            </Panel> : null}
        </div> : <div className="relative overflow-hidden rounded-3xl bg-brand-deep p-7 sm:p-8">
          <div className="grid-texture absolute inset-0" aria-hidden="true" />
          <div className="relative">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-accent">Formación digital · todo el año</p>
            <h2 className="mt-2 max-w-lg text-2xl font-extrabold leading-tight text-white">
              Postula tu marca o invita a tu red a cada sesión
            </h2>

            <div className="mt-6 flex flex-wrap gap-2">
              {kinds.map((kind) => <button key={kind} type="button" onClick={() => setKindFilter(kind)} className={`rounded-full border px-3.5 py-2 text-xs font-semibold capitalize transition-colors duration-150 ease-emphasis ${kindFilter === kind ? 'border-white bg-white text-brand-deep' : 'border-white/20 text-white/70 hover:border-white/50 hover:text-white'}`}>
                  {kind === 'todos' ? 'Todas' : metaOf(kind).label}
                </button>)}
            </div>

            {filteredEvents.length === 0 ? <p className="mt-10 rounded-2xl border border-dashed border-white/20 px-6 py-12 text-center text-white/60">
                No hay sesiones publicadas todavía para esta edición.
              </p> : <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredEvents.map((digitalEvent) => {
              const meta = metaOf(digitalEvent.kind);
              const Icon = meta.icon;
              const applied = myRegistrations.some((registration) => registration.secondary_event_id === digitalEvent.id && registration.email === session?.email);
              const days = digitalEvent.date ? daysUntil(digitalEvent.date) : null;
              const soon = days !== null && days >= 0 && days <= 14;
              return <li key={digitalEvent.id} className="card-lift relative flex flex-col overflow-hidden rounded-2xl bg-white">
                      <span className={`absolute inset-x-0 top-0 h-[5px] ${meta.bar}`} aria-hidden="true" />
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <span className={`grid h-9 w-9 place-items-center rounded-xl ${meta.bg} ${meta.fg}`}>
                            <Icon size={17} />
                          </span>
                          {soon ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d6338c] px-2.5 py-1 text-[10.5px] font-extrabold text-white">
                              <motion.span className="h-1.5 w-1.5 rounded-full bg-white" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.7, repeat: Infinity }} />
                              {days === 0 ? 'Hoy' : `En ${days} día${days === 1 ? '' : 's'}`}
                            </span> : null}
                        </div>
                        <p className={`mt-3.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em] ${meta.fg}`}>
                          {meta.label} · {digitalEvent.modality}
                        </p>
                        <h3 className="mt-1.5 text-[15px] font-extrabold leading-snug text-brand">
                          {digitalEvent.title}
                        </h3>
                        <p className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                          <CalendarIcon size={13} />
                          {digitalEvent.date ?? 'Fecha por confirmar'} {digitalEvent.time ?? ''}
                        </p>
                      </div>
                      <div className="flex gap-2 px-5 pb-5">
                        <button type="button" disabled={applied} onClick={() => applySelf(digitalEvent.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand px-3 py-2.5 text-xs font-bold text-white transition-colors duration-150 ease-emphasis hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50">
                          <SendIcon size={13} /> {applied ? 'Ya postulado' : 'Postularme'}
                        </button>
                        <button type="button" onClick={() => openInvite(digitalEvent)} className="flex items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2.5 text-xs font-bold text-brand transition-colors duration-150 ease-emphasis hover:border-brand/40">
                          <UserPlusIcon size={13} /> Invitar
                        </button>
                      </div>
                    </li>;
            })}
              </ul>}
          </div>
        </div>}

      <AnimatePresence>
        {inviteEvent ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-deep/55 p-4 backdrop-blur-[2px]" onClick={() => setInviteEvent(null)}>
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.18, ease: EASE_EMPHASIS }} className="w-full max-w-md rounded-2xl bg-white p-7 shadow-lift" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
                    <UserPlusIcon size={17} />
                  </span>
                  <h3 className="mt-3 text-lg font-extrabold text-brand">Invita a tu red</h3>
                </div>
                <button type="button" onClick={() => setInviteEvent(null)} className="rounded-lg p-1.5 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-canvas hover:text-brand">
                  <XIcon size={18} />
                </button>
              </div>

              {inviteSent ? <div className="mt-5 flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-3.5">
                  <CheckCircle2Icon size={18} className="mt-0.5 shrink-0 text-emerald-700" />
                  <p className="text-sm font-medium text-emerald-800">
                    Listo, {inviteForm.name} quedó registrado en "{inviteEvent.title}".
                  </p>
                </div> : <>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    Regístralo directo en <strong className="text-ink">{inviteEvent.title}</strong> a nombre de tu empresa — recibirá la confirmación al correo que indiques.
                  </p>
                  <form className="mt-5 space-y-3" onSubmit={sendInvite}>
                    <input required placeholder="Nombre del profesional" value={inviteForm.name} onChange={(event) => setInviteForm({ ...inviteForm, name: event.target.value })} className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
                    <input required type="email" placeholder="Correo" value={inviteForm.email} onChange={(event) => setInviteForm({ ...inviteForm, email: event.target.value })} className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
                    <button type="submit" className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
                      Enviar invitación
                    </button>
                  </form>
                </>}
            </motion.div>
          </div> : null}
      </AnimatePresence>
    </>;
}
