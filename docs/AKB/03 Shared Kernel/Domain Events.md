---
id: shared-kernel-domain-events
title: Domain Events
version: 1.0.0
status: active
owner: Chief Software Architect
domain: shared-kernel
subdomain: domain-events
created: 2026-07-27
updated: 2026-07-27
tags: [shared-kernel, domain-events, event-driven]
related:
  - '[[Shared Services]]'
  - '[[Value Objects]]'
---

# Purpose

Convención real y única de nombrado — español, PascalCase, `routingKey` en `<modulo>.<entidad>.<evento>`
(`docs/ddd/07_domain_events.md`, `docs/architecture/08-infraestructura-y-despliegue.md §4`).

# Architecture

Bus real: RabbitMQ, exchange topic único `gorazus.eventos`, cola durable propia por consumidor
(nunca compartida), dead-letter queue por cola. **Estado real, confirmado por búsqueda exhaustiva**:
existen 3 clases de evento en todo el repositorio (`auth`, `seguridad`, `ventas`) — **ninguna se
publica todavía**. Inventario tiene 12 eventos diseñados y reconciliados
([[ADR-INV-000]] §9.2, [[ADR-INV-003]] §5) sin código de publicación.

# Business Rules

Domain Policy **P2**: publicación solo después del commit. Domain Policy **P3**: consistencia
eventual entre contextos, nunca transacción distribuida.

# Related ADRs

[[ADR-INV-000]] §9 · [[ADR-INV-002]] §13 · [[ADR-INV-003]] §5

# References

`docs/ddd/07_domain_events.md`
