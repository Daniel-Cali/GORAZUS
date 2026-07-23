# Productos API — referencia legible

> Entregable de esta parte (Fase 04 — Productos). Basada en el código
> real (controllers/servicios/validators). **No reemplaza** a
> `docs/api/openapi.json` — ese spec requiere un boot real de `apps/api`
> (Postgres) para regenerarse, no disponible al escribir este documento
> (Docker caído, ver `PRODUCTOS_TEST_REPORT.md §3`). Todos los endpoints
> ya tienen los decoradores `@nestjs/swagger` en el código.

Base: `/api/v1/productos`. Envelope `{ data: ... }` / `{ error: {
code, message, details } }`. Todos requieren `Authorization: Bearer
<accessToken>` + permiso `productos.gestionar_productos`.

## Unidades de medida (`/productos/unidades-medida`)

| Método y ruta | Descripción           |
| ------------- | --------------------- |
| `GET /`       | Listar (paginado)     |
| `GET /:id`    | Obtener por id        |
| `POST /`      | `{ companyId, code }` |
| `PATCH /:id`  | `{ code? }`           |

## Categorías (`/productos/categorias`)

| Método y ruta | Descripción                                         |
| ------------- | --------------------------------------------------- |
| `GET /`       | Listar (paginado, filtrable por `parentCategoryId`) |
| `GET /:id`    | Obtener por id                                      |
| `POST /`      | `{ companyId, code, parentCategoryId? }`            |
| `PATCH /:id`  | `{ code? }`                                         |

## Marcas (`/productos/marcas`)

| Método y ruta | Descripción           |
| ------------- | --------------------- |
| `GET /`       | Listar (paginado)     |
| `GET /:id`    | Obtener por id        |
| `POST /`      | `{ companyId, name }` |
| `PATCH /:id`  | `{ name? }`           |

## Modelos (`/productos/modelos`)

| Método y ruta | Descripción                                |
| ------------- | ------------------------------------------ |
| `GET /`       | Listar (paginado, filtrable por `brandId`) |
| `GET /:id`    | Obtener por id                             |
| `POST /`      | `{ companyId, brandId, name }`             |
| `PATCH /:id`  | `{ name? }` — nunca reasigna la marca      |

## Productos (`/productos`)

| Método y ruta | Descripción                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /`       | Listar (paginado, filtrable por `categoryId`)                                                                                                        |
| `GET /:id`    | Obtener por id                                                                                                                                       |
| `POST /`      | `{ companyId, sku, productType, baseUnitId, categoryId?, brandId?, modelId?, costingMethod?, tracksSerial?, tracksLot?, standardCost?, listPrice? }` |
| `PATCH /:id`  | Igual que crear, sin `sku`/`baseUnitId` — nunca los reasigna                                                                                         |

`productType`: `good` \| `service` \| `kit` \| `combo` \| `composite`.
`costingMethod` (default `average`): `fifo` \| `lifo` \| `average` \|
`standard`.

## Errores específicos de este módulo

| Código                             | HTTP | Cuándo                                                |
| ---------------------------------- | ---- | ----------------------------------------------------- |
| `EMPRESA_INVALIDA`                 | 400  | `companyId` no existe (cualquiera de las 5 entidades) |
| `UNIDAD_MEDIDA_NO_ENCONTRADA`      | 404  | `:id` de unidad inexistente                           |
| `CATEGORIA_PRODUCTO_NO_ENCONTRADA` | 404  | `:id` de categoría inexistente                        |
| `CATEGORIA_PADRE_INVALIDA`         | 400  | `parentCategoryId` no existe (crear categoría)        |
| `MARCA_NO_ENCONTRADA`              | 404  | `:id` de marca inexistente                            |
| `MODELO_PRODUCTO_NO_ENCONTRADO`    | 404  | `:id` de modelo inexistente                           |
| `MARCA_INVALIDA`                   | 400  | `brandId` no existe (crear modelo o producto)         |
| `PRODUCTO_NO_ENCONTRADO`           | 404  | `:id` de producto inexistente                         |
| `UNIDAD_MEDIDA_INVALIDA`           | 400  | `baseUnitId` no existe (crear producto)               |
| `CATEGORIA_INVALIDA`               | 400  | `categoryId` no existe (crear/editar producto)        |
| `MODELO_INVALIDO`                  | 400  | `modelId` no existe (crear/editar producto)           |
| `MODELO_NO_PERTENECE_A_MARCA`      | 400  | El modelo indicado es de otra marca, no de `brandId`  |

## Ejemplo — flujo completo

```
POST /productos/unidades-medida  { companyId, code: "UND" }
  → 201 { data: { id: "u-1", ... } }

POST /productos/categorias  { companyId, code: "HERR" }
  → 201 { data: { id: "cat-1", ... } }

POST /productos/marcas  { companyId, name: "Stanley" }
  → 201 { data: { id: "ma-1", ... } }

POST /productos/modelos  { companyId, brandId: "ma-1", name: "FatMax" }
  → 201 { data: { id: "mo-1", ... } }

POST /productos
  { companyId, sku: "MART-001", productType: "good", baseUnitId: "u-1",
    categoryId: "cat-1", brandId: "ma-1", modelId: "mo-1", listPrice: 25.5 }
  → 201 { data: { id: "p-1", sku: "MART-001", ... } }
```
