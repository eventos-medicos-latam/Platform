import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, CalendarIcon, BuildingIcon, UserIcon, MessageCircleIcon, ClockIcon } from 'lucide-react';

const ACCENT = '#00C9A0';

type SolicitudStatus = 'pendiente' | 'aprobada' | 'denegada';
type SolicitudOrigen = 'web' | 'empresa';

interface Solicitud {
  id: string; origen: SolicitudOrigen; nombre: string; email: string;
  empresa?: string; evento: string; fecha_evento: string;
  modalidad: 'presencial' | 'virtual'; mensaje: string;
  status: SolicitudStatus; recibida: string;
}

const INIT: Solicitud[] = [
  { id:'s1', origen:'empresa', nombre:'Laboratorios Roche Colombia', email:'eventos@roche.com', empresa:'Roche', evento:'Simposio Diabetes 2026', fecha_evento:'2026-11-14', modalidad:'presencial', mensaje:'Nos gustaría contar con usted como conferencista principal en nuestro simposio de diabetes. El evento será en Bogotá.', status:'pendiente', recibida:'2026-09-05' },
  { id:'s2', origen:'web', nombre:'Dr. Marco Herrera', email:'mherrera@clinica.com', evento:'Congreso Endocrinología Latam', fecha_evento:'2026-10-22', modalidad:'virtual', mensaje:'Estamos organizando un congreso virtual y su expertise en tiroides sería invaluable.', status:'pendiente', recibida:'2026-09-03' },
  { id:'s3', origen:'empresa', nombre:'Abbott Laboratories', email:'alianzas@abbott.com', empresa:'Abbott', evento:'Taller HbA1c Avanzado', fecha_evento:'2026-09-28', modalidad:'presencial', mensaje:'Queremos invitarlo a un taller de media jornada sobre manejo avanzado de HbA1c.', status:'aprobada', recibida:'2026-08-28' },
  { id:'s4', origen:'web', nombre:'Lic. Camila Ríos', email:'crios@enfermeria.edu.co', evento:'Jornada de Enfermería', fecha_evento:'2026-10-05', modalidad:'virtual', mensaje:'Queremos una charla de 30 min sobre educación en diabetes para enfermeros.', status:'denegada', recibida:'2026-08-20' },
];

const STATUS_CFG: Record<SolicitudStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pendiente: { label: 'Pendiente', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: ClockIcon },
  aprobada:  { label: 'Aprobada',  color: ACCENT,    bg: 'rgba(0,201,160,0.1)',  icon: CheckCircleIcon },
  denegada:  { label: 'Denegada',  color: '#F24463', bg: 'rgba(242,68,99,0.1)',  icon: XCircleIcon },
};

const ORIGEN_CFG: Record<SolicitudOrigen, { label: string; color: string }> = {
  empresa: { label: 'Empresa', color: '#5B8AF0' },
  web:     { label: 'Web pública', color: '#A78BFA' },
};

