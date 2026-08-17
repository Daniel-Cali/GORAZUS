---
id: platform-performance
title: Performance
version: 1.0.0
status: active
owner: Performance Architect
domain: platform
subdomain: performance
created: 2026-07-27
updated: 2026-07-27
tags: [platform, performance]
related:
  - '[[Partitioning]]'
  - '[[Indexes]]'
  - '[[ADR-INF-001]]'
---

# Purpose

Síntesis de rendimiento ya real, consolidada desde `ADR-DB-001`, `database/04`, y `ADR-INF-001 §8`
— sin garantías fabricadas para volúmenes sin datos de carga reales.

# Architecture

- **Particionamiento selectivo** — solo `inventory.stock_movements`/`production_consumptions`
  particionadas `RANGE(created_at)`, mensual — ver [[Partitioning]].
- **Índices** — BRIN para tablas append-only de alto volumen, B-tree compuesto para patrones de
  consulta reales, GIN para `metadata`/texto libre — ver [[Indexes]].
- **Bloqueo** — pesimista (`SELECT FOR UPDATE`) en el camino caliente de `Stock`, real y verificado
  (`stock-lock.util.ts`) — ver [[ADR-INF-001]] §3.
- **Redis** — tres roles reales: cache de lectura, adapter de WebSocket, locks distribuidos
  (`docs/architecture/08-infraestructura-y-despliegue.md §3`).

# Risks

Sin evidencia de carga real más allá de mil millones de filas (particionamiento mensual ya
dimensionado para ese umbral) — diez/cien mil millones requieren reducir el intervalo de partición,
cambio de configuración, no de arquitectura.

# Related ADRs

[[ADR-DB-001]] · [[ADR-INF-001]]
