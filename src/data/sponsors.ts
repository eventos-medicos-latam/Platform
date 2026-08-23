import type {
  PlanFeature,
  SponsorBenefitInventory,
  SponsorBannerConfig,
  SponsorPackage,
  Stand } from
'../types/commerce';

/**
 * REGLA CRÍTICA: los valores de patrocinio son BORRADOR.
 * Viven en el Dashboard y no se publican en la web hasta que alguien
 * los marque aprobado y luego publicado.
 */
export const sponsorPackages: SponsorPackage[] = [
{
  id: 'pkg-2027-digital',
  editionId: 'ed-hormobiota-2027',
  tier: 'digital',
  name: 'Presencia digital · Ruta 21 días',
  summary: 'Presencia de marca en la experiencia previa al congreso y en los canales digitales del evento.',
  priceBeforeVat: 3_200_000,
  currency: 'COP',
  vatRate: 0.19,
  benefits: [
  'Presencia en la Ruta Hormobiota (21 días)',
  'Logo en el banner de patrocinadores, nivel apoyo',
  'Menciones en comunicaciones de email y WhatsApp',
  'Entradas incluidas: PENDIENTE'],

  totalInventory: 12,
  reserved: 1,
  sold: 0,
  status: 'borrador',
  order: 1
},
{
  id: 'pkg-2027-stand',
  editionId: 'ed-hormobiota-2027',
  tier: 'stand',
  name: 'Ruta 21 + presencia digital + stand',
  summary: 'Todo lo anterior más stand en la zona comercial del congreso.',
  priceBeforeVat: 8_900_000,
  currency: 'COP',
  vatRate: 0.19,
  benefits: [
  'Todo el paquete de presencia digital',
  'Stand en zona comercial (medidas y ubicación por confirmar)',
  'Logo en el banner, nivel destacado',
  'Entradas incluidas: PENDIENTE'],

  totalInventory: 8,
  reserved: 1,
  sold: 1,
  status: 'borrador',
  order: 2
},
{
  id: 'pkg-2027-speaker',
  editionId: 'ed-hormobiota-2027',
  tier: 'speaker',
  name: 'Todo lo anterior + speaker',
  summary: 'Máximo nivel: incluye un espacio académico patrocinado asociado a un puente.',
  priceBeforeVat: 19_500_000,
  currency: 'COP',
  vatRate: 0.19,
  benefits: [
  'Todo el paquete anterior',
  'Speaker patrocinado asociado a un puente (inventario limitado)',
  'Logo en el banner, nivel principal',
  'Activación en el evento',
  'Entradas incluidas: PENDIENTE'],

  totalInventory: 3,
  reserved: 0,
  sold: 1,
  status: 'borrador',
  order: 3
}];


/** Beneficios de disponibilidad limitada, controlados como inventario. */
export const sponsorInventory: SponsorBenefitInventory[] = [
{
  id: 'inv-speaker-p1',
  editionId: 'ed-hormobiota-2027',
  benefit: 'Speaker patrocinado',
  trackId: 'puente-1',
  total: 1,
  reserved: 0,
  sold: 0,
  companyIds: []
},
{
  id: 'inv-speaker-p5',
  editionId: 'ed-hormobiota-2027',
  benefit: 'Speaker patrocinado',
  trackId: 'puente-5',
  total: 1,
  reserved: 0,
  sold: 1,
  companyIds: ['co-001']
},
{
  id: 'inv-speaker-p6',
  editionId: 'ed-hormobiota-2027',
  benefit: 'Speaker patrocinado',
  trackId: 'puente-6',
  total: 1,
  reserved: 1,
  sold: 0,
  companyIds: ['co-003']
},
{
  id: 'inv-coffee',
  editionId: 'ed-hormobiota-2027',
  benefit: 'Coffee break patrocinado',
  total: 4,
  reserved: 1,
  sold: 1,
  companyIds: ['co-002']
},
{
  id: 'inv-coctel',
  editionId: 'ed-hormobiota-2027',
  benefit: 'Cóctel de networking',
  total: 1,
  reserved: 0,
  sold: 0,
  companyIds: []
},
{
  id: 'inv-almuerzo',
  editionId: 'ed-hormobiota-2027',
  benefit: 'Almuerzo dialogado',
  total: 2,
  reserved: 0,
  sold: 0,
  companyIds: []
}];


