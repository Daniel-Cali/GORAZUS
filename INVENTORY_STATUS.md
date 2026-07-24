# Estado del Módulo de Inventario — tras Fase 05, Parte 03 (Reservas y Transferencias)

## 1. En una frase

El módulo `inventory` tiene 34 tablas certificadas en el modelo de datos, de las cuales **9 tienen
código real** (Almacén→Zona→Ubicación desde `v0.6.0`, Stock/Tipos de movimiento/Movimientos desde
`v0.8.0`, Reservas/Transferencias/Líneas de transferencia desde `v0.9.0`) — el motor completo de
stock ya soporta el ciclo real de un producto: entra, se reserva, se transfiere entre almacenes,
sale. Las 25 tablas restantes ya tienen su arquitectura completa diseñada
(`INVENTORY_ARCHITECTURE.md`), listas para las 5 partes que siguen (`INVENTORY_NEXT_PHASE.md`).

## 2. Cobertura de código — progreso por parte

|                                                           | Tras Parte 02 (`v0.8.0`) | Tras Parte 03 (`v0.9.0`)                                                                                               |
| --------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Tablas de `inventory` con código real                     | 6 / 34 (18%)             | **9 / 34 (26%)**                                                                                                       |
| Tablas de `inventory` con arquitectura de diseño definida | 34 / 34 (100%)           | 34 / 34 (100%) — sin cambio                                                                                            |
| Endpoints reales del módulo `inventario`                  | 21                       | **32** (+ reservar, liberar, obtener/listar reservas, crear/obtener/listar transferencias, iniciar, recibir, cancelar) |

## 3. Qué existe hoy en código

- `AlmacenesController`/`AlmacenesService`/`AlmacenRepository` — `inventory.warehouses`.
- `ZonasAlmacenController`/`ZonasAlmacenService`/`ZonaAlmacenRepository` — `inventory.warehouse_zones`.
- `UbicacionesAlmacenController`/`UbicacionesAlmacenService`/`UbicacionAlmacenRepository` —
  `inventory.warehouse_locations`.
- `TiposMovimientoController`/`TiposMovimientoService`/`TipoMovimientoStockRepository` —
  `inventory.stock_movement_types`.
- `MovimientosController`/`MovimientosService`/`MovimientoStockRepository` (con `registrar` y
  `registrarLote`, este último nuevo en Parte 03) — motor único que escribe en `inventory.stock`
  e `inventory.stock_movements` atómicamente, uno o varios movimientos a la vez.
- `StockController`/`StockService`/`StockRepository` — consultas de solo lectura sobre
  `inventory.stock`.
- `KardexController`/`KardexService`/`KardexRepository` — consulta real de `inventory.v_kardex`.
- `ReservasController`/`ReservasService`/`ReservaStockRepository` (nuevo) — `inventory.stock_reservations`.
- `TransferenciasController`/`TransferenciasService`/`TransferenciaRepository` (nuevo) —
  `inventory.stock_transfers`/`stock_transfer_lines`.
- `ProductoLookupRepository` — adapta `products.products` desde `inventario`.

## 4. Qué queda diseñado pero sin construir (25 tablas)

Sin cambios en la lista — ver `INVENTORY_NEXT_PHASE.md` para el detalle agrupado en 5 partes
(04 Ajustes/conteos, 05 Recepciones/salidas/reglas de almacén, 06 Costeo, 07 Series/lotes,
08 Producción).

## 5. Módulo `productos` — sin cambios esta parte

Sigue en 5/35 tablas (`v0.7.0`).

## 6. Versión

**0.9.0** (2026-07-23) — primer código real de esta parte. Ver `VERSION.md`.

## 7. Rama de trabajo

`feature/inventory-core` — sigue activa para el resto de la Fase 05, con commits pequeños y
frecuentes por parte, hasta que el módulo esté completo y se decida el merge a `gorazus2`.
