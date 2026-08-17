# Productos Report — FASE 04

> Sesión del 2026-07-23, versión **0.7.0**. Primer código real de
> `modules/productos/backend` — carpeta inexistente hasta esta sesión.
> Cierra la Fase 04 (Productos) del orden de desarrollo del prompt
> maestro de continuidad. Ver `PRODUCTOS_TEST_REPORT.md` para testing,
> `PRODUCTOS_API.md` para el contrato de cada endpoint.

## 1. Alcance — el producto base, no las 35 tablas del schema

`core/database/prisma/schemas/products/schema.prisma` modela **35
tablas** (producto, categorías, marcas, modelos, líneas/familias/
colecciones, variantes vía auto-referencia, atributos genéricos, combos,
kits, BOM/recetas, imágenes/videos, códigos de barra, historial de
precios, reseñas, proveedores, perfiles fiscales, presentaciones,
conversión de unidades, traducciones). El alcance real de esta parte
—confirmado contra `docs/architecture/18-modulo-products.md`— son las
**5 tablas núcleo**: `units_of_measure`, `product_categories`, `brands`,
`product_models`, `products`. El resto queda documentado como pendiente
(§4) para una parte siguiente — mismo criterio de acotar alcance ya
aplicado en Almacenes (3 de 32 tablas de `inventory`).

## 2. Qué se construyó

Mismo patrón Clean Architecture que `configuracion`/`inventario` —
nuevo proyecto Nx `productos-backend`, sexto cliente Prisma independiente
expuesto (`ProductsPrismaClient`/`PRISMA_PRODUCTS`, ya wireado en
`database.module.ts` desde el bootstrap del monorepo, sin consumidor
hasta esta parte):

- **`UnidadesMedidaController`** (`/productos/unidades-medida`) — CRUD.
  Prerequisito real de `Producto`: `base_unit_id` es `NOT NULL`.
- **`CategoriasProductoController`** (`/productos/categorias`) — CRUD,
  jerárquica auto-referenciada de N niveles (`parentCategoryId`), mismo
  patrón que `UbicacionAlmacen` de `modules/inventario/backend`.
- **`MarcasController`** (`/productos/marcas`) — CRUD, plana sin
  jerarquía.
- **`ModelosProductoController`** (`/productos/modelos`) — CRUD, todo
  modelo pertenece a una marca ya existente (`brandId` obligatorio).
- **`ProductosController`** (`/productos`) — CRUD del producto base
  (`good`/`service`/`kit`/`combo`/`composite`), con:
  - `baseUnitId` obligatorio, validado contra `units_of_measure` real.
  - `categoryId`/`brandId`/`modelId` opcionales, validados si se indican.
  - **Consistencia marca↔modelo, reforzada** — el propio documento de
    arquitectura señala esta invariante como "no reforzada hoy por
    `CHECK` cruzado, a nivel de `entities/`" (§4): si se indica
    `modelId`, ese modelo debe pertenecer a la marca indicada (o a la
    marca ya guardada del producto, en una edición) — implementado en
    `ProductosService.validarModelo()`, exactamente donde el propio
    documento sugería hacerlo.
  - **Invariante nuevo, no pedido explícitamente pero justificado por
    el propio documento**: un producto `service` no puede
    `tracksSerial`/`tracksLot` — "no tiene existencia física que
    rastrear" (§1, §12). Reforzado en la entidad `Producto`, verificado
    con test unitario y e2e.
- **`EmpresaLookupRepository`** (nuevo, compartido entre las 5
  entidades) — todas requieren `company_id NOT NULL`; valida contra
  `core.companies` real antes de crear, mismo patrón que
  `EmpresaSucursalLookupRepository` de `inventario` (Almacenes) y
  `OrganizationStatusRepository` de `auth` (Parte 02) — cada módulo de
  negocio adapta las tablas compartidas que necesita, nunca importa el
  repositorio de otro módulo.
- Permiso nuevo: `productos.gestionar_productos` (`seed-rbac.ts`),
  cubre las 5 sub-entidades con un solo permiso — mismo criterio que
  `inventario.gestionar_almacenes`.

## 3. Decisión de diseño — `companyId` explícito en el body, no del contexto

A diferencia de `Almacen` (que pidió `companyId`/`branchId` explícitos
porque el creador podía estar operando para OTRA sucursal), acá el
motivo es más simple: `company_id` es `NOT NULL` en las 5 tablas de este
módulo, y `context.companyId` puede ser `null` (usuario en "modo todas
las empresas", sin empresa activa fija) — asumirlo del contexto habría
roto la creación para ese caso. Se pide `companyId` explícito en el
body de creación (nunca reasignable en `PATCH`), igual criterio que
`Sucursal`/`Almacén` ya establecido. `branch_id` sí sale de
`context.branchId` (nullable en las 5 tablas, sin bloquear la creación).

## 4. Explícitamente fuera de alcance esta parte

- **Variantes** (`parent_product_id` + `product_variant_attribute_values`)
  — el documento de arquitectura describe un flujo de creación propio
  (§5: producto base + atributos que varían → generación de
  combinaciones), un caso de uso completo aparte, no una simple columna
  más del CRUD base.
- **Atributos genéricos** (`product_attributes`/`product_attribute_values`)
  — sistema de catálogo extensible, prerequisito de Variantes.
- **Combos y Kits** (`product_combos`/`product_kits` + sus componentes)
  — tablas de composición para venta, con reglas de precio propias
  (`pricing_policy`/`discount_percentage`).
- **BOM y Recetas** (`bill_of_materials`/`recipes`) — composición para
  producción real (`inventory.production_orders`), transformación
  física, no solo agrupación comercial.
- **Imágenes/Videos, Códigos de barra, Historial de precios, Reseñas,
  Proveedores, Perfiles fiscales, Presentaciones, Conversión de
  unidades, Líneas/Familias/Colecciones** — dimensiones de clasificación
  o metadatos adicionales, ninguno bloqueante para el CRUD base.
- **Lotes y Series** (`inventory.inventory_lots`/`inventory_serials`) —
  dueño real es `inventory`, no `productos` (docs/architecture/18 §6-7,
  ya aclarado en el propio documento) — `tracksSerial`/`tracksLot` en
  `Producto` son solo la _declaración_, las _instancias_ son de la fase
  Inventario siguiente.

## 5. Versión

`0.6.0` → **`0.7.0`** (`MINOR`): primer módulo de negocio nuevo desde
cero (5 de 27 con backend real, antes 4), cierra la Fase 04 del orden de
desarrollo.
