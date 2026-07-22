# Test Report — GORAZUS ERP

> Fase 2 — Desarrollo del Backend Core. Sesión del 2026-07-22, versión
> **0.3.0**. Todos los números de abajo son de corridas reales de esta
> sesión (`--runInBand`, para evitar el límite de memoria del sandbox — ver
> §3), no estimaciones.

## 1. Resultados por paquete tocado

| Paquete                 | Suites |  Tests  |   Resultado    | Contra infraestructura real |
| ----------------------- | :----: | :-----: | :------------: | :-------------------------: |
| `auth-backend`          |   7    |   33    |    ✅ 33/33    |  Postgres, Redis, MailHog   |
| `seguridad-backend`     |   11   |   46    |    ✅ 46/46    |          Postgres           |
| `configuracion-backend` |   10   |   35    |    ✅ 35/35    |          Postgres           |
| `core-storage`          |   1    |    3    |     ✅ 3/3     |            MinIO            |
| `core-cache`            |   1    |    5    |     ✅ 5/5     |            Redis            |
| `core-config`           |   1    |    5    |     ✅ 5/5     |      — (unitario puro)      |
| **Total**               | **31** | **127** | **✅ 127/127** |                             |

## 2. Tests nuevos esta sesión (17)

| Archivo                                                               | Tests | Cubre                                                                 |
| --------------------------------------------------------------------- | :---: | --------------------------------------------------------------------- |
| `modules/auth/backend/services/login.usecase.spec.ts` (reescrito)     |   6   | Lockout, 2FA challenge, registro de intentos — unitario, fakes        |
| `modules/auth/backend/controllers/two-factor-login.e2e-spec.ts`       |   4   | Flujo 2FA completo contra Postgres/Redis reales                       |
| `modules/auth/backend/services/email-password-reset-notifier.spec.ts` |   1   | Envío SMTP real, verificado leyendo MailHog                           |
| `modules/auth/backend/controllers/auth.controller.e2e-spec.ts` (+2)   |   2   | Logout invalida el token de inmediato; `Origin` cross-site → 403      |
| `core/storage/storage.controller.spec.ts`                             |   3   | Upload/URL firmada/delete + sanitización de nombre, contra MinIO real |
| `core/cache/lock.service.spec.ts` (sesión anterior, no nuevo)         |   —   | —                                                                     |

`login.usecase.spec.ts` pasó de 5 tests (sesión anterior) a 6 — reescrito
por completo porque `LoginUseCase` cambió de firma (`LoginOutcome` en vez de
`LoginResult` directo) al integrar 2FA.

## 3. Hallazgo real de esta sesión: el rate limit nuevo interactuaba con los tests existentes

Al agregar `@Throttle({ limit: 5, ttl: 60_000 })` a `/auth/login`, la suite
existente de `auth.controller.e2e-spec.ts` (que hace varios logins dentro
del mismo `describe`, compartiendo la misma app/IP de test) empezó a
acercarse al límite. Se resolvió consolidando dos tests que cada uno hacía
su propio login en uno solo que reusa el mismo login para las tres
aserciones relacionadas (login → refresh → logout), en vez de forzar un
límite más permisivo solo para que los tests pasen — el comportamiento real
en producción (5/60s) quedó intacto.

## 4. Efecto colateral: `JwtStrategy` ahora depende de `CacheService`

La revocación de sesión (§ `SECURITY_REPORT.md` #3) hizo que el
`JwtStrategy` global —usado por cualquier ruta protegida— dependa de
`CacheService`. **11 archivos `*.e2e-spec.ts`** que arman su propio
`Test.createTestingModule` con `HttpModule` (pero sin `CacheModule`)
necesitaron sumarlo a sus imports, o la resolución de DI fallaba al
arrancar la app de test. Lista completa: `auth.controller.e2e-spec.ts`,
`password-reset.e2e-spec.ts`, `two-factor-login.e2e-spec.ts` (nuevo, ya
lo incluía), `empresas.controller.e2e-spec.ts`, `impuestos.controller.e2e-spec.ts`,
`monedas.controller.e2e-spec.ts`, `parametros.controller.e2e-spec.ts`,
`auditoria.controller.e2e-spec.ts`, `dos-factores.controller.e2e-spec.ts`,
`roles.controller.e2e-spec.ts`, `sesiones.controller.e2e-spec.ts`,
`usuarios.controller.e2e-spec.ts`. Todos re-verificados tras el cambio.

## 5. Falso positivo de un audit previo, corregido al verificar

El audit de esta sesión (agente de solo-lectura, antes de escribir código)
había marcado `sucursales` y `tasas-impuesto` como "sin cobertura e2e". Al
ir a escribir los tests faltantes, se encontró que **ambos ya tenían
cobertura real** — anidada dentro de `empresas.controller.e2e-spec.ts` e
`impuestos.controller.e2e-spec.ts` respectivamente, no en archivos con su
propio nombre (que es lo único que el audit había buscado). No se escribió
ningún test duplicado — se corrigió el hallazgo en vez de actuar sobre él
a ciegas.

## 6. Limitación de memoria del sandbox — no del código

`nx test <paquete>` sin `--runInBand` satura la memoria de este entorno
cuando corren 5+ suites e2e reales en paralelo (cada una levanta su propia
app Nest + conexiones a Postgres/Redis/MinIO/MailHog reales). Los números
de la tabla §1 son todos con `--runInBand` (serial dentro del paquete, real
paralelismo entre `nx test` de distintos paquetes evitado a propósito
durante esta sesión). Mismo patrón que documentó la sesión de
infraestructura previa — un runner de CI real (más memoria disponible que
este sandbox) no debería verlo, pero no se pudo confirmar eso último acá.

## 7. No cubierto esta sesión

- Tests de `core/storage` no ejercitan el endpoint HTTP completo
  (`StorageController` se instancia directo, sin pasar por
  `Test.createTestingModule`/supertest) — deliberado, mismo patrón ya usado
  por `core/cache/lock.service.spec.ts` para librerías `core/*`. La
  integración HTTP completa (multipart real vía supertest) queda para
  cuando un módulo de negocio real consuma el endpoint.
- Sin test de carga/concurrencia sobre el lockout ni sobre la emisión de
  `challengeToken` — fuera de alcance de esta fase.
