# API — Módulo de Ventas Enterprise, Parte 1 (Cotización → Pedido → Factura)

Todos los endpoints requieren `Authorization: Bearer <token>` y el permiso indicado. Prefijo real:
`/api/v1/...` — se omite acá por brevedad, igual que en `INVOICE_API_REPORT.md`.

## `/ventas/cotizaciones` — `ventas.gestionar_cotizaciones`

| Método | Ruta                                | Descripción                                                           |
| ------ | ----------------------------------- | --------------------------------------------------------------------- |
| GET    | `/ventas/cotizaciones`              | Listar — filtrable por `branchId`/`customerId`/`statusId`, ordenable. |
| GET    | `/ventas/cotizaciones/:id`          | Obtener con líneas.                                                   |
| POST   | `/ventas/cotizaciones`              | Crear (borrador).                                                     |
| PUT    | `/ventas/cotizaciones/:id`          | Editar (solo mientras sigue en borrador).                             |
| DELETE | `/ventas/cotizaciones/:id`          | Eliminar (baja lógica, solo borrador).                                |
| POST   | `/ventas/cotizaciones/:id/aprobar`  | `draft → approved`.                                                   |
| POST   | `/ventas/cotizaciones/:id/rechazar` | `draft → rejected`.                                                   |
| POST   | `/ventas/cotizaciones/:id/duplicar` | Nuevo borrador con las mismas líneas.                                 |

## `/ventas/pedidos` — `ventas.gestionar_pedidos`

| Método | Ruta                                                          | Descripción                                                                                              |
| ------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| GET    | `/ventas/pedidos`                                             | Listar — filtrable por `branchId`/`customerId`/`statusId`, ordenable.                                    |
| GET    | `/ventas/pedidos/:id`                                         | Obtener con líneas (incluye `invoiced_quantity` por línea).                                              |
| POST   | `/ventas/pedidos`                                             | Crear directo — `warehouseId` obligatorio, reserva inventario real.                                      |
| POST   | `/ventas/pedidos/desde-cotizacion/:cotizacionId?warehouseId=` | Convierte una cotización `approved` y vigente en un pedido nuevo.                                        |
| POST   | `/ventas/pedidos/:id/cancelar`                                | Solo si ninguna línea tiene facturación todavía — libera las reservas.                                   |
| POST   | `/ventas/pedidos/:id/convertir-a-factura`                     | Total o parcial (body `{ lines?: [{salesOrderLineId, quantity}] }`) — reutiliza el motor de Facturación. |

**14 rutas en total, 2 controladores.**

## 1. `POST /ventas/pedidos/:id/convertir-a-factura` — request/response real

```json
// Request — parcial (2 de 4 unidades de una línea)
{ "lines": [{ "salesOrderLineId": "uuid", "quantity": 2 }] }

// Request — completo (todo el saldo pendiente de cada línea)
{}
```

Responde `201` con la factura creada (mismo contrato que `POST /ventas/facturas`,
`INVOICE_API_REPORT.md §2`), con `sales_order_id` fijado al pedido de origen. `409` si no queda
saldo pendiente (`PEDIDO_SIN_SALDO_PENDIENTE`) o si se pide más de lo pendiente en una línea
(`LINEA_PEDIDO_INVALIDA`, `400`).

## 2. Errores de dominio nuevos

| Excepción                          | HTTP | Cuándo                                                                     |
| ---------------------------------- | ---- | -------------------------------------------------------------------------- |
| `CotizacionVencidaException`       | 409  | Convertir una cotización cuya `valid_until` ya pasó.                       |
| `CotizacionYaConvertidaException`  | 409  | Convertir una cotización que ya generó un pedido.                          |
| `CotizacionNoEsBorradorException`  | 409  | Editar/eliminar/aprobar/rechazar una cotización que ya no está en `draft`. |
| `PedidoNoCancelableException`      | 409  | Cancelar un pedido con alguna línea ya facturada.                          |
| `PedidoSinSaldoPendienteException` | 409  | Convertir un pedido ya 100% facturado.                                     |
| `LineaPedidoInvalidaException`     | 400  | Pedir facturar más de lo pendiente de una línea.                           |

## 3. Verificación en vivo

Arranque real de la API confirmado, las 14 rutas mapeadas. Flujo completo verificado con `curl`
contra Postgres real: crear cotización → aprobar → convertir en pedido (reserva real confirmada en
`inventory.stock_reservations`) → convertir 2 de 4 unidades a factura (`sales_order_lines.
invoiced_quantity` pasa a 2, estado `partial`, reserva sigue activa) → convertir el resto (estado
`completed`, reserva liberada, confirmado en `released_at IS NOT NULL`). OpenAPI regenerado y
confirmado (`docs/api/openapi.json`, rutas `/api/v1/ventas/cotizaciones*` y `/api/v1/ventas/pedidos*`).
