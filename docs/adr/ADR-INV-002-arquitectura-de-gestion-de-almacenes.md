# ADR-INV-002 — Arquitectura de Gestión de Almacenes (Warehouse Management)

|                             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Estado**                  | Aceptada                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Fecha**                   | 2026-07-27                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Autor**                   | Chief Enterprise Software Architect, GORAZUS ERP Enterprise                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Ámbito**                  | Gestión de Almacenes dentro del dominio `inventory` (`warehouses`, `warehouse_zones`, `warehouse_locations`, `putaway_rules`, `picking_rules`, `replenishment_rules`), límites con `core` (`companies`, `branches`), `products`, `purchases`, `sales`, y con el resto de `inventory` (`stock`, `stock_movements`, `stock_transfers`)                                                                                                                                                                                                                                                                                                                             |
| **Documentos relacionados** | [docs/architecture/19-modulo-inventory.md](../architecture/19-modulo-inventory.md) §1-2, §13 (diseño físico ya certificado de almacenes/zonas/ubicaciones — fuente principal de verdad de este ADR), [docs/reports/inventory/INVENTORY_STATUS.md](../reports/inventory/INVENTORY_STATUS.md) (estado real implementado, `v0.10.0`), [ADR-DB-001](./ADR-DB-001-estrategia-de-particionamiento-de-base-de-datos.md) §2.4, §7 (por qué `stock`/`warehouses` no están particionadas), [ADR-INV-001](./ADR-INV-001-arquitectura-del-catalogo-de-productos.md) §3.1 (mismo patrón de dos capas ya aplicado a tipos de producto, reutilizado aquí para tipos de almacén) |

Este documento formaliza, como decisión de arquitectura de dominio, el diseño de la Gestión de
Almacenes de GORAZUS ERP Enterprise — continuación directa de `ADR-INV-001`, que ya delimitó el
Catálogo de Productos. A diferencia de `19-modulo-inventory.md` (que documenta _qué_ existe
físicamente, ya verificado contra el schema real), este ADR documenta _por qué_ el dominio está
delimitado como está y formaliza tres piezas que hoy existen solo parcialmente: una capa de
clasificación de negocio sobre `warehouse_type` (§3), una convención explícita para modelar
pasillo/rack/estante/bin sobre la cadena auto-referenciada ya real de `warehouse_locations` (§2), y
un conjunto de banderas de configuración operativa que hoy no existen en el schema (§4). Cada
afirmación distingue explícitamente entre **estado real verificado** (contra
`core/database/prisma/schemas/inventory/schema.prisma`, `docs/database/sql/06_inventory.sql` y
`modules/inventario/backend/`) y **recomendación de este ADR** donde ambos difieren — mismo criterio
de honestidad que `ADR-DB-001` y `ADR-INV-001`.

---

## 1. Propósito

### 1.1 Por qué existe la Gestión de Almacenes como dominio propio

Un ERP necesita responder, de forma autoritativa, a una pregunta distinta de la que resuelve el
Catálogo de Productos: no "¿qué es esto?" (`ADR-INV-001 §1.1`) sino "¿**dónde** está físicamente, y
qué estructura organizativa gobierna cómo entra, se mueve y sale de ahí?". SAP EWM, Oracle WMS,
Microsoft Dynamics 365 Warehouse Management y Odoo Enterprise tratan la gestión de almacenes como un
dominio separado del catálogo y separado de la contabilidad de existencias, exactamente por la misma
razón por la que GORAZUS ya lo modela como tal: la estructura física de un almacén (sus zonas,
pasillos, estantes, bins) es un activo organizativo que existe y se planifica independientemente de
qué producto está, en un momento dado, ocupando cada posición. GORAZUS ya certifica esta separación a
nivel de schema — `warehouses`/`warehouse_zones`/`warehouse_locations` no tienen ninguna columna de
cantidad; `inventory.stock` no tiene ninguna columna de nombre/código de ubicación, solo una FK
(`location_id`, nullable) hacia ella.

### 1.2 Por qué la estructura de almacenes debe ser independiente de las cantidades de inventario

Esta independencia no es solo una preferencia de diseño — es una consecuencia directa de dos
patrones de crecimiento y de cambio completamente distintos, ya reconocidos en `ADR-DB-001 §2.4`:

- **La estructura** (`warehouses`, `warehouse_zones`, `warehouse_locations`) crece con la
  **infraestructura física** de la empresa — cuántos almacenes tiene, cuántas zonas por almacén,
  cuántos bins por zona. Este número cambia con poca frecuencia (se abre un almacén nuevo, se
  reorganiza un layout) y su volumen total, incluso en una operación grande, se mide en miles de
  filas, no en millones. Es, por naturaleza, un **catálogo**: se consulta mucho más de lo que se
  escribe, y cuando se escribe es una decisión operativa deliberada (alta de zona nueva), no un
  evento transaccional de alta frecuencia.
