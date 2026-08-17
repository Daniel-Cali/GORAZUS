---
id: database-data-governance
title: Data Governance
version: 0.5.0
status: active
owner: Database Architect
domain: database
subdomain: data-governance
created: 2026-07-27
updated: 2026-07-27
tags: [database, data-governance, stub]
related:
  - '[[Security]]'
---

# Purpose

`docs/database/05-estrategia-auditoria.md` (modelo de 4 capas) y `docs/database/11-estrategia-integridad.md`
**no se revisaron en profundidad esta sesión** — referenciados por nombre en
`32-core-platform/07-observabilidad-y-gobernanza.md §1` como el diseño completo del Audit Framework
(_"el componente con mayor riesgo de duplicación real de todo el Core Platform"_, cita literal, no
repetido aquí). Enmascaramiento de datos para entornos no productivos ya confirmado real
(`database/06-estrategia-seguridad.md §5`) — anonimización sintética antes de cualquier dump a
`staging`/`local`.

# References

`docs/database/05-estrategia-auditoria.md` · `docs/database/11-estrategia-integridad.md` —
pendientes de revisión completa.
