-- Extensiones necesarias
create extension if not exists pgcrypto;

-- =========================================================
-- ENUM types — uno por cada campo enum del modelo TypeScript
-- =========================================================

create type user_role as enum ('admin', 'empresa');

create type edition_status as enum (
  'borrador', 'proximamente', 'prelanzamiento', 'preventa', 'venta-activa',
  'agotado', 'en-curso', 'cerrado', 'post-evento', 'historico'
);

create type modality as enum ('presencial', 'virtual', 'hibrido');

create type publication_status as enum (
  'borrador', 'en-revision', 'aprobado', 'publicado', 'cerrado'
);

create type speaker_status as enum (
  'invitado', 'en-negociacion', 'confirmado', 'cancelado', 'publicado'
);

create type edition_section as enum (
  'hero', 'concepto', 'ejes', 'publico', 'agenda', 'speakers', 'beneficios',
  'modalidades', 'tickets', 'certificacion', 'patrocinadores', 'aliados',
  'stands', 'ubicacion', 'faq', 'cta', 'galeria', 'memorias', 'resultados'
);

create type track_icon as enum ('gut', 'hormone', 'immune', 'sleep', 'cell', 'skin');

create type agenda_type as enum (
  'registro', 'conferencia', 'keynote', 'panel', 'mesa-redonda', 'workshop',
  'break', 'almuerzo', 'networking', 'coctel', 'activacion', 'cierre'
);

create type ticket_kind as enum (
  'preventa', 'general', 'vip', 'estudiante', 'grupo', 'invitado', 'cortesia', 'patrocinador'
);

create type stand_status as enum (
  'disponible', 'reservado', 'vendido', 'bloqueado', 'no-disponible'
);

create type plan_feature_kind as enum ('acceso', 'tarima', 'servicio', 'circulacion');

create type banner_surface as enum ('evento', 'corporativo', 'contenido');

create type banner_tier as enum ('principal', 'destacado', 'apoyo');

create type payment_status as enum (
  'pending', 'approved', 'declined', 'failed', 'expired', 'cancelled', 'refunded'
);

create type qr_status as enum ('active', 'used', 'cancelled', 'invalid');

create type company_role as enum (
  'patrocinador', 'expositor', 'aliado-comercial', 'marca', 'sociedad-medica',
  'aliado-academico', 'aliado-institucional', 'certificador', 'organizador', 'media-partner'
);

create type participation_status as enum (
  'en-negociacion', 'aprobado', 'publicado', 'cerrado', 'cancelado'
);

create type requirement_status as enum (
  'pendiente', 'en-proceso', 'en-revision', 'requiere-cambios', 'aprobado', 'completado'
);

create type requirement_kind as enum (
  'archivo', 'formulario', 'firma', 'pago', 'confirmacion', 'listado'
);

create type brand_asset_kind as enum (
  'logo-png', 'logo-svg', 'manual', 'fotografia', 'video', 'producto', 'publicidad'
);

create type brand_asset_status as enum (
  'pendiente', 'cargado', 'aprobado', 'requiere-cambios'
);

create type company_document_kind as enum (
  'propuesta', 'contrato', 'orden', 'certificado', 'factura', 'fiscal', 'manual', 'acuerdo', 'otro'
);

create type company_document_status as enum (
  'pendiente', 'enviado', 'firma-solicitada', 'firmado', 'aprobado'
);

create type company_payment_status as enum ('pendiente', 'pagado', 'vencido');

create type plan_id_enum as enum ('pop-up', 'conexion', 'protagonista');

create type plan_space_kind as enum ('estacion', 'stand');

create type bridge_sponsorship_status as enum ('disponible', 'reservado', 'confirmado');

create type speaker_choice as enum ('propio', 'propuesta', 'acompanamiento');

create type plan_request_status as enum ('nueva', 'en-conversacion', 'aprobada', 'descartada');

create type staff_accreditation_status as enum ('pendiente', 'acreditado');

create type guest_status as enum ('invitado', 'registrado', 'asistio');

create type content_kind as enum (
  'articulo', 'noticia', 'video', 'entrevista', 'memoria', 'recurso', 'resumen'
);

create type secondary_event_kind as enum (
  'webinar', 'conversatorio', 'masterclass', 'curso', 'lanzamiento'
);

create type seo_schema_type as enum ('Event', 'Organization', 'Article', 'WebPage');

create type legacy_event_status as enum ('realizado', 'proximo');

create type info_product_kind as enum ('curso', 'memorias', 'guia', 'plantilla', 'membresia');

create type product_format as enum ('video', 'pdf', 'mixto', 'acceso');

create type launch_stage as enum (
  'investigacion', 'formulacion', 'registro-sanitario', 'preventa'
);
