-- Extiende company_payments para poder cobrarse por Wompi desde el Portal
-- (además de pagos manuales por transferencia/efectivo registrados por el admin).

alter table company_payments
  add column wompi_reference text unique null,
  add column wompi_transaction_id text null,
  add column payment_method text null, -- 'wompi' | 'transferencia' | 'efectivo' | 'otro'
  add column paid_reference text null; -- nota/comprobante para pagos manuales
