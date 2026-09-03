import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SettingsIcon, SaveIcon, TargetIcon, ShieldIcon, QrCodeIcon } from 'lucide-react';
import type { NovoEvent } from '../../../types/novo';

interface EventContext { event: NovoEvent }

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#2a4a6b' }}>{label}</p>
      {children}
      {hint && <p className="text-[10px] mt-1" style={{ color: '#3A5470' }}>{hint}</p>}
    </div>
  );
}

function NumInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="number"
      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
      style={{ background: '#0d1829', border: '1px solid #1e3450', color: '#E1EAF4' }}
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={e => (e.currentTarget.style.borderColor = '#00C9A040')}
      onBlur={e  => (e.currentTarget.style.borderColor = '#1e3450')}
    />
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #1a2e45' }}>
      <p className="text-sm" style={{ color: '#7A9CB8' }}>{label}</p>
      <button onClick={() => onChange(!on)}
        className="relative h-5 w-9 rounded-full transition-colors"
        style={{ background: on ? '#00C9A0' : '#1e3450' }}>
        <span className="absolute top-0.5 h-4 w-4 rounded-full transition-all"
          style={{ background: '#E1EAF4', left: on ? 'calc(100% - 18px)' : '2px' }} />
      </button>
    </div>
  );
}

export function NovoEventConfiguracion() {
  const { event } = useOutletContext<EventContext>();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const [goals, setGoals] = useState({
    registros: String(event.goals?.registros ?? 150),
    ingresos:  String(event.goals?.ingresos  ?? 18000000),
  });
  const [capacity, setCapacity] = useState(String(event.max_capacity ?? 150));
  const [flags, setFlags] = useState({
    registro_publico:    true,
    lista_espera:        true,
    qr_unico:            true,
    certificado_auto:    false,
    encuesta_post:       true,
    visible_en_web:      true,
    permite_invitados:   false,
    requiere_aprobacion: false,
  });

  const flagToggle = (k: keyof typeof flags) => (v: boolean) =>
    setFlags(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }, 900);
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>{event.name}</p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>Configuración</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A9CB8' }}>Metas · capacidad · reglas · QR · consentimientos</p>
        </div>
        <motion.button whileTap={{ scale: 0.96 }} onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
          style={{ background: 'rgba(0,201,160,.12)', color: '#00C9A0', border: '1px solid rgba(0,201,160,.25)' }}>
          <SaveIcon size={14} />
          {saving ? 'Guardando…' : saved ? '¡Guardado!' : 'Guardar cambios'}
        </motion.button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Metas y capacidad */}
        <div className="col-span-2 space-y-5">
          <section className="rounded-2xl p-5" style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <p className="text-xs font-bold mb-4 flex items-center gap-2" style={{ color: '#E1EAF4' }}>
              <TargetIcon size={13} style={{ color: '#00C9A0' }} /> Metas del evento
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Meta de registros" hint="Cantidad de personas objetivo">
                <NumInput value={goals.registros} onChange={v => setGoals(g => ({ ...g, registros: v }))} />
              </Field>
              <Field label="Meta de ingresos (COP)" hint="Ingresos totales esperados">
                <NumInput value={goals.ingresos} onChange={v => setGoals(g => ({ ...g, ingresos: v }))} />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl p-5" style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <p className="text-xs font-bold mb-4 flex items-center gap-2" style={{ color: '#E1EAF4' }}>
              <SettingsIcon size={13} style={{ color: '#7A9CB8' }} /> Capacidad y acceso
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Capacidad máxima" hint="0 = sin límite">
                <NumInput value={capacity} onChange={setCapacity} />
              </Field>
            </div>
            <Toggle label="Registro público (sin aprobación)" on={flags.registro_publico}    onChange={flagToggle('registro_publico')} />
            <Toggle label="Lista de espera activa"             on={flags.lista_espera}        onChange={flagToggle('lista_espera')} />
            <Toggle label="Requiere aprobación manual"         on={flags.requiere_aprobacion} onChange={flagToggle('requiere_aprobacion')} />
            <Toggle label="Permite acompañantes / invitados"   on={flags.permite_invitados}   onChange={flagToggle('permite_invitados')} />
          </section>

          <section className="rounded-2xl p-5" style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <p className="text-xs font-bold mb-4 flex items-center gap-2" style={{ color: '#E1EAF4' }}>
              <QrCodeIcon size={13} style={{ color: '#7A9CB8' }} /> QR y automatizaciones
            </p>
            <Toggle label="QR único por persona (Universal QR)"        on={flags.qr_unico}         onChange={flagToggle('qr_unico')} />
            <Toggle label="Certificado automático al finalizar"         on={flags.certificado_auto} onChange={flagToggle('certificado_auto')} />
            <Toggle label="Encuesta post-evento habilitada"             on={flags.encuesta_post}    onChange={flagToggle('encuesta_post')} />
          </section>
        </div>

        {/* Lateral — estado de la configuración */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: '#112035', border: '1px solid #1e3450' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#2a4a6b' }}>
              <ShieldIcon size={10} className="inline mr-1" /> Checklist de configuración
            </p>
            {[
              { label: 'Metas definidas',         ok: Number(goals.registros) > 0 },
              { label: 'Capacidad configurada',    ok: Number(capacity) > 0 },
              { label: 'QR único activo',          ok: flags.qr_unico },
              { label: 'Registro público',         ok: flags.registro_publico },
              { label: 'Visible en la web',        ok: flags.visible_en_web },
            ].map((item, i, arr) => (
              <div key={i} className="flex items-center justify-between py-2.5"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid #1a2e45' : 'none' }}>
                <p className="text-xs" style={{ color: '#7A9CB8' }}>{item.label}</p>
                <span className="text-[10px] font-bold" style={{ color: item.ok ? '#00C9A0' : '#F59E0B' }}>
                  {item.ok ? '✓ OK' : '! Pendiente'}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-4" style={{ background: 'rgba(242,68,99,.06)', border: '1px solid rgba(242,68,99,.15)' }}>
            <p className="text-xs font-bold mb-1" style={{ color: '#F24463' }}>Zona peligrosa</p>
            <p className="text-[10px] mb-3" style={{ color: '#7A9CB8' }}>Estas acciones son irreversibles</p>
            <button className="w-full rounded-xl py-2 text-xs font-semibold"
              style={{ background: 'rgba(242,68,99,.08)', color: '#F24463', border: '1px solid rgba(242,68,99,.2)' }}>
              Archivar evento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
