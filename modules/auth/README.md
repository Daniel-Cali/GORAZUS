# auth

**Propósito:** autenticación (login, refresh de sesión, 2FA, cambio de
contexto Empresa/Sucursal). Puerta de entrada del sistema — no tiene menú
de navegación propio (su contraparte visible en el sidebar es `Seguridad`,
ver `docs/menus/00-convenciones.md §6`).

**Dueño de datos:** usuarios, sesiones, tokens (schema `core` en Postgres —
ver `docs/architecture/13-modulo-auth.md §0` para el porqué de la excepción
de propiedad: `auth` administra `core.users`/`core.sessions`/`core.tokens`,
que no le pertenecen exclusivamente), más lectura propia de
`security.login_attempts`/`security.two_factor_credentials` (schema
`security`, compartido con `seguridad` — cada módulo con su propio
repositorio sobre el mismo cliente Prisma, nunca importándose entre sí).

**Estado:** `backend/` real e implementado — login con bloqueo por
intentos fallidos, JWT de acceso + refresh rotativo, revocación de sesión
en logout, 2FA (TOTP) exigido cuando está confirmado, recuperación de
contraseña por email real (SMTP), protección CSRF en el endpoint de
refresh. Ver [AUTH_ARCHITECTURE.md](../../docs/reports/auth/AUTH_ARCHITECTURE.md)
(docs/reports/auth/) para el resumen de arquitectura, `docs/architecture/13-modulo-auth.md`
para el diseño original detallado, y `CHANGELOG.md` para el historial real
de qué se construyó en qué sesión. `frontend/` sigue expuesto en `/login`
(`modules/auth/frontend/routes/auth.routes.tsx`) — no actualizado esta
sesión, solo pedía infraestructura de backend.

**Dependencias declaradas:** ninguna (no importa `index.ts` de otro
módulo) — sí depende de `core/*` (config/http/cache/database), permitido
por `depConstraints` (`eslint.config.mjs`).
