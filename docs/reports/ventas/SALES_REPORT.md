# Sales Report — Módulo de Ventas Enterprise, Parte 1 (Cotización → Pedido → Factura)

> Sesión del 2026-07-27, versión **0.24.0**. Extiende `modules/ventas/backend` (real desde
> `v0.11.0`, ya con motor de facturación completo desde `v0.22.0`) con el extremo que le faltaba al
> pipeline comercial. Ver `SALES_PIPELINE_ARCHITECTURE.md` para el detalle arquitectónico completo,
> `SALES_API_REPORT.md` para endpoints, `SALES_TEST_REPORT.md` para testing,
> `SALES_HEALTH_REPORT.md` para riesgos y deuda técnica, `SALES_ROADMAP.md` para lo que sigue.

## 1. Origen del pedido y alcance acordado

Pedido: "PROMPT MAESTRO — MÓDULO DE VENTAS ENTERPRISE PARA GORAZUS ERP" — 15 secciones
(cotizaciones, pedidos, facturación, comprobantes fiscales, clientes, listas de precio,
descuentos, promociones, métodos de pago, devoluciones, entregas, comisiones, cuentas por cobrar,
integración automática, reportes). Antes de escribir código se confirmó con el usuario
(`AskUserQuestion`) el orden de partes: **Cotización → Pedido → Factura**, la pieza que completa el
extremo inicial del pipeline comercial (hoy Facturación crea la factura directo, sin cotización ni
pedido previos).

## 2. Reality-check

`sales` (schema Prisma) tiene 55 tablas reales certificadas; solo 5 estaban en uso antes de esta
parte. Se construyó código de aplicación sobre 8 tablas más (`quotes`/`quote_lines`/`quote_status`/
`quote_status_history`, `sales_orders`/`sales_order_lines`/`sales_order_status`/
`sales_order_status_history`) — 13 de 55 en total, sin diseñar ninguna tabla nueva.

## 3. Qué se construyó

- **Cotizaciones** (`CotizacionesService`): crear/editar/eliminar (solo en `draft`), aprobar,
  rechazar, duplicar, listar/obtener, vigencia (`valid_until`), historial vía
  `quote_status_history`.
- **Pedidos de venta** (`PedidosVentaService`): crear directo o desde una cotización aprobada y
  vigente, reserva real de inventario (`ReservasService`, recién expuesto desde `InventarioModule`
  — existía pero no era inyectable fuera de su propio módulo), cancelar (libera reservas, solo si
  nada facturado todavía), convertir a factura total o parcialmente.
- **Conversión pedido → factura**: reutiliza `VentasService.crearFactura` (mismo motor que
  Facturación Parte 1 — impuesto real por línea, disparo automático del motor contable al
  confirmarse) con `salesOrderId` fijado (`invoices.sales_order_id`, relación real de Prisma ya
  existente en el schema, sin usar hasta ahora).
- **Migración aditiva** (`41_ventas_pedidos_facturacion_parcial.sql`): `sales_order_lines` gana
  `invoiced_quantity` — permite derivar el estado real "parcial"/"completado" de un pedido, en vez
  de simularlo.
- Permisos `ventas.gestionar_cotizaciones`/`ventas.gestionar_pedidos` sembrados.

## 4. Explícitamente fuera de alcance

Comprobantes fiscales/NCF, listas de precios, descuentos/promociones avanzados, devoluciones
(gap de severidad alta ya documentado antes de esta parte), entregas, comisiones, reportes
exportables — ver el desglose completo de las 15 secciones en `SALES_ROADMAP.md`.

## 5. Cadena de integración verificada de punta a punta

Esta parte cierra una cadena real, no simulada: **Cotización → Pedido → Factura → Asiento
contable**. Verificado manualmente contra Postgres real: crear cotización → aprobar → convertir en
pedido (reserva real confirmada en `inventory.stock_reservations`) → convertir 2 de 4 unidades a
factura (`invoiced_quantity` pasa a 2, pedido queda `partial`, reserva sigue activa) → convertir el
resto (pedido queda `completed`, reserva liberada) — reutilizando exactamente el mismo motor de
Facturación (`v0.22.0`) que a su vez ya dispara Contabilidad (`v0.23.0`) al confirmarse una
factura. Las tres partes construidas en esta sesión (Facturación, Contabilidad, Ventas Pipeline)
quedan conectadas de verdad, no solo documentadas como si lo estuvieran.

## 6. Hallazgo real encontrado y corregido en el camino

Al correr la suite completa con los nuevos e2e, un test **preexistente** de Facturación
(`facturas.controller.e2e-spec.ts`) empezó a fallar de forma intermitente por acumulación de datos
de prueba (38 facturas del mismo cliente de prueba, por encima del tamaño de página por defecto) —
mismo patrón ya documentado en `VERSION.md v0.19.0` (un test de Roles con el mismo síntoma).
Corregido reemplazando la aserción de "aparece en la lista paginada" por una verificación directa
por id. No es una regresión de esta parte — es acumulación de datos de toda la sesión, un patrón ya
conocido de este proyecto.

## 7. Verificación realizada

- Build/lint limpios en `ventas-backend`; sin regresión en `inventario-backend` (build/lint) ni
  `pos-backend` (9/9 tests) — relevante porque `InventarioModule` ahora se importa dos veces en el
  grafo de módulos (`PosModule` y `VentasModule`), confirmado que NestJS no duplica instancias.
- 63/63 tests de `ventas-backend` (30 de Facturación Parte 1 + 33 nuevos).
- Arranque real de la API, 14 rutas nuevas mapeadas (`/ventas/cotizaciones/*`,
  `/ventas/pedidos/*`), OpenAPI regenerado.
- Verificación manual completa de la cadena Cotización→Pedido→Factura→Contabilidad contra Postgres
  real, incluida la reserva de inventario real y su liberación.

## 8. Commits y control de versión

Commits locales pequeños, Conventional Commits — sin push ni cambio de rama, mismo criterio de
esta sesión (archivos de fases anteriores sin commitear, pendientes de confirmación explícita del
usuario). `v0.23.0 → v0.24.0` (`VERSION.md`), `CHANGELOG.md` y `ROADMAP.md` actualizados.

## 9. Próximo paso sugerido

Sujeto a confirmación del usuario: Devoluciones (gap de severidad alta ya documentado antes de esta
parte), Comprobantes Fiscales/NCF, Contabilidad Parte 2, Facturación Parte 2 (PDF), o Roles
Enterprise Subfases 4.2-4.8 (pausadas).
