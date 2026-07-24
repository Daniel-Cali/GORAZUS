# Next Steps — GORAZUS ERP

> Actualizado 2026-07-23 tras cerrar Fase 05 Parte 03 (Reservas y
> Transferencias), versión **0.9.0**. Complementa a
> [PROJECT_STATUS.md](./PROJECT_STATUS.md) (estado actual) y
> [ROADMAP.md](./ROADMAP.md) (estado por módulo) — este documento
> responde específicamente "¿qué sigue, y por qué en ese orden?".

## 1. Lista de prioridad "primero" de FASE 03 — completa

Los 10 ítems (Infraestructura/Auth/Usuarios/Roles/Permisos/Multiempresa/
Sucursales/Almacenes/Configuración/API REST/OpenAPI) ya existen desde
hace varias partes. Sin cambios esta parte.

## 2. Fase 04 — Productos, completa

`v0.7.0` agregó `modules/productos/backend`: CRUD de Unidades de
Medida, Categorías (jerárquica), Marcas, Modelos y Productos. Ver
`PRODUCTOS_REPORT.md` para el detalle completo.

## 3. Fase 05 — Inventario Enterprise, en curso (rama `feature/inventory-core`)

- **Parte 01 (diseño)** — completa. Arquitectura de las 34 tablas del
  schema `inventory` verificada contra el SQL real, 6 gaps de schema
  documentados. Ver `INVENTORY_ARCHITECTURE.md`.
- **Parte 02 (Motor de stock y movimientos)** — completa, `v0.8.0`.
  Catálogo de tipos de movimiento, registro de movimientos con
  actualización atómica de `inventory.stock`, disponible, kardex real.
  Ver `INVENTORY_STOCK_REPORT.md`.
- **Parte 03 (Reservas y Transferencias)** — completa, `v0.9.0`.
  Reservas que protegen stock sin descontarlo, transferencias con flujo
  de estados completo y movimientos atómicos multi-línea
  (`registrarLote`). Corrige el chequeo de stock suficiente de `0.8.0`.
  Ver `INVENTORY_RESERVAS_TRANSFERENCIAS_REPORT.md`.
- **Parte 04 en adelante** — pendiente, ver `INVENTORY_NEXT_PHASE.md`
  para el plan completo (04 Ajustes/conteos → 05 Recepciones/salidas/
  reglas de almacén → 06 Costeo → 07 Series/lotes → 08 Producción).

## 4. Próximo paso inmediato: Fase 05, Parte 04 — Ajustes y Conteos Físicos

Orden confirmado (`INVENTORY_NEXT_PHASE.md`): **Ajustes y conteos
físicos** (`stock_adjustments`/`stock_adjustment_lines`/
`stock_adjustment_reasons`/`physical_counts`/`physical_count_lines`/
`cycle_count_schedules`), sobre el motor de movimientos ya construido.

**Por qué ahora**: es el último eslabón que falta antes de recepciones/
salidas documentales (Parte 05) — un ajuste es, en esencia, "corregir
`stock` a un valor conocido y dejar registro de por qué", el mismo
patrón que reservas/transferencias ya validaron (orquestar el motor de
movimientos, nunca tocar `stock` directo). El punto de diseño ya
resuelto en `INVENTORY_ARCHITECTURE.md`: un conteo físico **nunca**
toca `stock` directo — genera una propuesta de ajuste, que sigue el
flujo normal (borrador → confirmado → movimiento).

## 5. Orden completo restante (confirmado, `INVENTORY_NEXT_PHASE.md` + `ROADMAP.md`)

1. **Fase 05 Parte 04 — Ajustes y conteos físicos** ← siguiente
2. Fase 05 Parte 05 — Recepciones, salidas y reglas de almacén
3. Fase 05 Parte 06 — Costeo (FIFO/LIFO/promedio)
4. Fase 05 Parte 07 — Series y lotes
5. Fase 05 Parte 08 — Producción
6. Clientes
7. Ventas
8. Caja
9. POS
10. (resto de los 27 módulos de negocio, sin re-priorizar todavía)

## 6. Deuda técnica que bloquea o condiciona lo de arriba

Ninguna deuda actual **bloquea** empezar Parte 04. Dos ítems a tener
presente (`TECHNICAL_DEBT.md §3`):

- Chequeo de stock suficiente sin locking explícito — condición de
  carrera bajo concurrencia real no resuelta, ahora también aplica a
  `registrarLote`. Parte 04 no la agrava ni la resuelve.
- Cancelar una transferencia ya `in_transit` no está soportado — si el
  negocio lo necesita antes de llegar a Parte 08, hay que diseñar el
  movimiento de reversión correspondiente (no está en el plan actual).

## 7. No bloqueante, pero recomendado antes de seguir sumando módulos

- `nx run web:test` sigue roto (`PROJECT_HEALTH_REPORT.md §4`, `TECHNICAL_DEBT.md §4`)
  — no bloquea backend, pero cuanto más se tarde en arreglarlo más
  frontend nuevo se construye sin cobertura de test real.
- Docker Desktop caído (7ª sesión consecutiva) — Parte 04 se puede
  construir igual (mismo patrón que las 6 partes anteriores: build/lint/
  unitarios reales, e2e reales pendientes de confirmar), pero en algún
  momento hace falta una sesión con Docker arriba para correr la suite
  completa de una vez — la lista de e2e pendientes de reconfirmar sigue
  creciendo (ahora incluye también `reservas-transferencias.controller.e2e-spec.ts`).

## 8. Progreso — porcentajes reales

| Dimensión                                                      |                      Real                      |
| -------------------------------------------------------------- | :--------------------------------------------: |
| Módulos de negocio con backend real                            |                5 / 27 (**19%**)                |
| Tablas de `inventory` con código real                          |                9 / 34 (**26%**)                |
| Tablas de `inventory` con arquitectura ya diseñada             |               34 / 34 (**100%**)               |
| Ítems de la lista "primero" de FASE 03 completos               |               10 / 10 (**100%**)               |
| Partes de la Fase 05 (Inventario) completas                    |                3 / 8 (**38%**)                 |
| Proyectos del monorepo que compilan sin error                  |               21 / 21 (**100%**)               |
| Proyectos del monorepo que lintean sin error                   |               25 / 25 (**100%**)               |
| Vulnerabilidades de dependencias en runtime de negocio directo | 0 / 39 (**0%** — todas transitivas de tooling) |

No se incluye un % de "cobertura de código" real — `coverageThreshold`
sigue en el piso de seguridad (5%, `TECHNICAL_DEBT.md`), no una medida
representativa de cobertura real todavía. Tampoco un % de tests
unitarios pasando consolidado — ver
`INVENTORY_RESERVAS_TRANSFERENCIAS_TEST_REPORT.md §2` para los números
de esta sesión (todas las fallas de e2e atribuibles a Docker caído, sin
excepción).
