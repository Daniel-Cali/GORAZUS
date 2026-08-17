# Test Report — GORAZUS ERP

> FASE 03 — Backend Core Enterprise, Parte 01 (auditoría). Sesión del
> 2026-07-23, versión **0.3.1**. Estado ACTUAL de toda la suite de
> tests — no solo lo nuevo de una sesión puntual (para eso ver
> `CHANGELOG.md`). Reemplaza como fuente de verdad al `TEST_REPORT.md`
> anterior (sesión "Backend Core", 2026-07-22).

## 1. Inventario completo por paquete

| Paquete                 | Suites |  Tests  |       Necesita infraestructura real        | Última corrida completa confirmada             |
| ----------------------- | :----: | :-----: | :----------------------------------------: | :--------------------------------------------- |
| `auth-backend`          |   10   |   44    | 4 suites sí (Postgres/Redis/MailHog), 6 no | 2026-07-22 (33/33 e2e) + hoy (31/31 unitarios) |
| `seguridad-backend`     |   11   |   46    |               Sí (Postgres)                | 2026-07-22                                     |
| `configuracion-backend` |   10   |   35    |               Sí (Postgres)                | 2026-07-22                                     |
| `core-storage`          |   1    |    3    |                 Sí (MinIO)                 | 2026-07-22                                     |
| `core-cache`            |   1    |    5    |                 Sí (Redis)                 | Sesión de infraestructura previa               |
| `core-config`           |   1    |    5    |                     No                     | Hoy — ✅ pasa                                  |
| `core-http`             |   2    |    8    |                     No                     | Sesión Parte 2.1 — ✅ pasa                     |
| **Total**               | **36** | **146** |                                            |                                                |

**Nota sobre el conteo**: 146 es distinto al "127" citado en sesiones
previas porque `auth-backend` creció de 7 a 10 suites (Parte 2.1: Value
Object, eventos, JWT provider) y este reporte también cuenta
`core-http`/`core-config`, que reportes anteriores no sumaban al total
del backend de negocio. Mismos tests, conteo más completo.

## 2. Corrida real de esta sesión

`Docker Desktop` no disponible durante toda la sesión (`failed to
connect to the docker API` a nivel host) — ver
`BACKEND_HEALTH_REPORT.md §4` para el detalle. Se corrieron los 6
suites que NO necesitan infraestructura real:

```
auth-backend (parcial, solo unitarios): 31/31 ✅
  - value-objects/email.vo.spec.ts (4)
  - events/auth-domain-events.spec.ts (4)
  - services/jwt-token.provider.spec.ts (3)
  - services/login.usecase.spec.ts (6, fakes)
  - entities/usuario.entity.spec.ts (5)
  - entities/sesion.entity.spec.ts (9)
core-config: 5/5 ✅
```

Los 4 suites e2e de `auth-backend` (`auth.controller`, `password-reset`,
`two-factor-login`, `email-password-reset-notifier`) fallaron con
`ECONNREFUSED`/`Can't reach database server` — consistente con Docker
caído, no con una regresión de código (ningún caso de uso de negocio
cambió esta sesión, que fue de auditoría pura).

## 3. Cobertura — mecanismo, sin nuevo umbral

`coverageThreshold` (piso de seguridad, 5% global — ver
`jest.preset.js`) sin cambios desde que se agregó. `pnpm test:cov` sigue
sin estar wireado a CI. Ver la sesión de infraestructura previa para el
razonamiento completo de por qué el piso es tan bajo (la mayoría de los
27 módulos de negocio no tienen código que cubrir todavía).

## 4. Patrón de testing — confirmado consistente en todo el backend

- **Unitario**: fakes mínimos del colaborador exacto que la clase bajo
  prueba necesita (nunca un mock framework genérico) — mismo patrón en
  los 4 paquetes de negocio.
- **Integración/e2e**: contra infraestructura REAL (Postgres/Redis/
  MinIO/MailHog vía Docker), nunca contra una base de datos de test
  aislada — decisión de arquitectura ya tomada y consistente desde la
  primera sesión de código real.
- **`--runInBand`**: necesario en este sandbox de desarrollo específico
  para evitar saturar memoria con 5+ suites e2e reales en paralelo — no
  es una limitación del código, del proyecto, ni (previsiblemente) de un
  runner de CI real con más memoria disponible (sin confirmar, ver
  `TECHNICAL_DEBT.md §4`).

## 5. Riesgo de esta limitación: bajo

Cero cambios de código esta sesión (auditoría pura) — el riesgo de que
los 96 tests no re-corridos hoy hayan empezado a fallar es
estructuralmente nulo salvo por drift externo (versión de una
dependencia, cambio de infraestructura). Recomendación: primera acción
de la próxima sesión con Docker disponible debería ser
`pnpm nx run-many -t test -- --runInBand` completo, antes de cualquier
desarrollo nuevo.
