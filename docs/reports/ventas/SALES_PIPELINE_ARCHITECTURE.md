# Arquitectura — Módulo de Ventas Enterprise, Parte 1 (Cotización → Pedido → Factura)

## 1. Alcance de esta parte

Pedido original: "PROMPT MAESTRO — MÓDULO DE VENTAS ENTERPRISE PARA GORAZUS ERP" — 15 secciones
(cotizaciones, pedidos, facturación, comprobantes fiscales, clientes, listas de precio,
descuentos, promociones, métodos de pago, devoluciones, entregas, comisiones, cuentas por cobrar,
integración automática, reportes). Antes de escribir código se acordó con el usuario el orden de
partes (`AskUserQuestion`): esta Parte 1 completa el extremo que le faltaba al motor de
facturación ya construido (`v0.22.0`) — hoy una factura se crea directo, sin cotización ni pedido
previos. Cubre §1 (Cotizaciones) y §2 (Pedidos de venta) completos, con conversión real
Cotización → Pedido → Factura reutilizando el motor de Facturación ya construido.

## 2. Reality-check

`sales` (schema Prisma) tiene **55 tablas reales certificadas**; hasta esta parte solo 5 estaban en
uso (`invoices`/`invoice_lines`/`invoice_status`/`receipts`/`receipt_allocations`, Facturación
Parte 1). Esta parte suma 8 tablas más — `quotes`/`quote_lines`/`quote_status`/
`quote_status_history` y `sales_orders`/`sales_order_lines`/`sales_order_status`/
`sales_order_status_history` — sin diseñar ninguna tabla nueva, todas ya certificadas.

**Diferencia real vs. `invoices`**: `quotes`/`sales_orders` NO están particionadas y sus líneas
(`quote_lines`/`sales_order_lines`) SÍ tienen relación real de Prisma hacia el encabezado —
aceptan `create`/`update` anidado en una sola escritura, mismo patrón que
`accounting_rules`/`accounting_rule_lines` (Contabilidad Parte 1), más simple que
`FacturaRepository` (que necesita dos escrituras separadas por la partición de `invoices`).

## 3. Migración de base de datos

`docs/database/sql/41_ventas_pedidos_facturacion_parcial.sql` (aditiva): `sales_order_lines` gana
`invoiced_quantity NUMERIC(18,6) DEFAULT 0` + CHECK (`0 <= invoiced_quantity <= quantity`). Sin
esta columna no hay forma de derivar el estado "parcial" de un pedido con datos reales — es un
requisito explícito del pedido ("Pedidos de venta: Pendiente/Parcial/Completado"), no una adición
especulativa.

## 4. Ciclo de vida

```
Cotización:  draft --aprobar--> approved --convertir--> converted
                   \-rechazar-> rejected

Pedido:      pending --convertir a factura (parcial)--> partial --(saldo agotado)--> completed
                     \-cancelar (solo si nada facturado)-> cancelled

Factura:     draft --confirmar--> issued --anular--> cancelled   (motor ya existente, v0.22.0)
```

- **Cotización → Pedido** (`PedidosVentaService.crearDesdeCotizacion`): exige `approved` y vigente
  (`valid_until` no vencida); copia las líneas, marca la cotización `converted`.
- **Pedido → Factura** (`PedidosVentaService.convertirAFactura`): total o parcial por línea
  (`invoiced_quantity` acumulado), reutiliza `VentasService.crearFactura` (mismo motor, mismos
  cálculos de impuesto por línea, mismo disparo del motor contable al confirmarse) con
  `salesOrderId` fijado — `invoices.sales_order_id` ya era una relación real de Prisma desde la
  certificación original, sin usar hasta esta parte.

## 5. Reserva de inventario — alcance real

`ReservasService` (`modules/inventario/backend`, Fase 05 Parte 03) existía pero no estaba
exportado — se agregó a `InventarioModule.exports` y al barrel `modules/inventario/index.ts`,
primer consumidor real fuera de su propio controlador.

Al crear un pedido (directo o desde cotización), se reserva la cantidad completa de cada línea. Si
una reserva falla a mitad de una lista de líneas, las ya creadas se liberan (compensación
best-effort, no atómica — mismo límite ya documentado en `PosCheckoutService`, orquestación
secuencial entre schemas distintos, no una transacción de base de datos única).

**Limitación real, documentada**: `ReservasService` no tiene liberación parcial — solo libera la
reserva completa. Por eso la reserva de un pedido se mantiene activa hasta que el pedido queda
100% facturado (o se cancela); una conversión parcial NO libera una porción proporcional de la
reserva. Tampoco se descuenta stock real (`MovimientosService.registrarLote`) al facturar — ese
paso queda pendiente para cuando exista el proceso de despacho/entrega (§11 del pedido original,
fuera de esta parte), mismo criterio que "no descontar inventario todavía" de Facturación Parte 1.

## 6. Por qué no CQRS / Value Objects / Factories / PSR

Mismo criterio ya confirmado en Roles Enterprise, Facturación Enterprise y Contabilidad Enterprise
Parte 1: Clean Architecture por módulo (entidad + repositorio + servicio + controlador +
validadores Zod), sin CQRS ni Value Objects. "PSR" (estándar de PHP) no aplica — se sigue el
ESLint/Prettier/TypeScript real del monorepo.

## 7. Explícitamente fuera de alcance (Parte 1)

Facturación de contado/crédito/proforma/masiva/rápida/recurrente (ya cubierto por el motor
existente salvo "recurrente"), comprobantes fiscales/NCF, listas de precios
(`customers.customer_price_lists` existe, sin código), descuentos/promociones avanzados
(`discounts`/`promotions`/`coupons` existen, sin código — hoy solo hay descuento por línea y
descuento general de factura), métodos de pago (ya cubierto por `receipts`/`receipt_allocations`),
devoluciones (`sales_returns` existe, gap de severidad alta ya documentado en
`POS_HEALTH_REPORT.md`), entregas (`delivery_notes` existe, sin código), comisiones
(`commission_rules`/`salespeople`/`sales_teams` existen, sin código), cuentas por cobrar avanzadas
(ya parcialmente cubiertas por `clientes`). Ver `SALES_ROADMAP.md` para el detalle completo.
