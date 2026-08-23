import type {
  ActivityEntry,
  Company,
  CompanyDocument,
  CompanyPayment,
  Participation,
  Requirement } from
'../types/company';

/**
 * REGLA DE DATOS: no hay patrocinadores confirmados todavía.
 * Estas empresas son datos de muestra (isSampleData) para operar el
 * Dashboard y el Portal. Los nombres reales se cargan cuando el equipo
 * comercial cierre cada acuerdo.
 */
export const companies: Company[] = [
{
  id: 'co-001',
  tradeName: 'NovaLab',
  legalName: 'PENDIENTE',
  nit: 'PENDIENTE',
  address: 'PENDIENTE',
  city: 'Medellín',
  country: 'Colombia',
  web: 'PENDIENTE',
  instagram: 'PENDIENTE',
  contactName: 'PENDIENTE',
  contactEmail: 'PENDIENTE',
  contactWhatsapp: 'PENDIENTE',
  description: 'Nutrición clínica y suplementación. Descripción comercial: PENDIENTE.',
  isSampleData: true,
  logoReady: true,
  logoUrl: "/a122854e-6f38-43c2-ad98-d9e572be1954.jpg",
  brandAssets: [
  { id: 'as-001', companyId: 'co-001', kind: 'logo-png', name: 'logo-principal.png', status: 'aprobado', updatedAt: '2026-07-14' },
  { id: 'as-002', companyId: 'co-001', kind: 'logo-svg', name: 'logo-principal.svg', status: 'aprobado', updatedAt: '2026-07-14' },
  { id: 'as-003', companyId: 'co-001', kind: 'manual', name: 'manual-de-marca.pdf', status: 'cargado', updatedAt: '2026-07-16' },
  { id: 'as-004', companyId: 'co-001', kind: 'producto', name: 'fichas-producto.pdf', status: 'pendiente', updatedAt: '—' }]

},
{
  id: 'co-002',
  tradeName: 'BioMedix',
  legalName: 'PENDIENTE',
  nit: 'PENDIENTE',
  address: 'PENDIENTE',
  city: 'Bogotá',
  country: 'Colombia',
  web: 'PENDIENTE',
  instagram: 'PENDIENTE',
  contactName: 'PENDIENTE',
  contactEmail: 'PENDIENTE',
  contactWhatsapp: 'PENDIENTE',
  description: 'Diagnóstico y laboratorio. Descripción comercial: PENDIENTE.',
  isSampleData: true,
  logoReady: true,
  logoUrl: "/60338d4a-a991-4e02-b6cb-cb2fb0903c21.jpg",
  brandAssets: [
  { id: 'as-011', companyId: 'co-002', kind: 'logo-png', name: 'logo.png', status: 'aprobado', updatedAt: '2026-08-02' },
  { id: 'as-012', companyId: 'co-002', kind: 'logo-svg', name: 'logo.svg', status: 'requiere-cambios', updatedAt: '2026-08-05' }]

},
{
  id: 'co-003',
  tradeName: 'DermaCare',
  legalName: 'PENDIENTE',
  nit: 'PENDIENTE',
  address: 'PENDIENTE',
  city: 'Medellín',
  country: 'Colombia',
  web: 'PENDIENTE',
  instagram: 'PENDIENTE',
  contactName: 'PENDIENTE',
  contactEmail: 'PENDIENTE',
  contactWhatsapp: 'PENDIENTE',
  description: 'Dermatología y medicina estética. Descripción comercial: PENDIENTE.',
  isSampleData: true,
  logoReady: false,
  brandAssets: [
  { id: 'as-021', companyId: 'co-003', kind: 'logo-png', name: 'Sin cargar', status: 'pendiente', updatedAt: '—' },
  { id: 'as-022', companyId: 'co-003', kind: 'logo-svg', name: 'Sin cargar', status: 'pendiente', updatedAt: '—' }]

},
{
  id: 'co-004',
  tradeName: 'Endosfera',
  legalName: 'PENDIENTE',
  nit: 'PENDIENTE',
  address: 'PENDIENTE',
  city: 'Cali',
  country: 'Colombia',
  web: 'PENDIENTE',
  instagram: 'PENDIENTE',
  contactName: 'PENDIENTE',
  contactEmail: 'PENDIENTE',
  contactWhatsapp: 'PENDIENTE',
  description: 'Tecnología médica. Descripción comercial: PENDIENTE.',
  isSampleData: true,
  logoReady: true,
  logoUrl: "/61d8e798-4457-4176-92ab-1ce1f3694f5d.jpg",
  brandAssets: [
  { id: 'as-031', companyId: 'co-004', kind: 'logo-png', name: 'logo.png', status: 'cargado', updatedAt: '2026-08-09' }]

},
{
  id: 'co-005',
  tradeName: 'Vitaris',
  legalName: 'PENDIENTE',
  nit: 'PENDIENTE',
  address: 'PENDIENTE',
  city: 'Medellín',
  country: 'Colombia',
  web: 'PENDIENTE',
  instagram: 'PENDIENTE',
  contactName: 'PENDIENTE',
  contactEmail: 'PENDIENTE',
  contactWhatsapp: 'PENDIENTE',
  description: 'Farmacéutica. Descripción comercial: PENDIENTE.',
  isSampleData: true,
  logoReady: true,
  logoUrl: "/84b98655-e6e8-4341-9640-aa2a114bf506.jpg",
  brandAssets: [
  { id: 'as-041', companyId: 'co-005', kind: 'logo-png', name: 'logo.png', status: 'aprobado', updatedAt: '2026-06-30' }]

},
{
  id: 'co-006',
  tradeName: 'FloraMed',
  legalName: 'PENDIENTE',
  nit: 'PENDIENTE',
  address: 'PENDIENTE',
  city: 'Barranquilla',
  country: 'Colombia',
  web: 'PENDIENTE',
  instagram: 'PENDIENTE',
  contactName: 'PENDIENTE',
  contactEmail: 'PENDIENTE',
  contactWhatsapp: 'PENDIENTE',
  description: 'Equipos y dispositivos. En negociación.',
  isSampleData: true,
  logoReady: false,
  brandAssets: []
}];


