import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { HammerIcon } from 'lucide-react';
import type { NovoEvent } from '../../../types/novo';

interface EventContext { event: NovoEvent }

interface Props {
  title: string;
  description?: string;
}

export function NovoEventPlaceholder({ title, description }: Props) {
  const { event } = useOutletContext<EventContext>();

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>
          {event.name}
        </p>
        <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-sm" style={{ color: '#7A9CB8' }}>{description}</p>
        )}
      </div>

      <div
        className="flex flex-col items-center justify-center rounded-2xl py-24 gap-4"
        style={{ border: '1px dashed #1e3450', background: '#112035' }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: '#182d47', border: '1px solid #1e3450' }}
        >
          <HammerIcon size={24} strokeWidth={1.5} style={{ color: '#3A5470' }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: '#7A9CB8' }}>En construcción</p>
          <p className="text-xs mt-1" style={{ color: '#3A5470' }}>
            Módulo contextual de {event.name}
          </p>
        </div>
      </div>
    </div>
  );
}
