---
id: database-data-retention
title: Data Retention (Hot / Warm / Cold)
version: 1.0.0
status: active
owner: Database Architect
domain: database
subdomain: retention
created: 2026-07-28
updated: 2026-07-28
tags: [database, retention, pattern, lifecycle]
related:
  - '[[ADR-DB-001]]'
  - '[[Partitioning]]'
  - '[[Partition Manager]]'
---

# Purpose

Modelo de tres etapas para el ciclo de vida de un dato dentro de una tabla particionada
(`ADR-DB-001 §11`) — no son tres copias del dato ni tres tablas, son tres estados de la misma fila
según su antigüedad y patrón de acceso real.

# Domain Model

- **Hot** — partición del período actual, destino del ~100% de escrituras nuevas, almacenamiento más
  rápido disponible.
- **Warm** — períodos recientes ya cerrados pero dentro de la ventana de consulta operativa habitual
  (reportes comparativos, auditorías recientes) — sigue `ATTACH`ada, candidata a tablespace más
  económico.
- **Cold** — superó la ventana de retención (`core.data_retention_policies`,
  `entity_type`/`retention_period_months`/`action_on_expiry`) — `DETACH` + archivado comprimido a
  MinIO (`archive-cold`), deja de ser consultable en línea.

# Business Rules

La transición Hot→Warm es automática (propiedad de `RANGE`, no una acción). La transición
Warm→Cold la ejecuta el [[Partition Manager]]. **Piso duro no configurable**: datos fiscales/contables
se retienen según el mínimo legal del país de la empresa (`configuration.fiscal_regimes`), nunca
menos — regla ya establecida en `05-estrategia-auditoria.md §6`/`08-estrategia-respaldo.md §4`, no
inventada para este ADR.

# Risks

Los valores numéricos propuestos en `ADR-DB-001 §11.3` (24 meses, 7 años, etc.) son **recomendación
de diseño, no política ya vigente** — ninguna de las tablas del catálogo tiene hoy una fila
confirmada en `core.data_retention_policies`. Ver [[Database Maintenance]] para la brecha de
implementación relacionada.

# Related ADRs

[[ADR-DB-001]] §11

# References

[ADR-DB-001 §11 (documento real)](../../adr/ADR-DB-001-estrategia-de-particionamiento-de-base-de-datos.md)
