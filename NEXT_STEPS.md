# Next Steps — GORAZUS ERP

> Diagnóstico inicial de sesión, 2026-07-23, versión **0.5.0**.
> Complementa a [PROJECT_STATUS.md](./PROJECT_STATUS.md) (estado
> actual) y [ROADMAP.md](./ROADMAP.md) (estado por módulo) — este
> documento responde específicamente "¿qué sigue, y por qué en ese
> orden?".

## 1. Próximo paso inmediato: Almacenes

Único ítem real pendiente de la lista de prioridad "primero" de FASE 03
(Infraestructura/Auth/Usuarios/Roles/Permisos/Multiempresa/Sucursales/
**Almacenes**/Configuración/API REST/OpenAPI — el resto ya existe,
confirmado de nuevo en el diagnóstico de esta sesión,
`PROJECT_STATUS.md §6`).

**Alcance real** (no todo `core/database/prisma/schemas/inventory/`,
que tiene 32 tablas): "Almacenes" es la estructura física —
`warehouses` (almacén), `warehouse_zones` (zona dentro de un almacén),
`warehouse_locations` (ubicación dentro de una zona) — mismo patrón
jerárquico que `configuracion` ya construyó para Empresas→Sucursales.
Las 29 tablas restantes (stock, movimientos, reservas, costeo FIFO/LIFO/
promedio, lotes/series, conteos físicos/cíclicos, órdenes de
producción, reglas de reposición/putaway/picking) son la fase
**Inventario**, siguiente en el orden, no esta.

Ver `docs/architecture/19-modulo-inventory.md` para el modelo de datos
ya documentado (diseño existente, sin una sola línea de código de
`modules/inventario/backend` todavía).

## 2. Orden completo restante (confirmado, `ROADMAP.md`)

1. **Almacenes** ← siguiente
2. Productos
3. Inventario (stock/movimientos, sobre la base de Almacenes)
4. Clientes
5. Ventas
6. Caja
7. POS
8. (resto de los 27 módulos de negocio, sin re-priorizar todavía)

## 3. Deuda técnica que bloquea o condiciona lo de arriba

Ninguna deuda actual **bloquea** empezar Almacenes — es un módulo nuevo,
aislado, sin dependencias de los gaps conocidos. Dos ítems sí conviene
tener presentes por si el diseño de Almacenes los toca de pasada:

- `core/messaging`/`core/scheduler` siguen sin un solo productor/consumidor
  real (`TECHNICAL_DEBT.md §2`) — si Almacenes necesitara eventos de
  dominio publicados de verdad (ej. "almacén creado" disparando algo en
  otro módulo), sería el primer consumidor real de esa infraestructura,
  decisión a tomar explícitamente, no asumida.
- 185 FK reales cruzan schemas de módulos de negocio distintos
  (`TECHNICAL_DEBT.md §2`) — confirmar si alguna involucra
  `warehouses`/`warehouse_zones`/`warehouse_locations` antes de asumir
  aislamiento total del módulo.

## 4. No bloqueante, pero recomendado antes de seguir sumando módulos

- `nx run web:test` roto (`PROJECT_HEALTH_REPORT.md §4`, detectado esta
  sesión) — no bloquea backend, pero cuanto más se tarde en arreglarlo
  más frontend nuevo se construye sin cobertura de test real.
- Docker Desktop caído (4ª sesión consecutiva) — Almacenes se puede
  construir igual (mismo patrón que Auth Enterprise/Usuarios Enterprise:
  build/lint/unitarios con fakes, e2e reales pendientes de confirmar),
  pero en algún momento hace falta una sesión con Docker arriba para
  correr la suite completa de una vez.

## 5. Progreso — porcentajes reales

| Dimensión                                                      |                      Real                      |
| -------------------------------------------------------------- | :--------------------------------------------: |
| Módulos de negocio con backend real                            |                3 / 27 (**11%**)                |
| Ítems de la lista "primero" de FASE 03 completos               |    9 / 10 (**90%** — falta solo Almacenes)     |
| Proyectos del monorepo que compilan sin error                  |               19 / 19 (**100%**)               |
| Proyectos del monorepo que lintean sin error                   |               23 / 23 (**100%**)               |
| Tests unitarios backend pasando (sin infraestructura real)     |              157 / 165 (**95%**)               |
| Vulnerabilidades de dependencias en runtime de negocio directo | 0 / 39 (**0%** — todas transitivas de tooling) |

No se incluye un % de "cobertura de código" real — `coverageThreshold`
sigue en el piso de seguridad (5%, `TECHNICAL_DEBT.md`), no una medida
representativa de cobertura real todavía.
