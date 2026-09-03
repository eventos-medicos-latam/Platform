import React from 'react';
import { motion } from 'framer-motion';
import { HammerIcon } from 'lucide-react';

interface Props { title: string; description?: string; }

export function NovoPlaceholder({ title, description }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-2xl"
      style={{ background: '#0E1520', border: '1px solid #1E2D45' }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: '#162031', border: '1px solid #1E2D45' }}
      >
        <HammerIcon size={22} style={{ color: '#00C9A0' }} />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', 'Inter', sans-serif" }}>
          {title}
        </h2>
        <p className="mt-1 text-sm" style={{ color: '#3A5470' }}>
          {description ?? 'Módulo en construcción — próximo sprint de desarrollo'}
        </p>
      </div>
    </motion.div>
  );
}
