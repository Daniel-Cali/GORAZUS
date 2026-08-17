---
id: governance-architecture-principles
title: Architecture Principles
version: 1.0.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: principles
created: 2026-07-27
updated: 2026-07-27
tags: [governance, principles]
related:
  - '[[ADR Index]]'
  - '[[Decision Log]]'
---

# Purpose

Principios arquitectónicos ya verificados como reales en GORAZUS, consolidados en un solo lugar —
ninguno es aspiracional, cada uno tiene evidencia citada.

# Architecture

- **Clean Architecture** — capa `entities/` sin decoradores de framework, testeable sin Nest ni base
  de datos (`docs/architecture/02-arquitectura-modulos-backend.md §3`).
- **Hexagonal (Puertos y Adaptadores)** — repositorio = interfaz/puerto (`*.repository.ts`),
  implementación Prisma = adaptador intercambiable, mismo documento §3.
- **DDD** — Bounded Contexts, Aggregates, Entities, Value Objects, Domain Services, Domain Events,
  Repositories ya catalogados en `docs/ddd/01-20`. Regla de tamaño: agregados deliberadamente
  pequeños, para que una eventual extracción a microservicio no parta su consistencia transaccional
  (`ddd/04_aggregates.md §3`).
- **CQRS-ligero, deliberado** — separación `*.usecase.ts` (comandos) vs. `*-query.service.ts`
  (consultas), sin _event sourcing_ — CQRS pleno evaluado como "preparado, no construido"
  (`ddd/20_architecture_summary.md §3.1`).
- **Un módulo dueño único** — ningún dato de un Aggregate Root se escribe fuera de su módulo dueño,
  restricción arquitectónica (fronteras de Nx), no solo de RBAC (Domain Policy P1, `ddd/16 §1`).
- **Consistencia eventual entre contextos, nunca transacción distribuida** (Domain Policy P3).

# Business Rules

**El criterio de gobernanza más importante de todo el proyecto, citado textual**: _"no diseñar
especulativamente sin necesidad de negocio confirmada"_ (`ddd/20_architecture_summary.md §4`) — ya
aplicado explícitamente a Event Sourcing pleno, Shared Kernel sin ADR, y fronteras de ACL sin
necesidad confirmada (Pasarelas de pago, Marketplace). Este mismo criterio gobierna cada ADR de esta
serie: cada capacidad solicitada se marca con su estado real (✅/🟡/🔴) antes de diseñarse en detalle.

# Design Decisions

- Toda tabla de negocio lleva `tenant_id`/`company_id`/`branch_id`, soft delete, auditoría universal
  (`core.audit_logs`, trigger automático sobre 494 tablas), versión técnica (`row_version`).
- Idioma: dominio en español (módulos, entidades, eventos, mensajes de error), técnica en inglés
  (`controller`/`service`/`repository`) — `docs/architecture/07-convenciones-y-estandares.md §2`.

# Related ADRs

[[ADR Index]]

# References

`docs/architecture/02-arquitectura-modulos-backend.md` · `docs/ddd/20_architecture_summary.md` · `docs/ddd/16_domain_policies.md`
