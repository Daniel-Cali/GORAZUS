---
id: platform-observability
title: Observability
version: 1.0.0
status: active
owner: Chief Software Architect
domain: platform
subdomain: observability
created: 2026-07-27
updated: 2026-07-27
tags: [platform, observability]
related:
  - '[[Security]]'
  - '[[Infrastructure]]'
  - '[[ADR-INF-001]]'
---

# Purpose

Diseño real y extenso, verificado en `docs/architecture/32-core-platform/07-observabilidad-y-gobernanza.md`
— siete componentes documentados, la mayoría "diseño completo ya existente", no propuesta de esta
sesión.

# Architecture

- **Audit Framework** — real, universal, inmutable (trigger `core.fn_audit_log`, 494 tablas).
- **Logging Framework** — JSON estructurado, correlación por `requestId`, destino Loki/Grafana vía
  Promtail. Nunca registra contraseñas/tokens/PII (redacción automática).
- **Exception Framework** — diseño real, referenciado.
- **Health Checks** — único componente marcado "diseño nuevo" en el documento origen.
- **Metrics / Monitoring / Tracing** — diseño completo ya existente, trace ID compartido con Logging.

# Risks

Verificado solo parcialmente en código real de Inventario — `LoggerService` confirmado inyectado en
`event-bus.service.ts` (`core/messaging`), no verificado dentro de `modules/inventario/backend/`
específicamente.

# Related ADRs

[[ADR-INV-000]] §8.3 · [[ADR-INF-001]] §8
