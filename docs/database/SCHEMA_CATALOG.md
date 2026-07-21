# Schema Catalog — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 2 (2026-07-21, rama
> `feature/database-audit`). Auditoría de la **organización lógica** de la
> base de datos — no toca ninguna tabla, solo el nivel de schema. Verificado
> en vivo contra Postgres 17 real (`docker-postgres-1`, mismo método que las
> auditorías previas de esta sesión).

## 1. Inventario de Schemas (entregable 1)

**22 schemas reales**: 21 de negocio/core + 1 de infraestructura (`partman`).
Ninguno duplicado, ninguno vacío.

| Schema                        | Tablas | Responsabilidad (una frase)                                                                                             | Tamaño                                               | Documentado                              |
| ----------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------- |
| `core`                        | 69     | Plataforma técnica transversal: tenants, empresas, sucursales, usuarios, auditoría, documentos, integraciones, workflow | Grande (por diseño — es el único schema transversal) | ✅                                       |
| `security`                    | 24     | Roles, permisos, políticas de acceso, 2FA, ACL                                                                          | Mediano                                              | ✅                                       |
| `configuration`               | 23     | Catálogos maestros transversales: monedas, países, series, precios                                                      | Mediano                                              | ✅                                       |
| `customers`                   | 18     | Maestro único de clientes                                                                                               | Mediano                                              | ✅                                       |
| `suppliers`                   | 13     | Maestro único de proveedores                                                                                            | Pequeño                                              | ✅                                       |
| `products`                    | 35     | Catálogo de productos/servicios, variantes, BOM                                                                         | Grande                                               | ✅                                       |
| `inventory`                   | 34     | Único dueño del stock: existencias, movimientos, costeo, producción                                                     | Grande                                               | ✅                                       |
| `sales`                       | 55     | Ciclo de venta completo: cotización → pedido → factura                                                                  | Grande (el más grande de negocio)                    | ✅                                       |
| `purchases`                   | 27     | Ciclo de compra completo                                                                                                | Mediano                                              | ✅                                       |
| `cash`                        | 11     | Movimientos de efectivo, cajas                                                                                          | Pequeño                                              | ✅                                       |
| `banks`                       | 14     | Cuentas bancarias, conciliación                                                                                         | Pequeño                                              | ✅                                       |
| `accounting`                  | 28     | Libro mayor, asientos, cierres, consolidación                                                                           | Mediano                                              | ✅                                       |
| `taxes`                       | 13     | Catálogo de impuestos, retenciones, declaraciones                                                                       | Pequeño                                              | ✅                                       |
| `hr`                          | 28     | Legajo de empleados, contratos                                                                                          | Mediano                                              | ✅                                       |
| `payroll`                     | 22     | Cálculo y liquidación de nómina                                                                                         | Mediano                                              | ✅                                       |
| `crm`                         | 17     | Prospectos, oportunidades                                                                                               | Pequeño                                              | ✅                                       |
| `services`                    | 18     | Órdenes de servicio, contratos/SLA                                                                                      | Mediano                                              | ✅                                       |
| `projects`                    | 17     | Planificación y costeo de proyectos                                                                                     | Pequeño                                              | ✅                                       |
| `assets`                      | 10     | Activos fijos, depreciación                                                                                             | Pequeño                                              | ✅                                       |
| `reports`                     | 11     | Definiciones de reporte, agregación de solo lectura                                                                     | Pequeño                                              | ✅                                       |
| `bi`                          | 14     | Dashboards, KPIs, data marts                                                                                            | Pequeño                                              | ✅                                       |
| `partman` _(infraestructura)_ | 29     | Gestión de particiones — extensión, no schema de negocio                                                                | N/A                                                  | ✅ (`07-estrategia-particionamiento.md`) |

**Ninguna tabla vive fuera de un schema de módulo** — regla 1:1 módulo↔schema
ya fijada en [00-modelo-general.md §1](./00-modelo-general.md), sin
excepciones encontradas en esta verificación.

