# Next Steps — GORAZUS ERP

> Actualizado 2026-07-23 tras cerrar Productos, versión **0.7.0**.
> Complementa a [PROJECT_STATUS.md](./PROJECT_STATUS.md) (estado
> actual) y [ROADMAP.md](./ROADMAP.md) (estado por módulo) — este
> documento responde específicamente "¿qué sigue, y por qué en ese
> orden?".

## 1. Lista de prioridad "primero" de FASE 03 — completa

Los 10 ítems (Infraestructura/Auth/Usuarios/Roles/Permisos/Multiempresa/
Sucursales/Almacenes/Configuración/API REST/OpenAPI) ya existen desde la
parte anterior. Sin cambios esta parte.

## 2. Fase 04 — Productos, completa

`v0.7.0` agregó `modules/productos/backend`: CRUD de Unidades de
Medida, Categorías (jerárquica), Marcas, Modelos y Productos (5 de 35
tablas del schema `products`), con validación cruzada marca↔modelo y
el invariante de que un producto `service` no rastrea serie/lote. Ver
`PRODUCTOS_REPORT.md` para el detalle completo.

## 3. Próximo paso inmediato: Inventario

Orden confirmado (`ROADMAP.md`): **Inventario** (stock/movimientos/
costeo/conteos/producción reales, sobre la base ya construida de
Almacenes en `0.6.0` y Productos en `0.7.0`) → Clientes → Ventas →
Caja → POS.

**Por qué Inventario ahora**: el stock real (`inventory.stock`,
`stock_movements`, etc.) siempre referencia un `product_id` y un
`warehouse_id` — ambos ya existen en código real desde esta parte y la
anterior. Ya no hay ninguna dependencia de datos pendiente para
empezar. Ver `docs/architecture/19-modulo-inventory.md` para el modelo
de datos ya documentado de las 29 tablas restantes (stock,
movimientos, costeo, conteos físicos, producción).

## 4. Orden completo restante (confirmado, `ROADMAP.md`)

1. **Inventario** ← siguiente (stock/movimientos/costeo/conteos/
   producción — las 29 tablas de `inventory` que Almacenes no cubrió)
2. Clientes
3. Ventas
4. Caja
5. POS
6. (resto de los 27 módulos de negocio, sin re-priorizar todavía)

## 5. Deuda técnica que bloquea o condiciona lo de arriba

Ninguna deuda actual **bloquea** empezar Inventario. Un ítem a tener
presente:

- `modules/inventario` ya tiene el patrón Clean Architecture establecido
  (entidad → repositorio puerto/adaptador → servicio → controller →
  validators Zod) sobre el quinto cliente Prisma (`PRISMA_INVENTORY`) —
  Inventario (stock/movimientos) puede reusar exactamente esa
  estructura de proyecto, agregando controllers/servicios nuevos al
  mismo `InventarioModule` en vez de crear un módulo Nx nuevo. Cada
  movimiento de stock referenciará `product_id` (`modules/productos`,
  sexto cliente Prisma, `PRISMA_PRODUCTS`) vía el mismo patrón de
  lookup repository ya usado 3 veces (`OrganizationStatusRepository`/
  `EmpresaSucursalLookupRepository`/`EmpresaLookupRepository`).

## 6. No bloqueante, pero recomendado antes de seguir sumando módulos

- `nx run web:test` sigue roto (`PROJECT_HEALTH_REPORT.md §4`, `TECHNICAL_DEBT.md §4`)
  — no bloquea backend, pero cuanto más se tarde en arreglarlo más
  frontend nuevo se construye sin cobertura de test real.
- Docker Desktop caído (6ª sesión consecutiva) — Inventario se puede
  construir igual (mismo patrón que las 4 partes anteriores: build/lint/
  unitarios reales, e2e reales pendientes de confirmar), pero en algún
  momento hace falta una sesión con Docker arriba para correr la suite
  completa de una vez — la lista de e2e pendientes de reconfirmar sigue
  creciendo (ahora incluye también `productos.controller.e2e-spec.ts`).

## 7. Progreso — porcentajes reales

| Dimensión                                                      |                         Real                          |
| -------------------------------------------------------------- | :---------------------------------------------------: |
| Módulos de negocio con backend real                            |                   5 / 27 (**19%**)                    |
| Ítems de la lista "primero" de FASE 03 completos               |                  10 / 10 (**100%**)                   |
| Fases del orden de desarrollo completas (01-04 de 20)          |                   4 / 20 (**20%**)                    |
| Proyectos del monorepo que compilan sin error                  | 21 / 21 (**100%**, incluye `productos-backend` nuevo) |
| Proyectos del monorepo que lintean sin error                   |                  25 / 25 (**100%**)                   |
| Vulnerabilidades de dependencias en runtime de negocio directo |    0 / 39 (**0%** — todas transitivas de tooling)     |

No se incluye un % de "cobertura de código" real — `coverageThreshold`
sigue en el piso de seguridad (5%, `TECHNICAL_DEBT.md`), no una medida
representativa de cobertura real todavía. Tampoco un % de tests
unitarios pasando consolidado — ver `PRODUCTOS_TEST_REPORT.md §2` para
los números de esta sesión (todas las fallas de e2e atribuibles a
Docker caído, sin excepción).
