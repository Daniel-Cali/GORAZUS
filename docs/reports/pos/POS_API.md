# API — Punto de Venta (POS)

Todos los endpoints requieren `Authorization: Bearer <token>` y el permiso indicado. Prefijo real:
`/api/v1/...` (`app.setGlobalPrefix('api')` + versionado URI, `core/kernel/bootstrap.ts`) — se omite
acá por brevedad, igual que en `INVENTORY_API.md`.

## `/clientes` — `clientes.gestionar_clientes`

| Método | Ruta            | Descripción                                   |
| ------ | --------------- | --------------------------------------------- |
| GET    | `/clientes`     | Listar (filtrable por `companyId`, `query`).  |
| GET    | `/clientes/:id` | Obtener por id.                               |
| POST   | `/clientes`     | Crear.                                        |
| PATCH  | `/clientes/:id` | Actualizar (parcial, nunca reasigna `taxId`). |

## `/caja` — `caja.gestionar_caja`

| Método | Ruta                                  | Descripción                                                       |
| ------ | ------------------------------------- | ----------------------------------------------------------------- |
| GET    | `/caja/registros`                     | Listar cajas (filtrable por `branchId`).                          |
| POST   | `/caja/registros`                     | Crear caja.                                                       |
| GET    | `/caja/registros/:id/apertura-activa` | Apertura activa (`data: null` si está cerrada).                   |
| POST   | `/caja/aperturas`                     | Abrir caja — 409 si ya hay una apertura activa.                   |
| POST   | `/caja/cierres`                       | Cerrar caja — `expected_amount` = apertura + suma de movimientos. |

## `/ventas/facturas` — `ventas.gestionar_ventas`

> Motor de Facturación Enterprise Parte 1 (`v0.22.0`) extendió esta tabla — ver
> `docs/reports/ventas/INVOICE_API_REPORT.md` para el detalle completo (filtros/orden de `listar`,
> request/response de cada endpoint).

| Método | Ruta                             | Descripción                                                                           |
| ------ | -------------------------------- | ------------------------------------------------------------------------------------- |
| GET    | `/ventas/facturas`               | Listar — filtrable por `branchId`/`customerId`/`statusId`/rango de fechas, ordenable. |
| GET    | `/ventas/facturas/:id`           | Obtener con líneas.                                                                   |
| POST   | `/ventas/facturas`               | Crear factura borrador — impuestos reales por línea + descuento general.              |
| PUT    | `/ventas/facturas/:id`           | Editar borrador (recalcula totales). `409` si ya no es borrador.                      |
| DELETE | `/ventas/facturas/:id`           | Eliminar borrador (baja lógica). `409` si ya no es borrador.                          |
| POST   | `/ventas/facturas/:id/duplicar`  | Duplicar — nuevo borrador con las mismas líneas.                                      |
| POST   | `/ventas/facturas/:id/recibos`   | Registrar recibo de cobro contra la factura.                                          |
| POST   | `/ventas/facturas/:id/confirmar` | `draft → issued`.                                                                     |
| POST   | `/ventas/facturas/:id/anular`    | `draft`/`issued` → `cancelled` (final). `409` si ya estaba anulada.                   |

## `/pos` — `pos.operar_pos`

| Método | Ruta                      | Descripción                                                                |
| ------ | ------------------------- | -------------------------------------------------------------------------- |
| GET    | `/pos/productos?query=`   | Buscar por SKU (contiene, insensible a mayúsculas) — buscador del carrito. |
| POST   | `/pos/ventas`             | **Checkout completo.** Ver §1.                                             |
| POST   | `/pos/ventas/suspender`   | Guardar el carrito sin cobrar ni descontar stock.                          |
| GET    | `/pos/ventas/suspendidas` | Listar ventas suspendidas de una sucursal (`branchId`).                    |
| GET    | `/pos/ventas/:id`         | Recuperar una venta suspendida por id.                                     |

### 1. `POST /pos/ventas` — request/response real

```json
// Request
{
  "companyId": "uuid",
  "branchId": "uuid",
  "registerId": "uuid",
  "customerId": "uuid opcional — si se omite, resuelve Consumidor Final",
  "currencyCode": "USD",
  "lines": [
    {
      "productId": "uuid",
      "warehouseId": "uuid",
      "quantity": 3,
      "unitPrice": 25,
      "discountPercentage": 0,
      "taxId": "uuid opcional"
    }
  ],
  "payments": [{ "amount": 75, "paymentFormId": "uuid opcional" }]
}
```

```json
// Response 201
{
  "data": {
    "factura": {
      "id": "uuid",
      "document_number": "POS-MRZG7XCD-QNWY",
      "subtotal_amount": "75",
      "tax_amount": "0",
      "total_amount": "75",
      "invoice_lines": [/* ... */]
    },
    "cambio": 0
  }
}
```

Errores de dominio reales (no genéricos): `STOCK_INSUFICIENTE_PARA_VENTA` (409),
`CAJA_NO_ABIERTA` (409), `VENTA_SIN_PAGO_SUFICIENTE` (409), `CLIENTE_INVALIDO`/`PRODUCTO_INVALIDO`
(400), `EMPRESA_INVALIDA`/`SUCURSAL_INVALIDA` (400).

## Verificado end-to-end contra infraestructura real

Toda la tabla de arriba se probó con `curl` real contra Postgres/Redis/RabbitMQ (Docker), no solo
con mocks — ver `POS_TEST_REPORT.md §3` para el detalle de la secuencia completa (crear producto →
stock inicial → abrir caja → buscar → confirmar venta → verificar stock/caja resultantes) y el
bug de doble aplicación de stock que este mismo ejercicio encontró y corrigió.
