# Next Steps — GORAZUS ERP

> Actualizado 2026-07-23 tras cerrar Almacenes, versión **0.6.0**.
> Complementa a [PROJECT_STATUS.md](./PROJECT_STATUS.md) (estado
> actual) y [ROADMAP.md](./ROADMAP.md) (estado por módulo) — este
> documento responde específicamente "¿qué sigue, y por qué en ese
> orden?".

## 1. Lista de prioridad "primero" de FASE 03 — completa

Los 10 ítems (Infraestructura/Auth/Usuarios/Roles/Permisos/Multiempresa/
Sucursales/Almacenes/Configuración/API REST/OpenAPI) ya existen —
Almacenes (CRUD de Almacén→Zona→Ubicación,
`inventory.warehouses`/`warehouse_zones`/`warehouse_locations`) era el
único pendiente, cerrado esta parte. Ver `ALMACENES_REPORT.md` para el
detalle completo.

## 2. Próximo paso inmediato: Productos

Orden confirmado (`ROADMAP.md`): **Productos** → Inventario (stock/
movimientos reales, sobre la base de Almacenes ya construida) →
Clientes → Ventas → Caja → POS.

**Por qué Productos antes que Inventario (aunque Inventario ya tiene
la estructura de Almacenes lista)**: el stock real
(`inventory.stock`, `stock_movements`, etc.) siempre referencia un
`product_id` — no tiene sentido modelar existencias de productos que
no existen todavía. Ver `docs/architecture/18-modulo-products.md` para
el modelo de datos ya documentado (sin código todavía).

## 3. Orden completo restante (confirmado, `ROADMAP.md`)

1. **Productos** ← siguiente
2. Inventario (stock/movimientos/costeo/conteos/producción — las 29
   tablas de `inventory` que Almacenes no cubrió)
3. Clientes
4. Ventas
5. Caja
6. POS
7. (resto de los 27 módulos de negocio, sin re-priorizar todavía)

## 4. Deuda técnica que bloquea o condiciona lo de arriba

Ninguna deuda actual **bloquea** empezar Productos. Un ítem a tener
presente:

- `modules/inventario` ya tiene el patrón Clean Architecture establecido
  (entidad → repositorio puerto/adaptador → servicio → controller →
  validators Zod) sobre el quinto cliente Prisma (`PRISMA_INVENTORY`) —
  Inventario (paso 2 de esta lista) puede reusar exactamente esa
  estructura de proyecto, agregando controllers/servicios nuevos al
  mismo `InventarioModule` en vez de crear un sexto módulo Nx.

## 5. No bloqueante, pero recomendado antes de seguir sumando módulos

- `nx run web:test` sigue roto (`PROJECT_HEALTH_REPORT.md §4`, `TECHNICAL_DEBT.md §4`)
  — no bloquea backend, pero cuanto más se tarde en arreglarlo más
  frontend nuevo se construye sin cobertura de test real.
- Docker Desktop caído (5ª sesión consecutiva) — Productos se puede
  construir igual (mismo patrón que las 3 partes anteriores: build/lint/
  unitarios con fakes, e2e reales pendientes de confirmar), pero en
  algún momento hace falta una sesión con Docker arriba para correr la
  suite completa de una vez — la lista de e2e pendientes de reconfirmar
  sigue creciendo (ahora incluye también `almacenes.controller.e2e-spec.ts`).

## 6. Progreso — porcentajes reales

| Dimensión                                                      |                          Real                          |
| -------------------------------------------------------------- | :----------------------------------------------------: |
| Módulos de negocio con backend real                            |                    4 / 27 (**15%**)                    |
| Ítems de la lista "primero" de FASE 03 completos               |                   10 / 10 (**100%**)                   |
| Proyectos del monorepo que compilan sin error                  | 20 / 20 (**100%**, incluye `inventario-backend` nuevo) |
| Proyectos del monorepo que lintean sin error                   |                   24 / 24 (**100%**)                   |
| Vulnerabilidades de dependencias en runtime de negocio directo |     0 / 39 (**0%** — todas transitivas de tooling)     |

No se incluye un % de "cobertura de código" real — `coverageThreshold`
sigue en el piso de seguridad (5%, `TECHNICAL_DEBT.md`), no una medida
representativa de cobertura real todavía. Tampoco un % de tests
unitarios pasando consolidado — ver `ALMACENES_TEST_REPORT.md §2` y
`PROJECT_HEALTH_REPORT.md §3` para los números por paquete de esta
sesión (todas las fallas atribuibles a Docker caído, sin excepción).
