---
id: issue-register-inventory
title: Issue Register
version: 1.2.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: issue-register
created: 2026-07-27
updated: 2026-07-28
tags: [issue-register, governance, inventory]
related:
  - '[[ADR-INV-000]]'
  - '[[ADR-INV-002]]'
  - '[[ADR-INV-003]]'
  - '[[ADR-INV-004]]'
  - '[[ADR-INV-005]]'
  - '[[ADR-INV-006]]'
  - '[[ADR-INV-008]]'
  - '[[ADR-INF-001]]'
  - '[[Business Rules Matrix — Inventory]]'
---

# Purpose

Registro oficial y **persistido** de issues abiertos sobre el dominio de Inventario — corrige un
error real detectado en esta misma sesión: los issues del cierre de gobernanza de [[ADR-INV-000]] y
de [[ADR-INV-003]] existieron solo como texto de chat, nunca como archivo del AKB, exactamente el
mismo fallo ya corregido una vez con las correcciones de CQRS/Observabilidad
([[ADR-INV-000]] §8.3). Este archivo es la fuente de verdad real desde 2026-07-27.

# Domain Model

| ID           | Título                                                                                                                                                            | Prioridad | Severidad | Dueño              | ADR relacionado                                       | Estado                                                      | Resolución recomendada                                                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------- | ------------------ | ----------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ISSUE-01** | Invariante I4 (Lote XOR Serie) documentada sin implementar                                                                                                        | Alta      | Crítica   | Product            | [[ADR-INV-000]], [[ADR-INV-001]]                      | Abierto                                                     | Corregir `ddd/17_invariants.md` I4 + implementar el `if` real en `Producto` (Opción A+C)                                                                    |
| **ISSUE-02** | Sin RLS de sucursal/almacén                                                                                                                                       | Alta      | Alta      | Security           | [[ADR-INV-002]], [[ADR-INF-001]]                      | Abierto                                                     | Extender `database/06-estrategia-seguridad.md §1` con políticas `branch_isolation`/`warehouse_isolation`                                                    |
| **ISSUE-03** | `AjusteStock` sin fila en tabla de Aggregate Roots §5.2                                                                                                           | Baja      | Menor     | Documentación      | [[ADR-INV-000]]                                       | Abierto                                                     | Agregar fila, mismo criterio que Transfer/Cycle Count                                                                                                       |
| **ISSUE-04** | BR-06 (Domain Policy P12) no cruzada contra brecha de `goods_issues`                                                                                              | Media     | Media     | Inventory Movement | [[ADR-INV-002]]                                       | **Resuelto por diseño**                                     | Cerrado por [[ADR-INV-003]] — P12 es ahora el hilo conductor del ciclo de vida completo de `SolicitudDeMovimiento`                                          |
| **ISSUE-05** | Divergencia Zona/Ubicación (`ddd/04_aggregates.md`) no aplicada al documento origen                                                                               | Baja      | Menor     | Documentación      | [[ADR-INV-000]] §5.2.1                                | Abierto — **requiere autorización** para editar `docs/ddd/` | —                                                                                                                                                           |
| **ISSUE-06** | Divergencia repositorio Stock/Reserva (`ddd/09_repositories.md`) no aplicada al documento origen                                                                  | Baja      | Menor     | Documentación      | [[ADR-INV-000]] §6.1.1                                | Abierto — **requiere autorización** para editar `docs/ddd/` | —                                                                                                                                                           |
| **ISSUE-07** | Sin clave de idempotencia en solicitudes de movimiento                                                                                                            | Alta      | Alta      | Inventory Movement | [[ADR-INV-003]] §2.3, [[ADR-INF-001]] §6/§10          | Abierto — **diseño propuesto, sin implementar**             | `idempotency_key` único parcial por tenant en `goods_receipts`/`SolicitudDeMovimiento`; Domain Policy `P14` propuesta                                       |
| **ISSUE-08** | Riesgo real de deadlock en Transferencias concurrentes en sentido opuesto                                                                                         | Alta      | Alta      | Concurrency        | [[ADR-INV-003]] §8.2, [[ADR-INF-001]] §4              | **Resuelto por diseño**                                     | Orden determinístico de bloqueo (`ADR-INF-001 §4`), Domain Policy `P13` propuesta — pendiente implementación real                                           |
| **ISSUE-09** | Sin exclusividad para Conteos Cíclicos concurrentes sobre la misma zona                                                                                           | Media     | Media     | Inventory Movement | [[ADR-INF-001]] §6                                    | Abierto — **diseño propuesto, sin implementar**             | Advisory Lock por `hashtext(zone_id)`                                                                                                                       |
| **ISSUE-10** | Sin expiración de Reservas (`stock_reservations.expiresAt`)                                                                                                       | Media     | Media     | Reservation        | Auditoría de Reglas de Negocio §8, [[ADR-INF-001]] §6 | Abierto — **diseño propuesto, sin implementar**             | `background_job` periódico de barrido, publica `ReservaLiberada` con motivo "expiración"                                                                    |
| **ISSUE-11** | Nivel de aislamiento de transacción nunca documentado                                                                                                             | Media     | Media     | Database           | [[ADR-INF-001]] §5                                    | **Resuelto por diseño**                                     | `READ COMMITTED` formalizado como default explícito; `REPEATABLE READ` reservado a reconciliación de solo lectura                                           |
| **ISSUE-12** | `row_version` universal sin patrón de concurrencia optimista implementado                                                                                         | Baja      | Menor     | Database           | [[ADR-INF-001]] §3                                    | Abierto — **columna real, patrón sin usar**                 | Implementar check-then-write solo si se confirma necesidad en entidades de baja contención                                                                  |
| **ISSUE-13** | Domain Policies `P13`/`P14` propuestas sin autorización para editar `ddd/16_domain_policies.md`                                                                   | Baja      | Menor     | Governance         | [[ADR-INF-001]] §10                                   | Abierto — **requiere autorización**                         | Mismo tratamiento que ISSUE-05/ISSUE-06                                                                                                                     |
| **ISSUE-14** | `fifo_cost_layers`/`lifo_cost_layers` sin `CHECK (remaining_quantity <= original_quantity)`                                                                       | Alta      | Alta      | Database           | [[ADR-INV-004]] §13.3                                 | Abierto                                                     | `ALTER TABLE ... ADD CONSTRAINT`, sin migración de datos, DDL ya especificado en el ADR                                                                     |
| **ISSUE-15** | `lifo_cost_layers` sin `source_receipt_line_id` — pierde trazabilidad de origen frente a su equivalente FIFO                                                      | Media     | Media     | Database           | [[ADR-INV-004]] §3.2, [[ADR-INV-008]]                 | Abierto                                                     | Agregar la columna, mismo patrón que `fifo_cost_layers`                                                                                                     |
| **ISSUE-16** | Ninguna tabla real de recepción/orden de compra tiene columna de "fecha esperada de llegada" — bloquea `Projected Available` real                                 | Media     | Media     | Inventory          | [[ADR-INV-005]] §3.15                                 | Abierto                                                     | Agregar `expected_date` a `goods_receipts`/`purchase_order_lines` (schema `purchases`, ajeno — requiere coordinación)                                       |
| **ISSUE-17** | `bi.forecasts`/`bi.forecast_models` sin `product_id`/`warehouse_id` — bloquea análisis de patrón de demanda de inventario                                         | Baja      | Baja      | BI                 | [[ADR-INV-006]] §3.7                                  | Abierto                                                     | Columnas nulables sobre tabla ya real, sin ruptura de ningún consumidor existente (verificado: ninguno hoy)                                                 |
| **ISSUE-18** | `stock_movements` sin `lot_id`/`serial_id`/`location_id` — trazabilidad física real es de costo, no de unidad física                                              | Alta      | Alta      | Inventory          | [[ADR-INV-008]] §6.1, [[Movement Engine]]             | Abierto                                                     | Tres columnas nulables, DDL ya especificado — cierra también Recall genealogy sin mecanismo adicional                                                       |
| **ISSUE-19** | `remaining_quantity` en `fifo_cost_layers`/`lifo_cost_layers` es mutable (decrementada in-place) — sin ledger de consumo, no reconstruible en un punto del tiempo | Media     | Media     | Inventory          | [[ADR-INV-008]] §15.3                                 | Abierto                                                     | `fifo_cost_layer_consumptions` (nueva, append-only, particionada) — DDL ya especificado, `remaining_quantity` se conserva sin cambio para el caso operativo |

# Risks

Los issues **Alta/Crítica** sin resolver (ISSUE-01, ISSUE-02, ISSUE-07, ISSUE-08) comparten un patrón:
ninguno bloquea seguir construyendo sobre la arquitectura ya aceptada, pero cualquiera de los cuatro
se vuelve costoso de corregir después de tener datos reales en producción (ISSUE-02: fuga de
aislamiento; ISSUE-07/08: corrupción de datos bajo concurrencia real).

# Future Improvements

Ver la columna "Resolución recomendada" de cada issue abierto — cada uno tiene una recomendación
concreta, no solo la descripción del problema.

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-INV-002]] · [[ADR-INV-003]] · [[ADR-INV-004]] · [[ADR-INV-005]] · [[ADR-INV-006]] · [[ADR-INV-007]] · [[ADR-INV-008]] · [[ADR-INF-001]]

# References

Consolidado desde el cierre de gobernanza de [[ADR-INV-000]] (2026-07-27) y el diseño de
[[ADR-INF-001]] (2026-07-27) — primera vez que este registro existe como archivo real del AKB en
vez de solo texto de conversación.
