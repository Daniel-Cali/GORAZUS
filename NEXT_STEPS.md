# Next Steps — GORAZUS ERP

> Actualizado 2026-07-23 tras cerrar Fase 05 Parte 02 (Motor de Stock y
> Movimientos), versión **0.8.0**. Complementa a
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
- **Parte 03 en adelante** — pendiente, ver `INVENTORY_NEXT_PHASE.md`
  para el plan completo de 7 partes (03 Reservas/transferencias → 04
  Ajustes/conteos → 05 Recepciones/salidas/reglas de almacén → 06
  Costeo → 07 Series/lotes → 08 Producción).

## 4. Próximo paso inmediato: Fase 05, Parte 03 — Reservas y Transferencias

Orden confirmado (`INVENTORY_NEXT_PHASE.md`): **Reservas y
transferencias** (`stock_reservations`/`stock_transfers`/
`stock_transfer_lines`), sobre el motor de movimientos ya construido en
`v0.8.0`.

**Por qué ahora**: el motor de movimientos (`v0.8.0`) es la dependencia
real de la que todo lo demás en `inventory` cuelga — reservas y
transferencias son el siguiente eslabón más simple (usan el motor tal
cual, sin necesitar costeo ni series/lotes todavía). El riesgo de
sincronización de `stock.quantity_reserved` ya está identificado
(`INVENTORY_STOCK_REPORT.md §5`) — Parte 03 debe cerrarlo con un test de
integración explícito, no dejarlo para después.

## 5. Orden completo restante (confirmado, `INVENTORY_NEXT_PHASE.md` + `ROADMAP.md`)

1. **Fase 05 Parte 03 — Reservas y transferencias** ← siguiente
2. Fase 05 Parte 04 — Ajustes y conteos físicos
3. Fase 05 Parte 05 — Recepciones, salidas y reglas de almacén
4. Fase 05 Parte 06 — Costeo (FIFO/LIFO/promedio)
5. Fase 05 Parte 07 — Series y lotes
6. Fase 05 Parte 08 — Producción
7. Clientes
8. Ventas
9. Caja
10. POS
11. (resto de los 27 módulos de negocio, sin re-priorizar todavía)

## 6. Deuda técnica que bloquea o condiciona lo de arriba

Ninguna deuda actual **bloquea** empezar Parte 03. Dos ítems a tener
presente (`TECHNICAL_DEBT.md §3`, ambos nuevos esta parte):

- Chequeo de stock suficiente sin locking explícito — condición de
  carrera bajo concurrencia real no resuelta. Parte 03 no la agrava
  (reservas usan su propio campo `quantity_reserved`, no vuelven a leer
  `quantity_on_hand` del mismo modo), pero tampoco la resuelve — sigue
  pendiente para cuando el proyecto necesite manejar concurrencia real.
- El chequeo de "stock suficiente" compara hoy contra `quantity_on_hand`
  a secas — Parte 03 es exactamente el momento de corregirlo para que
  compare contra `quantity_available` (`on_hand - reserved`), ya que a
  partir de acá `quantity_reserved` deja de ser siempre `0`.

## 7. No bloqueante, pero recomendado antes de seguir sumando módulos

- `nx run web:test` sigue roto (`PROJECT_HEALTH_REPORT.md §4`, `TECHNICAL_DEBT.md §4`)
  — no bloquea backend, pero cuanto más se tarde en arreglarlo más
  frontend nuevo se construye sin cobertura de test real.
- Docker Desktop caído (7ª sesión consecutiva) — Parte 03 se puede
  construir igual (mismo patrón que las 5 partes anteriores: build/lint/
  unitarios reales, e2e reales pendientes de confirmar), pero en algún
  momento hace falta una sesión con Docker arriba para correr la suite
  completa de una vez — la lista de e2e pendientes de reconfirmar sigue
  creciendo (ahora incluye también `stock-movimientos.controller.e2e-spec.ts`).

## 8. Progreso — porcentajes reales

| Dimensión                                                      |                      Real                      |
| -------------------------------------------------------------- | :--------------------------------------------: |
| Módulos de negocio con backend real                            |                5 / 27 (**19%**)                |
| Tablas de `inventory` con código real                          |                6 / 34 (**18%**)                |
| Tablas de `inventory` con arquitectura ya diseñada             |               34 / 34 (**100%**)               |
| Ítems de la lista "primero" de FASE 03 completos               |               10 / 10 (**100%**)               |
| Partes de la Fase 05 (Inventario) completas                    |                2 / 8 (**25%**)                 |
| Proyectos del monorepo que compilan sin error                  |               21 / 21 (**100%**)               |
| Proyectos del monorepo que lintean sin error                   |               25 / 25 (**100%**)               |
| Vulnerabilidades de dependencias en runtime de negocio directo | 0 / 39 (**0%** — todas transitivas de tooling) |

No se incluye un % de "cobertura de código" real — `coverageThreshold`
sigue en el piso de seguridad (5%, `TECHNICAL_DEBT.md`), no una medida
representativa de cobertura real todavía. Tampoco un % de tests
unitarios pasando consolidado — ver `INVENTORY_STOCK_TEST_REPORT.md §2`
para los números de esta sesión (todas las fallas de e2e atribuibles a
Docker caído, sin excepción).
