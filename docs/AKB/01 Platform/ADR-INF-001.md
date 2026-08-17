---
id: adr-inf-001-bridge
title: 'ADR-INF-001 — Estrategia de Concurrencia de Inventario'
version: 1.0.0
status: proposed
owner: Chief Software Architect
domain: infrastructure
subdomain: concurrency
created: 2026-07-27
updated: 2026-07-27
tags: [adr, concurrency, locking, transactions, bridge]
related:
  - '[[ADR-INV-000]]'
  - '[[ADR-INV-002]]'
  - '[[ADR-INV-003]]'
  - '[[ADR-DB-001]]'
  - '[[Movement Engine]]'
  - '[[Stock]]'
  - '[[Issue Register]]'
---

# Purpose

Nota puente hacia el documento real: [ADR-INF-001 — Estrategia de Concurrencia de Inventario](../../adr/ADR-INF-001-estrategia-de-concurrencia-de-inventario.md).
**Estado: Propuesta**. Prefijo `INF` (no `INV`) deliberado — es una decisión de infraestructura
transaccional transversal, con Inventario como primer consumidor obligatorio, no una decisión
exclusiva del dominio.

# Background

Motivado por una brecha real dejada abierta en [[ADR-INV-003]] §8.2: riesgo de _deadlock_ en
Transferencias concurrentes en sentido opuesto, sin orden de bloqueo determinístico.

**Amendado (segunda pasada, mismo día)**: se solicitó de nuevo con el mismo ID — en vez de duplicar,
se comparó sección por sección y se agregaron 3 brechas reales encontradas: fila de "lectura no
repetible" (§1.3), y dos reglas de gobernanza nuevas ("no direct cost updates", "no bypass of lock
hierarchy", §10). El resto del documento no cambió.

# Architecture

Jerarquía oficial de bloqueo: Company → Branch → Warehouse → Location → Product → Lot → Serial →
Stock Record — extiende la jerarquía física ya certificada en [[ADR-INV-002]] §2, no inventa una
nueva. Bloqueo pesimista (`SELECT FOR UPDATE`) confirmado real en código
(`stock-lock.util.ts`) para [[Stock]]; optimista (`row_version`) real como columna universal pero
sin patrón de uso implementado.

# Risks

Ver [[Issue Register]] — este ADR resuelve por diseño ISSUE-08 (deadlock) e ISSUE-11
(aislamiento nunca documentado), y propone diseño sin implementar para ISSUE-07 (idempotencia) e
ISSUE-09 (exclusividad de conteos cíclicos).

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-002]] · [[ADR-INV-003]] · [[ADR-DB-001]]

# References

[ADR-INF-001 (documento real, `docs/adr/`)](../../adr/ADR-INF-001-estrategia-de-concurrencia-de-inventario.md)
