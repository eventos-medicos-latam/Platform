import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserRoundIcon, BriefcaseIcon, PresentationIcon, EyeIcon, InboxIcon, ChevronRightIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import { usePlatform } from '../../contexts/PlatformContext';

const ACCENT = '#00C9A0';
const NAVY   = '#0a1f35';

const CHECKLIST = [
  { label: 'Foto de perfil',       done: false, to: '/speaker/perfil'      },
  { label: 'Bio completa',         done: false, to: '/speaker/perfil'      },
  { label: 'Al menos 1 experiencia', done: false, to: '/speaker/experiencia' },
  { label: 'Habilidades/temas',    done: false, to: '/speaker/experiencia' },
  { label: 'Perfil de visibilidad', done: false, to: '/speaker/visibilidad' },
];

const QUICK = [
  { to: '/speaker/perfil',      icon: UserRoundIcon,    label: 'Mi perfil',   desc: 'Foto · bio · institución · país' },
  { to: '/speaker/experiencia', icon: BriefcaseIcon,    label: 'Experiencia', desc: 'Trayectoria · habilidades · temas' },
  { to: '/speaker/ponencias',   icon: PresentationIcon, label: 'Ponencias',   desc: 'Títulos · abstract · archivos' },
  { to: '/speaker/visibilidad', icon: EyeIcon,          label: 'Visibilidad', desc: 'Público / Privado · URL de perfil' },
  { to: '/speaker/solicitudes', icon: InboxIcon,        label: 'Solicitudes', desc: '2 solicitudes pendientes', badge: 2 },
];

export function SpeakerHome() {
  const { session } = usePlatform();
  const name = session?.user?.user_metadata?.full_name ?? 'Speaker';
  const done = CHECKLIST.filter(c => c.done).length;
  const pct  = Math.round((done / CHECKLIST.length) * 100);

  return (
    <div className="space-y-8">
      {/* Saludo */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>Portal Speaker</p>
        <h1 className="text-2xl font-bold" style={{ color: '#0f172a', fontFamily: "'Sora', sans-serif" }}>
          Hola, {name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Completa tu perfil para aparecer en el directorio público de EML.</p>
      </motion.div>

      {/* Progreso del perfil */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-2xl p-5" style={{ background: NAVY, color: '#fff' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">Completitud del perfil</p>
          <span className="text-sm font-bold tabular-nums" style={{ color: ACCENT }}>{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <motion.div className="h-full rounded-full" initial={{ width: 0 }}
            animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{ background: ACCENT }} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2">
          {CHECKLIST.map((item, i) => (
            <Link key={i} to={item.to} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,201,160,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}>
              {item.done
                ? <CheckCircleIcon size={15} style={{ color: ACCENT, flexShrink: 0 }} />
                : <AlertCircleIcon size={15} style={{ color: '#F59E0B', flexShrink: 0 }} />}
              <p className="flex-1 text-sm" style={{ color: item.done ? 'rgba(255,255,255,0.5)' : '#fff' }}>{item.label}</p>
              <ChevronRightIcon size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Accesos rápidos */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>Secciones</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {QUICK.map((q, i) => (
            <motion.div key={q.to} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 + i * 0.04 }}>
              <Link to={q.to} className="flex flex-col gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 relative"
                style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                {q.badge && (
                  <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: '#F24463' }}>{q.badge}</span>
                )}
                <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(0,201,160,0.1)' }}>
                  <q.icon size={17} style={{ color: ACCENT }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{q.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{q.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
