# Arquitectura del Módulo de Inventario Enterprise — FASE 05, Parte 01 (Diseño)

> Esta es una fase de **diseño**, no de implementación. Objetivo: dejar la
> arquitectura completa y verificada contra la base de datos real, para que
> la implementación (Parte 02 en adelante) no requiera ningún cambio
> estructural posterior. No se escribió código de negocio nuevo en esta
> parte — ver `INVENTORY_STATUS.md` para el estado exacto y
> `INVENTORY_NEXT_PHASE.md` para el plan de implementación.

## 1. Punto de partida — auditoría obligatoria (hecha, no asumida)

Antes de diseñar nada se auditó contra el SQL real (no contra la
documentación, para no heredar errores ya corregidos una vez — ver
`docs/architecture/19-modulo-inventory.md`/`18-modulo-products.md`, ambos
ya verificados contra schema en su propia fecha):

- `docs/database/sql/06_inventory.sql` — schema `inventory`, **34 tablas**
  (el pedido original decía "32", corregido acá con la fuente real).
- `docs/database/sql/05_products.sql` — schema `products`, **35 tablas**
  (5 con código real desde `v0.7.0`: `units_of_measure`,
  `product_categories`, `brands`, `product_models`, `products`).
- `docs/database/sql/01_core.sql` — multiempresa (`tenants`/`companies`/
  `branches`/`user_companies`).
- `docs/database/sql/26_triggers.sql` — auditoría automática.
- `modules/inventario/backend/` y `modules/productos/backend/` — código ya
  construido (3+5 = 8 de las 69 tablas combinadas).

**Regla que se respeta en todo este documento**: el modelo de datos está
congelado ("Enterprise v1.0.0", ver `VERSION.md`) — no se crea ninguna
tabla ni columna nueva en esta fase. Donde el pedido original pide algo que
el schema no soporta hoy, se documenta como **gap real** (§5), no se
inventa una solución silenciosa.

## 2. Submódulos pedidos → tablas reales (sin duplicar nada)

| Submódulo pedido                  | Tabla(s)/vista real                                                              | Estado                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Kardex                            | `inventory.v_kardex` (vista, saldo corrido sobre `stock_movements`)              | Existe, sin código de aplicación                                                |
| Existencias                       | `inventory.stock` (`quantity_on_hand`)                                           | Existe, sin código de aplicación                                                |
| Inventario Disponible             | `inventory.v_available_stock` (`quantity_on_hand - quantity_reserved`)           | Existe, sin código de aplicación                                                |
| Inventario Comprometido/Reservado | `inventory.stock_reservations` + `stock.quantity_reserved` (denormalizado)       | Existe, sin código de aplicación                                                |
| Inventario en Tránsito            | `inventory.stock_transfers.status = 'in_transit'`                                | **Parcial** — ver §5.1, no es un estado de `stock` en sí                        |
| Inventario Dañado                 | `inventory.goods_issue_reasons` (motivo) + `inventory_serials.status='scrapped'` | **Parcial** — es un evento/motivo, no un estado persistente de stock — ver §5.1 |
| Inventario Obsoleto               | —                                                                                | **Gap real** — ver §5.2                                                         |
| Inventario en Consignación        | `inventory.warehouses.warehouse_type` (`'physical'`\|`'virtual'`)                | **Parcial** — ver §5.1, workaround sin migración                                |
| Inventario por Empresa            | `company_id` en `warehouses` (NOT NULL) y en la mayoría de tablas cabecera       | Existe                                                                          |
| Inventario por Sucursal           | `branch_id` en `warehouses` (NOT NULL, único caso obligatorio)                   | Existe                                                                          |
| Inventario por Almacén            | `inventory.warehouses`                                                           | Existe, **código real desde v0.6.0**                                            |
| Inventario por Ubicación          | `inventory.warehouse_locations` (auto-referenciada)                              | Existe, **código real desde v0.6.0**                                            |

## 3. Ubicaciones — jerarquía pedida vs. jerarquía real

Pedido: Centro → Sucursal → Almacén → Zona → Pasillo → Estantería → Nivel →
Posición → Ubicación Física (9 niveles conceptuales).

