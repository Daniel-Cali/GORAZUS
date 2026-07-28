---
id: database-partition-manager
title: Partition Manager
version: 1.0.0
status: active
owner: Database Architect
domain: database
subdomain: partitioning
created: 2026-07-28
updated: 2026-07-28
tags: [database, partitioning, operations, pattern]
related:
  - '[[ADR-DB-001]]'
  - '[[Partitioning]]'
  - '[[Data Retention]]'
  - '[[Database Maintenance]]'
---

# Purpose

Patrón operativo real diseñado en `ADR-DB-001 §10` — no un servicio nuevo a construir desde cero,
sino la formalización de dos piezas ya reales del sistema (`pg_partman` + `core.scheduled_jobs`)
bajo un contrato explícito de siete responsabilidades. Reutilizable como plantilla para cualquier
componente que orqueste un ciclo de vida automático sobre datos particionados.

# Architecture

Siete responsabilidades, cada una con estado real distinguido de recomendación:

| #   | Responsabilidad                           | Estado                                                                                                                             |
| --- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Crear particiones futuras                 | ✅ Implementado — `pg_partman` `p_premake`, ~1.200 particiones físicas ya creadas sobre 27 tablas declaradas                       |
| 2   | Eliminar particiones vencidas             | 🟡 Mecanismo real, política incompleta — `core.data_retention_policies` existe, sin filas confirmadas para las tablas del catálogo |
| 3   | Archivar datos antiguos                   | ✅ Implementado a nivel de diseño — export a MinIO (`archive-cold`) antes de `DETACH`                                              |
| 4   | Monitorear tamaño de partición            | 🔴 No implementado                                                                                                                 |
| 5   | Validar índices                           | 🟡 Correcto en diseño (propagación nativa de Postgres), sin verificación recurrente                                                |
| 6   | Verificar consistencia (encabezado↔línea) | 🔴 No implementado — relevante porque la relación no tiene FK declarativa (ver `ADR-DB-001 §4.5/§4.9`)                             |
| 7   | Detectar particiones faltantes            | 🔴 No implementado — mitiga el riesgo ya aceptado de fallo silencioso de `pg_partman`                                              |

# Design Decisions

No construir un servicio nuevo aislado — nombrar y dar contrato explícito a la combinación ya real
de `pg_partman` (motor mecánico) + `core.scheduled_jobs`/`scheduled_job_runs` (orquestación de alto
nivel, ya usada por el resto del sistema para trabajos periódicos). Mismo criterio de "reutilizar
antes de construir" que [[Generic Polymorphic Subsystems]].

# Risks

Un fallo silencioso de `pg_partman` **ya ocurrió una vez** en la historia real del proyecto (imagen
base de Postgres sin la extensión, corregida después) — las responsabilidades 4/6/7, todas sin
implementar, son la mitigación directa de que ese tipo de fallo se repita sin que nadie lo note.

# Related ADRs

[[ADR-DB-001]] §10

# References

[ADR-DB-001 §10 (documento real)](../../adr/ADR-DB-001-estrategia-de-particionamiento-de-base-de-datos.md)
