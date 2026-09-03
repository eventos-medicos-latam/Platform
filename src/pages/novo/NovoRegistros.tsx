import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  SearchIcon, PlusIcon, UsersIcon,
  BadgeCheckIcon, ClockIcon, TicketIcon,
} from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';
import { MOCK_RECENT_REGISTRATIONS, MOCK_EVENTS } from '../../lib/novo/mock';
import { formatCurrency, formatDate } from '../../lib/novo/events';
import type { EventRegistration } from '../../types/novo';

// ── Datos extendidos para la tabla completa ─────────────────────────────────
const MOCK_ALL_REGISTRATIONS: (EventRegistration & { person: { id: string; full_name: string }; event: { id: string; name: string; slug: string } })[] = [
  ...MOCK_RECENT_REGISTRATIONS,
  {
    id: 'reg-004', person_id: 'p-004', event_id: 'evt-eterna-primavera-2025',
    registration_type: 'cortesia', origin: 'admin', amount_paid: 0, attended: false,
    created_at: '2025-08-28T10:00:00Z', updated_at: '2025-08-28T10:00:00Z',
    person: { id: 'p-004', full_name: 'Dra. Carolina Mejía' },
    event: { id: 'evt-eterna-primavera-2025', name: 'La Eterna Primavera', slug: 'eterna-primavera-2025' },
  },
  {
    id: 'reg-005', person_id: 'p-005', event_id: 'evt-hormobiota-vi-2025',
    registration_type: 'compra', origin: 'web', amount_paid: 480000, attended: true,
    created_at: '2025-08-20T16:30:00Z', updated_at: '2025-10-03T09:00:00Z',
    person: { id: 'p-005', full_name: 'Dr. Felipe Arango' },
    event: { id: 'evt-hormobiota-vi-2025', name: 'Hormobiota VI', slug: 'hormobiota-vi-2025' },
  },
  {
    id: 'reg-006', person_id: 'p-006', event_id: 'evt-webinar-vitamina-d',
    registration_type: 'gratuito', origin: 'web', amount_paid: 0, attended: true,
    created_at: '2025-09-10T11:15:00Z', updated_at: '2025-09-25T19:05:00Z',
    person: { id: 'p-006', full_name: 'Lic. Mariana Torres' },
    event: { id: 'evt-webinar-vitamina-d', name: 'Webinar Vitamina D', slug: 'webinar-vitamina-d-2025' },
  },
];

const TIPO_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  compra:   { color: '#00C9A0', bg: 'rgba(0,201,160,.12)',   label: 'Compra'   },
  cortesia: { color: '#A78BFA', bg: 'rgba(167,139,250,.12)', label: 'Cortesía' },
  sponsor:  { color: '#FF7043', bg: 'rgba(255,112,67,.12)',  label: 'Sponsor'  },
  gratuito: { color: '#7A9CB8', bg: 'rgba(122,156,184,.10)', label: 'Gratuito' },
};

const FILTERS = ['Todos', 'Compras', 'Cortesías', 'Sponsors', 'Gratuitos'] as const;
type Filter = typeof FILTERS[number];

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#00C9A0,#007AFF)',
  'linear-gradient(135deg,#FF7043,#F59E0B)',
  'linear-gradient(135deg,#A78BFA,#5B8AF0)',
  'linear-gradient(135deg,#5B8AF0,#00C9A0)',
  'linear-gradient(135deg,#F24463,#FF7043)',
  'linear-gradient(135deg,#00C9A0,#A78BFA)',
];

