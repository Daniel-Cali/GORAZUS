# Auth Report — FASE 03, Parte 02 "Autenticación Enterprise"

> Sesión del 2026-07-22, versión **0.4.0**. Cierra la parte de
> "Autenticación Enterprise" pedida — a diferencia de Parte 2.1
> (infraestructura preparatoria, sin tocar login), esta parte SÍ modifica
> comportamiento real de `auth`. Ver `AUTH_TEST_REPORT.md` para el
> detalle de testing, `JWT_CONFIGURATION.md` para cada variable de
> config, `OPENAPI_AUTH.md` para el contrato de cada endpoint,
> `SECURITY_REPORT.md` (actualizado) para el estado de seguridad
> consolidado.

## 1. Punto de partida — qué ya existía antes de esta parte

Login/logout/refresh/2FA/reset de contraseña ya estaban construidos y
endurecidos (FASE 2 Backend Core, `v0.3.0`) — bloqueo por intentos, rate
limit propio, revocación inmediata al logout, CSRF en refresh, 2FA
exigido. Parte 2.1 (`v0.3.1`) preparó (sin adoptar) Value Object `Email`,
Domain Events, JWT Provider, `GuestGuard` y la superficie de config de
TTLs/umbrales. Esta parte adoptó la config/JWT Provider y agregó
funcionalidad nueva real.

## 2. Qué se agregó — funcionalidad

- **`rememberMe`** en `POST /auth/login` — refresh token de larga
  duración (`JWT_REMEMBER_ME_TTL_DAYS`, default 30 días vs. 7 estándar),
  preservado a través de la rotación sin agregar columna nueva
  (`JWT_CONFIGURATION.md §3`).
- **Captura de IP/User-Agent** en `core.sessions` (columnas
  `ip_address`/`user_agent` que ya existían en el schema, sin
  consumidor) al emitir y rotar sesiones.
- **Protección de session-hijacking** en `POST /auth/refresh` — compara
  IP/User-Agent contra lo guardado, siempre registra un warning ante un
  mismatch, rechaza solo si `AUTH_STRICT_SESSION_VALIDATION=true`
  (`JWT_CONFIGURATION.md §4`).
- **Verificación de empresa/sucursal activa** — `OrganizationStatusRepository`
  nuevo, consultado en `POST /auth/refresh` y `GET /auth/session`
  (`JWT_CONFIGURATION.md §5`).
- **`GET /api/v1/auth/me`** — identidad mínima del usuario autenticado
  (`GetCurrentUserUseCase`).
- **`GET /api/v1/auth/session`** — valida sesión más allá de la firma
  JWT: usuario y empresa/sucursal activa siguen activos
  (`ValidateTokenUseCase`).
- **`POST /api/v1/auth/revoke`** — revoca una sesión puntual (con
  `sessionId`, verificando pertenencia) o todas las del usuario sin
  `sessionId` ("cerrar sesión en todos los dispositivos"), marcando cada
  `sessionId` afectado en la blacklist de Redis además de
  `core.sessions.revoked_at` (`RevokeTokenUseCase`).

## 3. Qué se adoptó — config y JWT provider ya preparados en Parte 2.1

- `LoginUseCase`, `RefreshTokenUseCase`, `IssueLoginSessionService` ya
  leen `auth.accessTokenTtl`/`refreshTokenTtlDays`/`loginLockoutThreshold`/
  `loginLockoutWindowMinutes`/`twoFactorChallengeTtlMinutes` desde
  `ConfigService` — antes eran constantes hardcodeadas con el mismo
  valor por default (comportamiento sin cambios, solo la fuente).
- `RefreshTokenUseCase` adoptó `signAccessToken()` (`services/jwt-token.provider.ts`)
  en vez de su `jwt.sign(...)` inline duplicado — mismo firmado, una sola
  implementación.

## 4. Deliberadamente NO implementado — "login por username"

