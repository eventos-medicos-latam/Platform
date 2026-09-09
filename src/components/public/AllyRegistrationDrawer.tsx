import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeftIcon, ArrowRightIcon, BuildingIcon,
  CheckCircle2Icon, Loader2Icon, SearchIcon, UserIcon, XIcon,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { EASE_EMPHASIS } from '../../utils/motion';

/* ── Static data ──────────────────────────────────────────────────────────── */
const COUNTRIES = [
  'Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'Ecuador',
  'Venezuela', 'Bolivia', 'Paraguay', 'Uruguay', 'Guatemala', 'Honduras',
  'El Salvador', 'Nicaragua', 'Costa Rica', 'Panamá', 'Cuba',
  'República Dominicana', 'España', 'Otro',
];

const SECTORS = [
  'Farmacéutica', 'Nutrición clínica', 'Suplementación',
  'Cosmética y estética médica', 'Dispositivos médicos',
  'Tecnología en salud', 'Educación médica',
  'Laboratorio clínico', 'Biotecnología',
  'Sociedad médica / Gremio', 'Universidad / Investigación',
  'Medio especializado', 'Otro',
];

const CARGOS = [
  'Gerente General', 'Director(a) Comercial', 'Director(a) de Marketing',
  'Gerente de Marca', 'Director(a) de Asuntos Médicos',
  'Representante médico(a)', 'Coordinador(a) comercial',
  'Director(a) Académico(a)', 'Jefe de Comunicaciones', 'Otro',
];

/* ── Types ────────────────────────────────────────────────────────────────── */
interface CompanyResult {
  id: string; trade_name: string; legal_name: string | null;
  nit: string | null; city: string | null; country: string | null;
  contact_name: string | null; contact_whatsapp: string | null;
}

type Step = 'search' | 'email' | 'empresa' | 'contacto' | 'submitting' | 'success';

const STEP_TITLE: Record<Step, string> = {
  search: 'Tu organización', email: 'Correo de contacto',
  empresa: 'Datos de la organización', contacto: 'Persona de contacto',
  submitting: 'Registrando…', success: 'Solicitud enviada',
};

