# Security Report — GORAZUS ERP

> Actualizado FASE 03 — Backend Core Enterprise, Parte 02 (Autenticación
> Enterprise). Sesión del 2026-07-22, versión **0.4.0**. Estado ACTUAL
> completo de seguridad — no solo lo nuevo de una sesión puntual (para
> eso ver `CHANGELOG.md`/`AUTH_REPORT.md`). Reemplaza como fuente de
> verdad al `SECURITY_REPORT.md` anterior (sesión de auditoría Parte 01,
> 2026-07-23).

## 1. Autenticación

| Control                                 | Estado | Detalle                                                                                                                                          |
| --------------------------------------- | :----: | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hashing de contraseña                   |   ✅   | Argon2id (`packages/tooling/utils/hash.ts`)                                                                                                      |
| JWT de acceso                           |   ✅   | TTL configurable (`JWT_ACCESS_TTL`, default 15 min), firmado con `JWT_ACCESS_SECRET`, sin roles/permisos embebidos                               |
| Refresh token                           |   ✅   | Aleatorio 256 bits (no JWT), hash SHA-256 en `core.sessions`, rotación en cada uso, TTL largo opcional ("recordar sesión")                       |
| Revocación inmediata al logout          |   ✅   | `sessionId` marcado revocado en Redis, consultado por `JwtStrategy` en cada request                                                              |
| Revocación puntual/masiva bajo demanda  |   ✅   | `POST /auth/revoke` (nuevo, Parte 02) — una sesión con `sessionId`, o todas ("cerrar sesión en todos los dispositivos")                          |
| Bloqueo por intentos fallidos           |   ✅   | Umbral/ventana configurables (`LOGIN_LOCKOUT_THRESHOLD`/`_WINDOW_MINUTES`, default 5/15min) por (tenant, email), `security.login_attempts`       |
| Rate limit propio en login              |   ✅   | 5 req/60s en `/auth/login` y `/auth/login/2fa` (global: 100/60s)                                                                                 |
| 2FA (TOTP)                              |   ✅   | RFC 6238, exigido en login si está confirmado, secreto cifrado AES-256-GCM en reposo                                                             |
| CSRF                                    |   ✅   | `/auth/refresh` (único endpoint cookie-only): `SameSite=Strict` + chequeo de `Origin`                                                            |
| Protección de session-hijacking (IP/UA) |   ✅   | Nuevo, Parte 02 — warning siempre; rechazo opcional vía `AUTH_STRICT_SESSION_VALIDATION` (default `false`), ver `JWT_CONFIGURATION.md §4`        |
| Verificación de empresa/sucursal activa |   ✅   | Nuevo, Parte 02 — `POST /auth/refresh` y `GET /auth/session`, ver `JWT_CONFIGURATION.md §5`                                                      |
| Login por username                      |   ❌   | `core.users` no tiene columna `username` (modelo de datos congelado) — gap documentado deliberadamente, no implementado. Ver `AUTH_REPORT.md §4` |
| Detección de reuso de refresh token     |   ❌   | Gap conocido, documentado en el propio código — ver `TECHNICAL_DEBT.md §1`                                                                       |
| MFA más allá de TOTP (WebAuthn, etc.)   |   ❌   | Sin diseño ni pedido todavía                                                                                                                     |

## 2. Autorización (RBAC)

`PermissionsGuard` global, **fail-closed** por diseño: sin resolver
registrado, deniega todo. `seguridad` registra el resolver real
(`PermissionsResolverService`) que resuelve rol→permiso contra la base de
datos (sin cache Redis todavía — cada request hace la consulta). Roles y
permisos administrables vía API (`/seguridad/roles`, con asignación de
permisos y de roles a usuarios).

## 3. Multiempresa / aislamiento de datos

- **RLS forzado** en 500/501 tablas (`core.restore_test_logs` es la única
  excepción, plausiblemente intencional — tabla de infraestructura de
  backup).
