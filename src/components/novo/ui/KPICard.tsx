import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent?: string;
  progress?: number; // 0–100
  trend?: { value: string; positive: boolean };
  delay?: number;
}

export function KPICard({
  label, value, sub, icon: Icon,
  accent = '#00C9A0', progress, trend, delay = 0,
}: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay }}
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: '#0E1520',
        border: '1px solid #1E2D45',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }}
    >
      {/* Glow sutil del acento en esquina */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
        style={{ background: `${accent}18` }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#3A5470' }}>
            {label}
          </p>
          <p
            className="text-2xl font-bold tabular-nums leading-none"
            style={{ color: '#E1EAF4', fontFamily: "'Sora', 'Inter', sans-serif" }}
          >
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-xs" style={{ color: '#7A9CB8' }}>{sub}</p>
          )}
          {trend && (
            <div className="mt-2 inline-flex items-center gap-1">
              <span
                className="text-xs font-semibold"
                style={{ color: trend.positive ? '#00C9A0' : '#F24463' }}
              >
                {trend.positive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs" style={{ color: '#3A5470' }}>vs meta</span>
            </div>
          )}
        </div>

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
        >
          <Icon size={18} style={{ color: accent }} strokeWidth={1.75} />
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between">
            <span className="text-[10px]" style={{ color: '#3A5470' }}>Progreso a meta</span>
            <span className="text-[10px] font-semibold tabular-nums" style={{ color: accent }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: '#1E2D45' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 1, ease: [0.23, 1, 0.32, 1], delay: delay + 0.3 }}
              className="h-full rounded-full"
              style={{ background: accent }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
