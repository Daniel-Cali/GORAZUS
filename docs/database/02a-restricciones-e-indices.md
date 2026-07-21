# 02a — Modelo lógico: llaves, cardinalidad, restricciones e índices

> Versión 1.0 — 2026-07-13. Documento complementario de
> [02-modelo-logico.md](./02-modelo-logico.md). **Nota de transparencia
> importante antes de leer esto:** la especificación tabla-por-tabla de
> primary keys, foreign keys, restricciones e índices de las 494 tablas
> **ya existe, completa, en [sql/01_core.sql](./sql/01_core.sql) hasta
> [sql/23_indexes.sql](./sql/23_indexes.sql)** — es, por decisión de
> arquitectura ya tomada, la fuente de verdad del schema (ver
> [01-modelo-conceptual](./01-modelo-conceptual.md) y
> [docs/architecture/02 §4](../architecture/02-arquitectura-modulos-backend.md#4-base-de-datos-sql-crudo-como-fuente-de-verdad-prisma-como-consumidor)).
> Repetir esas ~9,300 líneas en prosa, tabla por tabla, no sería diseño
> nuevo — sería una traducción mecánica de SQL a español que ya está
> escrita en un lugar más preciso y verificable. Lo que este documento
> aporta, sin usar sintaxis SQL, es **lo que hace que ese diseño sea
> sistemático en vez de 494 decisiones aisladas**: las reglas
> universales (PK, FK, cardinalidad) que no varían, y los patrones de
> restricción/índice por _rol de tabla_ que sí determinan, de forma
> predecible, qué le corresponde a cualquier tabla nueva o existente.
> Se cierra con un ejemplo completo aplicado a un módulo real (`cash`)
> para que la regla se vea funcionando, no solo enunciada.

## 1. Todas las tablas y sus relaciones

Ya completo y no se repite acá: inventario de las 494 tablas por
módulo en [02-modelo-logico §3](./02-modelo-logico.md#3-inventario-completo-por-módulo)
y [logico/*.md](./logico/) (nombre físico, propósito, FKs no
universales de cada una); diagramas de relación maestro y por módulo
en [03-diagrama-relaciones.md](./03-diagrama-relaciones.md).

## 2. Llave primaria — regla única, sin excepciones

Toda tabla, sin excepción, tiene la misma primary key compuesta por
dos columnas (ver
[01-modelo-conceptual §1.1](./01-modelo-conceptual.md#11-columnas-universales)):

- **`id`** (identificador global, tipo UUID) — la PK real, usada en
  toda FK.
- **`local_id`** — correlativo entero autoincremental, `UNIQUE NOT
NULL` pero **no** parte de ninguna FK (existe solo para mostrar un
  número legible al usuario).

No existe ninguna tabla con PK distinta a este par. Por eso este
documento **no repite "PK: id UUID" 494 veces** — declararlo una vez
acá y en 01 es la respuesta completa a "llaves primarias" para
cualquier tabla del sistema.

## 3. Llaves foráneas y cardinalidad

### 3.1 FK universales (idénticas en las 494 tablas)

`tenant_id → core.tenants`, `company_id → core.companies`, `branch_id
→ core.branches`, `created_by/updated_by/deleted_by → core.users`.
Cardinalidad **N:1** en los seis casos (muchas filas de cualquier
tabla pertenecen a un mismo tenant/empresa/sucursal/usuario). Única
excepción real de todo el modelo a "no FK entre schemas de módulos" —
ver [01 §1.5](./01-modelo-conceptual.md#15-excepción-a-no-fk-entre-schemas).

### 3.2 FK no-universales — ya inventariadas por tabla en `logico/*.md`

Cada fila de las tablas de [logico/*.md](./logico/) ya lista sus FK
propias. Lo que formaliza este documento es la **convención de lectura**
que ya se usa de forma consistente en esos 21 archivos, para que sea
explícita y no solo implícita:

| Notación en `logico/*.md`                            | Cardinalidad                                                                                                                         | Ejemplo                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `columna_id → tabla` (sin anotación)                 | **N:1** — la tabla que declara la FK es el lado "muchos"                                                                             | `invoice_lines.invoice_id → invoices` (muchas líneas, una factura) |
| `columna_id → tabla` **(1:1)**                       | **1:1** — se refuerza además con un índice único sobre la FK (ver §5)                                                                | `customer_credit_profiles.customer_id → customers` (1:1)           |
| Tabla completa descrita como "(N:M)" en su propósito | **N:M** — la tabla en sí es la resolución de la relación, con las 18 columnas completas (nunca tabla liviana)                        | `role_permissions`, `product_variant_attribute_values`             |
| `→ modulo.tabla` **(ID suelto, sin FK cruzada)**     | **N:1 lógica, sin constraint físico** — la integridad referencial la garantiza el módulo dueño en su propia transacción, no Postgres | `sales.invoices.customer_id → customers.customers` (ID suelto)     |
| `parent_x_id → misma_tabla`                          | **N:1 auto-referenciada** (jerarquía)                                                                                                | `product_categories.parent_category_id → product_categories`       |

### 3.3 Comportamiento ante borrado (`ON DELETE`)

Regla única para las 494 tablas, verificada contra el SQL real: **ninguna
FK usa `CASCADE` ni `SET NULL`** — el comportamiento por defecto de
Postgres (`NO ACTION`, equivalente a `RESTRICT` en el momento de la
transacción) se deja tal cual, sin excepción. Esto es deliberado, no un
descuido: dado que el borrado normal de negocio es siempre lógico
(`deleted_at`, ver [01 §1.1](./01-modelo-conceptual.md#11-columnas-universales)),
un borrado físico real es una operación excepcional/administrativa —
y en ese caso excepcional, se prefiere que Postgres **impida** borrar
una fila todavía referenciada antes que borrar en cascada silenciosamente
datos relacionados de otra tabla (potencialmente de otro módulo).

## 4. Restricciones — patrón por rol de tabla

Este es el contenido que no existía antes como regla explícita y
transversal (más allá de casos puntuales mencionados al pasar en
`logico/*.md`, como `address_type` "vía `CHECK`"). Toda tabla de las
494 encaja en uno o más de estos roles (ver también la clasificación
catálogo/maestra/transaccional de
[00-modelo-general §5-7](./00-modelo-general.md#5-catálogos)), y el rol
determina sus restricciones de forma predecible:

| Rol de tabla                                                                                                                                                                                  | Restricción(es) que le corresponde(n)                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Catálogo** (`configuration.currencies`, `taxes.taxes`...)                                                                                                                                   | `code`/`slug` único con alcance de tenant (o global si el sentinela aplica); `NOT NULL` en el campo de nombre/etiqueta visible                                                                                                                                                                                           |
| **Maestra** (`customers.customers`, `products.products`...)                                                                                                                                   | Clave de negocio única con alcance de tenant+empresa (SKU, identificación fiscal, email) — un `UNIQUE` parcial (`WHERE deleted_at IS NULL`), nunca solo la PK UUID lo garantiza                                                                                                                                          |
| **`<entidad>_status`** (catálogo de estado)                                                                                                                                                   | `code` único por empresa; columna booleana `is_final_state` para que la aplicación sepa cuándo detener transiciones                                                                                                                                                                                                      |
| **`<entidad>_status_history`**                                                                                                                                                                | FK a la entidad y al estado ambas `NOT NULL`; sin restricción de unicidad — es intencionalmente append-only (múltiples transiciones por entidad)                                                                                                                                                                         |
| **`_translations`**                                                                                                                                                                           | `UNIQUE (parent_id, language_code)` — nunca dos traducciones del mismo idioma para el mismo padre                                                                                                                                                                                                                        |
| **N:M (tabla de unión)**                                                                                                                                                                      | `UNIQUE (fk_1, fk_2)` cuando la relación no admite duplicados (p. ej. `role_permissions`); **sin** ese único cuando sí tiene sentido repetir con distinto contexto/fecha (p. ej. `campaign_members` si un lead puede reingresar a la misma campaña en otra fecha) — se decide por semántica de negocio, no mecánicamente |
| **Encabezado de documento** (`invoices`, `purchase_orders`...)                                                                                                                                | Número de comprobante único **por serie** (`UNIQUE (company_id, branch_id, series_id, document_number) WHERE deleted_at IS NULL`, ver [04-estrategia-indices §5](./04-estrategia-indices.md#5-índices-únicos-de-negocio-no-solo-pk)); montos (`total_amount`, etc.) con `CHECK (>= 0)`                                   |
| **Línea de documento** (`_line`/`_detail`)                                                                                                                                                    | FK al encabezado `NOT NULL` (una línea nunca existe sin su documento); `quantity`/`unit_price` con `CHECK (> 0)` o `(>= 0)` según si se permite línea de monto cero (p. ej. bonificación)                                                                                                                                |
| **Jerárquica auto-referenciada** (`product_categories`, `chart_of_accounts`...)                                                                                                               | `CHECK (parent_x_id IS DISTINCT FROM id)` — impide que una fila sea su propio padre; ciclos más profundos (A→B→A) se previenen por trigger, no por `CHECK` (Postgres no expresa recursividad en un `CHECK` de fila)                                                                                                      |
| **Polimórfica** (`core.documents`, `core.comments`, `core.entity_tags`...)                                                                                                                    | `source_module`/`entity_type` restringido a una lista cerrada vía `CHECK ... IN (...)` (los módulos válidos del sistema, ver [01 §3](./01-modelo-conceptual.md#3-regla-de-no-duplicación-entre-módulos)); sin FK real a la entidad referenciada (no puede haberla — el tipo varía)                                       |
| **1:1** (`customer_credit_profiles`, `product_kits`, `correlatives`...)                                                                                                                       | Índice único sobre la FK que la vincula a su tabla principal (ver §5) — es lo que convierte una FK ordinaria en una relación 1:1 real, no solo declarada en la documentación                                                                                                                                             |
| **Enumeraciones embebidas** (`register_type`, `direction`, `status` de campos simples que no ameritan tabla catálogo propia — ver [00-modelo-general §5](./00-modelo-general.md#5-catálogos)) | `CHECK (columna IN ('valor_a', 'valor_b', ...))` en vez de tabla catálogo, cuando el conjunto de valores es fijo, pequeño y no requiere traducción/metadata propia                                                                                                                                                       |

## 5. Índices — regla por rol de tabla

Detalle completo de tipos de índice y su justificación:
[04-estrategia-indices.md](./04-estrategia-indices.md). Se consolida
acá el **mapeo directo rol de tabla → qué índice le corresponde**, que
es lo que realmente se necesita para saber, tabla por tabla, qué
índices tiene sin tener que releer la estrategia completa cada vez:

| Rol de tabla                                                                                                          | Índice(s)                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cualquier tabla de negocio** (las 494, sin excepción)                                                               | Base de aislamiento `(tenant_id, company_id, branch_id)` parcial — ver [04 §2](./04-estrategia-indices.md#2-índice-base-obligatorio-el-prefijo-de-aislamiento). Generado programáticamente para las 494, no a mano (ver [sql/23_indexes.sql §1](./sql/23_indexes.sql)) |
| **Línea de documento**                                                                                                | Índice sobre la FK al encabezado (patrón de acceso más frecuente: "traer todas las líneas de X")                                                                                                                                                                       |
| **Maestra con clave de negocio**                                                                                      | Único parcial sobre la clave de negocio con alcance de tenant/empresa (SKU, tax_id, email — ver §4)                                                                                                                                                                    |
| **1:1**                                                                                                               | Único sobre la FK que la vincula a su padre                                                                                                                                                                                                                            |
| **Tabla con campo de nombre buscado por texto libre** (`hr.employees`, `crm.leads`, `customers.customers`...)         | GIN + `pg_trgm` sobre el campo de nombre                                                                                                                                                                                                                               |
| **Alto volumen, append-only, filtrado por fecha** (`audit_logs`, `stock_movements`, `journal_entries`, `invoices`...) | BRIN sobre la columna de fecha relevante — más liviano que B-tree para este patrón (ver [04 §4](./04-estrategia-indices.md#4-índices-por-tipo-de-dato-y-patrón-de-acceso))                                                                                             |
| **`metadata JSONB` con patrón de filtro ya confirmado** (excepcional, no todas)                                       | GIN `jsonb_path_ops` — solo donde ya se identificó consulta real, nunca "por si acaso" (ver [04 §7](./04-estrategia-indices.md#7-índices-gin-sobre-metadata-jsonb))                                                                                                    |
| **Consulta caliente que solo necesita 2-3 columnas además de la FK**                                                  | Índice `INCLUDE` (covering), para no tocar la tabla completa                                                                                                                                                                                                           |
| **FK universales hacia `core.users`** (`created_by`/`updated_by`/`deleted_by`)                                        | **Sin índice** por defecto — consulta esporádica, no camino caliente (ver [04 §3](./04-estrategia-indices.md#3-claves-foráneas-no-todas-se-indexan-igual))                                                                                                             |

## 6. Ejemplo completo aplicado: módulo `cash` (11 tablas)

Se aplica todo lo anterior, tabla por tabla, a un módulo real completo
— sin sintaxis SQL, describiendo exactamente lo que ya está resuelto
en [sql/09_cash.sql](./sql/09_cash.sql) y en la sección de `cash` de
[sql/23_indexes.sql](./sql/23_indexes.sql).

| Tabla                    | Rol                                                                       | Cardinalidad de sus FK propias                                                                                                                  | Restricciones propias                                                                                               | Índices propios (además del base de aislamiento, presente en las 11)                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cash_registers`         | Maestra                                                                   | — (raíz del módulo)                                                                                                                             | `register_type` restringido por `CHECK` a `'administrative'`/`'pos'`                                                | —                                                                                                                                                                                               |
| `cash_register_openings` | Transaccional (encabezado de turno)                                       | N:1 → `cash_registers`; N:1 → `core.users` (quién abrió)                                                                                        | —                                                                                                                   | Único **parcial** sobre `register_id` (`WHERE is_open = true`) — impide dos aperturas simultáneas de la misma caja, sin impedir aperturas históricas ya cerradas                                |
| `cash_register_closings` | Transaccional                                                             | **1:1** → `cash_register_openings`; N:1 → `core.users`                                                                                          | `difference_amount` es columna calculada (`counted_amount - expected_amount`), no se declara ni valida por separado | Único sobre `opening_id` — refuerza el 1:1 (una apertura tiene a lo sumo un cierre)                                                                                                             |
| `cash_counts`            | Transaccional                                                             | N:1 → `cash_register_closings`                                                                                                                  | —                                                                                                                   | —                                                                                                                                                                                               |
| `cash_count_lines`       | Línea de documento                                                        | N:1 → `cash_counts`                                                                                                                             | `quantity` es cantidad entera de denominación — `CHECK (quantity >= 0)`                                             | —                                                                                                                                                                                               |
| `cash_movement_types`    | Catálogo (status-like, sin tabla `_status_history` porque no es workflow) | —                                                                                                                                               | `direction` restringido por `CHECK` a `'in'`/`'out'`                                                                | —                                                                                                                                                                                               |
| `cash_movements`         | Transaccional de alto volumen                                             | N:1 → `cash_registers`, `cash_register_openings`, `cash_movement_types`; polimórfica opcional (`source_module`/`source_entity_id`, sin FK real) | `amount` con `CHECK (> 0)` (el signo lo da `movement_type.direction`, no un monto negativo)                         | **Particionada por rango de `created_at`** (ver [07-estrategia-particionamiento.md](./07-estrategia-particionamiento.md)) — candidata de alto volumen, BRIN sobre `created_at` en vez de B-tree |
| `cash_transfers`         | Transaccional                                                             | N:1 → `cash_registers` (dos veces: origen y destino)                                                                                            | `CHECK (source_register_id IS DISTINCT FROM destination_register_id)` — una caja no se transfiere a sí misma        | —                                                                                                                                                                                               |
| `petty_cash_funds`       | Maestra                                                                   | N:1 → `core.users` (custodio)                                                                                                                   | —                                                                                                                   | —                                                                                                                                                                                               |
| `petty_cash_vouchers`    | Transaccional                                                             | N:1 → `petty_cash_funds`                                                                                                                        | `amount` con `CHECK (> 0)`                                                                                          | —                                                                                                                                                                                               |
| `cash_refunds`           | Transaccional                                                             | N:1 → `cash_registers`; N:1 lógica → `sales.sales_returns` (ID suelto, cross-módulo)                                                            | `amount` con `CHECK (> 0)`                                                                                          | —                                                                                                                                                                                               |

**Llave primaria de las 11**: idéntica en todas — `id UUID` + `local_id
BIGINT` (§2, no se repite fila por fila). **FK universales de las
11**: `tenant_id`/`company_id`/`branch_id`/`created_by`/`updated_by`/`deleted_by`
→ `core.*`, N:1 en los seis casos (§3.1, tampoco se repite).

Este mismo procedimiento (rol → restricciones → índices, con las
universales dadas por sabidas) es mecánicamente aplicable a los 483
tablas restantes de los otros 20 módulos — cuyo detalle exacto ya está
resuelto en [sql/01_core.sql](./sql/01_core.sql) hasta
[sql/21_configuration.sql](./sql/21_configuration.sql) +
[sql/23_indexes.sql](./sql/23_indexes.sql). Si necesitás este mismo
desglose completo para otro módulo específico (por ejemplo `sales` o
`accounting`, los de mayor complejidad), pedilo y se genera con el
mismo nivel de detalle — no se generaron los 21 de una vez en este
documento para no producir varias decenas de miles de palabras que en
esencia parafrasean SQL ya escrito, línea por línea, sin agregar
decisión de diseño nueva.

## 7. Trazabilidad

| Punto solicitado | Dónde está la respuesta completa                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Todas las tablas | [02-modelo-logico §3](./02-modelo-logico.md#3-inventario-completo-por-módulo), [logico/*.md](./logico/)                                                                                     |
| Relaciones       | [03-diagrama-relaciones.md](./03-diagrama-relaciones.md)                                                                                                                                    |
| Cardinalidad     | §3 de este documento (regla) + [logico/*.md](./logico/) (aplicada, ya con anotaciones `(1:1)`/`(N:M)` existentes)                                                                           |
| Llaves primarias | §2 de este documento (universal) + [sql/01_core.sql](./sql/01_core.sql) (implementación real)                                                                                               |
| Llaves foráneas  | §3 de este documento (reglas) + `logico/*.md` (por tabla) + `sql/01_core.sql`..`sql/21_configuration.sql` (implementación real)                                                             |
| Restricciones    | §4 de este documento (nuevo — patrón por rol) + `sql/*.sql` (aplicado tabla por tabla)                                                                                                      |
| Índices          | [04-estrategia-indices.md](./04-estrategia-indices.md) (reglas completas) + §5 de este documento (mapeo directo por rol) + [sql/23_indexes.sql](./sql/23_indexes.sql) (implementación real) |
