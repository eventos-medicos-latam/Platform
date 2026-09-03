import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, SearchIcon, FileTextIcon, FolderIcon, DownloadIcon } from 'lucide-react';
import { KPICard } from '../../components/novo/ui/KPICard';

const MOCK_DOCS = [
  { id: 'd-001', name: 'Manual del Expositor v3',        category: 'global',   type: 'PDF',  size: '2,4 MB', scope: 'Público',  emoji: '📋', updated: 'ago 2025',  event: null,              company: null           },
  { id: 'd-002', name: 'Guía de Stands y Planos',        category: 'global',   type: 'PDF',  size: '5,1 MB', scope: 'Empresa',  emoji: '📐', updated: 'jul 2025',  event: null,              company: null           },
  { id: 'd-003', name: 'Reglamento General EML',         category: 'global',   type: 'PDF',  size: '890 KB', scope: 'Público',  emoji: '⚖️', updated: 'jun 2025',  event: null,              company: null           },
  { id: 'd-004', name: 'Kit de Marca EML 2025',          category: 'global',   type: 'ZIP',  size: '18 MB',  scope: 'Interno',  emoji: '🎨', updated: 'ene 2025',  event: null,              company: null           },
  { id: 'd-005', name: 'Contrato EP2025',                category: 'empresa',  type: 'PDF',  size: '340 KB', scope: 'Privado',  emoji: '📄', updated: 'jul 2025',  event: 'La Eterna Primavera', company: 'Roche'    },
  { id: 'd-006', name: 'Recibo de Anticipo $9M',         category: 'empresa',  type: 'PDF',  size: '120 KB', scope: 'Privado',  emoji: '🧾', updated: 'jul 2025',  event: 'La Eterna Primavera', company: 'Roche'    },
  { id: 'd-007', name: 'Logo Roche PNG alta res.',       category: 'empresa',  type: 'PNG',  size: '1,2 MB', scope: 'Privado',  emoji: '🖼',  updated: 'jun 2025',  event: null,              company: 'Roche'        },
  { id: 'd-008', name: 'Programa EP2025 definitivo',     category: 'evento',   type: 'PDF',  size: '780 KB', scope: 'Público',  emoji: '📅', updated: 'sep 2025',  event: 'La Eterna Primavera', company: null       },
  { id: 'd-009', name: 'Lista de asistentes HB VI',      category: 'evento',   type: 'XLSX', size: '210 KB', scope: 'Interno',  emoji: '📊', updated: 'oct 2025',  event: 'Hormobiota VI',   company: null           },
];

const SCOPE_CONFIG: Record<string, { color: string; bg: string }> = {
  Público:  { color: '#00C9A0', bg: 'rgba(0,201,160,.12)'   },
  Empresa:  { color: '#F59E0B', bg: 'rgba(245,158,11,.12)'  },
  Interno:  { color: '#5B8AF0', bg: 'rgba(91,138,240,.12)'  },
  Privado:  { color: '#A78BFA', bg: 'rgba(167,139,250,.12)' },
};

type CatFilter = 'Todos' | 'Globales' | 'Por empresa' | 'Por evento';
const CAT_FILTERS: CatFilter[] = ['Todos', 'Globales', 'Por empresa', 'Por evento'];

export function NovoDocumentos() {
  const [catFilter, setCatFilter] = useState<CatFilter>('Todos');
  const [search, setSearch] = useState('');

  const filtered = MOCK_DOCS.filter(d => {
    const matchCat =
      catFilter === 'Todos'       ||
      (catFilter === 'Globales'    && d.category === 'global')  ||
      (catFilter === 'Por empresa' && d.category === 'empresa') ||
      (catFilter === 'Por evento'  && d.category === 'evento');
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.company ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (d.event ?? '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00C9A0' }}>
            Catálogo global
          </p>
          <h1 className="text-xl font-bold" style={{ color: '#E1EAF4', fontFamily: "'Sora', sans-serif" }}>
            Documentos y Recursos
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#7A9CB8' }}>
            Global reutilizable · asignado a eventos · por empresa
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
          style={{ background: '#00C9A0', color: '#0d1829' }}
        >
          <PlusIcon size={15} strokeWidth={2.5} /> Subir recurso
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <KPICard label="Total archivos" value={MOCK_DOCS.length.toString()} sub="en la plataforma"
          icon={FileTextIcon} delay={0} />
        <KPICard label="Globales" value={MOCK_DOCS.filter(d => d.category === 'global').length.toString()}
          sub="reutilizables en todos los eventos"
          icon={FolderIcon} accent="#5B8AF0" delay={0.05} />
        <KPICard label="Por empresa / evento" value={MOCK_DOCS.filter(d => d.category !== 'global').length.toString()}
          sub="documentos específicos"
          icon={DownloadIcon} accent="#A78BFA" delay={0.1} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex items-center"
          style={{ background: '#112035', border: '1px solid #1e3450', borderRadius: 12 }}>
          <SearchIcon size={14} className="absolute left-3" style={{ color: '#3A5470' }} />
          <input
            type="text"
            placeholder="Buscar documento..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent pl-9 pr-4 py-2 text-sm outline-none w-56"
            style={{ color: '#E1EAF4' }}
          />
        </div>
        <div className="flex gap-0.5 p-1 rounded-xl" style={{ background: '#112035', border: '1px solid #1e3450' }}>
          {CAT_FILTERS.map(f => (
            <button key={f} type="button" onClick={() => setCatFilter(f)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
              style={{ background: catFilter === f ? '#1e3450' : 'transparent', color: catFilter === f ? '#E1EAF4' : '#3A5470' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid #1e3450', background: '#112035' }}>
        <div className="grid text-[10px] font-bold uppercase tracking-widest px-5 py-3"
          style={{ gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr', color: '#3A5470', borderBottom: '1px solid #1a2e45', background: '#182d47' }}>
          <span>Documento</span><span>Tipo</span><span>Evento / Empresa</span><span>Acceso</span><span>Actualizado</span>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: '#3A5470' }}>
            <p className="text-sm">Sin resultados</p>
          </div>
        )}

        {filtered.map((doc, i) => {
          const scope = SCOPE_CONFIG[doc.scope] ?? SCOPE_CONFIG.Público;
          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1], delay: i * 0.04 }}
              className="group grid items-center px-5 py-3.5 transition-colors duration-150 cursor-pointer"
              style={{
                gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr',
                borderBottom: i < filtered.length - 1 ? '1px solid #1a2e45' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#182d47')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
                  style={{ background: '#182d47', border: '1px solid #1e3450' }}>
                  {doc.emoji}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: '#E1EAF4' }}>{doc.name}</p>
                  <p className="text-xs" style={{ color: '#3A5470' }}>{doc.size}</p>
                </div>
              </div>
              <div>
                <span className="rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                  style={{ background: '#182d47', color: '#7A9CB8', border: '1px solid #1e3450' }}>
                  {doc.type}
                </span>
              </div>
              <div>
                <p className="truncate text-xs" style={{ color: '#7A9CB8' }}>
                  {doc.event ?? doc.company ?? '—'}
                </p>
              </div>
              <div>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ color: scope.color, background: scope.bg }}>
                  {doc.scope}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: '#3A5470' }}>{doc.updated}</p>
                <DownloadIcon size={13} className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: '#3A5470' }} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
