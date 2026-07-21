# Domain-Driven Design — GORAZUS ERP

> Fase 6 (DDD), 2026-07-21. Arquitectura de dominio completa —
> Bounded Contexts, Context Map, lenguaje ubicuo, y el modelado táctico
> completo (Aggregates, Entities, Value Objects, Domain Events, Domain
> Services, Repositories, Factories, Specifications, Application
> Services) sobre los 29 módulos de negocio y el Core Platform ya
> diseñados. Cero SQL, cero código, cero tabla nueva, cero cambio a
> documentación previa — esta carpeta es una capa de vocabulario y
> estructura DDD sobre un modelo de datos y una arquitectura que ya
> existían (`docs/architecture/`, `docs/database/`).

## Cómo leer este set de documentos

Sigue el orden numérico: primero la parte **estratégica** (01-03 —
dónde están las fronteras y cómo se llaman las cosas), después el
**modelado táctico** (04-11 — los bloques de construcción dentro de
cada frontera), después la **coordinación entre contextos** (12-16 —
cómo se orquestan y comunican), y por último las **reglas invariables
y la síntesis** (17-20).

| #   | Documento                                                    | Contenido                                                                                                                                             |
| --- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [01_bounded_contexts.md](./01_bounded_contexts.md)           | Los 29 módulos + Core Platform, clasificados Core/Supporting/Generic Subdomain, con objetivo/límites/dependencias/eventos por contexto                |
| 2   | [02_context_map.md](./02_context_map.md)                     | Patrones de comunicación (_Customer/Supplier_, _Partnership_, _Shared Kernel_, _OHS/PL_, _ACL_, _Separate Ways_) aplicados a las reglas ya existentes |
| 3   | [03_ubiquitous_language.md](./03_ubiquitous_language.md)     | Glosario de negocio por contexto (Factura, Kardex, FIFO, Asiento Contable, ...)                                                                       |
| 4   | [04_aggregates.md](./04_aggregates.md)                       | ~33 Aggregate Roots sobre las 501 tablas reales, con invariante y evento por agregado                                                                 |
| 5   | [05_entities.md](./05_entities.md)                           | 7 patrones de entidad hija recurrentes (líneas, historial de estado, movimientos, ...)                                                                |
| 6   | [06_value_objects.md](./06_value_objects.md)                 | Dinero/Porcentaje/RangoFecha detallados + 7 Value Objects nuevos (Dirección, Cantidad, Impuesto, ...)                                                 |
| 7   | [07_domain_events.md](./07_domain_events.md)                 | Catálogo completo de eventos de dominio por contexto, con trazabilidad ✅ ya existía / 🆕 nuevo                                                       |
| 8   | [08_domain_services.md](./08_domain_services.md)             | CalcularCostoPromedio, AplicarFIFO, CalcularImpuestos, GenerarAsientoContable, ActualizarInventario, GenerarFactura, AplicarDescuento                 |
| 9   | [09_repositories.md](./09_repositories.md)                   | Un repositorio por Aggregate Root, sobre `Repository Base`                                                                                            |
| 10  | [10_factories.md](./10_factories.md)                         | 6 Factories para construcción de agregados complejos (gap nuevo)                                                                                      |
| 11  | [11_specifications.md](./11_specifications.md)               | 10 reglas de negocio reutilizables y combinables                                                                                                      |
| 12  | [12_application_services.md](./12_application_services.md)   | Catálogo representativo de casos de uso por contexto                                                                                                  |
| 13  | [13_integration_events.md](./13_integration_events.md)       | Reconciliación Domain Event ↔ `event_code` contable + 4 coreografías multi-paso                                                                       |
| 14  | [14_anti_corruption_layer.md](./14_anti_corruption_layer.md) | Las 5 fronteras externas (Facturación Electrónica, Bancos, Pasarelas, Marketplace, IA)                                                                |
| 15  | [15_shared_kernel.md](./15_shared_kernel.md)                 | Referencia al Shared Kernel existente + 3 candidatos nuevos pendientes de ADR                                                                         |
| 16  | [16_domain_policies.md](./16_domain_policies.md)             | 12 políticas globales de negocio (P1-P12)                                                                                                             |
| 17  | [17_invariants.md](./17_invariants.md)                       | 21 reglas que nunca pueden romperse (I1-I21)                                                                                                          |
| 18  | [18_business_capabilities.md](./18_business_capabilities.md) | Mapa de capacidades de negocio para stakeholders no técnicos                                                                                          |
| 19  | [19_module_dependencies.md](./19_module_dependencies.md)     | Grafo completo de dependencias, 6 niveles, cero ciclos                                                                                                |
| 20  | [20_architecture_summary.md](./20_architecture_summary.md)   | Síntesis + evaluación de preparación para CQRS/Event Sourcing/Workflow/BRE/DW/BI/IA                                                                   |

## Relación con la documentación existente

Este set **no reemplaza ni duplica** nada de lo ya existente:

- [docs/architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md)
  ya diseñaba Security Context, Transaction Manager, Repository Base,
  Base Entity, Aggregate Root, Value Objects y Shared Kernel — esta
  carpeta los referencia y los aplica, no los rediseña.
- [docs/database/TABLE_CATALOG.md](../database/TABLE_CATALOG.md) es la
  fuente de verdad de las 501 tablas reales sobre las que se
  identificaron los Aggregate Roots.
- [docs/architecture/12-backend-enterprise.md §6.3](../architecture/12-backend-enterprise.md#63-catálogo-representativo-de-eventos-por-módulo-nuevo)
  tenía el catálogo "representativo, no exhaustivo" de eventos —
  [07_domain_events.md](./07_domain_events.md) es la versión completa.

## Trazabilidad

Ver [20_architecture_summary.md §5](./20_architecture_summary.md#5-trazabilidad-global-de-la-fase-6)
para la declaración de trazabilidad completa de toda la fase.
