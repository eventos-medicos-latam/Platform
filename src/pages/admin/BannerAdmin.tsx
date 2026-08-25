import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownIcon, ArrowUpIcon, EyeIcon, ImageOffIcon, MousePointerClickIcon, PlusIcon, SmartphoneIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { formatNumber, formatPercent } from '../../utils/format';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EASE_EMPHASIS } from '../../utils/motion';
import { supabase } from '../../lib/supabaseClient';
import { AdminModal, modalFieldClass, ModalField } from '../../components/admin/AdminModal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { RowActions } from '../../components/admin/RowActions';
import { moveToTrash } from '../../lib/trash';

interface BannerConfig {
  edition_id: string;
  enabled: boolean;
  heading_label: string;
  surfaces: string[];
  desktop_speed_seconds: number;
  mobile_speed_seconds: number;
  mobile_enabled: boolean;
  collapsible: boolean;
}
interface Slot {
  id: string;
  edition_id: string;
  company_id: string;
  tier: 'principal' | 'destacado' | 'apoyo';
  order_num: number;
  active: boolean;
  impressions: number;
  clicks: number;
  logo_ready: boolean;
}
interface Company { id: string; trade_name: string; }
interface Participation { company_id: string; status: string; }

const tierLabels: Record<string, string> = { principal: 'Principal', destacado: 'Destacado', apoyo: 'Apoyo' };
const tierSize: Record<string, string> = { principal: 'h-7 text-[11px] px-3', destacado: 'h-6 text-[10px] px-2.5', apoyo: 'h-5 text-[9px] px-2' };
const surfaces: { id: string; label: string }[] = [{ id: 'evento', label: 'Páginas de evento' }, { id: 'corporativo', label: 'Home corporativa' }, { id: 'contenido', label: 'Contenidos' }];

