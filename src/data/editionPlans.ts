/**
 * Planes de participación por edición.
 *
 * Cada edición puede definir sus propios planes comerciales. Si la edición
 * no tiene planes definidos aquí, la UI no mostrará la sección de planes.
 * Los planes de Hormobiota 2 viven en plans.ts (origen histórico); aquí
 * se importan y se asignan a la edición correspondiente.
 */
import type { ParticipationPlan } from '../types/participation';
import { participationPlans as hormobiota2Plans } from './plans';

// ─── La Eterna Primavera 2026 ──────────────────────────────────────────────

const eternaPrimaveraPlans: ParticipationPlan[] = [
  {
    id: 'protagonista',
    name: 'Paquete Protagonista',
    verb: 'Posicionarte',
    tagline: 'Posicionamiento integral + presencia académica + ecosistema',
    price: 15000000,
    intro: [
      'La modalidad de mayor visibilidad e integración en La Eterna Primavera.',
      'Para marcas que quieren ser parte de la conversación sobre salud hormonal y bienestar, asociando su nombre con los contenidos científicos del evento.',
    ],
    benefitGroups: [
      {
        title: 'Presencia física',
        items: [
          'Stand 3 × 2 m durante el evento.',
          'Branding en backing, escarapelas y señalética.',
          'Mesa en el espacio de relacionamiento.',
          'Máximo 4 colaboradores de la marca.',
        ],
      },
      {
        title: 'Presencia web y digital',
        items: [
          'Logo y presencia destacada en la página web oficial.',
          'Presencia digital en comunicaciones del evento.',
          'Exposición digital antes, durante y después del evento.',
          'Visibilidad continua durante 3 a 6 meses.',
        ],
      },
      {
        title: 'Speaker y espacio académico',
        items: [
          'Participación con un speaker dentro del programa académico.',
          'La marca puede proponer su propio speaker o pedir acompañamiento de EML.',
          'Sujeto a revisión y aprobación del comité científico.',
        ],
      },
      {
        title: 'Naming de tema',
        items: [
          'Asociación del nombre de la marca con uno de los temas del programa.',
          'Exclusividad: 1 marca por tema.',
        ],
      },
      {
        title: 'Relacionamiento',
        items: [
          'Mesa de nicho durante el espacio de almuerzo.',
          '20 invitaciones para profesionales de la salud.',
        ],
      },
    ],
    idealFor: [
      'Posicionarse en la conversación sobre salud hormonal.',
      'Asociar la marca con contenidos educativos.',
      'Participar mediante un speaker propio.',
      'Tener presencia destacada en web y redes.',
    ],
    closing:
      'Protagonista integra tu marca dentro de la conversación científica de La Eterna Primavera.',
    mockup: '/Kary_Juanita.png',
    space: 'stand',
    maxStaff: 4,
    guestPasses: 20,
    includesBridge: true,
    includesSpeaker: true,
    totalInventory: 4,
    sold: 0,
    availabilityNote: '4 cupos disponibles · 1 marca por tema.',
    has_map: true,
  },
  {
    id: 'conexion',
    name: 'Paquete Conexión',
    verb: 'Conectar',
    tagline: 'Presencia digital + web + stand + relacionamiento',
    price: 8900000,
    intro: [
      'Para marcas que quieren ir más allá de la presencia física.',
      'Combina presencia digital, exposición en la página web, stand físico y relacionamiento directo con la audiencia del evento.',
    ],
    benefitGroups: [
      {
        title: 'Presencia física',
        items: [
          'Stand 3 × 2 m durante el evento.',
          'Branding en backing, escarapelas y señalética.',
          'Máximo 4 colaboradores de la marca.',
        ],
      },
      {
        title: 'Presencia web y digital',
        items: [
          'Logo y presencia en la página web oficial.',
          'Presencia digital en comunicaciones del evento.',
          'Integración de marca en contenidos digitales.',
        ],
      },
      {
        title: 'Redes sociales',
        items: [
          '3 menciones de marca en redes de EML.',
          'Presencia en contenidos del tema correspondiente.',
          'Inclusión en comunicaciones digitales seleccionadas.',
        ],
      },
      {
        title: 'Relacionamiento',
        items: [
          'Mesa de nicho durante el almuerzo.',
          '10 invitaciones para profesionales de la salud.',
        ],
      },
    ],
    idealFor: [
      'Tener stand formal en el evento.',
      'Presencia en la web de La Eterna Primavera.',
      'Visibilidad digital antes del evento.',
      'Relacionamiento con la audiencia.',
    ],
    closing:
      'Conexión combina presencia física y digital para que tu marca forme parte del ecosistema La Eterna Primavera.',
    mockup: '/Kary_Juanita.png',
    space: 'stand',
    maxStaff: 4,
    guestPasses: 10,
    includesBridge: false,
    includesSpeaker: false,
    totalInventory: 6,
    sold: 0,
    availabilityNote: 'Espacios limitados según capacidad del foyer.',
    has_map: true,
  },
  {
    id: 'pop-up',
    name: 'Pop Up',
    verb: 'Estar presente',
    tagline: 'Presencia de marca simple y directa',
    price: 3200000,
    intro: [
      'Presencia presencial compacta para marcas que quieren estar en La Eterna Primavera sin montar un stand completo.',
      'Espacio para presentar productos, entregar muestras y conversar con los asistentes.',
    ],
    benefitGroups: [
      {
        title: 'Presencia física',
        items: [
          'Estación comercial asignada en la zona de exhibición.',
          '1 mesa + 2 sillas.',
          'Espacio para 1 pendón roll-up.',
          'Exhibición de productos y material sobre la mesa.',
        ],
      },
      {
        title: 'Equipo de marca',
        items: ['Acceso para máximo 2 colaboradores.'],
      },
    ],
    idealFor: [
      'Participar presencialmente.',
      'Dar a conocer un producto o servicio.',
      'Exhibir muestras o material comercial.',
      'Probar la experiencia antes de una participación mayor.',
    ],
    closing:
      'Una forma práctica de acercar tu marca a la comunidad de La Eterna Primavera.',
    mockup: '/Kary_Juanita.png',
    space: 'estacion',
    maxStaff: 2,
    guestPasses: 0,
    includesBridge: false,
    includesSpeaker: false,
    totalInventory: 4,
    sold: 0,
    availabilityNote: 'Máximo 4 estaciones en la zona de exhibición.',
  },
];

// ─── Mapa edición → planes ─────────────────────────────────────────────────

const plansByEdition: Record<string, ParticipationPlan[]> = {
  'ed-eterna-primavera-2026': eternaPrimaveraPlans,
  'ed-hormobiota-2027': hormobiota2Plans,
};

/** Devuelve los planes de participación de una edición, o [] si no tiene. */
export function getEditionPlans(editionId: string): ParticipationPlan[] {
  return plansByEdition[editionId] ?? [];
}

/** True si la edición tiene planes de participación configurados. */
export function editionHasPlans(editionId: string): boolean {
  return (plansByEdition[editionId]?.length ?? 0) > 0;
}
