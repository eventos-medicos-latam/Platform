-- =========================================================
-- NOVO ARCHITECTURE — Enumeraciones universales
-- No borra nada del schema legacy; coexiste con él.
-- =========================================================

create type if not exists novo_event_type as enum (
  'congreso', 'webinar', 'masterclass', 'simposio',
  'lanzamiento', 'conversatorio', 'curso', 'otro'
);

create type if not exists novo_event_modality as enum (
  'presencial', 'virtual', 'hibrido'
);

create type if not exists novo_event_audience as enum (
  'profesionales', 'pacientes', 'ambos', 'general'
);

create type if not exists novo_event_operational_status as enum (
  'borrador', 'proximo', 'activo', 'finalizado', 'cancelado', 'archivado'
);

create type if not exists novo_event_publication_status as enum (
  'borrador', 'vista-previa', 'publicado', 'oculto'
);

create type if not exists novo_identifier_type as enum (
  'email', 'telefono', 'whatsapp', 'documento',
  'auth_user_id', 'ghl_contact_id', 'qr_id', 'hotmart_id', 'otro'
);

create type if not exists novo_person_classification as enum (
  'profesional', 'paciente', 'publico-general', 'speaker',
  'colaborador', 'invitado', 'staff-eml', 'comunidad',
  'comprador', 'moderador', 'otro'
);

create type if not exists novo_product_category as enum (
  'participacion', 'stand', 'ticket', 'evento-digital',
  'infoproducto', 'servicio-corporativo', 'otro'
);

create type if not exists novo_agreement_status as enum (
  'borrador', 'en-negociacion', 'aprobado', 'cerrado', 'cancelado'
);

create type if not exists novo_agreement_origin as enum (
  'evento', 'corporativo'
);

create type if not exists novo_payment_method as enum (
  'wompi', 'transferencia', 'efectivo', 'manual', 'otro'
);

create type if not exists novo_registration_type as enum (
  'compra', 'invitacion', 'cortesia', 'colaborador',
  'sponsor', 'importacion', 'manual'
);

create type if not exists novo_registration_origin as enum (
  'web', 'social', 'portal-empresa', 'eml', 'campana',
  'importacion', 'qr', 'otro'
);

create type if not exists novo_qr_interaction_rule as enum (
  'una-vez', 'una-vez-dia', 'multiples', 'ilimitado', 'por-actividad'
);

create type if not exists novo_system_event_family as enum (
  'auth', 'registro', 'ticket', 'pago', 'factura',
  'waitlist', 'evento', 'post-evento', 'certificado',
  'empresa', 'speaker', 'qr', 'stand', 'cupones'
);

create type if not exists novo_stand_unit_status as enum (
  'disponible', 'reservado', 'vendido', 'bloqueado', 'no-disponible'
);

create type if not exists novo_platform_role as enum (
  'super-admin', 'admin-operativo', 'asesor-comercial',
  'staff-qr', 'empresa', 'speaker', 'soporte', 'developer'
);
