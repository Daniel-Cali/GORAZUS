---
id: database-maintenance
title: Database Maintenance
version: 1.0.0
status: active
owner: Database Architect
domain: database
subdomain: maintenance
created: 2026-07-28
updated: 2026-07-28
tags: [database, maintenance, vacuum, technical-debt]
related:
  - '[[ADR-DB-001]]'
  - '[[Partitioning]]'
  - '[[Partition Manager]]'
  - '[[Indexes]]'
  - '[[Performance]]'
---

# Purpose

Consolida `ADR-DB-001 §12` (VACUUM/ANALYZE/REINDEX/CHECK/autovacuum/monitoreo/fragmentación) con
hallazgos reales ya documentados en `POSTGRESQL_TUNING.md`/`INDEX_REPORT.md`, no textbook genérico.

# Architecture

- **VACUUM/ANALYZE** operan por partición individual — una partición `Warm`/`Cold` inactiva no
  genera costo marginal nuevo; el trabajo real se concentra en la partición `Hot` ([[Data Retention]]).
- **`autovacuum`** confirmado `on` en la instancia real, sin cambio recomendado en el parámetro en
  sí — el ajuste real pendiente es diferenciar agresividad por edad de partición.
- **Índices**: 3.884 `BTree`, 55 `BRIN` (ya aplicados sobre `activity_logs`/`audit_logs`), 9 `GIN`,
  828 parciales, 11 `covering` — ver [[Indexes]]. 0 faltantes/duplicados/innecesarios confirmados.
- **Gap de monitoreo real**: `pg_stat_statements` **no está instalado** — requiere
  `shared_preload_libraries` + reinicio de contenedor, no es activable en caliente
  (`POSTGRESQL_TUNING.md §3`).
- **`random_page_cost = 4`** (default, asume disco mecánico) sobre almacenamiento SSD real — el
  hallazgo más accionable de `POSTGRESQL_TUNING.md §1`; debería ser `1.1`.

# Risks (Technical Debt — descubierto en esta sesión, no en el AKB todavía)

**Hallazgo real verificado contra `docs/database/sql/29_partitioning.sql` y el schema Prisma
certificado**: seis tablas (`core.audit_logs`, `core.system_logs`, `core.activity_logs`,
`core.notification_delivery_logs`, `security.login_attempts`, `security.session_activity_logs`)
tienen ya, en el schema Prisma, la clave primaria compuesta que una tabla particionada necesita
(p. ej. `@@id([id, occurred_at])` en `audit_logs`) — pero su `CREATE TABLE` real en
`01_core.sql`/`02_security.sql` **todavía no declara `PARTITION BY RANGE`**, y ninguna tiene su
llamada `partman.create_parent()` en `29_partitioning.sql §1`. Una clave compuesta es condición
necesaria, no suficiente — si el cluster se aprovisionara desde cero hoy, estas seis tablas se
crearían como tablas regulares, no particionadas, pese a que el resto del sistema (incluido
`ADR-DB-001 §7`) las trata como si ya lo estuvieran. `29_partitioning.sql` ya se autodocumenta este
gap en su propio comentario inicial — no es un hallazgo inventado para este ADR, es una
inconsistencia real ya señalada en el código, sin ticket de corrección formal hasta ahora.

**Recomendación**: crear un ticket de corrección sobre `01_core.sql`/`02_security.sql`/
`29_partitioning.sql` antes del próximo aprovisionamiento de un cluster nuevo. `ADR-DB-001 §14.1/§14.3`
ya contiene el DDL de corrección concreto para `audit_logs` como ejemplo de referencia.

# Related ADRs

[[ADR-DB-001]] §12, §14

# References

[ADR-DB-001 §12/§14 (documento real)](../../adr/ADR-DB-001-estrategia-de-particionamiento-de-base-de-datos.md) ·
`docs/database/POSTGRESQL_TUNING.md` · `docs/database/INDEX_REPORT.md` · `docs/database/sql/29_partitioning.sql`
