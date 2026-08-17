---
id: adr-db-001-bridge
title: 'ADR-DB-001 — Estrategia de Particionamiento de Base de Datos'
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: database
subdomain: partitioning
created: 2026-07-27
updated: 2026-07-27
tags: [adr, database, partitioning, bridge]
related:
  - '[[ADR-INV-000]]'
  - '[[ADR-INV-001]]'
  - '[[ADR-INV-002]]'
  - '[[Movement Engine]]'
  - '[[Stock]]'
---

# Purpose

Nota puente hacia el documento real: [ADR-DB-001 — Estrategia de Particionamiento de Base de Datos](../../adr/ADR-DB-001-estrategia-de-particionamiento-de-base-de-datos.md).
Este ADR precede a toda la serie `ADR-INV-*` y establece el criterio que las tres reutilizan.

# Background

Define qué tablas se particionan y por qué, y — con la misma importancia — cuáles **no** se
particionan y por qué no. Criterio central: se particiona por patrón de crecimiento real (tiempo vs.
número de entidades de negocio), nunca de forma uniforme.

# Domain Model

- [[Movement Engine]] (`inventory.stock_movements`) — la tabla de mayor volumen del sistema,
  particionada `RANGE (created_at)`, mensual, con índice `BRIN`.
- [[Stock]] (`inventory.stock`) — explícitamente **no** particionada, crece con `# SKUs × # almacenes`,
  no con el tiempo.

# Design Decisions

Particionamiento selectivo, no uniforme — solo tablas de altísimo volumen transaccional
(`stock_movements`, `production_consumptions`). Catálogos (`warehouses`, `stock`) permanecen simples.

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-INV-002]]

# References

[ADR-DB-001 (documento real, `docs/adr/`)](../../adr/ADR-DB-001-estrategia-de-particionamiento-de-base-de-datos.md)
