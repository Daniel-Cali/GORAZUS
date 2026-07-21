# MailHog — captura de correo en desarrollo

Solo para `local`/dev (no existe en `docker-compose.prod.yml` ni en
staging/production) — captura cualquier correo saliente de `apps/api`
sin enviarlo de verdad, con UI web para inspeccionarlo. Útil para
probar flujos que disparan `Notification Center`
([docs/architecture/32-core-platform/06 §4](../../docs/architecture/32-core-platform/06-eventos-y-mensajeria.md#4-notification-center))
sin depender de un proveedor SMTP real ni de credenciales.

Sin persistencia intencional — los correos capturados son
descartables entre reinicios del contenedor, igual criterio que
cualquier dato de prueba en `local`.
