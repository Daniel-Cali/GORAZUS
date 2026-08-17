---
id: domain-crm
title: CRM
version: 0.1.0
status: active
owner: ERP Domain Expert
domain: crm
subdomain: overview
created: 2026-07-27
updated: 2026-07-27
tags: [domain, crm]
related:
  - '[[Product]]'
---

# Purpose

Sin ADR propio todavía — **el límite más limpio de todo el AKB**: confirmado por `grep` exhaustivo
que CRM solo referencia `crm_opportunity_lines.product_id` — nunca toca Inventario en absoluto
(`ADR-INV-000 §1.2`). Backend de `crm` no construido todavía
(`core/notifications/notification-center.service.ts`, comentario real citado en esa misma sección).

# Integration

CRM consume [[Product]], nunca Inventory — no debería suscribir ningún evento de Inventario.

# References

[[ADR-INV-000]] §1.2, §3.4
