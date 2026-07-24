# Next Steps — GORAZUS ERP

> Actualizado 2026-07-24 tras cerrar Fase 06 Parte 01 (Punto de Venta
> Enterprise), versión **0.11.0**. Complementa a
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
- **Parte 05 en adelante** — quedó **pendiente, sin construir**, ver
  `INVENTORY_NEXT_PHASE.md` para el plan completo (05 Recepciones/
  salidas/reglas de almacén → 06 Costeo → 07 Series/lotes → 08
  Producción). Esta fase se pausó para construir el POS (§3.1).

### 3.1 Fase 06 — Punto de Venta (POS) Enterprise, Parte 01 completa (rama `feature/sales-pos`)

`v0.11.0` agregó, por pedido explícito del usuario, checkout completo de venta **saltando** el
orden que tenía prevista Inventario Parte 05-08 arriba: `clientes` (CRUD mínimo + Consumidor
Final), `caja` (registros/apertura/cierre/movimientos), `ventas` (facturas con impuesto real por
línea, recibos), `pos` (orquestador: buscar → carrito → cobrar con pago mixto → factura →
descuenta stock → registra caja → confirma; suspender/recuperar venta). Primera composición
backend-a-backend real entre módulos de negocio del proyecto. Ver `POS_ARCHITECTURE.md` para el
detalle completo de alcance, `POS_TEST_REPORT.md` para testing (42 tests nuevos + 153 de
Inventario re-verificados sin regresiones), `POS_HEALTH_REPORT.md` para riesgos.

Durante la verificación end-to-end contra Postgres real (Docker arriba, primera vez en 9 sesiones)
se encontraron y corrigieron dos bugs preexistentes de Fase 05 Parte 02/04 — ver `POS_DATABASE.md
§5` y `TECHNICAL_DEBT.md §3`.

## 4. Próximo paso inmediato: sin decisión tomada — dos caminos abiertos

**Camino A — continuar POS.** Fase 06 Parte 02: alcance a definir dentro de lo diferido en
`POS_ARCHITECTURE.md §3` (candidato natural: devoluciones/cambios/garantías, el gap funcional más
alto listado en `POS_HEALTH_REPORT.md §3`).

**Camino B — retomar el orden original.** Fase 05, Parte 05 — Recepciones, Salidas y Reglas de
Almacén (`goods_receipts`/`goods_receipt_lines`/`goods_issues`/`goods_issue_lines`/
`goods_issue_reasons`/`putaway_rules`/`picking_rules`/`replenishment_rules`), sobre el motor de
movimientos ya construido — sigue exactamente donde quedó antes de este desvío.

**Por qué no hay recomendación única todavía**: ambos caminos son válidos y ninguno bloquea al
otro técnicamente — la decisión es de producto/prioridad de negocio (¿el POS necesita cerrar su
ciclo de venta primero, o Inventario necesita completarse antes de que el POS dependa de más
piezas suyas?), no una decisión que corresponda tomar unilateralmente en esta sesión.

## 5. Orden completo restante (actualizado tras el desvío de Fase 06 Parte 01)

1. **Fase 06 Parte 02 (POS)** o **Fase 05 Parte 05 (Recepciones/Salidas/Reglas)** ← a decidir, §4
2. Fase 05 Parte 06 — Costeo (FIFO/LIFO/promedio)
3. Fase 05 Parte 07 — Series y lotes
4. Fase 05 Parte 08 — Producción
5. (resto de los 27 módulos de negocio, sin re-priorizar todavía)

## 6. Deuda técnica que bloquea o condiciona lo de arriba

Ninguna deuda actual **bloquea** ninguno de los dos caminos. Ítems a tener presente
(`TECHNICAL_DEBT.md §3`):

- "Conteo doble" y clasificación ABC/rotación para conteos cíclicos no
  soportados por el schema — no bloquea ninguno de los dos caminos.
- El bloqueo de filas (`SELECT ... FOR UPDATE`) sigue sin verificarse bajo carga concurrente real
  (k6) — relevante para ambos caminos si el volumen crece, más urgente para POS por ser un punto de
  entrada de alto tráfico (`POS_HEALTH_REPORT.md §3`).
- El checkout de POS no es una transacción distribuida real entre `inventario`/`ventas`/`caja` — no
  bloquea POS Parte 02, pero condiciona qué tan lejos se puede llevar el volumen antes de mitigarlo
  (`POS_HEALTH_REPORT.md §3`).

## 7. No bloqueante, pero recomendado antes de seguir sumando módulos

- `nx run web:test` sigue roto (`PROJECT_HEALTH_REPORT.md §4`, `TECHNICAL_DEBT.md §4`)
  — no bloquea backend, pero cuanto más se tarde en arreglarlo más
  frontend nuevo se construye sin cobertura de test real (el POS de esta
  parte tampoco tiene cobertura de Vitest, solo verificación manual con
  Playwright — ver `POS_TEST_REPORT.md §4`).
- Docker Desktop estuvo arriba esta sesión por primera vez en 9 sesiones — permitió verificar el
  checkout de POS contra Postgres/Redis/RabbitMQ reales y encontrar los dos bugs de Fase 05
  documentados en `POS_DATABASE.md §5`. Si vuelve a caer, seguir el mismo patrón que las fases
  anteriores (build/lint/unitarios reales, e2e pendiente de reconfirmar).
- Sin e2e-spec de NestJS para POS (`POS_TEST_REPORT.md §5`) — formalizar antes de que el módulo
  crezca (devoluciones, Parte 02) para no depender de verificación manual repetida.
- **Higiene de sesión** (recurrente, no de código): memoria del sistema agotada temporalmente por
  procesos `jest-worker` huérfanos coincidiendo con `git commit`/lint-staged — se resolvió solo una
  vez terminaron los procesos, mismo patrón que sesiones anteriores; verificar
  `tasklist`/`Get-CimInstance Win32_Process` antes de asumir que un comando colgado es un bug de
  código.

## 8. Progreso — porcentajes reales

| Dimensión                                                                                 |                                            Real                                             |
| ----------------------------------------------------------------------------------------- | :-----------------------------------------------------------------------------------------: |
| Módulos de negocio con backend real                                                       |                                      9 / 27 (**33%**)                                       |
| Tablas de `inventory` con código real                                                     |                                      15 / 34 (**44%**)                                      |
| Tablas de `inventory` con arquitectura ya diseñada                                        |                                     34 / 34 (**100%**)                                      |
| Ítems de la lista "primero" de FASE 03 completos                                          |                                     10 / 10 (**100%**)                                      |
| Partes de la Fase 05 (Inventario) completas                                               |                                  4 / 8 (**50%**, pausada)                                   |
| Partes de la Fase 06 (POS) completas                                                      |                                1 / ? (**alcance en curso**)                                 |
| Proyectos Nx nuevos esta parte (`clientes`/`caja`/`ventas`/`pos`-backend, `pos`-frontend) | 5 (build/lint/test verificados individualmente, no en corrida monorepo-wide de esta sesión) |
| Vulnerabilidades de dependencias en runtime de negocio directo                            |                       0 / 39 (**0%** — todas transitivas de tooling)                        |

No se incluye un % de "cobertura de código" real — `coverageThreshold`
sigue en el piso de seguridad (5%, `TECHNICAL_DEBT.md`), no una medida
representativa de cobertura real todavía. Tampoco un % de tests
unitarios pasando consolidado — ver `INVENTORY_TEST_REPORT.md §2` para
los números de esta sesión (todas las fallas de e2e atribuibles a
Docker caído, sin excepción).
