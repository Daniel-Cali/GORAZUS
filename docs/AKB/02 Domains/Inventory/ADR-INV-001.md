---
id: adr-inv-001-bridge
title: 'ADR-INV-001 — Arquitectura del Catálogo de Productos'
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: inventory
subdomain: product-catalog
created: 2026-07-27
updated: 2026-07-27
tags: [adr, products, catalog, bridge]
related:
  - '[[ADR-INV-000]]'
  - '[[ADR-INV-002]]'
  - '[[Product]]'
  - '[[Cost Engine]]'
---

# Purpose

Nota puente hacia el documento real: [ADR-INV-001 — Arquitectura del Catálogo de Productos](../../../adr/ADR-INV-001-arquitectura-del-catalogo-de-productos.md).
Subdominio de **identidad y capacidad** del Bounded Context de Inventario ([[ADR-INV-000]] §3.1) —
qué es un producto y qué puede hacer, sin poseer nunca una cantidad.

# Domain Model

[[Product]] es la entidad central — `product_type CHECK IN ('good','service','kit','combo','composite')`,
cinco mecánicas físicas reales sobre las que se apoyan nueve clasificaciones de negocio (patrón de
dos capas, reutilizado en [[ADR-INV-002]] §3 para tipos de almacén y en [[ADR-INV-000]] §5 para
Aggregates).

# Business Rules

Ciclo de vida de cinco estados (`draft → active → inactive → discontinued → archived`), diseñado
sobre una columna real (`lifecycle_status`) sin lógica de aplicación todavía.

# Integration

Declara la capacidad de costeo (`costing_method`, FIFO/promedio) que [[Cost Engine]] ejecuta —
`products` no depende de ningún otro dominio, todos los demás dependen de él.

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-002]]

# References

[ADR-INV-001 (documento real, `docs/adr/`)](../../../adr/ADR-INV-001-arquitectura-del-catalogo-de-productos.md)