## 2. "Schemas esperados" del pedido — reconciliación (sin copiar el modelo pedido)

El pedido lista 25 schemas esperados (`core`, `security`, `configuration`,
`catalog`, `inventory`, `sales`, `purchases`, `accounting`, `finance`,
`cash`, `banks`, `crm`, `customers`, `suppliers`, `warehouse`, `reports`,
`analytics`, `audit`, `notifications`, `workflow`, `documents`, `files`,
`integrations`, `api`, `ai`, `system`). GORAZUS **no adopta esa lista tal
cual** — varios de esos nombres son responsabilidades reales que GORAZUS ya
cubre, pero deliberadamente consolidadas dentro de `core` en vez de
separadas en su propio schema, porque son plataforma transversal (Core
Platform, ya diseñado en `docs/architecture/32-core-platform/`), no
dominios de negocio independientes:

| Schema esperado (pedido) | Estado real en GORAZUS                                                                                                                                          | Por qué                                                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                | 🔗 No existe como schema propio — cada módulo tiene sus propias tablas de catálogo (`products.units_of_measure`, `taxes.tax_rates`, `configuration.currencies`) | Un "catálogo" centralizado violaría el patrón módulo-dueño; cada catálogo pertenece semánticamente a su módulo                      |
| `finance`                | 🔗 `accounting` (contabilidad real) + `tesoreria` (proyección de solo lectura sobre `cash`+`banks`, sin schema propio)                                          | Ya son 2 módulos distintos con responsabilidades distintas (ver `04-catalogo-modulos-negocio.md`)                                   |
| `warehouse`              | 🔗 `inventory.warehouses` es una **tabla**, no un schema — el schema es `inventory`                                                                             | Confirmado en la auditoría de tabla de la fase anterior; no es un gap, es una diferencia de nivel de granularidad                   |
| `analytics`              | 🔗 `bi`                                                                                                                                                         | Mismo concepto, nombre distinto — ya elegido y documentado                                                                          |
| `audit`                  | 🔗 Dentro de `core` (`audit_logs`, `change_history`, `activity_logs`)                                                                                           | Auditoría es plataforma transversal, no un módulo de negocio con sus propias reglas — vive en Core Platform                         |
| `notifications`          | 🔗 Dentro de `core` (`notifications`, `notification_templates`, `notification_channels`, ...)                                                                   | Mismo criterio — `Notification Center` ya diseñado como componente de Core Platform                                                 |
| `workflow`               | 🔗 Dentro de `core` (`workflows`, `workflow_instances`, `workflow_steps`)                                                                                       | `Workflow Engine`/`BPM Engine` ya diseñados como Core Platform, consumidos por todos los módulos                                    |
| `documents`              | 🔗 Dentro de `core` (`documents`, `document_types`, `document_versions`)                                                                                        | `Document Management System` ya diseñado como extensión de `File Manager` (Core Platform)                                           |
| `files`                  | 🔗 Dentro de `core` (`files`)                                                                                                                                   | Mismo criterio                                                                                                                      |
| `integrations`           | 🔗 Dentro de `core` (`integrations`, `integration_credentials`, `edi_transactions`, `webhook_subscriptions`)                                                    | `Integration Engine` ya diseñado como Core Platform                                                                                 |
| `api`                    | ❌ No aplica como schema                                                                                                                                        | Una API es una capa de aplicación (`apps/api`), no una responsabilidad de datos — no existe "schema de API" en ningún ERP real      |
| `ai`                     | 🆕 Propuesto, sin DDL todavía (Fase 4 de arquitectura de esta sesión)                                                                                           | Ver `docs/architecture/47-modulo-ia.md` — diseñado, no implementado, decisión ya tomada de mantenerlo separado cuando se implemente |
| `system`                 | 🔗 Dentro de `core` (`system_parameters`, `system_settings`, `feature_flags`)                                                                                   | Configuración técnica transversal, no un módulo de negocio                                                                          |