- `app.current_tenant_id`/`app.current_company_ids` seteados vía
  `withTenantScope` en cada operación de repositorio — nunca un `WHERE
tenant_id = ...` manual en código de aplicación (estructuralmente
  imposible de "olvidar").
- **Archivos** (`core/storage`): aislamiento a nivel de bucket
  (`archivos-<tenantId>`), no de fila — MinIO no tiene RLS, este es el
  equivalente funcional.
- 🟡 185 FK reales cruzan schemas de módulos de negocio distintos — ver
  `TECHNICAL_DEBT.md §2`, requiere decisión de negocio, no es una fuga de
  datos (las FK son válidas, solo contradicen la regla de diseño de "ID
  suelto").

## 4. Superficie HTTP

- `helmet()` — headers de seguridad estándar.
- CORS con origen exacto (`CORS_ORIGIN`), nunca `*` — necesario porque la
  cookie de refresh viaja con `credentials: true`.
- `trust proxy` configurado (`app.set('trust proxy', 1)`) — `req.ip`
  refleja al cliente real detrás de nginx, no la IP interna del proxy
  (afecta directamente la precisión del rate limiting).
- Validación de entrada: Zod en el 100% de los endpoints que reciben
  body — nunca `class-validator`.
- SQL injection: Prisma parametrizado en toda la capa de aplicación, sin
  SQL crudo con interpolación de strings.

## 5. Archivos subidos (`core/storage`)

- Límite de tamaño: 25MB (`multer`).
- Sanitización de nombre de archivo antes de convertirse en object key
  (colapsa secuencias de `..`, quita `/` y caracteres fuera de
  alfanumérico/`.`/`-`/`_`).
- URLs de descarga siempre firmadas de corta duración (~5 min) — nunca
  credenciales de MinIO expuestas al cliente.
- Protegido por `JwtAuthGuard` global (sin `@Public()`).

## 6. Dependencias — `pnpm audit`, refrescado esta sesión

**39 vulnerabilidades** (1 crítica, 19 altas, 18 moderadas, 1 baja) —
mismo número que al cierre de la sesión anterior (sin drift). Todas en
dependencias transitivas de tooling/observabilidad (Vitest UI server,
minimatch/picomatch ReDoS en build tooling, exporters de OpenTelemetry,
js-yaml vía `@nestjs/swagger`) — **ninguna en una dependencia directa de
runtime de negocio**. `security.yml` corre `pnpm audit` sin bloquear el
merge (`|| true`) hasta que se resuelva con tiempo dedicado de
regresión. Detalle completo y por qué no se tocan ahora:
`TECHNICAL_DEBT.md §1`.

## 7. Secretos

`.env` gitignored y confirmado no trackeado por git. `.env.example` sin
valores reales. Claves de cifrado (`SEGURIDAD_ENCRYPTION_KEY`,
`NOTIFICATIONS_ENCRYPTION_KEY`) — una por feature, sin rotación
automática todavía (rotación es trabajo de una fase futura, ya
documentado antes de esta sesión).

## 8. No evaluado esta sesión

- Pentesting real / escaneo activo contra la API corriendo, incluidos los
  3 endpoints nuevos de Parte 02 (`GET /auth/me`, `GET /auth/session`,
  `POST /auth/revoke`) — Docker no disponible durante toda la sesión, ver
  `AUTH_TEST_REPORT.md §3`.
- Auditoría de código de terceros más allá de `pnpm audit` (ej. análisis
  estático de la cadena de suministro) — sin dependencias nuevas esta
  parte, conteo de `pnpm audit` sin cambios.
- Tasa real de falsos positivos de la protección de session-hijacking
  (IP/User-Agent) en tráfico real — es la razón por la que
  `AUTH_STRICT_SESSION_VALIDATION` queda en `false` por default, ver
  `JWT_CONFIGURATION.md §4`.
