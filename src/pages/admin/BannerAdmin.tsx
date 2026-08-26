import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownIcon, ArrowUpIcon, EyeIcon, ImageOffIcon, MousePointerClickIcon, PlusIcon, UploadIcon } from 'lucide-react';
import { ModuleHeader, Panel, tdClass, thClass } from '../../components/admin/Panel';
import { usePlatform } from '../../contexts/PlatformContext';
import { formatNumber, formatPercent } from '../../utils/format';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SponsorLogoTile } from '../../components/public/SponsorLogoTile';
import { EASE_EMPHASIS } from '../../utils/motion';
import { supabase } from '../../lib/supabaseClient';
import { setCompanyLogo, uploadPublicAsset } from '../../lib/storage';
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
  company_id: string | null;
  standalone_name: string | null;
  standalone_logo_url: string | null;
  tier: 'principal' | 'destacado' | 'apoyo';
  order_num: number;
  active: boolean;
  impressions: number;
  clicks: number;
  logo_ready: boolean;
}
interface Company { id: string; trade_name: string; logo_url: string | null; }
interface Participation { company_id: string; status: string; }

const tierLabels: Record<string, string> = { principal: 'Principal', destacado: 'Destacado', apoyo: 'Apoyo' };
const surfaces: { id: string; label: string }[] = [{ id: 'evento', label: 'Páginas de evento' }, { id: 'corporativo', label: 'Home corporativa' }, { id: 'contenido', label: 'Contenidos' }];

