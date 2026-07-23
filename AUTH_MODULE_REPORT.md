# Auth Module Report — GORAZUS ERP

> Fase 2, Parte 2.1 — Módulo de Autenticación, Infraestructura. Sesión del
> 2026-07-22, versión **0.3.1**. Este reporte sintetiza la decisión
> central de esta parte y por qué se ejecutó así — el detalle técnico
> vive en `AUTH_ARCHITECTURE.md`/`AUTH_STRUCTURE.md`/`AUTH_DEPENDENCIES.md`/
> `AUTH_HEALTH_REPORT.md`, no se repite acá.

## 1. La discrepancia de partida, y cómo se resolvió

El pedido de esta parte da por hecho que el login **no existe todavía**
("dejar preparado el módulo... para comenzar la implementación del Login
Enterprise en la Parte 2.2") y pide una estructura de carpetas
`Application/Auth/`, `Domain/Auth/`, `Infrastructure/Auth/`,
`Presentation/Auth/` (convención de otros stacks, ej. PHP/Laravel).

**Realidad del repo**: el login ya existe, es real, y está en producción
desde hace dos sesiones — con bloqueo por intentos fallidos, JWT +
refresh rotativo, revocación de sesión, 2FA exigido, reset de contraseña
por email real, protección CSRF, 33 tests pasando contra infraestructura
real (ver `TEST_REPORT.md`/`SECURITY_REPORT.md` de la sesión de "Fase 2 —
Backend Core"). Además, ya existe una estructura de Clean Architecture
completa (`entities/`, `services/`, `repositories/`, `controllers/`,
`dto/`, `validators/`) — con nombres de carpeta distintos a los pedidos,
pero cubriendo exactamente los mismos 4 conceptos (Domain/Application/
Infrastructure/Presentation), ya usada de forma idéntica y consistente
por `modules/seguridad/backend` y `modules/configuracion/backend`.

**Decisión tomada** (autónoma, sin pedir confirmación, coherente con el
resto de la sesión — ver instrucciones de "trabajar completamente de
forma autónoma"): no crear una estructura de carpetas paralela ni tocar
el login ya construido. En cambio:

1. Se preparó/completó cada **concepto** pedido (Value Objects, Domain
   Events, Providers, config) **dentro** de la estructura real del
   proyecto, de forma puramente aditiva.
2. Se respetó literalmente "no desarrollar aún el login" — ningún caso
   de uso de login/refresh/2FA se modificó.
3. Se documentó el mapeo completo (`AUTH_ARCHITECTURE.md`) para que quede
   explícito qué carpeta real corresponde a qué concepto pedido.

## 2. Qué se entregó — resumen

| Categoría del pedido                         | Estado antes de esta parte                                              | Qué se hizo                                                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Domain: Entidades                            | Ya existía (`Usuario`, `Sesion`)                                        | Sin cambios                                                                                              |
| Domain: Value Objects                        | No existía                                                              | ✅ `Email` VO (preparado, no adoptado)                                                                   |
| Domain: Excepciones                          | Ya existían (7 clases, español, `DomainException`)                      | Sin cambios — ya cubren `InvalidCredentials`/`UserBlocked`/`TokenExpired`/`Unauthorized` conceptualmente |
| Domain: Eventos                              | No existía                                                              | ✅ 4 eventos preparados, sin publicar                                                                    |
| Domain: Policies                             | Ya existía (`PermissionsGuard`, RBAC real)                              | Sin cambios                                                                                              |
| Application: Casos de uso                    | Ya existían (6 use cases)                                               | Sin cambios                                                                                              |
| Application: DTO/Validadores                 | Ya existían (Zod + DTOs Swagger)                                        | Sin cambios                                                                                              |
| Infrastructure: Repositories                 | Ya existían (6 repos, puerto+adaptador)                                 | Sin cambios                                                                                              |
| Infrastructure: JWT Provider                 | No existía (inline, duplicado)                                          | ✅ `signAccessToken()` extraído, preparado                                                               |
| Infrastructure: Password/Clock/UUID Provider | Ya existían como funciones puras (`packages/tooling/utils`)             | Documentado — decisión de "sin DI" ya tomada, no se creó una versión inyectable paralela                 |
| Presentation: Controllers                    | Ya existía (`AuthController`, 6 endpoints)                              | Sin cambios                                                                                              |
| Presentation: Middlewares                    | `Authenticate`/`Permission`/`Role`/`Tenant` ya existían                 | ✅ `GuestGuard` nuevo (preparado)                                                                        |
| Config: JWT/Argon2id/Cookies/Rate Limit      | Ya existía (secrets + hardcoded consts)                                 | ✅ TTLs/umbrales ahora configurables por env (default = valor actual)                                    |
| Logging                                      | Ya existía (`LoggerService`, requests + intentos vía DB)                | Documentado en `AUTH_HEALTH_REPORT.md`, sin cambios (tocar esto exige tocar los use cases)               |
| Docs                                         | `docs/architecture/13-modulo-auth.md` (diseño original, desactualizado) | ✅ 3 docs nuevos + corrección de `modules/auth/README.md` + nota en el doc original                      |
| Tests                                        | 33 tests ya reales (Parte 2)                                            | ✅ +18 unitarios para lo nuevo                                                                           |

## 3. Lo que NO se hizo, a propósito

- **No se creó** ninguna carpeta `Application/Auth/`, `Domain/Auth/`,
  etc. — ver §1.
- **No se adoptó** el `Email` VO dentro de `Usuario`, ni el JWT Provider
  dentro de `IssueLoginSessionService`/`RefreshTokenUseCase`, ni los TTLs
  configurables dentro de los use cases — todo eso es tocar login,
  explícitamente fuera de esta parte.
- **No se publicó** ningún Domain Event — `EventBusService` sigue sin
  productores reales en todo el backend (mismo estado que la sesión de
  infraestructura documentó).
- **No se creó** un patrón Command/Query/Handler (CQRS real) — el pedido
  lo menciona, pero forzarlo solo para `auth` crearía inconsistencia con
  `seguridad`/`configuracion` (ninguno usa CQRS), y "CQRS preparado" ya
  está satisfecho por el hecho de que cada caso de uso es una clase de
  responsabilidad única, fácil de envolver en un Command Handler después.

## 4. Riesgo real de esta parte: bajo

Todo lo agregado es código nuevo, sin consumidores — el peor caso de un
error acá es "código muerto que no compila", nunca "login roto en
producción". Confirmado con build/lint/test — ver `AUTH_HEALTH_REPORT.md`.
