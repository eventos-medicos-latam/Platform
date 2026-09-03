import React from 'react';
import type { NovoEventOperationalStatus, NovoAgreementStatus } from '../../../types/novo';

const EVENT_STATUS: Record<NovoEventOperationalStatus, { label: string; color: string; dot: string }> = {
  borrador:   { label: 'Borrador',   color: '#3A5470', dot: '#3A5470' },
  proximo:    { label: 'Próximo',    color: '#5B8AF0', dot: '#5B8AF0' },
  activo:     { label: 'Activo',     color: '#00C9A0', dot: '#00C9A0' },
  finalizado: { label: 'Finalizado', color: '#A78BFA', dot: '#A78BFA' },
  cancelado:  { label: 'Cancelado',  color: '#F24463', dot: '#F24463' },
  archivado:  { label: 'Archivado',  color: '#3A5470', dot: '#3A5470' },
};

const AGREEMENT_STATUS: Record<NovoAgreementStatus, { label: string; color: string }> = {
  borrador:        { label: 'Borrador',        color: '#3A5470' },
  'en-negociacion':{ label: 'En negociación',  color: '#F59E0B' },
  aprobado:        { label: 'Aprobado',         color: '#5B8AF0' },
  cerrado:         { label: 'Cerrado',          color: '#00C9A0' },
  cancelado:       { label: 'Cancelado',        color: '#F24463' },
};

interface EventStatusPillProps { status: NovoEventOperationalStatus; }
interface AgreementStatusPillProps { status: NovoAgreementStatus; }

export function EventStatusPill({ status }: EventStatusPillProps) {
  const cfg = EVENT_STATUS[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ background: cfg.dot, boxShadow: status === 'activo' ? `0 0 6px ${cfg.dot}` : 'none' }}
      />
      {cfg.label}
    </span>
  );
}

export function AgreementStatusPill({ status }: AgreementStatusPillProps) {
  const cfg = AGREEMENT_STATUS[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}
    >
      {cfg.label}
    </span>
  );
}

export function ModalityBadge({ modality }: { modality: string }) {
  const map: Record<string, { label: string; emoji: string }> = {
    presencial: { label: 'Presencial', emoji: '📍' },
    virtual:    { label: 'Virtual',    emoji: '🖥' },
    hibrido:    { label: 'Híbrido',    emoji: '⚡' },
  };
  const cfg = map[modality] ?? { label: modality, emoji: '' };
  return (
    <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium"
      style={{ color: '#7A9CB8', background: '#1E2D45', border: '1px solid #1E2D45' }}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}
