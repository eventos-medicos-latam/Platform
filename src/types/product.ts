import type { PublicationStatus } from './content';

export type InfoProductKind = 'curso' | 'memorias' | 'guia' | 'plantilla' | 'membresia';

export type ProductFormat = 'video' | 'pdf' | 'mixto' | 'acceso';

export interface InfoProduct {
  id: string;
  name: string;
  kind: InfoProductKind;
  format: ProductFormat;
  /** Resumen comercial de una línea. */
  claim: string;
  description: string;
  /** Precio antes de IVA. null cuando aún no está aprobado. */
  price: number | null;
  vatRate: number;
  /** Duración o volumen del contenido. */
  volumeLabel: string;
  includes: string[];
  relatedEditionId?: string;
  trackId?: string;
  status: PublicationStatus;
  featured?: boolean;
}

export type LaunchStage = 'investigacion' | 'formulacion' | 'registro-sanitario' | 'preventa';

export interface UpcomingProduct {
  id: string;
  name: string;
  category: string;
  claim: string;
  description: string[];
  /** Beneficios comunicados con respaldo académico. */
  pillars: {id: string;title: string;description: string;icon: string;}[];
  stage: LaunchStage;
  /** Ventana estimada de lanzamiento. PENDIENTE mientras no esté confirmada. */
  launchWindow: string;
  /** Personas ya inscritas en la lista de pioneros. */
  pioneers: number;
  status: PublicationStatus;
}