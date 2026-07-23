# API — Motor de Stock y Movimientos (Fase 05, Parte 02)

Todos los endpoints requieren `Authorization: Bearer <token>` y el permiso `inventario.gestionar_stock`
(distinto de `inventario.gestionar_almacenes`, que sigue cubriendo Almacén/Zona/Ubicación).

## Tipos de movimiento — `/inventario/tipos-movimiento`

| Método | Ruta                               | Descripción                                                                              |
| ------ | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| GET    | `/inventario/tipos-movimiento`     | Listar (paginado `page`/`pageSize`).                                                     |
| GET    | `/inventario/tipos-movimiento/:id` | Obtener por id.                                                                          |
| POST   | `/inventario/tipos-movimiento`     | Crear. Body: `{ code: string, direction: 'in'\|'out' }`.                                 |
| PATCH  | `/inventario/tipos-movimiento/:id` | Actualizar parcial. Rechaza cambiar `direction` si el tipo ya tiene movimientos (`409`). |

## Stock — `/inventario/stock` (solo lectura)

| Método | Ruta                           | Descripción                                                                                                                                                                             |
| ------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/inventario/stock`            | Listar. Filtrable por `productId`/`warehouseId`.                                                                                                                                        |
| GET    | `/inventario/stock/disponible` | Saldo de un producto en un almacén. Query: `productId`, `warehouseId`, `locationId?`. Responde `{ quantityOnHand, quantityReserved, quantityAvailable }` (`0` en todos si no hay fila). |

## Movimientos — `/inventario/movimientos`

| Método | Ruta                      | Descripción                                                               |
| ------ | ------------------------- | ------------------------------------------------------------------------- |
| POST   | `/inventario/movimientos` | Registrar movimiento. Actualiza `stock` atómicamente. Ver body abajo.     |
| GET    | `/inventario/movimientos` | Listar. Filtrable por `productId`/`warehouseId`, orden `created_at desc`. |

**Body de `POST /inventario/movimientos`:**

```json
{
  "productId": "uuid",
  "warehouseId": "uuid",
  "locationId": "uuid (opcional)",
  "movementTypeId": "uuid",
  "quantity": 10.5,
  "unitCost": 5.5,
  "sourceModule": "compras (opcional, junto con sourceEntityId)",
  "sourceEntityId": "uuid (opcional, junto con sourceModule)",
  "observations": "texto libre (opcional)"
}
```

## Kardex — `/inventario/kardex` (solo lectura)

| Método | Ruta                 | Descripción                                                                                                                                                                                 |
| ------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/inventario/kardex` | Query: `productId`, `warehouseId` (obligatorios), `desde?`/`hasta?` (ISO 8601), `page`/`pageSize`. Consulta `inventory.v_kardex` real — saldo corrido incluido por fila (`runningBalance`). |

## Errores de dominio (nuevos esta parte)

| Código                            | HTTP | Cuándo                                                                    |
| --------------------------------- | ---- | ------------------------------------------------------------------------- |
| `TIPO_MOVIMIENTO_NO_ENCONTRADO`   | 404  | `GET`/`PATCH` de un tipo inexistente.                                     |
| `TIPO_MOVIMIENTO_DUPLICADO`       | 409  | `code` ya usado por otro tipo del mismo tenant.                           |
| `TIPO_MOVIMIENTO_CON_MOVIMIENTOS` | 409  | Intento de cambiar `direction` de un tipo con movimientos ya registrados. |
| `PRODUCTO_INVALIDO`               | 400  | `productId` no existe en `products.products`.                             |
| `ALMACEN_INVALIDO`                | 400  | `warehouseId` no existe.                                                  |
| `UBICACION_INVALIDA`              | 400  | `locationId` indicado no existe.                                          |
| `TIPO_MOVIMIENTO_INVALIDO`        | 400  | `movementTypeId` no existe.                                               |
| `STOCK_INSUFICIENTE`              | 409  | Una salida (`direction: 'out'`) dejaría `quantity_on_hand` negativo.      |

## No incluido en esta parte

Reservas, transferencias, ajustes, conteos físicos, recepciones/salidas documentales, reglas de
almacén, costeo, series/lotes, producción — todo sigue en `inventory` sin código, ver
`INVENTORY_NEXT_PHASE.md` (Parte 03 en adelante). Este motor es exactamente lo que esas partes van
a llamar internamente para registrar sus propios movimientos (`sourceModule`/`sourceEntityId`).
