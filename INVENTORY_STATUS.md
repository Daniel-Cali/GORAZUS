# Estado del Módulo de Inventario — tras Fase 05, Parte 02 (Motor de Stock y Movimientos)

## 1. En una frase

El módulo `inventory` tiene 34 tablas certificadas en el modelo de datos, de las cuales **6 tienen
código real** (Almacén→Zona→Ubicación desde `v0.6.0`, más Stock/Tipos de movimiento/Movimientos
desde `v0.8.0`) — el motor único que actualiza `stock` atómicamente y las 28 tablas restantes ya
tienen su arquitectura completa diseñada (`INVENTORY_ARCHITECTURE.md`), lista para las 6 partes que
siguen (`INVENTORY_NEXT_PHASE.md`).

## 2. Cobertura de código — progreso por parte

|                                                           | Tras Parte 01 (diseño)      | Tras Parte 02 (`v0.8.0`)                                               |
| --------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------- |
| Tablas de `inventory` con código real                     | 3 / 34 (9%)                 | **6 / 34 (18%)**                                                       |
| Tablas de `inventory` con arquitectura de diseño definida | 34 / 34 (100%)              | 34 / 34 (100%) — sin cambio                                            |
| Endpoints reales del módulo `inventario`                  | 12 (Almacén/Zona/Ubicación) | **21** (+ tipos de movimiento, movimientos, stock, disponible, kardex) |

## 3. Qué existe hoy en código

- `AlmacenesController`/`AlmacenesService`/`AlmacenRepository` — `inventory.warehouses`.
- `ZonasAlmacenController`/`ZonasAlmacenService`/`ZonaAlmacenRepository` — `inventory.warehouse_zones`.
- `UbicacionesAlmacenController`/`UbicacionesAlmacenService`/`UbicacionAlmacenRepository` —
  `inventory.warehouse_locations`.
- `TiposMovimientoController`/`TiposMovimientoService`/`TipoMovimientoStockRepository` —
  `inventory.stock_movement_types` (catálogo, `code` único por tenant).
- `MovimientosController`/`MovimientosService`/`MovimientoStockRepository` — motor único que
  escribe en `inventory.stock` e `inventory.stock_movements` atómicamente.
- `StockController`/`StockService`/`StockRepository` — consultas de solo lectura (listado +
  disponible) sobre `inventory.stock`.
- `KardexController`/`KardexService`/`KardexRepository` — consulta real de `inventory.v_kardex`.
- `ProductoLookupRepository` (nuevo) — adapta `products.products` desde `inventario`, mismo patrón
  que `EmpresaSucursalLookupRepository`.

## 4. Qué queda diseñado pero sin construir (28 tablas)

Sin cambios en la lista — ver `INVENTORY_NEXT_PHASE.md` para el detalle agrupado en 6 partes
(03 Reservas/transferencias, 04 Ajustes/conteos, 05 Recepciones/salidas/reglas de almacén,
06 Costeo, 07 Series/lotes, 08 Producción).

## 5. Módulo `productos` — sin cambios esta parte

Sigue en 5/35 tablas (`v0.7.0`). El motor de movimientos de esta parte ya lo consume (vía
`ProductoLookupRepository`) para validar `product_id`, pero no agregó código nuevo a `productos`
mismo.

## 6. Versión

**0.8.0** (2026-07-23) — primer código real de esta parte. Ver `VERSION.md`.

## 7. Rama de trabajo

`feature/inventory-core` — sigue activa para el resto de la Fase 05, con commits pequeños y
frecuentes por parte, hasta que el módulo esté completo y se decida el merge a `gorazus2`.