export const stands: Stand[] = [
// Doce stands de 3 × 2 m dispuestos en U alrededor del pasillo de circulación.
// Brazo superior
{ id: 'st-01', editionId: 'ed-hormobiota-2027', number: '01', category: 'Stand', location: 'Frente al pasillo central', size: '3 × 2 m', price: null, status: 'vendido', companyId: 'co-001', benefits: ['3 × 2 m', 'Cabecera del recinto', 'Energía y mesa'], plan: { col: 1, row: 1, w: 3, h: 2 } },
{ id: 'st-02', editionId: 'ed-hormobiota-2027', number: '02', category: 'Stand', location: 'Frente al pasillo central', size: '3 × 2 m', price: null, status: 'reservado', companyId: 'co-003', benefits: ['3 × 2 m', 'Cabecera del recinto'], plan: { col: 4, row: 1, w: 3, h: 2 } },
{ id: 'st-03', editionId: 'ed-hormobiota-2027', number: '03', category: 'Stand', location: 'Frente al pasillo central', size: '3 × 2 m', price: null, status: 'disponible', benefits: ['3 × 2 m', 'Cabecera del recinto'], plan: { col: 7, row: 1, w: 3, h: 2 } },
{ id: 'st-04', editionId: 'ed-hormobiota-2027', number: '04', category: 'Stand', location: 'Frente al pasillo central', size: '3 × 2 m', price: null, status: 'disponible', benefits: ['3 × 2 m', 'Esquina superior derecha'], plan: { col: 10, row: 1, w: 3, h: 2 } },
// Ala izquierda
{ id: 'st-05', editionId: 'ed-hormobiota-2027', number: '05', category: 'Stand', location: 'Ala izquierda', size: '3 × 2 m', price: null, status: 'vendido', companyId: 'co-002', benefits: ['3 × 2 m', 'Energía y mesa'], plan: { col: 1, row: 3, w: 3, h: 2 } },
{ id: 'st-06', editionId: 'ed-hormobiota-2027', number: '06', category: 'Stand', location: 'Ala izquierda', size: '3 × 2 m', price: null, status: 'disponible', benefits: ['3 × 2 m', 'Energía y mesa'], plan: { col: 1, row: 5, w: 3, h: 2 } },
{ id: 'st-07', editionId: 'ed-hormobiota-2027', number: '07', category: 'Stand', location: 'Ala izquierda', size: '3 × 2 m', price: null, status: 'disponible', benefits: ['3 × 2 m', 'Junto a networking'], plan: { col: 1, row: 7, w: 3, h: 2 } },
// Ala derecha
{ id: 'st-08', editionId: 'ed-hormobiota-2027', number: '08', category: 'Stand', location: 'Ala derecha', size: '3 × 2 m', price: null, status: 'disponible', benefits: ['3 × 2 m', 'Energía y mesa'], plan: { col: 10, row: 3, w: 3, h: 2 } },
{ id: 'st-09', editionId: 'ed-hormobiota-2027', number: '09', category: 'Stand', location: 'Ala derecha', size: '3 × 2 m', price: null, status: 'bloqueado', benefits: ['Reservado por logística'], plan: { col: 10, row: 5, w: 3, h: 2 } },
{ id: 'st-10', editionId: 'ed-hormobiota-2027', number: '10', category: 'Stand', location: 'Ala derecha', size: '3 × 2 m', price: null, status: 'disponible', benefits: ['3 × 2 m', 'Junto a networking'], plan: { col: 10, row: 7, w: 3, h: 2 } },
// Frente al acceso
{ id: 'st-11', editionId: 'ed-hormobiota-2027', number: '11', category: 'Stand', location: 'Junto al acceso principal', size: '3 × 2 m', price: null, status: 'disponible', benefits: ['3 × 2 m', 'Primer contacto al ingresar'], plan: { col: 1, row: 9, w: 3, h: 2 } },
{ id: 'st-12', editionId: 'ed-hormobiota-2027', number: '12', category: 'Stand', location: 'Junto al acceso principal', size: '3 × 2 m', price: null, status: 'disponible', benefits: ['3 × 2 m', 'Primer contacto al ingresar'], plan: { col: 10, row: 9, w: 3, h: 2 } },
// Cinco estaciones Pop Up en el costado derecho del recinto.
{ id: 'pu-1', editionId: 'ed-hormobiota-2027', number: 'P1', category: 'Pop Up', location: 'Costado de exhibición', size: 'Mesa + 2 sillas', price: null, status: 'vendido', companyId: 'co-004', benefits: ['1 mesa y 2 sillas', 'Espacio para 1 pendón'], plan: { col: 14, row: 2, w: 3, h: 1 } },
{ id: 'pu-2', editionId: 'ed-hormobiota-2027', number: 'P2', category: 'Pop Up', location: 'Costado de exhibición', size: 'Mesa + 2 sillas', price: null, status: 'disponible', benefits: ['1 mesa y 2 sillas', 'Espacio para 1 pendón'], plan: { col: 14, row: 3, w: 3, h: 1 } },
{ id: 'pu-3', editionId: 'ed-hormobiota-2027', number: 'P3', category: 'Pop Up', location: 'Costado de exhibición', size: 'Mesa + 2 sillas', price: null, status: 'disponible', benefits: ['1 mesa y 2 sillas', 'Espacio para 1 pendón'], plan: { col: 14, row: 4, w: 3, h: 1 } },
{ id: 'pu-4', editionId: 'ed-hormobiota-2027', number: 'P4', category: 'Pop Up', location: 'Costado de exhibición', size: 'Mesa + 2 sillas', price: null, status: 'disponible', benefits: ['1 mesa y 2 sillas', 'Espacio para 1 pendón'], plan: { col: 14, row: 5, w: 3, h: 1 } },
{ id: 'pu-5', editionId: 'ed-hormobiota-2027', number: 'P5', category: 'Pop Up', location: 'Costado de exhibición', size: 'Mesa + 2 sillas', price: null, status: 'disponible', benefits: ['1 mesa y 2 sillas', 'Espacio para 1 pendón'], plan: { col: 14, row: 6, w: 3, h: 1 } }];


