# Next Steps — GORAZUS ERP

> Actualizado 2026-07-24 tras cerrar Fase 05 Parte 04 (Ajustes y
> Conteos Físicos), versión **0.10.0**. Complementa a
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

## 3. Fase 05 — Inventario Enterprise, en curso (rama `feature/inventory-adjustments`)

- **Parte 01 (diseño)** — completa. Arquitectura de las 34 tablas del
  schema `inventory` verificada contra el SQL real. Ver
  `INVENTORY_ARCHITECTURE.md`.
- **Parte 02 (Motor de stock y movimientos)** — completa, `v0.8.0`.
  Ver `INVENTORY_STOCK_REPORT.md`.
- **Parte 03 (Reservas y Transferencias)** — completa, `v0.9.0`. Ver
  `INVENTORY_RESERVAS_TRANSFERENCIAS_REPORT.md`.
- **Parte 04 (Ajustes y Conteos Físicos)** — completa, `v0.10.0`.
  Ajustes que resuelven `previousQuantity` real y generan movimientos al
  confirmar; conteos con captura ciega y ajuste automático ante
  discrepancias; programación cíclica por zona; **bloqueo real de filas**
  (`SELECT ... FOR UPDATE`) cerrando el riesgo de concurrencia
  documentado desde Parte 02. Ver `INVENTORY_ADJUSTMENTS_REPORT.md`,
  `INVENTORY_PHYSICAL_COUNTS.md`, `INVENTORY_CYCLE_COUNT.md`.
- **Parte 05 en adelante** — pendiente, ver `INVENTORY_NEXT_PHASE.md`
  para el plan completo (05 Recepciones/salidas/reglas de almacén → 06
  Costeo → 07 Series/lotes → 08 Producción).

## 4. Próximo paso inmediato: Fase 05, Parte 05 — Recepciones, Salidas y Reglas de Almacén

Orden confirmado (`INVENTORY_NEXT_PHASE.md`): **Recepciones, salidas y
reglas de almacén** (`goods_receipts`/`goods_receipt_lines`/
`goods_issues`/`goods_issue_lines`/`goods_issue_reasons`/
`putaway_rules`/`picking_rules`/`replenishment_rules`), sobre el motor
de movimientos ya construido.

**Por qué ahora**: recepciones/salidas son el mecanismo documental real
que otros módulos futuros (Compras, Ventas) van a usar para registrar
entradas/salidas — hoy solo existe el registro manual directo
(`POST /inventario/movimientos`). Las reglas (`putaway`/`picking`/
`replenishment`) son configuración simple (CRUD tipo Almacenes), el
motor que las aplique automáticamente durante una recepción/salida real
queda fuera de esta parte (no fue pedido con ese detalle todavía).

## 5. Orden completo restante (confirmado, `INVENTORY_NEXT_PHASE.md` + `ROADMAP.md`)

1. **Fase 05 Parte 05 — Recepciones, salidas y reglas de almacén** ← siguiente
2. Fase 05 Parte 06 — Costeo (FIFO/LIFO/promedio)
3. Fase 05 Parte 07 — Series y lotes
4. Fase 05 Parte 08 — Producción
5. Clientes
6. Ventas
7. Caja
8. POS
9. (resto de los 27 módulos de negocio, sin re-priorizar todavía)

## 6. Deuda técnica que bloquea o condiciona lo de arriba

Ninguna deuda actual **bloquea** empezar Parte 05. Dos ítems a tener
presente (`TECHNICAL_DEBT.md §3`, ambos nuevos esta parte):

- "Conteo doble" y clasificación ABC/rotación para conteos cíclicos no
  soportados por el schema — ninguno bloquea Parte 05.
- El bloqueo de filas (`SELECT ... FOR UPDATE`) implementado esta parte
  todavía no se verificó bajo concurrencia real contra Postgres — cuando
  Docker esté disponible, valdría la pena una prueba de carga dedicada
  antes de asumir que el fix funciona igual en producción que en los
  fakes de unit test.

## 7. No bloqueante, pero recomendado antes de seguir sumando módulos

- `nx run web:test` sigue roto (`PROJECT_HEALTH_REPORT.md §4`, `TECHNICAL_DEBT.md §4`)
  — no bloquea backend, pero cuanto más se tarde en arreglarlo más
  frontend nuevo se construye sin cobertura de test real.
- Docker Desktop caído (8ª sesión consecutiva) — Parte 05 se puede
  construir igual (mismo patrón que las 7 partes anteriores: build/lint/
  unitarios reales, e2e reales pendientes de confirmar), pero en algún
  momento hace falta una sesión con Docker arriba para correr la suite
  completa de una vez — la lista de e2e pendientes de reconfirmar sigue
  creciendo (ahora incluye también `ajustes-conteos.controller.e2e-spec.ts`).
- **Higiene de sesión** (nuevo, no de código): esta parte detectó 55
  procesos `jest-worker` huérfanos de corridas de test interrumpidas por
  reinicios de sesión, agotando la memoria del sistema temporalmente —
  si vuelve a pasar, verificar `tasklist`/`Get-CimInstance Win32_Process`
  antes de asumir que un comando colgado es un bug de código.

## 8. Progreso — porcentajes reales

| Dimensión                                                      |                      Real                      |
| -------------------------------------------------------------- | :--------------------------------------------: |
| Módulos de negocio con backend real                            |                5 / 27 (**19%**)                |
| Tablas de `inventory` con código real                          |               15 / 34 (**44%**)                |
| Tablas de `inventory` con arquitectura ya diseñada             |               34 / 34 (**100%**)               |
| Ítems de la lista "primero" de FASE 03 completos               |               10 / 10 (**100%**)               |
| Partes de la Fase 05 (Inventario) completas                    |                4 / 8 (**50%**)                 |
| Proyectos del monorepo que compilan sin error                  |               21 / 21 (**100%**)               |
| Proyectos del monorepo que lintean sin error                   |               25 / 25 (**100%**)               |
| Vulnerabilidades de dependencias en runtime de negocio directo | 0 / 39 (**0%** — todas transitivas de tooling) |

No se incluye un % de "cobertura de código" real — `coverageThreshold`
sigue en el piso de seguridad (5%, `TECHNICAL_DEBT.md`), no una medida
representativa de cobertura real todavía. Tampoco un % de tests
unitarios pasando consolidado — ver `INVENTORY_TEST_REPORT.md §2` para
los números de esta sesión (todas las fallas de e2e atribuibles a
Docker caído, sin excepción).
