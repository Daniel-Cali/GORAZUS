# Estado del Módulo de Inventario — tras Fase 05, Parte 04 (Ajustes y Conteos Físicos)

## 1. En una frase

El módulo `inventory` tiene 34 tablas certificadas en el modelo de datos, de las cuales **15 tienen
código real** (Almacén→Zona→Ubicación desde `v0.6.0`, Stock/Tipos de movimiento/Movimientos desde
`v0.8.0`, Reservas/Transferencias desde `v0.9.0`, Ajustes/Conteos/Programación cíclica desde
`v0.10.0`) — el motor de stock ya soporta el ciclo completo real: entra, se reserva, se transfiere,
se ajusta a un valor conocido, se cuenta físicamente. Las 19 tablas restantes ya tienen su
arquitectura completa diseñada (`INVENTORY_ARCHITECTURE.md`), listas para las 4 partes que siguen
(`INVENTORY_NEXT_PHASE.md`).

## 2. Cobertura de código — progreso por parte

|                                                           | Tras Parte 03 (`v0.9.0`) | Tras Parte 04 (`v0.10.0`)                                                                                                                                           |
| --------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tablas de `inventory` con código real                     | 9 / 34 (26%)             | **15 / 34 (44%)**                                                                                                                                                   |
| Tablas de `inventory` con arquitectura de diseño definida | 34 / 34 (100%)           | 34 / 34 (100%) — sin cambio                                                                                                                                         |
| Endpoints reales del módulo `inventario`                  | 32                       | **47** (+ CRUD de motivos, crear/obtener/listar/confirmar ajustes, crear/obtener/listar/iniciar/capturar/completar conteos, CRUD + generar de programación cíclica) |

## 3. Qué existe hoy en código

- `AlmacenesController`/`AlmacenesService`/`AlmacenRepository` — `inventory.warehouses`.
- `ZonasAlmacenController`/`ZonasAlmacenService`/`ZonaAlmacenRepository` — `inventory.warehouse_zones`.
- `UbicacionesAlmacenController`/`UbicacionesAlmacenService`/`UbicacionAlmacenRepository` —
  `inventory.warehouse_locations`.
- `TiposMovimientoController`/`TiposMovimientoService`/`TipoMovimientoStockRepository` —
  `inventory.stock_movement_types`.
- `MovimientosController`/`MovimientosService`/`MovimientoStockRepository` (`registrar` +
  `registrarLote`, ahora con bloqueo real de filas vía `stock-lock.util.ts`) — motor único.
- `StockController`/`StockService`/`StockRepository` — consultas de solo lectura.
- `KardexController`/`KardexService`/`KardexRepository` — consulta real de `inventory.v_kardex`.
- `ReservasController`/`ReservasService`/`ReservaStockRepository` — `inventory.stock_reservations`.
- `TransferenciasController`/`TransferenciasService`/`TransferenciaRepository` —
  `inventory.stock_transfers`/`stock_transfer_lines`.
- `MotivosAjusteController`/`MotivosAjusteService`/`MotivoAjusteRepository` (nuevo) —
  `inventory.stock_adjustment_reasons`.
- `AjustesController`/`AjustesService`/`AjusteStockRepository` (nuevo) —
  `inventory.stock_adjustments`/`stock_adjustment_lines`.
- `ConteosController`/`ConteosService`/`ConteoFisicoRepository` (nuevo) —
  `inventory.physical_counts`/`physical_count_lines`.
- `ProgramacionConteosController`/`ProgramacionConteosService`/`ProgramaConteoCiclicoRepository`
  (nuevo) — `inventory.cycle_count_schedules`.
- `ProductoLookupRepository` — adapta `products.products` desde `inventario`.

## 4. Qué queda diseñado pero sin construir (19 tablas)

Sin cambios en la lista — ver `INVENTORY_NEXT_PHASE.md` para el detalle agrupado en 4 partes
(05 Recepciones/salidas/reglas de almacén, 06 Costeo, 07 Series/lotes, 08 Producción).

## 5. Módulo `productos` — sin cambios esta parte

Sigue en 5/35 tablas (`v0.7.0`).

## 6. Versión

**0.10.0** (2026-07-24) — primer código real de esta parte. Ver `VERSION.md`.

## 7. Rama de trabajo

`feature/inventory-adjustments` (creada esta parte desde `feature/inventory-core`, siguiendo la
instrucción explícita del prompt maestro) — sigue activa para el resto de la Fase 05, con commits
pequeños y frecuentes por parte, hasta que el módulo esté completo y se decida el merge a
`gorazus2`.
