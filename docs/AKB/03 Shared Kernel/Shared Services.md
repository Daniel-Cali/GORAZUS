---
id: shared-kernel-shared-services
title: Shared Services
version: 1.0.0
status: active
owner: Chief Software Architect
domain: shared-kernel
subdomain: shared-services
created: 2026-07-27
updated: 2026-07-27
tags: [shared-kernel, core]
related:
  - '[[Domain Events]]'
  - '[[Observability]]'
---

# Purpose

Servicios reales de `core/`, consumidos por todo módulo de negocio — no se reimplementan por
módulo.

# Architecture

- **`EventBusService`** (`core/messaging`) — real, RabbitMQ, `publish()`/`subscribe()` completos.
- **`LoggerService`** (`core/logging`) — real, logging estructurado JSON.
- **`Repository Base`** (`32-core-platform/09 §4`) — filtro de tenant inescapable, heredado por
  todo repositorio concreto.
- **Sequence Generator** (`32-core-platform/08 §1`) — numeración exclusiva por serie (Domain Policy
  P5).

# Related ADRs

[[ADR-INV-000]] §13.1

# References

`core/messaging/`, `core/logging/`
