import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, BellIcon } from 'lucide-react';
import { PageTransition } from '../../components/motion/PageTransition';
import { EASE_EMPHASIS } from '../../utils/motion';

export function HabitosAlPlato() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 text-center">

        {/* Logo animado */}
        <motion.img
          src="/habitos-al-plato-logo.png"
          alt="Hábitos al Plato"
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE_EMPHASIS }}
          className="mb-8 h-auto w-64 max-w-xs object-contain"
          draggable={false}
        />

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: EASE_EMPHASIS, delay: 0.1 }}
          className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-accent">
          Próximamente · EML
        </motion.p>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_EMPHASIS, delay: 0.14 }}
          className="text-4xl font-bold text-brand lg:text-5xl"
          style={{ fontFamily: "'Sora', sans-serif" }}>
          Hábitos al Plato
        </motion.h1>

        {/* Descripción */}
        <motion.p
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: EASE_EMPHASIS, delay: 0.2 }}
          className="mt-5 max-w-md text-base leading-relaxed text-ink-muted">
          Una nueva plataforma de Eventos Médicos Latam dedicada a la nutrición, los hábitos alimentarios y la salud desde el plato. Estamos construyéndola.
        </motion.p>

        {/* Barra de progreso decorativa */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, ease: EASE_EMPHASIS, delay: 0.3 }}
          className="mt-8 h-1.5 w-48 rounded-full overflow-hidden bg-line origin-left">
          <div className="h-full w-2/5 rounded-full" style={{ background: '#00C9A0' }} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-2 text-xs text-ink-muted">
          En construcción
        </motion.p>

        {/* CTA notificación */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: EASE_EMPHASIS, delay: 0.35 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/contacto?motivo=habitos-al-plato"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-brand-deep transition-transform duration-200 ease-emphasis hover:-translate-y-0.5"
            style={{ background: '#00C9A0' }}>
            <BellIcon size={14} /> Avísame cuando esté lista
          </Link>
          <Link to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-ink-muted transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
            <ArrowLeftIcon size={14} /> Volver al inicio
          </Link>
        </motion.div>

      </div>
    </PageTransition>
  );
}
