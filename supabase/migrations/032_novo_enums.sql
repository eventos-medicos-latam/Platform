-- =========================================================
-- NOVO ARCHITECTURE — Enumeraciones universales
-- No borra nada del schema legacy; coexiste con él.
-- CREATE TYPE no admite IF NOT EXISTS en Postgres.
-- =========================================================

DO $$ BEGIN
  CREATE TYPE novo_event_type AS ENUM (
    'congreso', 'webinar', 'masterclass', 'simposio',
    'lanzamiento', 'conversatorio', 'curso', 'otro'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE novo_event_modality AS ENUM (
    'presencial', 'virtual', 'hibrido'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE novo_event_audience AS ENUM (
    'profesionales', 'pacientes', 'ambos', 'general'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE novo_event_operational_status AS ENUM (
    'borrador', 'proximo', 'activo', 'finalizado', 'cancelado', 'archivado'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE novo_event_publication_status AS ENUM (
    'borrador', 'vista-previa', 'publicado', 'oculto'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE novo_identifier_type AS ENUM (
    'email', 'telefono', 'whatsapp', 'documento',
    'auth_user_id', 'ghl_contact_id', 'qr_id', 'hotmart_id', 'otro'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE novo_person_classification AS ENUM (
    'profesional', 'paciente', 'publico-general', 'speaker',
    'colaborador', 'invitado', 'staff-eml', 'comunidad',
    'comprador', 'moderador', 'otro'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE novo_product_category AS ENUM (
    'participacion', 'stand', 'ticket', 'evento-digital',
    'infoproducto', 'servicio-corporativo', 'certificado', 'otro'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE novo_agreement_status AS ENUM (
    'borrador', 'en-negociacion', 'aprobado', 'cerrado', 'cancelado'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE novo_agreement_origin AS ENUM (
    'evento', 'corporativo'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE novo_payment_method AS ENUM (
    'wompi', 'transferencia', 'efectivo', 'manual', 'otro'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE novo_registration_type AS ENUM (
    'compra', 'invitacion', 'cortesia', 'colaborador',
    'sponsor', 'importacion', 'manual'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE novo_registration_origin AS ENUM (
    'web', 'social', 'portal-empresa', 'eml', 'campana',
    'importacion', 'qr', 'otro'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE novo_qr_interaction_rule AS ENUM (
    'una-vez', 'una-vez-dia', 'multiples', 'ilimitado', 'por-actividad'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE novo_system_event_family AS ENUM (
    'auth', 'registro', 'ticket', 'pago', 'factura',
    'waitlist', 'evento', 'post-evento', 'certificado',
    'empresa', 'speaker', 'qr', 'stand', 'cupones'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE novo_stand_unit_status AS ENUM (
    'disponible', 'reservado', 'vendido', 'bloqueado', 'no-disponible'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE novo_platform_role AS ENUM (
    'super-admin', 'admin-operativo', 'asesor-comercial',
    'staff-qr', 'empresa', 'speaker', 'soporte', 'developer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
