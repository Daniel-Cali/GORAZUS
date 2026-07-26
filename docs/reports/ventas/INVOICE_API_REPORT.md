# API — Motor de Facturación (`/ventas/facturas`)

Todos los endpoints requieren `Authorization: Bearer <token>` y el permiso `ventas.gestionar_ventas`.
Prefijo real: `/api/v1/...` (`app.setGlobalPrefix('api')` + versionado URI, `core/kernel/bootstrap.ts`)
— se omite acá por brevedad, igual que en `POS_API.md`/`INVENTORY_API.md`.

| Método | Ruta                             | Descripción                                                                                       |
| ------ | -------------------------------- | ------------------------------------------------------------------------------------------------- |
| GET    | `/ventas/facturas`               | Listar, filtrable y ordenable (§1).                                                               |
| GET    | `/ventas/facturas/:id`           | Obtener con líneas.                                                                               |
| POST   | `/ventas/facturas`               | Crear borrador — calcula impuestos reales por línea + descuento general.                          |
| PUT    | `/ventas/facturas/:id`           | Editar borrador — recalcula impuestos. `409` si ya no es `draft`.                                 |
| DELETE | `/ventas/facturas/:id`           | Eliminar borrador (baja lógica). `409` si ya no es `draft`.                                       |
| POST   | `/ventas/facturas/:id/duplicar`  | Duplicar — nuevo borrador con las mismas líneas, impuestos recalculados a la tasa vigente de hoy. |
| POST   | `/ventas/facturas/:id/recibos`   | Registrar recibo de cobro contra la factura.                                                      |
| POST   | `/ventas/facturas/:id/confirmar` | `draft → issued`.                                                                                 |
| POST   | `/ventas/facturas/:id/anular`    | `draft`/`issued` → `cancelled`. `409` si ya estaba anulada.                                       |

## 1. `GET /ventas/facturas` — filtros y orden

Query params, todos opcionales:

| Param               | Tipo                                               | Descripción                                                                                      |
| ------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `branchId`          | UUID                                               | Sucursal.                                                                                        |
| `customerId`        | UUID                                               | Cliente.                                                                                         |
| `statusId`          | UUID                                               | Estado (id real de `sales.invoice_status`).                                                      |
| `issuedFrom`        | ISO date                                           | Emitidas desde esta fecha (inclusive).                                                           |
| `issuedTo`          | ISO date                                           | Emitidas hasta esta fecha (inclusive).                                                           |
| `sortBy`            | `issued_at` \| `total_amount` \| `document_number` | Campo de orden — cualquier otro valor se ignora silenciosamente (fallback al orden por defecto). |
| `sortDir`           | `asc` \| `desc`                                    | Dirección, default `desc`.                                                                       |
| `page` / `pageSize` | number                                             | Paginación, default `1`/`20`.                                                                    |

## 2. `POST /ventas/facturas` — request/response real

```json
// Request
{
  "companyId": "uuid",
  "branchId": "uuid",
  "customerId": "uuid",
  "salesChannel": "store",
  "currencyCode": "USD",
  "generalDiscountPercentage": 10,
  "lines": [
    {
      "productId": "uuid",
      "taxId": "uuid opcional",
      "quantity": 2,
      "unitPrice": 50,
      "discountPercentage": 0
    }
  ]
}
```

```json
// Response 201
{
  "data": {
    "id": "uuid",
    "document_number": "FAC-...",
    "status_id": "uuid (draft)",
    "subtotal_amount": "90",
    "tax_amount": "...",
    "total_amount": "...",
    "invoice_lines": [/* ... */]
  }
}
```

`generalDiscountPercentage`/`discountPercentage` (por línea) son opcionales — Zod aplica `default(0)`
si se omiten.

## 3. `PUT /ventas/facturas/:id` — editar borrador

Mismo cuerpo que crear, sin `companyId`/`branchId`/`customerId`/`salesChannel`/`currencyCode` —
esos campos nunca se reasignan al editar, solo `lines` y `generalDiscountPercentage`:

```json
{
  "generalDiscountPercentage": 0,
  "lines": [{ "productId": "uuid", "quantity": 3, "unitPrice": 40, "discountPercentage": 0 }]
}
```

Responde `200` con la factura recalculada, o `409` (`FacturaNoEsBorradorException`) si el estado
actual ya no es `draft`.

## 4. `DELETE /ventas/facturas/:id`

`200` con la factura (`deleted_at` poblado) si estaba en `draft`; `409` si no.

## 5. `POST /ventas/facturas/:id/duplicar`

`201` con un borrador nuevo (`id` distinto), mismas líneas y mismo cliente, impuestos recalculados
a la tasa vigente del momento de la duplicación (no copia la tasa histórica de la original).

## 6. `POST /ventas/facturas/:id/anular`

`201` con la factura en `cancelled`. Segunda llamada sobre la misma factura → `409`
(`FacturaYaAnuladaException`).

## 7. Errores de dominio

| Excepción                      | HTTP | Cuándo                                                 |
| ------------------------------ | ---- | ------------------------------------------------------ |
| `EmpresaInvalidaException`     | 400  | `companyId` no existe/no pertenece al tenant.          |
| `SucursalInvalidaException`    | 400  | `branchId` no pertenece a `companyId`.                 |
| `ClienteInvalidoException`     | 400  | `customerId` no existe.                                |
| `ProductoInvalidoException`    | 400  | Algún `productId` de las líneas no existe.             |
| `FacturaNoEsBorradorException` | 409  | Editar/eliminar una factura que ya no está en `draft`. |
| `FacturaYaAnuladaException`    | 409  | Anular una factura que ya está en `cancelled`.         |

## 8. Verificación en vivo

Arranque real de la API confirmado (`Nest application successfully started`), las 9 rutas de
`/ventas/facturas` mapeadas. `401` sin token verificado con `curl` en 7 de las 9 (listar, obtener,
crear, editar, eliminar, duplicar, anular); `confirmar` queda cubierto por el flujo del e2e-spec
(`facturas.controller.e2e-spec.ts`, requiere el mismo `@RequirePermission` que las demás); `recibos`
no tiene verificación `curl`/e2e dedicada en esta parte — mismo guard (`@RequirePermission`) que el
resto del controlador, sin motivo para comportarse distinto, pero no confirmado en vivo. OpenAPI
regenerado y confirmado (`docs/api/openapi.json`, rutas `/api/v1/ventas/facturas*`).
