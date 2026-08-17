---
id: database-partitioning
title: Partitioning
version: 1.0.0
status: active
owner: Database Architect
domain: database
subdomain: partitioning
created: 2026-07-27
updated: 2026-07-27
tags: [database, partitioning]
related:
  - '[[ADR-DB-001]]'
  - '[[Indexes]]'
  - '[[Movement Engine]]'
---

# Purpose

Estrategia real de particionamiento selectivo — `docs/adr/ADR-DB-001-estrategia-de-particionamiento-de-base-de-datos.md`,
criterio central: se particiona por patrón de crecimiento real (tiempo vs. número de entidades de
negocio), **nunca de forma uniforme**.

# Architecture

- **Particionadas**: `inventory.stock_movements` y `production_consumptions` — `RANGE (created_at)`,
  mensual, con índice `BRIN`. Identificadas como _"el patrón de mayor volumen de escritura del
  sistema"_.
- **No particionadas, deliberadamente**: catálogos maestros (`products.products`,
  `customers.customers`) y tablas de saldo actual (`inventory.stock`) — crecen con el número de
  entidades de negocio, no con el tiempo.

# Related ADRs

[[ADR-DB-001]] · [[Movement Engine]]