export function NovoRegistros() {
  const [filter, setFilter] = useState<Filter>('Todos');
  const [search, setSearch] = useState('');

  const filtered = MOCK_ALL_REGISTRATIONS.filter((r) => {
    const matchFilter =
      filter === 'Todos' ||
      (filter === 'Compras'   && r.registration_type === 'compra')   ||
      (filter === 'Cortesías' && r.registration_type === 'cortesia') ||
      (filter === 'Sponsors'  && r.registration_type === 'sponsor')  ||
      (filter === 'Gratuitos' && r.registration_type === 'gratuito');
    const q = search.toLowerCase();
    const matchSearch =
      r.person.full_name.toLowerCase().includes(q) ||
      r.event.name.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const total     = MOCK_ALL_REGISTRATIONS.length;
  const pagados   = MOCK_ALL_REGISTRATIONS.filter(r => r.amount_paid > 0).length;
  const asistidos = MOCK_ALL_REGISTRATIONS.filter(r => r.attended).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>
            Vista global
          </p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>
            Registros
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#7A9CB8' }}>
            Todas las personas · todos los eventos · motor universal
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#080C14' }}
        >
          <PlusIcon size={15} strokeWidth={2.5} /> Agregar registro
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <KPICard label="Total registros" value="1.714" sub="todas las ediciones" icon={UsersIcon} delay={0} />
        <KPICard label="Con pago confirmado" value={pagados.toString()} sub={`de ${total} registros mock`}
          icon={BadgeCheckIcon} accent="#5B8AF0" delay={0.05} />
        <KPICard label="Asistencia registrada" value={asistidos.toString()} sub="check-in completado"
          icon={TicketIcon} accent="#A78BFA" delay={0.1} />
      </div>

      {/* Controles */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div
          className="relative flex items-center"
          style={{ background: '#0E1520', border: '1px solid #1E2D45', borderRadius: 12 }}
        >
          <SearchIcon size={14} className="absolute left-3" style={{ color: '#3A5470' }} />
          <input
            type="text"
            placeholder="Buscar persona o evento..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent pl-9 pr-4 py-2 text-sm outline-none w-56"
            style={{ color: '#E1EAF4' }}
          />
        </div>

        <div
          className="flex items-center gap-0.5 p-1 rounded-xl"
          style={{ background: '#0E1520', border: '1px solid #1E2D45' }}
        >
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
              style={{
                background: filter === f ? '#1E2D45' : 'transparent',
                color:      filter === f ? '#E1EAF4'  : '#3A5470',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ border: '1px solid #1E2D45', background: '#0E1520' }}
      >
        {/* Cabecera */}
        <div
          className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-3"
          style={{
            gridTemplateColumns: '2.5fr 1.8fr 1fr 1fr 1fr',
            color: '#3A5470',
            borderBottom: '1px solid #152238',
            background: '#162031',
          }}
        >
          <span>Persona</span>
          <span>Evento</span>
          <span>Tipo</span>
          <span>Pagado</span>
          <span>Estado</span>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: '#3A5470' }}>
            <p className="text-sm">Sin resultados</p>
          </div>
        )}

        {filtered.map((reg, i) => {
          const tipo = TIPO_COLORS[reg.registration_type] ?? TIPO_COLORS.compra;
          const gradient = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];

          return (
            <motion.div
              key={reg.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1], delay: i * 0.04 }}
              className="grid items-center px-5 py-3.5 transition-colors duration-150 cursor-pointer"
              style={{
                gridTemplateColumns: '2.5fr 1.8fr 1fr 1fr 1fr',
                borderBottom: i < filtered.length - 1 ? '1px solid #152238' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#162031')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Persona */}
              <div className="flex items-center gap-3 min-w-0 pr-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: gradient }}
                >
                  {initials(reg.person.full_name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: '#E1EAF4' }}>
                    {reg.person.full_name}
                  </p>
                  <p className="text-xs" style={{ color: '#3A5470' }}>
                    {reg.origin === 'portal-empresa' ? 'Portal empresa' : reg.origin}
                  </p>
                </div>
              </div>

              {/* Evento */}
              <div className="min-w-0 pr-2">
                <p className="truncate text-sm" style={{ color: '#7A9CB8' }}>{reg.event.name}</p>
                <p className="text-xs" style={{ color: '#3A5470' }}>{formatDate(reg.created_at.split('T')[0])}</p>
              </div>

              {/* Tipo */}
              <div>
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{ color: tipo.color, background: tipo.bg }}
                >
                  {tipo.label}
                </span>
              </div>

              {/* Pagado */}
              <div>
                <p className="text-sm font-semibold tabular-nums"
                  style={{ color: reg.amount_paid > 0 ? '#00C9A0' : '#3A5470' }}>
                  {reg.amount_paid > 0 ? formatCurrency(reg.amount_paid) : '—'}
                </p>
              </div>

              {/* Estado */}
              <div>
                {reg.attended ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ color: '#00C9A0', background: 'rgba(0,201,160,.12)' }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#00C9A0', boxShadow: '0 0 5px #00C9A0' }} />
                    Asistió
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ color: '#5B8AF0', background: 'rgba(91,138,240,.12)' }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#5B8AF0' }} />
                    Confirmado
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
