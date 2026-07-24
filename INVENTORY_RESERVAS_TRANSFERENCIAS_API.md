# API — Reservas y Transferencias (Fase 05, Parte 03)

Todos los endpoints requieren `Authorization: Bearer <token>` y el permiso
`inventario.gestionar_stock` (mismo permiso que el motor de movimientos de Parte 02).

## Reservas — `/inventario/reservas`

| Método | Ruta                               | Descripción                                                    |
| ------ | ---------------------------------- | -------------------------------------------------------------- |
| POST   | `/inventario/reservas`             | Reservar stock. Ver body abajo. `409` si excede lo disponible. |
| POST   | `/inventario/reservas/:id/liberar` | Liberar una reserva. `409` si ya estaba liberada.              |
| GET    | `/inventario/reservas/:id`         | Obtener por id.                                                |
| GET    | `/inventario/reservas`             | Listar. Filtrable por `productId`/`warehouseId`.               |

**Body de `POST /inventario/reservas`:**

```json
{
  "productId": "uuid",
  "warehouseId": "uuid",
  "quantity": 30,
  "sourceModule": "ventas",
  "sourceEntityId": "uuid",
  "observations": "texto libre (opcional)"
}
```

`sourceModule`/`sourceEntityId` son **obligatorios** acá (a diferencia de los movimientos, donde son
opcionales) — una reserva siempre tiene un dueño identificable.

## Transferencias — `/inventario/transferencias`

| Método | Ruta                                      | Descripción                                                                  |
| ------ | ----------------------------------------- | ---------------------------------------------------------------------------- |
| POST   | `/inventario/transferencias`              | Crear (borrador, `status: 'draft'`). Ver body abajo.                         |
| GET    | `/inventario/transferencias/:id`          | Obtener con sus líneas.                                                      |
| GET    | `/inventario/transferencias`              | Listar. Filtrable por `sourceWarehouseId`/`destinationWarehouseId`/`status`. |
| POST   | `/inventario/transferencias/:id/iniciar`  | `draft → in_transit`. Genera `transfer_out` por línea (atómico).             |
| POST   | `/inventario/transferencias/:id/recibir`  | `in_transit → received`. Genera `transfer_in` por línea (atómico).           |
| POST   | `/inventario/transferencias/:id/cancelar` | `draft → cancelled`. Solo permitido desde `draft`.                           |

**Body de `POST /inventario/transferencias`:**

```json
{
  "sourceWarehouseId": "uuid",
  "destinationWarehouseId": "uuid",
  "documentNumber": "TRF-0001",
  "lines": [
    { "productId": "uuid", "quantity": 10 },
    { "productId": "uuid", "quantity": 5 }
  ]
}
```

**Prerrequisito operativo**: `/iniciar` y `/recibir` necesitan que existan tipos de movimiento con
`code = 'transfer_out'`/`'transfer_in'` para el tenant — ya cubiertos por
`scripts/seed-stock-movement-types.ts` (Parte 02). Si no existen, `409
TIPO_MOVIMIENTO_TRANSFERENCIA_NO_CONFIGURADO`.

## Errores de dominio (nuevos esta parte)

| Código                                         | HTTP | Cuándo                                                                         |
| ---------------------------------------------- | ---- | ------------------------------------------------------------------------------ |
| `CAPACIDAD_RESERVA_INSUFICIENTE`               | 409  | La reserva pedida excede `quantity_on_hand - quantity_reserved`.               |
| `RESERVA_NO_ENCONTRADA`                        | 404  | `GET`/`liberar` de una reserva inexistente.                                    |
| `RESERVA_YA_LIBERADA`                          | 409  | `liberar` de una reserva con `released_at` ya seteado.                         |
| `TRANSFERENCIA_NO_ENCONTRADA`                  | 404  | `GET`/transición de una transferencia inexistente.                             |
| `TRANSICION_TRANSFERENCIA_INVALIDA`            | 409  | Transición de estado no permitida (ej. `recibir` sin haber `iniciar`).         |
| `TIPO_MOVIMIENTO_TRANSFERENCIA_NO_CONFIGURADO` | 409  | Falta `transfer_out`/`transfer_in` en el catálogo del tenant.                  |
| `STOCK_INSUFICIENTE`                           | 409  | Ya existía (Parte 02) — ahora también protege lo reservado, no solo lo físico. |

## No incluido en esta parte

Ajustes, conteos físicos, recepciones/salidas documentales, reglas de almacén, costeo, series/lotes,
producción — ver `INVENTORY_NEXT_PHASE.md` (Parte 04 en adelante).
