---
id: akb-home
title: GORAZUS Architecture Knowledge Base — Home
version: 2.0.0
status: active
owner: Chief Software Architect
domain: meta
subdomain: knowledge-base
created: 2026-07-27
updated: 2026-07-27
tags: [akb, home, moc]
related: []
---

# Purpose

Punto de entrada del Architecture Knowledge Base (AKB) de GORAZUS ERP Enterprise. Migrado el
2026-07-27 de una taxonomía plana (10 categorías) a la taxonomía jerárquica oficial de 6 categorías
(`00`-`05`).

# Background

El AKB vive en `docs/AKB/` (bóveda de Obsidian separada, dentro del propio repositorio de GORAZUS).
Los ADRs reales permanecen intactos en `docs/adr/` — el AKB no los reescribe, los referencia vía
notas puente.

> [!warning] Límite técnico de los wikilinks
> `docs/adr/` está fuera de esta bóveda — las notas puente usan enlaces relativos de Markdown hacia
> el documento real, y wikilinks normales entre sí y hacia las notas de concepto.

> [!info] Categorías retiradas en esta migración
> La taxonomía anterior tenía `Frontend`, `Testing` y `Documentation` como categorías propias — la
> nueva taxonomía oficial (`00`-`05`) no las incluye. Las tres eran _stubs_ sin contenido real
> (ninguna tenía notas propias más allá de un párrafo señalando qué faltaba por revisar) — se
> retiraron sin pérdida de contenido real. Si se necesitan de nuevo, se recrean como categorías
> nuevas cuando haya contenido real que documentar en ellas.

# Domain Model

## 00 Governance

- [[Architecture Principles]]
- [[ADR Index]]
- [[Issue Register]]
- [[Glossary]]
- [[Decision Log]]
- [[Architecture Review — ADR-DB-001 and ADR-INV-001]] (Second Brain Protocol, Level 2 — primera revisión formal)
- [[Knowledge Evolution Report — 2026-07-28]] (Second Brain Protocol, Level 3 — primer reporte formal)
- [[Enterprise Optimization Report — 2026-07-28]] (Second Brain Protocol, Level 4 — roadmap priorizado, sin proyecciones sin evidencia)
- [[Enterprise Governance Report — 2026-07-28]] (Second Brain Protocol, Level 5 — ciclo de vida de ADR formalizado, registro de riesgos consolidado)

## 01 Platform

- [[Infrastructure]]
- [[Security]]
- [[Performance]]
- [[Observability]]
- [[ADR-INF-001]] (Concurrency)
- [[Idempotency]]
- [[API Standards]]

## 02 Domains

- [[Inventory]] (único dominio con contenido real — 14 notas, incluye [[Dynamic Attribute Engine]])
- [[Sales]] · [[Purchasing]] · [[Accounting]] · [[CRM]] · [[HR]] (sin ADR propio todavía)

## 03 Shared Kernel

- [[Value Objects]]
- [[Domain Events]]
- [[Shared Services]]
- [[Policies]]
- [[Specifications]] (stub, sin revisión profunda)
- [[Generic Polymorphic Subsystems]] · [[Domain Design Heuristics]] (patrones reutilizables extraídos de ADR-INV-001)

## 04 Database

- [[ERD]] (stub) · [[Partitioning]] · [[Indexes]] · [[Replication]] · [[Backup]] (stub) · [[Data Governance]] (stub)
- [[Partition Manager]] · [[Data Retention]] · [[Database Maintenance]] (extraídas de ADR-DB-001 §10-§14)

## 05 Integrations

- [[DGII]] (stub, sin evidencia) · [[Payment Gateways]] (diferido, decisión explícita) · [[Email]] ·
  [[SMS]] (stub) · [[WhatsApp]] · [[AI]]

# Design Decisions

- Plantilla de documento nuevo: [[_templates/Plantilla-Documento-Arquitectura|Plantilla de Documento de Arquitectura]].
- Los ADRs de `docs/adr/` no se migran de formato — el AKB los referencia, no los reescribe.

# Related ADRs

Ver [[ADR Index]] para la lista completa.

# References

- `docs/adr/` — ADRs reales.
- `docs/architecture/`, `docs/database/`, `docs/ddd/` — documentación de diseño existente, parcialmente incorporada.
