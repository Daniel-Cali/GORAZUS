---
id: domain-accounting
title: Accounting
version: 0.1.0
status: active
owner: Financial Systems Architect
domain: accounting
subdomain: overview
created: 2026-07-27
updated: 2026-07-27
tags: [domain, accounting]
related:
  - '[[Inventory]]'
  - '[[Cost Engine]]'
---

# Purpose

Sin ADR propio todavía. `GenerarAsientoContable` ya nombrado como Domain Service real
(`docs/ddd/08_domain_services.md §1.5`) — sin integración construida desde Inventario
(`AsientoContableSolicitado`, propuesto en [[ADR-INV-003]] §5).

# Business Rules

Invariante fundamental ya real: suma(Débitos) = suma(Créditos), siempre (`ddd/17_invariants.md` I11).

# Integration

Ver [[ADR-INV-002]] §13.3, [[ADR-INV-003]] §5.

# References

[[Inventory]] · [[Cost Engine]]
