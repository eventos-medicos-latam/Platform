import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2Icon, XIcon } from 'lucide-react';
import { EASE_EMPHASIS } from '../../utils/motion';
interface SpeakerProposalModalProps {
  open: boolean;
  onClose: () => void;
  /** Tema o espacio académico preseleccionado desde la parrilla. */
  topic?: string;
  editionName: string;
}
const field = 'w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 ease-emphasis placeholder:text-ink-muted/70 focus:border-brand';

/**
 * Propuesta de speaker sin sacar al usuario de la página: el tema elegido en la
 * parrilla llega precargado, de modo que el registro conserva el contexto.
 */
export function SpeakerProposalModal({
  open,
  onClose,
  topic,
  editionName
}: SpeakerProposalModalProps) {
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (!open) return;
    setSent(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return <AnimatePresence>
      {open ? <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
          <motion.button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-hb-ink/60 backdrop-blur-sm" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} transition={{
        duration: 0.2
      }} />

          <motion.div role="dialog" aria-modal="true" aria-label="Proponer un speaker" className="relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white bg-white p-7 shadow-elev4 sm:p-8" initial={{
        opacity: 0,
        y: 24,
        scale: 0.97
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        y: 16,
        scale: 0.98
      }} transition={{
        duration: 0.24,
        ease: EASE_EMPHASIS
      }}>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-line text-ink-muted transition-colors duration-150 ease-emphasis hover:border-brand/40 hover:text-brand">
              <XIcon size={17} />
            </button>

            {sent ? <div className="py-6 text-center">
                <CheckCircle2Icon size={30} className="mx-auto text-emerald-600" />
                <p className="mt-4 text-lg font-bold text-brand">Propuesta recibida</p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
                  El comité académico revisa cada postulación y responde por correo. Si el perfil
                  encaja con un puente disponible, te contactamos para coordinar la charla.
                </p>
                <button type="button" onClick={onClose} className="grad-futuro mt-6 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-elev2 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                  Volver a la parrilla
                </button>
              </div> : <>
                <div className="flex items-center gap-3">
                  <span className="grad-futuro h-5 w-1 rounded-full" aria-hidden="true" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                    {editionName}
                  </p>
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-brand">
                  Proponer un speaker
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  Cuéntanos el perfil y el tema. El comité académico evalúa cada propuesta frente a
                  los puentes que aún tienen espacio.
                </p>

                <form className="mt-6 grid gap-3" onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}>
                  <div>
                    <label htmlFor="speaker-topic" className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                      Espacio o tema
                    </label>
                    <input id="speaker-topic" className={`mt-2 ${field}`} defaultValue={topic ?? ''} placeholder="Ej. Eje intestino–hormonas" required />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input required className={field} placeholder="Nombre del speaker" />
                    <input required className={field} placeholder="Especialidad" />
                  </div>
                  <input required className={field} placeholder="Institución o afiliación" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input required type="email" className={field} placeholder="Correo de contacto" />
                    <input className={field} placeholder="WhatsApp (opcional)" />
                  </div>
                  <textarea required rows={3} className={`resize-y ${field}`} placeholder="Trayectoria y por qué encaja con este puente." />

                  <label className="flex items-start gap-2.5 text-xs leading-relaxed text-ink">
                    <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-[color:var(--brand)]" />
                    Autorizo el tratamiento de mis datos para gestionar esta propuesta.
                  </label>

                  <button type="submit" className="grad-futuro mt-2 w-full rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-elev2 transition-transform duration-200 ease-emphasis hover:-translate-y-0.5">
                    Enviar propuesta
                  </button>
                </form>
              </>}
          </motion.div>
        </div> : null}
    </AnimatePresence>;
}