export const participations: Participation[] = [
{
  id: 'pa-001',
  companyId: 'co-001',
  editionId: 'ed-hormobiota-2027',
  roles: ['patrocinador', 'expositor'],
  packageTier: 'speaker',
  packageName: 'Todo lo anterior + speaker',
  standId: 'st-01',
  includedTickets: 0,
  activations: ['Speaker patrocinado', 'Activación en zona comercial'],
  sponsoredSpeakerTrackId: 'puente-5',
  trackId: 'puente-5',
  agreedAmount: 19_500_000,
  paidAmount: 9_750_000,
  status: 'publicado',
  bannerTier: 'principal'
},
{
  id: 'pa-002',
  companyId: 'co-002',
  editionId: 'ed-hormobiota-2027',
  roles: ['patrocinador', 'expositor'],
  packageTier: 'stand',
  packageName: 'Ruta 21 + presencia digital + stand',
  standId: 'st-03',
  includedTickets: 0,
  activations: ['Coffee break patrocinado'],
  agreedAmount: 8_900_000,
  paidAmount: 8_900_000,
  status: 'publicado',
  bannerTier: 'destacado'
},
{
  id: 'pa-003',
  companyId: 'co-003',
  editionId: 'ed-hormobiota-2027',
  roles: ['patrocinador'],
  packageTier: 'stand',
  packageName: 'Ruta 21 + presencia digital + stand',
  standId: 'st-02',
  includedTickets: 0,
  activations: [],
  sponsoredSpeakerTrackId: 'puente-6',
  trackId: 'puente-6',
  agreedAmount: 8_900_000,
  paidAmount: 0,
  status: 'aprobado',
  bannerTier: 'destacado'
},
{
  id: 'pa-004',
  companyId: 'co-004',
  editionId: 'ed-hormobiota-2027',
  roles: ['patrocinador'],
  packageTier: 'digital',
  packageName: 'Presencia digital · Ruta 21 días',
  includedTickets: 0,
  activations: [],
  agreedAmount: 3_200_000,
  paidAmount: 3_200_000,
  status: 'publicado',
  bannerTier: 'apoyo'
},
{
  id: 'pa-005',
  companyId: 'co-005',
  editionId: 'ed-hormobiota-2027',
  roles: ['patrocinador'],
  packageTier: 'digital',
  packageName: 'Presencia digital · Ruta 21 días',
  includedTickets: 0,
  activations: [],
  agreedAmount: 3_200_000,
  paidAmount: 1_600_000,
  status: 'publicado',
  bannerTier: 'apoyo'
},
{
  id: 'pa-006',
  companyId: 'co-006',
  editionId: 'ed-hormobiota-2027',
  roles: ['patrocinador'],
  packageName: 'PENDIENTE',
  includedTickets: 0,
  activations: [],
  agreedAmount: null,
  paidAmount: 0,
  status: 'en-negociacion'
},
{
  id: 'pa-007',
  companyId: 'co-001',
  editionId: 'ed-hormobiota-2026',
  roles: ['patrocinador'],
  packageName: 'PENDIENTE · paquete de la primera edición',
  includedTickets: 0,
  activations: [],
  agreedAmount: null,
  paidAmount: 0,
  status: 'cerrado'
}];


