---
id: platform-idempotency
title: Idempotency
version: 1.0.0
status: proposed
owner: Chief Software Architect
domain: platform
subdomain: idempotency
created: 2026-07-27
updated: 2026-07-27
tags: [platform, idempotency, concurrency]
related:
  - '[[ADR-INF-001]]'
  - '[[Issue Register]]'
---

# Purpose

**Brecha real, sin implementación** — ni `goods_receipts` ni `SolicitudDeMovimiento` (propuesta)
tienen una clave de idempotencia que impida procesar la misma solicitud dos veces ante un reintento
de red. Formalizada como requisito obligatorio en `ADR-INF-001 §6/§10`, no como recomendación
aislada.

# Business Rules

**Domain Policy P14 (propuesta)**: todo comando de escritura debe ser idempotente — pendiente de
autorización para agregarse a `docs/ddd/16_domain_policies.md`.

# Design Decisions

Recomendación: `idempotency_key TEXT` único parcial por `tenant_id`, mismo patrón que
`numbering_series` (Domain Policy P5) para evitar duplicados.

# Related ADRs

[[ADR-INV-003]] §2.3 · [[ADR-INF-001]] §6, §10

# References

Ver [[Issue Register]] — ISSUE-07.
