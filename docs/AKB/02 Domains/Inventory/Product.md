---
id: concept-product
title: Product
version: 1.0.0
status: accepted
owner: ERP Domain Expert
domain: inventory
subdomain: product-catalog
created: 2026-07-27
updated: 2026-07-27
tags: [concept, product, aggregate-root]
related:
  - '[[ADR-INV-001]]'
  - '[[ADR-INV-000]]'
  - '[[Cost Engine]]'
  - '[[Inventory]]'
---

# Purpose

Responde "¿qué es esto que se compra, se vende, se fabrica o se consume?" — la única definición
autoritativa, referenciada por todo otro dominio, nunca copiada. Detalle completo en [[ADR-INV-001]].

# Domain Model

Aggregate Root del subdominio de identidad ([[ADR-INV-000]] §3.1). `product_type CHECK IN
('good','service','kit','combo','composite')` — cinco mecánicas físicas reales; nueve clasificaciones
de negocio solicitadas se mapean sobre ellas sin ampliar el `CHECK` (patrón de dos capas).

# Business Rules

Declara — nunca posee — la capacidad de rastrear lote/serie (`tracksSerial`/`tracksLot`) y el método
de costeo (`costingMethod`) que ejecuta [[Cost Engine]]. Ciclo de vida de cinco estados
(`draft→active→inactive→discontinued→archived`), diseñado sin lógica de aplicación todavía.

# Integration

Consumido por [[Inventory]] (capacidad, nunca cantidad), por Ventas/Compras (referencia de
identidad/precio), y es el único punto de contacto real de CRM con este Bounded Context — CRM nunca
toca [[Inventory]] directamente.

# Related ADRs

[[ADR-INV-001]] · [[ADR-INV-000]]

# References

[[ADR-INV-001]]