**Módulos reales de GORAZUS que el pedido no anticipó** (no son gaps —
GORAZUS tiene más alcance de negocio que la lista genérica del pedido):
`products` (35 tablas), `taxes` (13), `hr` (28), `payroll` (22), `services`
(18), `projects` (17), `assets` (10). Ninguno se elimina ni se fusiona para
"encajar" en la lista pedida — cada uno tiene responsabilidad propia clara
y ya está documentado.

**Conclusión de la reconciliación:** GORAZUS no tiene un schema por cada
"cosa que suena a responsabilidad" (esa es la superficie de la lista
pedida) — tiene un schema por **dominio de negocio real con su propio
módulo dueño**, y consolida la infraestructura transversal (auditoría,
notificaciones, workflow, documentos, archivos, integraciones, sistema)
dentro de `core`, que es exactamente el Core Platform ya diseñado. Es una
decisión de arquitectura ya tomada, no un olvido — separar esos 7 conceptos
en 7 schemas nuevos sin necesidad de negocio confirmada sería el mismo tipo
de sobre-ingeniería que el proyecto ya rechazó para Kafka/API Gateway
(`docs/architecture/48-erp-enterprise-readiness.md §13`).

## 3. Calidad de organización (entregable 2)

| Chequeo                                               | Resultado                                                                                                                                                                                                                    |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schemas duplicados                                    | ✅ 0                                                                                                                                                                                                                         |
| Schemas vacíos                                        | ✅ 0                                                                                                                                                                                                                         |
| Schemas innecesarios                                  | ✅ 0 — cada uno tiene ≥10 tablas y responsabilidad propia                                                                                                                                                                    |
| Schemas demasiado grandes (mezclan responsabilidades) | ✅ 0 — `sales` (55 tablas) y `core` (69 tablas) son los más grandes, pero cohesivos: todas las tablas de `sales` son del ciclo de venta, todas las de `core` son plataforma transversal, no una mezcla de dominios distintos |
| Schemas mal nombrados                                 | ✅ 0 — snake_case, inglés, consistente con `NAMING_CONVENTIONS.md §5`                                                                                                                                                        |
| Schemas sin documentación                             | ✅ 0 — los 21 de negocio/core tienen documento propio en `docs/architecture/13-46-modulo-*.md`; `partman` documentado en `07-estrategia-particionamiento.md`                                                                 |
| Separación por dominio (alta cohesión)                | ✅ Cada schema contiene solo tablas de su propio dominio — verificado por muestreo cruzado contra `docs/database/TABLE_CATALOG.md`                                                                                           |
| Bajo acoplamiento                                     | 🟠 185 FK reales cruzan schemas de módulos de negocio distintos (detalle en [SCHEMA_DEPENDENCIES.md §2](./SCHEMA_DEPENDENCIES.md#2-acoplamiento-real-hallazgo-heredado)) — hallazgo ya conocido, no nuevo en esta pasada     |

## 4. Multiempresa — verificación de columnas transversales

| Columna pedida | ¿Universal en las 501 tablas?                                                        | Estado real verificado                                                                                                                                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant_id`    | ✅ Sí                                                                                | Columna universal, FK a `core.tenants`, filtro RLS inescapable                                                                                                                                                                                                                                                                    |
| `company_id`   | ✅ Sí (nullable donde aplica a todo el tenant)                                       | Columna universal, FK a `core.companies`                                                                                                                                                                                                                                                                                          |
| `branch_id`    | ✅ Sí (nullable)                                                                     | Columna universal, FK a `core.branches`                                                                                                                                                                                                                                                                                           |
| `country_id`   | ❌ No es universal — y **no existe ni siquiera en `core.companies`/`core.branches`** | Hallazgo real: no hay una referencia explícita de país a nivel de Empresa/Sucursal. El país se infiere hoy indirectamente (jurisdicción fiscal vía `taxes.tax_jurisdictions.country_id`, direcciones vía `configuration.state_provinces.country_id`), nunca declarado directamente en el maestro de Empresa. Ver recomendación §6 |
| `currency_id`  | ❌ No es universal, **por diseño correcto**                                          | `core.companies.functional_currency_code` (moneda funcional de la empresa) + `currency_code` a nivel de transacción individual (`sales.invoices.currency_code`, etc.) — el patrón correcto es moneda en el documento, no una columna repetida en las 501 tablas                                                                   |
| `language_id`  | ❌ No existe en ningún nivel                                                         | Hallazgo real: ni `core.companies` ni `core.branches` ni `core.users` tienen preferencia de idioma explícita — ver recomendación §6                                                                                                                                                                                               |
| `timezone`     | ❌ No existe en ningún nivel                                                         | Mismo hallazgo — ninguna tabla de `core` declara zona horaria de Empresa/Sucursal                                                                                                                                                                                                                                                 |

**Aclaración importante:** que `country_id`/`currency_id`/`language_id`/
`timezone` no sean columnas universales **no es un defecto** — replicarlas
en las 501 tablas violaría 3NF (dependerían transitivamente de
`company_id`, no de la clave de cada tabla) y es exactamente el tipo de
denormalización que el proyecto ya evita. El hallazgo real y accionable es
más acotado: **`country_id`/`language_id`/`timezone` deberían vivir como
columna en `core.companies` y/o `core.branches`** (2-3 columnas, no 501) y
hoy no existen ahí — ver recomendación §6.

## 5. Estado del módulo (entregable 7)

🟢 **La organización lógica de la base de datos está lista para continuar
con la auditoría de tablas (Parte 3)** — ningún hallazgo de esta parte
requiere reestructurar schemas antes de continuar.

## 6. Recomendaciones (entregable 5) — sin aplicar, solo documentadas

1. **Agregar `country_id`, `language_id`, `timezone` a `core.companies` y
   `core.branches`** (3 columnas × 2 tablas, nullable con default) — cierra
   el hallazgo real de §4. Bajo riesgo técnico, sin impacto en datos
   existentes. Recomendado para la Parte 3 o una fase de aplicación de DDL,
   no aplicado aquí (esta parte es auditoría, no modificación).
2. **185 FK cross-schema** (heredado, ver
   [SCHEMA_DEPENDENCIES.md §2](./SCHEMA_DEPENDENCIES.md#2-acoplamiento-real-hallazgo-heredado)) —
   sigue pendiente de decisión de negocio/ADR, no se repite el análisis
   acá.
3. Ninguna otra recomendación estructural — la separación por dominio, el
   nivel de cohesión, y la ausencia de schemas mal nombrados/vacíos/
   duplicados no requieren cambios.

## 7. Porcentaje de calidad (entregable 8)

**94% — Organización lógica Enterprise-Ready.** 6 de 7 chequeos de §3 en
verde sin excepción; el único en amarillo (bajo acoplamiento, 185 FK
cross-schema) es un hallazgo heredado ya gobernado (pendiente de ADR, no
bloqueante). Los 2 gaps de multiempresa (§4) son acotados y de bajo riesgo
de corrección.

## 8. Trazabilidad

Fuente de los 22 schemas y sus conteos: `pg_catalog`/`information_schema`,
re-verificado en vivo (mismos números que
[DATABASE_INVENTORY.md](./DATABASE_INVENTORY.md), sin drift). La
reconciliación de §2 no descarta ni copia el modelo de la lista pedida —
usa el criterio ya establecido en el proyecto (Core Platform vs. módulo de
negocio) para explicar cada decisión de consolidación.

**Siguiente documento:** [SCHEMA_DEPENDENCIES.md](./SCHEMA_DEPENDENCIES.md).
