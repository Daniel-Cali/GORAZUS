# Modelo Lógico — Purchases (`purchases`)

Espejo de `sales` del lado de abastecimiento. Nota de relación con
`inventory`: `goods_receipt_notes` es el documento de **compras** (qué
se recibió contra qué Orden de Compra, para el 3-way match); dispara un
evento que `inventory.goods_receipts` consume para mover stock — no es
la misma tabla, son dos vistas del mismo hecho desde dos módulos dueños
distintos (documento de compra vs. movimiento físico).

## Requerimiento y cotización

| Tabla                                 | Propósito                                       | FKs no-universales                                                                  |
| ------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `purchase_requisitions`               | Solicitud interna de compra sujeta a aprobación | `requested_by_user_id → core.users`                                                 |
| `purchase_requisition_lines`          | Línea solicitada                                | `requisition_id → purchase_requisitions`, `product_id → products.products`          |
| `purchase_requisition_status`         | Catálogo de estados                             | `company_id`                                                                        |
| `purchase_requisition_status_history` | Historial de transición                         | `requisition_id → purchase_requisitions`, `status_id → purchase_requisition_status` |
| `purchase_quotes`                     | Cotización recibida de un proveedor (RFQ)       | `supplier_id → suppliers.suppliers`, `requisition_id → purchase_requisitions`       |
| `purchase_quote_lines`                | Línea cotizada                                  | `quote_id → purchase_quotes`, `product_id → products.products`                      |

## Orden de compra y recepción

| Tabla                           | Propósito                                               | FKs no-universales                                                            |
| ------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `purchase_orders`               | Orden de compra confirmada                              | `supplier_id → suppliers.suppliers`, `requisition_id → purchase_requisitions` |
| `purchase_order_lines`          | Línea de OC                                             | `purchase_order_id → purchase_orders`, `product_id → products.products`       |
| `purchase_order_status`         | Catálogo de estados                                     | `company_id`                                                                  |
| `purchase_order_status_history` | Historial de transición                                 | `purchase_order_id → purchase_orders`, `status_id → purchase_order_status`    |
| `goods_receipt_notes`           | Documento de recepción contra una OC (para 3-way match) | `purchase_order_id → purchase_orders`                                         |
| `goods_receipt_note_lines`      | Línea recibida                                          | `receipt_note_id → goods_receipt_notes`, `product_id → products.products`     |

## Factura de compra

| Tabla                             | Propósito                                                                  | FKs no-universales                                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `purchase_invoices`               | Factura del proveedor registrada (ingresa como CxP)                        | `supplier_id → suppliers.suppliers`, `purchase_order_id → purchase_orders`                                                |
| `purchase_invoice_lines`          | Línea de factura de compra                                                 | `purchase_invoice_id → purchase_invoices`, `product_id → products.products`, `tax_id → taxes.taxes`                       |
| `purchase_invoice_status`         | Catálogo de estados                                                        | `company_id`                                                                                                              |
| `purchase_invoice_status_history` | Historial de transición                                                    | `purchase_invoice_id → purchase_invoices`, `status_id → purchase_invoice_status`                                          |
| `purchase_invoice_matching`       | Resultado del cotejo OC↔Recepción↔Factura (3-way match), con discrepancias | `purchase_order_id → purchase_orders`, `receipt_note_id → goods_receipt_notes`, `purchase_invoice_id → purchase_invoices` |
| `purchase_withholdings`           | Retención aplicada a la factura de compra                                  | `purchase_invoice_id → purchase_invoices`, `withholding_rule_id → taxes.withholding_rules`                                |

## Ajustes y devoluciones

| Tabla                        | Propósito                     | FKs no-universales                                                         |
| ---------------------------- | ----------------------------- | -------------------------------------------------------------------------- |
| `purchase_credit_notes`      | Nota de crédito del proveedor | `purchase_invoice_id → purchase_invoices`                                  |
| `purchase_credit_note_lines` | Línea de NC de proveedor      | `credit_note_id → purchase_credit_notes`, `product_id → products.products` |
| `purchase_returns`           | Devolución a proveedor        | `purchase_invoice_id → purchase_invoices`                                  |
| `purchase_return_lines`      | Línea devuelta                | `return_id → purchase_returns`, `product_id → products.products`           |

## Importaciones y gastos

| Tabla                   | Propósito                                                                      | FKs no-universales                                 |
| ----------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| `imports`               | Expediente de importación (agrupa OC al exterior + gastos)                     | `purchase_order_id → purchase_orders`              |
| `import_status`         | Catálogo de estados (en tránsito, en aduana, nacionalizado)                    | `company_id`                                       |
| `import_status_history` | Historial de transición                                                        | `import_id → imports`, `status_id → import_status` |
| `import_expenses`       | Gasto asociado a la importación (flete, seguro, aduana), prorrateable al costo | `import_id → imports`                              |
| `purchase_expenses`     | Gasto asociado a una compra no ligada a importación                            | `purchase_order_id → purchase_orders`              |

**Total: 27 tablas.**
