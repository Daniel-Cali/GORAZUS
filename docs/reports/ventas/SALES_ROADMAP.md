# Roadmap — Módulo de Ventas Enterprise

Índice de las 15 secciones pedidas en el "PROMPT MAESTRO — MÓDULO DE VENTAS ENTERPRISE", qué cubre
la Parte 1 y qué queda para partes siguientes.

## Parte 1 — Cotización → Pedido → Factura (`v0.24.0`, completa)

| #   | Sección del pedido     | Estado                                                                                                                                                                                                       |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Cotizaciones           | ✅ `CotizacionesService` (crear/editar/aprobar/rechazar/duplicar/convertir/vigencia/historial vía `quote_status_history`)                                                                                    |
| 2   | Pedidos de venta       | ✅ `PedidosVentaService` (pendiente/parcial/completado/cancelado, reserva real de inventario, entrega parcial/total vía `invoiced_quantity`)                                                                 |
| 3   | Facturación            | ✅ ya cubierto por Facturación Parte 1 (`v0.22.0`) — esta parte solo agrega la conexión `sales_order_id`. Recurrente sin código todavía.                                                                     |
| 9   | Cuentas por cobrar     | 🟡 parcialmente cubierta por `clientes` (`v_accounts_receivable_aging`) desde antes de esta parte.                                                                                                           |
| 14  | Integración automática | ✅ Pedido→Factura→Asiento contable verificado de punta a punta (reutiliza el motor de Contabilidad, `v0.23.0`). Inventario/Kardex/Caja/Bancos/CRM/Dashboard siguen sin conexión automática desde este flujo. |

## Partes siguientes (sin código todavía)

| #   | Sección                       | Nota                                                                                                                                                                                                                      |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4   | Comprobantes fiscales / NCF   | `credit_notes`/`debit_notes`/`electronic_invoice_logs` existen en el schema, sin código — Facturación Electrónica ya excluida explícitamente desde Facturación Parte 1.                                                   |
| 5   | Clientes                      | Ya cubierto por `clientes`/CRM (fases anteriores) — crédito/límite/clasificación/segmentación con backend real; balance/estado de cuenta parcial.                                                                         |
| 6   | Lista de precios              | `customers.customer_price_lists` existe, sin código de aplicación.                                                                                                                                                        |
| 7   | Descuentos (avanzados)        | `discounts` existe — hoy solo hay descuento por línea y descuento general de factura (Facturación Parte 1), no por cliente/categoría/promoción.                                                                           |
| 8   | Promociones                   | `promotions`/`promotion_rules`/`coupons`/`coupon_redemptions` existen, sin código.                                                                                                                                        |
| 9   | Cuentas por cobrar (avanzado) | Abonos/intereses/historial completo — parcialmente cubierto, sin motor de intereses ni recordatorios.                                                                                                                     |
| 10  | Devoluciones                  | `sales_returns`/`sales_return_lines` existen — gap de severidad **alta**, ya documentado en `POS_HEALTH_REPORT.md` antes de esta parte.                                                                                   |
| 11  | Entregas                      | `delivery_notes`/`delivery_note_lines` existen, sin código — bloquea el descuento de inventario real al facturar un pedido (ver `SALES_HEALTH_REPORT.md §3`).                                                             |
| 12  | Comisiones                    | `commission_rules`/`commission_entries`/`salespeople`/`sales_teams`/`sales_territories`/`sales_targets` existen, sin código — `salespersonId` ya se acepta en cotizaciones/pedidos pero sin validar ni calcular comisión. |
| 15  | Reportes                      | Sin reportes exportables (PDF/Excel/CSV) — mismo criterio que Facturación Parte 2.                                                                                                                                        |

## Otras tablas de `sales` sin código, no pedidas explícitamente en las 15 secciones

`layaways`/`layaway_lines`/`layaway_payments` (apartados), `warranties`/`warranty_claims`
(garantías), `subscriptions`/`subscription_lines`/`subscription_billing_cycles` (suscripciones —
mencionadas como "facturación recurrente" en §3), `loyalty_programs`/`loyalty_program_tiers`/
`loyalty_points_transactions` (lealtad), `gift_cards`/`gift_card_transactions`, `shopping_carts`/
`shopping_cart_items`/`online_store_configs` (venta online), `sales_contracts`/
`sales_contract_lines`, `recurring_sale_templates`/`recurring_sale_generations`.

## Gaps reales del schema — ver `SALES_HEALTH_REPORT.md §3`

- `ReservasService` sin liberación parcial — la reserva de un pedido con conversión parcial
  frecuente se mantiene íntegra hasta completarse.
- `sales_orders` sin columna de almacén — no queda registrado cuál almacén surtirá el pedido
  después de creado.
- Sin validación de `salespersonId` contra `salespeople` (fuera de alcance, sección Comisiones).
