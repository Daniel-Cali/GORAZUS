# Auth — Arquitectura

> Actualizado FASE 03, Parte 02 (Autenticación Enterprise, 2026-07-22) —
> lo preparado en Parte 2.1 (§3, más abajo) ya se adoptó, ver
> `AUTH_REPORT.md` para el detalle completo de esta parte. Resumen corto
> de arquitectura real (código, no diseño especulativo). Diseño original
> completo y diagramas de secuencia:
> [docs/architecture/13-modulo-auth.md](./docs/architecture/13-modulo-auth.md)
> (tiene una nota agregada esta sesión donde el código real diverge del
> diseño original). Historial real de qué se construyó cuándo:
> `CHANGELOG.md`.

## 1. Capas — Clean Architecture, convención propia del proyecto

Este proyecto NO usa carpetas `Application/`/`Domain/`/`Infrastructure/`/
`Presentation/` como nombres literales (esa es la convención de otros
stacks, ej. PHP/Laravel) — usa una convención propia, ya establecida y
auditada en `docs/architecture/02-arquitectura-modulos-backend.md`, que
mapea a los mismos 4 conceptos:

| Concepto Clean Architecture              | Carpeta real en `modules/auth/backend/`                                                    | Ejemplo                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Domain (entidades, VOs, excepciones)     | `entities/`, `value-objects/`, excepciones exportadas junto a cada use case                | `Usuario`, `Email` (VO, preparado — ver §3), `CredencialesInvalidasException` |
| Application (casos de uso, DTOs)         | `services/` (casos de uso), `dto/` + `validators/` (Zod, DTO+validación combinados)        | `LoginUseCase`, `LoginResponseDto`, `loginSchema`                             |
| Infrastructure (repositorios, providers) | `repositories/` (puerto + adaptador Prisma), `services/jwt-token.provider.ts`              | `SessionRepository`/`SessionRepositoryPrisma`, `signAccessToken()`            |
| Presentation (controllers, middlewares)  | `controllers/`, guards/interceptors en `core/http` (compartidos, no duplicados por módulo) | `AuthController`, `JwtAuthGuard`, `PermissionsGuard`                          |

Reorganizar esto en carpetas literales `Domain/Auth/`
`Application/Auth/` etc. — como pediría el template genérico de esta
fase — significaría mover ~30 archivos ya probados en producción real
(ver `TEST_REPORT.md` de la sesión anterior, 33 tests) a una estructura
paralela y en conflicto con `modules/seguridad/backend`/
`modules/configuracion/backend`, que usan exactamente esta misma
convención. Se optó por preparar/completar los CONCEPTOS pedidos dentro
de la estructura real, no crear una estructura nueva en paralelo — ver
`AUTH_MODULE_REPORT.md` para el detalle de esa decisión.

## 2. Dueño de datos — por qué `auth` no tiene su propio schema

Ver `docs/architecture/13-modulo-auth.md §0` para el detalle completo.
Resumen: `auth` administra (no es dueño exclusivo de) `core.users`/
`core.sessions`/`core.tokens`, y lee (sin escribir) `security.
login_attempts`/`security.two_factor_credentials` — mismo Prisma client
(`PRISMA_SECURITY`) que `seguridad` usa para escribir esos datos, cada
módulo con su propio repositorio sobre el cliente compartido (nunca
importándose el uno al otro — `@nx/enforce-module-boundaries` lo hace
estructuralmente imposible).

## 3. Preparado en Parte 2.1 — estado de adopción tras Parte 02

No se tocó ningún caso de uso de login/refresh/2FA en Parte 2.1 (ya
construidos y probados en Parte 2 — Backend Core); Parte 02 (FASE 03)
adoptó la mayor parte de lo preparado ahí:

- **`Email` (Value Object)** — `value-objects/email.vo.ts`. Sigue sin
  adoptar: `Usuario` sigue validando el email con su propia regex
  inline. No formaba parte del alcance de Parte 02 (login por
  username/email no tocó la entidad `Usuario`).
- **Domain Events** — `events/*.event.ts` (`UsuarioAutenticadoEvent`,
  `LoginFallidoEvent`, `CuentaBloqueadaEvent`, `SesionRevocadaEvent`).
  Siguen sin publicarse — `EventBusService` (`core/messaging`) sigue sin
  productores reales en todo el backend (`TECHNICAL_DEBT.md §2`).
- **JWT Provider** — `services/jwt-token.provider.ts` (`signAccessToken`)
  — ✅ **adoptado**: `IssueLoginSessionService` y `RefreshTokenUseCase`
  ya lo usan en vez de su `jwt.sign(...)` inline duplicado.
- **`GuestGuard`** — `core/http/guards/guest.guard.ts`. Sigue sin uso —
  fuera del alcance de Parte 02 (ningún endpoint nuevo lo necesitaba).
- **Config de TTLs/umbrales** — `core/config/namespaces/auth.config.ts`
  — ✅ **adoptado**: `LoginUseCase`, `RefreshTokenUseCase` e
  `IssueLoginSessionService` ya leen `accessTokenTtl`/
  `refreshTokenTtlDays`/`loginLockoutThreshold`/
  `loginLockoutWindowMinutes`/`twoFactorChallengeTtlMinutes` desde acá
  (antes constantes hardcodeadas). Se agregaron dos valores nuevos:
  `rememberMeTtlDays` y `strictSessionValidation` — ver
  `JWT_CONFIGURATION.md`.

Funcionalidad nueva de Parte 02 que NO estaba prevista en Parte 2.1
(protección de session-hijacking, verificación de empresa/sucursal
activa, "recordar sesión", `GET /auth/me`, `GET /auth/session`,
`POST /auth/revoke`) — ver `AUTH_REPORT.md` para el detalle completo.

## 4. Providers ya existentes (Common Utilities) — no se tocaron

`packages/tooling/utils` ya cubre Clock (`clock.ts`, interfaz `Clock` +
`SystemClock`/`FixedClock`), UUID (`uuid.ts`), Password hashing
(`hash.ts`, Argon2id) y TOTP (`totp.ts`) — como **funciones puras, sin
DI**, decisión de arquitectura ya tomada
(`docs/architecture/32-core-platform/10-utilidades-comunes.md §1`), no
como clases inyectables. `signAccessToken` (§3) sigue el mismo espíritu
de función pura pero vive en `modules/auth/backend` en vez de
`packages/tooling/utils` porque ese paquete resuelve dependencias desde
la raíz del monorepo (sin `package.json` propio) y `jsonwebtoken` no es
una dependencia de raíz (a diferencia de `argon2`, que sí lo es).

## 5. RBAC — ya real, no de esta fase

Roles/Permisos/`PermissionsGuard`/`@RequirePermission()` ya existen y
están en uso real desde Fase 2 (`modules/seguridad/backend`,
`core/http/guards/permissions.guard.ts`) — "Policies (preparadas)" del
pedido de esta fase ya está cubierto por esa infraestructura, no se
duplicó.
