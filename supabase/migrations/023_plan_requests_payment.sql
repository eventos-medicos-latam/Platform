-- =========================================================
-- Pago opcional con Wompi para solicitudes de patrocinio: quien
-- prefiera pagar de una vez en vez de esperar la negociación puede
-- hacerlo desde el mismo modal de registro. Mismo patrón ya usado
-- en company_payments (018) y registrations (016).
-- =========================================================

alter table plan_requests
  add column wompi_reference text unique null,
  add column wompi_transaction_id text null,
  add column paid_at timestamptz null;
