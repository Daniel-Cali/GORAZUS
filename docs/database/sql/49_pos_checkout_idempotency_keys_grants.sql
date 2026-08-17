-- Hotfix (mismo root cause que 36_crm_customer_completion.sql §6): las
-- tablas nuevas no heredan el GRANT masivo por schema — no hay
-- `ALTER DEFAULT PRIVILEGES` configurado para ningún schema del proyecto.
-- Sin esto, `gorazus_app` (el rol de runtime de la API) recibe
-- "permission denied for table pos_checkout_idempotency_keys" en el primer
-- INSERT real — confirmado contra Postgres real al validar P0-1
-- (48_pos_checkout_idempotency_keys.sql), no una suposición.
--
-- Hallazgo relacionado, NO corregido acá (fuera de alcance de este fix):
-- 45_movement_idempotency_keys.sql (el precedente de ISSUE-07/Inventario
-- que este archivo sigue) tiene el mismo problema — nunca tuvo su propio
-- GRANT y, por lo visto en su historial, tampoco se validó contra
-- Postgres real todavía. Documentado para que se corrija junto con esa
-- migración, no mezclado acá.

GRANT SELECT, INSERT, UPDATE, DELETE ON sales.pos_checkout_idempotency_keys TO gorazus_app;
GRANT SELECT ON sales.pos_checkout_idempotency_keys TO gorazus_readonly;
GRANT ALL ON sales.pos_checkout_idempotency_keys TO gorazus_migrator;