Real: `core.companies` (Centro) → `core.branches` (Sucursal) →
`inventory.warehouses` (Almacén) → `inventory.warehouse_zones` (Zona) →
`inventory.warehouse_locations` (auto-referenciada vía `parent_location_id`,
**profundidad arbitraria, sin columna de "tipo de nivel"**).

Los primeros 4 niveles ya tienen tabla propia y código real (Almacenes,
`v0.6.0`). Los últimos 5 (Pasillo/Estantería/Nivel/Posición/Ubicación
Física) **no son tablas separadas** — son la misma tabla
`warehouse_locations` encadenada N veces vía `parent_location_id`. El
schema soporta la profundidad, pero no distingue semánticamente "esto es
un pasillo" de "esto es un estante".

**Decisión de diseño para Parte 02+ (sin migración)**: usar
`warehouse_locations.metadata.locationType` (columna `metadata JSONB` ya
existe en el patrón universal de toda tabla) con un enum de aplicación
(`'aisle' | 'shelf' | 'level' | 'position'`, no reforzado por `CHECK` de
base de datos, validado en la entidad de dominio — mismo patrón que ya se
usó para el invariante `service→sin serie/lote` en `Producto`). Es
reversible y no compromete el schema si más adelante se decide promoverlo
a columna real.

## 4. Control de producto — qué existe, qué no

| Campo pedido                   | Dónde vive hoy                                                                             | Estado                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------- |
| Series (declaración/instancia) | `products.products.tracks_serial` / `inventory.inventory_serials`                          | Existe                                        |
| Lotes (declaración/instancia)  | `products.products.tracks_lot` / `inventory.inventory_lots`                                | Existe                                        |
| Fecha de vencimiento           | `inventory.inventory_lots.expiry_date`                                                     | Existe                                        |
| Fecha de fabricación           | —                                                                                          | **Gap real**                                  |
| Garantías                      | — (consumidores futuros: `sales.warranties`/`services.service_orders`, ninguno construido) | **Gap real, fuera de `inventory`/`products`** |
| Peso/Volumen/Dimensiones       | —                                                                                          | **Gap real**                                  |
| Código de Barras               | `products.product_barcodes` (`barcode`, `barcode_type`)                                    | Existe                                        |
| Código QR                      | — (`barcode_type` CHECK solo admite `gtin`\|`internal`\|`supplier`)                        | **Gap real** (ver §5.2)                       |
| RFID (preparado)               | —                                                                                          | **Gap real**                                  |

## 5. Gaps reales — qué hacer con cada uno

### 5.1 Resolubles sin migración (workaround de aplicación, dentro de `metadata`/estados existentes)

- **En tránsito**: se resuelve con el `status` del documento
  (`stock_transfers.status IN ('draft','in_transit','received','cancelled')`),
  no como un estado de `stock`. El flujo ya está documentado en
  `19-modulo-inventory.md`: una transferencia genera **2** movimientos
  (`transfer_out` al origen cuando pasa a `in_transit`, `transfer_in` al
  destino cuando pasa a `received`) — el stock del origen ya baja al salir,
  el "tránsito" es la ventana entre esos dos movimientos, visible
  consultando transferencias con `status='in_transit'`, no una tabla nueva.
- **Consignación**: no hay un tercer valor de `warehouse_type` (solo
  `'physical'`/`'virtual'`). Workaround: modelar cada tercero en
  consignación como un almacén `warehouse_type='virtual'` con
  `metadata.consignmentOwnerId` — reutiliza la columna ya reservada para
  este tipo de caso sin tocar el `CHECK`. No es tan expresivo como una
  columna dedicada, pero no requiere decisión de migración.
- **Dañado**: ya existe como _evento_ (una salida con
  `goods_issue_reasons` apuntando a "daño", o `inventory_serials.status=
'scrapped'` para seriales) — no como estado persistente de `stock`. Es
  intencional: el stock dañado sale de existencias (se registra el
  movimiento y desaparece de `quantity_on_hand`), no queda "flotando" en
  un estado dañado indefinido. Si el negocio necesita ver _cuánto_ se dio
  de baja por daño en un período, es una consulta sobre `stock_movements`
  filtrando por el `movement_type` de salida por daño, no una tabla nueva.
