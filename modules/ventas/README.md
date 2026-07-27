# Módulo Ventas

> Parte 01 (`v0.11.0`, POS Parte 01: la venta de mostrador es una factura
> directa) + Motor de Facturación Enterprise (`v0.22.0`, ciclo de vida
> completo de la factura) + Módulo de Ventas Enterprise Parte 1
> (`v0.24.0`, Cotización → Pedido → Factura). Diseño completo en
> `docs/reports/ventas/INVOICE_ARCHITECTURE.md` (Facturación) y
> `docs/reports/ventas/SALES_PIPELINE_ARCHITECTURE.md` (Cotización/Pedido).

## Responsabilidad

Motor de facturación completo (crear/editar/eliminar borrador,
confirmar, anular, duplicar, recibos de cobro, impuesto real por línea

- descuento general) más el extremo inicial del pipeline comercial:
  cotizaciones (con aprobación/rechazo/vigencia) y pedidos de venta (con
  reserva real de inventario y conversión total/parcial a factura).

## Entidades que este módulo posee

13 de las 55 tablas del schema `sales`:

- `sales.invoices` + `sales.invoice_lines` (vía `FacturaRepository`) —
  `invoices` está particionada por `issued_at`; el repositorio no
  extiende `BaseRepository` porque el cliente Prisma generado solo
  expone la clave compuesta `(id, issued_at)`, nunca `id` suelto (mismo
  motivo que `MovimientoStockRepository` en `inventario`).
- `sales.invoice_status` (vía `EstadoFacturaRepository`, catálogo).
- `sales.receipts` + `sales.receipt_allocations` (recibos de cobro).
- `sales.quotes` + `sales.quote_lines` + `sales.quote_status` (vía
  `CotizacionRepository`) — a diferencia de `invoices`, `quotes` NO
  está particionada y `quote_lines` sí tiene relación real de Prisma
  hacia `quotes` (acepta `create`/`update` anidado).
- `sales.sales_orders` + `sales.sales_order_lines` + `sales.sales_order_status`
  (vía `PedidoRepository`) — mismo criterio que `quotes`, sin
  particionar. `sales_order_lines.invoiced_quantity` (migración 41)
  permite derivar el estado real pendiente/parcial/completado.

## Estados

- **Factura**: `draft → issued` (confirmar) o `draft`/`issued` →
  `cancelled` (anular, estado final).
- **Cotización**: `draft → approved`|`rejected`; `approved → converted`
  (al generar un pedido).
- **Pedido**: `pending → partial|completed` (según cuánto se convirtió
  a factura) o `pending → cancelled` (solo si nada facturado todavía).

## Con qué módulos colabora (síncrono)

- **`pos`** — `PosCheckoutService` invoca `crearFactura`/
  `registrarRecibo`/`confirmarFactura`/`listar`/`obtener`.
- **`inventario`** — `PedidosVentaService` invoca `ReservasService`
  (`crear`/`liberar`/`listar`) al crear y al completar/cancelar un
  pedido — reserva real de stock, sin descontarlo todavía (eso ocurre
  en el proceso de despacho/entrega, fuera de esta parte).
- **`contabilidad`** — vía `VentasService.confirmarFactura()`, no
  bloqueante (ver más abajo).
- **`clientes`**/**`productos`**/**`configuracion`** (impuestos) — vía
  repositorios de lookup, siempre de solo lectura.
- **`crm`** (integración de solo lectura) — `OportunidadesService.ganar()`
  registra la referencia al pedido/factura resultante sin invocar a
  `ventas` directamente (`CRM_ARCHITECTURE.md §7`).

## Permisos

`ventas.ver`, `ventas.gestionar_ventas`, `ventas.gestionar_cotizaciones`,
`ventas.gestionar_pedidos` — sembrados en
`modules/seguridad/backend/scripts/seed-rbac.ts`.

## Eventos de dominio

`FacturaCreadaEvent`/`FacturaConfirmadaEvent`/`FacturaAnuladaEvent`
(`events/`) — "preparados, sin publicar todavía", mismo patrón que
`auth`/`seguridad`. `EventBusService` (`core/messaging`) existe pero
ningún módulo del proyecto publica en él todavía. Cotizaciones/Pedidos
no tienen eventos de dominio propios todavía.

## Integración con Contabilidad

`VentasService.confirmarFactura()` dispara
`MotorContableService.registrarEvento('ventas.factura.confirmada')` —
no bloqueante: sin ninguna regla contable configurada, no pasa nada.
Ver `modules/contabilidad/README.md`.

## Fuera de alcance

Comprobantes fiscales/NCF, listas de precios, descuentos/promociones
avanzados, devoluciones (gap de severidad alta, ver
`docs/reports/pos/POS_HEALTH_REPORT.md`), entregas, comisiones,
reportes exportables, Compras — ver
`docs/reports/ventas/SALES_ROADMAP.md` para el detalle de las 15
secciones pedidas y qué falta. Vista previa/PDF/impresión/envío por
correo de la factura — sin librería de PDF en el proyecto todavía.

## Tests

63 tests (facturas: entidad + servicio + eventos + e2e real;
cotizaciones/pedidos: entidades + servicios + e2e real contra
Postgres/Redis/RabbitMQ con reservas reales de Inventario).
`nx run ventas-backend:test`.
