# Modelo Lógico — Inventory (`inventory`)

Único módulo autorizado a escribir sobre `stock` — cualquier otro
módulo que afecte existencias lo hace publicando un evento que un
handler de este módulo consume (ver
[06-comunicacion-entre-modulos.md](../../architecture/06-comunicacion-entre-modulos.md)).
Decisión de consolidación: **Pasillo/Estante/Ubicación** es una sola
tabla auto-referenciada (`warehouse_locations`), igual criterio que
`product_categories`. **Kardex** no es tabla propia — es una vista
sobre `stock_movements` (ver
[24_views.sql](../sql/24_views.sql)), porque es exactamente la misma
información con otro formato de lectura, no un hecho adicional a
registrar. **Costeo FIFO/LIFO/Promedio** se selecciona por `CHECK` en
`products.costing_method`, no por tabla catálogo.

## Almacenes y ubicaciones

| Tabla                   | Propósito                                                                             | FKs no-universales                                                      |
| ----------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `warehouses`            | Almacén/depósito físico o virtual                                                     | `branch_id` (obligatorio para un almacén — pertenece a una sucursal)    |
| `warehouse_zones`       | Zona funcional del almacén (recepción, almacenamiento, picking, despacho)             | `warehouse_id → warehouses`                                             |
| `warehouse_locations`   | Ubicación jerárquica dentro de una zona (pasillo→estante→bin, auto-referenciada)      | `zone_id → warehouse_zones`, `parent_location_id → warehouse_locations` |
| `putaway_rules`         | Regla de ubicación automática al recibir mercadería (por categoría/rotación)          | `warehouse_id → warehouses`                                             |
| `picking_rules`         | Regla de secuencia de picking (FIFO físico, más cercano, por ruta)                    | `warehouse_id → warehouses`                                             |
| `replenishment_rules`   | Regla de reposición automática entre zona de reserva y zona de picking                | `warehouse_id → warehouses`, `product_id → products.products`           |
| `cycle_count_schedules` | Calendario de conteo cíclico recurrente por zona (distinto de una toma física ad-hoc) | `zone_id → warehouse_zones`                                             |

## Existencias y movimientos

| Tabla                  | Propósito                                                                                                        | FKs no-universales                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `stock`                | Saldo actual por producto + almacén + ubicación (+ lote/serie si aplica)                                         | `product_id → products.products`, `warehouse_id → warehouses`, `location_id → warehouse_locations`       |
| `stock_movements`      | Todo movimiento de inventario (fuente de verdad del kardex)                                                      | `product_id → products.products`, `warehouse_id → warehouses`, `movement_type_id → stock_movement_types` |
| `stock_movement_types` | Catálogo de tipos de movimiento (compra, venta, transferencia, ajuste, consumo de producción...)                 | `company_id`                                                                                             |
| `stock_reservations`   | Cantidad reservada para un pedido de venta/orden de producción (`source_module`, `source_entity_id` polimórfico) | `product_id → products.products`, `warehouse_id → warehouses`                                            |

## Transferencias

| Tabla                  | Propósito                                   | FKs no-universales                                                          |
| ---------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| `stock_transfers`      | Encabezado de transferencia entre almacenes | `source_warehouse_id → warehouses`, `destination_warehouse_id → warehouses` |
| `stock_transfer_lines` | Línea de producto/cantidad transferida      | `transfer_id → stock_transfers`, `product_id → products.products`           |

## Ajustes y conteos físicos

| Tabla                      | Propósito                                             | FKs no-universales                                                      |
| -------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| `stock_adjustments`        | Encabezado de ajuste de inventario                    | `warehouse_id → warehouses`                                             |
| `stock_adjustment_lines`   | Línea de ajuste (cantidad anterior/nueva)             | `adjustment_id → stock_adjustments`, `product_id → products.products`   |
| `stock_adjustment_reasons` | Catálogo de motivos de ajuste                         | `company_id`                                                            |
| `physical_counts`          | Campaña de toma física programada                     | `warehouse_id → warehouses`                                             |
| `physical_count_lines`     | Cantidad contada vs. cantidad en sistema por producto | `physical_count_id → physical_counts`, `product_id → products.products` |

## Entradas y salidas

| Tabla                 | Propósito                                                          | FKs no-universales                                              |
| --------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| `goods_receipts`      | Encabezado de entrada (recepción de compra, devolución de cliente) | `warehouse_id → warehouses`                                     |
| `goods_receipt_lines` | Línea de entrada                                                   | `receipt_id → goods_receipts`, `product_id → products.products` |
| `goods_issues`        | Encabezado de salida (venta, muestra, merma, uso interno)          | `warehouse_id → warehouses`                                     |
| `goods_issue_lines`   | Línea de salida                                                    | `issue_id → goods_issues`, `product_id → products.products`     |
| `goods_issue_reasons` | Catálogo de motivos de salida no comercial                         | `company_id`                                                    |

## Costeo

| Tabla                  | Propósito                                                 | FKs no-universales                                                                                            |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `fifo_cost_layers`     | Capa de costo de entrada pendiente de consumir (PEPS)     | `product_id → products.products`, `warehouse_id → warehouses`, `source_receipt_line_id → goods_receipt_lines` |
| `lifo_cost_layers`     | Capa de costo de entrada pendiente de consumir (UEPS)     | `product_id → products.products`, `warehouse_id → warehouses`                                                 |
| `average_cost_history` | Snapshot de costo promedio ponderado tras cada movimiento | `product_id → products.products`, `warehouse_id → warehouses`                                                 |

## Series y lotes

| Tabla               | Propósito                                                                   | FKs no-universales                                            |
| ------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `inventory_serials` | Instancia de número de serie con su estado (en stock, vendido, en garantía) | `product_id → products.products`, `warehouse_id → warehouses` |
| `inventory_lots`    | Instancia de lote/batch con fecha de vencimiento                            | `product_id → products.products`, `warehouse_id → warehouses` |

## Producción (ejecución — la definición de BOM/receta vive en `products`)

| Tabla                             | Propósito                                                          | FKs no-universales                                                                    |
| --------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `production_orders`               | Orden de fabricación planificada                                   | `bom_id → products.bill_of_materials`, `warehouse_id → warehouses`                    |
| `production_order_status`         | Catálogo de estados (planificada, liberada, en curso, cerrada)     | `company_id`                                                                          |
| `production_order_status_history` | Historial de transición de estado                                  | `production_order_id → production_orders`, `status_id → production_order_status`      |
| `production_order_components`     | Consumo planificado (copiado del BOM al momento de crear la orden) | `production_order_id → production_orders`, `component_product_id → products.products` |
| `production_order_outputs`        | Producto terminado ingresado al cerrar la orden                    | `production_order_id → production_orders`, `product_id → products.products`           |
| `production_consumptions`         | Consumo real registrado (para comparar contra lo planificado)      | `production_order_id → production_orders`, `component_product_id → products.products` |

**Total: 34 tablas.**
