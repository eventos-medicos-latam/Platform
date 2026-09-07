import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon } from 'lucide-react';
import { SpeakerCarousel } from '../../components/speakers/SpeakerCarousel';
import { MOCK_SPEAKERS } from '../../components/speakers/speakerData';

const ESPECIALIDADES = ['Todas', ...Array.from(new Set(MOCK_SPEAKERS.map(s => s.especialidad)))];

export function Speakers() {
  const [search, setSearch]   = useState('');
  const [filtroEsp, setFiltro] = useState('Todas');

  const filtered = MOCK_SPEAKERS.filter(s => {
    const matchE = filtroEsp === 'Todas' || s.especialidad === filtroEsp;
    const q = search.toLowerCase();
    const matchQ = !q || s.nombre.toLowerCase().includes(q) || s.especialidad.toLowerCase().includes(q) || s.habilidades.some(h => h.toLowerCase().includes(q));
    return matchE && matchQ;
  });

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Hero */}
      <div className="py-20 text-center px-6" style={{ background: '#0a1f35' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#00C9A0' }}>
            Red de Expertos · EML
          </p>
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
            Speakers
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Los mejores especialistas médicos de Latinoamérica. Conoce su trayectoria y contáctalos para tus eventos.
          </p>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <div className="flex-1 min-w-[220px] flex items-center gap-2 rounded-2xl px-4 py-3"
            style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <SearchIcon size={15} style={{ color: '#94a3b8' }} />
            <input className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#0f172a' }}
              placeholder="Buscar por nombre, especialidad o tema…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {ESPECIALIDADES.map(e => (
              <button key={e} type="button" onClick={() => setFiltro(e)}
                className="rounded-xl px-3.5 py-2 text-xs font-semibold transition-all"
                style={{
                  background: filtroEsp === e ? '#00C9A0' : '#fff',
                  color: filtroEsp === e ? '#0a1f35' : '#64748b',
                  border: `1px solid ${filtroEsp === e ? '#00C9A0' : '#e2e8f0'}`,
                }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Carousel */}
        {filtered.length > 0 ? (
          <SpeakerCarousel
            speakers={filtered}
            title="Nuestros speakers"
            subtitle={`${filtered.length} especialistas con perfil público`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-lg font-bold" style={{ color: '#94a3b8' }}>Sin resultados</p>
            <button type="button" onClick={() => { setSearch(''); setFiltro('Todas'); }}
              className="text-sm font-semibold" style={{ color: '#00C9A0' }}>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
