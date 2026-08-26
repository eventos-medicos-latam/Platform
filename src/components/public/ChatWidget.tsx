import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MailIcon, MessageCircleIcon, XIcon } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { DURATION, EASE_EMPHASIS, popVariants } from '../../utils/motion';

interface Contact {
  email: string;
  whatsappUrl: string;
}

/**
 * Widget flotante: solo la interfaz por ahora. Los dos botones abren
 * WhatsApp/correo directo con los datos cargados en /admin/organizacion —
 * no hay formulario propio aquí (eso ya lo cubre la página de Contacto)
 * ni conexión a un agente todavía.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState<Contact | null>(null);

  useEffect(() => {
    supabase
      .from('public_settings')
      .select('key, value')
      .in('key', ['contact_email', 'contact_whatsapp_dial_code', 'contact_whatsapp_number'])
      .then(({ data }) => {
        const values = Object.fromEntries((data ?? []).map((row) => [row.key, row.value ?? '']));
        const email = values.contact_email;
        const dial = values.contact_whatsapp_dial_code;
        const number = values.contact_whatsapp_number;
        if (email || (dial && number)) {
          setContact({
            email: email || '',
            whatsappUrl: dial && number ? `https://wa.me/${`${dial}${number}`.replace(/[^0-9]/g, '')}` : ''
          });
        }
      });
  }, []);

  return <>
      <motion.button type="button" onClick={() => setOpen((current) => !current)} whileTap={{
      scale: 0.95
    }} whileHover={{
      scale: 1.06
    }} animate={open ? {
      boxShadow: '0 10px 30px -8px rgb(var(--tone-futuro) / 0.55)'
    } : {
      boxShadow: ['0 10px 30px -8px rgb(var(--tone-futuro) / 0.55)', '0 10px 40px -4px rgb(var(--tone-futuro) / 0.85)', '0 10px 30px -8px rgb(var(--tone-futuro) / 0.55)']
    }} transition={open ? {
      duration: DURATION.press,
      ease: EASE_EMPHASIS
    } : {
      duration: 2.2,
      repeat: Infinity,
      ease: 'easeInOut'
    }} aria-label={open ? 'Cerrar chat' : 'Abrir chat'} style={{
      backgroundColor: 'rgb(var(--tone-futuro))'
    }} className="fixed bottom-24 right-4 z-40 grid h-14 w-14 place-items-center rounded-full text-white md:bottom-6 md:right-6">
        {open ? <XIcon size={22} /> : <MessageCircleIcon size={22} />}
      </motion.button>

      <AnimatePresence>
        {open ? <motion.div variants={popVariants} initial="initial" animate="enter" exit="exit" className="fixed bottom-[168px] right-4 z-40 w-[calc(100vw-2rem)] max-w-[320px] overflow-hidden rounded-2xl border border-line bg-white shadow-panel md:bottom-24 md:right-6">
            <div className="px-5 py-4 text-white" style={{
            backgroundColor: 'rgb(var(--tone-futuro))'
          }}>
              <p className="text-sm font-bold">¿En qué te ayudamos?</p>
              <p className="mt-1 text-xs text-white/85">
                Escríbenos y te respondemos lo antes posible.
              </p>
            </div>
            <div className="space-y-2 p-4">
              {contact?.whatsappUrl ? <a href={contact.whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand/40">
                  <MessageCircleIcon size={18} className="text-accent" />
                  Escribir por WhatsApp
                </a> : null}
              {contact?.email ? <a href={`mailto:${contact.email}`} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-brand transition-colors duration-150 ease-emphasis hover:border-brand/40">
                  <MailIcon size={18} className="text-accent" />
                  Enviar un correo
                </a> : null}
              {!contact?.whatsappUrl && !contact?.email ? <p className="px-1 py-2 text-xs text-ink-muted">
                  Todavía no hay un canal de contacto configurado.
                </p> : null}
            </div>
          </motion.div> : null}
      </AnimatePresence>
    </>;
}
