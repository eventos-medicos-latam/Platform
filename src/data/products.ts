import type { InfoProduct, UpcomingProduct } from '../types/product';

/** Tienda de productos digitales. Los precios sin aprobar quedan en PENDIENTE. */
export const infoProducts: InfoProduct[] = [
{
  id: 'ip-memorias-hb1',
  name: 'Memorias Hormobiota 2026',
  kind: 'memorias',
  format: 'mixto',
  claim: 'Las 14 conferencias de la primera edición, con material de apoyo',
  description:
  'Acceso completo a las grabaciones de la primera edición, presentaciones de los speakers y documento de conclusiones del comité académico.',
  price: 189000,
  vatRate: 0.19,
  volumeLabel: '14 conferencias · 11 h',
  includes: [
  'Grabaciones en calidad completa',
  'Presentaciones descargables',
  'Documento de conclusiones',
  'Acceso por 12 meses'],

  relatedEditionId: 'ed-hormobiota-2026',
  status: 'publicado',
  featured: true
},
{
  id: 'ip-curso-microbiota',
  name: 'Microbiota aplicada a la consulta',
  kind: 'curso',
  format: 'video',
  claim: 'Curso corto para traducir la evidencia a decisiones clínicas',
  description:
  'Seis módulos que recorren la interpretación de estudios de microbiota y su aplicación en decisiones de consulta, con casos comentados.',
  price: 320000,
  vatRate: 0.19,
  volumeLabel: '6 módulos · 4 h',
  includes: [
  'Seis módulos en video',
  'Casos clínicos comentados',
  'Certificado de participación',
  'Acceso por 12 meses'],

  trackId: 'puente-1',
  status: 'publicado',
  featured: true
},
{
  id: 'ip-guia-biomarcadores',
  name: 'Guía de biomarcadores de longevidad',
  kind: 'guia',
  format: 'pdf',
  claim: 'Referencia rápida de interpretación, en una sola pieza',
  description:
  'Documento de consulta con los biomarcadores más usados, rangos de referencia y criterios de interpretación en el contexto de longevidad.',
  price: 89000,
  vatRate: 0.19,
  volumeLabel: '48 páginas',
  includes: ['PDF de alta resolución', 'Tabla de rangos imprimible', 'Actualizaciones incluidas'],
  trackId: 'puente-5',
  status: 'publicado'
},
{
  id: 'ip-membresia',
  name: 'Membresía Comunidad Hormobiota',
  kind: 'membresia',
  format: 'acceso',
  claim: 'Todo el contenido, las sesiones en vivo y preventa en los congresos',
  description:
  'Acceso anual a la biblioteca completa, a todas las sesiones en línea con material descargable y a la preventa de cada edición.',
  price: null,
  vatRate: 0.19,
  volumeLabel: 'Acceso anual',
  includes: [
  'Biblioteca completa de memorias',
  'Sesiones en vivo con material',
  'Preventa en cada congreso',
  'Comunidad privada'],

  status: 'aprobado'
},
{
  id: 'ip-plantillas-consulta',
  name: 'Protocolos de consulta integrativa',
  kind: 'plantilla',
  format: 'pdf',
  claim: 'Formatos listos para estructurar la primera consulta',
  description:
  'Conjunto de formatos editables para anamnesis, seguimiento y plan de intervención en consulta integrativa.',
  price: 129000,
  vatRate: 0.19,
  volumeLabel: '9 formatos',
  includes: ['Formatos editables', 'Guía de uso', 'Ejemplos diligenciados'],
  status: 'publicado'
}];


export function publicInfoProducts(): InfoProduct[] {
  return infoProducts.filter((item) => item.status === 'publicado' || item.status === 'aprobado');
}

/** Producto físico en desarrollo: se comunica como próximamente con lista de pioneros. */
export const upcomingProduct: UpcomingProduct = {
  id: 'up-hormobiota-formula',
  name: 'Hormobiota Fórmula',
  category: 'Suplemento de vitaminas y soporte hormonal',
  claim: 'La ciencia del congreso, ahora en una fórmula',
  description: [
  'Un suplemento desarrollado desde el mismo marco académico que sostiene Hormobiota: la relación entre microbiota, señal hormonal y longevidad celular.',
  'La formulación está en desarrollo junto al comité científico. No se publica composición ni claim clínico hasta que el respaldo esté completo y el registro sanitario en trámite.'],

  pillars: [
  {
    id: 'pl-1',
    title: 'Eje intestino-hormona',
    description:
    'Soporte del terreno intestinal como punto de partida de la señal endocrina.',
    icon: 'gut'
  },
  {
    id: 'pl-2',
    title: 'Micronutrientes clave',
    description: 'Vitaminas y minerales con función documentada en la regulación hormonal.',
    icon: 'hormone'
  },
  {
    id: 'pl-3',
    title: 'Longevidad celular',
    description: 'Componentes orientados a la función mitocondrial y al estrés oxidativo.',
    icon: 'cell'
  }],

  stage: 'formulacion',
  launchWindow: 'PENDIENTE',
  pioneers: 214,
  status: 'publicado'
};

export const launchStageLabels: Record<UpcomingProduct['stage'], string> = {
  investigacion: 'Investigación',
  formulacion: 'Formulación',
  'registro-sanitario': 'Registro sanitario',
  preventa: 'Preventa'
};

export const launchStages: UpcomingProduct['stage'][] = [
'investigacion',
'formulacion',
'registro-sanitario',
'preventa'];