export function BannerAdmin() {
  const { activeEditionId } = usePlatform();
  const [config, setConfig] = useState<BannerConfig | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [preview, setPreview] = useState<'movil' | 'escritorio'>('movil');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newSlotMode, setNewSlotMode] = useState<'empresa' | 'abierto'>('empresa');
  const [newSlotCompanyId, setNewSlotCompanyId] = useState('');
  const [newSlotTier, setNewSlotTier] = useState<Slot['tier']>('apoyo');
  const [newStandaloneName, setNewStandaloneName] = useState('');
  const [newStandaloneFile, setNewStandaloneFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trashTarget, setTrashTarget] = useState<Slot | null>(null);
  const [trashing, setTrashing] = useState(false);
  const [logoUploadingId, setLogoUploadingId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: configRow }, { data: slotRows }, { data: companyRows }, { data: participationRows }] = await Promise.all([
      supabase.from('sponsor_banner_configs').select('*').eq('edition_id', activeEditionId).maybeSingle(),
      supabase.from('banner_slots').select('*').eq('edition_id', activeEditionId).order('order_num'),
      supabase.from('companies').select('id, trade_name, logo_url'),
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

  const openAddSlot = () => { setNewSlotMode('empresa'); setNewSlotCompanyId(''); setNewSlotTier('apoyo'); setNewStandaloneName(''); setNewStandaloneFile(null); setError(null); setAddModalOpen(true); };
  const submitAddSlot = async () => {
    setSaving(true);
    setError(null);
    if (newSlotMode === 'empresa') {
      if (!newSlotCompanyId) { setSaving(false); setError('Selecciona una empresa.'); return; }
      const { error: submitError } = await supabase.from('banner_slots').insert({
        edition_id: activeEditionId, company_id: newSlotCompanyId, tier: newSlotTier, order_num: slots.length + 1, active: false, logo_ready: false
      });
      setSaving(false);
      if (submitError) { setError(submitError.message); return; }
    } else {
      if (!newStandaloneName.trim() || !newStandaloneFile) { setSaving(false); setError('Nombre y logo son obligatorios.'); return; }
      const { url, error: uploadError } = await uploadPublicAsset(newStandaloneFile);
      if (uploadError || !url) { setSaving(false); setError(uploadError ?? 'Error subiendo el logo'); return; }
      const { error: submitError } = await supabase.from('banner_slots').insert({
        edition_id: activeEditionId, company_id: null, standalone_name: newStandaloneName.trim(), standalone_logo_url: url, tier: newSlotTier, order_num: slots.length + 1, active: false, logo_ready: true
      });
      setSaving(false);
      if (submitError) { setError(submitError.message); return; }
    }
    setAddModalOpen(false);
    load();
  };

  const reuploadLogo = async (slot: Slot, file: File) => {
    setLogoUploadingId(slot.id);
    if (slot.company_id) {
      await setCompanyLogo(slot.company_id, file);
    } else {
      const { url } = await uploadPublicAsset(file);
      if (url) await supabase.from('banner_slots').update({ standalone_logo_url: url }).eq('id', slot.id);
    }
    setLogoUploadingId(null);
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

  function slotPreviewDisplay(slot: Slot): { name: string; logoUrl: string | null; hasLogo: boolean } {
    if (slot.company_id) {
      const company = companies.find((c) => c.id === slot.company_id);
      return { name: company?.trade_name ?? '—', logoUrl: company?.logo_url ?? null, hasLogo: slot.logo_ready && Boolean(company?.logo_url) };
    }
    return { name: slot.standalone_name ?? '—', logoUrl: slot.standalone_logo_url, hasLogo: Boolean(slot.standalone_logo_url) };
  }

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
                  const company = slot.company_id ? companies.find((c) => c.id === slot.company_id) : undefined;
                  const displayName = company?.trade_name ?? slot.standalone_name ?? '—';
                  const isPublished = slot.company_id ? published.has(slot.company_id) : true;
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
                          {displayName}
                          {!slot.company_id ? <span className="ml-2 align-middle"><StatusBadge label="Logo abierto" tone="neutral" /></span> : null}
                          {slot.company_id && !isPublished ? <span className="ml-2 align-middle"><StatusBadge label="No publicada" tone="warning" /></span> : null}
                        </td>
                        <td className={tdClass}>
                          <select value={slot.tier} onChange={(event) => updateSlot(slot.id, { tier: event.target.value as Slot['tier'] })} className="rounded-lg border border-line bg-white px-2 py-1 text-xs text-ink">
                            {Object.entries(tierLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                          </select>
                        </td>
                        <td className={tdClass}>
                          <div className="flex items-center gap-2">
                            {slot.logo_ready ? <StatusBadge label="Logo listo" tone="success" /> : <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
                                <ImageOffIcon size={13} /> Falta logo
                              </span>}
                            <label className="inline-flex cursor-pointer items-center gap-1 rounded p-1 text-ink-muted hover:bg-brand-soft hover:text-brand" title="Subir/corregir logo">
                              {logoUploadingId === slot.id ? <span className="text-[10px]">…</span> : <UploadIcon size={13} />}
                              <input type="file" accept="image/*" className="hidden" disabled={logoUploadingId === slot.id} onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) reuploadLogo(slot, file);
                            }} />
                            </label>
                          </div>
                        </td>
                        <td className={tdClass}>{formatNumber(slot.impressions)}</td>
                        <td className={tdClass}>{formatNumber(slot.clicks)}</td>
                        <td className={tdClass}>{slot.impressions > 0 ? formatPercent(slot.clicks / slot.impressions) : '—'}</td>
                        <td className={tdClass}>
                          <input type="checkbox" className="h-4 w-4 accent-[color:var(--brand)]" checked={slot.active} disabled={!slot.logo_ready || !isPublished} onChange={(event) => updateSlot(slot.id, { active: event.target.checked })} aria-label={`Activar ${displayName}`} />
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
              Una empresa solo puede activarse si su participación está publicada y tiene logo. Un logo abierto solo necesita tener logo cargado.
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
            <div className="bg-canvas px-5 py-7">
              {activeSlots.length === 0 ? <p className="rounded-xl border border-dashed border-line bg-white px-6 py-10 text-center text-sm text-ink-muted">
                  Ninguna marca activa todavía — actívalas en la tabla de la izquierda para verlas aquí.
                </p> : preview === 'movil' ? <div className="mx-auto w-[280px] overflow-hidden rounded-2xl border border-line bg-canvas/95 shadow-lift">
                  <div className="flex items-center justify-between px-3 pt-2">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{config.heading_label}</span>
                  </div>
                  <div className="no-scrollbar overflow-x-auto px-3 pb-3 pt-2">
                    <div className="flex items-center gap-3">
                      {activeSlots.map((slot) => {
                      const display = slotPreviewDisplay(slot);
                      return <SponsorLogoTile key={slot.id} name={display.name} logoUrl={display.logoUrl} hasLogo={display.hasLogo} size="mobile" />;
                    })}
                    </div>
                  </div>
                </div> : <div className="overflow-hidden rounded-2xl border border-line bg-[#1a1a3d] px-6 py-6">
                  <div className="flex items-center gap-6">
                    <p className="w-24 shrink-0 text-[11px] font-semibold uppercase leading-tight tracking-[0.18em] text-white/60">
                      {config.heading_label}
                    </p>
                    <div className="no-scrollbar min-w-0 flex-1 overflow-x-auto">
                      <div className="flex items-center gap-5 py-1">
                        {activeSlots.map((slot) => {
                        const display = slotPreviewDisplay(slot);
                        return <SponsorLogoTile key={slot.id} name={display.name} logoUrl={display.logoUrl} hasLogo={display.hasLogo} size="desktop" />;
                      })}
                      </div>
                    </div>
                  </div>
                </div>}
              {!config.enabled ? <p className="mt-3 text-center text-xs font-medium text-amber-700">Banner desactivado — esto es solo un preview.</p> : null}
            </div>
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
          <ModalField label="Tipo">
            <div className="flex rounded-lg border border-line p-0.5">
              {([{ id: 'empresa', label: 'Empresa registrada' }, { id: 'abierto', label: 'Logo abierto' }] as const).map((option) => <button key={option.id} type="button" onClick={() => setNewSlotMode(option.id)} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ease-emphasis ${newSlotMode === option.id ? 'bg-brand text-white' : 'text-ink-muted'}`}>
                  {option.label}
                </button>)}
            </div>
          </ModalField>
          {newSlotMode === 'empresa' ? <ModalField label="Empresa">
              <select className={modalFieldClass} value={newSlotCompanyId} onChange={(event) => setNewSlotCompanyId(event.target.value)}>
                <option value="">Selecciona una empresa</option>
                {availableCompanies.map((company) => <option key={company.id} value={company.id}>{company.trade_name}</option>)}
              </select>
            </ModalField> : <>
              <ModalField label="Nombre a mostrar">
                <input className={modalFieldClass} value={newStandaloneName} onChange={(event) => setNewStandaloneName(event.target.value)} placeholder="Ej. Medio aliado / Institución" />
              </ModalField>
              <ModalField label="Logo">
                <input type="file" accept="image/*" className={modalFieldClass} onChange={(event) => setNewStandaloneFile(event.target.files?.[0] ?? null)} />
              </ModalField>
            </>}
          <ModalField label="Nivel">
            <select className={modalFieldClass} value={newSlotTier} onChange={(event) => setNewSlotTier(event.target.value as Slot['tier'])}>
              {Object.entries(tierLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </ModalField>
        </div>
      </AdminModal>

      <ConfirmDialog open={Boolean(trashTarget)} title="¿Quitar esta marca del banner?" description={trashTarget?.company_id ? companies.find((c) => c.id === trashTarget.company_id)?.trade_name : trashTarget?.standalone_name ?? undefined} onConfirm={confirmTrash} onCancel={() => setTrashTarget(null)} loading={trashing} confirmLabel="Mover a la papelera" />
    </>;
}