- **La cantidad** (`inventory.stock`, `inventory.stock_movements`) cambia con **cada transacción de
  negocio** — cada venta, compra, transferencia, ajuste, conteo genera una escritura. `stock_movements`
  ya está particionada mensualmente por este motivo (`ADR-DB-001 §7`, confirmado
  `RANGE (created_at)` sobre `docs/database/sql/06_inventory.sql:131-145`), con la justificación
  textual _"cientos de millones de filas en pocos años"_. `stock` en sí (el saldo actual, no el
  histórico) tampoco se particiona, pero por una razón distinta: crece con `# SKUs × # almacenes`,
  no con el tiempo (`docs/database/sql/06_inventory.sql:128`, comentario real: _"No particionada
  (crece con # de SKUs×almacenes, no con el tiempo)"_).

Si estas dos cosas vivieran acopladas — por ejemplo, si una ubicación "supiera" qué contiene en vez
de que el stock apunte hacia ella — reorganizar un almacén (mover una zona, renombrar un pasillo)
obligaría a tocar cada fila de `stock` afectada, y el volumen transaccional de `stock_movements`
degradaría cualquier operación de mantenimiento de la estructura física. La independencia además
permite un hecho de negocio real y común: una ubicación vacía **sigue existiendo** como estructura
válida (un bin sin producto asignado hoy no deja de ser un bin), algo que sería imposible de
representar limpiamente si la ubicación solo existiera como atributo de una fila de stock.

### 1.3 Relación con otros dominios

| Dominio                                   | Qué consume de Gestión de Almacenes                                                                                                                                                                                                      | Qué NO le pertenece a Gestión de Almacenes                                                                                                                                                                                                       | Evidencia real                                                                                                                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Companies** (`core`)                    | `warehouses.company_id` (`NOT NULL`) — todo almacén pertenece a exactamente una empresa.                                                                                                                                                 | Ninguna relación Prisma declarada — `companies`/`inventory` son schemas Postgres físicamente distintos (`multiSchema`); Prisma no soporta FK cross-schema, la integridad se valida en la capa de aplicación (`EmpresaSucursalLookupRepository`). | `core/database/prisma/schemas/inventory/schema.prisma:980` (`company_id String @db.Uuid`, sin relación).                                                                                         |
| **Branches** (`core`)                     | `warehouses.branch_id` (`NOT NULL`, a diferencia de la mayoría de tablas de negocio del sistema). `code` único **por sucursal**, no por empresa.                                                                                         | La identidad/dirección/configuración fiscal de la sucursal en sí (`core.branches`) — Gestión de Almacenes solo referencia el `id`.                                                                                                               | `docs/database/sql/06_inventory.sql:26` (`CREATE UNIQUE INDEX uq_inventory_warehouses_code ON inventory.warehouses (branch_id, code)`); `19-modulo-inventory.md §1`.                             |
| **Warehouses**                            | Raíz del subárbol físico de este dominio.                                                                                                                                                                                                | —                                                                                                                                                                                                                                                | —                                                                                                                                                                                                |
| **Zones**                                 | `warehouse_zones.warehouse_id` (`NOT NULL`) + `zone_function CHECK IN ('receiving','storage','picking','shipping')` — propósito operativo, no solo organizativo.                                                                         | —                                                                                                                                                                                                                                                | `docs/database/sql/06_inventory.sql:37`.                                                                                                                                                         |
| **Aisles / Shelves / Bins**               | Ver §2.3 — **no existen como tablas separadas**; se representan como niveles de `warehouse_locations`, auto-referenciada, sin límite de profundidad fijo.                                                                                | Una tabla `aisles`/`racks`/`shelves`/`bins` dedicada — decisión deliberada, no una omisión (§2.3).                                                                                                                                               | `core/database/prisma/schemas/inventory/schema.prisma:915-944` (`warehouse_locations`, `parent_location_id` auto-referencia).                                                                    |
| **Inventory** (`stock`/`stock_movements`) | Consume `warehouse_id` (obligatorio) y `location_id` (opcional) como FK sueltas de referencia — nunca al revés.                                                                                                                          | Las cantidades en sí (`quantity_on_hand`/`quantity_reserved`), los movimientos, y la valuación de costo (FIFO/promedio) — todo eso es `inventory`, no Gestión de Almacenes (§1.2).                                                               | `docs/database/sql/06_inventory.sql:124-126`.                                                                                                                                                    |
| **Purchasing** (`purchases`)              | Nada de forma directa hoy — el diseño de schema conecta una recepción de compra con un almacén vía `inventory.goods_receipts.warehouse_id`, con `source_module`/`source_entity_id` polimórfico apuntando de vuelta a la orden de compra. | Cualquier dato de la orden de compra en sí — `purchases` no tiene, ni tuvo nunca, columna ni tabla de `warehouse_id` (`grep` sin coincidencias sobre `purchases/schema.prisma`).                                                                 | `core/database/prisma/schemas/inventory/schema.prisma:214-233` (`goods_receipts`); confirmado sin código de aplicación en ningún lado todavía (§3.9 más abajo).                                  |
| **Sales** (`sales`)                       | Igual patrón indirecto: `inventory.stock_reservations`/`goods_issues` con `source_module`/`source_entity_id` — un pedido de venta reserva/descuenta stock de un almacén sin que `sales` conozca la tabla `warehouses`.                   | Igual que Purchasing — `sales` no tiene columna `warehouse_id` propia (`grep` sin coincidencias sobre `sales/schema.prisma`).                                                                                                                    | `19-modulo-inventory.md §9`; confirmado por `Grep` cruzado, cero resultados de `warehouse` en `sales/schema.prisma`.                                                                             |
| **Transfers**                             | El único mecanismo de movimiento almacén-a-almacén **completamente real e implementado**: `stock_transfers`/`stock_transfer_lines`, con `source_warehouse_id`/`destination_warehouse_id` como FKs propias (no polimórficas).             | La ejecución de `stock_movements` en sí, ya catalogada como fuera de este dominio (fila anterior).                                                                                                                                               | `core/database/prisma/schemas/inventory/schema.prisma:884-913`; `TransferenciasController` real, confirmado en `modules/inventario/backend/`; secuencia completa en `19-modulo-inventory.md §6`. |

---

## 2. Jerarquía de Almacenes

### 2.1 Jerarquía real certificada — 5 niveles de tabla, no 8

El schema real certifica **cinco** niveles de tabla distintos entre Empresa y Bin, no los ocho
niveles nombrados en la solicitud (Company, Branch, Warehouse, Zone, Aisle, Rack, Shelf, Bin
Location). La razón no es una omisión — es que **Aisle, Rack, Shelf y Bin Location comparten la
misma mecánica física real** (una fila de `warehouse_locations`, auto-referenciada), exactamente el
mismo patrón de "varios conceptos de negocio sobre una mecánica física menor" que `ADR-INV-001 §3.1`
ya aplicó a los tipos de producto. Los cinco niveles de tabla reales:

```text
core.companies  →  core.branches  →  inventory.warehouses  →  inventory.warehouse_zones  →  inventory.warehouse_locations (auto-referenciada, N niveles)
```

### 2.2 Cada nivel — qué es y por qué existe

| Nivel                                   | Tabla real                                                          | Cardinalidad                                               | Por qué existe                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Company**                             | `core.companies`                                                    | 1 empresa → N sucursales                                   | La entidad legal/fiscal dueña última de toda la operación — `warehouses.company_id` es `NOT NULL`, ningún almacén existe sin empresa (multi-empresa real desde la raíz, no una capa agregada después).                                                                                                                                                                             |
| **Branch**                              | `core.branches`                                                     | 1 sucursal → N almacenes                                   | Unidad operativa/geográfica dentro de la empresa. `warehouses.branch_id` es `NOT NULL` — a diferencia de la mayoría de tablas de negocio de GORAZUS, un almacén **siempre** pertenece a una sucursal concreta, nunca solo a la empresa (`19-modulo-inventory.md §1`, consistente con `14-modulo-core §2`: los almacenes se crean en cascada al dar de alta una sucursal).          |
| **Warehouse**                           | `inventory.warehouses`                                              | 1 almacén → N zonas                                        | La unidad física/lógica de custodia de existencias — todo `stock` real referencia un `warehouse_id`, nunca directamente una sucursal. `code` único por sucursal (no global), porque dos sucursales distintas de la misma empresa pueden reutilizar el mismo código corto ("A", "B") sin colisión.                                                                                  |
| **Zone**                                | `inventory.warehouse_zones`                                         | 1 zona → N ubicaciones                                     | Subdivisión **funcional**, no solo espacial — `zone_function CHECK IN ('receiving','storage','picking','shipping')` es lo que le da sentido operativo: el flujo recepción→almacenamiento→picking→despacho se modela como tránsito entre zonas de función distinta dentro del mismo almacén.                                                                                        |
| **Aisle / Rack / Shelf / Bin Location** | `inventory.warehouse_locations` (una sola tabla, auto-referenciada) | 1 ubicación padre → N ubicaciones hijas, profundidad libre | Ver §2.3 — la posición final donde vive físicamente el producto. Auto-referenciarse en vez de cuatro tablas fijas permite que cada empresa defina su propia profundidad de granularidad (una ferretería pequeña puede no necesitar "rack" como nivel intermedio; un centro de distribución grande sí) sin que el motor imponga una jerarquía rígida de exactamente cuatro niveles. |

### 2.3 La brecha entre Aisle/Rack/Shelf/Bin solicitados y `warehouse_locations` real

**Estado real verificado**: `warehouse_locations` es una única tabla con `parent_location_id`
auto-referenciado (`core/database/prisma/schemas/inventory/schema.prisma:915-944`), sin ninguna
columna que discrimine "esto es un pasillo" de "esto es un bin" — mismo patrón exacto que
`product_categories` (jerárquico, N niveles, sin tabla separada por nivel de profundidad). El
addendum de `19-modulo-inventory.md §13` ya señala la solución de diseño, sin haberla formalizado
todavía: _"la decisión de usar `warehouse_locations.metadata.locationType` (JSON, no columna nueva)
para distinguir pasillo/estante/nivel/posición dentro de la misma cadena auto-referenciada."_

**Recomendación de este ADR** — formalizar esa convención con cuatro valores concretos de
`metadata.locationType`, validados en la capa de aplicación (no como `CHECK` de Postgres, porque
`metadata` es `JSONB` sin schema, igual limitación ya aceptada para `products.metadata` en
`ADR-INV-001 §6`):

| `metadata.locationType` (propuesto) | Nivel solicitado | Es hijo directo de                                                                                     |
| ----------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| `"aisle"`                           | Aisle (Pasillo)  | La zona (`parent_location_id = NULL`, primer nivel de la cadena)                                       |
| `"rack"`                            | Rack             | Una ubicación `"aisle"`                                                                                |
| `"shelf"`                           | Shelf (Estante)  | Una ubicación `"rack"`                                                                                 |
| `"bin"`                             | Bin Location     | Una ubicación `"shelf"` — este es el nivel que `inventory.stock.location_id` referencia en la práctica |

No se recomienda promover estos cuatro valores a columnas ni a un `CHECK` de Postgres — mismo
criterio de "no particionar/tipar sin beneficio medible" que `ADR-DB-001 §2.1` y `ADR-INV-001 §3.5`
ya aplicaron: la jerarquía real de profundidad varía por industria y por tamaño de operación (un
almacén pequeño puede saltarse "rack" y anidar bins directo en un pasillo), y una tabla auto-referenciada
sin discriminador fijo ya soporta eso sin ningún cambio de schema.

### 2.4 Diagramas ASCII

**Diagrama A — Jerarquía real, de Empresa a Ubicación:**

```text
┌────────────────┐  1:N  ┌────────────────┐  1:N  ┌─────────────────────┐  1:N  ┌────────────────────────┐  1:N  ┌───────────────────────────┐
│ core.companies   │──────▶│ core.branches    │──────▶│ inventory.warehouses  │──────▶│ inventory.warehouse_zones │──────▶│ inventory.warehouse_locations│
│                  │       │ company_id        │       │ company_id  NOT NULL  │       │ warehouse_id  NOT NULL    │       │ zone_id  NOT NULL           │
│                  │       │  NOT NULL         │       │ branch_id   NOT NULL  │       │ zone_function  CHECK IN   │       │ parent_location_id          │
│                  │       │                   │       │ warehouse_type CHECK  │       │  (receiving|storage|      │       │  (auto-referencia — ver     │
│                  │       │                   │       │  IN (physical|virtual)│       │   picking|shipping)       │       │   Diagrama B)               │
└────────────────┘       └────────────────┘       └─────────────────────┘       └────────────────────────┘       └───────────────────────────┘
                                                                                                                                    │
                                                                                                                                    │ 1:N (location_id NULLABLE)
                                                                                                                                    ▼
                                                                                                                        ┌───────────────────────────┐
                                                                                                                        │      inventory.stock        │
                                                                                                                        │ product_id + warehouse_id   │
                                                                                                                        │ + location_id (opcional)    │
                                                                                                                        │ quantity_on_hand/reserved   │
                                                                                                                        └───────────────────────────┘
```

**Diagrama B — Auto-referencia de `warehouse_locations`, con la convención propuesta de
`metadata.locationType` para representar Aisle → Rack → Shelf → Bin sin tablas nuevas:**

```text
warehouse_locations  (todas dentro de la misma zona de función 'storage')

  A1                     parent_location_id: NULL        metadata.locationType: "aisle"   ← Pasillo A1
  │
  └── A1-R3               parent_location_id: A1          metadata.locationType: "rack"    ← Rack 3 del pasillo A1
      │
      └── A1-R3-S2         parent_location_id: A1-R3       metadata.locationType: "shelf"   ← Estante 2 del rack A1-R3
          │
          └── A1-R3-S2-B04  parent_location_id: A1-R3-S2    metadata.locationType: "bin"     ← Bin 04 — posición final
              │
              └──▶ inventory.stock.location_id  (aquí es donde vive la cantidad física real, §1.2)
```

**Diagrama C — Un almacén pequeño que se salta niveles intermedios (permitido por el mismo modelo,
sin cambio de schema):**

```text
warehouse_locations  (almacén pequeño, sin racks ni estantes formales)

  Z-GENERAL              parent_location_id: NULL        metadata.locationType: "aisle"
  │
  └── BIN-01              parent_location_id: Z-GENERAL    metadata.locationType: "bin"     ← hijo directo del pasillo, sin rack/estante intermedio
```

---

## 3. Tipos de Almacén

### 3.1 Modelo de dos capas — mismo patrón que `ADR-INV-001 §3.1`

**Estado real verificado**: el motor certifica un único discriminador de comportamiento físico real,
`warehouses.warehouse_type`, con `CHECK IN ('physical', 'virtual')`
(`docs/database/sql/06_inventory.sql:23`) — dos valores. Los ocho tipos solicitados para este ADR
(Main Warehouse, Retail Store, Transit Warehouse, Returns Warehouse, Damaged Goods, Consignment
Warehouse, Production Warehouse, Virtual Warehouse) **no son, todos, discriminadores de
comportamiento físico distintos**: la mayoría son la misma mecánica (`physical`) con una
**clasificación de negocio** encima, relevante para reportes, reglas de recepción/despacho y
propiedad de la mercadería — no para el motor de stock en sí. Es exactamente el mismo patrón que SAP
usa con el "Tipo de Almacén" sobre su motor EWM, y el mismo criterio que `ADR-INV-001 §3.1` ya
estableció para tipos de producto. Este ADR recomienda formalizar esa clasificación **sin modificar
el `CHECK` real de `warehouse_type`** — como dimensión de clasificación adicional (`metadata.businessType`,
mismo mecanismo ya recomendado en §2.3), no implementada todavía.

### 3.2 Tabla de mapeo: los 8 tipos solicitados sobre las 2 mecánicas reales

| Tipo solicitado           | `warehouse_type` real                          | Clasificación de negocio (propuesta, `metadata.businessType`)                 | Reglas de negocio                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Main Warehouse**        | `physical`                                     | `main` (clasificación por defecto de todo `physical` sin otra más específica) | Almacén central de operación normal — origen y destino habitual de `stock_transfers`, participa de todas las zonas/funciones (§2.2). Es la mecánica de referencia sobre la que se apoyan Retail/Returns/Damaged/Production abajo.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Retail Store**          | `physical`                                     | `retail_store` (propuesta)                                                    | `physical` normal, típicamente con menos zonas activas (a menudo solo `storage`+`picking`, sin `receiving` propio si recibe por transferencia desde el Main Warehouse). Corresponde 1:1 a una `branches` que además es punto de venta — sin relación Prisma directa `warehouses↔branches` más allá de `branch_id` (§1.3), la asociación "esta sucursal es una tienda" vive en `core.branches`, no aquí.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Transit Warehouse**     | 🟡 `virtual` (permitido, no usado por defecto) | `transit` (propuesta, **con tensión real de diseño** — ver nota)              | **Hallazgo importante**: el comportamiento real y ya documentado de una transferencia (`19-modulo-inventory.md §6`) es que, mientras `stock_transfers.status = 'in_transit'`, la mercadería _no está representada en ningún almacén_ — se descontó del origen (`transfer_out`) pero todavía no se acreditó en el destino (`transfer_in`). El propio documento lo declara explícito: _"decisión de diseño: no se modela un almacén virtual de tránsito por defecto, aunque `warehouse_type='virtual'` lo permitiría si se necesitara"_. Este ADR **no recomienda** activar un Transit Warehouse por defecto — solo señala que el motor ya lo permite (`warehouse_type='virtual'` + `businessType='transit'`) si el negocio necesita visibilidad de cuánto stock está en tránsito en un momento dado, lo cual hoy requeriría consultar `stock_transfers` con `status='in_transit'` directamente en vez de un saldo de almacén. |
| **Returns Warehouse**     | `physical` o `virtual`                         | `returns` (propuesta, sin precedente real)                                    | Sin código ni dato real que lo respalde hoy. El mecanismo que lo soportaría ya existe en el schema (`inventory.goods_receipts.source_module` podría valer `'sales_returns'`), pero **`goods_receipts` no tiene código de aplicación todavía** (§3.9) — se puede modelar como almacén dedicado (consolidación de devoluciones entre sucursales) o como una zona `receiving` especial dentro del Main Warehouse; ninguna de las dos requiere cambio de schema.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Damaged Goods**         | `physical` o `virtual`                         | `damaged_goods` (propuesta)                                                   | **Tensión de diseño real, sin resolver por schema**: `zone_function` solo admite `('receiving','storage','picking','shipping')` — no hay un valor `'damaged'`. Dos formas de modelarlo, ambas soportadas sin cambio de schema: (a) un almacén `physical` dedicado con `businessType='damaged_goods'`, para consolidar mercadería dañada de varias sucursales; (b) una `warehouse_zones` con `zone_function='storage'` dentro del almacén normal, distinguida solo por nombre/`metadata`. Se recomienda (a) para operaciones con múltiples sitios, (b) para un único almacén — decisión de implementación, no de motor.                                                                                                                                                                                                                                                                                                       |
| **Consignment Warehouse** | `physical` o `virtual`                         | `consignment` (propuesta, **brecha real de propiedad**)                       | **Brecha real identificada**: ni `warehouses` ni `inventory.stock` tienen ninguna columna de propiedad (`owner_type`/`owned_by_supplier_id`/`owned_by_customer_id`) — el modelo actual asume implícitamente que toda existencia en `stock` es propiedad de la empresa dueña del `tenant_id`. Mercadería en consignación (propiedad de un proveedor, físicamente en las instalaciones de la empresa, o viceversa) no tiene forma de distinguirse hoy de inventario propio. Recomendación de este ADR: no crear una columna nueva todavía (mismo criterio de `ADR-INV-001 §6` para brechas sin evidencia de volumen real) — usar `metadata.ownerType`/`metadata.ownerId` en `stock` como mecanismo provisional, y solo promover a columna de primera clase si el volumen de consignación lo justifica.                                                                                                                         |
| **Production Warehouse**  | `physical`                                     | `production` (propuesta)                                                      | Se conecta con `inventory.production_orders` (schema ya certificado, **sin código de aplicación todavía**, ver §3.9) — el almacén donde se reciben componentes (materia prima, `ADR-INV-001 §3.6`) y se genera el producto terminado de una orden de producción. No requiere columna nueva: `production_orders.warehouse_id` ya es la FK real que lo conecta (confirmado en el schema, relación inversa `warehouses.production_orders[]`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Virtual Warehouse**     | `virtual` (ya real, coincide exacto)           | — (el `warehouse_type` mismo ya es la clasificación)                          | Ya implementado a nivel de motor: cualquier fila con `warehouse_type='virtual'` participa del mismo modelo de `stock`/`stock_movements` que un almacén físico, sin representar una ubicación física real — el caso de uso documentado explícitamente es consignación/tránsito (`19-modulo-inventory.md §1`, §6). Es el único de los ocho tipos solicitados que **ya es**, literalmente, la mecánica física real, sin necesitar clasificación de negocio adicional (mismo caso que `service` en `ADR-INV-001 §3.4`).                                                                                                                                                                                                                                                                                                                                                                                                          |

### 3.3 Por qué no se propone expandir el `CHECK` de `warehouse_type` con más valores

Igual razonamiento que `ADR-INV-001 §3.5` aplicó a Producto Digital: ampliar
`CHECK (warehouse_type IN (...))` a ocho valores mezclaría, en una sola columna, dos preguntas
distintas — "¿tiene o no ubicación física real?" (la única que hoy determina comportamiento de motor
distinto) y "¿para qué lo usa el negocio?" (relevante para reportes y reglas operativas, no para
cómo participa del modelo de `stock`). Mantener `warehouse_type` en dos valores y resolver la
clasificación de negocio en `metadata` preserva la propiedad de que **todo** almacén, sin importar su
clasificación, participa exactamente del mismo motor de `stock`/`stock_movements`/`stock_transfers` —
ninguna lógica de aplicación necesita un `switch` sobre ocho casos para saber si debe descontar
existencia o no.

---

## 4. Configuración de Almacén

Cada ajuste solicitado se documenta con su estado real (¿existe ya, dónde, con qué mecanismo?) y su
recomendación cuando no existe — mismo criterio de honestidad que el resto de este ADR. El hallazgo
más relevante de esta sección: **de los siete ajustes solicitados, solo uno está completamente
implementado** (rastreo de ubicación); dos tienen el schema listo sin código de aplicación; los
cuatro restantes no existen en ninguna forma todavía.

| Ajuste solicitado          | Estado real                                                                                | Dónde vive / evidencia                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Recomendación de este ADR                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default warehouse**      | 🔴 No existe                                                                               | Sin columna `is_default` en `warehouses`, sin ninguna tabla de configuración que referencie un almacén por defecto (`grep` de `default_warehouse`/`is_default` sobre todo `inventory/schema.prisma`, sin resultados).                                                                                                                                                                                                                                                                                        | Añadir `warehouses.is_default BOOLEAN NOT NULL DEFAULT false`, con un índice único parcial `(branch_id) WHERE is_default AND deleted_at IS NULL` — como máximo un almacén por defecto por sucursal, consistente con que `code` ya es único por sucursal (§2.2). Usado por `sales`/`purchases` cuando no se especifica almacén explícito en una transacción.                                                                                                                                                                                                               |
| **Negative stock**         | 🔴 No existe ningún control, en ningún sentido                                             | `docs/database/sql/06_inventory.sql:116-127` (`stock.quantity_on_hand NUMERIC(18,6) NOT NULL DEFAULT 0`) — **sin `CHECK (quantity_on_hand >= 0)`**, confirmado leyendo el DDL completo de la tabla. El stock negativo hoy **no está prevenido**, pero tampoco existe una bandera que lo permita explícitamente — es un vacío de gobierno, no una decisión.                                                                                                                                                   | No es viable un `CHECK` de Postgres para esto (Postgres no puede expresar "la suma de movimientos no debe bajar de cero" como restricción de fila individual) — la validación debe vivir en la capa de aplicación, en `MovimientosService` antes de confirmar un movimiento `'out'`. Se recomienda una bandera `warehouses.allow_negative_stock BOOLEAN NOT NULL DEFAULT false`, evaluada ahí: si es `false` (comportamiento por defecto recomendado), un movimiento de salida que dejaría `quantity_on_hand < 0` debe rechazarse antes de escribir en `stock_movements`. |
| **Automatic reservations** | 🟡 El mecanismo es real; el disparo automático no                                          | `stock_reservations` tiene código real completo — `ReservasController`/`ReservasService`/`ReservaStockRepository` (confirmado en `modules/inventario/backend/`), API funcional hoy. Pero **nada en `sales`/`purchases` lo invoca todavía** — ni `purchases/schema.prisma` ni `sales/schema.prisma` referencian `warehouse_id` ni disparan la creación de una reserva (confirmado, cero código de aplicación en `modules/ventas/backend`/`modules/compras/backend` que llame al motor de inventario).         | La API de reserva ya está lista para ser consumida — la pieza pendiente es que `sales` la invoque automáticamente al confirmar un pedido (crear la reserva) y la libere al confirmar la salida real (`goods_issues`, también pendiente, §3.9). No requiere cambio de schema, es una integración entre módulos ya diseñada (`source_module`/`source_entity_id` polimórfico) pero no construida.                                                                                                                                                                            |
| **Picking strategy**       | 🟡 Schema real, cero código de aplicación                                                  | `picking_rules.strategy CHECK IN ('fifo_physical','nearest_location','by_route')` (`docs/database/sql/06_inventory.sql:74`) — real a nivel de motor. Sin `PickingRulesController`/`Service`/`Entity`/`Repository` en ningún lado de `modules/inventario/backend/` (confirmado por listado de archivos).                                                                                                                                                                                                      | El schema ya modela las tres estrategias correctamente delimitadas (física, no de costeo — distinción ya documentada en `19-modulo-inventory.md §2`: no confundir `fifo_physical` con FIFO de costeo, `ADR-INV-001` no cubre esto por ser dominio distinto). Falta únicamente el CRUD de aplicación — mismo patrón ya usado por `AlmacenesController` (§2.2), sin necesidad de diseño nuevo.                                                                                                                                                                              |
| **Putaway strategy**       | 🟡 Schema real, pero **sin discriminador de estrategia** — asimetría real frente a picking | `putaway_rules` (`docs/database/sql/06_inventory.sql:53-64`) tiene `product_category_id` (opcional) + `target_zone_id` + `priority SMALLINT DEFAULT 0` — **sin ninguna columna `strategy`/`CHECK`**, a diferencia de `picking_rules`. La "estrategia" de putaway hoy es implícita: reglas ordenadas por `priority`, cada una aplicable a una categoría de producto (o a ninguna en particular), apuntando a una zona destino.                                                                                | **Brecha de diseño real señalada por este ADR**: se recomienda evaluar si `putaway_rules` necesita su propio discriminador explícito (p. ej. `strategy CHECK IN ('by_category','fixed_location','random')`) para que el motor de putaway automático (todavía sin construir, §3.9) sepa cómo resolver un empate entre reglas de igual prioridad — hoy el modelo solo resuelve "a qué categoría aplica y con qué prioridad", no "qué algoritmo de asignación dentro de la zona destino". No implementado; señalado para la fase de diseño del motor de putaway automático.  |
| **Barcode support**        | 🔴 No existe en Gestión de Almacenes (sí existe, distinto, en Productos)                   | `products.product_barcodes` (`ADR-INV-001 §6`) cubre el código de barras **del producto**. Ninguna tabla de este dominio (`warehouses`, `warehouse_zones`, `warehouse_locations`) tiene columna de código de barras/QR propio — confirmado, cero coincidencias de `barcode` en `inventory/schema.prisma`. Sin etiqueta escaneable de ubicación, un flujo de picking/putaway guiado por escáner (escanear el bin, luego escanear el producto) no tiene forma de validar la ubicación en sí, solo el producto. | A diferencia de otros gaps de este ADR (§3.2 consignación, por ejemplo), este no se recomienda resolver con `metadata` — un código de barras de ubicación es suficientemente central a un WMS (es el mecanismo estándar en SAP EWM/Oracle WMS/Dynamics 365 para picking guiado) como para justificar una columna de primera clase: `warehouse_locations.barcode TEXT` (nullable, único por `zone_id` si se implementa). No implementado; el gap más significativo de esta sección frente a un WMS de referencia.                                                          |
| **Location tracking**      | ✅ Real y completo                                                                         | `warehouse_locations` con código de aplicación real completo: `UbicacionesAlmacenController`/`Service`/`Repository`/`Entity` (+ specs), referenciado por `stock.location_id` (nullable — un `stock` puede existir "sin ubicación específica" por almacén, vía el índice único con `COALESCE` ya documentado en `19-modulo-inventory.md §3`).                                                                                                                                                                 | Ninguna — ya operativo. Es el único de los siete ajustes de esta sección sin brecha real que señalar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

---

## 5. Cantidades de Inventario

### 5.1 Estado real — dos columnas, una vista, ocho tipos de movimiento

**Estado real verificado**: `inventory.stock` tiene exactamente **dos** columnas de cantidad —
`quantity_on_hand` y `quantity_reserved` (`docs/database/sql/06_inventory.sql:116-127`) — más una
vista derivada, `inventory.v_available_stock = quantity_on_hand - quantity_reserved`
(`19-modulo-inventory.md §3`). Todo movimiento real pasa por ocho tipos ya sembrados
(`seed-stock-movement-types.ts`): `receipt`/`issue`/`transfer_out`/`transfer_in`/
`adjustment_increase`/`adjustment_decrease`/`production_output`/`production_consumption`, cada uno
con `direction CHECK IN ('in','out')`. Los diez tipos de stock solicitados en este ADR **no son diez
columnas ni diez estados** — son una mezcla de (a) lo que ya existe con otro nombre, (b) lo que se
puede derivar sin cambio de schema, y (c) brechas reales sin ningún precedente, confirmadas por
`grep` exhaustivo de `quality|inspection|blocked|hold` sobre todo el schema y el SQL de `inventory`,
**sin ningún resultado**.

### 5.2 Los diez tipos solicitados, uno por uno

| Tipo solicitado              | Estado real                                                                    | Mecanismo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Available Stock**          | ✅ Real, ya coincide exacto                                                    | `inventory.v_available_stock` (`quantity_on_hand - quantity_reserved`). Es lo que `sales` debe consultar antes de confirmar una línea de pedido — hoy no lo hace (`sales` sin código de integración, §4 "Automatic reservations").                                                                                                                                                                                                                                                                                                                                                 |
| **Reserved Stock**           | ✅ Real, ya coincide exacto                                                    | `stock.quantity_reserved` — total **denormalizado**, mantenido por la aplicación cada vez que se crea/libera una fila en `stock_reservations`, no recalculado con `SUM` en cada lectura (`19-modulo-inventory.md §3`, decisión de rendimiento explícita).                                                                                                                                                                                                                                                                                                                          |
| **Committed Stock**          | 🟡 Mismo mecanismo que Reserved — sin distinción propia                        | `stock_reservations` no tiene ninguna columna que separe "reservado para un pedido" de "ya en proceso de picking, comprometido sin vuelta atrás" — ambos casos son la misma fila. Un WMS de referencia sí distingue las dos (SAP EWM: reserva blanda vs. ola de picking liberada). No implementado — recomendación: si se construye el motor de picking (§4 "Picking strategy", sin código hoy), agregar `stock_reservations.status CHECK IN ('reserved','committed')`, sin tocar el resto del modelo.                                                                             |
| **Incoming Stock**           | 🔴 Sin ninguna visibilidad hoy, ni "pendiente" ni "en camino"                  | `goods_receipts` no tiene columna `status` (a diferencia de `stock_transfers`/`stock_adjustments`) — confirmado leyendo el modelo completo. Esto significa que, incluso una vez construido su código de aplicación (§4, pendiente), una recepción pasaría de "no existe" a "ya sumó a `quantity_on_hand`" sin ningún estado intermedio visible — no hay un "está en camino, todavía no llegó" consultable desde `inventory` (esa información, si existiera, viviría en `purchases.purchase_orders`, fuera de este dominio).                                                        |
| **Outgoing Stock**           | 🔴 Mismo vacío, en espejo                                                      | `goods_issues` tampoco tiene `status`. "Saliendo pero todavía no descontado" no es un estado distinto de `Reserved` en el modelo actual — una vez que `sales` invoque la salida real, el movimiento `issue` descuenta `quantity_on_hand` en el mismo paso que libera la reserva (§9 de `19-modulo-inventory.md`, ya citado en §1.3 de este ADR), sin una fase "saliendo" intermedia.                                                                                                                                                                                               |
| **In Transit**               | ✅ Real y ya documentado — pero explícitamente **no es una cantidad de stock** | `stock_transfers.status = 'in_transit'` (`docs/database/sql/06_inventory.sql:170`). Ver §3.2 (Transit Warehouse): mientras está en tránsito, la mercadería **no aparece en ningún `stock`** — se descontó del origen (`transfer_out`) y todavía no se acreditó en el destino (`transfer_in`). Es visible solo consultando `stock_transfers` directamente, no como una cantidad de inventario en sí.                                                                                                                                                                                |
| **Damaged Stock**            | 🟡 Existe como motivo de ajuste, no como cantidad viva                         | **Evidencia real**: `stock_adjustment_reasons` ya tiene sembrado el motivo `"Daño"` (`seed-stock-adjustment-reasons.ts`). Pero un ajuste es un evento puntual — mercadería dañada se **descuenta directamente** de `quantity_on_hand` vía `stock_adjustments` (dirección `adjustment_decrease`), no se mueve a un "balde" de cantidad dañada visible mientras espera destino (reparación, devolución a proveedor, descarte). No existe hoy ningún lugar donde consultar "cuánto stock dañado tengo ahora mismo" — se pierde en el momento del ajuste.                              |
| **Expired Stock**            | 🟡 Dato real, sin cálculo ni vista derivada                                    | `inventory_lots.expiry_date DATE?` (`core/database/prisma/schemas/inventory/schema.prisma:263`) es real — cada lote puede declarar su fecha de vencimiento. Pero **no existe ninguna vista ni columna calculada** que compare `expiry_date` contra la fecha actual (no hay `v_expired_lots` ni equivalente) — hoy es responsabilidad de un reporte externo hacer esa comparación. Igual que Damaged, la salida real de stock vencido pasa por `stock_adjustments` con el motivo ya sembrado `"Vencimiento"`.                                                                       |
| **Blocked Stock**            | 🔴 Sin ningún precedente                                                       | Cero resultados de `blocked`/`hold` en todo el schema y SQL de `inventory`. No hay forma hoy de marcar una porción de `quantity_on_hand` como "no disponible pero tampoco reservada" (p. ej. mercadería retenida por una disputa legal o una orden de devolución a proveedor en curso). Brecha real, sin propuesta de columna todavía — necesitaría definirse junto con Quality Inspection (siguiente fila), porque ambos son formas del mismo problema general: "cantidad físicamente presente, excluida de `v_available_stock`, por una razón distinta de una reserva de venta". |
| **Quality Inspection Stock** | 🔴 Sin ningún precedente                                                       | Cero resultados de `quality`/`inspection`. Consecuencia directa de que `goods_receipts` no tiene `status` (fila "Incoming Stock" arriba): no existe manera de recibir mercadería en un estado "recibida físicamente, pendiente de aprobar calidad" antes de que cuente como disponible para venta.                                                                                                                                                                                                                                                                                 |

### 5.3 Recomendación de este ADR — un tercer estado de disponibilidad, no cuatro columnas nuevas

Blocked y Quality Inspection Stock son, estructuralmente, el mismo problema: cantidad físicamente
presente que **no debe** sumar a `v_available_stock` por una razón que no es una reserva de venta.
Siguiendo el mismo criterio de `ADR-INV-001 §8` (extender el mecanismo existente antes que crear
columnas nuevas por caso de uso), se recomienda **no** agregar `quantity_blocked`/
`quantity_in_inspection` como columnas nuevas de `stock` — en su lugar, generalizar
`quantity_reserved` a una noción más amplia de "cantidad no disponible con motivo", reutilizando el
mismo total denormalizado que ya existe, con el motivo distinguido por `source_module` (ya real en
`stock_reservations`: `'sales'`, `'quality_control'`, `'legal_hold'`, sin necesidad de `CHECK` fijo,
mismo patrón polimórfico ya usado en todo el dominio). `v_available_stock` seguiría siendo
`quantity_on_hand - quantity_reserved` sin cambio de fórmula — el cambio es de **quién puede crear**
una fila en `stock_reservations`, no de la vista en sí.

### 5.4 Cómo interactúan — diagrama de estados reales vs. propuestos

```text
                                    ┌─────────────────────┐
                                    │  quantity_on_hand      │  ← única cantidad "física" real
                                    └──────────┬───────────┘
                                               │
                     ┌─────────────────────────┼─────────────────────────┐
                     │                         │                         │
                     ▼                         ▼                         ▼
          ┌─────────────────────┐   ┌─────────────────────┐   ┌──────────────────────────┐
          │ quantity_reserved     │   │  (sin bucket propio)  │   │  (sin bucket propio)       │
          │  REAL — Reserved/     │   │  Damaged / Expired    │   │  Blocked / Quality          │
          │  Committed (§5.2)     │   │  → stock_adjustments   │   │  Inspection (§5.2, §5.3)    │
          │  ampliable a Blocked/ │   │  (evento puntual,      │   │  → sin precedente, mismo      │
          │  Quality (§5.3)       │   │  reduce on_hand directo)│   │  mecanismo propuesto que ←──┘
          └──────────┬───────────┘   └─────────────────────┘   └──────────────────────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │ v_available_stock    │  =  quantity_on_hand − quantity_reserved
          │  (vista, real)        │      consultado por `sales` antes de vender (integración pendiente)
          └─────────────────────┘

Fuera de `stock` por completo:
  In Transit        → visible solo en stock_transfers.status='in_transit' (§3.2, §5.2)
  Incoming/Outgoing  → sin estado intermedio hoy; goods_receipts/goods_issues sin columna status (§5.2)
```

---

## 6. Reglas de Stock

| Regla solicitada            | Estado real                                                                                                                  | Recomendación de este ADR                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Negative inventory**      | 🔴 Sin control — ya cubierto en §4 ("Negative stock")                                                                        | Ver §4 — no se repite aquí, misma recomendación (`allow_negative_stock` por almacén, validado en `MovimientosService`).                                                                                                                                                                                                                                                                                                                                    |
| **Reservation priority**    | 🔴 Sin columna de prioridad en `stock_reservations`                                                                          | El único orden real hoy es de inserción (`created_at`, implícito). Si dos reservas compiten por el mismo stock escaso, no hay criterio explícito de cuál gana — recomendación: `stock_reservations.priority SMALLINT DEFAULT 0`, mismo patrón ya usado en `putaway_rules.priority` (§2.2), no un mecanismo nuevo.                                                                                                                                          |
| **Automatic replenishment** | 🟡 Ya cubierto en §4 ("Picking strategy"/"Putaway strategy") — mismo vacío: schema real (`replenishment_rules`), cero código | Ver §4 y diagrama de `19-modulo-inventory.md §2`: `replenishment_rules` dispara reposición de zona `picking` cuando cae bajo `min_quantity` — diseñado, no ejecutado automáticamente por ningún motor hoy (nadie evalúa la condición en tiempo real).                                                                                                                                                                                                      |
| **Safety stock**            | 🟡 Conflated con Minimum stock — sin columna propia                                                                          | `replenishment_rules.min_quantity` cumple hoy el rol de umbral único — no distingue "colchón de seguridad" (nunca tocar) de "punto de disparo de reposición" (dispara una orden, pero puede consumirse mientras llega). Ver Reorder point, misma fila.                                                                                                                                                                                                     |
| **Minimum stock**           | ✅ Real — `replenishment_rules.min_quantity NUMERIC(18,6) NOT NULL`                                                          | Ninguna — ya existe, es el umbral que dispara reposición hacia la zona de picking (`19-modulo-inventory.md §2`).                                                                                                                                                                                                                                                                                                                                           |
| **Maximum stock**           | ✅ Real — `replenishment_rules.max_quantity NUMERIC(18,6) NOT NULL`                                                          | Ninguna — ya existe, es el techo al que se repone.                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Reorder point**           | 🟡 Mismo campo que Minimum stock — sin distinción                                                                            | En un WMS de referencia, "reorder point" (dispara una orden de compra) y "minimum stock" (umbral de reposición interna entre zonas) suelen ser dos conceptos relacionados pero no idénticos — GORAZUS hoy solo modela el segundo, y solo a nivel de `inventory` (reposición zona↔zona), no conectado a `purchases` (que no tiene ningún campo ni integración con `inventory` todavía, §1.3). Brecha real de integración cross-dominio, no solo de columna. |
| **Lead time**               | ✅ Real — pero vive en `products`, no en `inventory`                                                                         | `products.product_suppliers.lead_time_days Int?` (`core/database/prisma/schemas/products/schema.prisma:682`) — ya citado tangencialmente en `ADR-INV-001 §1.2`. Relevante aquí porque cualquier cálculo real de reorder point necesitaría combinar `inventory.replenishment_rules.min_quantity` con este campo de `products` — cálculo cross-dominio, no implementado en ningún lado hoy.                                                                  |
| **Backorders**              | 🔴 Sin ningún mecanismo — ni en `inventory` ni en `sales`                                                                    | Depende enteramente de que `sales` sepa reaccionar a `v_available_stock` insuficiente, y `sales` hoy no invoca `inventory` en absoluto (§1.3, §4). No es una brecha de este dominio en particular — es consecuencia directa de que la integración `sales`↔`inventory` no está construida.                                                                                                                                                                  |
| **Partial reservations**    | 🟢 Permitido por el schema, sin bloqueo explícito                                                                            | `stock_reservations.quantity` es un valor libre — nada impide crear una reserva por menos de la cantidad total solicitada, y nada impide crear varias reservas parciales para el mismo pedido (`source_entity_id` repetido). Si `sales` debe partir un pedido en múltiples reservas parciales es una decisión de ese dominio, no una restricción de `inventory`.                                                                                           |

---

## 7. Visibilidad de Inventario

### 7.1 Por dónde se puede consultar hoy, y dónde se corta la granularidad real

| Dimensión solicitada     | Estado real                                                                                                                                                                                                                                                                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Company / Branch**     | ✅ Vía `warehouses.company_id`/`branch_id` (§1.3, §2.2) — toda consulta de stock puede filtrarse transitivamente por empresa/sucursal a través del almacén.                                                                                                                                                                                                |
| **Warehouse**            | ✅ `stock.warehouse_id`, obligatorio — nivel base de agrupación de todo el dominio.                                                                                                                                                                                                                                                                        |
| **Zone**                 | 🟡 Indirecta — `stock.location_id` apunta a `warehouse_locations`, que a su vez tiene `zone_id`; no hay filtro directo "stock por zona" sin resolver la cadena de ubicaciones.                                                                                                                                                                             |
| **Bin**                  | ✅ Vía `stock.location_id` (nullable) — el nivel más fino de visibilidad real que existe, cuando se usa (§2.3, §4 "Location tracking").                                                                                                                                                                                                                    |
| **Product**              | ✅ `stock.product_id`, obligatorio.                                                                                                                                                                                                                                                                                                                        |
| **Variant**              | ✅ Sin columna propia — y **no la necesita**: una variante ya es una fila distinta de `products.products` (`parent_product_id`, `ADR-INV-001 §5.1`), así que `stock.product_id` de una variante _es_ la variante. No es una brecha, es una consecuencia limpia del diseño de `products`.                                                                   |
| **Lot**                  | 🟡 Granularidad real más pobre que Bin — `inventory_lots` tiene `product_id` + `warehouse_id` (opcional), **sin `location_id`/`zone_id`**. Un lote es visible por almacén, no por bin específico dentro de él — brecha real frente a un WMS de referencia (SAP EWM rastrea lote a nivel de bin).                                                           |
| **Serial Number**        | 🟡 Misma brecha que Lot — `inventory_serials` tampoco tiene `location_id`. Visible por almacén, no por bin.                                                                                                                                                                                                                                                |
| **Owner**                | 🔴 No existe — ya señalado en §3.2 (Consignment Warehouse) como brecha real: ninguna tabla de este dominio tiene columna de propiedad.                                                                                                                                                                                                                     |
| **Customer Reservation** | 🟡 Indirecta y sin integridad referencial — `stock_reservations.source_module`/`source_entity_id` apunta, en teoría, a `sales.sales_orders`, pero es una FK suelta polimórfica (sin `REFERENCES` real) — "qué cliente reservó esto" requiere un `JOIN` de aplicación hacia `sales`, no está garantizado por la base de datos.                              |
| **Supplier**             | 🔴 No existe a nivel de unidad física — `products.product_suppliers` dice qué proveedores _pueden_ surtir un producto, pero ninguna fila de `inventory_lots`/`stock`/`goods_receipts` tiene `supplier_id` — no hay forma de preguntar "¿de qué proveedor vino este lote específico?" hoy, ni siquiera una vez construida la integración de compras (§1.3). |

### 7.2 Diagrama — árbol de resolución real de una consulta de visibilidad

```text
Company ──▶ Branch ──▶ Warehouse ──▶ Zone ──▶ Bin ──▶ (stock.location_id, opcional)
                              │
                              ├──▶ Product (obligatorio) ──▶ Variant (= otra fila de products, sin columna propia)
                              │
                              ├──▶ Lot ─────────┐
                              │                  │  ambos se detienen en Warehouse — SIN bajar a Zone/Bin
                              └──▶ Serial ───────┘  (brecha real, §7.1)

                              Owner            → sin columna en ningún nivel (brecha, §3.2)
                              Customer (via reserva) → indirecto, sin FK real, requiere JOIN a `sales` (§7.1)
                              Supplier          → sin columna en ningún nivel físico (brecha, §7.1)
```

### 7.3 Diagrama — flujo completo de inventario, con lo real marcado y lo propuesto entre corchetes

```text
[purchases — sin integración real]         inventory.goods_receipts (schema real, sin código, sin status)
        │                                              │
        │  (no construido, §1.3)                       ▼
        └───────────────────────────────▶  [Quality Inspection — propuesto, §5.3]
                                                        │
                                                        ▼
                                          quantity_on_hand += (movimiento 'receipt')
                                                        │
                          ┌─────────────────────────────┼─────────────────────────────┐
                          ▼                             ▼                             ▼
              stock_reservations                stock_transfers                stock_adjustments
              (Reserved/Committed,               (source→dest, 2 movimientos:    (Daño/Vencimiento/...,
               real, §5.2)                        transfer_out + transfer_in,     evento puntual, real, §5.2)
                          │                        real, §1.3, §3.2)                        │
                          ▼                                                                  ▼
              v_available_stock                                                  quantity_on_hand −= N
              (real, vista)                                                       (sin bucket "dañado" visible)
                          │
                          ▼
              [sales — sin integración real, §1.3, §4, §6]
                          │
                          ▼
              inventory.goods_issues (schema real, sin código, sin status) → quantity_on_hand −= N
```

---

## 8. Trazabilidad de Lotes (Lot Tracking)

### 8.1 Estado real — cinco columnas de negocio, sin conexión al evento que las originó

**Estado real verificado**: `inventory.inventory_lots` tiene exactamente cinco columnas de negocio
— `product_id`, `warehouse_id` (nullable), `lot_number`, `expiry_date` (nullable), `remaining_quantity`
(`core/database/prisma/schemas/inventory/schema.prisma:242-269`). **Hallazgo crítico**:
`goods_receipt_lines` (la línea de una recepción real) **no tiene ninguna columna `lot_id`** — a
diferencia de `fifo_cost_layers`, que sí conecta con `source_receipt_line_id` (§5, §10.1). Esto
significa que, en el schema actual, un lote se crea como un registro **independiente**, sin ningún
FK que lo ate a la recepción de mercadería que lo trajo — la relación "este lote entró en esta
recepción" no es reconstruible desde la base de datos hoy, solo podría inferirse por coincidencia de
fecha/proveedor en un reporte externo.

### 8.2 Los nueve elementos solicitados, uno por uno

| Elemento solicitado    | Estado real                                                                                                                                                                                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Batch Number**       | ✅ Real — `inventory_lots.lot_number`.                                                                                                                                                                                                                                                                    |
| **Manufacturing Date** | 🔴 No existe — solo `expiry_date`. Ninguna columna de fecha de fabricación en `inventory_lots` ni en `products` (confirmado, ya señalado como gap general en `19-modulo-inventory.md §13`: "fecha de fabricación... ninguno tiene columna hoy").                                                          |
| **Expiration Date**    | ✅ Real — `inventory_lots.expiry_date DATE?`. Sin vista/columna calculada que compare contra la fecha actual (§5.2, "Expired Stock").                                                                                                                                                                     |
| **Supplier Batch**     | 🔴 No existe distinción — `lot_number` es un único campo de texto libre, sin separar "número que le puso el proveedor" de "número interno".                                                                                                                                                               |
| **Internal Batch**     | 🔴 Mismo campo que Supplier Batch — no hay dos columnas, es una sola.                                                                                                                                                                                                                                     |
| **Quality Status**     | 🔴 No existe — mismo vacío ya señalado en §5.2 (Quality Inspection Stock); un lote no tiene ningún campo de estado de calidad.                                                                                                                                                                            |
| **Country of Origin**  | 🔴 No existe en ningún lado del sistema — `grep` de `country_of_origin`/`origin` sobre todo `products/schema.prisma`, sin resultados.                                                                                                                                                                     |
| **Certificates**       | 🟡 Sin columna propia, pero **resoluble sin cambio de schema**: `core.documents` (repositorio polimórfico ya real, `source_module`/`source_entity_id`, usado para certificados de producto en `ADR-INV-001 §6`) aplicaría exactamente igual a `inventory_lots` — mismo mecanismo, otra entidad de origen. |
| **Complete history**   | 🟢 Capturado automáticamente, pero no consultable por lote específico todavía — ver §8.3.                                                                                                                                                                                                                 |

### 8.3 Historial completo — el dato ya se captura, la consulta todavía no existe

**Hallazgo real importante**: GORAZUS ya tiene un trigger de auditoría **universal** —
`core.fn_audit_log` (`docs/database/sql/26_triggers.sql:28-62`), aplicado automáticamente a las 494
tablas del sistema **excepto** una lista corta de exclusión (que incluye `inventory.stock_movements`,
excluido deliberadamente por ser ya en sí mismo un log de eventos — comentario real: _"ya SON el
registro de auditoría"_). `inventory.inventory_lots` **no** está en la lista de exclusión — cada
`INSERT`/`UPDATE`/`DELETE` sobre un lote ya se captura, sin intervención de la aplicación, en
`core.audit_logs` (`old_values`/`new_values` como JSONB, inmutable — solo `INSERT`, ningún rol tiene
`UPDATE`/`DELETE`). El problema real no es de captura de datos, es de **consulta**: el único endpoint
real (`AuditoriaController`, `modules/seguridad/backend/`) filtra por `tableName`/`operation`/
`actorUserId` (`auditoria.schema.ts`) — **sin parámetro `rowId`**. Hoy es técnicamente imposible pedir
"dame el historial completo de este lote específico" a través de la API — solo "dame todos los
cambios de la tabla `inventory.inventory_lots`", sin poder acotar a una fila.

### 8.4 Diagrama — modelo de datos de un lote y su historial real

```text
┌─────────────────────┐         ┌──────────────────────────────────┐
│ inventory.goods_       │  SIN FK │  inventory.inventory_lots           │
│ receipt_lines           │ ◀╌╌╌╌╌╌ │  lot_number, expiry_date,           │
│ (recepción real)        │ (brecha)│  remaining_quantity                  │
└─────────────────────┘         └───────────────┬──────────────────┘
                                                    │ cada INSERT/UPDATE/DELETE
                                                    ▼ (automático, vía trigger real)
                                     ┌──────────────────────────────────┐
                                     │  core.audit_logs                    │
                                     │  table_name, row_id, operation,     │
                                     │  old_values, new_values (JSONB)     │
                                     │  INMUTABLE                          │
                                     └───────────────┬──────────────────┘
                                                    │ consultable hoy solo por
                                                    ▼ tableName/operation/actorUserId
                                     ┌──────────────────────────────────┐
                                     │  GET /seguridad/auditoria           │
                                     │  (sin filtro por rowId — brecha     │
                                     │   de API, no de captura de datos)   │
                                     └──────────────────────────────────┘
```

**Recomendación de este ADR**: agregar `rowId` (opcional) a `filtroAuditoriaSchema` — cambio mínimo,
sin tocar el trigger ni el schema de base de datos, que desbloquea "historial completo de este lote"
para lotes, series, y cualquier otra entidad del sistema al mismo tiempo (el mecanismo ya es
genérico). Es la recomendación de mayor apalancamiento de todo este ADR: una sola columna de filtro
en un validador Zod existente resuelve "Complete history" para Lot Tracking y buena parte de
"Ownership/Repair/Return/Replacement History" de Serial Tracking (§9).

---

## 9. Trazabilidad de Números de Serie (Serial Number Tracking)

### 9.1 Estado real

**Estado real verificado**: `inventory.inventory_serials` — `product_id`, `warehouse_id` (nullable),
`serial_number` (texto libre, sin tipo), `status CHECK IN ('in_stock','sold','under_warranty','scrapped')`,
`unit_cost` (`core/database/prisma/schemas/inventory/schema.prisma:271-298`). El ciclo de vida
`in_stock → sold → under_warranty → scrapped` ya está documentado como diagrama conceptual en
`18-modulo-products.md §7`, con la transición a `under_warranty` disparada por _"reclamo de
garantía → `services.service_orders`"_ — pero esa flecha es **conceptual**, no un FK real (§9.3).

### 9.2 Los nueve elementos solicitados, uno por uno

| Elemento solicitado       | Estado real                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **IMEI**                  | 🟢 Cubierto por `serial_number` — texto libre sin `CHECK` de formato, mismo criterio que GTIN/UPC/EAN en un solo campo (`ADR-INV-001 §6`). No se recomienda una columna `imei` separada sin evidencia de necesidad real.                                                                                                                                                                                                                                                                      |
| **VIN**                   | 🟢 Mismo mecanismo que IMEI.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **MAC Address**           | 🟢 Mismo mecanismo.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Custom Serial Numbers** | ✅ Ya es esto por diseño — `serial_number` no tiene ningún `CHECK` de formato, acepta cualquier convención que la empresa defina.                                                                                                                                                                                                                                                                                                                                                             |
| **Warranty**              | 🔴 **Brecha real crítica** — ni `sales.warranties`, ni `sales.warranty_claims`, ni `services.service_orders` tienen columna `serial_number`/`inventory_serial_id` (confirmado leyendo los tres modelos completos). El diagrama de `18-modulo-products.md §7` describe una transición de estado que hoy **no tiene ningún mecanismo real que la dispare** — nada conecta una garantía o un reclamo con la fila exacta de `inventory_serials` cuyo `status` debería cambiar a `under_warranty`. |
| **Ownership History**     | 🔴 No existe — ninguna columna de propietario en `inventory_serials` (mismo gap de Owner ya señalado en §3.2/§7.1), y sin `rowId` en la API de auditoría (§8.3) tampoco es consultable hoy el historial de cambios de la fila.                                                                                                                                                                                                                                                                |
| **Repair History**        | 🔴 `services.service_parts_consumed` es real (`product_id`, `quantity`, `service_order_id`) pero **sin columna de serial** — registra qué producto se consumió en una orden de servicio, no qué unidad serializada específica se reparó ni qué repuesto (con su propio serial) se instaló.                                                                                                                                                                                                    |
| **Return History**        | 🔴 `sales.sales_return_lines`/`purchases.purchase_return_lines` son reales (`product_id`, `quantity`, `reason`) — **sin columna de serial ni de lote** en ninguna de las dos. No hay forma de saber qué unidad física específica volvió.                                                                                                                                                                                                                                                      |
| **Replacement History**   | 🔴 Sin ningún precedente — no existe ni el concepto de "este serial fue reemplazado por aquel otro" en ningún lado del schema.                                                                                                                                                                                                                                                                                                                                                                |

### 9.3 Recomendación de este ADR — cerrar la brecha con una sola columna repetida, no un subsistema nuevo

Las cuatro brechas de Warranty/Ownership/Repair/Return/Replacement History comparten la misma causa
raíz: **ninguna tabla transaccional que debería referenciar una unidad serializada específica lo
hace**. La recomendación de este ADR es sistemática, no puntual — agregar
`inventory_serial_id UUID NULLABLE` (FK a `inventory.inventory_serials.id`) a cuatro tablas ya
reales: `services.service_orders` (o a `service_parts_consumed`, si el repuesto instalado también se
serializa), `sales.warranty_claims`, `sales.sales_return_lines`, `purchases.purchase_return_lines`.
Nullable porque no todo producto se serializa (`tracks_serial`, `ADR-INV-001 §2.1`) — la columna
simplemente queda vacía para líneas de productos no serializados. Ninguna de las cuatro requiere
tabla nueva ni cambio de motor; es el mismo patrón de FK suelta ya usado en todo el dominio (§1.3).
Con esas cuatro columnas más el filtro `rowId` de §8.4, las cuatro historias solicitadas se resuelven
consultando `core.audit_logs` filtrado por la fila del serial **y** haciendo `JOIN` desde las cuatro
tablas hacia ese `inventory_serial_id` — sin ningún subsistema de "historial" dedicado nuevo.

### 9.4 Diagrama — brechas de conexión reales (líneas punteadas = FK que no existe hoy)

```text
inventory.inventory_serials
  serial_number, status ('in_stock'→'sold'→'under_warranty'→'scrapped')
        ▲            ▲              ▲                  ▲
        ╎            ╎              ╎                  ╎  (todas brechas reales,
        ╎            ╎              ╎                  ╎   ninguna es FK hoy)
        ╎            ╎              ╎                  ╎
   sales.warranty_ services.service_ sales.sales_    purchases.purchase_
   claims          orders /           return_lines     return_lines
   (Warranty)      service_parts_     (Return History)  (Return History,
                    consumed                              lado compra)
                   (Repair History)
```

---

## 10. Trazabilidad Completa

### 10.1 El hallazgo central — trazabilidad de costo real, trazabilidad de unidad física ausente

Este es el hallazgo que explica, de una sola vez, la mayoría de las brechas de §8 y §9: GORAZUS **sí**
tiene una cadena de trazabilidad real y funcional hoy — pero es una cadena de **costo**, no de
**unidad física**. `fifo_cost_layers.source_receipt_line_id` (§9.1 de `19-modulo-inventory.md`, ya
citado en el `ADR` anterior) conecta cada capa de costo consumida en una salida con la línea de
recepción exacta que la originó — eso **sí** es trazabilidad real, verificable en el schema. Pero
ninguna otra tabla del motor de movimiento carga identidad de lote/serie:
`stock_movements`, `stock_transfer_lines`, `goods_receipt_lines`, `stock_adjustment_lines` — **ninguna
de las cuatro tiene `lot_id` ni `serial_id`** (confirmado leyendo los cuatro modelos completos). El
"libro mayor" único de existencias (`stock_movements`, la fuente de verdad según `19-modulo-inventory.md §4`)
opera exclusivamente a nivel `product_id + warehouse_id` — la identidad de qué lote o qué serie
específica se movió se pierde en el momento en que ocurre cualquier movimiento, no solo en los casos
de garantía/reparación/devolución ya señalados en §9.

### 10.2 Diagrama de secuencia ASCII — la cadena que SÍ es real hoy (costo, no unidad física)

```text
Compra          goods_receipt_lines   fifo_cost_layers      stock_movements        stock
  │                     │                     │                    │                 │
  │─ recibe mercadería ─▶                     │                    │                 │
  │                     │─ crea capa ─────────▶                    │                 │
  │                     │  (source_receipt_    │                    │                 │
  │                     │   line_id ← aquí)     │                    │                 │
  │                     │                     │─ INSERT 'receipt' ─▶                 │
  │                     │                     │                    │─ on_hand += N ──▶
  │                     │                     │                    │                 │
Venta                   │                     │                    │                 │
  │─ vende N unidades ──┼─────────────────────▶                    │                 │
  │                     │                     │─ consume capa(s),  │                 │
  │                     │                     │  costo = unit_cost │                 │
  │                     │                     │  de esa capa ──────▶                 │
  │                     │                     │  INSERT 'issue'    │─ on_hand -= N ──▶
  │                     │                     │                    │                 │
  │  ✅ trazable: "el costo de esta venta vino exactamente de esta recepción"          │
  │  🔴 NO trazable: "qué lote/serie específico salió" — ninguna tabla lo registra      │
```

### 10.3 Diagrama de secuencia ASCII — cadena completa solicitada, con lo real y lo propuesto marcado

```text
Purchase        Warehouse           Transfer            Sale              Return           Disposal
   │                │                   │                  │                 │                │
   │ goods_receipt   │                  │                  │                 │                │
   │ [PROPUESTO:     │                  │                  │                 │                │
   │  lot_id/serial_id│                 │                  │                 │                │
   │  en receipt_line]│                 │                  │                 │                │
   │────────────────▶│                  │                  │                 │                │
   │                 │ inventory_lots/  │                  │                 │                │
   │                 │ inventory_serials│                  │                 │                │
   │                 │ (✅ real, pero    │                  │                 │                │
   │                 │  sin FK a la     │                  │                 │                │
   │                 │  recepción)      │                  │                 │                │
   │                 │─────────────────▶│ stock_transfer_  │                 │                │
   │                 │                  │ lines            │                 │                │
   │                 │                  │ [PROPUESTO:      │                 │                │
   │                 │                  │  lot_id/serial_id]│                │                │
   │                 │                  │─────────────────▶│ stock_reservations│              │
   │                 │                  │                  │ + goods_issues   │                │
   │                 │                  │                  │ [PROPUESTO:      │                │
   │                 │                  │                  │  inventory_serial_id              │
   │                 │                  │                  │  en warranty_claims]│              │
   │                 │                  │                  │─────────────────▶│ sales_return_  │
   │                 │                  │                  │                  │ lines           │
   │                 │                  │                  │                  │ [PROPUESTO:     │
   │                 │                  │                  │                  │  inventory_     │
   │                 │                  │                  │                  │  serial_id]      │
   │                 │                  │                  │                  │────────────────▶│
   │                 │                  │                  │                  │                 │ stock_adjustments
   │                 │                  │                  │                  │                 │ reason='Daño'/
   │                 │                  │                  │                  │                 │ 'Vencimiento'
   │                 │                  │                  │                  │                 │ (✅ real, §5.2)
```

### 10.4 Cómo cada movimiento se vuelve trazable — resumen de la recomendación

No se propone un subsistema de trazabilidad nuevo y paralelo — se propone que las tablas **ya
reales** de cada etapa (recepción, transferencia, salida/devolución, ajuste) empiecen a cargar
`lot_id`/`serial_id` (nullable, solo aplica a productos que rastrean lote/serie, `ADR-INV-001 §2.1`)
de la misma forma en que `fifo_cost_layers` ya carga `source_receipt_line_id`. Con eso, más el
trigger de auditoría universal ya real (§8.3) y el filtro `rowId` propuesto en la API de auditoría,
la cadena completa **Purchase → Warehouse → Transfer → Sale → Return → Disposal** queda reconstruible
consultando, en orden, `core.audit_logs` filtrado por la fila del lote/serie exacto — sin tabla de
trazabilidad dedicada, reutilizando en su totalidad la infraestructura de auditoría que el sistema ya
tiene desde `01_core.sql`.

---

## 11. Movimientos de Inventario

### 11.1 Estado real — ocho tipos sembrados, catálogo abierto (no un `CHECK` fijo)

**Estado real verificado**: `stock_movement_types` no es un `CHECK` fijo — es un catálogo abierto
(`code TEXT`, único por tenant), con ocho valores ya sembrados por `seed-stock-movement-types.ts`:
`receipt`/`issue`/`transfer_out`/`transfer_in`/`adjustment_increase`/`adjustment_decrease`/
`production_output`/`production_consumption`, cada uno con `direction CHECK IN ('in','out')`. Agregar
un tipo nuevo es un `INSERT` real vía `POST /inventario/tipos-movimiento` (ya con código de
aplicación, `TiposMovimientoController`) — no requiere migración de schema. Los motivos de ajuste
(`stock_adjustment_reasons`) también están sembrados: _"Daño, Pérdida, Robo, Error Humano, Diferencia
de Conteo, Regularización, Producción, Consumo Interno, Donación, Vencimiento, Ajuste Administrativo,
**Inventario Inicial**, Otro"_ (`seed-stock-adjustment-reasons.ts`) — con hallazgos directamente
relevantes para esta sección, señalados en la tabla siguiente.

### 11.2 Los trece tipos solicitados, uno por uno

| Tipo solicitado            | Estado real                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purchase Receipt**       | ✅ Real — tipo `receipt`, `direction='in'`. Se ejecuta vía `goods_receipts` (schema real, sin código de aplicación todavía, §4/§10.3).                                                                                                                                                                                                                                                                                                                |
| **Sales Shipment**         | ✅ Real — tipo `issue`, `direction='out'`. Vía `goods_issues` (mismo estado que `goods_receipts`: schema real, sin código, §4/§10.3).                                                                                                                                                                                                                                                                                                                 |
| **Transfer**               | ✅ Real y completo — `transfer_out` + `transfer_in`, siempre en par (§1.3, §3.2) — el único movimiento con código de aplicación real end-to-end (`TransferenciasController`).                                                                                                                                                                                                                                                                         |
| **Adjustment**             | ✅ Real — `adjustment_increase`/`adjustment_decrease`, con `AjustesController` real, flujo `draft→confirmed` (§4 "Negative stock" ya documenta el mecanismo de confirmación).                                                                                                                                                                                                                                                                         |
| **Inventory Opening**      | ✅ Real, sin tipo propio — se modela como `adjustment_increase` con el motivo ya sembrado **"Inventario Inicial"**. No necesita un tipo de movimiento dedicado: la semántica vive en el motivo, no en la dirección del movimiento.                                                                                                                                                                                                                    |
| **Inventory Closing**      | 🔴 No es un movimiento, y no existe — a diferencia de "Opening" (que sí es un evento puntual real), un "cierre de inventario" en sentido contable (bloquear nuevas escrituras sobre un período ya cerrado) es un concepto de **control de período**, no un movimiento — GORAZUS no tiene ningún campo de período/bloqueo en `inventory` (ni `fiscal_period_id` ni `is_locked`) — brecha real, distinta en naturaleza a las demás filas de esta tabla. |
| **Consumption**            | ✅ Real, dos variantes distintas — `production_consumption` (`direction='out'`, consumido por una orden de producción) **y**, por separado, el motivo de ajuste **"Consumo Interno"** (bienes que no se revenden, ver clasificación `Consumible` de `ADR-INV-001 §3.2`) — dos mecanismos reales para dos negocios distintos, no uno solo.                                                                                                             |
| **Production**             | ✅ Real — tipo `production_output`, `direction='in'`. Ver `inventory.production_orders` (schema real, sin código, §3.2 "Production Warehouse").                                                                                                                                                                                                                                                                                                       |
| **Return**                 | 🟡 Sin tipo dedicado, pero extensible sin cambio de schema — el catálogo abierto (§11.1) permite agregar `return_in`/`return_out` con un simple `INSERT` cuando se construya la integración con `sales_returns`/`purchase_returns` (§9.2, §10.3, ambas sin código todavía). No hay ninguna razón de diseño para reusar `receipt`/`issue` — un tipo propio preserva la distinción de negocio en reportes/kardex.                                       |
| **Damage**                 | ✅ Real — `adjustment_decrease` + motivo ya sembrado **"Daño"** (§5.2, ya confirmado en la sección de Cantidades de Inventario).                                                                                                                                                                                                                                                                                                                      |
| **Loss**                   | ✅ Real — `adjustment_decrease` + motivo ya sembrado **"Pérdida"**. Distinto de "Daño" en el motivo, mismo tipo de movimiento — la diferencia de negocio vive en `stock_adjustment_reasons`, no en `stock_movement_types`.                                                                                                                                                                                                                            |
| **Cycle Count Adjustment** | ✅ Real y con reconciliación automática ya documentada — `physical_count_lines` con diferencia entre `system_quantity`/`counted_quantity` genera automáticamente una línea de `stock_adjustments` al completar el conteo (`19-modulo-inventory.md §8`), con el motivo ya sembrado **"Diferencia de Conteo"** — `physical_counts` nunca ajusta `stock` directamente, siempre pasa por este mismo mecanismo auditado.                                   |

### 11.3 Reglas de negocio — por qué la dirección vive en el tipo, no en la cantidad

`stock_movement_types.direction CHECK IN ('in','out')` es la regla central de todo el motor:
`stock_movements.quantity` **siempre es positiva** — el signo lo determina el tipo de movimiento, no
el valor de la cantidad (`19-modulo-inventory.md §4`, ya citado en `ADR-INV-001` para el patrón
análogo de kardex). Esto evita una clase entera de errores (una cantidad negativa mal capturada) al
costo de una regla simple: todo motor que escribe en `stock_movements` debe resolver primero el
`movement_type_id` correcto, nunca inferir la dirección desde el signo del número.

---

## 12. Kardex

### 12.1 Estado real — vista derivada, no tabla, con doce de trece campos parcial o totalmente cubiertos

**Estado real verificado**: `inventory.v_kardex` (`docs/database/sql/24_views.sql:13-25`) es una
**vista**, no una tabla — deliberadamente, según el comentario real de la propia vista: _"Sustituye
una tabla `inventory.kardex_entries` — 100% derivable de `stock_movements`"_. Sus columnas reales:
`tenant_id`, `company_id`, `branch_id`, `product_id`, `warehouse_id`, `movement_type_id`,
`direction`, `quantity`, `unit_cost`, `movement_value` (`quantity × unit_cost`, calculado),
`movement_date` (`= created_at`), `running_balance` (suma acumulada con función de ventana,
particionada por `product_id, warehouse_id`, ordenada por `created_at`).

### 12.2 Los trece campos solicitados, uno por uno

| Campo solicitado    | Estado real                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Before Quantity** | 🟡 Derivable, no seleccionado hoy — `running_balance − (dirección × quantity)` de la propia fila, o un `LAG()` sobre `running_balance`. No requiere cambio de schema, solo una columna calculada más en la vista.                                                                                                                                                                                                                     |
| **After Quantity**  | ✅ Real — `running_balance`.                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Before Cost**     | 🔴 No existe en la vista — `unit_cost` es el costo **de ese movimiento puntual**, no un costo acumulado. El costo promedio corrido vive por separado en `inventory.average_cost_history` (§6, §10.1), sin `JOIN` hacia `v_kardex` hoy.                                                                                                                                                                                                |
| **After Cost**      | 🟡 Depende del método de costeo (`products.costing_method`, `ADR-INV-001 §7`) — con `average`, sería el `new_average_cost` más reciente de `average_cost_history`; con `fifo`, no existe un único "costo después" (son capas distintas, `fifo_cost_layers`, §10.1) — la pregunta en sí tiene una respuesta distinta según el método, algo que un kardex de referencia (SAP, NetSuite) sí resuelve mostrando el método junto al valor. |
| **Warehouse**       | ✅ Real — `warehouse_id`.                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Location**        | 🔴 No existe — `stock_movements` no tiene `location_id` (§10.1, misma brecha ya señalada para toda la cadena de movimiento).                                                                                                                                                                                                                                                                                                          |
| **Lot**             | 🔴 No existe — mismo hallazgo central de §10.1 (`stock_movements` sin `lot_id`).                                                                                                                                                                                                                                                                                                                                                      |
| **Serial Number**   | 🔴 No existe — mismo hallazgo, sin `serial_id`.                                                                                                                                                                                                                                                                                                                                                                                       |
| **Document**        | 🟡 Indirecto — `stock_movements` no tiene `document_number` propio, pero `source_module`/`source_entity_id` (reales) apuntan al documento origen (p. ej. una fila de `stock_transfers`, que sí tiene `document_number`) — requiere `JOIN` de aplicación, no es un valor directo de la fila.                                                                                                                                           |
| **Reference**       | 🟡 Mismo mecanismo que Document — `source_module`/`source_entity_id` polimórfico es, en efecto, la "referencia" — ya real, mismo patrón usado en todo el dominio (§1.3).                                                                                                                                                                                                                                                              |
| **User**            | 🟡 Real en el origen, no expuesto en la vista — `stock_movements.created_by` es una columna universal real (todas las tablas de negocio la tienen), pero `v_kardex` no la selecciona hoy. Agregarla es un cambio de una línea en la vista, sin tocar el schema.                                                                                                                                                                       |
| **Timestamp**       | ✅ Real — `movement_date` (`= created_at`).                                                                                                                                                                                                                                                                                                                                                                                           |
| **Company**         | ✅ Real — `company_id`.                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Branch**          | ✅ Real — `branch_id`.                                                                                                                                                                                                                                                                                                                                                                                                                |

**Recomendación de este ADR**: de los trece campos, siete ya están completamente resueltos, tres son
cambios triviales a la definición de la vista (`Before Quantity` vía `LAG`, `User` vía `created_by`,
`Document`/`Reference` vía `JOIN` a la tabla origen del `source_module`), y tres dependen de las
mismas columnas `lot_id`/`serial_id` recomendadas en §10.4 — ninguno requiere una tabla `kardex_entries`
nueva, contradiciendo la premisa que llevaría a materializar el kardex en vez de derivarlo.

### 12.3 Por qué el Kardex debe ser inmutable

Un kardex existe para responder, con confianza total, "¿qué pasó exactamente, en qué orden, y a qué
costo?" — esa garantía se rompe estructuralmente si una fila de `stock_movements` puede
desaparecer o alterarse después de escrita, porque `running_balance` es una **suma acumulada
recalculada en cada consulta** (`19-modulo-inventory.md §5`, ya citado en `ADR-INV-001`): si una fila
intermedia se borra o cambia, el saldo corrido de **todas las filas posteriores** cambia
retroactivamente, en silencio, sin dejar rastro de que el pasado fue reescrito. Esto no es una
preferencia de estilo — es una propiedad matemática de la función de ventana que ya está en producción.

**Tensión real señalada por este ADR**: `stock_movements` **sí tiene** `deleted_at` (columna universal
de soft-delete, presente en las 494 tablas del sistema, `ADR-DB-001`), y `v_kardex` filtra
`WHERE sm.deleted_at IS NULL` — es decir, el mecanismo técnico para invalidar retroactivamente el
kardex **ya existe y está activo**, aunque nada en este ADR ni en la documentación revisada indique
que la aplicación lo use hoy para movimientos de inventario. Se recomienda una regla de negocio
explícita, no solo una convención tácita: `stock_movements` nunca debería soft-eliminarse en la
práctica — una corrección se registra como un **nuevo movimiento compensatorio** (mismo criterio ya
aplicado a `stock_adjustments`, §11.2), preservando cada fila que alguna vez existió. El
particionamiento mensual ya real (`ADR-DB-001 §7`) refuerza esto en la práctica — particiones
antiguas pueden marcarse de solo lectura a nivel de base de datos — pero eso tampoco está aplicado
hoy; es una recomendación adicional de este ADR, no un hecho verificado.

---

## 13. Eventos de Dominio

### 13.1 Estado real — infraestructura genuina de RabbitMQ, cero eventos publicados en `inventory`

**Hallazgo real importante**: GORAZUS tiene un event bus **real y ya en código**, no una propuesta —
`core/messaging/event-bus.service.ts`, sobre RabbitMQ (`amqplib`), con un exchange topic único
`gorazus.eventos`, convención de routing key `<modulo>.<entidad>.<evento>`
(`docs/architecture/08-infraestructura-y-despliegue.md §4`), cola durable **propia** por consumidor
(nunca compartida entre módulos) con su propia dead-letter queue, y propagación del `requestId` de
trazabilidad en los headers del mensaje. El método `subscribe()` está completo y funcional.

**Pero, confirmado por búsqueda exhaustiva**: existen exactamente tres clases de evento en todo el
repositorio — `UsuarioAutenticadoEvent` (`auth`), `RolCreadoEvent` (`seguridad`),
`FacturaCreadaEvent` (`ventas`) — y **ninguna de las tres se publica todavía**. El propio comentario
real de `FacturaCreadaEvent` lo dice explícito: _"`EventBusService` existe desde Fase 5 sin ningún
módulo de negocio que lo use para publicar — `VentasService.crearFactura()` no lo llama todavía"_.
`modules/inventario/` no tiene, hoy, **ninguna** clase de evento — ni publicada ni declarada.

### 13.2 Doce eventos, reconciliados con `docs/ddd/07_domain_events.md` (corregido, ver nota)

**Corrección aplicada tras revisión de gobernanza (2026-07-27)**: la versión original de esta
sección nombraba seis eventos en inglés (`InventoryReceived`, `InventoryTransferred`, etc.). Una
revisión completa de la base de conocimiento encontró que `docs/ddd/07_domain_events.md §1.2` y
`docs/ddd/04_aggregates.md` ya catalogan formalmente eventos de Inventario **en español**
(`StockActualizado`, `StockInsuficiente`, `AlmacenCreado`, `TransferenciaCompletada`,
`AjusteInventarioAplicado`, `ConteoFisicoCompletado`) — ninguno coincidía con los nombres originales
de esta sección. Se corrige aquí con los mismos doce nombres ya reconciliados en
`ADR-INV-000 §9.2` (documento que ahora es la fuente de verdad de esta lista; ver ese ADR para el
detalle de precedencia evento por evento). Payload en `camelCase` español, siguiendo la convención ya
establecida en `docs/ddd/`.

| Evento                             | `routingKey` (convención real `<modulo>.<entidad>.<evento>`) | Se publicaría cuando...                                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RecepcionConfirmada**            | `inventario.recepcion.confirmada`                            | Se confirma un `goods_receipts` (§4, §11.2 "Purchase Receipt") — payload: `productoId`, `almacenId`, `cantidad`, `costoUnitario`, `loteId`/`serieId` (si aplica, §10.4).                              |
| **TransferenciaCompletada**        | `inventario.transferencia.completada`                        | `stock_transfers.status` pasa a `'received'` (§1.3, §3.2) — payload: `transferenciaId`, `origenId`, `destinoId`, `productoId`, `cantidad`.                                                            |
| **ReservaCreada**                  | `inventario.reserva.creada`                                  | Se crea una fila en `stock_reservations` (ya con código real, `ReservasController`, §4 "Automatic reservations") — payload: `productoId`, `almacenId`, `cantidad`, `moduloOrigen`, `entidadOrigenId`. |
| **ReservaLiberada**                | `inventario.reserva.liberada`                                | `stock_reservations.released_at` se completa (§5.2) — mismo payload que `ReservaCreada`.                                                                                                              |
| **AjusteInventarioAplicado**       | `inventario.ajuste.aplicado`                                 | `stock_adjustments.status` pasa a `'confirmed'` (§11.2) — payload: `ajusteId`, `productoId`, `almacenId`, `diferencia`, `motivoId`.                                                                   |
| **ConsumoProduccionRegistrado**    | `inventario.produccion.consumo-registrado`                   | Un movimiento `production_consumption` se registra (§11.2) — payload: `productoId`, `almacenId`, `cantidad`, `ordenProduccionId`.                                                                     |
| **StockActualizado**               | `inventario.stock.actualizado`                               | Señal amplia de cambio de saldo, para UI en vivo (`core/realtime`) — payload: `productoId`, `almacenId`, `cantidadDisponible`.                                                                        |
| **StockInsuficiente**              | `inventario.stock.insuficiente`                              | `v_available_stock` insuficiente para una venta — payload: `ventaId`, `productoId`, `cantidadFaltante`.                                                                                               |
| **ConteoFisicoCompletado**         | `inventario.conteo.completado`                               | `physical_counts.status` pasa a `'completed'` (§11.2 "Cycle Count Adjustment") — payload: `conteoId`, `almacenId`, `diferenciasEncontradas`.                                                          |
| **AlmacenCreado**                  | `inventario.almacen.creado`                                  | Se crea un `Almacen` (§4) — payload: `almacenId`, `sucursalId`.                                                                                                                                       |
| **LoteCreado** / **SerieAsignada** | `inventario.lote.creado` / `inventario.serie.asignada`       | Ver `ADR-INV-000 §9.2` — agregados propuestos, sin entidad de dominio todavía.                                                                                                                        |
| **ReposicionDisparada**            | `inventario.reposicion.disparada`                            | Ver `ADR-INV-000 §9.2` — servicio propuesto, sin código todavía.                                                                                                                                      |

### 13.3 Cómo otros módulos se suscribirían — mecanismo real, integración propuesta

El mecanismo de suscripción **ya existe y es genérico** (§13.1, `subscribe()`) — lo que falta es que
un módulo consumidor lo invoque. Ejemplos concretos, siguiendo la regla real de "cola propia, nunca
compartida" (`08-infraestructura-y-despliegue.md §4`):

- **`accounting`** declararía una cola `accounting.inventory-valuation` bindeada a
  `inventario.recepcion.confirmada` e `inventario.ajuste.aplicado`, para generar automáticamente el
  asiento contable de valuación de inventario sin que `inventory` conozca la existencia de
  `accounting.journal_entries` — mismo principio de desacoplamiento ya aplicado al patrón
  `source_module`/`source_entity_id` en todo este dominio (§1.3).
- **`sales`** declararía una cola `sales.stock-availability` bindeada a `inventario.reserva.liberada`
  y `inventario.stock.insuficiente` para saber cuándo una venta bloqueada por falta de stock puede
  reintentarse (relevante para "Backorders", §6, hoy sin ningún mecanismo).
- **`bi`/`reports`** declararía una cola bindeada a los doce eventos para mantener snapshots
  analíticos (`bi.kpi_snapshots`, ya catalogada en `ADR-DB-001 §7`) sin consultar `inventory`
  directamente en el camino caliente de generación de reportes.

Ninguno de estos tres consumidores existe hoy — se documentan como el patrón de integración correcto
dado el mecanismo real ya construido, no como integraciones ya verificadas.

---

## 14. Conclusión Arquitectónica

Comparado con un ERP típico de PyME (una instancia estándar de Odoo Community, QuickBooks Enterprise,
o un sistema a medida sobre un único schema de base de datos), el diseño documentado en este ADR — no
en su totalidad todavía construido, pero sí certificado a nivel de schema y, en partes concretas, de
código real — excede esa categoría en cuatro dimensiones estructurales concretas, cada una verificada
en este documento y no solo enunciada:

1. **Separación de dominio a nivel de schema físico**, no solo de módulo de aplicación — `inventory`,
   `products`, `sales`, `purchases`, `accounting` son schemas de Postgres distintos (§1.3), integrados
   por FKs sueltas polimórficas en vez de FKs rígidas cross-dominio — un ERP de PyME típico vive en un
   único schema donde cualquier tabla puede, en teoría, hacer `JOIN` directo con cualquier otra,
   acoplando accidentalmente dominios que deberían poder evolucionar por separado.
2. **Auditoría universal, automática e inmutable, a nivel de motor de base de datos** (§8.3, §12.3) —
   494 tablas con un trigger genérico que captura cada cambio sin que ninguna capa de aplicación deba
   recordar hacerlo, con un rol dedicado (`gorazus_audit_writer`) como único con permiso de escritura.
   La mayoría de los ERP de PyME, cuando tienen auditoría, la implementan como una responsabilidad de
   la capa de aplicación — omisible por error humano, un bug, o un `UPDATE` directo a la base de datos.
3. **Particionamiento selectivo basado en patrón de crecimiento real, no uniforme** (`ADR-DB-001`,
   citado en §1.2, §12.3) — solo las tablas de altísimo volumen transaccional se particionan; el resto
   permanece simple. Un ERP de PyME rara vez llega siquiera a necesitar esta decisión, porque su
   volumen de datos no lo exige — pero cuando un ERP de PyME sí crece hasta necesitarlo, típicamente
   no tiene ninguna estrategia y debe migrarse en caliente, con downtime.
4. **Un bus de eventos real desacoplando módulos de negocio** (§13.1) — con colas durables por
   consumidor, dead-letter queue, y trazabilidad de request propagada — en vez de que un módulo llame
   directamente a las funciones internas de otro (el patrón más común en un ERP de PyME, que hace que
   cualquier cambio en un módulo arriesgue romper silenciosamente a los que dependen de él).

**Honestidad final, mismo criterio que el resto de este documento**: esta ventaja es, hoy, de
**arquitectura y de infraestructura**, no de **funcionalidad terminada** — el propio ADR documenta,
sección por sección, que picking/putaway automático, la integración `sales`↔`inventory`, la
trazabilidad física de lote/serie, y la publicación real de eventos de dominio siguen sin construirse
(§4, §6, §9, §10, §13). Lo que un ERP de PyME casi nunca tiene es la base sobre la que construir esas
piezas sin reescribir el sistema — cada brecha señalada en este ADR es una tarea acotada sobre una
arquitectura ya preparada para recibirla (una columna nullable, un `INSERT` en un catálogo abierto, un
`publish()` sobre un bus que ya existe), no un rediseño. Esa es, en última instancia, la diferencia
real entre esta arquitectura y la de un ERP de PyME: no cuánto está terminado hoy, sino cuánto de lo
que falta puede construirse sin romper lo que ya existe.
