# Almacenes API — referencia legible

> Entregable de esta parte (Almacenes — primer código real de
> `modules/inventario/backend`). Basada en el código real (controllers/
> servicios/validators). **No reemplaza** a `docs/api/openapi.json` — ese
> spec requiere un boot real de `apps/api` (Postgres) para regenerarse,
> no disponible al escribir este documento (Docker caído, ver
> `ALMACENES_TEST_REPORT.md §3`). Todos los endpoints ya tienen los
> decoradores `@nestjs/swagger` en el código.

Base: `/api/v1/inventario`. Envelope `{ data: ... }` / `{ error: {
code, message, details } }`. Todos requieren `Authorization: Bearer
<accessToken>` + permiso `inventario.gestionar_almacenes`.

## Almacenes (`/inventario/almacenes`)

| Método y ruta | Descripción                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------- |
| `GET /`       | Listar (paginado, filtrable por `branchId`)                                                  |
| `GET /:id`    | Obtener por id                                                                               |
| `POST /`      | `{ companyId, branchId, name, code, warehouseType? }` — `warehouseType` default `'physical'` |
| `PATCH /:id`  | `{ name?, code?, warehouseType? }` — nunca reasigna empresa/sucursal                         |

## Zonas (`/inventario/zonas`)

| Método y ruta | Descripción                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| `GET /`       | Listar (paginado, filtrable por `warehouseId`)                                                        |
| `GET /:id`    | Obtener por id                                                                                        |
| `POST /`      | `{ warehouseId, name, zoneFunction }` — `zoneFunction`: `receiving`\|`storage`\|`picking`\|`shipping` |
| `PATCH /:id`  | `{ name?, zoneFunction? }` — nunca reasigna el almacén                                                |

## Ubicaciones (`/inventario/ubicaciones`)

| Método y ruta | Descripción                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| `GET /`       | Listar (paginado, filtrable por `zoneId`)                                                            |
| `GET /:id`    | Obtener por id                                                                                       |
| `POST /`      | `{ zoneId, code, parentLocationId? }` — si viene, `parentLocationId` debe pertenecer a la misma zona |
| `PATCH /:id`  | `{ code? }` — nunca reasigna zona ni padre                                                           |

## Errores específicos de este módulo

| Código                            | HTTP | Cuándo                                                |
| --------------------------------- | ---- | ----------------------------------------------------- |
| `EMPRESA_INVALIDA`                | 400  | `companyId` no existe (crear almacén)                 |
| `SUCURSAL_INVALIDA`               | 400  | `branchId` no existe, o no pertenece a `companyId`    |
| `ALMACEN_NO_ENCONTRADO`           | 404  | `:id` de almacén inexistente                          |
| `ALMACEN_INVALIDO`                | 400  | `warehouseId` no existe (crear zona)                  |
| `ZONA_ALMACEN_NO_ENCONTRADA`      | 404  | `:id` de zona inexistente                             |
| `ZONA_INVALIDA`                   | 400  | `zoneId` no existe (crear ubicación)                  |
| `UBICACION_PADRE_INVALIDA`        | 400  | `parentLocationId` no existe, o pertenece a otra zona |
| `UBICACION_ALMACEN_NO_ENCONTRADA` | 404  | `:id` de ubicación inexistente                        |

## Ejemplo — flujo completo

```
POST /inventario/almacenes
  { companyId, branchId, name: "Almacén Central", code: "ALM-01" }
  → 201 { data: { id: "wh-1", warehouse_type: "physical", ... } }

POST /inventario/zonas
  { warehouseId: "wh-1", name: "Recepción", zoneFunction: "receiving" }
  → 201 { data: { id: "zone-1", ... } }

POST /inventario/ubicaciones
  { zoneId: "zone-1", code: "PASILLO-A" }
  → 201 { data: { id: "loc-1", parent_location_id: null, ... } }

POST /inventario/ubicaciones
  { zoneId: "zone-1", code: "ESTANTE-A1", parentLocationId: "loc-1" }
  → 201 { data: { id: "loc-2", parent_location_id: "loc-1", ... } }
```
