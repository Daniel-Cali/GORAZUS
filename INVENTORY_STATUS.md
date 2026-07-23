# Estado del Módulo de Inventario — tras Fase 05, Parte 01 (Diseño)

## 1. En una frase

El módulo `inventory` tiene 34 tablas certificadas en el modelo de datos,
de las cuales **3 tienen código real** (Almacén→Zona→Ubicación, `v0.6.0`);
esta parte no agregó código, agregó la **arquitectura completa y
verificada** para construir las 31 restantes sin sorpresas estructurales
— ver `INVENTORY_ARCHITECTURE.md`.

## 2. Cobertura de código — antes y después de esta parte

|                                                           | Antes (v0.7.0)                   | Después de Parte 01                                                                                                                 |
| --------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Tablas de `inventory` con código real                     | 3 / 34 (9%)                      | 3 / 34 (9%) — sin cambio, fase de diseño                                                                                            |
| Tablas de `inventory` con arquitectura de diseño definida | 3 / 34 (solo las ya construidas) | **34 / 34 (100%)** — ver `INVENTORY_ARCHITECTURE.md §2, §6`                                                                         |
| Gaps de schema identificados y documentados               | 0 (no auditado formalmente)      | **6** (QR/RFID, fecha fabricación, peso/volumen/dimensiones, obsolescencia, garantías, caja — ver `INVENTORY_ARCHITECTURE.md §5.2`) |

## 3. Qué existe hoy en código (sin cambios esta parte)

- `AlmacenesController`/`AlmacenesService`/`AlmacenRepository` —
  `inventory.warehouses`.
- `ZonasAlmacenController`/`ZonasAlmacenService`/`ZonaAlmacenRepository` —
  `inventory.warehouse_zones`.
- `UbicacionesAlmacenController`/`UbicacionesAlmacenService`/
  `UbicacionAlmacenRepository` — `inventory.warehouse_locations`.

## 4. Qué queda diseñado pero sin construir (31 tablas)

Agrupadas por la secuencia de implementación recomendada en
`INVENTORY_NEXT_PHASE.md`:

- **Motor de stock y movimientos** (núcleo, del que depende todo lo demás):
  `stock`, `stock_movement_types`, `stock_movements`, vistas
  `v_available_stock`/`v_kardex`.
- **Reservas y transferencias**: `stock_reservations`, `stock_transfers`,
  `stock_transfer_lines`.
- **Ajustes y conteos físicos**: `stock_adjustments`,
  `stock_adjustment_lines`, `stock_adjustment_reasons`,
  `physical_counts`, `physical_count_lines`, `cycle_count_schedules`.
- **Recepciones, salidas y reglas de almacén**: `goods_receipts`,
  `goods_receipt_lines`, `goods_issues`, `goods_issue_lines`,
  `goods_issue_reasons`, `putaway_rules`, `picking_rules`,
  `replenishment_rules`.
- **Costeo**: `fifo_cost_layers`, `lifo_cost_layers`,
  `average_cost_history`.
- **Series y lotes**: `inventory_serials`, `inventory_lots`.
- **Producción**: `production_order_status`, `production_orders`,
  `production_order_status_history`, `production_order_components`,
  `production_order_outputs`, `production_consumptions`.

## 5. Módulo `productos` — sin cambios esta parte

Sigue en 5/35 tablas (`v0.7.0`) — esta fase no tocó `products`, solo lo
auditó como dependencia de `inventory` (costeo lee `costing_method`,
producción lee `bill_of_materials`). Las 30 tablas restantes de
`products` (variantes, atributos, kits/combos/BOM/recetas, imágenes,
proveedores, código de barras, precios, reseñas) siguen fuera de alcance
de la Fase 05 — son del dominio de Productos, no de Inventario.

## 6. Versión

Sin cambio — esta parte es diseño puro, no funcionalidad nueva, mismo
criterio que FASE 03 Parte 01 (auditoría, `v0.3.1` sin bump). Sigue en
**`0.7.0`** hasta que Parte 02 entregue código real. Ver `VERSION.md`.

## 7. Rama de trabajo

`feature/inventory-core` (creada esta parte desde `gorazus2`) — se seguirá
usando para toda la Fase 05, con commits pequeños y frecuentes por parte,
hasta que el módulo esté completo y se decida el merge a `gorazus2`.
