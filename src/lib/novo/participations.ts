import { getEditionByNovoSlug } from '../../data/editions';
import { getEditionPlans } from '../../data/editionPlans';
import { media } from '../../data/media';
import type { ParticipationPlan } from '../../types/participation';
import {
  DEFAULT_EVENT_SECTIONS,
  getEventSettings,
  upsertEventSettings,
} from './events';

export type StandType = 'estacion' | 'stand-pequeno' | 'stand-mediano' | 'stand-grande' | 'ninguno';

export type BenefitGroup = {
  id: string;
  title: string;
  items: string[];
};

export type EventParticipation = {
  id: string;
  name: string;
  verb: string;
  tagline: string;
  price: number;
  spots: number;
  sold: number;
  image_url: string;
  stand_type: StandType;
  /** Zona del plano a la que se limita este plan (vacío = todas). */
  stand_zone: string;
  has_map: boolean;
  is_featured: boolean;
  is_active: boolean;
  benefit_groups: BenefitGroup[];
  closing: string;
};

const STAND_TYPES: StandType[] = ['estacion', 'stand-pequeno', 'stand-mediano', 'stand-grande', 'ninguno'];
const PLAN_ENUMS = new Set(['pop-up', 'conexion', 'protagonista']);

function asStandType(value: unknown): StandType {
  return STAND_TYPES.includes(value as StandType) ? (value as StandType) : 'ninguno';
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? '').trim()).filter(Boolean);
}

export function parseEventParticipation(raw: unknown): EventParticipation | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const name = String(row.name ?? '').trim();
  if (!name) return null;
  const groupsRaw = Array.isArray(row.benefit_groups) ? row.benefit_groups : [];
  return {
    id: String(row.id ?? `p-${crypto.randomUUID()}`),
    name,
    verb: String(row.verb ?? ''),
    tagline: String(row.tagline ?? ''),
    price: Number(row.price) || 0,
    spots: Number(row.spots) || 0,
    sold: Number(row.sold) || 0,
    image_url: String(row.image_url ?? ''),
    stand_type: asStandType(row.stand_type),
    stand_zone: String(row.stand_zone ?? '').trim(),
    has_map: Boolean(row.has_map),
    is_featured: Boolean(row.is_featured),
    is_active: row.is_active !== false,
    benefit_groups: groupsRaw.map((group, index) => {
      const item = group && typeof group === 'object' ? (group as Record<string, unknown>) : {};
      return {
        id: String(item.id ?? `g-${index}`),
        title: String(item.title ?? ''),
        items: asStringArray(item.items),
      };
    }),
    closing: String(row.closing ?? ''),
  };
}

export function catalogPlanToParticipation(plan: ParticipationPlan, index: number): EventParticipation {
  return {
    id: plan.id,
    name: plan.name,
    verb: plan.verb,
    tagline: plan.tagline,
    price: plan.price,
    spots: plan.totalInventory ?? 0,
    sold: plan.sold,
    image_url: plan.mockup,
    stand_type: plan.space === 'estacion' ? 'estacion' : 'stand-mediano',
    stand_zone: plan.stand_zone ?? '',
    has_map: Boolean(plan.has_map),
    is_featured: Boolean(plan.featured) || plan.id === 'protagonista' || index === 0,
    is_active: true,
    benefit_groups: plan.benefitGroups.map((group, groupIndex) => ({
      id: `${plan.id}-g${groupIndex}`,
      title: group.title,
      items: group.items,
    })),
    closing: plan.closing,
  };
}

export function participationToPublicPlan(row: EventParticipation): ParticipationPlan {
  const left = Math.max(0, row.spots - row.sold);
  return {
    id: row.id,
    name: row.name,
    verb: row.verb || 'Participar',
    tagline: row.tagline,
    price: row.price,
    intro: row.tagline ? [row.tagline] : [],
    mockup: row.image_url || media.networking,
    benefitGroups: row.benefit_groups
      .filter((group) => group.title.trim() || group.items.length)
      .map((group) => ({ title: group.title || 'Incluye', items: group.items })),
    idealFor: [],
    closing: row.closing,
    space: row.stand_type === 'estacion' ? 'estacion' : 'stand',
    maxStaff: 0,
    guestPasses: 0,
    includesBridge: false,
    includesSpeaker: false,
    totalInventory: row.spots,
    sold: row.sold,
    availabilityNote: `${left} cupos disponibles`,
    has_map: row.has_map,
    stand_zone: row.stand_zone,
    featured: row.is_featured,
  };
}

export function defaultParticipationsForSlug(slug: string): EventParticipation[] {
  const edition = getEditionByNovoSlug(slug);
  if (!edition) return [];
  return getEditionPlans(edition.id).map(catalogPlanToParticipation);
}

export function enumPlanId(planId: string | null | undefined): string | null {
  if (!planId) return null;
  return PLAN_ENUMS.has(planId) ? planId : null;
}

export async function listEventParticipations(eventId: string): Promise<EventParticipation[]> {
  const settings = await getEventSettings(eventId);
  const raw = settings?.custom?.participations;
  if (!Array.isArray(raw)) return [];
  return raw.map(parseEventParticipation).filter((row): row is EventParticipation => Boolean(row));
}

export async function saveEventParticipations(eventId: string, rows: EventParticipation[]): Promise<void> {
  const current = await getEventSettings(eventId);
  await upsertEventSettings(eventId, {
    sections: current?.sections ?? DEFAULT_EVENT_SECTIONS,
    custom: {
      ...(current?.custom ?? {}),
      participations: rows,
    },
  });
}

export async function getFloorPlanUrl(eventId: string): Promise<string> {
  const settings = await getEventSettings(eventId);
  const value = settings?.custom?.floor_plan_url;
  return typeof value === 'string' ? value.trim() : '';
}

export async function saveFloorPlanUrl(eventId: string, url: string): Promise<void> {
  const current = await getEventSettings(eventId);
  await upsertEventSettings(eventId, {
    sections: current?.sections ?? DEFAULT_EVENT_SECTIONS,
    custom: {
      ...(current?.custom ?? {}),
      floor_plan_url: url.trim(),
    },
  });
}