export function SpeakerSolicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(INIT);
  const [filter, setFilter]           = useState<SolicitudStatus | 'todas'>('todas');
  const [expanded, setExpanded]       = useState<string | null>(null);

  const filtered = filter === 'todas' ? solicitudes : solicitudes.filter(s => s.status === filter);
  const pendientes = solicitudes.filter(s => s.status === 'pendiente').length;

  const responder = (id: string, resp: 'aprobada' | 'denegada') => {
    setSolicitudes(p => p.map(s => s.id === id ? { ...s, status: resp } : s));
    setExpanded(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ACCENT }}>Mi portal</p>
          <h1 className="text-xl font-bold" style={{ color: '#0f172a', fontFamily: "'Sora', sans-serif" }}>
            Mis solicitudes
            {pendientes > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold text-white align-middle"
                style={{ background: '#F24463' }}>{pendientes}</span>
            )}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Solicitudes aprobadas por EML antes de llegar aquí. Acepta o declina cada una.</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
        {(['todas', 'pendiente', 'aprobada', 'denegada'] as const).map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all capitalize"
            style={{ background: filter === f ? '#fff' : 'transparent', color: filter === f ? '#0f172a' : '#94a3b8', boxShadow: filter === f ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}>
            {f === 'todas' ? 'Todas' : STATUS_CFG[f].label}
            {f === 'pendiente' && pendientes > 0 && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: '#F24463' }}>{pendientes}</span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map(s => {
            const st  = STATUS_CFG[s.status];
            const org = ORIGEN_CFG[s.origen];
            const isOpen = expanded === s.id;
            return (
              <motion.div key={s.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#fff', border: `1px solid ${isOpen ? ACCENT + '50' : '#e2e8f0'}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

                {/* Row */}
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : s.id)}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: s.origen === 'empresa' ? 'rgba(91,138,240,0.1)' : 'rgba(167,139,250,0.1)' }}>
                    {s.origen === 'empresa' ? <BuildingIcon size={18} style={{ color: '#5B8AF0' }} /> : <UserIcon size={18} style={{ color: '#A78BFA' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold truncate" style={{ color: '#0f172a' }}>{s.nombre}</p>
                      <span className="text-[10px] font-bold rounded-full px-2 py-0.5"
                        style={{ background: s.origen === 'empresa' ? 'rgba(91,138,240,0.1)' : 'rgba(167,139,250,0.1)',
                          color: org.color }}>{org.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs truncate" style={{ color: '#64748b' }}>{s.evento}</span>
                      <div className="flex items-center gap-1">
                        <CalendarIcon size={10} style={{ color: '#94a3b8' }} />
                        <span className="text-xs tabular-nums" style={{ color: '#94a3b8' }}>
                          {new Date(s.fecha_evento).toLocaleDateString('es-CO', { day:'numeric', month:'short', year:'numeric' })}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                        style={{ background: s.modalidad === 'presencial' ? 'rgba(0,201,160,0.1)' : 'rgba(91,138,240,0.1)',
                          color: s.modalidad === 'presencial' ? ACCENT : '#5B8AF0' }}>
                        {s.modalidad === 'presencial' ? '🏛️ Presencial' : '💻 Virtual'}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold shrink-0"
                    style={{ background: st.bg, color: st.color }}>
                    <st.icon size={11} /> {st.label}
                  </span>
                </div>

                {/* Detalle expandido */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden">
                      <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                        <div className="pt-4">
                          <div className="flex items-start gap-2.5 rounded-xl px-4 py-3"
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <MessageCircleIcon size={14} style={{ color: '#94a3b8', flexShrink: 0, marginTop: 2 }} />
                            <div>
                              <p className="text-xs font-semibold mb-1" style={{ color: '#64748b' }}>Mensaje del solicitante</p>
                              <p className="text-sm leading-relaxed" style={{ color: '#0f172a' }}>{s.mensaje}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: '#94a3b8' }}>
                            <span>📧 {s.email}</span>
                            <span>Recibida el {new Date(s.recibida).toLocaleDateString('es-CO', { day:'numeric', month:'long' })}</span>
                          </div>
                        </div>

                        {s.status === 'pendiente' && (
                          <div className="flex gap-3">
                            <button type="button" onClick={() => responder(s.id, 'aprobada')}
                              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95"
                              style={{ background: ACCENT, color: '#0a1f35' }}>
                              <CheckCircleIcon size={15} /> Aceptar solicitud
                            </button>
                            <button type="button" onClick={() => responder(s.id, 'denegada')}
                              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95"
                              style={{ background: '#fef2f2', color: '#F24463', border: '1px solid #fecaca' }}>
                              <XCircleIcon size={15} /> Declinar
                            </button>
                          </div>
                        )}
                        {s.status !== 'pendiente' && (
                          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5"
                            style={{ background: st.bg }}>
                            <st.icon size={14} style={{ color: st.color }} />
                            <p className="text-sm font-semibold" style={{ color: st.color }}>
                              {s.status === 'aprobada' ? 'Aceptaste esta solicitud' : 'Declinaste esta solicitud'}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="rounded-2xl flex flex-col items-center justify-center py-16"
            style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
            <p className="text-sm" style={{ color: '#94a3b8' }}>No hay solicitudes en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  );
}