- **Trazabilidad — IP/Equipo**: ninguna tabla de `inventory` tiene columnas
  `ip_address`/`device` (a diferencia de `core.sessions`, que sí las tiene
  desde Auth Enterprise). Workaround: `metadata.ip`/`metadata.device` en
  cada movimiento, poblados por la capa de aplicación (mismo mecanismo que
  ya captura IP/UA en `auth` — reutilizar ese helper, no reinventar uno
  nuevo).

### 5.2 No resolubles sin una decisión explícita de migración (no se construyen en Parte 01 ni silenciosamente en partes futuras)

- **QR / RFID**: requeriría ampliar el `CHECK` de
  `product_barcodes.barcode_type` (agregar `'qr'`/`'rfid'`) — es una
  migración de una sola línea, de bajo riesgo, pero **es** una migración
  estructural sobre una tabla ya congelada. Queda propuesta, no aplicada.
- **Fecha de fabricación, Peso/Volumen/Dimensiones**: no hay columna ni en
  `products.products` ni en ninguna tabla relacionada de los 35 revisados.
  Candidatas naturales si se aprueba una migración: agregar
  `manufacture_date_required BOOLEAN`/columnas de dimensiones a
  `products.products`, o una tabla `products.product_physical_attributes`
  1:1 aparte (más limpio, no ensancha la tabla principal). Se deja como
  recomendación en `INVENTORY_NEXT_PHASE.md`, no se decide acá.
- **Obsoleto**: no hay ningún campo de "estado de ciclo de vida" ni en
  `products.products` ni en `inventory.stock`. Requeriría decisión de
  producto: ¿es un atributo del producto (`products.products.
lifecycle_status`) o del stock físico en un almacén puntual
  (`inventory.stock`)? No se asume la respuesta.
- **Garantías**: no es responsabilidad de `inventory` ni `products` — los
  consumidores naturales (`sales.warranties`, `services.service_orders`)
  todavía no existen como módulos de código. Fuera de alcance de esta fase
  por diseño, no por omisión.
- **Caja** (columna de trazabilidad pedida): no existe ningún schema `pos`/
  `caja` con código ni tabla de referencia hoy. Se resolvería vía
  `source_module='pos'`/`source_entity_id` (el mecanismo polimórfico que
  ya usan `stock_movements`/`goods_receipts`/`goods_issues`) el día que
  exista ese módulo — no requiere cambio de `inventory` cuando llegue.

## 6. Movimientos — catálogo real, no un enum embebido

`inventory.stock_movement_types` es un catálogo (`code`, `direction IN
('in','out')`), no un `CHECK` fijo — agregar un tipo de movimiento nuevo
(ej. "donación") es un `INSERT`, no una migración. `stock_movements` es la
**única fuente de verdad** del kardex, particionada mensualmente,
poblada siempre indirectamente por las tablas documentales (nunca se
inserta un movimiento "suelto" sin un documento de origen):

| Movimiento pedido        | Tabla documental que lo origina                                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entradas                 | `inventory.goods_receipts` + `goods_receipt_lines`                                                                                                                                                |
| Salidas                  | `inventory.goods_issues` + `goods_issue_lines` + `goods_issue_reasons`                                                                                                                            |
| Transferencias           | `inventory.stock_transfers` + `stock_transfer_lines` (2 movimientos)                                                                                                                              |
| Conteos                  | `inventory.physical_counts` + `physical_count_lines` (nunca tocan `stock` directo, ver §7)                                                                                                        |
| Ajustes                  | `inventory.stock_adjustments` + `stock_adjustment_lines` + `_reasons`                                                                                                                             |
| Devoluciones             | `goods_receipts` (devolución de cliente) o `goods_issues` (devolución a proveedor) — mismo mecanismo, `source_module` distingue el caso                                                           |
| Compras                  | `goods_receipts` con `source_module='compras'` (módulo futuro)                                                                                                                                    |
| Ventas                   | `goods_issues` con `source_module='ventas'` (módulo futuro)                                                                                                                                       |
| Producción               | `inventory.production_order_outputs` (entrada de producto terminado)                                                                                                                              |
| Consumo interno          | `inventory.production_order_components`/`production_consumptions` (BOM) o `goods_issues` con motivo "uso interno"                                                                                 |
| Merma / Pérdida / Rotura | `goods_issues` + `goods_issue_reasons` (motivos ya existentes cubren daño/muestra/uso interno/donación — "merma"/"pérdida"/"rotura" son valores nuevos de fila en ese catálogo, no tablas nuevas) |
| Donación                 | `goods_issue_reasons` (ya listado como motivo existente)                                                                                                                                          |