export function BannerAdmin() {
  const { activeEditionId } = usePlatform();
  const [config, setConfig] = useState<BannerConfig | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [preview, setPreview] = useState<'movil' | 'escritorio'>('movil');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newSlotCompanyId, setNewSlotCompanyId] = useState('');
  const [newSlotTier, setNewSlotTier] = useState<Slot['tier']>('apoyo');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trashTarget, setTrashTarget] = useState<Slot | null>(null);
  const [trashing, setTrashing] = useState(false);

  const load = async () => {
    const [{ data: configRow }, { data: slotRows }, { data: companyRows }, { data: participationRows }] = await Promise.all([
      supabase.from('sponsor_banner_configs').select('*').eq('edition_id', activeEditionId).maybeSingle(),
      supabase.from('banner_slots').select('*').eq('edition_id', activeEditionId).order('order_num'),
      supabase.from('companies').select('id, trade_name'),
      supabase.from('participations').select('company_id, status').eq('edition_id', activeEditionId)
    ]);
    setConfig(configRow ?? { edition_id: activeEditionId, enabled: true, heading_label: 'Con el apoyo de', surfaces: [], desktop_speed_seconds: 30, mobile_speed_seconds: 20, mobile_enabled: true, collapsible: true });
    setSlots(slotRows ?? []);
    setCompanies(companyRows ?? []);
    setParticipations(participationRows ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditionId]);

  const saveConfig = async (patch: Partial<BannerConfig>) => {
    if (!config) return;
    const next = { ...config, ...patch };
    setConfig(next);
    await supabase.from('sponsor_banner_configs').upsert(next);
  };

  const updateSlot = async (slotId: string, patch: Partial<Slot>) => {
    setSlots((current) => current.map((slot) => slot.id === slotId ? { ...slot, ...patch } : slot));
    await supabase.from('banner_slots').update(patch).eq('id', slotId);
  };

  const moveSlot = async (slotId: string, direction: -1 | 1) => {
    const ordered = [...slots].sort((a, b) => a.order_num - b.order_num);
    const index = ordered.findIndex((slot) => slot.id === slotId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    const updates = next.map((slot, position) => ({ ...slot, order_num: position + 1 }));
    setSlots(updates);
    await Promise.all(updates.map((slot) => supabase.from('banner_slots').update({ order_num: slot.order_num }).eq('id', slot.id)));
  };

  const toggleSurface = (surface: string) => {
    if (!config) return;
    const next = config.surfaces.includes(surface) ? config.surfaces.filter((item) => item !== surface) : [...config.surfaces, surface];
    saveConfig({ surfaces: next });
  };

  const openAddSlot = () => { setNewSlotCompanyId(''); setNewSlotTier('apoyo'); setError(null); setAddModalOpen(true); };
  const submitAddSlot = async () => {
    if (!newSlotCompanyId) { setError('Selecciona una empresa.'); return; }
    setSaving(true);
    setError(null);
    const { error: submitError } = await supabase.from('banner_slots').insert({
      edition_id: activeEditionId, company_id: newSlotCompanyId, tier: newSlotTier, order_num: slots.length + 1, active: false, logo_ready: false
    });
    setSaving(false);
    if (submitError) { setError(submitError.message); return; }
    setAddModalOpen(false);
    load();
  };

  const confirmTrash = async () => {
    if (!trashTarget) return;
    setTrashing(true);
    const { error: trashError } = await moveToTrash('banner_slots', trashTarget.id);
    setTrashing(false);
    if (trashError) { setError(trashError); return; }
    setTrashTarget(null);
    load();
  };

  if (!config) return null;

  const ordered = [...slots].sort((a, b) => a.order_num - b.order_num);
  const activeSlots = ordered.filter((slot) => slot.active);
  const published = new Set(participations.filter((p) => p.status === 'publicado').map((p) => p.company_id));
  const impressions = ordered.reduce((total, slot) => total + slot.impressions, 0);
  const clicks = ordered.reduce((total, slot) => total + slot.clicks, 0);
  const availableCompanies = companies.filter((company) => !slots.some((slot) => slot.company_id === company.id));

  return <>
      <ModuleHeader eyebrow="Comercial" title="Banner de patrocinadores" description="Controla qué marcas aparecen, con qué peso y en qué superficies." actions={<div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink">
              <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={config.enabled} onChange={(event) => saveConfig({ enabled: event.target.checked })} />
              Banner activo
            </label>
            <button type="button" onClick={openAddSlot} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-emphasis hover:bg-brand-deep">
              <PlusIcon size={15} /> Agregar marca
            </button>
          </div>} />

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <Panel emphasis title="Marcas en la cinta" description="El nivel define tamaño y frecuencia. Reordena con las flechas.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-canvas">
                  <tr>
                    <th className={thClass}>Orden</th>
                    <th className={thClass}>Empresa</th>
                    <th className={thClass}>Nivel</th>
                    <th className={thClass}>Logo</th>
                    <th className={thClass}>Impresiones</th>
                    <th className={thClass}>Clics</th>
                    <th className={thClass}>CTR</th>
                    <th className={thClass}>Activo</th>
                    <th className={thClass} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {ordered.map((slot, index) => {
                  const company = companies.find((c) => c.id === slot.company_id);
                  const isPublished = published.has(slot.company_id);
                  return <tr key={slot.id} className="transition-colors duration-150 hover:bg-canvas">
                        <td className={tdClass}>
                          <div className="flex items-center gap-1">
                            <span className="w-4 tabular-nums text-ink-muted">{slot.order_num}</span>
                            <button type="button" onClick={() => moveSlot(slot.id, -1)} disabled={index === 0} aria-label="Subir" className="rounded p-1 text-ink-muted hover:bg-brand-soft disabled:opacity-30">
                              <ArrowUpIcon size={13} />
                            </button>
                            <button type="button" onClick={() => moveSlot(slot.id, 1)} disabled={index === ordered.length - 1} aria-label="Bajar" className="rounded p-1 text-ink-muted hover:bg-brand-soft disabled:opacity-30">
                              <ArrowDownIcon size={13} />
                            </button>
                          </div>
                        </td>
                        <td className={`${tdClass} font-medium text-brand`}>
                          {company?.trade_name ?? slot.company_id}
                          {!isPublished ? <span className="ml-2 align-middle"><StatusBadge label="No publicada" tone="warning" /></span> : null}
                        </td>
                        <td className={tdClass}>
                          <select value={slot.tier} onChange={(event) => updateSlot(slot.id, { tier: event.target.value as Slot['tier'] })} className="rounded-lg border border-line bg-white px-2 py-1 text-xs text-ink">
                            {Object.entries(tierLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                          </select>
                        </td>
                        <td className={tdClass}>
                          {slot.logo_ready ? <StatusBadge label="SVG listo" tone="success" /> : <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
                              <ImageOffIcon size={13} /> Falta SVG
                            </span>}
                        </td>
                        <td className={tdClass}>{formatNumber(slot.impressions)}</td>
                        <td className={tdClass}>{formatNumber(slot.clicks)}</td>
                        <td className={tdClass}>{slot.impressions > 0 ? formatPercent(slot.clicks / slot.impressions) : '—'}</td>
                        <td className={tdClass}>
                          <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={slot.active} disabled={!slot.logo_ready || !isPublished} onChange={(event) => updateSlot(slot.id, { active: event.target.checked })} aria-label={`Activar ${company?.trade_name ?? slot.company_id}`} />
                        </td>
                        <td className={tdClass}>
                          <RowActions onDelete={() => setTrashTarget(slot)} />
                        </td>
                      </tr>;
                })}
                </tbody>
              </table>
            </div>
            <p className="border-t border-line bg-canvas px-5 py-3 text-xs text-ink-muted">
              Una marca solo puede activarse si su participación está publicada y su logo vectorial está aprobado.
            </p>
          </Panel>

          <div className="grid gap-5 sm:grid-cols-2">
            <Panel title="Superficies" description="Dónde se muestra la cinta.">
              <ul className="divide-y divide-line">
                {surfaces.map((surface) => <li key={surface.id} className="px-5 py-3">
                    <label className="flex items-center gap-3 text-sm text-ink">
                      <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={config.surfaces.includes(surface.id)} onChange={() => toggleSurface(surface.id)} />
                      {surface.label}
                    </label>
                  </li>)}
              </ul>
            </Panel>

            <Panel title="Comportamiento" description="Velocidad y opciones por dispositivo.">
              <div className="space-y-4 px-5 py-4">
                <label className="block">
                  <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-muted">
                    Vuelta completa · escritorio
                    <span className="font-semibold text-brand">{config.desktop_speed_seconds}s</span>
                  </span>
                  <input type="range" min={20} max={80} value={config.desktop_speed_seconds} onChange={(event) => saveConfig({ desktop_speed_seconds: Number(event.target.value) })} className="w-full accent-[color:var(--brand)]" />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-muted">
                    Vuelta completa · móvil
                    <span className="font-semibold text-brand">{config.mobile_speed_seconds}s</span>
                  </span>
                  <input type="range" min={15} max={60} value={config.mobile_speed_seconds} onChange={(event) => saveConfig({ mobile_speed_seconds: Number(event.target.value) })} className="w-full accent-[color:var(--brand)]" />
                </label>
                <label className="flex items-center gap-2.5 text-sm text-ink">
                  <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={config.mobile_enabled} onChange={(event) => saveConfig({ mobile_enabled: event.target.checked })} />
                  Franja fija en móvil
                </label>
                <label className="flex items-center gap-2.5 text-sm text-ink">
                  <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={config.collapsible} onChange={(event) => saveConfig({ collapsible: event.target.checked })} />
                  El usuario puede colapsarla
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-muted">Etiqueta del encabezado</span>
                  <input value={config.heading_label} onChange={(event) => saveConfig({ heading_label: event.target.value })} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis focus:border-brand" />
                </label>
              </div>
            </Panel>
          </div>
        </div>

        <div className="space-y-5">
          <Panel title="Vista previa en vivo" actions={<div className="flex rounded-lg border border-line p-0.5">
                {(['movil', 'escritorio'] as const).map((mode) => <button key={mode} type="button" onClick={() => setPreview(mode)} className={`relative rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors duration-150 ease-emphasis ${preview === mode ? 'text-white' : 'text-ink-muted'}`}>
                    {preview === mode ? <motion.span layoutId="banner-preview-tab" className="absolute inset-0 rounded-md bg-brand" transition={{ duration: 0.2, ease: EASE_EMPHASIS }} /> : null}
                    <span className="relative">{mode}</span>
                  </button>)}
              </div>}>
            <div className="flex justify-center bg-canvas px-5 py-7">
              {preview === 'movil' ? <div className="w-[248px] overflow-hidden rounded-[26px] border-[6px] border-brand-deep bg-white shadow-lift">
                  <div className="h-5 bg-brand-deep" />
                  <div className="space-y-2 px-3 py-4">
                    <div className="skeleton h-3 w-4/5" />
                    <div className="skeleton h-3 w-3/5" />
                    <div className="skeleton h-20 w-full" />
                  </div>
                  {config.enabled && config.mobile_enabled ? <div className="overflow-hidden border-t border-line bg-canvas px-2 py-1.5" style={{ ['--marquee-duration' as string]: `${config.mobile_speed_seconds}s` }}>
                      <p className="text-[7px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{config.heading_label}</p>
                      <div className="mt-1 overflow-hidden">
                        <div className="marquee-track flex w-max items-center gap-2">
                          {[...activeSlots, ...activeSlots].map((slot, index) => <span key={`${slot.id}-${index}`} className={`grid shrink-0 place-items-center rounded bg-brand font-semibold text-white ${tierSize[slot.tier]}`}>
                              {companies.find((c) => c.id === slot.company_id)?.trade_name ?? '—'}
                            </span>)}
                        </div>
                      </div>
                    </div> : <div className="border-t border-line bg-canvas px-3 py-2 text-center text-[8px] text-ink-muted">Franja desactivada</div>}
                </div> : <div className="w-full max-w-sm overflow-hidden rounded-xl border border-line bg-white">
                  <div className="space-y-2 px-4 py-4">
                    <div className="skeleton h-3 w-1/2" />
                    <div className="skeleton h-16 w-full" />
                  </div>
                  {config.enabled ? <div className="flex items-center gap-3 border-t border-line bg-canvas px-4 py-3" style={{ ['--marquee-duration' as string]: `${config.desktop_speed_seconds}s` }}>
                      <span className="shrink-0 text-[8px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{config.heading_label}</span>
                      <div className="overflow-hidden">
                        <div className="marquee-track flex w-max items-center gap-2.5">
                          {[...activeSlots, ...activeSlots].map((slot, index) => <span key={`${slot.id}-${index}`} className={`grid shrink-0 place-items-center rounded bg-brand font-semibold text-white ${tierSize[slot.tier]}`}>
                              {companies.find((c) => c.id === slot.company_id)?.trade_name ?? '—'}
                            </span>)}
                        </div>
                      </div>
                    </div> : <div className="border-t border-line bg-canvas px-4 py-3 text-center text-[10px] text-ink-muted">Banner desactivado</div>}
                </div>}
            </div>
            <p className="flex items-center gap-2 border-t border-line px-5 py-3 text-xs text-ink-muted">
              <SmartphoneIcon size={14} /> En móvil la franja vive bajo la barra de inscripción.
            </p>
          </Panel>

          <Panel title="Retorno del banner">
            <dl className="divide-y divide-line">
              <div className="flex items-center justify-between gap-4 px-5 py-3">
                <dt className="flex items-center gap-2 text-sm text-ink-muted"><EyeIcon size={15} /> Impresiones acumuladas</dt>
                <dd className="text-sm font-semibold text-brand">{formatNumber(impressions)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-3">
                <dt className="flex items-center gap-2 text-sm text-ink-muted"><MousePointerClickIcon size={15} /> Clics acumulados</dt>
                <dd className="text-sm font-semibold text-brand">{formatNumber(clicks)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-3">
                <dt className="text-sm text-ink-muted">CTR global</dt>
                <dd className="text-sm font-semibold text-brand">{impressions > 0 ? formatPercent(clicks / impressions) : '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-3">
                <dt className="text-sm text-ink-muted">Marcas activas</dt>
                <dd className="text-sm font-semibold text-brand">{activeSlots.length} de {ordered.length}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>

      <AdminModal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Agregar marca al banner" onSubmit={submitAddSlot} submitting={saving} error={error}>
        <div className="space-y-4">
          <ModalField label="Empresa">
            <select className={modalFieldClass} value={newSlotCompanyId} onChange={(event) => setNewSlotCompanyId(event.target.value)}>
              <option value="">Selecciona una empresa</option>
              {availableCompanies.map((company) => <option key={company.id} value={company.id}>{company.trade_name}</option>)}
            </select>
          </ModalField>
          <ModalField label="Nivel">
            <select className={modalFieldClass} value={newSlotTier} onChange={(event) => setNewSlotTier(event.target.value as Slot['tier'])}>
              {Object.entries(tierLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </ModalField>
        </div>
      </AdminModal>

      <ConfirmDialog open={Boolean(trashTarget)} title="¿Quitar esta marca del banner?" description={companies.find((c) => c.id === trashTarget?.company_id)?.trade_name} onConfirm={confirmTrash} onCancel={() => setTrashTarget(null)} loading={trashing} confirmLabel="Mover a la papelera" />
    </>;
}