export const requirements: Requirement[] = [
{
  id: 'rq-001',
  companyId: 'co-003',
  editionId: 'ed-hormobiota-2027',
  title: 'Subir logo en SVG',
  description:
  'El banner de patrocinadores requiere el logo vectorial. Sin este archivo la marca no puede publicarse en la cinta.',
  owner: 'Marca 03',
  dueDate: '2026-09-05',
  kind: 'archivo',
  status: 'pendiente',
  autoGenerated: true,
  comments: [
  { id: 'cm-001', author: 'Eventos Médicos LATAM', date: '2026-08-20', text: 'Requerimiento generado automáticamente por el módulo de banner.' }]

},
{
  id: 'rq-002',
  companyId: 'co-003',
  editionId: 'ed-hormobiota-2027',
  title: 'Firmar contrato de patrocinio',
  description: 'Documento enviado para revisión y firma. Firma electrónica: tecnología por definir.',
  owner: 'Marca 03',
  dueDate: '2026-09-12',
  kind: 'firma',
  status: 'en-revision',
  autoGenerated: false,
  comments: []
},
{
  id: 'rq-003',
  companyId: 'co-001',
  editionId: 'ed-hormobiota-2027',
  title: 'Completar datos del stand 01',
  description: 'Necesitamos requerimientos técnicos, energía y montaje del stand.',
  owner: 'Marca 01',
  dueDate: '2026-10-01',
  kind: 'formulario',
  status: 'en-proceso',
  autoGenerated: false,
  comments: []
},
{
  id: 'rq-004',
  companyId: 'co-001',
  editionId: 'ed-hormobiota-2027',
  title: 'Confirmar speaker patrocinado (Puente 5)',
  description: 'Enviar hoja de vida y tema propuesto para revisión del comité académico.',
  owner: 'Marca 01',
  dueDate: '2026-11-15',
  kind: 'confirmacion',
  status: 'pendiente',
  autoGenerated: false,
  comments: []
},
{
  id: 'rq-005',
  companyId: 'co-001',
  editionId: 'ed-hormobiota-2027',
  title: 'Segundo pago del acuerdo',
  description: 'Saldo pendiente del paquete de patrocinio.',
  owner: 'Marca 01',
  dueDate: '2026-12-01',
  kind: 'pago',
  status: 'pendiente',
  autoGenerated: false,
  comments: []
},
{
  id: 'rq-006',
  companyId: 'co-002',
  editionId: 'ed-hormobiota-2027',
  title: 'Subir pieza gráfica para Ruta Hormobiota',
  description: 'Pieza 1080x1350 para el contenido diario de los 21 días previos.',
  owner: 'Marca 02',
  dueDate: '2026-09-20',
  kind: 'archivo',
  status: 'requiere-cambios',
  autoGenerated: false,
  comments: [
  { id: 'cm-002', author: 'Eventos Médicos LATAM', date: '2026-08-18', text: 'La pieza enviada no cumple el área de seguridad. Reenviar con márgenes.' }]

},
{
  id: 'rq-007',
  companyId: 'co-002',
  editionId: 'ed-hormobiota-2027',
  title: 'Registrar invitados de cortesía',
  description: 'Cargar los asistentes que usarán las entradas incluidas en el paquete.',
  owner: 'Marca 02',
  dueDate: '2027-03-15',
  kind: 'listado',
  status: 'pendiente',
  autoGenerated: false,
  comments: []
},
{
  id: 'rq-008',
  companyId: 'co-004',
  editionId: 'ed-hormobiota-2027',
  title: 'Aprobar propuesta comercial',
  description: 'Propuesta enviada. Pendiente de aprobación interna de la marca.',
  owner: 'Marca 04',
  dueDate: '2026-09-01',
  kind: 'confirmacion',
  status: 'completado',
  autoGenerated: false,
  comments: []
}];


