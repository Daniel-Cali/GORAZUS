# Reporte — Fase 05, Inventario Enterprise, Parte 02: Motor de Stock y Movimientos

## 1. Punto de partida

Con el diseño completo de `INVENTORY_ARCHITECTURE.md` (Parte 01) verificado, esta parte construyó
el primer código real sobre 3 de las 34 tablas de `inventory` que Almacenes (`v0.6.0`) no cubrió:
`stock`, `stock_movement_types`, `stock_movements` — el motor del que dependen las 6 partes
siguientes (`INVENTORY_NEXT_PHASE.md`).

## 2. Qué se construyó

- **Catálogo de tipos de movimiento** (`TiposMovimientoController`/`TiposMovimientoService`):
  crear/listar/obtener/actualizar sobre `inventory.stock_movement_types`. `code` único por tenant
  (índice parcial real, validado en el servicio antes de tocar la base). Sin `eliminar` — un tipo
  referenciado por movimientos históricos no puede desaparecer.
- **Motor de movimientos** (`MovimientosController`/`MovimientosService`/
  `MovimientoStockRepository`): `POST /inventario/movimientos` es la única puerta de entrada que
  modifica `inventory.stock` — actualiza el saldo y crea el movimiento en la misma transacción de
  base de datos (`withTenantScope` ya envuelve en `$transaction`), nunca dos escrituras
  independientes. Valida, en orden: tipo de movimiento existe (resuelve `direction`), invariantes
  de la entidad `MovimientoStock` (cantidad > 0, costo unitario ≥ 0 si se indica, documento origen
  completo o ausente), producto existe (`ProductoLookupRepository` sobre `products.products`),
  almacén existe (reusa `AlmacenRepository` ya construido en Almacenes), ubicación existe si se
  indica (reusa `UbicacionAlmacenRepository`).
- **Consultas de stock** (`StockController`/`StockService`): `GET /inventario/stock` (listado
  filtrable) y `GET /inventario/stock/disponible` (`quantity_on_hand - quantity_reserved`,
  calculado en código — `inventory.v_available_stock` es una resta simple, no amerita una segunda
  consulta a la vista). `StockRepository` es deliberadamente de **solo lectura** — no expone
  `create`/`update`: el saldo nunca se escribe fuera del motor de movimientos, ver §3.
- **Kardex** (`KardexController`/`KardexService`/`KardexRepository`): `GET /inventario/kardex`
  consulta directo la vista real `inventory.v_kardex` vía `$queryRawUnsafe` parametrizado (mismo
  mecanismo de bind parameters que ya usa `tenant-scope.ts` para `set_config`, nunca interpolación
  de string) — reusa el saldo corrido ya calculado por función de ventana en la base en vez de
  reimplementar la misma lógica en la aplicación. Primer uso de una vista de Postgres desde código
  de aplicación en todo el proyecto (las vistas no están modeladas por Prisma en este esquema de
  generación — sin `previewFeatures = ["views"]`).
- **`ProductoLookupRepository`** (nuevo): mismo patrón que `EmpresaSucursalLookupRepository`/
  `EmpresaLookupRepository` — `inventario` no es dueño de `products.products`, lo adapta con su
  propio repositorio sobre `PRISMA_PRODUCTS` (`@nx/enforce-module-boundaries` impide importar
  `modules/productos/backend` directo).
- **`company_id`/`branch_id` resueltos, no pedidos**: a diferencia de Almacenes/Productos
  (`companyId` explícito en el body porque esas tablas no tienen otro origen), un movimiento
  resuelve `company_id`/`branch_id` desde el almacén destino (`warehouses.company_id`/`branch_id`,
  ambos `NOT NULL`) — evita pedirle al llamador un dato redundante que además podría no coincidir
  con el almacén real.

## 3. Invariante de dominio reforzada en código, no solo documentada

`INVENTORY_ARCHITECTURE.md §6` señaló que `stock` nunca debería actualizarse fuera de un
movimiento — acá quedó estructuralmente forzado: `StockRepository` no tiene `create`/`update` en
absoluto, la única forma de cambiar `quantity_on_hand` es `MovimientoStockRepository.registrar()`.
Un segundo invariante nuevo, no documentado antes de esta parte: **lo reservado nunca puede
superar lo disponible físicamente** — no hay `CHECK` cruzado entre `quantity_on_hand` y
`quantity_reserved` en la tabla (columnas `NUMERIC` independientes), se valida en la entidad
`Stock` (mismo criterio que el invariante marca↔modelo de `Producto`, FASE 04).

## 4. Simplificación deliberada, documentada (no un descuido)

El chequeo de "stock suficiente" antes de una salida compara contra `quantity_on_hand`, no contra
`quantity_available` (`on_hand - reserved`) — son equivalentes hoy porque `quantity_reserved`
siempre es `0` (no existen reservas todavía, Parte 03). Queda un comentario `TODO` explícito en
`movimiento-stock.repository.prisma.ts` para revisarlo cuando Parte 03 (Reservas) exista. Tampoco
se verifica que una `locationId` pertenezca a la misma zona/almacén que se está moviendo — solo que
exista (`UbicacionAlmacenRepository.findById`) — una validación de cadena completa
ubicación→zona→almacén queda fuera de alcance de esta parte, no fue pedida explícitamente.

## 5. Riesgo de concurrencia — mismo ya señalado en `INVENTORY_HEALTH_REPORT.md §3`, sin resolver

El chequeo de stock suficiente lee el saldo actual dentro de la misma transacción que lo escribe,
pero sin `SELECT ... FOR UPDATE` ni aislamiento `SERIALIZABLE` — dos movimientos concurrentes sobre
el mismo `(product_id, warehouse_id, location_id)` podrían, en el peor caso, ambos leer el mismo
saldo antes de que cualquiera de los dos escriba. No se implementó locking explícito esta parte
(ningún otro repositorio del proyecto lo usa todavía) — riesgo real, documentado, no oculto.

## 6. Seed y permisos

`modules/inventario/backend/scripts/seed-stock-movement-types.ts` (nuevo, mismo patrón que
`seed-rbac.ts`/`seed-tax-jurisdictions.ts`) siembra 8 tipos idempotentes:
`receipt`/`issue`/`transfer_out`/`transfer_in`/`adjustment_increase`/`adjustment_decrease`/
`production_output`/`production_consumption` — el catálogo que Parte 03 en adelante va a necesitar,
sin obligar a cada parte futura a sembrar los suyos por separado. Permiso nuevo
`inventario.gestionar_stock` (`seed-rbac.ts`), distinto de `inventario.gestionar_almacenes` — cada
área funcional del módulo con su propio permiso, mismo criterio que el resto del proyecto.

## 7. Versión

`0.7.0` → `0.8.0` (`MINOR`: primer código real de esta parte, no diseño). Ver `VERSION.md`.
