---
id: integrations-ai
title: AI
version: 1.0.0
status: active
owner: Chief Software Architect
domain: integrations
subdomain: ai
created: 2026-07-27
updated: 2026-07-27
tags: [integrations, ai]
related:
  - '[[Policies]]'
---

# Purpose

**Ya preparado, diseñado en `docs/architecture/47-modulo-ia.md`** — no una integración pendiente,
sino un principio arquitectónico ya formalizado como Domain Policy global.

# Business Rules

**Domain Policy P7 — Ninguna IA escribe directamente**: toda salida de un modelo de IA o agente
autónomo es una propuesta que requiere confirmación humana o `Approval Engine`/`Workflow Engine`,
bajo el `Security Context` de quien aprueba, nunca el del sistema o el agente. Política de mayor
severidad de todo el dominio.

# Architecture

Caso más estricto de Anti-Corruption Layer (`docs/ddd/14_anti_corruption_layer.md §2.5`) — cada
predicción o recomendación de IA se traduce, en términos DDD, a un comando que pasa por el mismo
Application Service que usaría un humano, nunca un camino de escritura paralelo. El modelo táctico
de Inventario ya es compatible con esto sin fricción — no requiere piezas nuevas.

# Related ADRs

[[ADR-INV-003]] (Enterprise Quality Review, preparación de IA)

# References

`docs/architecture/47-modulo-ia.md` · `docs/ddd/16_domain_policies.md` P7 · `docs/ddd/14_anti_corruption_layer.md §2.5` · `docs/ddd/20_architecture_summary.md §3.5`
