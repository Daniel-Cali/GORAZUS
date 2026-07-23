# JWT & Session Configuration — `auth`

> Entregable FASE 03, Parte 02 (Autenticación Enterprise, 2026-07-22).
> Fuente de verdad de cada variable que controla la emisión/rotación/
> validación de tokens. Ver `core/config/namespaces/auth.config.ts` (la
> implementación) y `core/config/env.schema.ts` (la validación fail-fast
> al boot) — este documento es la referencia legible, no una copia
> divergente.

## 1. Tokens — dos mecanismos distintos

|                | Access token                                                                                                                                         | Refresh token                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Formato        | JWT (firmado, `JWT_ACCESS_SECRET`)                                                                                                                   | Aleatorio de 256 bits, hex — **no** es un JWT                                                                |
| Vida           | Corta (`JWT_ACCESS_TTL`, default `15m`)                                                                                                              | Larga (`JWT_REFRESH_TTL_DAYS`/`JWT_REMEMBER_ME_TTL_DAYS`)                                                    |
| Dónde viaja    | Header `Authorization: Bearer <token>`                                                                                                               | Cookie `httpOnly` (`refreshToken`), nunca en el body de la respuesta                                         |
| Contenido      | `sub`, `tenantId`, `companyId`, `branchId`, `sessionId` — **sin roles/permisos** (revocar un permiso no puede depender de que expire un token viejo) | Ninguno — es un secreto opaco, el servidor solo guarda su hash SHA-256 en `core.sessions.refresh_token_hash` |
| Revocación     | Vía blacklist en Redis por `sessionId` (`revokedSessionCacheKey`), TTL igual al TTL del access token                                                 | Vía `core.sessions.revoked_at`                                                                               |
| Verificado por | `JwtStrategy` (`core/http`) en cada request autenticado                                                                                              | `RefreshTokenUseCase`, solo en `POST /auth/refresh`                                                          |

`JWT_REFRESH_SECRET` sigue existiendo en el schema de entorno por motivos
históricos/reserva, pero el refresh token real nunca se firma como JWT —
ver `AUTH_FLOW.md §2`.

## 2. Variables — referencia completa

| Variable                           | Default       | Namespace (`auth.*`)           | Consumido por                                                                                           |
| ---------------------------------- | ------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `JWT_ACCESS_SECRET`                | — (requerida) | `jwtAccessSecret`              | `IssueLoginSessionService`, `RefreshTokenUseCase`, `JwtStrategy`                                        |
| `JWT_REFRESH_SECRET`               | — (requerida) | `jwtRefreshSecret`             | Reservada, sin consumidor (ver §1)                                                                      |
| `JWT_ACCESS_TTL`                   | `15m`         | `accessTokenTtl`               | `IssueLoginSessionService`, `RefreshTokenUseCase` (formato `ms`/`jsonwebtoken`, ej. `15m`, `1h`)        |
| `JWT_REFRESH_TTL_DAYS`             | `7`           | `refreshTokenTtlDays`          | `IssueLoginSessionService` (login sin `rememberMe`), `RefreshTokenUseCase` (heurística de rotación, §3) |
| `JWT_REMEMBER_ME_TTL_DAYS`         | `30`          | `rememberMeTtlDays`            | `IssueLoginSessionService` (login con `rememberMe: true`), `RefreshTokenUseCase`                        |
| `LOGIN_LOCKOUT_THRESHOLD`          | `5`           | `loginLockoutThreshold`        | `LoginUseCase`                                                                                          |
| `LOGIN_LOCKOUT_WINDOW_MINUTES`     | `15`          | `loginLockoutWindowMinutes`    | `LoginUseCase`                                                                                          |
| `TWO_FACTOR_CHALLENGE_TTL_MINUTES` | `5`           | `twoFactorChallengeTtlMinutes` | `LoginUseCase` (TTL del `challengeToken` en Redis)                                                      |
| `AUTH_STRICT_SESSION_VALIDATION`   | `false`       | `strictSessionValidation`      | `RefreshTokenUseCase` (§4)                                                                              |

