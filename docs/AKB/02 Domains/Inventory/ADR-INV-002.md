---
id: adr-inv-002-bridge
title: 'ADR-INV-002 — Arquitectura de Gestión de Almacenes'
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: inventory
subdomain: warehouse-management
created: 2026-07-27
updated: 2026-07-27
tags: [adr, warehouse, stock, kardex, traceability, bridge]
related:
  - '[[ADR-INV-000]]'
  - '[[ADR-INV-001]]'
  - '[[ADR-DB-001]]'
  - '[[Warehouse]]'
  - '[[Stock]]'
  - '[[Movement Engine]]'
  - '[[Reservation]]'
  - '[[Cost Engine]]'
---

# Purpose

Nota puente hacia el documento real: [ADR-INV-002 — Arquitectura de Gestión de Almacenes](../../../adr/ADR-INV-002-arquitectura-de-gestion-de-almacenes.md).
Subdominio de **ejecución y existencia física** del Bounded Context de Inventario
([[ADR-INV-000]] §3.1) — jerarquía de almacenes, tipos de stock, reglas, visibilidad, trazabilidad
de lote/serie, Kardex y eventos de dominio. El documento más extenso de la serie (835 líneas, 14
secciones).

# Domain Model

[[Warehouse]] → Zona → Ubicación (auto-referenciada). [[Stock]] como saldo actual. [[Movement Engine]]
como fuente de verdad única de todo cambio de cantidad. [[Reservation]] y Transferencia como
agregados reales ya implementados.

# Business Rules

Hallazgo central: `Minimum Stock`/`Reorder Point`/`Safety Stock` están conflados en una sola columna
(`replenishment_rules.min_quantity`) — sin distinción real entre los tres conceptos.

# Architecture

Hallazgo central de trazabilidad (§10): GORAZUS tiene trazabilidad real de **costo** (vía
[[Cost Engine]], `fifo_cost_layers.source_receipt_line_id`) pero no de **unidad física** — ningún
movimiento carga `lot_id`/`serial_id`. El Kardex (§12) es una vista derivada (`v_kardex`), nunca una
tabla — debe ser inmutable por construcción matemática (saldo corrido recalculado en cada consulta).

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-DB-001]]

# References

[ADR-INV-002 (documento real, `docs/adr/`)](../../../adr/ADR-INV-002-arquitectura-de-gestion-de-almacenes.md)
