---
id: domain-sales
title: Sales
version: 0.1.0
status: active
owner: ERP Domain Expert
domain: sales
subdomain: overview
created: 2026-07-27
updated: 2026-07-27
tags: [domain, sales]
related:
  - '[[Inventory]]'
---

# Purpose

Sin ADR propio todavía — Sales aparece hoy solo como dominio **consumidor** de Inventario
(`stock_reservations`/`goods_issues` vía `source_module='sales'`), sin código de integración real
(`ADR-INV-000 §1.2`).

# Integration

Ver [[ADR-INV-000]] §1.2, [[ADR-INV-002]] §4 ("Automatic reservations", brecha real).

# References

[[Inventory]]