El pedido de esta parte incluye "login por username" además de "login
por username o email". `core.users` **no tiene columna `username`**
(solo `email`, único por `(tenant_id, lower(email))` — ver
`docs/database/sql/01_core.sql`). El modelo de datos está congelado en
`Enterprise v1.0.0` desde 2026-07-21 (`VERSION.md`, "Versionado del
modelo de datos") — agregar una columna nueva a una tabla certificada
requiere una migración versionada (`sql/NN_*.sql`) y una decisión de
producto (¿es obligatorio, único, se puede editar, convive con el email
como alias?) que no corresponde tomar dentro de esta parte de forma
apurada. Login por **email** (con o sin 2FA, con o sin `rememberMe`) ya
cubre "login por username o email" en la práctica actual del sistema —
se documenta el gap explícitamente en vez de rellenarlo con una columna
apurada o ignorarlo en silencio. Queda en `TECHNICAL_DEBT.md §3`.

## 5. Auditoría de login/logout/2FA/bloqueo/revocación — ya cubierta, sin duplicar

Se verificó (no se asumió) que el trigger genérico `fn_audit_log` sobre
`core.sessions`/`core.users` (`docs/database/sql/`) más
`security.login_attempts` (ya escrito por `LoginUseCase` desde FASE 2)
ya registran: creación/revocación de sesión, cambios en `users`
(incluido `password_hash`, que cubre "cambio de contraseña"), e intentos
de login exitosos/fallidos con IP. No se agregó una tabla de auditoría
de aplicación paralela — hubiera duplicado lo que el trigger ya cubre a
nivel de base de datos, mismo criterio que "auditoría (lectura)" ya
señalado en `ROADMAP.md` para `modules/seguridad`. Lo único que este
trigger NO distingue explícitamente es "revocación manual vía
`POST /auth/revoke`" vs. "expiración natural" — ambas quedan como una
fila con `revoked_at`/`updated_at` seteado; distinguir el motivo
requeriría una columna nueva (`revoked_reason`), fuera de alcance de
esta parte, anotado en `TECHNICAL_DEBT.md`.

## 5.1. `POST /auth/revoke` vs. `POST /seguridad/sesiones/:id/revocar` — no es duplicado

`modules/seguridad/backend` ya tenía `POST /seguridad/sesiones/:id/revocar`
desde FASE 02 — administración (permiso `seguridad.gestionar_sesiones`,
cualquier usuario con ese permiso puede revocar la sesión de CUALQUIER
otro usuario, sin chequeo de pertenencia porque es justamente una acción
de terceros). `POST /auth/revoke` (esta parte) es autoservicio: el propio
usuario autenticado revocando su(s) propia(s) sesión(es), con chequeo de
pertenencia. Mismo patrón ya establecido en `CHANGELOG.md` (entrada FASE 02) para `SessionRepository` (resuelve durante login/refresh) vs.
`modules/seguridad/backend/repositories/sesion.repository.ts` (administra
después) — repositorios separados a propósito, nunca importados entre
módulos de negocio.

Se detectó, sin ser parte del alcance de esta parte (pertenece a
`seguridad`, no a `auth`), que `SesionesService.revocar()` (admin) marca
`core.sessions.revoked_at` pero **no** agrega el `sessionId` a la
blacklist de Redis — a diferencia de `LogoutUseCase`/`RevokeTokenUseCase`
(`auth`), un access token ya emitido de la sesión revocada por un admin
sigue sirviendo hasta que expira solo (~15 min), no de inmediato. Gap
real, anotado en `TECHNICAL_DEBT.md §1`, no corregido acá por quedar
fuera del módulo pedido en esta parte.

## 6. Explícitamente fuera de alcance esta parte

- **Frontend**: `login.page.tsx` no se tocó — el schema (`loginSchema`)
  ya acepta `rememberMe` opcional con default `false` (compatible hacia
  atrás), pero agregar el checkbox de "Recordar sesión" a la UI es
  trabajo de frontend no pedido explícitamente por los entregables de
  esta parte (todos backend: reportes + OpenAPI). Se verificó que el
  formulario sigue compilando y funcionando sin cambios (`nx run
auth-frontend:lint` ✅).
- **`Email` (Value Object)** y `GuestGuard` (preparados en Parte 2.1)
  siguen sin adoptar — no eran necesarios para ninguna de las
  funcionalidades pedidas en esta parte.
- **Detección de reuso de refresh token** — gap preexistente
  (`TECHNICAL_DEBT.md §1`), no forma parte del pedido explícito de esta
  parte (que sí pedía "rotación automática", ya implementada desde antes).

## 7. Versión

`0.3.1` → **`0.4.0`** (`MINOR`, no `PATCH`): esta parte agrega
funcionalidad real y cambia comportamiento de endpoints existentes
(no es aditivo/preparatorio como Parte 2.1) — mismo criterio que
`v0.3.0` (Backend Core) recibió `MINOR` por el mismo motivo. `0.4.0`
había quedado "reservado" para Inventario/Productos en una nota anterior
de `VERSION.md` — se corrige esa proyección: Inventario/Productos sigue
siendo el próximo módulo de negocio real pendiente (`ROADMAP.md`), ahora
esperado en `0.5.0`.
