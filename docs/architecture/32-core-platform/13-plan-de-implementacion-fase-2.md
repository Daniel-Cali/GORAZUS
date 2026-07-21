# 32.13 — Plan de implementación: Fase 2 (Core Platform)

> Plan técnico de construcción — versión 1.0, 2026-07-13. Responde a
> "en qué orden se construye el Core Platform y con qué criterio de
> 'listo' por componente", no rediseña nada: cada componente ya tiene
> su especificación completa en los documentos 01-12 de esta misma
> carpeta. Este documento **no contiene código** — es un plan de
> implementación, consistente con que el proyecto sigue en fase de
> diseño hasta que se confirme explícitamente lo contrario.
>
> Nota de alcance: "Fase 2" aquí es la numeración informal que el
> usuario está usando para su propia secuencia de construcción
> (Fase 1 = diseño de arquitectura, ya completo; Fase 2 = Core
> Platform; Fase 3+ = módulos de negocio como Ventas/Inventario). Esto
> es **distinto** de la numeración de fases de
> [00-roadmap-fases.md](../../00-roadmap-fases.md), que trackea estado
> de _documentación_ por módulo de negocio (01-32), no orden de
> _implementación_ de código. No confundir ambas — no se modifica el
> roadmap de documentación por este plan.

## 1. Mapeo: los 23 componentes pedidos → especificación ya escrita

El usuario pidió estos 23 componentes para la Fase 2. Los 23 ya tienen
diseño completo — ninguno es nuevo. Tabla de trazabilidad:

