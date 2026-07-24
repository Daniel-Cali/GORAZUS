# Reporte — Fase 05, Inventario Enterprise, Parte 03: Reservas y Transferencias

## 1. Punto de partida

Con el motor de stock y movimientos completo (`v0.8.0`), esta parte construyó las 3 tablas
siguientes según `INVENTORY_NEXT_PHASE.md`: `stock_reservations`, `stock_transfers`,
`stock_transfer_lines` — ambas orquestando el motor ya construido, ninguna toca `inventory.stock`
por su cuenta.

## 2. Qué se construyó

- **Reservas** (`ReservasController`/`ReservasService`/`ReservaStockRepository`): `POST
/inventario/reservas` incrementa `stock.quantity_reserved` de forma atómica (misma transacción
  que la fila de `stock_reservations`), validando que la reserva no exceda lo disponible
  (`quantity_on_hand - quantity_reserved`). `POST /inventario/reservas/:id/liberar` decrementa
  `quantity_reserved` y marca `released_at` — rechaza liberar una reserva ya liberada (409,
  idempotencia real, no silenciosa). **Alcance deliberado**: opera solo sobre el registro de stock
  sin ubicación asignada (`location_id IS NULL`) — el schema de `stock_reservations` no tiene
  columna `location_id`, así que no había forma correcta de repartir una reserva entre varias
  ubicaciones sin inventar una regla no pedida.
- **Transferencias** (`TransferenciasController`/`TransferenciasService`/`TransferenciaRepository`):
  `POST /inventario/transferencias` crea encabezado + líneas juntos (`status: 'draft'`, sin generar
  movimientos todavía). `POST /:id/iniciar` (`draft → in_transit`) genera un movimiento
  `transfer_out` **por línea, atómico** en el almacén origen. `POST /:id/recibir` (`in_transit →
received`) genera `transfer_in` por línea en el destino. `POST /:id/cancelar` solo permitido desde
  `draft` — cancelar una transferencia ya `in_transit` requeriría un movimiento de reversión que el
  pedido original no especificó, queda fuera de alcance (ver §4).
- **`MovimientoStockRepository.registrarLote`** (nuevo, extiende el motor de Parte 02): aplica N
  movimientos dentro de la MISMA transacción de base de datos — necesario porque una transferencia
  de varias líneas tiene que aplicarse completa o nada. Se logró factorizando el cuerpo real de
  `registrar` en un método privado (`aplicarMovimiento`) que tanto `registrar` (una operación, su
  propia transacción) como `registrarLote` (N operaciones, una transacción compartida) reusan — cero
  lógica duplicada entre los dos caminos.
- **`MovimientosService.registrarLote`**: valida cada línea (producto/almacén/ubicación/tipo de
  movimiento) igual que `registrar`, después delega el lote completo al repositorio.

## 3. Corrección del TODO dejado en Parte 02

`INVENTORY_STOCK_REPORT.md §4` dejó explícito un `TODO`: el chequeo de "stock suficiente" comparaba
contra `quantity_on_hand` a secas, no contra `quantity_available` (`on_hand - reserved`), porque
`quantity_reserved` siempre era `0` hasta esta parte. **Corregido acá**: una salida ahora se rechaza
si dejaría `quantity_on_hand` por debajo de `quantity_reserved` — una reserva activa ya protege
físicamente esa cantidad frente a cualquier otra salida, sea manual o de transferencia. Verificado
en el e2e: reservar 30 de 50 disponibles, después intentar una salida de 40 (que dejaría `on_hand`
en 10, por debajo de los 30 reservados) → `409 STOCK_INSUFICIENTE`.

## 4. Decisiones de alcance — consistentes con lo ya construido

- **Cancelar solo desde `draft`**: no existe en `stock_movement_types` ningún tipo de "reversión de
  transferencia", y crear uno no fue pedido — inventar la lógica de reversión sin ese tipo de
  movimiento habría sido construir algo no especificado. Queda como gap documentado, no como bug.
- **`registrarLote` no usa locking explícito** — mismo riesgo de concurrencia ya aceptado en Parte
  02 (`INVENTORY_STOCK_REPORT.md §5`), ahora también aplica a transferencias multi-línea: dos
  transferencias concurrentes sobre el mismo producto podrían, en el peor caso, competir por el
  mismo saldo antes de que cualquiera confirme. No es peor que antes, tampoco mejor — se documenta
  la extensión del riesgo, no se oculta.
- **`TransferenciasService.iniciar/recibir` no son atómicos junto con `actualizarEstado`** — el lote
  de movimientos se aplica en una transacción, el cambio de `status` es una operación aparte
  inmediatamente después. Si el cambio de estado fallara justo después de que los movimientos ya se
  aplicaron (escenario improbable — una actualización de una sola fila), quedaría una transferencia
  con movimientos ya generados pero todavía en `draft`/`in_transit`. Riesgo bajo, no resuelto con
  ingeniería adicional en esta parte — desproporcionado para la probabilidad real.

## 5. Seed y permisos

Sin cambios de permisos — Reservas y Transferencias usan el mismo `inventario.gestionar_stock` ya
sembrado en Parte 02 (misma área funcional: gestión de stock). El seed de tipos de movimiento
(`seed-stock-movement-types.ts`, Parte 02) ya incluía `transfer_out`/`transfer_in` — no hizo falta
agregar nada al script.

## 6. Versión

`0.8.0` → `0.9.0` (`MINOR`). Ver `VERSION.md`.
