# Almacenes Report — FASE 03, continuidad (post Parte 03)

> Sesión del 2026-07-23, versión **0.6.0**. Primer código real de
> `modules/inventario/backend` — hasta esta parte, la carpeta existía
> vacía (`backend/frontend/shared` sin un solo archivo), confirmado en
> tres auditorías consecutivas (Parte 01/02/03). Cierra el único ítem
> real pendiente de la lista de prioridad "primero" de FASE 03. Ver
> `ALMACENES_TEST_REPORT.md` para testing, `ALMACENES_API.md` para el
> contrato de cada endpoint.

## 1. Alcance — Almacenes, no Inventario completo

`core/database/prisma/schemas/inventory/schema.prisma` modela **32
tablas** (stock, movimientos, costeo FIFO/LIFO/promedio, reservas,
conteos físicos/cíclicos, órdenes de producción, reglas de reposición/
putaway/picking...). El alcance real de "Almacenes" —confirmado contra
`docs/architecture/19-modulo-inventory.md §1-2`— es solo la estructura
física: **Almacén → Zona → Ubicación**, tres tablas
(`warehouses`/`warehouse_zones`/`warehouse_locations`). Las 29 tablas
restantes son la fase **Inventario** siguiente (`ROADMAP.md`), sin
código todavía — construirlas ahora habría sido alcance no pedido.

## 2. Qué se construyó

Mismo patrón Clean Architecture que `configuracion` (Empresas→
Sucursales) — nuevo proyecto Nx `inventario-backend`:

- **`AlmacenesController`** (`/inventario/almacenes`) — CRUD (crear/
  listar/obtener/actualizar, sin eliminar a propósito — mismo alcance
  que `SucursalesController`). `company_id`/`branch_id` son `NOT NULL`
  en `inventory.warehouses` (un almacén siempre pertenece a una empresa
  y sucursal concretas) — validados contra `core.companies`/
  `core.branches` reales antes de crear (`EmpresaSucursalLookupRepository`,
  nuevo — mismo patrón que `OrganizationStatusRepository` de `auth`
  Parte 02: cada módulo de negocio adapta las tablas compartidas que
  necesita, nunca importa el repositorio de otro módulo).
- **`ZonasAlmacenController`** (`/inventario/zonas`) — CRUD, toda zona
  pertenece a un almacén ya existente. `zoneFunction` valida contra el
  `CHECK` real de la tabla (`receiving`/`storage`/`picking`/`shipping`).
- **`UbicacionesAlmacenController`** (`/inventario/ubicaciones`) — CRUD,
  jerarquía auto-referenciada (`parentLocationId`) dentro de una zona —
  valida que el padre, si se indica, pertenezca a la MISMA zona (no
  tiene sentido operativo una jerarquía que cruce zonas).
- **`EmpresaSucursalLookupRepository`** (nuevo) — adapta `core.companies`/
  `core.branches` solo para verificar existencia/pertenencia, sin
  importar `modules/configuracion` (prohibido por
  `@nx/enforce-module-boundaries` entre módulos de negocio).
- Permiso nuevo: `inventario.gestionar_almacenes` (agregado a
  `seed-rbac.ts`, mismo mecanismo que cada módulo anterior).
- Quinto cliente Prisma independiente expuesto en `@gorazus/core-database`
  (`InventoryPrismaClient`/`PRISMA_INVENTORY`, ya wireado en
  `database.module.ts` desde el bootstrap del monorepo, sin consumidor
  hasta esta parte).

## 3. Decisiones de alcance — consistentes con lo ya construido

- **Sin `eliminar`/`restaurar`** — mismo alcance que `SucursalesService`
  (`modules/configuracion/backend`): baja lógica queda para cuando haya
  un caso de uso real que la necesite (ej. impedir eliminar un almacén
  con stock — que no existe todavía, fase Inventario).
- **Sin chequeo de unicidad de `code` a nivel de servicio** — mismo
  criterio que `EmpresasService`/`SucursalesService`: el índice único
  real (`(branch_id, code) WHERE deleted_at IS NULL`) es la fuente de
  verdad, la app no duplica esa validación antes de escribir.
- **`PATCH` nunca reasigna el padre de la jerarquía** — un almacén no
  cambia de empresa/sucursal, una zona no cambia de almacén, una
  ubicación no cambia de zona/padre vía `actualizar()`. Igual criterio
  que `Sucursal`/`Empresa` (ninguna permite reasignar tampoco).

## 4. Explícitamente fuera de alcance esta parte

- Las 29 tablas de stock/movimientos/costeo/conteos/producción — fase
  Inventario siguiente (`ROADMAP.md`).
- Reglas de putaway/picking/reposición (`putaway_rules`/`picking_rules`/
  `replenishment_rules`) — dependen de que exista stock real para tener
  sentido, mismo motivo que arriba.
- Frontend — sin pedido explícito de entregable frontend esta parte,
  mismo criterio que Auth/Usuarios Enterprise.

## 5. Versión

`0.5.0` → **`0.6.0`** (`MINOR`): primer módulo de negocio nuevo desde
cero (4 de 27 con backend real, antes 3), cierra la lista de prioridad
"primero" completa de FASE 03.
