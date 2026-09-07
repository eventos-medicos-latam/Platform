import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, BuildingIcon } from 'lucide-react';
import type { SpeakerPublic } from './speakerData';

const ACCENT = '#00C9A0';
const NAVY   = '#0a1f35';

const GRAD_PALETTE = [
  'linear-gradient(135deg,#1a4a7a,#2d6fae)',
  'linear-gradient(135deg,#00C9A0,#1a6b5a)',
  'linear-gradient(135deg,#5b2d8a,#A78BFA)',
  'linear-gradient(135deg,#7a3a1a,#FF7043)',
  'linear-gradient(135deg,#1a5a3a,#34D399)',
  'linear-gradient(135deg,#4a1a7a,#818CF8)',
];

interface Props {
  speakers: SpeakerPublic[];
  eventContext?: string;
  title?: string;
  subtitle?: string;
}

/* ── Card visuals ── */
function SpeakerCard({ speaker, gradient, isFront, isAdjacent, onClick, onViewProfile }: {
  speaker: SpeakerPublic; gradient: string;
  isFront: boolean; isAdjacent: boolean; onClick: () => void; onViewProfile?: () => void;
}) {
  const initials = speaker.nombre.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <motion.div onClick={onClick}
      className="rounded-3xl overflow-hidden cursor-pointer select-none w-full"
      whileHover={isFront ? { y: -6 } : {}}
      style={{
        background: '#fff',
        boxShadow: isFront
          ? '0 28px 70px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.1)'
          : '0 8px 24px rgba(0,0,0,0.08)',
      }}>
      {/* Avatar / foto */}
      <div className="relative h-52 flex items-center justify-center overflow-hidden"
        style={{ background: gradient }}>
        {speaker.foto
          ? <img src={speaker.foto} alt={speaker.nombre} className="h-full w-full object-cover" draggable={false} />
          : <span className="text-5xl font-bold text-white" style={{ opacity: 0.9 }}>{initials}</span>
        }
        {/* Gradiente inferior */}
        <div className="absolute inset-x-0 bottom-0 h-20"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
        <div className="absolute bottom-3 left-3 flex items-center gap-1">
          <MapPinIcon size={10} className="text-white/70" />
          <span className="text-[10px] text-white/80">{speaker.pais}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-sm font-bold leading-snug" style={{ color: '#0f172a' }}>{speaker.nombre}</p>
        <p className="text-xs font-semibold mt-0.5" style={{ color: ACCENT }}>{speaker.especialidad}</p>
        <div className="flex items-center gap-1 mt-1">
          <BuildingIcon size={10} style={{ color: '#94a3b8' }} />
          <p className="text-[10px] truncate" style={{ color: '#94a3b8' }}>{speaker.institucion}</p>
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {speaker.habilidades.slice(0, 2).map(h => (
            <span key={h} className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
              style={{ background: 'rgba(0,201,160,0.1)', color: ACCENT }}>{h}</span>
          ))}
        </div>
        {isFront && (
          <button type="button"
            onClick={e => { e.stopPropagation(); onViewProfile ? onViewProfile() : onClick(); }}
            className="mt-4 w-full rounded-xl py-2.5 text-xs font-bold transition-all active:scale-95"
            style={{ background: ACCENT, color: NAVY }}>
            Ver perfil completo
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Carousel ── */
export function SpeakerCarousel({ speakers, eventContext, title, subtitle }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate = useNavigate();
  const goToProfile = useCallback((slug: string) => navigate(`/speakers/${slug}`), [navigate]);
  const N = speakers.length;

  const prev = useCallback(() => setActiveIdx(i => (i - 1 + N) % N), [N]);
  const next = useCallback(() => setActiveIdx(i => (i + 1)     % N), [N]);

  /* Compute which cards to show: active + 1 each side = 3 visible */
  const getOffset = (i: number) => {
    let off = i - activeIdx;
    if (off > N / 2)  off -= N;
    if (off < -N / 2) off += N;
    return off;
  };

  /* We render all but position them in a 3-slot visible window */
  const cardWidth = 220; // px
  const gap       = 24;  // px between center of cards
  const stageW    = cardWidth * 3 + gap * 2 + 80; // visible stage width

  const getCardProps = (offset: number) => {
    const absOff = Math.abs(offset);
    const x      = offset * (cardWidth + gap);
    const scale  = absOff === 0 ? 1 : absOff === 1 ? 0.82 : 0.68;
    const opacity= absOff === 0 ? 1 : absOff === 1 ? 0.7  : 0.4;
    const zIndex = 10 - absOff;
    const visible= absOff <= 1; // only show ±1 around active
    return { x, scale, opacity, zIndex, visible };
  };

  return (
    <div className="w-full">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title    && <h2 className="text-3xl font-bold mb-2" style={{ color: NAVY, fontFamily: "'Sora', sans-serif" }}>{title}</h2>}
          {subtitle && <p className="text-base" style={{ color: '#64748b' }}>{subtitle}</p>}
        </div>
      )}

      {/* Stage */}
      <div className="relative mx-auto" style={{ maxWidth: stageW, height: 430 }}>
        {/* Event context banner flotante */}
        {eventContext && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20">
            <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold"
              style={{ background: NAVY, color: ACCENT, border: `1px solid ${ACCENT}40` }}>
              ✦ {eventContext}
            </span>
          </div>
        )}

        {/* Cards */}
        <div className="absolute inset-0 flex items-center justify-center">
          {speakers.map((speaker, i) => {
            const offset = getOffset(i);
            const { x, scale, opacity, zIndex, visible } = getCardProps(offset);
            if (!visible) return null;
            return (
              <motion.div key={speaker.id}
                className="absolute"
                style={{ width: cardWidth, zIndex, pointerEvents: Math.abs(offset) <= 1 ? 'auto' : 'none' }}
                animate={{ x, scale, opacity }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}>
                <SpeakerCard
                  speaker={speaker}
                  gradient={GRAD_PALETTE[i % GRAD_PALETTE.length]}
                  isFront={offset === 0}
                  isAdjacent={Math.abs(offset) === 1}
                  onClick={() => offset === 0 ? goToProfile(speaker.slug) : (offset > 0 ? next() : prev())}
                  onViewProfile={() => goToProfile(speaker.slug)}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Flechas */}
        <button type="button" onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: NAVY }}
          onMouseEnter={e => (e.currentTarget.style.background = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
          <ChevronLeftIcon size={18} />
        </button>
        <button type="button" onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: NAVY }}
          onMouseEnter={e => (e.currentTarget.style.background = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
          <ChevronRightIcon size={18} />
        </button>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {speakers.map((_, i) => (
          <button key={i} type="button" onClick={() => setActiveIdx(i)}
            className="rounded-full transition-all duration-300"
            style={{ width: i === activeIdx ? 28 : 8, height: 8, background: i === activeIdx ? ACCENT : '#e2e8f0' }} />
        ))}
      </div>

    </div>
  );
}
