# Plan de Implementación — Fase 05, Inventario Enterprise, Parte 02 en adelante

Secuencia recomendada, en orden de dependencia real (cada parte depende de
que la anterior ya exista en código, no solo en schema). Cada parte sigue
el mismo patrón ya usado en Almacenes/Productos: entidad con invariantes +
spec → repositorio puerto/adaptador Prisma → servicio con excepciones de
dominio propias → controller Zod + Swagger → e2e, agregado a
`modules/inventario/backend` (mismo `InventarioModule`, ver
`INVENTORY_ARCHITECTURE.md §9`).

## Parte 02 — Motor de stock y movimientos (crítica, bloquea todo lo demás) — ✅ completa (`v0.8.0`)

Ver `INVENTORY_STOCK_REPORT.md` para el detalle real de lo construido — el resumen abajo es el plan
original, dejado tal cual para trazabilidad.

- Tablas: `stock`, `stock_movement_types`, `stock_movements`.
- Vistas de solo lectura: `v_available_stock`, `v_kardex`.
- Por qué primero: todas las partes siguientes (reservas, transferencias,
  ajustes, recepciones, salidas, producción) terminan generando filas en
  `stock_movements` — sin el motor no hay nada que construir encima.
- Cuidado especial: `stock_movements` está particionada mensualmente
  (`(id, created_at)`, no `id` a secas) — el repositorio Prisma tiene que
  tratarla como `core.audit_logs` (FASE 02), no como `BaseRepository`
  genérico.
- Semilla mínima necesaria: catálogo `stock_movement_types` con al menos
  los tipos usados por Parte 03+ (`transfer_out`/`transfer_in`,
  `adjustment_increase`/`adjustment_decrease`, `receipt`, `issue`,
  `production_output`, `production_consumption`) — mismo patrón de script
  idempotente que `seed-rbac.ts`/`seed-tax-jurisdictions.ts`.

## Parte 03 — Reservas y transferencias

- Tablas: `stock_reservations`, `stock_transfers`, `stock_transfer_lines`.
- Depende de Parte 02 (cada reserva/transferencia genera movimientos).
- Punto de diseño ya resuelto en `INVENTORY_ARCHITECTURE.md §5.1`: una
  transferencia genera 2 movimientos (`transfer_out` al pasar a
  `in_transit`, `transfer_in` al pasar a `received`) — implementar
  exactamente ese flujo, no una variación.
- Riesgo ya señalado en `INVENTORY_HEALTH_REPORT.md §3`: sincronización de
  `stock.quantity_reserved` — escribir el test de integración de
  sincronización en esta parte, no después.

## Parte 04 — Ajustes y conteos físicos

- Tablas: `stock_adjustments`, `stock_adjustment_lines`,
  `stock_adjustment_reasons`, `physical_counts`, `physical_count_lines`,
  `cycle_count_schedules`.
- Punto de diseño ya resuelto: un conteo físico **nunca** toca `stock`
  directo — genera una propuesta de ajuste, que sigue el flujo normal de
  `stock_adjustments` (borrador → confirmado → movimiento). No implementar
  un camino directo conteo→stock.

## Parte 05 — Recepciones, salidas y reglas de almacén

- Tablas: `goods_receipts`, `goods_receipt_lines`, `goods_issues`,
  `goods_issue_lines`, `goods_issue_reasons`, `putaway_rules`,
  `picking_rules`, `replenishment_rules`.
- Las reglas (`putaway`/`picking`/`replenishment`) son configuración, no
  transacciones — pueden ir con CRUD simple tipo Almacenes, sin lógica de
  motor todavía (el motor que las _aplique_ automáticamente durante una
  recepción/salida real es una fase posterior, fuera de esta lista, no
  pedida explícitamente por el prompt original).

## Parte 06 — Costeo

- Tablas: `fifo_cost_layers`, `lifo_cost_layers`, `average_cost_history`.
- Depende de Parte 05 (las capas FIFO se crean a partir de
  `goods_receipt_lines.unit_cost`).
- Activación condicional por `products.products.costing_method` — leído
  vía un lookup repository nuevo sobre `products.products` (mismo patrón
  que `EmpresaLookupRepository`, nunca importar `modules/productos/backend`
  directo).

## Parte 07 — Series y lotes

- Tablas: `inventory_serials`, `inventory_lots`.
- Depende de Parte 02 (una serie/lote se crea al recibir stock, se marca
  vendido/consumido vía un movimiento).
- Validación cruzada con `products.products.tracks_serial`/`tracks_lot` —
  mismo lookup repository de Parte 06.

## Parte 08 — Producción

- Tablas: `production_order_status`, `production_orders`,
  `production_order_status_history`, `production_order_components`,
  `production_order_outputs`, `production_consumptions`.
- Depende de Parte 02 (consumo/salida genera movimientos), Parte 06
  (costeo del producto terminado) y de `products.bill_of_materials`/
  `bom_components` (ya existen en schema, sin código — mismo lookup
  repository extendido).
- `production_consumptions` está particionada igual que
  `stock_movements` — mismo cuidado de repositorio que Parte 02.

## No incluido en esta lista, a propósito

- Los 6 gaps reales de `INVENTORY_ARCHITECTURE.md §5.2` (QR/RFID, fecha de
  fabricación, peso/volumen/dimensiones, obsolescencia, garantías, caja) —
  ninguno se puede construir sin una decisión explícita de migración o sin
  que exista un módulo dependiente (POS/Ventas/Servicios) que hoy no
  existe. Se listan acá para que no se pierdan de vista, no para
  bloquear el resto del plan.
- Motor de aplicación automática de `putaway_rules`/`picking_rules`/
  `replenishment_rules` durante una recepción/salida real (asignar
  ubicación automáticamente, generar orden de reposición automática) — el
  CRUD de las reglas sí está en Parte 05, pero el _motor_ que las ejecute
  no fue pedido explícitamente en el prompt original de esta fase.
- Cualquier endpoint de reporting/BI agregado (curva ABC, rotación,
  valorización total) — consume las tablas de arriba pero es Fase 20
  (Business Intelligence) según el orden de desarrollo ya establecido
  (`ROADMAP.md`), no esta fase.

## Documentación a regenerar cuando arranque cada parte

Mismo patrón que Almacenes/Productos: `INVENTORY_REPORT.md` (o el nombre
que corresponda a esa parte específica, ej. `INVENTORY_STOCK_REPORT.md`
para Parte 02), `*_API.md`, `*_TEST_REPORT.md`, más el refresco habitual
de `CHANGELOG.md`/`ROADMAP.md`/`VERSION.md`/`PROJECT_STATUS.md`/
`TECHNICAL_DEBT.md`/`NEXT_STEPS.md` y el bump de versión (`0.7.0` →
`0.8.0` en la primera parte que entregue código real, según
`VERSION.md §Próxima versión prevista`, ya anotado desde el cierre de
Productos).
