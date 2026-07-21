# 32.12 — Árbol de carpetas del Core Platform

> Consolida lo ya existente en
> [01-estructura-monorepo.md §2](../01-estructura-monorepo.md#2-árbol-de-carpetas-raíz)
> con las carpetas técnicas nuevas que este documento requiere. Ninguna
> carpeta de negocio (`modules/*`) se toca ni se agrega aquí — el
> Core Platform es exclusivamente infraestructura transversal, regla
> ya fijada en el
> [README §2](./README.md#2-alcance-y-ubicación-en-el-monorepo).

## 1. Regla de ubicación

Tres destinos posibles para cualquier pieza de código de este
documento, sin excepción:

| Destino                             | Cuándo                                                                                                                          | Regla de import (ya fijada en `01-estructura-monorepo.md §5`) |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `core/<nombre>/`                    | Componente con dependencia de infraestructura (base de datos, cache, mensajería, framework NestJS)                              | Puede importar `packages/*`, nunca `modules/*`                |
| `packages/contracts/`               | Value Objects, Security Context y cualquier tipo del Shared Kernel — sin dependencia de framework, consumible desde `frontend/` | No importa nada (leaf del grafo)                              |
| `packages/tooling/utils/<dominio>/` | Funciones puras sin estado ni dependencia de infraestructura (grupo 10 completo)                                                | No importa nada (leaf del grafo)                              |

## 2. Árbol completo (🆕 = carpeta nueva agregada por este documento; sin marca = ya existente)

```
GORAZUS/
├── core/
│   ├── database/                 # ya existente — + base.repository.ts,
│   │                              #   transaction-manager.ts, base-entity.ts
│   │                              #   (Repository Base, Transaction Manager
│   │                              #   / Unit of Work, Base Entity)
│   ├── cache/                    # ya existente (Cache Framework)
│   ├── messaging/                # ya existente — event-bus.service.ts,
│   │                              #   domain-event.base.ts (Domain Events,
│   │                              #   Event Bus, Message Broker)
│   ├── storage/                  # ya existente (Storage Framework)
│   ├── realtime/                 # ya existente
│   ├── http/                     # ya existente — filtro de excepción global,
│   │                              #   interceptor de tenant
│   ├── config/                   # ya existente — + environment.service.ts
│   │                              #   (Configuration Manager, Environment
│   │                              #   Manager)
│   ├── kernel/                   # 🆕 bootstrap.ts (Application Kernel)
│   ├── license/                  # 🆕 license.service.ts (License Manager)
│   ├── feature-flags/            # 🆕 feature-flags.service.ts
│   ├── i18n/                     # 🆕 localization.service.ts,
│   │                              #   internationalization.service.ts,
│   │                              #   timezone.service.ts, language.service.ts
│   ├── currency/                 # 🆕 currency.service.ts (Currency Manager)
│   ├── metadata/                 # 🆕 metadata.service.ts (Metadata Manager)
│   ├── rules-engine/             # 🆕 rules-engine.service.ts
│   │                              #   (Business Rules Engine)
│   ├── policy/                   # 🆕 policy-engine.service.ts
│   │                              #   (punto de extensión ABAC — ver nota
│   │                              #   de gobernanza en 05.03)
│   ├── workflow/                 # 🆕 workflow-engine.service.ts
│   ├── approval/                 # 🆕 approval-engine.service.ts
│   │                              #   (depende de workflow/)
│   ├── state-machine/            # 🆕 state-machine.service.ts
│   ├── notifications/            # 🆕 notification-center.service.ts
│   ├── audit/                    # 🆕 audit-framework.service.ts
│   │                              #   (consume Base Entity + State Machine)
│   ├── logging/                  # 🆕 logger.service.ts
│   ├── exceptions/                # 🆕 domain-exception.base.ts,
│   │                              #   validation-exception.base.ts
│   ├── health/                   # 🆕 health-check.controller.ts
│   ├── observability/            # 🆕 metrics.interceptor.ts,
│   │                              #   tracing.middleware.ts
│   ├── templates/                # 🆕 template-engine.service.ts
│   ├── scheduler/                # 🆕 scheduler.service.ts
│   ├── jobs/                     # 🆕 background-jobs.service.ts,
│   │                              #   job-worker.ts (proceso separado, ver
│   │                              #   §3 de este documento)
│   └── files/                    # 🆕 file-manager.service.ts
│                                  #   (construye sobre core/storage/)
│
├── packages/
│   ├── contracts/                # ya existente — + value-objects/
│   │                              #   (Money, Porcentaje, RangoFecha),
│   │                              #   security-context.ts
│   └── tooling/
│       └── utils/                # 🆕 date/, money/, number/, string/,
│                                  #   validation/, encryption/,
│                                  #   compression/, serialization/
│                                  #   (grupo 10 completo — Common Utilities
│                                  #   es la carpeta utils/ en sí misma)
│
├── modules/                      # sin cambios — ver 01-estructura-monorepo.md
│                                  #   §2. Company Manager / Branch Manager /
│                                  #   Tenant Manager / Sequence Generator /
│                                  #   Document Numbering son lógica de
│                                  #   NEGOCIO ya ubicada en
│                                  #   modules/configuracion/ (ver
│                                  #   14-modulo-core.md) — no se mueven ni
│                                  #   se duplican aquí.
│
├── infra/
│   └── scripts/                  # ya existente — Backup Manager, Restore
│                                  #   Manager y las pruebas de Disaster
│                                  #   Recovery son procedimientos de
│                                  #   infraestructura aquí, no código de
│                                  #   aplicación (ver
│                                  #   11-resiliencia-y-continuidad.md)
│
└── docs/
    └── architecture/
        └── 32-core-platform/     # 🆕 este mismo set de documentos
```

## 3. Nota sobre `core/jobs/` como proceso separado

A diferencia de las demás carpetas `core/*`, que se ejecutan dentro
del mismo proceso que `apps/api`, `core/jobs/job-worker.ts` es el
entry point de un **binario de despliegue distinto**
(`apps/api-worker` sería el composition root correspondiente, si se
decide crear uno explícito — alternativa: un flag de arranque sobre el
mismo `apps/api/src/main.ts` que omite el listener HTTP y solo levanta
consumidores de cola). Esta decisión de despliegue exacta (proyecto Nx
separado vs. flag de arranque) queda abierta como implementación,
consistente con que este documento es de arquitectura, no de código —
ver la nota de alcance de KISS en
[architecture/README.md §2](../README.md#2-principios-rectores):
"no se introduce un patrón hasta que la complejidad real lo
justifique". Lo que sí es una decisión de arquitectura fija, no
abierta: el worker de `Background Jobs`
([08-frameworks-de-infraestructura.md §6](./08-frameworks-de-infraestructura.md#6-background-jobs))
escala de forma independiente al backend HTTP en Kubernetes
([31-infraestructura-completa.md §2](../31-infraestructura-completa.md)),
sin importar cómo se resuelva el detalle de composition root.

## 4. Tabla de trazabilidad componente → carpeta

| Componente                                                                                                   | Carpeta                                                            | Trazabilidad  |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------- |
| Application Kernel                                                                                           | `core/kernel/`                                                     | 🔗 extiende   |
| Service Container                                                                                            | (mecanismo NestJS, sin carpeta propia)                             | 🔗 extiende   |
| Dependency Injection                                                                                         | (mecanismo NestJS, sin carpeta propia)                             | 🔗 extiende   |
| Configuration Manager                                                                                        | `core/config/`                                                     | 📎 referencia |
| Environment Manager                                                                                          | `core/config/`                                                     | 🔗 extiende   |
| Feature Flags                                                                                                | `core/feature-flags/`                                              | 📎 referencia |
| License Manager                                                                                              | `core/license/`                                                    | 🆕 nuevo      |
| Tenant Manager                                                                                               | `core/http/` (interceptor ya existente)                            | 📎 referencia |
| Company Manager, Branch Manager                                                                              | `modules/configuracion/` (negocio)                                 | 📎 referencia |
| Multi Company/Branch/Warehouse                                                                               | (propiedad transversal, sin carpeta propia)                        | 📎 referencia |
| Localization, Internationalization, Timezone Manager, Language Manager                                       | `core/i18n/`                                                       | 🔗 extiende   |
| Currency Manager                                                                                             | `core/currency/`                                                   | 🔗 extiende   |
| Multi Currency/Language/Country                                                                              | (propiedad transversal)                                            | 🔗 / 📎       |
| Sequence Generator, Document Numbering                                                                       | `modules/configuracion/` + función SQL (negocio)                   | 📎 referencia |
| Metadata Manager                                                                                             | `core/metadata/`                                                   | 🔗 extiende   |
| Reference Data, Master Data                                                                                  | (patrón, sin carpeta propia)                                       | 📎 referencia |
| Business Rules Engine                                                                                        | `core/rules-engine/`                                               | 🆕 nuevo      |
| Validation Engine                                                                                            | `packages/contracts/` (schemas Zod)                                | 📎 referencia |
| Policy Engine                                                                                                | `core/policy/`                                                     | 🔗 extiende   |
| Workflow Engine                                                                                              | `core/workflow/`                                                   | 🔗 extiende   |
| Approval Engine                                                                                              | `core/approval/`                                                   | 🔗 extiende   |
| State Machine                                                                                                | `core/state-machine/`                                              | 🔗 extiende   |
| Domain Events, Event Bus, Message Broker                                                                     | `core/messaging/`                                                  | 📎 referencia |
| Notification Center                                                                                          | `core/notifications/`                                              | 🔗 extiende   |
| Audit Framework                                                                                              | `core/audit/`                                                      | 📎 referencia |
| Logging Framework                                                                                            | `core/logging/`                                                    | 🔗 extiende   |
| Exception Framework                                                                                          | `core/http/` + `core/exceptions/`                                  | 🔗 extiende   |
| Health Checks                                                                                                | `core/health/`                                                     | 🆕 nuevo      |
| Metrics, Monitoring, Tracing                                                                                 | `core/observability/`                                              | 📎 referencia |
| Cache Framework                                                                                              | `core/cache/`                                                      | 📎 referencia |
| Storage Framework                                                                                            | `core/storage/`                                                    | 📎 referencia |
| File Manager                                                                                                 | `core/files/`                                                      | 🔗 extiende   |
| Template Engine                                                                                              | `core/templates/`                                                  | 🔗 extiende   |
| Scheduler                                                                                                    | `core/scheduler/`                                                  | 🔗 extiende   |
| Background Jobs                                                                                              | `core/jobs/`                                                       | 🆕 nuevo      |
| Security Context                                                                                             | `packages/contracts/`                                              | 📎 referencia |
| Transaction Manager / Unit of Work                                                                           | `core/database/`                                                   | 🔗 extiende   |
| Repository Base                                                                                              | `core/database/`                                                   | 📎 referencia |
| Base Entity                                                                                                  | `core/database/`                                                   | 📎 referencia |
| Aggregate Root                                                                                               | (patrón, sin carpeta propia)                                       | 📎 referencia |
| Value Objects                                                                                                | `packages/contracts/`                                              | 🔗 extiende   |
| Shared Kernel                                                                                                | `packages/contracts/`                                              | 📎 referencia |
| Common Utilities + 8 utilidades específicas                                                                  | `packages/tooling/utils/`                                          | 🆕 nuevo      |
| Backup Manager, Restore Manager, Disaster Recovery, High Availability, Cluster Support, Scalability Strategy | `infra/scripts/` + infraestructura K8s (sin carpeta de aplicación) | 📎 referencia |

72 componentes, 72 filas (agrupando las propiedades transversales sin
código propio junto a su componente base, tal como se documentó en
cada sub-documento).
