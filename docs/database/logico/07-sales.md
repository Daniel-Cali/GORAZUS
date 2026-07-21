# Modelo Lógico — Sales (`sales`)

Decisión de consolidación clave: **no existe tabla `pos_invoices`
separada de `invoices`**. Una venta de mostrador es una `Invoice` con
`sales_channel = 'pos'` — mismo criterio ya fijado en
[docs/architecture](../../architecture/04-catalogo-modulos-negocio.md#pos-no-tiene-entidades-propias):
el POS es un canal, no un dominio de datos distinto. Igual criterio para
`sales_reservations`: una reserva es un `SalesOrder` en estado
`reserved`, no una tabla aparte. `salespeople` vive acá (no en
`customers`) porque comisión/cuota son datos de negocio de ventas.

## Fuerza de ventas

| Tabla                | Propósito                                                                          | FKs no-universales                                               |
| -------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `salespeople`        | Vendedor, vinculado a un usuario del sistema y opcionalmente a un empleado de RRHH | `user_id → core.users`, `employee_id → hr.employees` (ID suelto) |
| `sales_territories`  | Zona/territorio de venta                                                           | `company_id`                                                     |
| `sales_teams`        | Equipo de ventas                                                                   | `company_id`                                                     |
| `sales_team_members` | Miembros de un equipo (N:M)                                                        | `team_id → sales_teams`, `salesperson_id → salespeople`          |
| `commission_rules`   | Regla de comisión por vendedor/línea/categoría                                     | `salesperson_id → salespeople`                                   |
| `commission_entries` | Comisión devengada calculada por documento de venta                                | `commission_rule_id → commission_rules`, `invoice_id → invoices` |
| `sales_targets`      | Meta de venta por vendedor/equipo/período                                          | `salesperson_id → salespeople`, `team_id → sales_teams`          |

## Cadena documental: cotización → pedido → remito → factura

| Tabla                        | Propósito                                                                            | FKs no-universales                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `quotes`                     | Cotización/presupuesto                                                               | `customer_id → customers.customers`, `salesperson_id → salespeople`                    |
| `quote_lines`                | Línea de cotización                                                                  | `quote_id → quotes`, `product_id → products.products`                                  |
| `quote_status`               | Catálogo de estados                                                                  | `company_id`                                                                           |
| `quote_status_history`       | Historial de transición                                                              | `quote_id → quotes`, `status_id → quote_status`                                        |
| `sales_orders`               | Pedido de venta (reserva stock)                                                      | `customer_id → customers.customers`, `quote_id → quotes` (origen opcional)             |
| `sales_order_lines`          | Línea de pedido                                                                      | `sales_order_id → sales_orders`, `product_id → products.products`                      |
| `sales_order_status`         | Catálogo de estados                                                                  | `company_id`                                                                           |
| `sales_order_status_history` | Historial de transición                                                              | `sales_order_id → sales_orders`, `status_id → sales_order_status`                      |
| `delivery_notes`             | Remito/nota de entrega                                                               | `sales_order_id → sales_orders`                                                        |
| `delivery_note_lines`        | Línea de remito                                                                      | `delivery_note_id → delivery_notes`, `product_id → products.products`                  |
| `invoices`                   | Factura de venta (`sales_channel`: web, pos, mobile, phone)                          | `customer_id → customers.customers`, `sales_order_id → sales_orders` (origen opcional) |
| `invoice_lines`              | Línea de factura                                                                     | `invoice_id → invoices`, `product_id → products.products`, `tax_id → taxes.taxes`      |
| `invoice_status`             | Catálogo de estados                                                                  | `company_id`                                                                           |
| `invoice_status_history`     | Historial de transición                                                              | `invoice_id → invoices`, `status_id → invoice_status`                                  |
| `electronic_invoice_logs`    | Cada intento de timbrado/envío fiscal de una factura (éxito/rechazo, folio recibido) | `invoice_id → invoices`                                                                |

## Ajustes a factura y cobranza

| Tabla                 | Propósito                                                                    | FKs no-universales                                                  |
| --------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `credit_notes`        | Nota de crédito                                                              | `invoice_id → invoices`                                             |
| `credit_note_lines`   | Línea de NC                                                                  | `credit_note_id → credit_notes`, `product_id → products.products`   |
| `debit_notes`         | Nota de débito                                                               | `invoice_id → invoices`                                             |
| `debit_note_lines`    | Línea de ND                                                                  | `debit_note_id → debit_notes`, `product_id → products.products`     |
| `receipts`            | Recibo de cobro (asignación a una o más facturas)                            | `customer_id → customers.customers`                                 |
| `receipt_allocations` | Monto del recibo aplicado a cada factura (soporta pagos parciales/múltiples) | `receipt_id → receipts`, `invoice_id → invoices`                    |
| `sales_returns`       | Devolución de venta                                                          | `invoice_id → invoices`                                             |
| `sales_return_lines`  | Línea de devolución                                                          | `sales_return_id → sales_returns`, `product_id → products.products` |

## Garantías

| Tabla             | Propósito                                                | FKs no-universales                                                  |
| ----------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| `warranties`      | Garantía emitida sobre una línea de factura              | `invoice_line_id → invoice_lines`, `product_id → products.products` |
| `warranty_claims` | Reclamo de garantía (deriva a `services.service_orders`) | `warranty_id → warranties`                                          |

## Promociones y precios especiales

| Tabla                | Propósito                                                                                                                 | FKs no-universales                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `promotions`         | Promoción/oferta con vigencia                                                                                             | `company_id`                                   |
| `promotion_rules`    | Regla de aplicación de la promoción (combo, volumen)                                                                      | `promotion_id → promotions`                    |
| `discounts`          | Descuento general por producto/categoría (distinto del descuento negociado por cliente en `customers.customer_discounts`) | `company_id`                                   |
| `coupons`            | Cupón de descuento con código único                                                                                       | `company_id`                                   |
| `coupon_redemptions` | Uso de un cupón en una factura                                                                                            | `coupon_id → coupons`, `invoice_id → invoices` |

## Apartados

| Tabla              | Propósito                                               | FKs no-universales                                        |
| ------------------ | ------------------------------------------------------- | --------------------------------------------------------- |
| `layaways`         | Apartado: reserva de producto con pago diferido/parcial | `customer_id → customers.customers`                       |
| `layaway_lines`    | Línea de producto apartado                              | `layaway_id → layaways`, `product_id → products.products` |
| `layaway_payments` | Pago parcial aplicado a un apartado                     | `layaway_id → layaways`                                   |

## Contratos, suscripciones y ventas recurrentes

| Tabla                         | Propósito                                                            | FKs no-universales                                                  |
| ----------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `sales_contracts`             | Contrato comercial de largo plazo                                    | `customer_id → customers.customers`                                 |
| `sales_contract_lines`        | Condiciones del contrato (producto/servicio, precio acordado)        | `contract_id → sales_contracts`, `product_id → products.products`   |
| `subscriptions`               | Suscripción recurrente                                               | `customer_id → customers.customers`                                 |
| `subscription_lines`          | Producto/servicio incluido en la suscripción                         | `subscription_id → subscriptions`, `product_id → products.products` |
| `subscription_billing_cycles` | Ciclo de facturación de una suscripción (generado/pendiente)         | `subscription_id → subscriptions`                                   |
| `recurring_sale_templates`    | Plantilla de facturación recurrente (no ligada a suscripción formal) | `customer_id → customers.customers`                                 |
| `recurring_sale_generations`  | Registro de cada factura auto-generada desde una plantilla           | `template_id → recurring_sale_templates`, `invoice_id → invoices`   |

## Fidelización, tarjetas de regalo y canal e-commerce

| Tabla                         | Propósito                                                                 | FKs no-universales                                                                              |
| ----------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `loyalty_programs`            | Programa de fidelización (regla de acumulación/canje)                     | `company_id`                                                                                    |
| `loyalty_program_tiers`       | Nivel dentro de un programa (bronce/plata/oro) con beneficios             | `program_id → loyalty_programs`                                                                 |
| `loyalty_points_transactions` | Acumulación/canje de puntos de un cliente                                 | `loyalty_account_id → customers.customer_loyalty_accounts` (ID suelto), `invoice_id → invoices` |
| `gift_cards`                  | Tarjeta de regalo emitida, con saldo                                      | `company_id`                                                                                    |
| `gift_card_transactions`      | Carga/consumo de una tarjeta de regalo                                    | `gift_card_id → gift_cards`, `invoice_id → invoices`                                            |
| `online_store_configs`        | Configuración de un canal de venta e-commerce (dominio, pasarela de pago) | `company_id`                                                                                    |
| `shopping_carts`              | Carrito de compra activo/abandonado (canal e-commerce)                    | `customer_id → customers.customers`                                                             |
| `shopping_cart_items`         | Línea de producto dentro de un carrito                                    | `cart_id → shopping_carts`, `product_id → products.products`                                    |

**Total: 54 tablas.**