export const companyDocuments: CompanyDocument[] = [
{ id: 'dc-001', companyId: 'co-001', editionId: 'ed-hormobiota-2027', kind: 'propuesta', name: 'Propuesta de patrocinio.pdf', status: 'aprobado', date: '2026-06-12', sizeLabel: '1.2 MB' },
{ id: 'dc-002', companyId: 'co-001', editionId: 'ed-hormobiota-2027', kind: 'contrato', name: 'Contrato de patrocinio.pdf', status: 'firmado', date: '2026-07-02', sizeLabel: '840 KB' },
{ id: 'dc-003', companyId: 'co-001', editionId: 'ed-hormobiota-2027', kind: 'orden', name: 'Orden de servicio.pdf', status: 'enviado', date: '2026-07-05', sizeLabel: '320 KB' },
{ id: 'dc-004', companyId: 'co-001', editionId: 'ed-hormobiota-2027', kind: 'factura', name: 'Factura primer pago.pdf', status: 'aprobado', date: '2026-07-20', sizeLabel: '210 KB' },
{ id: 'dc-005', companyId: 'co-003', editionId: 'ed-hormobiota-2027', kind: 'contrato', name: 'Contrato de patrocinio.pdf', status: 'firma-solicitada', date: '2026-08-19', sizeLabel: '840 KB' },
{ id: 'dc-006', companyId: 'co-002', editionId: 'ed-hormobiota-2027', kind: 'contrato', name: 'Contrato de patrocinio.pdf', status: 'firmado', date: '2026-07-28', sizeLabel: '830 KB' },
{ id: 'dc-007', companyId: 'co-002', editionId: 'ed-hormobiota-2027', kind: 'fiscal', name: 'RUT.pdf', status: 'aprobado', date: '2026-07-28', sizeLabel: '96 KB' }];


export const companyPayments: CompanyPayment[] = [
{ id: 'pm-001', companyId: 'co-001', editionId: 'ed-hormobiota-2027', concept: 'Primer pago (50%)', amount: 9_750_000, dueDate: '2026-07-20', status: 'pagado', paidAt: '2026-07-19' },
{ id: 'pm-002', companyId: 'co-001', editionId: 'ed-hormobiota-2027', concept: 'Segundo pago (50%)', amount: 9_750_000, dueDate: '2026-12-01', status: 'pendiente' },
{ id: 'pm-003', companyId: 'co-002', editionId: 'ed-hormobiota-2027', concept: 'Pago único', amount: 8_900_000, dueDate: '2026-08-01', status: 'pagado', paidAt: '2026-07-30' },
{ id: 'pm-004', companyId: 'co-003', editionId: 'ed-hormobiota-2027', concept: 'Primer pago (50%)', amount: 4_450_000, dueDate: '2026-09-15', status: 'pendiente' },
{ id: 'pm-005', companyId: 'co-005', editionId: 'ed-hormobiota-2027', concept: 'Segundo pago (50%)', amount: 1_600_000, dueDate: '2026-08-10', status: 'vencido' }];


export const activityLog: ActivityEntry[] = [
{ id: 'ac-001', companyId: 'co-003', editionId: 'ed-hormobiota-2027', date: '2026-08-20', actor: 'Sistema', action: 'Requerimiento creado', comment: 'Logo SVG faltante para el banner de patrocinadores.' },
{ id: 'ac-002', companyId: 'co-003', editionId: 'ed-hormobiota-2027', date: '2026-08-19', actor: 'Eventos Médicos LATAM', action: 'Contrato enviado', comment: 'Se solicitó firma del contrato de patrocinio.' },
{ id: 'ac-003', companyId: 'co-002', editionId: 'ed-hormobiota-2027', date: '2026-08-18', actor: 'Eventos Médicos LATAM', action: 'Pieza rechazada', comment: 'La pieza gráfica requiere ajuste de márgenes.' },
{ id: 'ac-004', companyId: 'co-001', editionId: 'ed-hormobiota-2027', date: '2026-08-14', actor: 'Marca 01', action: 'Archivo cargado', comment: 'Manual de marca actualizado.' },
{ id: 'ac-005', companyId: 'co-001', editionId: 'ed-hormobiota-2027', date: '2026-07-19', actor: 'Eventos Médicos LATAM', action: 'Pago registrado', comment: 'Primer pago confirmado.' },
{ id: 'ac-006', companyId: 'co-001', editionId: 'ed-hormobiota-2027', date: '2026-07-05', actor: 'Eventos Médicos LATAM', action: 'Stand asignado', comment: 'Stand 01, frente a acceso principal.' }];


export function getCompany(id: string): Company | undefined {
  return companies.find((company) => company.id === id);
}

export function participationsByCompany(companyId: string): Participation[] {
  return participations.filter((participation) => participation.companyId === companyId);
}

export function participationsByEdition(editionId: string): Participation[] {
  return participations.filter((participation) => participation.editionId === editionId);
}

export function requirementsByCompany(companyId: string): Requirement[] {
  return requirements.filter((requirement) => requirement.companyId === companyId);
}

export function openRequirements(companyId: string): Requirement[] {
  return requirementsByCompany(companyId).filter(
    (requirement) => requirement.status !== 'completado' && requirement.status !== 'aprobado'
  );
}

/** Empresa autenticada en el Portal (demo). */
export const portalCompanyId = 'co-001';