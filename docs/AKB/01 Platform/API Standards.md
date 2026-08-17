---
id: platform-api-standards
title: API Standards
version: 1.0.0
status: active
owner: Lead Backend Architect
domain: platform
subdomain: api
created: 2026-07-27
updated: 2026-07-27
tags: [platform, api]
related:
  - '[[Security]]'
  - '[[Idempotency]]'
---

# Purpose

Estándares reales de API — `docs/architecture/07-convenciones-y-estandares.md §4` y
`docs/api/API.md`, ambos verificados completos esta sesión.

# Architecture

- Prefijo versionado `/api/v1/...` — un cambio _breaking_ implica `/api/v2/...` conviviendo con v1.
- Formato de respuesta: `{ "data": {}, "meta": { "page", "pageSize", "total" } }`.
- Formato de error (inspirado en RFC 7807): `{ "error": { "code", "message", "details" } }` —
  `code` es contrato estable, `message` puede cambiar de redacción.
- Paginación offset+limit por defecto (KISS); cursor-based solo para módulos que demuestren
  necesitarlo por volumen real — `MovimientoStock` en `inventario` citado explícitamente como
  ejemplo real en el propio documento de convenciones.
- Autenticación: Bearer JWT salvo endpoints `@Public()`.
- Spec real: `docs/api/openapi.json`, autoexportado al arrancar (`core/kernel/bootstrap.ts`).

# Risks

Sin clave de idempotencia formalizada para comandos de escritura — ver [[Idempotency]].

# Related ADRs

[[ADR-INV-000]] §11.2 · [[ADR-INF-001]]

# References

`docs/architecture/07-convenciones-y-estandares.md` · `docs/api/API.md`
