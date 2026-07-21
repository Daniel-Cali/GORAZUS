# 32.09 — Base transaccional y modelado DDD

> Componentes: Security Context, Transaction Manager, Unit Of Work,
> Repository Base, Base Entity, Aggregate Root, Value Objects, Shared
> Kernel.

## 1. Security Context

**Trazabilidad:** 📎 Referencia — diseño completo ya existente:
`UserContext`/`TenantId`/`AuditMeta` como Shared Kernel en
[06-comunicacion-entre-modulos.md §3](../06-comunicacion-entre-modulos.md#3-shared-kernel),
`TenantInterceptor` en
[09-seguridad-y-multiempresa.md §3](../09-seguridad-y-multiempresa.md#3-multiempresa-multi-tenant).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia — contexto inmutable por request (actor, tenant,
  company/branch activa, idioma, `requestId`) propagado vía
  `AsyncLocalStorage`.
- **Dependencias:** `Tenant Manager`, `Language Manager`.
- **Interfaces:** `SecurityContext.current()`.
- **Eventos:** ninguno.
- **Comunicación con otros componentes:** es el componente más
  ampliamente consumido de todo el Core Platform — `Repository Base`,
  `Policy Engine`, `Audit Framework`, `Logging Framework`,
  `Tracing` y prácticamente todo motor de este documento lo leen.
- **Estrategias de seguridad:** inmutable durante el ciclo de vida del
  request — ningún componente puede alterar el actor o tenant activo a
  mitad de una operación.
- **Estrategias de rendimiento:** una sola resolución por request,
  lectura posterior sin I/O.
- **Estrategias de escalabilidad:** vive en memoria del proceso vía
  `AsyncLocalStorage`, sin estado compartido entre réplicas.

## 2. Transaction Manager

**Trazabilidad:** 🔗 Extiende diseño existente — `core/database/
transaction-manager.ts` nombrado, con la convención ya fijada de que
las transacciones se abren/cierran únicamente en la capa de
`services/`, nunca en repositorios ni controllers
([12-backend-enterprise.md §1.3](../12-backend-enterprise.md),
[02-arquitectura-modulos-backend.md §3](../02-arquitectura-modulos-backend.md)).

- **Objetivo:** garantizar atomicidad de operaciones que escriben en
  más de una tabla (o disparan más de un efecto persistente) dentro
  del mismo módulo — si cualquier paso falla, ningún cambio parcial
  queda persistido.
- **Responsabilidad:** exponer el mecanismo de apertura/commit/rollback
  de transacción de Postgres a través de Prisma, con la regla explícita
  de que **una transacción nunca cruza los límites de un módulo** —
  si una operación de negocio necesita efectos consistentes en dos
  módulos distintos, ese es exactamente el caso que resuelve
  `Domain Events` con consistencia eventual, no una transacción
  distribuida (principio ya fijado en
  [06-comunicacion-entre-modulos.md](../06-comunicacion-entre-modulos.md),
  "sin transacciones distribuidas implícitas").
- **Dependencias:** `core/database` (cliente Prisma).
- **Interfaces:** `TransactionManager.run(callback)` — el callback
  recibe un cliente Prisma transaccional que los repositorios usan
  para esa unidad de trabajo específica.
- **Eventos:** ninguno directo — los `Domain Events` que resultan de la
  operación se publican **después** del commit exitoso, nunca dentro
  de la transacción (para no publicar un evento sobre un cambio que
  termina revertido por un rollback).
- **Flujo interno:** el `service` de un módulo abre la transacción,
  invoca uno o más métodos de `Repository Base`/repositorios
  concretos dentro de ese callback, y si todos completan sin excepción,
  hace commit; cualquier excepción dispara rollback automático antes de
  propagarse al `Exception Framework`.
- **Comunicación con otros componentes:** `Unit Of Work` (§3) es la
  vista de dominio de este mismo mecanismo — ver la aclaración de
  terminología ahí para no introducir dos patrones compitiendo por el
  mismo concepto.
- **Estrategias de seguridad:** no aplica directamente.
- **Estrategias de rendimiento:** transacciones cortas (el patrón
  correcto es abrir, hacer el mínimo trabajo necesario, cerrar — nunca
  mantener una transacción abierta mientras se espera una llamada de
  red externa, p. ej. `Notification Center` o `File Manager` se
  invocan siempre después del commit).
- **Estrategias de escalabilidad:** transacciones cortas minimizan
  contención de locks en Postgres bajo concurrencia alta — mismo
  principio que justifica el diseño de `Sequence Generator`.

## 3. Unit Of Work

**Trazabilidad:** 🔗 Extiende diseño existente, con nota de
terminología explícita.

**Nota de terminología (para no introducir un patrón competidor):** el
gap analysis de este documento encontró que "Unit of Work" no está
documentado bajo ese nombre en ningún lugar — funcionalmente coincide
con `Transaction Manager` (§2), que ya tiene convención fijada. En
DDD clásico, **Unit of Work** es el patrón (agrupar operaciones que
deben confirmarse o revertirse juntas) y **Transaction Manager** es
uno de sus mecanismos de implementación posibles. GORAZUS no necesita
dos componentes de código separados — `Transaction Manager` **es** la
implementación del patrón Unit of Work en esta arquitectura. Esta
entrada existe para dejar constancia explícita de esa equivalencia (y
así satisfacer la lista de 72 componentes solicitada) sin crear una
segunda abstracción redundante que confundiría a futuros
desarrolladores sobre cuál usar.

- **Objetivo / Responsabilidad:** idénticos a `Transaction Manager`
  §2 — no se repiten.
- **Dependencias / Interfaces / Eventos / Flujo interno / Comunicación
  / Seguridad / Rendimiento / Escalabilidad:** ver `Transaction
Manager` §2.

## 4. Repository Base

**Trazabilidad:** 📎 Referencia — diseño completo ya existente:
`base.repository.ts` con inyección automática de filtro de tenant en
[12-backend-enterprise.md §1.3, §3](../12-backend-enterprise.md) y
[09-seguridad-y-multiempresa.md §3](../09-seguridad-y-multiempresa.md#3-multiempresa-multi-tenant).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia — clase base que todo repositorio concreto de
  módulo extiende, con `findMany`/`findOne`/`create`/`update` que
  aplican automáticamente el filtro `(tenant_id[, company_id][,
branch_id])` según el nivel de alcance declarado por la entidad (ver
  `Multi Company`/`Multi Branch`,
  [02-multiempresa-y-alcance-organizacional.md](./02-multiempresa-y-alcance-organizacional.md)).
- **Dependencias:** `Tenant Manager`, `Security Context`,
  `Transaction Manager` (opera dentro del cliente Prisma que la
  transacción activa provee).
- **Interfaces:** métodos CRUD genéricos + hook de extensión para
  queries específicas de cada módulo concreto.
- **Eventos:** ninguno directo — el `service` que lo invoca es quien
  decide qué eventos de dominio publicar tras una escritura exitosa.
- **Comunicación con otros componentes:** `Audit Framework` intercepta
  aquí toda escritura para registrar el cambio; `Aggregate Root` (§6)
  es el tipo de entidad que normalmente encapsula el acceso a través
  de un repositorio (un repositorio por Aggregate Root, no por tabla
  individual, cuando el agregado abarca varias tablas).
- **Estrategias de seguridad:** el filtro de tenant/company/branch es
  inescapable — no existe un método "raw" que lo omita sin pasar por
  el mecanismo explícito y auditado de `@AllowCrossTenant()`
  mencionado en `Tenant Manager`
  ([02-multiempresa-y-alcance-organizacional.md §1](./02-multiempresa-y-alcance-organizacional.md#1-tenant-manager)).
- **Estrategias de rendimiento:** los filtros inyectados usan siempre
  los índices compuestos ya diseñados en el modelo de datos, nunca
  provocan table scan.
- **Estrategias de escalabilidad:** sin estado — cada instancia de
  backend construye sus propios repositorios contra el mismo pool de
  conexión de Postgres.

## 5. Base Entity

**Trazabilidad:** 📎 Referencia — el componente de mayor riesgo de
duplicación de todo este documento: las 18 columnas universales, con
su justificación completa, ya están especificadas en
[database/01-modelo-conceptual.md §1.1](../../database/01-modelo-conceptual.md#11-columnas-universales).
**No se repite el listado de columnas aquí.**

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia.
- **Dependencias:** `Audit Framework` (las columnas de auditoría de
  `Base Entity` son precisamente lo que `Audit Framework` consume
  automáticamente en cada escritura).
- **Interfaces:** clase/tipo base que toda entidad de dominio de todo
  módulo extiende — enforced por convención de código y por el propio
  `Repository Base`, que asume la presencia de estas columnas.
- **Eventos:** ninguno directo.
- **Comunicación con otros componentes:** es el fundamento estructural
  de `Repository Base` (§4), `State Machine`
  ([05-motores-de-logica-de-negocio.md §6](./05-motores-de-logica-de-negocio.md#6-state-machine)),
  y `Audit Framework` — los tres asumen su existencia sin excepción en
  toda tabla de negocio.
- **Estrategias de seguridad:** el soft-delete (parte de las columnas
  universales) es la única forma permitida de "eliminar" un registro
  de negocio — nunca `DELETE` físico fuera de los procesos de
  purga/retención legal explícitamente diseñados.
- **Estrategias de rendimiento / escalabilidad:** ver
  `database/01-modelo-conceptual.md §1.1` y la estrategia de
  particionamiento asociada.

## 6. Aggregate Root

**Trazabilidad:** 📎 Referencia — sustancial conceptualmente: el
patrón "módulo dueño" es la implementación DDD-táctica de Aggregate
Root en GORAZUS, ya nombrado en el catálogo de patrones
([00-arquitectura-general.md §3.2](../00-arquitectura-general.md)) y
en [06-comunicacion-entre-modulos.md §4](../06-comunicacion-entre-modulos.md#4-patrón-módulo-dueño).
No existe una clase base literal `AggregateRoot` distinta de
`Base Entity` — se referencia el patrón existente, no se renombra.

- **Objetivo:** delimitar el límite de consistencia transaccional —
  qué conjunto de entidades relacionadas se modifican siempre juntas,
  dentro de una única transacción, a través de un único punto de
  entrada (el repositorio del módulo dueño).
- **Responsabilidad:** cada módulo dueño decide cuál de sus entidades
  es la raíz del agregado (p. ej. `Venta` es raíz, `VentaLinea` es
  parte del agregado y nunca se modifica sin pasar por `Venta`); el
  Core Platform no impone una clase base adicional — `Base Entity`
  (§5) ya cubre la parte estructural, y el patrón módulo-dueño ya
  cubre la parte de encapsulamiento de escritura.
- **Dependencias:** `Base Entity`, `Repository Base`,
  `Transaction Manager` (toda modificación de un agregado ocurre
  dentro de una única unidad de trabajo).
- **Interfaces:** ninguna interfaz de plataforma adicional — el
  contrato es la convención de que el repositorio del agregado es el
  único punto de escritura, ya enforced por las reglas de import de
  Nx (ninguna entidad "hija" tiene su propio repositorio expuesto
  fuera del módulo).
- **Eventos:** los `Domain Events` se publican a nivel de Aggregate
  Root, nunca de una entidad hija de forma aislada (p. ej.
  `VentaConfirmada`, no `VentaLineaConfirmada`).
- **Flujo interno:** ver `Transaction Manager` §2 — toda operación
  sobre el agregado corre en una transacción que abarca raíz + partes
  relacionadas.
- **Comunicación con otros componentes:** `Master Data`
  ([04-identidad-de-datos.md §5](./04-identidad-de-datos.md#5-master-data))
  es la aplicación de este mismo principio a nivel de comunicación
  entre módulos.
- **Estrategias de seguridad:** las entidades "hija" de un agregado
  nunca son accesibles para escritura directa desde otro módulo, ni
  siquiera vía `metadata` u otro mecanismo lateral.
- **Estrategias de rendimiento:** cargar un agregado completo (raíz +
  partes) en una sola consulta con `include` de Prisma, evitando el
  antipatrón N+1.
- **Estrategias de escalabilidad:** agregados pequeños y bien
  delimitados son lo que permite que, en una eventual extracción a
  microservicio, cada agregado se mueva completo sin partir su
  consistencia transaccional.

## 7. Value Objects

**Trazabilidad:** 🔗 Extiende diseño existente — nombrados como
miembros del Shared Kernel (`Money`, `Porcentaje`, `RangoFecha`) en
[06-comunicacion-entre-modulos.md §3](../06-comunicacion-entre-modulos.md#3-shared-kernel),
pero nunca diseñados en detalle — gap de contenido real.

- **Objetivo:** modelar conceptos de dominio sin identidad propia
  (dos objetos `Money` de igual monto y moneda son intercambiables,
  a diferencia de dos entidades con el mismo `id`), inmutables, y con
  sus propias reglas de validación e igualdad encapsuladas, para
  eliminar la primitiva obsesión (usar `number`/`string` sueltos para
  conceptos con reglas propias) en todo el dominio.
- **Responsabilidad:** cada Value Object del Shared Kernel valida su
  propia invariante en construcción (`Money` rechaza construirse con
  un código de moneda inválido; no permite aritmética entre dos
  `Money` de monedas distintas sin pasar explícitamente por
  `Currency Manager`) y expone operaciones seguras (`Money.add()`,
  `Money.multiply()`) que preservan la invariante de precisión
  decimal exacta (nunca `number` de punto flotante para dinero —
  representación interna como entero de la unidad menor de la moneda,
  o `Decimal` de Prisma, consistente con el tipo `NUMERIC` de
  Postgres).
- **Dependencias:** `Currency Manager` (conversión entre monedas
  distintas), `Money Utilities`
  ([10-utilidades-comunes.md §3](./10-utilidades-comunes.md#3-money-utilities))
  como capa de funciones puras que `Money` usa internamente.
- **Interfaces:** clases inmutables `Money`, `Porcentaje`,
  `RangoFecha`, y las que cada módulo decida promover a Shared Kernel
  a futuro vía el proceso de ADR ya fijado en
  [11-gobernanza-y-adrs.md §4](../11-gobernanza-y-adrs.md).
- **Eventos:** ninguno — los Value Objects son datos, no disparan
  comportamiento por sí mismos.
- **Flujo interno:** construcción validada (constructor privado +
  factory estático que puede fallar con `ValidationException`,
  nunca un constructor público que permita estado inválido); toda
  "modificación" retorna una nueva instancia (inmutabilidad estricta),
  nunca muta el objeto original — el mismo principio que ya aplica
  `Domain Events`.
- **Comunicación con otros componentes:** todo campo de tipo dinero,
  porcentaje o rango de fechas en cualquier DTO/entidad de cualquier
  módulo usa estos Value Objects en vez de tipos primitivos —
  disciplina reforzada por `Validation Engine` (los schemas Zod
  correspondientes viven junto a estas clases en `packages/contracts`).
- **Estrategias de seguridad:** no aplica directamente — la invariante
  de validez es en sí una forma de integridad de datos.
- **Estrategias de rendimiento:** al ser inmutables y sin identidad,
  son comparables por valor de forma barata (comparación estructural,
  no de referencia).
- **Estrategias de escalabilidad:** al vivir en `packages/contracts`
  (leaf del grafo de dependencias, sin dependencia de framework), son
  usables tanto en `backend/` como en `frontend/` sin duplicar la
  lógica de validación entre los dos lenguajes.

## 8. Shared Kernel

**Trazabilidad:** 📎 Referencia — diseño completo, rationale, contenido
y gobernanza (adiciones solo vía ADR) ya existentes en
[06-comunicacion-entre-modulos.md §3](../06-comunicacion-entre-modulos.md#3-shared-kernel)
y [11-gobernanza-y-adrs.md §4](../11-gobernanza-y-adrs.md).

- **Objetivo / Responsabilidad / Flujo interno:** ver diseño completo
  en la referencia — el conjunto mínimo de tipos que todos los
  módulos pueden depender sin pedir permiso, deliberadamente pequeño
  (glosario ya fijado en
  [architecture/README.md §4](../README.md#4-glosario-mínimo)).
- **Dependencias:** ninguna — es un leaf del grafo de dependencias
  (`packages/contracts`, regla ya fijada en
  [01-estructura-monorepo.md §5](../01-estructura-monorepo.md#5-reglas-de-import-enforcement)).
- **Interfaces:** `UserContext`, `TenantId`, `AuditMeta`, `Money`,
  `Porcentaje`, `RangoFecha` — el inventario completo vive en la
  referencia, no se duplica aquí.
- **Eventos:** ninguno.
- **Comunicación con otros componentes:** consumido por
  `Security Context` (§1), `Value Objects` (§7), y en general por todo
  módulo de negocio y todo componente de este documento.
- **Estrategias de seguridad:** su pequeñez deliberada es en sí una
  estrategia de seguridad arquitectónica — cuanto más grande el Shared
  Kernel, más acoplamiento implícito entre módulos que se supone
  independientes.
- **Estrategias de rendimiento:** sin dependencia de framework,
  importable en frontend sin arrastrar peso de NestJS.
- **Estrategias de escalabilidad:** toda adición pasa por ADR
  ([11-gobernanza-y-adrs.md §4](../11-gobernanza-y-adrs.md)) — el
  Shared Kernel no crece por conveniencia puntual de un módulo, lo
  cual preserva la viabilidad de la evolución a microservicios a largo
  plazo.