| #   | Pedido como         | Ya diseñado como                                              | Documento                                                               |
| --- | ------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | Kernel              | Application Kernel + Service Container + Dependency Injection | [01 §1-3](./01-kernel-y-composicion.md)                                 |
| 2   | Configuration       | Configuration Manager + Environment Manager                   | [01 §4-5](./01-kernel-y-composicion.md)                                 |
| 3   | MultiTenant         | Tenant Manager                                                | [02 §1](./02-multiempresa-y-alcance-organizacional.md#1-tenant-manager) |
| 4   | MultiCompany        | Company Manager + Multi Company                               | [02 §2, §4](./02-multiempresa-y-alcance-organizacional.md)              |
| 5   | MultiBranch         | Branch Manager + Multi Branch                                 | [02 §3, §5](./02-multiempresa-y-alcance-organizacional.md)              |
| 6   | Security Context    | Security Context                                              | [09 §1](./09-base-transaccional-y-modelado-ddd.md#1-security-context)   |
| 7   | Workflow Engine     | Workflow Engine                                               | [05 §4](./05-motores-de-logica-de-negocio.md#4-workflow-engine)         |
| 8   | Approval Engine     | Approval Engine                                               | [05 §5](./05-motores-de-logica-de-negocio.md#5-approval-engine)         |
| 9   | Event Bus           | Domain Events + Event Bus + Message Broker                    | [06 §1-3](./06-eventos-y-mensajeria.md)                                 |
| 10  | Notification Center | Notification Center                                           | [06 §4](./06-eventos-y-mensajeria.md#4-notification-center)             |
| 11  | Audit Framework     | Audit Framework                                               | [07 §1](./07-observabilidad-y-gobernanza.md#1-audit-framework)          |
| 12  | Logging Framework   | Logging Framework                                             | [07 §2](./07-observabilidad-y-gobernanza.md#2-logging-framework)        |
| 13  | Cache Framework     | Cache Framework                                               | [08 §1](./08-frameworks-de-infraestructura.md#1-cache-framework)        |
| 14  | File Manager        | File Manager                                                  | [08 §3](./08-frameworks-de-infraestructura.md#3-file-manager)           |
| 15  | Storage Manager     | Storage Framework                                             | [08 §2](./08-frameworks-de-infraestructura.md#2-storage-framework)      |
| 16  | Template Engine     | Template Engine                                               | [08 §4](./08-frameworks-de-infraestructura.md#4-template-engine)        |
| 17  | Scheduler           | Scheduler                                                     | [08 §5](./08-frameworks-de-infraestructura.md#5-scheduler)              |
| 18  | Queue Manager       | Background Jobs                                               | [08 §6](./08-frameworks-de-infraestructura.md#6-background-jobs)        |
| 19  | Health Check        | Health Checks                                                 | [07 §4](./07-observabilidad-y-gobernanza.md#4-health-checks)            |
| 20  | Monitoring          | Monitoring                                                    | [07 §6](./07-observabilidad-y-gobernanza.md#6-monitoring)               |
| 21  | Metrics             | Metrics                                                       | [07 §5](./07-observabilidad-y-gobernanza.md#5-metrics)                  |
| 22  | Backup              | Backup Manager                                                | [11 §1](./11-resiliencia-y-continuidad.md#1-backup-manager)             |
| 23  | Restore             | Restore Manager                                               | [11 §2](./11-resiliencia-y-continuidad.md#2-restore-manager)            |
| —   | Shared Utilities    | Common Utilities + las 8 utilidades específicas               | [10](./10-utilidades-comunes.md)                                        |

## 2. Prerrequisitos que la lista de 23 no menciona pero el propio diseño exige

Antes de fijar el orden de construcción hay que ser transparente sobre
algo: **la lista de 23 no es autosuficiente**. Varios de los 23
componentes declaran, en su propia sección de "Dependencias" (ya
escrita en 01-12), una dependencia dura sobre un componente que no
está en la lista de 23. Construir en el orden en que se pidieron sin
resolver esto primero produce bloqueos a mitad de camino. Los 4 casos:

| Componente pedido                        | Depende de (no pedido explícitamente)                                                                                                                                                | Por qué es duro                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Workflow Engine                          | **Business Rules Engine** ([05 §1](./05-motores-de-logica-de-negocio.md#1-business-rules-engine)), **State Machine** ([05 §6](./05-motores-de-logica-de-negocio.md#6-state-machine)) | El motor avanza un paso evaluando condiciones vía Business Rules Engine, y cada paso es internamente una máquina de estados |
| Approval Engine                          | **Policy Engine** ([05 §3](./05-motores-de-logica-de-negocio.md#3-policy-engine))                                                                                                    | Verifica que el aprobador tenga permiso real antes de aceptar su decisión                                                   |
| MultiTenant / MultiCompany / MultiBranch | **Repository Base, Base Entity, Transaction Manager/Unit of Work** ([09 §2-6](./09-base-transaccional-y-modelado-ddd.md))                                                            | El filtro de aislamiento no es un componente aparte — lo aplica `Repository Base` en cada consulta                          |
| Audit Framework                          | **Base Entity** ([09 §5](./09-base-transaccional-y-modelado-ddd.md#5-base-entity))                                                                                                   | Las columnas de auditoría que consume ya son parte de `Base Entity`, no una tabla separada                                  |

Estos 4 componentes faltantes (Business Rules Engine, State Machine,
Policy Engine, y el grupo de Base Transaccional) se agregan al plan de
construcción como prerrequisitos silenciosos — no como alcance nuevo,
ya estaban diseñados en 05 y 09, solo no fueron pedidos explícitamente
en el mensaje de Fase 2.

## 3. Algo que ya está resuelto y no hay que reconstruir: la mitad de las garantías "duras" ya viven en SQL

Antes de escribir una sola línea de `core/`, es importante que el
orden de trabajo no reinvente lo que **ya se completó en la capa de
base de datos** (ver el trabajo de SQL de la sesión anterior sobre
`docs/database/sql/`):

- **Aislamiento multiempresa**: no depende solo de que `Repository
Base` recuerde agregar `WHERE tenant_id = ...` — Postgres ya tiene
  **Row-Level Security habilitada en las 497 tablas**, con la política
  `tenant_isolation` leyendo la variable de sesión
  `app.current_tenant_id` (`30_backup_restore.sql`). Esto es defensa
  en profundidad: aunque una consulta de aplicación tenga un bug y
  omita el filtro, RLS igual lo bloquea a nivel de motor.
- **Auditoría genérica**: el trigger `core.fn_audit_log` ya inserta en
  `core.audit_logs` en cada `INSERT`/`UPDATE`/`DELETE` de las 497
  tablas (con lista de exclusión ya fijada), leyendo el actor desde
  `app.current_user_id` (`26_triggers.sql`).
- **Columnas universales** (`tenant_id`, `created_at`, `version`,
  `row_version`, `metadata`, soft-delete...): ya están en las 497
  tablas, con el trigger `core.fn_set_audit_fields` manteniendo
  `updated_at`/`row_version` automáticamente.

**Consecuencia directa para el orden de trabajo:** el primer
componente de aplicación que se construye después del Kernel
(`Security Context`, Hito 2) tiene una responsabilidad muy concreta y
acotada — ejecutar `SET LOCAL app.current_tenant_id = '<uuid>'` y
`SET LOCAL app.current_user_id = '<uuid>'` al inicio de cada
transacción, para que las garantías que Postgres ya aplica tengan el
dato correcto. `Repository Base` no reimplementa el aislamiento, lo
complementa (índices/queries explícitas, mejor plan de ejecución) —
RLS es el backstop, no el único mecanismo.

## 4. Orden de construcción (hitos)

Cada hito lista qué requiere de hitos anteriores y qué componentes se
pueden construir en paralelo entre sí dentro del mismo hito (sin
dependencia mutua). El criterio de "listo" de cada componente sigue la
pirámide de testing ya fijada en
[07-convenciones-y-estandares.md §5](../07-convenciones-y-estandares.md#5-testing) —
no se repite capa por capa en cada componente, se asume por defecto:
unit tests sin mocks sobre invariantes, tests de integración contra
Postgres/Redis/RabbitMQ/MinIO reales vía testcontainers donde aplique.

### Hito 0 — Bootstrap del monorepo (prerrequisito físico, no es uno de los 23)

No hay Core Platform que construir sin esto primero:

- `git init` (el repositorio no está inicializado todavía).
- `pnpm-workspace.yaml`, `nx.json`, `tsconfig.base.json`, `package.json` raíz.
- Estructura vacía de `core/`, `packages/contracts/`,
  `packages/tooling/utils/`, `apps/api/`, `apps/web/` (composition
  roots sin lógica, ver
  [12-arbol-de-carpetas.md](./12-arbol-de-carpetas.md)).
- `infra/docker/docker-compose.dev.yml`: Postgres 17, Redis, RabbitMQ,
  MinIO — las 4 dependencias externas que el resto de los hitos
  necesita levantadas localmente (ver
  [08-infraestructura-y-despliegue.md](../08-infraestructura-y-despliegue.md)).
- Aplicar el schema real: `psql -f docs/database/sql/01_core.sql -f
... -f docs/database/sql/30_backup_restore.sql` contra el Postgres
  local — el Core Platform de aplicación no tiene sentido sin las 497
  tablas ya creadas.

**Listo cuando:** `pnpm install` corre sin error, `nx graph` muestra
el grafo (vacío) de proyectos, los 4 servicios de infraestructura
responden a healthcheck, y el schema completo aplica sin error contra
una base nueva.

### Hito 1 — Cimientos sin dependencia interna (paralelizable)

- **Shared Utilities** (`packages/tooling/utils/*` — las 9 entradas de
  [10](./10-utilidades-comunes.md)): cero dependencias, puede empezar
  el mismo día que H0 termina.
- **Configuration Manager + Environment Manager**
  ([01 §4-5](./01-kernel-y-composicion.md)): lee `docker-compose.dev.yml`/`.env`.
- **Cache Framework** ([08 §1](./08-frameworks-de-infraestructura.md#1-cache-framework)):
  depende de Redis (H0).
- **Storage Manager** ([08 §2](./08-frameworks-de-infraestructura.md#2-storage-framework)):
  depende de MinIO (H0).
- **Kernel** ([01 §1-3](./01-kernel-y-composicion.md)): depende de
  Configuration Manager (mismo hito — Configuration primero, Kernel al
  cierre del hito, ya que el bootstrap de 6 fases del Application
  Kernel empieza precisamente cargando configuración).

**Listo cuando:** `apps/api` arranca (`bootstrap()` completa sus 6
fases), se conecta a Redis/MinIO, y cada utilidad de
`packages/tooling/utils` tiene sus unit tests de invariantes (p. ej.
`Money` nunca pierde precisión, `Date Utilities` resuelve rangos
inclusive/exclusive según lo documentado).

### Hito 2 — Base transaccional y contexto multiempresa

Requiere H1 completo (Kernel arrancando).

- **Base Entity, Value Objects, Shared Kernel**
  (`packages/contracts/` — [09 §5, §7, §8](./09-base-transaccional-y-modelado-ddd.md)):
  sin dependencia de infraestructura, puede adelantarse en paralelo
  con H1 si hay capacidad, pero se agrupa aquí por cohesión lógica.
- **Transaction Manager / Unit of Work, Repository Base**
  ([09 §2-4](./09-base-transaccional-y-modelado-ddd.md)): depende del
  Kernel (H1) y de Base Entity.
- **Security Context** ([09 §1](./09-base-transaccional-y-modelado-ddd.md#1-security-context)):
  implementa el `AsyncLocalStorage` por request y, crítico, el `SET
LOCAL app.current_tenant_id` / `app.current_user_id` descrito en
  §3 de este documento.
- **MultiTenant** ([02 §1](./02-multiempresa-y-alcance-organizacional.md#1-tenant-manager)):
  depende de Security Context + Repository Base.
- **MultiCompany, MultiBranch** ([02 §2-5](./02-multiempresa-y-alcance-organizacional.md)):
  depende de MultiTenant.

**Listo cuando:** un test de integración crea dos tenants con datos
homónimos, autentica como cada uno, y confirma que ninguna query —
ORM ni SQL crudo — devuelve datos del otro tenant (prueba tanto
`Repository Base` como RLS trabajando juntos, no uno sin el otro).

### Hito 3 — Observabilidad (paralelizable entre sí, requiere H1-H2)

- **Logging Framework** ([07 §2](./07-observabilidad-y-gobernanza.md#2-logging-framework)):
  depende de Environment Manager (H1) + Security Context (H2, para
  enriquecer cada línea con `tenantId`/`requestId`).
- **Health Checks** ([07 §4](./07-observabilidad-y-gobernanza.md#4-health-checks)):
  depende de las conexiones ya establecidas en H0-H1.
- **Metrics** ([07 §5](./07-observabilidad-y-gobernanza.md#5-metrics)):
  depende del Kernel (H1) para el interceptor global de `core/http`.
- **Monitoring** ([07 §6](./07-observabilidad-y-gobernanza.md#6-monitoring)):
  depende de Metrics + Logging (mismo hito, se cierra al final).
- **Audit Framework** ([07 §1](./07-observabilidad-y-gobernanza.md#1-audit-framework)):
  la escritura ya la hace el trigger de Postgres (ver §3 de este
  documento) — el trabajo de aplicación es la capa de **lectura**
  (consultas sobre `core.audit_logs` con el filtro de tenant ya
  activo desde H2) y la suscripción a eventos de plataforma
  (`policy.denied`, `license.limit-exceeded`) que todavía no existen
  hasta H5 — su cobertura completa se cierra ahí, no aquí.

**Listo cuando:** `/health/live` y `/health/ready` distinguen
correctamente un Postgres caído (ready falla, live no), un log
estructurado incluye `tenantId`/`requestId` correlacionado con una
traza, y una consulta de auditoría filtrada por tenant no ve entradas
de otro tenant (mismo test de aislamiento de H2, aplicado ahora a
`audit_logs`).

### Hito 4 — Mensajería y trabajos (requiere H1-H3)

- **Event Bus** ([06 §1-3](./06-eventos-y-mensajeria.md)): depende de
  RabbitMQ (H0) — implementa Domain Events + Event Bus + Message
  Broker como una unidad, tal como están documentados juntos.
- **Queue Manager (Background Jobs)** ([08 §6](./08-frameworks-de-infraestructura.md#6-background-jobs)):
  depende de Event Bus (mismo transporte, colas separadas) +
  Logging Framework (H3).
- **Scheduler** ([08 §5](./08-frameworks-de-infraestructura.md#5-scheduler)):
  depende de Cache Framework (H1, lock distribuido) + Queue Manager
  (encola el trabajo real).
- **File Manager** ([08 §3](./08-frameworks-de-infraestructura.md#3-file-manager)):
  depende de Storage Manager (H1).
- **Template Engine** ([08 §4](./08-frameworks-de-infraestructura.md#4-template-engine)):
  depende de File Manager (mismo hito).
- **Notification Center** ([06 §4](./06-eventos-y-mensajeria.md#4-notification-center)):
  depende de Template Engine + Queue Manager + File Manager — se
  construye al cierre de este hito.

**Listo cuando:** un evento de dominio publicado por un test dispara
un job en `core.background_jobs` que efectivamente cambia de estado
(`queued` → `succeeded`) y una notificación de prueba aparece en
`core.notifications` con el canal/idioma correctos.

### Hito 5 — Motores de negocio (requiere H2-H4)

Incluye los 2 prerrequisitos silenciosos identificados en §2 que el
Workflow Engine necesita:

- **Business Rules Engine** ([05 §1](./05-motores-de-logica-de-negocio.md#1-business-rules-engine)):
  depende de `core.business_rules`/`business_rule_evaluations`
  (ya creadas en SQL) + Audit Framework (H3).
- **State Machine** ([05 §6](./05-motores-de-logica-de-negocio.md#6-state-machine)):
  depende de Audit Framework (H3) + Domain Events (H4).
- **Policy Engine** ([05 §3](./05-motores-de-logica-de-negocio.md#3-policy-engine)):
  depende de Security Context (H2) — nota de gobernanza ya fijada en
  el documento original: **no** implementa ABAC, solo RBAC + el punto
  de extensión, hasta que exista el ADR correspondiente.
- **Workflow Engine** ([05 §4](./05-motores-de-logica-de-negocio.md#4-workflow-engine)):
  depende de Business Rules Engine + State Machine + Event Bus (H4) +
  Queue Manager (H4).
- **Approval Engine** ([05 §5](./05-motores-de-logica-de-negocio.md#5-approval-engine)):
  depende de Workflow Engine (mismo hito, al cierre) + Policy Engine +
  Notification Center (H4).

**Listo cuando:** un workflow de prueba de 3 pasos con una condición
de transición (Business Rules Engine) avanza correctamente, y una
aprobación de prueba rechaza a un aprobador sin permiso suficiente
(Policy Engine bloqueando antes de que la decisión se registre).

### Hito 6 — Continuidad operativa (requiere H1, H4)

- **Backup** ([11 §1](./11-resiliencia-y-continuidad.md#1-backup-manager)):
  depende de Storage Manager (H1) + Encryption Utilities (H1,
  Shared Utilities) + Scheduler (H4).
- **Restore** ([11 §2](./11-resiliencia-y-continuidad.md#2-restore-manager)):
  depende de Backup (mismo hito) + Scheduler (H4).

Nota: gran parte de este hito ya está resuelto como procedimiento de
infraestructura en `docs/database/08-estrategia-respaldo.md` y
`docs/database/sql/30_backup_restore.sql` — el trabajo de aplicación
aquí es enganchar `Scheduler` a esos procedimientos ya diseñados, no
diseñar backup/restore de nuevo.

**Listo cuando:** el job `nightly-restore-test` (ya definido en
`31-infraestructura-completa.md §8`) corre de punta a punta contra el
entorno local y reporta éxito vía `Notification Center`.

## 5. Resumen visual del orden

```
H0 Bootstrap
 └─▶ H1 Shared Utilities · Configuration · Cache · Storage · Kernel
      └─▶ H2 Base Entity/Repository Base · Security Context · MultiTenant/Company/Branch
           ├─▶ H3 Logging · Health · Metrics · Monitoring · Audit
           │    └─▶ H4 Event Bus · Queue Manager · Scheduler · File Manager · Template Engine · Notification Center
           │         └─▶ H5 Business Rules Engine · State Machine · Policy Engine · Workflow Engine · Approval Engine
           │              └─▶ H6 Backup · Restore
```

## 6. Qué queda fuera de este plan a propósito

Los 72 componentes de `32-core-platform/` incluyen 49 que el pedido de
Fase 2 no menciona (License Manager, Feature Flags, Localization
completa, Aggregate Root como concepto, etc.). No se agregan aquí por
iniciativa propia — cuando el usuario confirme que Fase 2 avanza a
esos componentes, o cuando un módulo de negocio (Ventas, Inventario)
los necesite como prerrequisito real, se planifica esa extensión
siguiendo el mismo criterio de este documento: dependencias primero,
nunca alfabético ni por conveniencia.
