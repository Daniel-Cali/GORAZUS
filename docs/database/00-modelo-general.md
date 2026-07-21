# 00 — Modelo general de la base de datos (vista consolidada)

> Versión 1.0 — 2026-07-13. Igual que
> [docs/architecture/00-arquitectura-general.md](../architecture/00-arquitectura-general.md),
> este documento es un **punto de entrada**, no una fuente de verdad
> paralela: consolida en una sola vista las doce dimensiones del modelo
> conceptual de datos (módulos, entidades, relaciones, dependencias,
> catálogos, tablas maestras, tablas transaccionales, y las estrategias
> de multiempresa, multisucursal, auditoría, seguridad e índices),
> señalando dónde vive el detalle normativo completo. Donde este
> documento y uno numerado (01-11) diverjan, **el documento numerado
> manda**. No contiene una sola línea de SQL — eso vive exclusivamente
> en [sql/](./sql/) y en los documentos de detalle.

## 0. Resumen ejecutivo

El modelo de datos de GORAZUS parte de **un patrón universal de 18
columnas** aplicado sin excepción a las 498 tablas del sistema
([01](./01-modelo-conceptual.md#1-el-patrón-universal-toda-tabla-de-negocio)),
organizado en **21 schemas de Postgres = 21 módulos de negocio**
(mismo límite que la arquitectura de aplicación, ver
[docs/architecture/01](../architecture/01-estructura-monorepo.md)),
con aislamiento multiempresa/multisucursal reforzado a nivel de motor
(Row-Level Security, no solo disciplina de aplicación) y trazabilidad
completa de quién-cambió-qué-cuándo en cuatro capas de auditoría
independientes.

---

## 1. Módulos

Cada módulo de negocio de
[docs/architecture/04-catalogo-modulos-negocio.md](../architecture/04-catalogo-modulos-negocio.md)
tiene un schema físico de Postgres del mismo nombre — el schema **es**
el módulo, sin ambigüedad de propiedad al mirar el nombre completo de
una tabla (`sales.invoices`, nunca una tabla de negocio fuera de un
schema de módulo). Inventario completo con conteo real de tablas por
módulo: [02-modelo-logico §3](./02-modelo-logico.md#3-inventario-completo-por-módulo)
(498 tablas en 21 módulos + `core` fundacional — 494 originales,
3 agregadas por el Core Platform (ver
[32-core-platform/](../architecture/32-core-platform/README.md)) y
1 agregada al diseñar el módulo Proyectos de la Fase 6 (ver
[40-modulo-projects.md](../architecture/40-modulo-projects.md))).

Tres módulos no tienen schema propio por ser vistas de proyección, no
dueños de datos — igual que en la arquitectura de aplicación:
`tesoreria` (vista sobre `cash`+`banks`+`customers`+`suppliers`),
`dashboard` y, salvo sus propias tablas de definición de reporte,
`reports`/`bi` como consumidores de solo lectura del resto (ver
[03-diagrama-relaciones §2](./03-diagrama-relaciones.md#2-diagrama-maestro-relaciones-entre-módulos)).

## 2. Entidades

Las ~350 entidades conceptuales listadas por módulo en
[01-modelo-conceptual §4](./01-modelo-conceptual.md#4-entidades-conceptuales-por-módulo)
se expanden a las 498 tablas físicas aplicando **cuatro patrones
sistemáticos**, nunca de forma ad-hoc
([02-modelo-logico §1](./02-modelo-logico.md#1-cómo-se-pasa-de-350-entidades-conceptuales-a-700-1000-tablas-físicas)):
estado (`_status`/`_status_history`), traducción (`_translations`),
unión N:M (tabla propia con las 18 columnas completas, nunca una tabla
"liviana") y línea de documento (`_line`/`_detail`, nunca array/JSONB).

## 3. Relaciones

Con 498 tablas, un diagrama único es ilegible — se documentan en dos
niveles en
[03-diagrama-relaciones.md](./03-diagrama-relaciones.md): un diagrama
maestro de relaciones entre schemas/módulos, y un diagrama ER por
módulo con las entidades estructurales (encabezados y catálogos
centrales; las tablas de traducción/historial de estado se omiten del
dibujo por ruido visual, pero están completas en el modelo lógico).

Tipos de relación usados de forma consistente en todo el modelo:

| Tipo                                        | Ejemplo                                                     | Regla                                                                                                                 |
| ------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1:N encabezado→línea                        | `sales_orders` → `sales_order_lines`                        | Siempre tabla física separada, nunca array/JSONB (ver §2)                                                             |
| 1:N jerarquía auto-referenciada             | `product_categories` → `product_categories`                 | Un solo nivel de tabla soporta N niveles de jerarquía, sin tabla `subcategories` paralela                             |
| N:M con tabla de unión completa             | `product_variant_attribute_values`, `sales_route_customers` | La tabla de unión lleva las 18 columnas universales, nunca una tabla liviana sin auditoría                            |
| Referencia cruzada entre módulos **sin FK** | `sales.invoices.customer_id` → `customers.customers.id`     | ID suelto, nunca constraint de FK real — ver §4                                                                       |
| FK real hacia `core.*`                      | Toda tabla → `core.tenants/companies/branches/users`        | Única excepción a "no FK entre schemas" — ver [01 §1.5](./01-modelo-conceptual.md#15-excepción-a-no-fk-entre-schemas) |

## 4. Dependencias

Las dependencias entre módulos de datos son **direccionales y
declaradas**, y reflejan exactamente el mismo grafo que las
dependencias de código de
[docs/architecture/04](../architecture/04-catalogo-modulos-negocio.md#mapa-de-dependencias-entre-módulos)
— no son dos modelos distintos que puedan divergir.

- **Fundacional, sin excepción**: `core`, `security`, `configuration`.
  Toda tabla de cualquier schema depende de `core` (FK real hacia
  `tenants`/`companies`/`branches`/`users`); ningún módulo de negocio
  es dependencia de `core`.
- **Regla dura de no-duplicación**: antes de crear una tabla se
  verifica la tabla de propiedad de
  [01-modelo-conceptual §3](./01-modelo-conceptual.md#3-regla-de-no-duplicación-entre-módulos)
  — cada concepto (catálogo de bancos, tasas de impuesto, geografía,
  documentos adjuntos, series de numeración) tiene **un** módulo dueño
  y el resto solo referencia.
- **Sin ciclos**: si `A` depende de `B`, `B` nunca depende de `A` — un
  ciclo de dependencia entre schemas es un error de diseño, no una
  advertencia (mismo principio que
  [docs/architecture/06 §1](../architecture/06-comunicacion-entre-modulos.md#1-dos-formas-de-comunicación-y-solo-dos)
  aplicado al modelo de datos).
- **Sin transacciones distribuidas**: una operación que afecta a
  `ventas`+`inventario`+`caja` nunca abre una transacción de Postgres
  que cruce schemas — cada módulo confirma su propia transacción local
  ([docs/architecture/05 §4](../architecture/05-flujo-de-datos.md#4-escrituras-que-cruzan-módulos-sin-transacciones-distribuidas)).

## 5. Catálogos

**Criterio de clasificación** (nuevo — no existía como categoría
explícita transversal hasta este documento; ver también §7 para la
tabla comparativa completa): una tabla es **catálogo** cuando (a) sus
filas son valores de referencia relativamente estables en el tiempo,
(b) su tasa de escritura es baja (altas/bajas ocasionales, casi nunca
`UPDATE` de negocio), y (c) es consumida por lectura desde muchas
tablas maestras/transaccionales de uno o varios módulos.

| Módulo dueño                  | Catálogos representativos                                                                                                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `configuration`               | `currencies`, `countries`, `state_provinces`, `municipalities`, `payment_forms`, `payment_methods`, `banks` (catálogo de entidades financieras), `numbering_series`, `languages`, `timezones`, `holidays` |
| `taxes`                       | `taxes`, `tax_rates`, `tax_jurisdictions`                                                                                                                                                                 |
| `products`                    | `units_of_measure`, `unit_conversions`, `colors`, `sizes`, `materials` (vía sistema de atributos genérico)                                                                                                |
| `core`                        | `roles`, `permissions`, `document_types`, `template` (plantillas de notificación/documento)                                                                                                               |
| `accounting`                  | `account_types`, `cost_centers` (bajo mantenimiento, pero conceptualmente catálogo)                                                                                                                       |
| Cualquier módulo con workflow | `<entidad>_status` (ver §2/§7 — patrón de estado)                                                                                                                                                         |

Los catálogos **nunca se duplican entre módulos** (regla de §4); un
módulo que necesita un catálogo ajeno lo referencia por ID, nunca
copia sus valores.

## 6. Tablas maestras

**Criterio**: una tabla es **maestra** cuando representa un sujeto u
objeto de negocio con identidad propia, ciclo de vida largo (se crea
una vez, se actualiza con moderada frecuencia, rara vez se borra
físicamente) y es el punto de referencia que las tablas transaccionales
citan repetidamente. A diferencia del catálogo, la maestra tiene
alcance de tenant/empresa (no es un valor de referencia global) y
suele tener sub-entidades propias (contactos, direcciones, historial).

| Módulo dueño | Maestras representativas                                         |
| ------------ | ---------------------------------------------------------------- |
| `customers`  | `customers`                                                      |
| `suppliers`  | `suppliers`                                                      |
| `products`   | `products`, `product_variants`                                   |
| `inventory`  | `warehouses`                                                     |
| `hr`         | `employees`                                                      |
| `banks`      | `bank_accounts`                                                  |
| `assets`     | `fixed_assets`                                                   |
| `accounting` | `chart_of_accounts`                                              |
| `crm`        | `prospects` (mientras no se convierten en `customers.customers`) |

Todo `<módulo dueño>` de una maestra sigue el patrón "módulo dueño"
completo: nadie fuera de ese módulo la escribe, aunque muchos la lean
(ver
[docs/architecture/06 §4](../architecture/06-comunicacion-entre-modulos.md#4-patrón-módulo-dueño-para-entidades-compartidas)).

## 7. Tablas transaccionales

**Criterio**: una tabla es **transaccional** cuando registra un hecho
de negocio ocurrido en un momento del tiempo — alta tasa de creación
(`INSERT`), prácticamente inmutable una vez confirmada (correcciones
son nuevos registros — nota de crédito, no `UPDATE` del monto
original), y candidata natural a alto volumen/partición
([07-estrategia-particionamiento.md](./07-estrategia-particionamiento.md)).

| Módulo dueño | Transaccionales representativas                      | Patrón físico aplicado                                 |
| ------------ | ---------------------------------------------------- | ------------------------------------------------------ |
| `sales`      | `quotes`, `sales_orders`, `invoices`, `credit_notes` | encabezado+línea, `_status_history`                    |
| `purchases`  | `purchase_orders`, `purchase_invoices`               | encabezado+línea, `_status_history`                    |
| `inventory`  | `stock_movements`, `stock_transfers`                 | alto volumen, candidata a BRIN/partición               |
| `cash`       | `cash_movements`                                     | alto volumen                                           |
| `banks`      | `bank_statement_lines`, `bank_reconciliations`       | alto volumen                                           |
| `accounting` | `journal_entries`, `journal_entry_lines`             | alto volumen, candidata a partición por período fiscal |
| `payroll`    | `payroll_entries`, `payroll_entry_lines`             | periódico, alto volumen agregado                       |
| `core`       | `audit_logs`, `activity_log`                         | el mayor volumen de todo el sistema — ver §10          |

### 7.1 Comparación consolidada: catálogo vs. maestra vs. transaccional

| Dimensión                                                                                            | Catálogo                      | Maestra                | Transaccional                                               |
| ---------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------- | ----------------------------------------------------------- |
| Frecuencia de escritura                                                                              | Muy baja                      | Media                  | Alta (a veces muy alta)                                     |
| Volumen esperado                                                                                     | Bajo (decenas-miles de filas) | Medio (miles-millones) | Alto a muy alto (millones-cientos de millones)              |
| Mutabilidad                                                                                          | Casi inmutable                | Actualizable           | Inmutable tras confirmación (correcciones = nuevo registro) |
| Alcance típico                                                                                       | Global (sentinela) o tenant   | Tenant/empresa         | Tenant/empresa/sucursal                                     |
| `_status_history` (§2)                                                                               | No                            | Rara vez               | Frecuente en documentos con workflow                        |
| Candidata a partición (ver [07-estrategia-particionamiento.md](./07-estrategia-particionamiento.md)) | No                            | Rara vez               | Sí, las de mayor volumen                                    |
| Ejemplo                                                                                              | `configuration.currencies`    | `customers.customers`  | `sales.invoices`                                            |

> Nota de mantenimiento: esta clasificación es conceptual y transversal
> — no se materializa hoy como columna/tag dentro de cada tabla en
> `logico/*.md`. Se identifica como mejora de navegabilidad pendiente,
> no bloqueante (ver §13).

## 8. Estrategia multiempresa

Jerarquía de tres niveles **Tenant → Company → Branch**
([01-modelo-conceptual §2](./01-modelo-conceptual.md#2-jerarquía-de-aislamiento-tenant--company--branch)),
donde **Company** es la unidad de multiempresa: cada empresa legal
dentro de un tenant tiene su propio RFC/identificación fiscal, plan de
cuentas y ejercicio fiscal. Mecanismo de aplicación en dos capas
independientes, deliberadamente redundantes:

1. **Columna `company_id` nulable** en las 498 tablas — `NULL`
   significa "aplica a todo el tenant" (p. ej. un parámetro de sistema
   compartido entre empresas del mismo grupo).
2. **Row-Level Security** (`company_isolation` policy) a nivel de
   Postgres — un usuario solo ve filas de las empresas a las que tiene
   acceso concedido vía `core.user_companies` (relación N:M: un
   contador puede atender varias pymes con una sola cuenta), resuelto
   por `core/http` (`TenantInterceptor`) al inicio de cada request y
   nunca confiado a un parámetro que el cliente pueda manipular. Detalle
   completo: [06-estrategia-seguridad §1](./06-estrategia-seguridad.md#1-row-level-security-el-mecanismo-central-de-aislamiento-multiempresa).

La combinación de ambas capas es intencional: la columna sola depende
de disciplina de aplicación (`WHERE` correcto en cada query); RLS sola
sin la columna no tendría qué filtrar. Juntas convierten un bug de
aplicación de "fuga de datos entre empresas" en "cero filas devueltas".

## 9. Estrategia multisucursal

Tercer nivel de la misma jerarquía: **Branch** dentro de **Company**
([01 §2](./01-modelo-conceptual.md#2-jerarquía-de-aislamiento-tenant--company--branch)).
Igual semántica que `company_id`: columna `branch_id` nulable en las
498 tablas (`NULL` = aplica a toda la empresa, no a una sucursal
específica), consumida de forma natural por las entidades que
operativamente son por sucursal — `inventory.warehouses`,
`cash.cash_registers`, `configuration.numbering_series` (correlativos
de facturación por punto de venta), `hr.employees` (sucursal de
asignación).

**Gap identificado y resuelto en este documento (a nivel conceptual, no
SQL):** [06-estrategia-seguridad §1](./06-estrategia-seguridad.md#1-row-level-security-el-mecanismo-central-de-aislamiento-multiempresa)
documenta explícitamente las políticas RLS `tenant_isolation` y
`company_isolation`, pero **no** una política `branch_isolation`
equivalente. Para que multisucursal tenga la misma garantía a nivel de
motor que multiempresa (y no dependa de disciplina de aplicación,
contradiciendo el principio de §8), corresponde una tercera política
con la misma forma que `company_isolation`: permite la fila si
`branch_id` es nulo (aplica a toda la empresa) o si el `branch_id` de
la fila está entre las sucursales a las que el usuario tiene acceso en
su sesión activa. Esto se deja señalado aquí como pendiente formal de
[06-estrategia-seguridad.md](./06-estrategia-seguridad.md) — no se
redacta la política en este documento por la restricción de no incluir
SQL, pero **el mecanismo y su necesidad quedan fijados como decisión de
diseño**, pendiente solo de redacción SQL en el documento normativo
correspondiente.

## 10. Estrategia de auditoría

Cuatro capas independientes, cada una respondiendo una pregunta
distinta (detalle completo:
[05-estrategia-auditoria.md](./05-estrategia-auditoria.md)):

| Pregunta                                           | Mecanismo                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ¿Quién creó/modificó/borró este registro y cuándo? | Columnas universales en la fila misma (`created_by`, `updated_by`, `deleted_by`, `*_at`)                        |
| ¿Qué cambió campo por campo, en cualquier tabla?   | Trigger genérico → `core.audit_logs`, sin permiso de `UPDATE`/`DELETE` para nadie                               |
| ¿Cómo se veía este registro completo en el pasado? | `core.change_history` (snapshot completo), uso selectivo en documentos fiscales/contratos/configuración crítica |
| ¿Por qué pasó de estado A a B este documento?      | `<entidad>_status_history` por módulo, solo en entidades con workflow                                           |

Auditoría de seguridad (`security.security_audit_logs`) se mantiene
**separada** de auditoría de datos por tener consumidor y régimen de
retención distintos. Retención y purga gobernadas por
`core.data_retention_policies`, con mínimo legal por país como piso
duro no reducible.

## 11. Estrategia de seguridad

Detalle completo: [06-estrategia-seguridad.md](./06-estrategia-seguridad.md).
Resumen de los cinco mecanismos:

1. **Row-Level Security** en las 498 tablas sin excepción — el
   mecanismo central de aislamiento (ver §8/§9).
2. **Roles de base de datos de privilegio mínimo**: `gorazus_app`
   (CRUD sujeto a RLS, sin DDL), `gorazus_migrator` (DDL, solo
   pipeline de despliegue), `gorazus_readonly` (réplicas/BI/reportes),
   `gorazus_backup`, `gorazus_audit_writer` (único rol con `INSERT` en
   `audit_logs`). Ningún rol de aplicación tiene `BYPASSRLS`.
3. **Cifrado**: en tránsito (`sslmode=verify-full` sin excepción), en
   reposo a nivel de volumen (infraestructura), y en reposo a nivel de
   columna para datos de sensibilidad alta (cuentas bancarias,
   identificación personal, credenciales de integración) vía
   `pgcrypto` con claves gestionadas externamente en KMS.
4. **Gestión de secretos**: ningún secreto en texto plano — hashes
   (`argon2id`) para credenciales de acceso, cifrado reversible solo
   para lo que la aplicación necesita desencriptar en uso legítimo.
5. **Enmascaramiento** obligatorio para cualquier copia de datos de
   producción hacia `staging`/`local` — nunca un dump directo.

## 12. Estrategia de índices

Detalle completo: [04-estrategia-indices.md](./04-estrategia-indices.md).
Principio rector: indexar exactamente los patrones de acceso reales,
no todo por defecto — cada índice adicional tiene costo de escritura.

- **Índice base obligatorio** en toda tabla: `(tenant_id, company_id,
branch_id)` parcial (`WHERE deleted_at IS NULL`) — acelera el
  filtro que RLS ya aplica, sin duplicar su trabajo de seguridad.
- FKs indexadas **solo** cuando hay un patrón de consulta real y
  frecuente (encabezado→línea sí; `created_by`/`updated_by` no, por
  defecto).
- Selección de tipo de índice por patrón: B-tree (igualdad), GIN +
  `pg_trgm` (texto libre), GIN (`metadata JSONB` selectivo), BRIN
  (rango de fecha en tablas append-only de alto volumen — ver §7),
  único parcial con alcance de tenant (claves de negocio: SKU, número
  de comprobante).
- Mantenimiento activo: `autovacuum` más agresivo en tablas de alto
  churn, `CREATE INDEX CONCURRENTLY` siempre, monitoreo mensual de
  índices no usados.

---

## 13. Gaps identificados (pendientes de formalización, no bloqueantes)

1. **Política RLS `branch_isolation`** — ver §9. Necesaria para que
   multisucursal tenga la misma garantía de motor que multiempresa;
   pendiente de redacción en
   [06-estrategia-seguridad.md](./06-estrategia-seguridad.md).
2. **Clasificación catálogo/maestra/transaccional no propagada** a
   `logico/*.md` — hoy vive solo en este documento (§5-§7). Se
   recomienda agregar como columna/tag en el inventario de cada módulo
   para que un desarrollador nuevo no tenga que inferirlo.
3. **Número real de tablas (498, 494 antes del Core Platform) vs. rango originalmente pedido
   (700-1000)** — ya documentado con transparencia completa en
   [02-modelo-logico §4](./02-modelo-logico.md#4-nota-transparente-sobre-el-número-494-vs-el-rango-700-1000-pedido);
   se repite la referencia acá porque es relevante a "módulos y
   entidades" (§1-§2) y podría sorprender a quien lea solo este
   documento consolidado.

## 14. Mapa de trazabilidad

| Punto solicitado                       | Documento(s) de detalle normativo                                                                                                                                                                  |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Módulos                                | [02 §3](./02-modelo-logico.md#3-inventario-completo-por-módulo), [docs/architecture/04](../architecture/04-catalogo-modulos-negocio.md)                                                            |
| Entidades                              | [01 §4](./01-modelo-conceptual.md#4-entidades-conceptuales-por-módulo), [02 §1](./02-modelo-logico.md#1-cómo-se-pasa-de-350-entidades-conceptuales-a-700-1000-tablas-físicas)                      |
| Relaciones                             | [03](./03-diagrama-relaciones.md)                                                                                                                                                                  |
| Dependencias                           | [01 §3](./01-modelo-conceptual.md#3-regla-de-no-duplicación-entre-módulos), [03 §2](./03-diagrama-relaciones.md#2-diagrama-maestro-relaciones-entre-módulos)                                       |
| Catálogos / Maestras / Transaccionales | §5-§7 de este documento (nuevo — sin documento normativo previo)                                                                                                                                   |
| Estrategia multiempresa                | [01 §2](./01-modelo-conceptual.md#2-jerarquía-de-aislamiento-tenant--company--branch), [06 §1](./06-estrategia-seguridad.md#1-row-level-security-el-mecanismo-central-de-aislamiento-multiempresa) |
| Estrategia multisucursal               | [01 §2](./01-modelo-conceptual.md#2-jerarquía-de-aislamiento-tenant--company--branch), §9 de este documento (gap señalado)                                                                         |
| Estrategia auditoría                   | [05](./05-estrategia-auditoria.md)                                                                                                                                                                 |
| Estrategia seguridad                   | [06](./06-estrategia-seguridad.md)                                                                                                                                                                 |
| Estrategia índices                     | [04](./04-estrategia-indices.md)                                                                                                                                                                   |