const STEP_PROGRESS: Record<Step, string> = {
  search: '20%', email: '40%', empresa: '65%',
  contacto: '85%', submitting: '95%', success: '100%',
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const inp = 'w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand';
const sel = `${inp} cursor-pointer appearance-none`;

function Lbl({ text, req }: { text: string; req?: boolean }) {
  return (
    <span className="mb-1 block text-xs font-semibold text-ink-muted">
      {text}{req && <span className="ml-0.5 text-accent">*</span>}
    </span>
  );
}

function ContextBar({ name, email, onChangeName, onChangeEmail }: {
  name: string; email?: string; onChangeName?: () => void; onChangeEmail?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-canvas px-4 py-3">
      <div className="flex items-center gap-2">
        <BuildingIcon size={13} className="shrink-0 text-brand" />
        <span className="flex-1 truncate text-sm font-semibold text-brand">{name || '—'}</span>
        {onChangeName && (
          <button type="button" onClick={onChangeName}
            className="shrink-0 text-[11px] font-medium text-ink-muted underline underline-offset-2 hover:text-brand">
            Cambiar
          </button>
        )}
      </div>
      {email && (
        <div className="flex items-center gap-2 border-t border-line pt-1.5">
          <UserIcon size={12} className="shrink-0 text-ink-muted" />
          <span className="flex-1 truncate text-xs text-ink-muted">{email}</span>
          {onChangeEmail && (
            <button type="button" onClick={onChangeEmail}
              className="shrink-0 text-[11px] font-medium text-ink-muted underline underline-offset-2 hover:text-brand">
              Cambiar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Props ────────────────────────────────────────────────────────────────── */
interface AllyRegistrationDrawerProps {
  open: boolean;
  onClose: () => void;
  allyRole?: string;
  allyRoleLabel?: string;
}

/* ── Component ────────────────────────────────────────────────────────────── */
export function AllyRegistrationDrawer({
  open, onClose, allyRole, allyRoleLabel,
}: AllyRegistrationDrawerProps) {
  const [step, setStep] = useState<Step>('search');

  /* search */
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyResult | null>(null);

  /* email */
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'found' | 'new'>('idle');

  /* empresa */
  const [empresa, setEmpresa] = useState({
    trade_name: '', legal_name: '', nit: '', sector: '', country: 'Colombia', city: '',
  });

  /* contacto */
  const [contacto, setContacto] = useState({
    name: '', cargo: '', whatsapp: '', notes: '',
  });

  const searchRef = useRef<HTMLInputElement>(null);

  /* reset on open */
  useEffect(() => {
    if (open) {
      setStep('search');
      setQuery(''); setResults([]); setSelectedCompany(null);
      setEmail(''); setEmailStatus('idle');
      setEmpresa({ trade_name: '', legal_name: '', nit: '', sector: '', country: 'Colombia', city: '' });
      setContacto({ name: '', cargo: '', whatsapp: '', notes: '' });
      setTimeout(() => searchRef.current?.focus(), 120);
    }
  }, [open]);

  /* company search */
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await supabase
          .from('companies')
          .select('id, trade_name, legal_name, nit, city, country, contact_name, contact_whatsapp')
          .ilike('trade_name', `%${query}%`)
          .limit(6);
        setResults(data ?? []);
      } catch { setResults([]); }
      setSearching(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  const checkEmail = async () => {
    if (!email) return;
    if (!selectedCompany) { setEmailStatus('new'); return; }
    setEmailStatus('checking');
    try {
      const { data } = await supabase.from('profiles').select('id')
        .eq('company_id', selectedCompany.id)
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      setEmailStatus(data ? 'found' : 'new');
    } catch { setEmailStatus('new'); }
  };

  const selectCompany = (c: CompanyResult) => {
    setSelectedCompany(c);
    setQuery(c.trade_name);
    setResults([]);
    setEmpresa((p) => ({ ...p, trade_name: c.trade_name, legal_name: c.legal_name ?? '', nit: c.nit ?? '', city: c.city ?? '', country: c.country ?? 'Colombia' }));
    setContacto((p) => ({ ...p, name: c.contact_name ?? '', whatsapp: c.contact_whatsapp ?? '' }));
    setStep('email');
  };

  const submit = async () => {
    setStep('submitting');
    const payload = {
      edition_id: null,
      plan_id: null,
      ally_role: allyRole ?? null,
      space_id: null, track_id: null, speaker_choice: null,
      company: empresa.trade_name || query,
      nit: empresa.nit || null,
      contact_name: contacto.name,
      contact_email: email.toLowerCase().trim(),
      contact_whatsapp: contacto.whatsapp || null,
      category: empresa.sector || null,
      country: empresa.country || null,
      city: empresa.city || null,
      notes: [
        contacto.cargo ? `Cargo: ${contacto.cargo}` : '',
        empresa.legal_name ? `Razón social: ${empresa.legal_name}` : '',
        contacto.notes,
      ].filter(Boolean).join('\n') || null,
      status: 'nueva',
    };
    try {
      const { error } = await supabase.from('plan_requests').insert(payload);
      if (error) console.warn('ally registration insert:', error.message);
    } catch (err) { console.warn('Supabase no disponible:', err); }
    setStep('success');
  };

  const companyName = empresa.trade_name || query;
  const canProceedEmail = email.includes('@') && email.includes('.') && emailStatus !== 'checking';
  const canSubmitEmpresa = empresa.trade_name.trim().length > 1 && empresa.city.trim().length > 0;
  const canSubmitContacto = contacto.name.trim().length > 1 && contacto.whatsapp.trim().length > 5;

  const stepDots: Step[] = ['search', 'email', 'empresa', 'contacto'];
  const dotIdx = stepDots.indexOf(step);

  if (!open) return null;

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 bg-brand-deep/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[28rem] flex-col bg-white shadow-elev4"
        >
          {/* Header */}
          <div className="shrink-0 border-b border-line">
            <div className="flex items-start justify-between px-6 py-4">
              <div className="min-w-0 pr-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
                  {allyRoleLabel ?? 'Alianza institucional'}
                </p>
                <p className="mt-1 text-base font-bold text-brand">{STEP_TITLE[step]}</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Cerrar"
                className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line text-ink-muted transition-colors hover:border-brand/30 hover:text-brand">
                <XIcon size={17} />
              </button>
            </div>

            {/* Progress */}
            <div className="h-[3px] w-full bg-line">
              <motion.div className="grad-futuro h-full" animate={{ width: STEP_PROGRESS[step] }}
                transition={{ duration: 0.4, ease: EASE_EMPHASIS }} />
            </div>

            {/* Dots */}
            {dotIdx >= 0 && (
              <div className="flex items-center gap-1.5 px-6 py-3">
                {stepDots.map((s, i) => (
                  <span key={s} className={`h-1.5 rounded-full transition-all duration-300
                    ${s === step ? 'w-8 bg-brand' : i < dotIdx ? 'w-2 bg-accent/60' : 'w-2 bg-line'}`} />
                ))}
                <span className="ml-auto text-[10px] font-bold text-ink-muted">{dotIdx + 1} / 4</span>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col overflow-y-auto">
            <AnimatePresence mode="wait">

              {/* SEARCH */}
              {step === 'search' && (
                <motion.div key="search"
                  initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.22, ease: EASE_EMPHASIS }} className="flex flex-col gap-4 px-6 py-5">
                  <p className="text-sm leading-relaxed text-ink">
                    Escribe el nombre de tu organización para buscarla en el sistema.
                  </p>
                  <div className="relative">
                    <SearchIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input ref={searchRef} type="text" placeholder="Nombre de tu organización"
                      value={query} onChange={(e) => setQuery(e.target.value)}
                      className="w-full rounded-xl border border-line bg-canvas py-3 pl-10 pr-10 text-sm text-ink outline-none transition-colors focus:border-brand" />
                    {searching && <Loader2Icon size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-ink-muted" />}
                  </div>
                  <AnimatePresence>
                    {results.length > 0 && (
                      <motion.ul initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="overflow-hidden rounded-xl border border-line bg-white shadow-elev3">
                        {results.map((c) => (
                          <li key={c.id}>
                            <button type="button" onClick={() => selectCompany(c)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-soft">
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft">
                                <BuildingIcon size={15} className="text-brand" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold text-brand">{c.trade_name}</span>
                                <span className="block text-xs text-ink-muted">
                                  {[c.nit && `NIT ${c.nit}`, c.city].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
                                </span>
                              </span>
                              <ArrowRightIcon size={13} className="shrink-0 text-ink-muted" />
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                  {query.length >= 2 && !searching && results.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="rounded-xl border border-dashed border-line bg-canvas p-5 text-center">
                      <BuildingIcon size={24} className="mx-auto text-ink-muted/40" />
                      <p className="mt-2 text-sm font-bold text-brand">"{query}" no está registrada</p>
                      <p className="mt-1 text-xs text-ink-muted">La registramos en los pasos siguientes.</p>
                      <button type="button"
                        onClick={() => { setEmpresa((p) => ({ ...p, trade_name: query })); setSelectedCompany(null); setStep('email'); }}
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-white">
                        Registrar nueva <ArrowRightIcon size={12} />
                      </button>
                    </motion.div>
                  )}
                  {query.length < 2 && (
                    <p className="rounded-xl border border-line bg-canvas px-4 py-3 text-xs text-ink-muted">
                      Escribe al menos 2 caracteres para buscar.
                    </p>
                  )}
                </motion.div>
              )}

              {/* EMAIL */}
              {step === 'email' && (
                <motion.div key="email"
                  initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.22, ease: EASE_EMPHASIS }} className="flex flex-col gap-4 px-6 py-5">
                  <ContextBar name={companyName} onChangeName={() => { setStep('search'); setEmailStatus('idle'); }} />
                  <div>
                    <Lbl text="Correo corporativo" req />
                    <div className="flex gap-2">
                      <input type="email" placeholder="correo@organizacion.com"
                        value={email} onChange={(e) => { setEmail(e.target.value); setEmailStatus('idle'); }}
                        className={`${inp} flex-1`} />
                      <button type="button" onClick={checkEmail} disabled={!email.includes('@')}
                        className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-40 hover:bg-brand-deep">
                        {emailStatus === 'checking' ? <Loader2Icon size={15} className="animate-spin" /> : 'Verificar'}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {emailStatus === 'found' && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <CheckCircle2Icon size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                        <div>
                          <p className="text-sm font-bold text-emerald-800">Organización verificada</p>
                          <p className="text-xs text-emerald-700">Podemos enviar la solicitud directamente.</p>
                        </div>
                      </motion.div>
                    )}
                    {emailStatus === 'new' && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-bold text-amber-800">Correo no registrado aún</p>
                        <p className="mt-0.5 text-xs text-amber-700">Completa los datos de la organización en los pasos siguientes.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {emailStatus === 'found' && (
                    <button type="button" onClick={submit}
                      className="group flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-elev2 transition-transform hover:-translate-y-0.5">
                      Enviar solicitud <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                  )}
                  {emailStatus === 'new' && (
                    <button type="button" onClick={() => setStep('empresa')}
                      className="group flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-elev2 transition-transform hover:-translate-y-0.5">
                      Completar registro <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                  )}
                  {canProceedEmail && emailStatus === 'idle' && (
                    <button type="button" onClick={() => setStep('empresa')}
                      className="w-full rounded-full border border-line py-3.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand">
                      Continuar
                    </button>
                  )}
                </motion.div>
              )}

              {/* EMPRESA */}
              {step === 'empresa' && (
                <motion.div key="empresa"
                  initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.22, ease: EASE_EMPHASIS }} className="flex flex-col gap-4 px-6 py-5">
                  <ContextBar name={companyName} email={email}
                    onChangeName={() => setStep('search')} onChangeEmail={() => setStep('email')} />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Información de la organización</p>
                  <label className="block">
                    <Lbl text="Nombre comercial / público" req />
                    <input type="text" placeholder="Como aparece en el mercado o academia"
                      value={empresa.trade_name} onChange={(e) => setEmpresa({ ...empresa, trade_name: e.target.value })}
                      className={inp} />
                  </label>
                  <label className="block">
                    <Lbl text="Nombre legal / Razón social" />
                    <input type="text" placeholder="Nombre jurídico registrado"
                      value={empresa.legal_name} onChange={(e) => setEmpresa({ ...empresa, legal_name: e.target.value })}
                      className={inp} />
                  </label>
                  <label className="block">
                    <Lbl text="NIT o número tributario" />
                    <input type="text" placeholder="Ej. 900.123.456-7"
                      value={empresa.nit} onChange={(e) => setEmpresa({ ...empresa, nit: e.target.value })}
                      className={inp} />
                  </label>
                  <label className="block">
                    <Lbl text="Sector / Categoría" req />
                    <div className="relative">
                      <select value={empresa.sector} onChange={(e) => setEmpresa({ ...empresa, sector: e.target.value })} className={sel}>
                        <option value="">Selecciona un sector…</option>
                        {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted">▾</span>
                    </div>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <Lbl text="País" req />
                      <div className="relative">
                        <select value={empresa.country} onChange={(e) => setEmpresa({ ...empresa, country: e.target.value })} className={sel}>
                          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted">▾</span>
                      </div>
                    </label>
                    <label className="block">
                      <Lbl text="Ciudad" req />
                      <input type="text" placeholder="Ciudad"
                        value={empresa.city} onChange={(e) => setEmpresa({ ...empresa, city: e.target.value })}
                        className={inp} />
                    </label>
                  </div>
                  <div className="mt-2 flex flex-col gap-2">
                    <button type="button" disabled={!canSubmitEmpresa} onClick={() => setStep('contacto')}
                      className="group flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-elev2 transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                      Continuar <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                    <button type="button" onClick={() => setStep('email')}
                      className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-ink-muted hover:text-brand">
                      <ArrowLeftIcon size={12} /> Volver
                    </button>
                  </div>
                </motion.div>
              )}

              {/* CONTACTO */}
              {step === 'contacto' && (
                <motion.div key="contacto"
                  initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.22, ease: EASE_EMPHASIS }} className="flex flex-col gap-4 px-6 py-5">
                  <ContextBar name={companyName} email={email} />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Persona que gestiona este proceso</p>
                  <label className="block">
                    <Lbl text="Nombre completo" req />
                    <input type="text" placeholder="Tu nombre completo"
                      value={contacto.name} onChange={(e) => setContacto({ ...contacto, name: e.target.value })}
                      className={inp} />
                  </label>
                  <label className="block">
                    <Lbl text="Cargo" />
                    <div className="relative">
                      <select value={contacto.cargo} onChange={(e) => setContacto({ ...contacto, cargo: e.target.value })} className={sel}>
                        <option value="">Selecciona tu cargo…</option>
                        {CARGOS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted">▾</span>
                    </div>
                  </label>
                  <label className="block">
                    <Lbl text="WhatsApp" req />
                    <input type="tel" placeholder="+57 300 000 0000"
                      value={contacto.whatsapp} onChange={(e) => setContacto({ ...contacto, whatsapp: e.target.value })}
                      className={inp} />
                    <span className="mt-1 block text-[11px] text-ink-muted">El equipo se comunicará principalmente por WhatsApp.</span>
                  </label>
                  <label className="block">
                    <Lbl text="Notas adicionales" />
                    <textarea rows={2} placeholder="¿Algo relevante antes de que te contactemos?"
                      value={contacto.notes} onChange={(e) => setContacto({ ...contacto, notes: e.target.value })}
                      className={inp} />
                  </label>
                  <div className="mt-2 flex flex-col gap-2">
                    <button type="button" disabled={!canSubmitContacto} onClick={submit}
                      className="group flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-elev2 transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                      Enviar solicitud <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                    <button type="button" onClick={() => setStep('empresa')}
                      className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-ink-muted hover:text-brand">
                      <ArrowLeftIcon size={12} /> Volver
                    </button>
                  </div>
                </motion.div>
              )}

              {/* SUBMITTING */}
              {step === 'submitting' && (
                <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
                  <Loader2Icon size={36} className="animate-spin text-accent" />
                  <p className="text-sm font-medium text-ink-muted">Registrando tu solicitud…</p>
                </motion.div>
              )}

              {/* SUCCESS */}
              {step === 'success' && (
                <motion.div key="success"
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: EASE_EMPHASIS }}
                  className="flex flex-1 flex-col items-center gap-5 px-6 py-8">
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
                    className="mt-4 grid h-20 w-20 place-items-center rounded-full bg-emerald-50">
                    <CheckCircle2Icon size={40} className="text-emerald-500" />
                  </motion.span>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-brand">Solicitud enviada</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                      El equipo de Eventos Médicos LATAM revisará tu solicitud y se comunicará contigo pronto.
                    </p>
                  </div>
                  <div className="w-full rounded-2xl border border-line bg-canvas">
                    <div className="border-b border-line px-5 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">Resumen</p>
                    </div>
                    <div className="space-y-2.5 px-5 py-4">
                      {allyRoleLabel && (
                        <div className="flex justify-between gap-3 text-sm">
                          <span className="text-ink-muted">Modalidad</span>
                          <span className="text-right font-semibold text-brand">{allyRoleLabel}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-ink-muted">Organización</span>
                        <span className="text-right font-semibold text-brand">{empresa.trade_name || query}</span>
                      </div>
                      {empresa.legal_name && (
                        <div className="flex justify-between gap-3 text-sm">
                          <span className="text-ink-muted">Razón social</span>
                          <span className="text-right font-semibold text-ink">{empresa.legal_name}</span>
                        </div>
                      )}
                      {empresa.nit && (
                        <div className="flex justify-between gap-3 text-sm">
                          <span className="text-ink-muted">NIT</span>
                          <span className="font-semibold text-ink">{empresa.nit}</span>
                        </div>
                      )}
                      {empresa.sector && (
                        <div className="flex justify-between gap-3 text-sm">
                          <span className="text-ink-muted">Sector</span>
                          <span className="font-semibold text-ink">{empresa.sector}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-ink-muted">Ciudad</span>
                        <span className="font-semibold text-ink">{empresa.city}, {empresa.country}</span>
                      </div>
                      <div className="border-t border-line pt-2.5">
                        <div className="flex justify-between gap-3 text-sm">
                          <span className="text-ink-muted">Contacto</span>
                          <span className="text-right font-semibold text-ink">
                            {contacto.name}{contacto.cargo ? ` · ${contacto.cargo}` : ''}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3 text-sm">
                          <span className="text-ink-muted">Correo</span>
                          <span className="text-right text-xs text-ink">{email}</span>
                        </div>
                        {contacto.whatsapp && (
                          <div className="flex justify-between gap-3 text-sm">
                            <span className="text-ink-muted">WhatsApp</span>
                            <span className="font-semibold text-ink">{contacto.whatsapp}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={onClose}
                    className="w-full rounded-full border border-line py-3 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand">
                    Cerrar
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Footer */}
          {step !== 'success' && step !== 'submitting' && (
            <div className="shrink-0 border-t border-line px-6 py-3">
              <p className="text-[11px] text-ink-muted">
                Esta solicitud no implica ningún compromiso. El equipo define el alcance de la alianza en una conversación.
              </p>
            </div>
          )}
        </motion.div>
      </>
    </AnimatePresence>
  );
}
