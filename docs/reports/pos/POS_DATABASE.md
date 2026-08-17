# Base de Datos — Punto de Venta (POS)

Ver `POS_ARCHITECTURE.md §3` para la decisión de alcance completa. Este documento detalla las 15
tablas reales usadas por el checkout de POS (de las 111 diseñadas entre `customers`/`sales`/`cash`,
ver `docs/database/sql/03_customers.sql`, `07_sales.sql`, `09_cash.sql`).

## 1. `customers` — 1 de 17 tablas

| Tabla                 | Uso                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `customers.customers` | Cliente real o sentinela "Consumidor Final" (`tax_id = 'CF'`, único por `(company_id, tax_id)` vía `uq_customers_customers_taxid`). |

## 2. `sales` — 5 de 55 tablas

| Tabla                       | Uso                                                                                                                                                                                                                                                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sales.invoice_status`      | Catálogo mínimo (`draft`/`issued`), sembrado en caliente (get-or-create) por `VentasService.resolverEstadoPorCodigo`, no con un script aparte.                                                                                                                                                                                                |
| `sales.invoices`            | La venta POS **es** una factura (`sales_channel='pos'`). **Particionada por `issued_at`** (anual) — `invoice_lines` no tiene FK real hacia acá (Postgres no permite FK simple contra una tabla particionada), por eso `FacturaRepository` hace dos escrituras (header, después líneas) en la misma transacción en vez de un `create` anidado. |
| `sales.invoice_lines`       | Una fila por producto vendido — `discount_percentage`/`tax_id`/`line_total` ya en el schema original, reutilizados tal cual.                                                                                                                                                                                                                  |
| `sales.receipts`            | Un recibo por línea de pago — el pago "mixto" del POS es N recibos, no N allocations en un mismo recibo (`payment_method_id` referencia `configuration.payment_forms`, ya sembrado).                                                                                                                                                          |
| `sales.receipt_allocations` | 1:1 con el recibo que lo generó (`invoice_id`, `amount_applied`) — Parte 01 no soporta un recibo aplicado a varias facturas.                                                                                                                                                                                                                  |

## 3. `cash` — 5 de 11 tablas

| Tabla                         | Uso                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cash.cash_registers`         | Caja física/lógica (`register_type='pos'`).                                                                                                                  |
| `cash.cash_register_openings` | Apertura de turno — `uq_cash_openings_one_active` (índice único parcial) garantiza una sola apertura activa por caja a nivel de base, no solo de aplicación. |
| `cash.cash_register_closings` | Cierre — `expected_amount` calculado como apertura + suma de movimientos, `counted_amount` lo ingresa el cajero.                                             |
| `cash.cash_movement_types`    | Catálogo get-or-create (`CajaService.resolverTipoPorCodigo`) — `cobro_venta_pos` (`in`) es el único código que usa el checkout.                              |
| `cash.cash_movements`         | Particionada mensualmente por `created_at`. Un movimiento por recibo (`source_module='pos'`, `source_entity_id=receipt.id`).                                 |

## 4. Reutilizado sin cambios (Fase 04/05)

`products.products` (búsqueda por SKU vía `idx_products_products_name_trgm`, `list_price`),
`inventory.stock`/`stock_movements`/`stock_movement_types` (descuento real, `MovimientosService.registrarLote`),
`taxes.tax_rates` (tasa vigente por `tax_id`), `configuration.payment_forms` (catálogo ya sembrado).

## 5. Bug real encontrado y corregido en esta fase

`inventory.fn_apply_stock_movement` (`docs/database/sql/26_triggers.sql`, `AFTER INSERT ON
stock_movements`) ya aplica el delta a `inventory.stock` como upsert real. El código de aplicación
de Fase 05 Parte 02 (`MovimientoStockRepositoryPrisma.aplicarMovimiento`) **también** escribía
`stock.quantity_on_hand` a mano — cada movimiento se aplicaba dos veces. Nunca se había detectado
porque Docker llevaba caído desde antes de esa fase; el checkout de POS fue el primer código que
ejercitó este camino contra Postgres real con el trigger activo. Corregido: la aplicación ya no
escribe `inventory.stock`, solo bloquea la fila (`SELECT ... FOR UPDATE`) para validar y relee el
resultado del trigger. Ver el commit `fix(inventario): eliminar doble aplicacion de movimientos de
stock` para el detalle completo y la verificación numérica.

## 6. Fuera de alcance (diseñado, sin código)

`customers.customer_credit_profiles`/`customer_classifications`/`customer_loyalty_accounts`/etc.
(16 tablas), `sales.quotes`/`sales_orders`/`sales_returns`/`promotions`/`gift_cards`/etc. (50
tablas), `cash.cash_counts`/`cash_count_lines`/`cash_transfers`/`petty_cash_funds`/etc. (6 tablas).
Ver `POS_ARCHITECTURE.md §3` para el detalle completo de qué se difiere y por qué.