## 7. Trazabilidad — qué cubre el patrón universal, qué no

El patrón universal de 18 columnas (todas las tablas de `inventory`/
`products`) ya cubre: `tenant_id`/`company_id`/`branch_id` (Empresa/
Sucursal, vía `warehouse_id` cuando la tabla no los tiene directo),
`created_by`/`updated_by`/`deleted_by` (Usuario), `created_at` (Fecha +
Hora, `TIMESTAMPTZ`), `observations` (Observaciones), `metadata JSONB`
(extensible sin migración). Lo que el pedido original lista y **no** está
en el patrón universal: **Caja** (§5.2, gap fuera de alcance), **IP** y
**Equipo** (§5.1, resuelto vía `metadata`, no columna dedicada).
"Documento origen/destino" está cubierto por el par polimórfico
`source_module`/`source_entity_id` presente en `stock_movements`,
`goods_receipts`, `goods_issues`, `stock_reservations` — "destino" solo
existe como concepto explícito en `stock_transfers`
(`destination_warehouse_id`), no hay un segundo par polimórfico genérico
de "destino" en el resto de tablas (no hace falta: una entrada no tiene
"documento destino" distinto de sí misma).

## 8. Auditoría — ya automática, sin trabajo pendiente

`docs/database/sql/26_triggers.sql` aplica `trg_set_audit_fields` +
`trg_audit_log` a **todas** las tablas de los 22 schemas de negocio
(incluye `inventory` y `products`) de forma programática — no hace falta
registrar nada tabla por tabla al construir código de aplicación nuevo.
**Única excepción intencional dentro de `inventory`**:
`inventory.stock_movements` no tiene los triggers genéricos, porque la
tabla _es_ en sí misma el registro de su propia ejecución (append-only,
particionada) — auditarla con el mecanismo genérico sería redundante.
Nunca se elimina historial: ni `stock_movements` (append-only) ni
`core.audit_logs` (poblada por el trigger, nunca por la aplicación)
exponen una operación de borrado a la capa de aplicación.

## 9. Arquitectura de código — reusar `InventarioModule`, no crear uno nuevo

Consistente con lo ya señalado en `NEXT_STEPS.md` antes de esta fase: todo
el trabajo de Parte 02 en adelante se agrega a `modules/inventario/backend`
(mismo proyecto Nx, mismo `InventarioModule`), no un paquete nuevo — es la
misma regla de `@nx/enforce-module-boundaries` que ya obligó a construir
`EmpresaSucursalLookupRepository` (Almacenes) y `EmpresaLookupRepository`
(Productos): un módulo de negocio no importa el repositorio de otro, arma
el suyo propio sobre las tablas compartidas que necesita.

**Patrón por submódulo** (idéntico al ya usado en Almacenes/Productos —
entidad con invariantes + spec → repositorio puerto/adaptador Prisma →
servicio con excepciones de dominio propias → controller con Zod + Swagger
→ e2e):

- Necesita su propio lookup repository sobre `products.products` (para
  validar `product_id` real) — mismo rol que
  `EmpresaSucursalLookupRepository`, nunca importar
  `modules/productos/backend` directo.
- El costeo (FIFO/LIFO/promedio) se activa según
  `products.products.costing_method` — necesita leer ese campo vía el
  lookup repository de productos, no duplicarlo.
- Producción consume `products.bill_of_materials`/`bom_components` — mismo
  criterio, lookup repository, no import cruzado.

Ver `INVENTORY_NEXT_PHASE.md` para la secuencia recomendada de partes de
implementación (Parte 02, 03, ...) y qué tablas cubre cada una.
