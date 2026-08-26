-- =========================================================
-- El formulario de registro de patrocinio ahora pide país y
-- ciudad de la empresa (formulario formal de registro de empresa).
-- =========================================================

alter table plan_requests
  add column country text null,
  add column city text null;