Todas con default idéntico al valor que estaba hardcodeado antes de esta
parte (excepto las dos nuevas, `JWT_REMEMBER_ME_TTL_DAYS` y
`AUTH_STRICT_SESSION_VALIDATION`) — cambiar el comportamiento en
producción es un cambio de `.env`, no de código.

## 3. "Recordar sesión" (`rememberMe`) — sin columna propia en la base

`POST /auth/login` acepta `rememberMe: boolean` (opcional, default
`false`). No hay una columna `remember_me` en `core.sessions` — se
resuelve así:

1. **Al emitir la sesión** (`IssueLoginSessionService.issue()`): si
   `rememberMe: true`, el refresh token se crea con `expires_at = now +
JWT_REMEMBER_ME_TTL_DAYS` en vez de `JWT_REFRESH_TTL_DAYS`.
2. **Al rotar** (`RefreshTokenUseCase`, cada `POST /auth/refresh`): no
   hay forma directa de leer "esta sesión eligió rememberMe" — se infiere
   comparando la duración original de la sesión (`expires_at -
created_at`, ambas ya persistidas) contra el TTL estándar. Si la
   duración original es más de 1.5x el TTL estándar, se asume
   `rememberMe: true` y la rotación preserva el TTL largo; si no, usa el
   TTL estándar. El margen de 1.5x evita falsos positivos por drift de
   reloj/latencia normal.

Con 2FA habilitado, `rememberMe` (y la IP/User-Agent del primer paso) se
guardan en el `challengeToken` (Redis, `TwoFactorChallenge`) y se aplican
recién al completar el segundo paso (`POST /auth/login/2fa`) — el
`rememberMe` pedido en el primer paso no se pierde.

## 4. Protección de session-hijacking (IP/User-Agent)

`core.sessions.ip_address`/`user_agent` (columnas que ya existían en el
schema, sin consumidor hasta esta parte) se completan al emitir la sesión
y se comparan en cada `POST /auth/refresh`:

- **Mismatch detectado** (IP o User-Agent distintos a los guardados): se
  registra siempre un `warn` estructurado (`LoggerService`) con
  `sessionId`, `userId` y ambos valores (esperado/recibido) — visibilidad
  sin fricción por default, porque IP/UA cambian legítimamente (redes
  móviles, actualizaciones de navegador, IPs dinámicas de ISP).
- **`AUTH_STRICT_SESSION_VALIDATION=false`** (default): el refresh
  continúa igual, sin rechazar.
- **`AUTH_STRICT_SESSION_VALIDATION=true`**: además rechaza con `401
SESION_SOSPECHOSA`. Decisión de producto (no técnica) activarlo — sin
  datos reales de tasa de falsos positivos en este entorno todavía, ver
  `TECHNICAL_DEBT.md`.

Un `POST /auth/refresh` exitoso actualiza `ip_address`/`user_agent` al
valor del request actual (ventana deslizante: el próximo refresh compara
contra el último valor conocido, no contra el de la sesión original)
salvo que el request no incluya alguno de esos valores (ahí se conserva
el guardado).

## 5. Verificación de empresa/sucursal activa

`OrganizationStatusRepository` (`isCompanyActive`/`isBranchActive`,
sobre `core.companies.is_active`/`core.branches.is_active`) se consulta
en dos puntos:

- **`POST /auth/refresh`**: si `record.company_id`/`branch_id` de la
  sesión ya no están activos, rechaza con `403 EMPRESA_INACTIVA`/
  `403 SUCURSAL_INACTIVA` en vez de rotar el token.
- **`GET /auth/session`**: mismo chequeo, más el estado del propio
  usuario (`403 USUARIO_INACTIVO`) — cubre el caso de un access token
  todavía vigente (hasta 15 min) emitido antes de que alguien desactivara
  la empresa/sucursal/usuario.

`null` en `company_id`/`branch_id` (usuario en "modo todas las
empresas", sin selección fija) no dispara la verificación — no hay nada
que validar.
