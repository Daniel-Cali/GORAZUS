# 32 — Core Platform de GORAZUS ERP

> Especificación oficial del Core Platform. Versión 1.0 — 2026-07-13.
> Complementa, no duplica: donde un componente ya tiene diseño
> substancial en otro documento (p. ej. `Configuration Manager` en
> [12-backend-enterprise.md §7](../12-backend-enterprise.md#7-configuración),
> `Base Entity` en
> [database/01-modelo-conceptual.md §1.1](../../database/01-modelo-conceptual.md#11-columnas-universales)),
> esta especificación referencia esa fuente y documenta únicamente el
> **rol del componente dentro de la plataforma** (quién depende de él,
> qué expone hacia el resto del Core Platform) en vez de re-derivar el
> diseño. Esta verificación se hizo componente por componente antes de
> escribir una sola línea — ver la nota de trazabilidad en cada
> sub-documento.

## 1. Qué es el Core Platform y por qué es distinto de `14-modulo-core.md`

Hay dos cosas llamadas "Core" en GORAZUS y es importante no
confundirlas:

- **`core` de negocio** ([14-modulo-core.md](../14-modulo-core.md)):
  Companies, Branches, Settings, Countries, Currencies, Languages,
  TimeZones, Document Series, Correlatives, Fiscal Years. Es
  **configuración de negocio multiempresa** — datos que un
  administrador funcional edita.
- **Core Platform** (este documento): el **kernel técnico
  transversal** sobre el que corren _todos_ los módulos de negocio —
  contenedor de DI, motores de reglas/workflow/aprobación, bus de
  eventos, frameworks de observabilidad/cache/storage, base
  transaccional DDD (Unit of Work, Repository, Entity, Value Objects),
  utilidades comunes y estrategias de resiliencia. Es **infraestructura
  de código**, no datos que nadie edita desde una pantalla.

El Core Platform **usa** el `core` de negocio (p. ej. el `Tenant
Manager` de este documento opera sobre `core.tenants`, que ya está
diseñado en 14) pero no lo rediseña. La relación es: `core` de negocio
= los datos; Core Platform = el código que les da vida operativa
(inyección de dependencias, eventos, transacciones, cache, auditoría,
resiliencia).

## 2. Alcance y ubicación en el monorepo

Todo componente de infraestructura nuevo definido aquí vive como
carpeta hermana dentro de `core/` (ver
[01-estructura-monorepo.md §2](../01-estructura-monorepo.md#2-árbol-de-carpetas-raíz)),
nunca dentro de `modules/*` ni de `packages/contracts` — excepto los
Value Objects y el Security Context, que por definición de Shared
Kernel ([06-comunicacion-entre-modulos.md §3](../06-comunicacion-entre-modulos.md#3-shared-kernel))
sí viven en `packages/contracts`. El árbol de carpetas completo,
consolidando lo ya existente en `01-estructura-monorepo.md` más lo que
este documento agrega, está en
[12-arbol-de-carpetas.md](./12-arbol-de-carpetas.md).

Las reglas de import de Nx ya fijadas siguen aplicando sin excepción:
`core/*` puede importar `packages/*`, nunca `modules/*`. Ningún
componente del Core Platform puede depender de un módulo de negocio —
la dependencia siempre va en la dirección `modules/* → core/*`, jamás
al revés.

## 3. Estructura de este documento

Los 72 componentes solicitados se agrupan en 11 dominios técnicos.
Cada componente se documenta con las 10 dimensiones fijadas: Objetivo,
Responsabilidad, Dependencias, Interfaces, Eventos, Flujo interno,
Comunicación con otros componentes, Estrategias de seguridad,
Estrategias de rendimiento, Estrategias de escalabilidad.

| #   | Documento                                                                                    | Dominio                               | Componentes                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | [01-kernel-y-composicion.md](./01-kernel-y-composicion.md)                                   | Kernel y composición                  | Application Kernel, Service Container, Dependency Injection, Configuration Manager, Environment Manager, Feature Flags, License Manager                                             |
| 02  | [02-multiempresa-y-alcance-organizacional.md](./02-multiempresa-y-alcance-organizacional.md) | Multiempresa y alcance organizacional | Tenant Manager, Company Manager, Branch Manager, Multi Company, Multi Branch, Multi Warehouse                                                                                       |
| 03  | [03-localizacion-y-globalizacion.md](./03-localizacion-y-globalizacion.md)                   | Localización y globalización          | Localization, Internationalization, Timezone Manager, Currency Manager, Language Manager, Multi Currency, Multi Language, Multi Country                                             |
| 04  | [04-identidad-de-datos.md](./04-identidad-de-datos.md)                                       | Identidad de datos                    | Sequence Generator, Document Numbering, Metadata Manager, Reference Data, Master Data                                                                                               |
| 05  | [05-motores-de-logica-de-negocio.md](./05-motores-de-logica-de-negocio.md)                   | Motores de lógica de negocio          | Business Rules Engine, Validation Engine, Policy Engine, Workflow Engine, Approval Engine, State Machine                                                                            |
| 06  | [06-eventos-y-mensajeria.md](./06-eventos-y-mensajeria.md)                                   | Eventos y mensajería                  | Domain Events, Event Bus, Message Broker, Notification Center                                                                                                                       |
| 07  | [07-observabilidad-y-gobernanza.md](./07-observabilidad-y-gobernanza.md)                     | Observabilidad y gobernanza           | Audit Framework, Logging Framework, Exception Framework, Health Checks, Metrics, Monitoring, Tracing                                                                                |
| 08  | [08-frameworks-de-infraestructura.md](./08-frameworks-de-infraestructura.md)                 | Frameworks de infraestructura         | Cache Framework, Storage Framework, File Manager, Template Engine, Scheduler, Background Jobs                                                                                       |
| 09  | [09-base-transaccional-y-modelado-ddd.md](./09-base-transaccional-y-modelado-ddd.md)         | Base transaccional y modelado DDD     | Security Context, Transaction Manager, Unit Of Work, Repository Base, Base Entity, Aggregate Root, Value Objects, Shared Kernel                                                     |
| 10  | [10-utilidades-comunes.md](./10-utilidades-comunes.md)                                       | Utilidades comunes                    | Common Utilities, Date Utilities, Money Utilities, Number Utilities, String Utilities, Validation Utilities, Encryption Utilities, Compression Utilities, Serialization Utilities   |
| 11  | [11-resiliencia-y-continuidad.md](./11-resiliencia-y-continuidad.md)                         | Resiliencia y continuidad             | Backup Manager, Restore Manager, Disaster Recovery, High Availability, Cluster Support, Scalability Strategy                                                                        |
| 12  | [12-arbol-de-carpetas.md](./12-arbol-de-carpetas.md)                                         | —                                     | Árbol de carpetas completo del Core Platform                                                                                                                                        |
| 13  | [13-plan-de-implementacion-fase-2.md](./13-plan-de-implementacion-fase-2.md)                 | —                                     | Plan de construcción de la Fase 2 (Core Platform pedida por el usuario): orden de hitos, dependencias no listadas explícitamente, y criterio de "listo" por componente — sin código |

7 + 6 + 8 + 5 + 6 + 4 + 7 + 6 + 8 + 9 + 6 = **72 componentes**.

## 4. Convención de trazabilidad usada en cada componente

Para que quede explícito qué es diseño nuevo y qué es referencia a
diseño existente, cada componente abre con una etiqueta:

- **🆕 Diseño nuevo** — el componente no tenía diseño propio; lo que
  sigue es la especificación completa.
- **🔗 Extiende diseño existente** — el componente tenía mención de
  paso o solo las tablas; se referencia esa base y se documenta la
  capa de servicio/flujo que faltaba.
- **📎 Referencia (sin redundancia)** — el componente ya tiene diseño
  sustancial en otro documento; aquí se documenta exclusivamente su
  rol de integración dentro del Core Platform, sin repetir el diseño
  original.

## 5. Cómo leer esto si venís de cero

Orden sugerido: este README → `01` (qué arranca primero: kernel y DI)
→ `09` (la base transaccional que todos los demás componentes usan)
→ `02`-`03` (alcance organizacional y localización, porque casi todo
lo demás filtra por tenant/company/branch/moneda) → el resto según
necesidad puntual → `12` al final, como mapa físico de todo lo
descrito.