/** Elementos fijos del plano de la zona comercial. */
export const planFeatures: PlanFeature[] = [
{ id: 'pf-circulacion', label: 'Pasillo de circulación', kind: 'circulacion', plan: { col: 4, row: 3, w: 6, h: 4 } },
{ id: 'pf-auditorio', label: 'Auditorio Forum', kind: 'tarima', plan: { col: 4, row: 7, w: 6, h: 2 } },
{ id: 'pf-acceso', label: 'Acceso principal', kind: 'acceso', plan: { col: 4, row: 9, w: 6, h: 2 } },
{ id: 'pf-popup', label: 'Zona Pop Up', kind: 'circulacion', plan: { col: 14, row: 1, w: 3, h: 1 } },
{ id: 'pf-coffee', label: 'Zona coffee', kind: 'servicio', plan: { col: 14, row: 8, w: 3, h: 3 } }];


/** Configuración del banner de patrocinadores, administrada desde el Dashboard. */
export const sponsorBanner: SponsorBannerConfig = {
  editionId: 'ed-hormobiota-2027',
  enabled: true,
  headingLabel: 'Con el apoyo de',
  surfaces: ['evento', 'corporativo'],
  desktopSpeedSeconds: 30,
  mobileSpeedSeconds: 22,
  mobileEnabled: true,
  collapsible: true,
  slots: [
  { id: 'slot-1', companyId: 'co-001', tier: 'principal', order: 1, active: true, impressions: 18420, clicks: 214, logoReady: true },
  { id: 'slot-2', companyId: 'co-002', tier: 'destacado', order: 2, active: true, impressions: 18120, clicks: 146, logoReady: true },
  { id: 'slot-3', companyId: 'co-003', tier: 'destacado', order: 3, active: true, impressions: 17980, clicks: 132, logoReady: false },
  { id: 'slot-4', companyId: 'co-004', tier: 'apoyo', order: 4, active: true, impressions: 17410, clicks: 88, logoReady: true },
  { id: 'slot-5', companyId: 'co-005', tier: 'apoyo', order: 5, active: true, impressions: 17260, clicks: 71, logoReady: true },
  { id: 'slot-6', companyId: 'co-006', tier: 'apoyo', order: 6, active: false, impressions: 0, clicks: 0, logoReady: false }]

};

export function packagesByEdition(editionId: string): SponsorPackage[] {
  return sponsorPackages.filter((pkg) => pkg.editionId === editionId).sort((a, b) => a.order - b.order);
}

/** Solo paquetes publicados pueden mostrar precio en la web. */
export function publicPackages(editionId: string): SponsorPackage[] {
  return packagesByEdition(editionId).filter((pkg) => pkg.status === 'publicado');
}

export function standsByEdition(editionId: string): Stand[] {
  return stands.filter((stand) => stand.editionId === editionId);
}

export const standCategories = ['Stand', 'Pop Up'] as const;