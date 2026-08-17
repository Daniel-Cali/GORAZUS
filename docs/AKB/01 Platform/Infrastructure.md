---
id: platform-infrastructure
title: Infrastructure
version: 1.0.0
status: active
owner: Cloud Architect
domain: platform
subdomain: infrastructure
created: 2026-07-27
updated: 2026-07-27
tags: [platform, infrastructure]
related:
  - '[[Security]]'
  - '[[Performance]]'
  - '[[ADR-INV-000]]'
---

# Purpose

Topología real de despliegue — `docs/architecture/08-infraestructura-y-despliegue.md`, verificado
completo esta sesión.

# Architecture

- **Servicios**: Nginx (proxy único), `api` (NestJS, monolito modular, réplicas en producción),
  `web` (estático), PostgreSQL (schema por módulo), Redis (cache/WebSocket/locks distribuidos),
  RabbitMQ (bus de eventos, exchange `gorazus.eventos`), MinIO (objetos, bucket por módulo).
- **Entornos**: `local` (Docker Compose), `staging`/`production` (Kubernetes) — réplicas de `api`,
  backups automáticos, TLS real solo en `production`.
- **Escalado horizontal**: `api` sí (stateless, JWT sin sesión en memoria). `postgres` no en la fase
  de monolito modular — _"un único primario"_ (cita literal) — la separación por schema ya prepara
  el camino para mover un schema caliente a su propia instancia sin rediseñar el resto.

# Related ADRs

[[ADR-INV-000]] §2 · [[ADR-INF-001]] §8

# References

`docs/architecture/08-infraestructura-y-despliegue.md`
