---
id: adr-inv-004-bridge
title: 'ADR-INV-004 — Motor de Costeo de Inventario'
version: 1.0.0
status: proposed
owner: Chief Software Architect
domain: inventory
subdomain: cost-engine
created: 2026-07-28
updated: 2026-07-28
tags: [adr, cost-engine, fifo, lifo, average-cost, landed-cost, bridge]
related:
  - '[[ADR-INV-000]]'
  - '[[ADR-INV-001]]'
  - '[[ADR-INV-002]]'
  - '[[ADR-INV-003]]'
  - '[[ADR-DB-001]]'
  - '[[Cost Engine]]'
  - '[[Product]]'
  - '[[Movement Engine]]'
  - '[[Append-Only Ledger Pattern]]'
  - '[[Engineering Heuristics]]'
---

# Purpose

Nota puente hacia el documento real: [ADR-INV-004 — Motor de Costeo de Inventario](../../../adr/ADR-INV-004-motor-de-costeo-de-inventario.md).
**Estado: Propuesta.** Extiende — no reemplaza — el diseño real de FIFO/Promedio ya documentado en
`19-modulo-inventory.md §10-11` y `docs/ddd/08_domain_services.md §1.1-1.3`, y formaliza la nota ya
existente [[Cost Engine]] (hoy un stub de una sola sección) con los ocho métodos de costeo pedidos.

# Background

Verificado línea por línea contra `core/database/prisma/schemas/inventory/schema.prisma` antes de
diseñar nada: de los ocho métodos de costeo pedidos, solo **tres tienen tabla real** (FIFO, LIFO,
Promedio) y solo **dos tienen diseño algorítmico documentado** (FIFO, Promedio) — LIFO existe como
tabla (`inventory.lifo_cost_layers`) sin ningún documento que lo diseñe, hallazgo confirmado con
`grep` exhaustivo sobre `19-modulo-inventory.md` y el resto de `docs/`.

# Domain Model

Introduce cuatro Aggregate Roots nuevos (`CierrePeriodoDeCosto`, `CargoDeCostoDeImportacion`) sin
modificar los ya reales (`CapaDeCosto`/`HistorialDeCostoPromedio`, mapeados 1:1 a
`fifo_cost_layers`/`lifo_cost_layers`/`average_cost_history`) — mismo criterio de extensión, no
reemplazo, que el resto de la serie `ADR-INV-*`.

# Business Rules

Distingue explícitamente **Revaluación** (capas activas, valor de mercado) de **Ajuste** (mismo
período, error de datos) de **Corrección** (período ya cerrado, nunca reescribe historial — genera
compensación nueva) — la misma disciplina de inmutabilidad ya establecida para
[[Movement Engine]], ahora aplicada al costo.

# Architecture

Reutiliza el [[Append-Only Ledger Pattern]] ya generalizado en Level 3 (`cost_adjustments` propuesta
como tabla particionada `RANGE` mensual, mismo criterio que `audit_logs`). Reutiliza el orden
determinístico de bloqueo ya real de `ADR-INF-001 §4` sin introducir un orden nuevo.

# Risks

Dos hallazgos reales de deuda técnica nueva, sin ticket formal todavía (mismo límite ya respetado de
no editar el [[Issue Register]] de la sesión de Inventario directamente): `remaining_quantity` sin
`CHECK ≤ original_quantity` en `fifo_cost_layers`/`lifo_cost_layers` (severidad Alta — nada impide
hoy que una capa termine sobre-consumida por un error de aplicación); `lifo_cost_layers` sin
`source_receipt_line_id`, a diferencia de su equivalente FIFO (severidad Media — pierde trazabilidad
a la recepción origen). Nota de cumplimiento contable agregada: LIFO está prohibido bajo NIIF/IFRS
(`IAS 2`) — relevante porque `configuration.fiscal_regimes` ya es real y República Dominicana usa
NIIF — se documenta como restricción de aplicación, no de motor.

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-INV-002]] · [[ADR-INV-003]] · [[ADR-DB-001]]

# References

[ADR-INV-004 (documento real, `docs/adr/`)](../../../adr/ADR-INV-004-motor-de-costeo-de-inventario.md)
