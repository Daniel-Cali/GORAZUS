---
id: database-indexes
title: Indexes
version: 1.0.0
status: active
owner: Database Architect
domain: database
subdomain: indexes
created: 2026-07-27
updated: 2026-07-27
tags: [database, indexes]
related:
  - '[[Partitioning]]'
  - '[[Performance]]'
---

# Purpose

Estrategia real — `docs/database/04-estrategia-indices.md`, verificada completa esta sesión.
Principio general: _"indexar exactamente los patrones de acceso reales... no 'indexar todo'"_.

# Architecture

- **Índice base obligatorio**: `(tenant_id, company_id, branch_id)` parcial (`WHERE deleted_at IS NULL`)
  en toda tabla de negocio.
- **BRIN** para rango de fechas en tablas append-only de gran volumen —
  `inventory.stock_movements(created_at)`, `core.audit_logs(created_at)`.
- **GIN + `pg_trgm`** para búsqueda de texto libre; **GIN `jsonb_path_ops`** para `metadata JSONB`.
- **Únicos parciales** para claves de negocio (SKU, número de comprobante por serie) — la PK `UUID`
  no garantiza unicidad de negocio por sí sola.
- **FK universales hacia `core.users`** (`created_by`/`updated_by`/`deleted_by`) — deliberadamente
  **no** indexadas por defecto (consulta esporádica, no camino caliente).
- Regla de decisión: se indexa una FK cuando existe una consulta real y frecuente — no por la
  presencia de la FK en sí.

# Related ADRs

[[ADR-DB-001]] · [[Partitioning]]

# References

`docs/database/04-estrategia-indices.md`
