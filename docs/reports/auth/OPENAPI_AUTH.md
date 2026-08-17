# OpenAPI — `auth` (referencia legible)

> Entregable FASE 03, Parte 02 (Autenticación Enterprise, 2026-07-22).
> Documentación legible de los 9 endpoints de `auth`, basada en el código
> real (`controllers/auth.controller.ts`, `dto/login-response.dto.ts`,
> `validators/*.schema.ts`). **No reemplaza** a `docs/api/openapi.json`
> (el spec OpenAPI 3 real, auto-generado desde los decoradores
> `@nestjs/swagger` al bootear la app) — ese archivo requiere Docker
> arriba (Postgres) para regenerarse por un boot real de `apps/api`, no
> disponible en el momento de escribir este documento (ver
> `AUTH_TEST_REPORT.md §3`). Los 6 endpoints previos a esta parte ya
> están en `docs/api/openapi.json`; los 3 nuevos (`GET /auth/me`,
> `GET /auth/session`, `POST /auth/revoke`) tienen los mismos decoradores
> `@ApiOperation`/`@ApiResponse`/`@ApiBearerAuth` ya en el código,
> listos para aparecer solos la próxima vez que la app bootee con acceso
> a la base — este documento cubre ese hueco temporal a mano.

Todas las respuestas exitosas usan el envelope `{ data: ... }`; los
errores usan `{ error: { code, message, details } }` (`ExceptionFilter`
global, `core/http`).

## `POST /api/v1/auth/login`

- **Público** (`@Public()`), rate limit propio 5 req/60s.
- Body: `{ tenantSlug, email, password, rememberMe?: boolean }` (Zod,
  `loginSchema`).
- 200 sin 2FA: `{ data: { accessToken, user: { id, name, email },
activeCompanyId, activeBranchId } }` + cookie `refreshToken` (httpOnly).
- 200 con 2FA confirmado (sin tokens todavía): `{ data: {
requiresTwoFactor: true, challengeToken } }`.
- 401 `CREDENCIALES_INVALIDAS` — tenant/email/password incorrectos (mismo
  mensaje para los tres, evita enumeración).
- 429 `CUENTA_BLOQUEADA` — 5+ fallos en 15 min (config), o límite de
  requests del endpoint excedido.

## `POST /api/v1/auth/login/2fa`

- **Público**, rate limit propio 5 req/60s.
- Body: `{ challengeToken, code }` (`twoFactorLoginSchema`).
- 200: mismo shape que login sin 2FA.
- 400 `CODIGO_DOS_FACTORES_INVALIDO` — código TOTP incorrecto
  (`challengeToken` sigue vivo, se puede reintentar).
- 401 `DESAFIO_DOS_FACTORES_INVALIDO` — token inexistente/expirado
  (~5 min) o de un solo uso ya consumido.

## `POST /api/v1/auth/refresh`

- **Público** (autenticado solo por cookie, no por Bearer).
- Sin body — lee la cookie `refreshToken`.
- 200: `{ data: { accessToken } }` + rota la cookie `refreshToken`.
- 401 `SESION_INVALIDA` — sin cookie, o sesión inexistente/revocada/expirada.
- 401 `SESION_SOSPECHOSA` — solo si `AUTH_STRICT_SESSION_VALIDATION=true`
  y la IP/User-Agent no coincide con la de la sesión.
- 403 — Origin no permitido (CSRF), o `EMPRESA_INACTIVA`/
  `SUCURSAL_INACTIVA` (la empresa/sucursal activa de la sesión ya no está
  activa).

## `POST /api/v1/auth/logout`

- **Requiere Bearer** (`@ApiBearerAuth()`).
- Sin body.
- 204 — revoca la sesión actual (`core.sessions.revoked_at` + blacklist
  del `sessionId` en Redis, el access token deja de servir de inmediato).

## `GET /api/v1/auth/me` — nuevo, Parte 02

- **Requiere Bearer**.
- Identidad mínima del usuario autenticado — sin roles/permisos ni
  perfil editable (eso es `GET /seguridad/usuarios/me`).
- 200: `{ data: { id, email, fullName, isActive, lastLoginAt,
tenantId, activeCompanyId, activeBranchId } }`.
- 404 `USUARIO_NO_ENCONTRADO` — el usuario de la sesión ya no existe
  (borrado entre la emisión del token y este request).

## `GET /api/v1/auth/session` — nuevo, Parte 02

- **Requiere Bearer**.
- Verifica, más allá de la firma/expiración del JWT (ya validada por
  `JwtStrategy` para llegar hasta acá), que el usuario y la
  empresa/sucursal activas de la sesión sigan activos.
- 200: `{ data: { valid: true, userId, tenantId, sessionId,
activeCompanyId, activeBranchId } }`.
- 403 `USUARIO_INACTIVO` / `EMPRESA_INACTIVA` / `SUCURSAL_INACTIVA`.

## `POST /api/v1/auth/revoke` — nuevo, Parte 02

- **Requiere Bearer**.
- Body opcional: `{ sessionId?: string }` (UUID) — con `sessionId`,
  revoca solo esa sesión (debe pertenecer al usuario autenticado); sin
  `sessionId`, revoca **todas** las sesiones activas del usuario
  ("cerrar sesión en todos los dispositivos"). En ambos casos, además de
  `core.sessions.revoked_at`, marca cada `sessionId` afectado en la
  blacklist de Redis — el/los access token(s) ya emitidos dejan de servir
  de inmediato, no recién cuando expiren solos (~15 min).
- 200: `{ data: { revokedSessions: number } }` (0 si la sesión indicada
  ya estaba revocada).
- 404 `SESION_NO_ENCONTRADA` — `sessionId` inexistente o de otro usuario
  (mismo mensaje para ambos casos, sin enumeración).

## `POST /api/v1/auth/forgot-password`

- **Público**. Body: `{ tenantSlug, email }`.
- 200 siempre (evita enumeración) — el token real se entrega por email
  (SMTP real, `EmailPasswordResetNotifier`), nunca en la respuesta HTTP.

## `POST /api/v1/auth/reset-password`

- **Público**. Body: `{ tenantSlug, token, newPassword }`.
- 200 — actualiza la contraseña y revoca todas las sesiones activas del
  usuario (`SessionRepository.revokeAllForUser`).
- 400 — token inválido, ya usado, o expirado.
