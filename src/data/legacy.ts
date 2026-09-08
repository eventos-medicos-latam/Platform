import { media } from './media';

export interface LegacyEvent {
  id: string;
  /** Número de edición dentro de la trayectoria de Eventos Médicos LATAM. */
  order: number;
  year: number;
  /** Etiqueta corta del mes para distinguir dos eventos del mismo año (ej. 'Abr', 'Nov'). */
  monthLabel?: string;
  /** Tema central del evento. */
  topic: string;
  name: string;
  claim: string;
  description: string;
  highlights: string[];
  image: string;
  /** Logo propio del evento para el FutureEditionPoster (próximos). */
  logo?: string;
  /** Imagen de fondo del FutureEditionPoster (próximos). */
  heroImage?: string;
  /** Tono temático: se aplica como --accent-rgb local. */
  toneVar: string;
  /** Ruta a la que lleva "Conocer más". */
  href: string;
  status: 'realizado' | 'proximo';
  attendees?: number;
}

export const legacyEvents: LegacyEvent[] = [
  {
    id: 'leg-inflamacion',
    order: 1,
    year: 2022,
    topic: 'Inflamación',
    name: 'Inflamación',
    claim: 'El origen silencioso de la enfermedad crónica',
    description:
      'La primera edición puso la inflamación de bajo grado en el centro de la conversación clínica: cómo se mide, cómo se sostiene en el tiempo y por qué explica buena parte de lo que vemos en consulta.',
    highlights: ['Inflamación de bajo grado', 'Marcadores en consulta', 'Abordaje multidisciplinario'],
    image: media.legacyInflamacion,
    toneVar: 'var(--tone-inflamacion)',
    href: '/nosotros',
    status: 'realizado',
    attendees: 210,
  },
  {
    id: 'leg-obesidad',
    order: 2,
    year: 2023,
    topic: 'Obesidad',
    name: 'Obesidad',
    claim: 'De la balanza al metabolismo',
    description:
      'La segunda edición desmontó la lectura simplista del peso y llevó la discusión al terreno metabólico y endocrino, con énfasis en el tejido adiposo como órgano activo.',
    highlights: ['Tejido adiposo como órgano', 'Resistencia a la insulina', 'Manejo farmacológico actual'],
    image: media.legacyObesidad,
    toneVar: 'var(--tone-obesidad)',
    href: '/nosotros',
    status: 'realizado',
    attendees: 280,
  },
  {
    id: 'leg-longevidad',
    order: 3,
    year: 2024,
    topic: 'Longevidad',
    name: 'Longevidad',
    claim: 'Vivir más y vivir mejor no son lo mismo',
    description:
      'La tercera edición separó expectativa de vida de calidad de vida, y trajo la evidencia sobre envejecimiento celular, biomarcadores y las intervenciones que hoy sí tienen respaldo.',
    highlights: ['Envejecimiento celular', 'Biomarcadores de longevidad', 'Intervenciones con evidencia'],
    image: media.legacyLongevidad,
    toneVar: 'var(--tone-longevidad)',
    href: '/nosotros',
    status: 'realizado',
    attendees: 340,
  },
  {
    id: 'leg-microbiota-2025',
    order: 4,
    year: 2025,
    topic: 'Microbiota',
    name: 'Microbiota',
    claim: 'El ecosistema que gobierna tu salud',
    description:
      'La cuarta edición situó la microbiota intestinal en el centro de la consulta clínica: cómo evaluarla, cómo intervenirla y por qué conecta con cada sistema del organismo. Una pieza clave en la ruta que llevaría a Hormobiota.',
    highlights: ['Microbiota intestinal', 'Eje intestino-cerebro', 'Disbiosis en práctica clínica'],
    image: media.microbiotaNetwork,
    toneVar: '50 180 130',
    href: '/nosotros',
    status: 'realizado',
    attendees: 390,
  },
  {
    id: 'leg-hormobiota-1',
    order: 5,
    year: 2026,
    monthLabel: 'Abr',
    topic: 'Hormobiota',
    name: 'Hormobiota',
    claim: 'Donde se unen las hormonas con la microbiota',
    description:
      'La quinta edición conectó todos los temas anteriores en una sola tesis: el diálogo entre microbiota y sistema endocrino. Ahí nació Hormobiota como marca propia y como línea académica permanente.',
    highlights: ['Eje intestino-hormona', 'Nace la marca Hormobiota', 'Primera comunidad propia'],
    image: media.legacyHormobiota,
    toneVar: 'var(--tone-hormobiota)',
    href: '/hormobiota',
    status: 'realizado',
    attendees: 420,
  },
  {
    id: 'leg-eterna-primavera-2026',
    order: 6,
    year: 2026,
    monthLabel: 'Nov',
    topic: 'La Eterna Primavera',
    name: 'La Eterna Primavera de tus Hormonas',
    claim: 'Hormonas, intestino y bienestar: la conexión que lo cambia todo',
    description:
      'Un congreso para quienes tienen preguntas sobre su salud hormonal: hombres y mujeres que quieren entender cómo las hormonas, el intestino y la alimentación determinan cómo se sienten cada día. Lenguaje claro, ciencia real.',
    highlights: ['Hormonas e intestino', 'Alimentación y bienestar', 'Para público general', '7 Nov 2026 · Medellín · Presencial + Virtual'],
    image: media.eternaPrimaveraHero,
    logo: media.logoEternaPrimavera,
    heroImage: media.eternaPrimaveraHero,
    toneVar: '210 90 140',
    href: '/eventos/eterna-primavera/eterna-primavera-2026',
    status: 'proximo',
  },
  {
    id: 'leg-hormobiota-2',
    order: 7,
    year: 2027,
    topic: 'Hormobiota 2',
    name: 'Hormobiota 2',
    claim: 'El puente: del intestino a la longevidad',
    description:
      'La séptima edición amplía la tesis a seis puentes que recorren el cuerpo como una red: intestino, hormonas, inmunidad y músculo, sueño, longevidad celular y piel.',
    highlights: ['Los seis puentes', 'Dos días de programa', 'Auditorio Forum UPB, Medellín'],
    image: media.hormobiotaHero,
    logo: media.logoHormobiotaDark,
    heroImage: media.hormobiotaHero,
    toneVar: 'var(--tone-hormobiota)',
    href: '/eventos/hormobiota/hormobiota-2-2027',
    status: 'proximo',
  },
];
